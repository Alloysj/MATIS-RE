import { Router } from 'express';
import { SalaryStatus, SalaryAdvanceStatus, ExpenseStatus, UserType } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireOwnership, requirePermission } from '../middleware/rbac';
import prisma from '../prismaClient';
const router = Router();

const requireStaffRead = requirePermission('STAFF:READ');
const requireStaffWrite = requirePermission('STAFF:WRITE');
const requirePayrollRead = requirePermission('PAYROLL:READ');
const requirePayrollWrite = requirePermission('PAYROLL:WRITE');
const requirePayrollApprove = requirePermission('PAYROLL:APPROVE');
const requireExpensesRead = requirePermission('EXPENSES:READ');
const requireExpensesWrite = requirePermission('EXPENSES:WRITE');
const requireFinanceView = requirePermission('FINANCE:VIEW');

type StaffProfilePayload = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  staffPosition: string | null;
  bankName: string | null;
  accountNumber: string | null;
  nhifNumber: string | null;
  nssfNumber: string | null;
  basicSalary: number;
  hireDate: string | null;
  createdAt: Date | null;
  latestSalary: {
    id: string;
    allowances: number;
    nhif: number;
    nssf: number;
    netSalary: number;
    payDate: Date | null;
    status: string;
  } | null;
};

const mapProfile = (payload: StaffProfilePayload) => ({
  id: payload.id,
  userId: payload.userId,
  name: payload.name,
  email: payload.email,
  phone: payload.phone,
  staffPosition: payload.staffPosition,
  bankName: payload.bankName,
  accountNumber: payload.accountNumber,
  nhifNumber: payload.nhifNumber,
  nssfNumber: payload.nssfNumber,
  basicSalary: payload.basicSalary,
  hireDate: payload.hireDate,
  createdAt: payload.createdAt,
  latestSalary: payload.latestSalary
    ? {
        id: payload.latestSalary.id,
        allowances: payload.latestSalary.allowances,
        nhif: payload.latestSalary.nhif,
        nssf: payload.latestSalary.nssf,
        netSalary: payload.latestSalary.netSalary,
        payDate: payload.latestSalary.payDate,
        status: payload.latestSalary.status
      }
    : null
});

// Return authenticated staff member's name and position
router.get('/details', authenticate, requireStaffRead, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { firstName: true, lastName: true, profileCategory: true }
  });
  res.json({
    name: user ? `${user.firstName} ${user.lastName}` : null,
    position: user?.profileCategory || null
  });
});

// Save or update staff banking and identification details
router.post('/details/modify', authenticate, requireStaffWrite, async (req: AuthRequest, res) => {
  const { bankName, accountNumber, kra, nhif, passportPhoto } = req.body;
  const existing = await prisma.staffSalary.findFirst({ where: { staffId: req.user!.id } });
  let record;
  if (existing) {
    record = await prisma.staffSalary.update({
      where: { id: existing.id },
      data: { bankName, accountNumber }
    });
  } else {
    record = await prisma.staffSalary.create({
      data: { staffId: req.user!.id, basicSalary: 0, netSalary: 0, bankName, accountNumber }
    });
  }
  res.json({ ...record, kra, nhif, passportPhoto });
});

// Retrieve full staff profile for logged-in user
router.get('/details/user', authenticate, requireStaffRead, async (req: AuthRequest, res) => {
  const details = await prisma.staffSalary.findFirst({
    where: { staffId: req.user!.id },
    include: { staff: true }
  });
  res.json(details);
});

// Get assigned company position for logged-in staff
router.get('/position', authenticate, requireStaffRead, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { profileCategory: true }
  });
  res.json({ position: user?.profileCategory });
});

// View all salary advance requests (admin)
router.get('/salary-advance-applications', authenticate, requirePayrollRead, async (_req, res) => {
  const advances = await prisma.salaryAdvance.findMany();
  res.json(advances);
});

// Fetch profiles for all staff members (admin)
router.get('/all-details', authenticate, requirePayrollRead, async (_req, res) => {
  const details = await prisma.staffSalary.findMany({ include: { staff: true } });
  res.json(details);
});

// Update existing staff profile details
router.put('/details/update', authenticate, requireStaffWrite, async (req: AuthRequest, res) => {
  const { bankName, accountNumber } = req.body;
  const result = await prisma.staffSalary.updateMany({
    where: { staffId: req.user!.id },
    data: { bankName, accountNumber }
  });
  res.json({ updated: result.count });
});

// Fetch logged-in staff member's monthly salary
router.get('/salary', authenticate, requirePayrollRead, async (req: AuthRequest, res) => {
  const salary = await prisma.staffSalary.findFirst({
    where: { staffId: req.user!.id },
    select: { basicSalary: true, netSalary: true }
  });
  res.json(salary);
});

