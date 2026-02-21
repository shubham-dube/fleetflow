/**
 * Auth Module
 *
 * Handles: Login, Register, Token Refresh, Logout, Change Password
 *
 * Security model:
 *  - Access token (JWT): short-lived, stateless, sent in Authorization header
 *  - Refresh token: opaque random bytes, hashed in DB, sent as httpOnly cookie
 *  - Token rotation on every refresh (prevents replay attacks)
 *  - Timing-attack-safe login (constant-time bcrypt even on missing users)
 *  - Password changes invalidate all active sessions
 */
export { default as authRouter } from './auth.routes';
export * as authService from './auth.service';
export type { SafeUser, TokenPair, AuthPayload } from './auth.service';