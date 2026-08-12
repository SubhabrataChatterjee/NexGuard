import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { User, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'nexguard_jwt_secret_key_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id || 'u-unknown',
      email: user.email || '',
      role: user.role || 'USER',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing or malformed token' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; email?: string; role?: UserRole };
    const userList = db.users || [];
    let user = userList.find((u) => u && decoded.userId && u.id === decoded.userId);

    if (!user && decoded.email) {
      const cleanEmail = decoded.email.toLowerCase().trim();
      user = userList.find((u) => u && typeof u.email === 'string' && u.email.toLowerCase().trim() === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: user account not found or session expired' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Unauthorized: user account is inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}

export function roleGuard(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}