// Submit an expense application / salary advance request
router.post('/apply-advance', authenticate, requirePayrollWrite, async (req: AuthRequest, res) => {
  const { amount, reason } = req.body;
  const advance = await prisma.salaryAdvance.create({
    data: { staffId: req.user!.id, amount, reason }
  });
  res.status(201).json(advance);
});

// Retrieve expenses filed by the logged-in staff member
router.post('/expenses', authenticate, requireExpensesRead, async (req: AuthRequest, res) => {
  const expenses = await prisma.expense.findMany({
    where: { createdById: req.user!.id }
  });
  res.json(expenses);
});

// List salary and other office expenses (admin)
router.get('/all-expenses', authenticate, requireExpensesRead, async (_req, res) => {
  const expenses = await prisma.expense.findMany();
  res.json(expenses);
});

// Verify whether the user has a pending salary advance in the current month
router.get('/checkSalaryAdvance', authenticate, requirePayrollRead, async (req: AuthRequest, res) => {
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const existing = await prisma.salaryAdvance.findFirst({
    where: {
      staffId: req.user!.id,
      status: SalaryAdvanceStatus.PENDING,
      applicationDate: { gte: start, lt: end }
    }
  });
  res.json({ hasPending: !!existing });
});

// Record salary payments and generate a receipt (admin)
router.post('/pay-salary', authenticate, requirePayrollWrite, async (req, res) => {
  const { staffId, basicSalary, netSalary, ...rest } = req.body;
  const salary = await prisma.staffSalary.create({
    data: { staffId, basicSalary, netSalary, status: SalaryStatus.PAID, ...rest }
  });
  res.status(201).json(salary);
});

// Generate or retrieve monthly payslips after salary processing
router.get(
  '/payslips/:userId',
  authenticate,
  requireOwnership({ resourceType: 'user', paramIdField: 'userId', allowPermissions: ['PAYROLL:READ'] }),
  async (req, res) => {
  const slips = await prisma.staffSalary.findMany({
    where: { staffId: req.params.userId },
    orderBy: { payDate: 'desc' }
  });
  res.json(slips);
});

// Record daily wage payments for non-salaried workers
router.post('/wages/pay', authenticate, requirePayrollWrite, async (req: AuthRequest, res) => {
  const { description, amount, userId } = req.body;
  const wage = await prisma.expense.create({
    data: {
      category: 'WAGE',
      description,
      amount,
      vendor: userId,
      status: ExpenseStatus.APPROVED,
      createdById: req.user!.id
    }
  });
  res.status(201).json(wage);
});

// Log general office expenses (rent, utilities, etc.)
router.post('/office-expenses', authenticate, requireExpensesWrite, async (req: AuthRequest, res) => {
  const { category, description, amount, vendor } = req.body;
  const expense = await prisma.expense.create({
    data: {
      category: category || 'OFFICE',
      description,
      amount,
      vendor,
      createdById: req.user!.id
    }
  });
  res.status(201).json(expense);
});

// Endpoint for admin to approve or decline salary-advance requests
router.post('/advance/approve', authenticate, requirePayrollApprove, async (req: AuthRequest, res) => {
  const { advanceId, status } = req.body;
  const advance = await prisma.salaryAdvance.update({
    where: { id: advanceId },
    data: { status, approvedById: req.user!.id, approvedAt: new Date() }
  });
  res.json(advance);
});

// Staff view of approval status for a specific salary-advance request
router.get('/advance/status', authenticate, requirePayrollRead, async (req: AuthRequest, res) => {
  const { requestId } = req.query;
  const advance = await prisma.salaryAdvance.findUnique({
    where: { id: String(requestId) },
    select: { status: true }
  });
  res.json({ status: advance?.status });
});

// Admin endpoint to assign or change a staff member's position
router.post('/assign-position', authenticate, requireStaffWrite, async (req: AuthRequest, res) => {
  const { userId, position } = req.body;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profileCategory: position }
  });
  res.json(user);
});

// Display NHIF deduction status for the current month
router.get('/nhif-status', authenticate, requirePayrollRead, async (req: AuthRequest, res) => {
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setMonth(end.getMonth() + 1);
  const salary = await prisma.staffSalary.findFirst({
    where: { staffId: req.user!.id, payDate: { gte: start, lt: end } },
    select: { nhif: true }
  });
  res.json({ deducted: !!(salary?.nhif && Number(salary.nhif) > 0) });
});

// Produce staff-oriented financial reports (salaries, deductions, advances)
router.get('/reports/financial', authenticate, requireFinanceView, async (_req, res) => {
  const [salaries, advances, expenses] = await Promise.all([
    prisma.staffSalary.findMany(),
    prisma.salaryAdvance.findMany(),
    prisma.expense.findMany()
  ]);
  res.json({ salaries, advances, expenses });
});

// ---- New payroll/profile endpoints aligned to staff_profiles + staff_salaries ----

