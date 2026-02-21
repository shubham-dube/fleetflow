import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createTripSchema, updateTripStatusSchema } from './trips.schema';
import { getAllHandler, getByIdHandler, createHandler, updateStatusHandler } from './trips.controller';

const router = Router();
router.use(authenticate);

// ─── Read (all roles) ─────────────────────────────────────────────────────────
router.get('/', getAllHandler);
router.get('/:id', getByIdHandler);

// ─── Write (MANAGER + DISPATCHER) ────────────────────────────────────────────
router.post('/', authorize('MANAGER', 'DISPATCHER'), validate(createTripSchema), createHandler);
router.patch('/:id/status', authorize('MANAGER', 'DISPATCHER'), validate(updateTripStatusSchema), updateStatusHandler);

export default router;