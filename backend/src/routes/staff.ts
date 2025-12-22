import { Router } from 'express';
import { SalaryStatus, SalaryAdvanceStatus, ExpenseStatus } from '@prisma/client';
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

const mapProfileRow = (row: any) => ({
  id: String(row.id),
  userId: String(row.user_id),
  name: [row.first_name, row.last_name].filter(Boolean).join(' ').trim(),
  email: row.email ?? null,
  phone: row.phone ?? null,
  staffPosition: row.staff_position ?? null,
  bankName: row.bank_name ?? null,
  accountNumber: row.account_number ?? null,
  nhifNumber: row.nhif_number ?? null,
  nssfNumber: row.nssf_number ?? null,
  basicSalary: Number(row.basic_salary ?? 0),
  hireDate: row.hire_date ? new Date(row.hire_date).toISOString().slice(0, 10) : null,
  createdAt: row.created_at ?? null,
  latestSalary: row.latest_salary_id
    ? {
        id: String(row.latest_salary_id),
        allowances: Number(row.latest_allowances ?? 0),
        nhif: Number(row.latest_nhif ?? 0),
        nssf: Number(row.latest_nssf ?? 0),
        netSalary: Number(row.latest_net_salary ?? 0),
        payDate: row.latest_pay_date,
        status: row.latest_status
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
  const rows = await prisma.$queryRaw<
    any[]
  >`SELECT sp.id,
           sp.user_id,
           sp.staff_position,
           sp.bank_name,
           sp.account_number,
           sp.nhif_number,
           sp.nssf_number,
           sp.basic_salary,
           sp.hire_date,
           sp.created_at,
           u.first_name,
           u.last_name,
           u.email,
           u.phone,
           s.id          AS latest_salary_id,
           s.allowances  AS latest_allowances,
           s.nhif        AS latest_nhif,
           s.nssf        AS latest_nssf,
           s.net_salary  AS latest_net_salary,
           s.pay_date    AS latest_pay_date,
           s.status      AS latest_status
    FROM staff_profiles sp
    JOIN users u ON u.id = sp.user_id
    LEFT JOIN LATERAL (
      SELECT id, allowances, nhif, nssf, net_salary, pay_date, status
      FROM staff_salaries ss
      WHERE ss.staff_profile_id = sp.id
      ORDER BY ss.pay_date DESC NULLS LAST, ss.created_at DESC
      LIMIT 1
    ) s ON TRUE
    ORDER BY u.first_name, u.last_name`;

  res.json(rows.map(mapProfileRow));
});

// Get a single staff profile with salary history
router.get('/profiles/:profileId', authenticate, requirePayrollRead, async (req, res) => {
  const { profileId } = req.params;
  const [profileRow] = await prisma.$queryRaw<
    any[]
  >`SELECT sp.id,
           sp.user_id,
           sp.staff_position,
           sp.bank_name,
           sp.account_number,
           sp.nhif_number,
           sp.nssf_number,
           sp.basic_salary,
           sp.hire_date,
           sp.created_at,
           u.first_name,
           u.last_name,
           u.email,
           u.phone
    FROM staff_profiles sp
    JOIN users u ON u.id = sp.user_id
    WHERE sp.id = ${profileId}`;

  if (!profileRow) {
    return res.status(404).json({ message: 'Staff profile not found' });
  }

  const salaryRows = await prisma.$queryRaw<
    any[]
  >`SELECT id,
           allowances,
           nhif,
           nssf,
           net_salary,
           pay_date,
           status,
           created_at
    FROM staff_salaries
    WHERE staff_profile_id = ${profileId}
    ORDER BY pay_date DESC NULLS LAST, created_at DESC`;

  res.json({
    ...mapProfileRow(profileRow),
    salaryHistory: salaryRows.map((row) => ({
      id: String(row.id),
      allowances: Number(row.allowances ?? 0),
      nhif: Number(row.nhif ?? 0),
      nssf: Number(row.nssf ?? 0),
      netSalary: Number(row.net_salary ?? 0),
      payDate: row.pay_date,
      status: row.status,
      createdAt: row.created_at
    }))
  });
});

// Update core payroll fields on a staff profile
router.put('/profiles/:profileId', authenticate, requirePayrollWrite, async (req, res) => {
  const { profileId } = req.params;
  const { staffPosition, bankName, accountNumber, nhifNumber, nssfNumber, basicSalary } = req.body;

  const updated = await prisma.$executeRaw`
    UPDATE staff_profiles
    SET staff_position = COALESCE(${staffPosition}, staff_position),
        bank_name = COALESCE(${bankName}, bank_name),
        account_number = COALESCE(${accountNumber}, account_number),
        nhif_number = COALESCE(${nhifNumber}, nhif_number),
        nssf_number = COALESCE(${nssfNumber}, nssf_number),
        basic_salary = COALESCE(${basicSalary}::numeric, basic_salary),
        updated_at = NOW()
    WHERE id = ${profileId}`;

  if (!updated) {
    return res.status(404).json({ message: 'Staff profile not found or not updated' });
  }

  const [row] = await prisma.$queryRaw<any[]>`SELECT sp.id,
           sp.user_id,
           sp.staff_position,
           sp.bank_name,
           sp.account_number,
           sp.nhif_number,
           sp.nssf_number,
           sp.basic_salary,
           sp.hire_date,
           sp.created_at,
           u.first_name,
           u.last_name,
           u.email,
           u.phone
    FROM staff_profiles sp
    JOIN users u ON u.id = sp.user_id
    WHERE sp.id = ${profileId}`;

  res.json(mapProfileRow(row));
});

// Record a salary payment for a staff profile and return the created entry
router.post('/profiles/:profileId/pay', authenticate, requirePayrollWrite, async (req, res) => {
  const { profileId } = req.params;
  const { allowances = 0, nhif = 0, nssf = 0, payDate = new Date().toISOString().slice(0, 10), status = 'PENDING' } = req.body;

  // Get base salary to compute net
  const [profile] = await prisma.$queryRaw<any[]>`SELECT basic_salary FROM staff_profiles WHERE id = ${profileId}`;
  if (!profile) {
    return res.status(404).json({ message: 'Staff profile not found' });
  }

  const basicSalary = Number(profile.basic_salary ?? 0);
  const netSalary = basicSalary + Number(allowances || 0) - Number(nhif || 0) - Number(nssf || 0);

  const [inserted] = await prisma.$queryRaw<any[]>`
    INSERT INTO staff_salaries (staff_profile_id, allowances, nhif, nssf, net_salary, pay_date, status)
    VALUES (${profileId}, ${allowances}, ${nhif}, ${nssf}, ${netSalary}, ${payDate}, ${status})
    RETURNING id, staff_profile_id, allowances, nhif, nssf, net_salary, pay_date, status, created_at`;

  res.status(201).json({
    id: String(inserted.id),
    staffProfileId: String(inserted.staff_profile_id),
    allowances: Number(inserted.allowances ?? 0),
    nhif: Number(inserted.nhif ?? 0),
    nssf: Number(inserted.nssf ?? 0),
    netSalary: Number(inserted.net_salary ?? 0),
    payDate: inserted.pay_date,
    status: inserted.status,
    createdAt: inserted.created_at
  });
});

export default router;

