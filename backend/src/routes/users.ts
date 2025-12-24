import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/auth';
import { buildAccessContext, requireAnyPermission, requireOwnership, requirePermission } from '../middleware/rbac';
import prisma from '../prismaClient';

const router = Router();

const requireMembersRead = requirePermission('MEMBERS:READ');
const requireMembersUpdate = requirePermission('MEMBERS:UPDATE');
const requireMembersDelete = requirePermission('MEMBERS:DELETE');
const requireMembersReadSelf = requireAnyPermission(['MEMBERS:READ', 'MEMBERS:READ_SELF']);
const requireMembersUpdateSelf = requireAnyPermission(['MEMBERS:UPDATE', 'MEMBERS:UPDATE_SELF']);
const requireMembersResetPassword = requirePermission('MEMBERS:RESET_PASSWORD');
const requireSupportTicket = requirePermission('SUPPORT:TICKET_CREATE');
const requirePayrollWrite = requirePermission('PAYROLL:WRITE');

router.get('/', authenticate, requireMembersRead, async (_req, res) => {
  const users = await prisma.user.findMany({ include: { role: true, roles: { include: { role: true } } } });
  const payload = users.map(user => {
    const roles = user.roles.map(entry => entry.role).filter(Boolean);
    const primaryRole = user.role ?? roles[0] ?? null;
    return { ...user, role: primaryRole, roles };
  });
  res.json(payload);
});

router.get('/all-with-roles', authenticate, requireMembersRead, async (_req, res) => {
  const users = await prisma.user.findMany({ include: { role: true, roles: { include: { role: true } } } });
  const payload = users.map(user => {
    const roles = user.roles.map(entry => entry.role).filter(Boolean);
    const primaryRole = user.role ?? roles[0] ?? null;
    return { ...user, role: primaryRole, roles };
  });
  res.json(payload);
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

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: 'JWT secret not configured' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const access = await buildAccessContext(user.id);
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: access.userType,
      roles: access.roles,
      permissions: access.permissions
    },
    jwtSecret,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

router.get('/userDetails', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { role: true, roles: { include: { role: true } } }
  });
  if (!user) {
    return res.status(404).json({ message: 'Not found' });
  }
  const roles = user.roles.map(entry => entry.role).filter(Boolean);
  const primaryRole = user.role ?? roles[0] ?? null;
  res.json({ ...user, role: primaryRole, roles });
});

router.post('/support/tickets', authenticate, requireSupportTicket, async (req: AuthRequest, res) => {
  const { subject, message } = req.body;
  const ticket = await prisma.contactMessage.create({
    data: { subject, message, type: 'TECHNICAL' }
  });
  res.status(201).json(ticket);
});

router.get(
  '/:userId',
  authenticate,
  requireMembersReadSelf,
  requireOwnership({ resourceType: 'user', paramIdField: 'userId', allowPermissions: ['MEMBERS:READ'] }),
  async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
});

router.put(
  '/:userId/update',
  authenticate,
  requireMembersUpdateSelf,
  requireOwnership({ resourceType: 'user', paramIdField: 'userId', allowPermissions: ['MEMBERS:UPDATE'] }),
  async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.userId }, data: req.body });
  res.json(user);
});

router.post('/:userId/resetPassword', authenticate, requireMembersResetPassword, async (req, res) => {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.update({ where: { id: req.params.userId }, data: { passwordHash: hash } });
  res.json({ status: 'ok' });
});

router.delete('/:userId/delete', authenticate, requireMembersDelete, async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.userId } });
  res.status(204).end();
});

router.post('/requestSalaryAdvance', authenticate, requirePayrollWrite, async (req: AuthRequest, res) => {
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

router.post('/:userId/message', authenticate, requireMembersRead, async (_req, res) => {
  res.json({ status: 'sent' });
});

export default router;
