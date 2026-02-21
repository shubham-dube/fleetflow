import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from './error.middleware';
import { HTTP } from '../constants/statusCodes';
import { MSG } from '../constants/messages';

/**
 * authorize
 * Factory that returns a middleware enforcing role-based access control.
 * Must be used AFTER authenticate (requires req.user to be set).
 *
 * Usage:
 *   router.post('/register', authenticate, authorize('MANAGER'), handler)
 *   router.delete('/:id', authenticate, authorize('MANAGER', 'SAFETY_OFFICER'), handler)
 */
export const authorize = (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(HTTP.UNAUTHORIZED, 'UNAUTHORIZED', MSG.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        HTTP.FORBIDDEN,
        'FORBIDDEN',
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      );
    }

    next();
  };

/**
 * authorizeOwnerOrRole
 * Allows access if the requester either owns the resource (userId match)
 * OR has one of the specified roles.
 *
 * Usage: profile updates — a user can update their own profile,
 * a MANAGER can update anyone's.
 */
export const authorizeOwnerOrRole = (
  getResourceUserId: (req: Request) => string,
  ...allowedRoles: UserRole[]
) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(HTTP.UNAUTHORIZED, 'UNAUTHORIZED', MSG.UNAUTHORIZED);
    }

    const isOwner = req.user.userId === getResourceUserId(req);
    const hasRole = allowedRoles.includes(req.user.role);

    if (!isOwner && !hasRole) {
      throw new AppError(HTTP.FORBIDDEN, 'FORBIDDEN', MSG.FORBIDDEN);
    }

    next();
  };