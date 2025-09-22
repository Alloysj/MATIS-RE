import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.get('/all-with-roles', async (_req, res) => {
  const users = await prisma.user.findMany({ include: { role: true } });
  res.json(users);
});

router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  const exists = await prisma.user.findUnique({ where: { email } });
  res.json({ exists: !!exists });
});

router.post('/signup', async (req, res) => {
  const { email, password, firstName, lastName, memberNumber } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      memberNumber,
      passwordHash: hash
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      memberNumber: true,
      status: true,
      createdAt: true
    }
  });
  res.status(201).json(user);
});

router.post('/login', async (req, res) => {
  const body = req.body || {};
  const email = body.email as string | undefined;
  const password = body.password as string | undefined;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.json({ token });
});

router.get('/userDetails', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { role: true } });
  res.json(user);
});

router.post('/support/tickets', authenticate, async (req: AuthRequest, res) => {
  const { subject, message } = req.body;
  const ticket = await prisma.contactMessage.create({
    data: { subject, message, type: 'TECHNICAL' }
  });
  res.status(201).json(ticket);
});

router.get('/:userId', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
});

router.put('/:userId/update', async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.userId }, data: req.body });
  res.json(user);
});

router.post('/:userId/resetPassword', async (req, res) => {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.update({ where: { id: req.params.userId }, data: { passwordHash: hash } });
  res.json({ status: 'ok' });
});

router.delete('/:userId/delete', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.userId } });
  res.status(204).end();
});

router.post('/requestSalaryAdvance', authenticate, async (req: AuthRequest, res) => {
  const { amount, reason } = req.body;
  const advance = await prisma.salaryAdvance.create({
    data: {
      staffId: req.user!.id,
      amount,
      reason,
      status: 'PENDING'
    }
  });
  res.status(201).json(advance);
});

router.post('/:userId/message', async (_req, res) => {
  res.json({ status: 'sent' });
});

export default router;
