import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { buildAccessContext } from './rbac';

export interface AuthUser {
  id: string;
  email: string;
  userType: string | null;
  roles: string[];
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

type TokenPayload = {
  id: string;
  email: string;
  userType?: string | null;
  roles?: string[];
  permissions?: string[];
};

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: 'JWT secret not configured' });
  }
  try {
    const payload = jwt.verify(token, jwtSecret) as TokenPayload;
    const userId = payload.id;
    const email = payload.email;

    if (!userId || !email) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (payload.permissions && payload.roles) {
      req.user = {
        id: userId,
        email,
        userType: payload.userType ?? null,
        roles: payload.roles,
        permissions: payload.permissions
      };
      return next();
    }

    const access = await buildAccessContext(userId);
    req.user = {
      id: userId,
      email,
      userType: access.userType,
      roles: access.roles,
      permissions: access.permissions
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
