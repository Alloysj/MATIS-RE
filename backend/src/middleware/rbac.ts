import { Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from './auth';

export type AccessContext = {
  userType: string | null;
  roles: string[];
  permissions: string[];
};

export async function buildAccessContext(userId: string): Promise<AccessContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true }
              }
            }
          }
        }
      },
      role: {
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  const joinedRoles = (user?.roles ?? []).map(entry => entry.role).filter(Boolean);
  const fallbackRole = user?.role ?? null;
  const effectiveRoles = joinedRoles.length ? joinedRoles : fallbackRole ? [fallbackRole] : [];
  const roleNames = effectiveRoles.map(role => role.name);

  const permissionSet = new Set<string>();
  effectiveRoles.forEach(role => {
    (role.rolePermissions ?? []).forEach(rolePermission => {
      const name = rolePermission.permission?.name;
      if (name) {
        permissionSet.add(name);
      }
    });
  });

  return {
    userType: user?.userType ?? null,
    roles: roleNames,
    permissions: Array.from(permissionSet)
  };
}

const hasPermission = (permissions: string[] | undefined, required: string) =>
  Boolean(permissions?.includes(required));

const hasAnyPermission = (permissions: string[] | undefined, required: string[]) =>
  required.some(permission => permissions?.includes(permission));

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!hasAnyPermission(req.user.permissions, permissions)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
}

export function requireUserType(...types: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!req.user.userType || !types.includes(req.user.userType)) {
      return res.status(403).json({ message: 'Insufficient user type' });
    }
    return next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!req.user.roles.some(role => roles.includes(role))) {
      return res.status(403).json({ message: 'Insufficient role' });
    }
    return next();
  };
}

type OwnershipOptions = {
  resourceType: 'user' | 'vehicle' | 'loan' | 'payment' | 'savingsAccount';
  paramIdField: string;
  allowPermissions?: string[];
};

export function requireOwnership(options: OwnershipOptions) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (options.allowPermissions && hasAnyPermission(req.user.permissions, options.allowPermissions)) {
      return next();
    }

    const resourceId = req.params[options.paramIdField];
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource identifier missing' });
    }

    if (options.resourceType === 'user') {
      if (req.user.id !== resourceId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return next();
    }

    if (options.resourceType === 'vehicle') {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: resourceId },
        select: { ownerId: true }
      });
      if (!vehicle || vehicle.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return next();
    }

    if (options.resourceType === 'loan') {
      const loan = await prisma.loan.findUnique({
        where: { id: resourceId },
        select: { applicantId: true }
      });
      if (!loan || loan.applicantId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return next();
    }

    if (options.resourceType === 'payment') {
      const payment = await prisma.payment.findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      if (!payment || payment.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return next();
    }

    if (options.resourceType === 'savingsAccount') {
      const account = await prisma.savingsAccount.findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      if (!account || account.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return next();
    }

    return res.status(403).json({ message: 'Forbidden' });
  };
}
