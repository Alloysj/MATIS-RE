import { Router } from 'express';
import { SalaryStatus, SalaryAdvanceStatus, ExpenseStatus } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../prismaClient';
const router = Router();

// Return authenticated staff member's name and position
router.get('/details', authenticate, async (req: AuthRequest, res) => {
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
router.post('/details/modify', authenticate, async (req: AuthRequest, res) => {
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
router.get('/details/user', authenticate, async (req: AuthRequest, res) => {
  const details = await prisma.staffSalary.findFirst({
    where: { staffId: req.user!.id },
    include: { staff: true }
  });
  res.json(details);
});

// Get assigned company position for logged-in staff
router.get('/position', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { profileCategory: true }
  });
  res.json({ position: user?.profileCategory });
});

// View all salary advance requests (admin)
router.get('/salary-advance-applications', async (_req, res) => {
  const advances = await prisma.salaryAdvance.findMany();
  res.json(advances);
});

// Fetch profiles for all staff members (admin)
router.get('/all-details', async (_req, res) => {
  const details = await prisma.staffSalary.findMany({ include: { staff: true } });
  res.json(details);
});

// Update existing staff profile details
router.put('/details/update', authenticate, async (req: AuthRequest, res) => {
  const { bankName, accountNumber } = req.body;
  const result = await prisma.staffSalary.updateMany({
    where: { staffId: req.user!.id },
    data: { bankName, accountNumber }
  });
  res.json({ updated: result.count });
});

// Fetch logged-in staff member's monthly salary
router.get('/salary', authenticate, async (req: AuthRequest, res) => {
  const salary = await prisma.staffSalary.findFirst({
    where: { staffId: req.user!.id },
    select: { basicSalary: true, netSalary: true }
  });
  res.json(salary);
});

// Submit an expense application / salary advance request
router.post('/apply-advance', authenticate, async (req: AuthRequest, res) => {
  const { amount, reason } = req.body;
  const advance = await prisma.salaryAdvance.create({
    data: { staffId: req.user!.id, amount, reason }
  });
  res.status(201).json(advance);
});

// Retrieve expenses filed by the logged-in staff member
router.post('/expenses', authenticate, async (req: AuthRequest, res) => {
  const expenses = await prisma.expense.findMany({
    where: { createdById: req.user!.id }
  });
  res.json(expenses);
});

// List salary and other office expenses (admin)
router.get('/all-expenses', async (_req, res) => {
  const expenses = await prisma.expense.findMany();
  res.json(expenses);
});

// Verify whether the user has a pending salary advance in the current month
router.get('/checkSalaryAdvance', authenticate, async (req: AuthRequest, res) => {
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
router.post('/pay-salary', async (req, res) => {
  const { staffId, basicSalary, netSalary, ...rest } = req.body;
  const salary = await prisma.staffSalary.create({
    data: { staffId, basicSalary, netSalary, status: SalaryStatus.PAID, ...rest }
  });
  res.status(201).json(salary);
});

// Generate or retrieve monthly payslips after salary processing
router.get('/payslips/:userId', async (req, res) => {
  const slips = await prisma.staffSalary.findMany({
    where: { staffId: req.params.userId },
    orderBy: { payDate: 'desc' }
  });
  res.json(slips);
});

// Record daily wage payments for non-salaried workers
router.post('/wages/pay', authenticate, async (req: AuthRequest, res) => {
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
router.post('/office-expenses', authenticate, async (req: AuthRequest, res) => {
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
router.post('/advance/approve', authenticate, async (req: AuthRequest, res) => {
  const { advanceId, status } = req.body;
  const advance = await prisma.salaryAdvance.update({
    where: { id: advanceId },
    data: { status, approvedById: req.user!.id, approvedAt: new Date() }
  });
  res.json(advance);
});

// Staff view of approval status for a specific salary-advance request
router.get('/advance/status', authenticate, async (req: AuthRequest, res) => {
  const { requestId } = req.query;
  const advance = await prisma.salaryAdvance.findUnique({
    where: { id: String(requestId) },
    select: { status: true }
  });
  res.json({ status: advance?.status });
});

// Admin endpoint to assign or change a staff member's position
router.post('/assign-position', authenticate, async (req: AuthRequest, res) => {
  const { userId, position } = req.body;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profileCategory: position }
  });
  res.json(user);
});

// Display NHIF deduction status for the current month
router.get('/nhif-status', authenticate, async (req: AuthRequest, res) => {
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
router.get('/reports/financial', authenticate, async (_req, res) => {
  const [salaries, advances, expenses] = await Promise.all([
    prisma.staffSalary.findMany(),
    prisma.salaryAdvance.findMany(),
    prisma.expense.findMany()
  ]);
  res.json({ salaries, advances, expenses });
});

export default router;

