import { Router } from 'express';
import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// List all approved users
router.get('/users-approved', async (_req, res) => {
  const users = await prisma.user.findMany({ where: { status: UserStatus.ACTIVE }, include: { role: true } });
  res.json(users);
});

// List users pending approval
router.get('/users-pending-approval', async (_req, res) => {
  const users = await prisma.user.findMany({ where: { status: UserStatus.PENDING }, include: { role: true } });
  res.json(users);
});

// List all users with roles
router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({ include: { role: true } });
  res.json(users);
});

// Approve a user
router.post('/approve-user', async (req, res) => {
  const { userId } = req.body;
  const user = await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE } });
  // Email notification stub
  res.json(user);
});

// Disapprove a user
router.post('/disapprove-user', async (req, res) => {
  const { userId } = req.body;
  const user = await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED } });
  // Notification stub
  res.json(user);
});

export default router;
