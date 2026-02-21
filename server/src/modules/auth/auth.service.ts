import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error.middleware';
import { HTTP } from '../../constants/statusCodes';
import { MSG } from '../../constants/messages';
import type { LoginInput, RegisterInput, ChangePasswordInput } from './schema';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12; // bcrypt cost factor — intentionally slow for security

/**
 * Signs a short-lived JWT access token (stateless — verified on each request)
 */
const signAccessToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'fleetflow-api',
    audience: 'fleetflow-client',
  } as jwt.SignOptions);

/**
 * Creates a cryptographically random opaque refresh token.
 * Stored hashed in DB — the raw token is sent to client once and never stored plain.
 */
const generateRefreshToken = (): { raw: string; hashed: string } => {
  const raw = crypto.randomBytes(64).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

/**
 * Strips sensitive fields (passwordHash) before returning user to controller.
 * Never return passwordHash to any caller outside this service.
 */
const toSafeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * LOGIN
 * 1. Find user by email
 * 2. Verify password with bcrypt (constant-time compare)
 * 3. Check account is active
 * 4. Issue access + refresh token pair
 * 5. Persist hashed refresh token in DB
 * 6. Update lastLoginAt
 *
 * SECURITY: Uses same error message for "user not found" and "wrong password"
 * to prevent user enumeration attacks.
 */
export const login = async (input: LoginInput): Promise<{ user: SafeUser; tokens: TokenPair }> => {
  // Fetch user — select only fields we need (don't over-fetch)
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  // Deliberate constant-time path: always run bcrypt even if user not found
  // This prevents timing attacks that could reveal whether an email is registered
  const dummyHash = '$2a$12$dummyhashtopreventtimingattacksXXXXXXXXXXXX';
  const passwordMatch = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? dummyHash
  );

  if (!user || !passwordMatch) {
    throw new AppError(HTTP.UNAUTHORIZED, 'INVALID_CREDENTIALS', MSG.INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new AppError(HTTP.FORBIDDEN, 'ACCOUNT_DISABLED', 'This account has been disabled');
  }

  // Generate tokens
  const payload: AuthPayload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const { raw: refreshToken, hashed: hashedRefreshToken } = generateRefreshToken();

  // Refresh token expiry — parse "30d" into a real Date
  const refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN;
  const days = parseInt(refreshExpiresIn.replace('d', ''), 10) || 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Persist refresh token + update lastLoginAt in a single transaction
  await prisma.$transaction([
    prisma.refreshToken.create({
      data: { userId: user.id, token: hashedRefreshToken, expiresAt },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  return {
    user: toSafeUser(user),
    tokens: { accessToken, refreshToken },
  };
};

/**
 * REGISTER (Manager-only operation)
 * Creates a new system user. Only MANAGER role can call this endpoint (enforced in routes).
 */
export const register = async (input: RegisterInput): Promise<SafeUser> => {
  // Check uniqueness before hashing (fast fail)
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(HTTP.CONFLICT, 'EMAIL_EXISTS', 'A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role as UserRole,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return toSafeUser(user);
};

/**
 * REFRESH TOKEN
 * 1. Hash incoming raw token
 * 2. Find matching, non-expired token in DB
 * 3. Rotate: delete old refresh token, issue new pair (prevents replay attacks)
 */
export const refreshTokens = async (rawToken: string): Promise<TokenPair> => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const stored = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: {
      user: {
        select: { id: true, role: true, email: true, isActive: true },
      },
    },
  });

  // Token not found, expired, or user disabled
  if (!stored || stored.expiresAt < new Date()) {
    // Clean up expired token if it exists
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    throw new AppError(HTTP.UNAUTHORIZED, 'TOKEN_INVALID', 'Invalid or expired refresh token');
  }

  if (!stored.user.isActive) {
    throw new AppError(HTTP.FORBIDDEN, 'ACCOUNT_DISABLED', 'This account has been disabled');
  }

  // Rotate: delete old, issue new
  const payload: AuthPayload = {
    userId: stored.user.id,
    role: stored.user.role,
    email: stored.user.email,
  };
  const newAccessToken = signAccessToken(payload);
  const { raw: newRefreshToken, hashed: newHashedToken } = generateRefreshToken();

  const days = parseInt(env.JWT_REFRESH_EXPIRES_IN.replace('d', ''), 10) || 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.create({
      data: { userId: stored.user.id, token: newHashedToken, expiresAt },
    }),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * LOGOUT
 * Deletes the specific refresh token — invalidates this session only.
 * Other sessions (other devices) remain active.
 * Silently succeeds even if token doesn't exist (idempotent).
 */
export const logout = async (rawToken: string): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.refreshToken.deleteMany({ where: { token: hashedToken } });
};

/**
 * LOGOUT ALL SESSIONS
 * Deletes ALL refresh tokens for a user — kicks them out of every device.
 */
export const logoutAll = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

/**
 * GET ME
 * Returns current authenticated user's profile.
 */
export const getMe = async (userId: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(HTTP.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
  }

  return toSafeUser(user);
};

/**
 * CHANGE PASSWORD
 * Verifies current password, hashes new one, invalidates ALL existing refresh tokens
 * (security best practice — forces re-login on all devices after password change).
 */
export const changePassword = async (
  userId: string,
  input: ChangePasswordInput
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new AppError(HTTP.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
  }

  const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new AppError(HTTP.BAD_REQUEST, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
  }

  const newHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

  // Update password + invalidate all sessions atomically
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } }),
    prisma.refreshToken.deleteMany({ where: { userId } }), // forces re-login everywhere
  ]);
};

/**
 * CLEAN EXPIRED TOKENS
 * Should be called on a schedule (e.g., daily cron job).
 * Prevents refresh_tokens table from growing unbounded.
 */
export const cleanExpiredTokens = async (): Promise<number> => {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
};