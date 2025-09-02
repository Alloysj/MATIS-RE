import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.get('/insurance', async (_req, res) => {
  const policies = await prisma.insurancePolicy.findMany();
  res.json(policies);
});

router.get('/loans', async (_req, res) => {
  const loans = await prisma.loan.findMany();
  res.json(loans);
});

router.get('/payments', async (_req, res) => {
  const payments = await prisma.payment.findMany();
  res.json(payments);
});

router.get('/payments/:payment_id', authenticate, async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.payment_id } });
  if (!payment) return res.status(404).json({ message: 'Not found' });
  res.json(payment);
});

router.get('/userFinance', authenticate, async (_req: AuthRequest, res) => {
  res.json({ eligible: true });
});

router.post('/applyLoan', authenticate, async (req: AuthRequest, res) => {
  const loan = await prisma.loan.create({ data: { ...req.body, applicantId: req.user!.id, status: 'PENDING' } });
  res.status(201).json(loan);
});

router.post('/approveLoan', async (req, res) => {
  const { loanId } = req.body;
  const loan = await prisma.loan.update({ where: { id: loanId }, data: { status: 'APPROVED' } });
  res.json(loan);
});

router.get('/pendingLoans', authenticate, async (req: AuthRequest, res) => {
  const loans = await prisma.loan.findMany({ where: { status: 'PENDING', applicantId: req.user!.id } });
  res.json(loans);
});

router.get('/allPendingLoans', async (_req, res) => {
  const loans = await prisma.loan.findMany({ where: { status: 'PENDING' } });
  res.json(loans);
});

router.get('/loans/total', authenticate, async (req: AuthRequest, res) => {
  const loans = await prisma.loan.aggregate({
    _sum: { amount: true },
    where: { applicantId: req.user!.id, status: { not: 'REPAID' } }
  });
  res.json({ total: loans._sum.amount || 0 });
});

router.get('/savings/total', authenticate, async (req: AuthRequest, res) => {
  const savings = await prisma.savingsAccount.aggregate({
    _sum: { balance: true },
    where: { userId: req.user!.id }
  });
  res.json({ total: savings._sum?.balance || 0 });
});

router.get('/payment/latest', authenticate, async (req: AuthRequest, res) => {
  const payment = await prisma.payment.findFirst({
    where: { userId: req.user!.id },
    orderBy: { paymentDate: 'desc' }
  });
  res.json(payment);
});

router.post('/payments/shareholder', authenticate, async (req: AuthRequest, res) => {
  const payment = await prisma.capitalPayment.create({ data: { ...req.body, userId: req.user!.id } });
  res.status(201).json(payment);
});

router.post('/processPayment', authenticate, async (_req, res) => {
  res.json({ status: 'processing' });
});

router.post('/mpesaCallback', async (_req, res) => {
  res.json({ status: 'received' });
});

router.get('/checkPaymentStatus', async (_req, res) => {
  res.json({ status: 'pending' });
});

export default router;
