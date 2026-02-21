import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './schema';
import {
  loginHandler,
  registerHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
  getMeHandler,
  changePasswordHandler,
} from './controller';

const router = Router();

// ─── Public Routes (no auth required) ────────────────────────────────────────
router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh', refreshHandler); // token comes from cookie or body

// ─── Protected Routes (access token required) ─────────────────────────────
router.use(authenticate); // all routes below require valid JWT

router.get('/me', getMeHandler);
router.post('/logout', logoutHandler);
router.post('/logout-all', logoutAllHandler);
router.patch('/change-password', validate(changePasswordSchema), changePasswordHandler);

// ─── Manager-Only Routes ──────────────────────────────────────────────────
router.post(
  '/register',
  authorize('MANAGER'),          // only MANAGER role can create users
  validate(registerSchema),
  registerHandler
);

export default router;