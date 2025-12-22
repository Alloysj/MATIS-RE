import { Router } from 'express';
import { UserType } from '@prisma/client';
import prisma from '../prismaClient';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
const router = Router();

const requireRbacAdmin = requirePermission('ADMIN:RBAC');
const inferUserTypeFromRole = (roleName: string): UserType => {
  const normalized = roleName.trim().toUpperCase();
  if (normalized === 'ADMIN') return UserType.ADMIN;
  if (normalized.includes('STAFF')) return UserType.STAFF;
  return UserType.USER;
};

// List all roles
router.get('/', authenticate, requireRbacAdmin, async (_req, res) => {
  const roles = await prisma.role.findMany();
  res.json(roles);
});

// Get roles for specified users
router.post('/user-roles', authenticate, requireRbacAdmin, async (req, res) => {
  const { userIds = [] } = req.body as { userIds?: string[] };
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { role: true, roles: { include: { role: true } } }
  });
  res.json(users.map(u => {
    const roles = u.roles.map(entry => entry.role).filter(Boolean);
    const primaryRole = u.role ?? roles[0] ?? null;
    return { userId: u.id, role: primaryRole, roles };
  }));
});

// Assign a role to a user
router.post('/:userId/assignRole', authenticate, requireRbacAdmin, async (req, res) => {
  const { roleId } = req.body;
  const { userId } = req.params;

  const assignment = await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: {},
    create: { userId, roleId }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, roles: { include: { role: true } } }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.roleId) {
    await prisma.user.update({ where: { id: userId }, data: { roleId } });
  }
  if (user.userType == null) {
    const assignedRole = user.roles.find(entry => entry.roleId === roleId)?.role;
    const fallbackRole = user.role ?? assignedRole;
    if (fallbackRole?.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { userType: inferUserTypeFromRole(fallbackRole.name) }
      });
    }
  }

  const roles = user.roles.map(entry => entry.role).filter(Boolean);
  const primaryRole = user.role ?? roles[0] ?? null;
  res.json({ assignment, user: { ...user, role: primaryRole, roles } });
});

// Remove a role from a user (must leave at least one)
router.delete('/:userId/:roleId', authenticate, requireRbacAdmin, async (req, res) => {
  const { userId, roleId } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const currentRoles = user.roles ?? [];
  if (currentRoles.length <= 1) {
    return res.status(400).json({ message: 'User must have at least one role' });
  }

  const existing = currentRoles.find(entry => entry.roleId === roleId);
  if (!existing) {
    return res.status(404).json({ message: 'Role assignment not found' });
  }

  await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId } } });

  if (user.roleId === roleId) {
    const nextRole = currentRoles.find(entry => entry.roleId !== roleId);
    if (nextRole) {
      await prisma.user.update({ where: { id: userId }, data: { roleId: nextRole.roleId } });
    }
  }

  return res.json({ status: 'removed' });
});

export default router;
