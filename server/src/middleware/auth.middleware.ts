import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from './error.middleware';
import { HTTP } from '../constants/statusCodes';
import { MSG } from '../constants/messages';

// ─── Augment Express Request ──────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * authenticate
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches decoded payload to req.user for downstream use.
 * Throws AppError (caught by global error middleware) on failure.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(HTTP.UNAUTHORIZED, 'UNAUTHORIZED', MSG.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError(HTTP.UNAUTHORIZED, 'UNAUTHORIZED', MSG.UNAUTHORIZED);
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'fleetflow-api',
      audience: 'fleetflow-client',
    }) as JwtPayload;

    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(HTTP.UNAUTHORIZED, 'TOKEN_EXPIRED', MSG.TOKEN_EXPIRED);
    }
    throw new AppError(HTTP.UNAUTHORIZED, 'TOKEN_INVALID', MSG.TOKEN_INVALID);
  }
};

/**
 * optionalAuthenticate
 * Same as authenticate but doesn't throw if no token is present.
 * Used for routes that behave differently for authenticated vs anonymous users.
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'fleetflow-api',
      audience: 'fleetflow-client',
    }) as JwtPayload;
    req.user = payload;
  } catch {
    // Silently ignore — route will handle unauthenticated state
  }

  next();
};