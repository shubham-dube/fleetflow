import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import * as authService from './service';

// ─── Cookie Config ────────────────────────────────────────────────────────────
// Refresh token is stored in an httpOnly cookie — inaccessible to JavaScript.
// This protects against XSS attacks stealing the refresh token.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                          // JS cannot read this cookie
  secure: process.env['NODE_ENV'] === 'production', // HTTPS only in prod
  sameSite: 'strict' as const,            // CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000,      // 30 days in ms
  path: '/api/v1/auth',                   // Only sent to auth routes
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/login
 * Public route. Returns access token in body, refresh token in httpOnly cookie.
 *
 * Why split tokens?
 * - Access token in memory/localStorage: short-lived (7d), used in Authorization header
 * - Refresh token in httpOnly cookie: long-lived (30d), safe from XSS
 */
export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.login(req.body);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(
    res,
    { user, accessToken: tokens.accessToken },
    200,
    'Login successful'
  );
});

/**
 * POST /api/v1/auth/register
 * Protected: MANAGER only. Creates a new system user.
 */
export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  return sendCreated(res, { user }, 'User registered successfully');
});

/**
 * POST /api/v1/auth/refresh
 * Public route. Reads refresh token from httpOnly cookie, issues new token pair.
 * Implements token rotation — old refresh token is invalidated.
 */
export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  // Read from cookie first, fall back to body (for API clients that can't set cookies)
  const rawToken: string | undefined =
    (req.cookies as Record<string, string>)?.['refreshToken'] ?? req.body?.refreshToken;

  if (!rawToken) {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_MISSING', message: 'Refresh token is required' },
    });
  }

  const tokens = await authService.refreshTokens(rawToken);

  // Rotate cookie
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, { accessToken: tokens.accessToken }, 200, 'Token refreshed');
});

/**
 * POST /api/v1/auth/logout
 * Protected. Invalidates current session's refresh token.
 */
export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const rawToken: string | undefined =
    (req.cookies as Record<string, string>)?.['refreshToken'] ?? req.body?.refreshToken;

  if (rawToken) {
    await authService.logout(rawToken);
  }

  // Clear the cookie regardless
  res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });

  return sendSuccess(res, null, 200, 'Logged out successfully');
});

/**
 * POST /api/v1/auth/logout-all
 * Protected. Invalidates ALL sessions for the authenticated user.
 */
export const logoutAllHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAll(req.user!.userId);
  res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
  return sendSuccess(res, null, 200, 'Logged out from all devices');
});

/**
 * GET /api/v1/auth/me
 * Protected. Returns authenticated user's profile.
 */
export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  return sendSuccess(res, { user });
});

/**
 * PATCH /api/v1/auth/change-password
 * Protected. Changes password and invalidates all other sessions.
 */
export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.userId, req.body);

  // Clear cookie — user must re-login on current device too
  res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });

  return sendSuccess(res, null, 200, 'Password changed successfully. Please log in again.');
});