import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createDriverSchema, updateDriverSchema,
  updateDriverStatusSchema, logIncidentSchema,
} from './drivers.schema';
import {
  getAllHandler, getByIdHandler, getProfileHandler, getAvailableHandler,
  createHandler, updateHandler, updateStatusHandler, logIncidentHandler, deactivateHandler,
} from './drivers.controller';

const router = Router();
router.use(authenticate);

// ─── Read ─────────────────────────────────────────────────────────────────────
router.get('/', getAllHandler);
router.get('/available', getAvailableHandler);
router.get('/:id', getByIdHandler);
router.get('/:id/profile', getProfileHandler); // full profile with trips + incidents

// ─── Write (MANAGER + SAFETY_OFFICER) ────────────────────────────────────────
router.post('/', authorize('MANAGER', 'SAFETY_OFFICER'), validate(createDriverSchema), createHandler);
router.patch('/:id', authorize('MANAGER', 'SAFETY_OFFICER'), validate(updateDriverSchema), updateHandler);
router.patch('/:id/status', authorize('MANAGER', 'SAFETY_OFFICER'), validate(updateDriverStatusSchema), updateStatusHandler);
router.post('/:id/incidents', authorize('MANAGER', 'SAFETY_OFFICER'), validate(logIncidentSchema), logIncidentHandler);
router.patch('/:id/deactivate', authorize('MANAGER'), deactivateHandler);

export default router;