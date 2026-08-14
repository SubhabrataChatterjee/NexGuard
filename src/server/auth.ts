import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../types';
import { UserModel } from './models/User';

const JWT_SECRET =
  process.env.JWT_SECRET || 'nexguard_jwt_secret_key_change_in_production';

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

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: missing or malformed token',
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      email?: string;
      role?: UserRole;
    };

    let mongoUser = null;

    if (decoded.userId) {
      mongoUser = await UserModel.findOne({
        id: decoded.userId,
      }).lean();
    }

    if (!mongoUser && decoded.email) {
      mongoUser = await UserModel.findOne({
        email: decoded.email.toLowerCase().trim(),
      }).lean();
    }

    if (!mongoUser) {
      return res.status(401).json({
        error: 'Unauthorized: user account not found or session expired',
      });
    }

    if (mongoUser.status !== 'ACTIVE') {
      return res.status(401).json({
        error: 'Unauthorized: user account is inactive',
      });
    }

    const user: User = {
      id: mongoUser.id,
      email: mongoUser.email,
      full_name: mongoUser.full_name,
      phone: mongoUser.phone,
      avatar_url: mongoUser.avatar_url,
      role: mongoUser.role,
      status: mongoUser.status,
      email_verified: mongoUser.email_verified,
      timezone: mongoUser.timezone,
      created_at: mongoUser.created_at,
      updated_at: mongoUser.updated_at,
    };

    req.user = user;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);

    return res.status(401).json({
      error: 'Unauthorized: invalid or expired token',
    });
  }
}

export function roleGuard(allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: insufficient permissions',
      });
    }

    next();
  };
}