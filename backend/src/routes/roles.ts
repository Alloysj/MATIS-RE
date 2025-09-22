import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// List all roles
router.get('/', async (_req, res) => {
  const roles = await prisma.role.findMany();
  res.json(roles);
});

// Get roles for specified users
router.post('/user-roles', async (req, res) => {
  const { userIds = [] } = req.body as { userIds?: string[] };
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, include: { role: true } });
  res.json(users.map(u => ({ userId: u.id, role: u.role })));
});

// Assign a role to a user
router.post('/:userId/assignRole', async (req, res) => {
  const { roleId } = req.body;
  const { userId } = req.params;
  const user = await prisma.user.update({ where: { id: userId }, data: { roleId } });
  res.json(user);
});

// Remove a role from a user (must leave at least one)
router.delete('/:userId/:roleId', async (req, res) => {
  const { userId, roleId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.roleId !== roleId) {
    return res.status(404).json({ message: 'Role assignment not found' });
  }
  return res.status(400).json({ message: 'User must have at least one role' });
});

export default router;