// List staff profiles with latest salary entry (admin use)
router.get('/profiles', authenticate, requirePayrollRead, async (_req, res) => {
  const staffUsers = await prisma.user.findMany({
    where: { userType: UserType.STAFF },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileCategory: true,
      registrationDate: true,
      createdAt: true
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
  });

  const staffIds = staffUsers.map((user) => user.id);
  const salaryRows = staffIds.length
    ? await prisma.staffSalary.findMany({
        where: { staffId: { in: staffIds } },
        orderBy: [{ payDate: 'desc' }, { createdAt: 'desc' }]
      })
    : [];

  const latestPayByStaff = new Map<string, typeof salaryRows[number]>();
  const profileByStaff = new Map<string, typeof salaryRows[number]>();
  salaryRows.forEach((row) => {
    if (row.payDate && !latestPayByStaff.has(row.staffId)) {
      latestPayByStaff.set(row.staffId, row);
    }
    if (!row.payDate && !profileByStaff.has(row.staffId)) {
      profileByStaff.set(row.staffId, row);
    }
  });

  const result = staffUsers.map((user) => {
    const profileRecord = profileByStaff.get(user.id) ?? latestPayByStaff.get(user.id) ?? null;
    const latestPay = latestPayByStaff.get(user.id) ?? null;
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return mapProfile({
      id: user.id,
      userId: user.id,
      name,
      email: user.email ?? null,
      phone: user.phone ?? null,
      staffPosition: user.profileCategory ?? null,
      bankName: profileRecord?.bankName ?? null,
      accountNumber: profileRecord?.accountNumber ?? null,
      nhifNumber: null,
      nssfNumber: null,
      basicSalary: Number(profileRecord?.basicSalary ?? 0),
      hireDate: user.registrationDate ? user.registrationDate.toISOString().slice(0, 10) : null,
      createdAt: user.createdAt ?? null,
      latestSalary: latestPay
        ? {
            id: String(latestPay.id),
            allowances: Number(latestPay.allowances ?? 0),
            nhif: Number(latestPay.nhif ?? 0),
            nssf: Number(latestPay.nssf ?? 0),
            netSalary: Number(latestPay.netSalary ?? 0),
            payDate: latestPay.payDate ?? null,
            status: latestPay.status
          }
        : null
    });
  });

  res.json(result);
});

// Get a single staff profile with salary history
router.get('/profiles/:profileId', authenticate, requirePayrollRead, async (req, res) => {
  const { profileId } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileCategory: true,
      registrationDate: true,
      createdAt: true
    }
  });

  if (!user) {
    return res.status(404).json({ message: 'Staff profile not found' });
  }

  const salaryRows = await prisma.staffSalary.findMany({
    where: { staffId: profileId },
    orderBy: [{ payDate: 'desc' }, { createdAt: 'desc' }]
  });

  const profileRecord = salaryRows.find((row) => !row.payDate) ?? salaryRows[0] ?? null;
  const latestPay = salaryRows.find((row) => row.payDate) ?? null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  res.json({
    ...mapProfile({
      id: user.id,
      userId: user.id,
      name,
      email: user.email ?? null,
      phone: user.phone ?? null,
      staffPosition: user.profileCategory ?? null,
      bankName: profileRecord?.bankName ?? null,
      accountNumber: profileRecord?.accountNumber ?? null,
      nhifNumber: null,
      nssfNumber: null,
      basicSalary: Number(profileRecord?.basicSalary ?? 0),
      hireDate: user.registrationDate ? user.registrationDate.toISOString().slice(0, 10) : null,
      createdAt: user.createdAt ?? null,
      latestSalary: latestPay
        ? {
            id: String(latestPay.id),
            allowances: Number(latestPay.allowances ?? 0),
            nhif: Number(latestPay.nhif ?? 0),
            nssf: Number(latestPay.nssf ?? 0),
            netSalary: Number(latestPay.netSalary ?? 0),
            payDate: latestPay.payDate ?? null,
            status: latestPay.status
          }
        : null
    }),
    salaryHistory: salaryRows.map((row) => ({
      id: String(row.id),
      allowances: Number(row.allowances ?? 0),
      nhif: Number(row.nhif ?? 0),
      nssf: Number(row.nssf ?? 0),
      netSalary: Number(row.netSalary ?? 0),
      payDate: row.payDate ?? null,
      status: row.status,
      createdAt: row.createdAt
    }))
  });
});

// Update core payroll fields on a staff profile
router.put('/profiles/:profileId', authenticate, requirePayrollWrite, async (req, res) => {
  const { profileId } = req.params;
  const { staffPosition, bankName, accountNumber, nhifNumber, nssfNumber, basicSalary } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: profileId },
    select: { id: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'Staff profile not found or not updated' });
  }

  if (staffPosition) {
    await prisma.user.update({
      where: { id: profileId },
      data: { profileCategory: staffPosition }
    });
  }

  const profileRecord = await prisma.staffSalary.findFirst({
    where: { staffId: profileId, payDate: null },
    orderBy: { createdAt: 'desc' }
  });

  const salaryBase = Number(basicSalary ?? profileRecord?.basicSalary ?? 0);
  const profilePayload = {
    basicSalary: salaryBase,
    netSalary: salaryBase,
    bankName: bankName ?? profileRecord?.bankName ?? null,
    accountNumber: accountNumber ?? profileRecord?.accountNumber ?? null
  };

  if (profileRecord) {
    await prisma.staffSalary.update({
      where: { id: profileRecord.id },
      data: profilePayload
    });
  } else {
    await prisma.staffSalary.create({
      data: {
        staffId: profileId,
        basicSalary: salaryBase,
        netSalary: salaryBase,
        bankName: profilePayload.bankName,
        accountNumber: profilePayload.accountNumber,
        status: SalaryStatus.PENDING
      }
    });
  }

  const refreshedUser = await prisma.user.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileCategory: true,
      registrationDate: true,
      createdAt: true
    }
  });

  if (!refreshedUser) {
    return res.status(404).json({ message: 'Staff profile not found or not updated' });
  }

  const salaryRows = await prisma.staffSalary.findMany({
    where: { staffId: profileId },
    orderBy: [{ payDate: 'desc' }, { createdAt: 'desc' }]
  });

  const updatedProfile = salaryRows.find((row) => !row.payDate) ?? salaryRows[0] ?? null;
  const latestPay = salaryRows.find((row) => row.payDate) ?? null;
  const name = [refreshedUser.firstName, refreshedUser.lastName].filter(Boolean).join(' ').trim();

  res.json(mapProfile({
    id: refreshedUser.id,
    userId: refreshedUser.id,
    name,
    email: refreshedUser.email ?? null,
    phone: refreshedUser.phone ?? null,
    staffPosition: refreshedUser.profileCategory ?? null,
    bankName: updatedProfile?.bankName ?? null,
    accountNumber: updatedProfile?.accountNumber ?? null,
    nhifNumber: null,
    nssfNumber: null,
    basicSalary: Number(updatedProfile?.basicSalary ?? 0),
    hireDate: refreshedUser.registrationDate ? refreshedUser.registrationDate.toISOString().slice(0, 10) : null,
    createdAt: refreshedUser.createdAt ?? null,
    latestSalary: latestPay
      ? {
          id: String(latestPay.id),
          allowances: Number(latestPay.allowances ?? 0),
          nhif: Number(latestPay.nhif ?? 0),
          nssf: Number(latestPay.nssf ?? 0),
          netSalary: Number(latestPay.netSalary ?? 0),
          payDate: latestPay.payDate ?? null,
          status: latestPay.status
        }
      : null
  }));
});

// Record a salary payment for a staff profile and return the created entry
router.post('/profiles/:profileId/pay', authenticate, requirePayrollWrite, async (req, res) => {
  const { profileId } = req.params;
  const { allowances = 0, nhif = 0, nssf = 0, payDate = new Date().toISOString().slice(0, 10), status = 'PENDING' } = req.body;

  let profileSalary = await prisma.staffSalary.findFirst({
    where: { staffId: profileId },
    orderBy: { createdAt: 'desc' }
  });

  if (!profileSalary) {
    const userExists = await prisma.user.findUnique({
      where: { id: profileId },
      select: { id: true }
    });
    if (!userExists) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }
    profileSalary = await prisma.staffSalary.create({
      data: {
        staffId: profileId,
        basicSalary: 0,
        netSalary: 0,
        status: SalaryStatus.PENDING
      }
    });
  }

  const basicSalary = Number(profileSalary.basicSalary ?? 0);
  const netSalary = basicSalary + Number(allowances || 0) - Number(nhif || 0) - Number(nssf || 0);

  const parsedPayDate = payDate ? new Date(payDate) : new Date();
  const safePayDate = Number.isNaN(parsedPayDate.getTime()) ? new Date() : parsedPayDate;
  const inserted = await prisma.staffSalary.create({
    data: {
      staffId: profileId,
      basicSalary,
      allowances,
      nhif,
      nssf,
      netSalary,
      payDate: safePayDate,
      status
    }
  });

  res.status(201).json({
    id: String(inserted.id),
    staffProfileId: String(inserted.staffId),
    allowances: Number(inserted.allowances ?? 0),
    nhif: Number(inserted.nhif ?? 0),
    nssf: Number(inserted.nssf ?? 0),
    netSalary: Number(inserted.netSalary ?? 0),
    payDate: inserted.payDate,
    status: inserted.status,
    createdAt: inserted.createdAt
  });
});

export default router;

