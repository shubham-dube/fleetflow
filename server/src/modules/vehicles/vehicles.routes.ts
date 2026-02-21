import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createVehicleSchema, updateVehicleSchema } from './vehicles.schema';
import {
  getAllHandler, getByIdHandler, getHistoryHandler,
  getAvailableHandler, createHandler, updateHandler, retireHandler,
} from './vehicles.controller';

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

// ─── Read (all roles) ─────────────────────────────────────────────────────────
router.get('/', getAllHandler);
router.get('/available', getAvailableHandler);   // lightweight dropdown endpoint
router.get('/:id', getByIdHandler);
router.get('/:id/history', getHistoryHandler);

// ─── Write (MANAGER only) ────────────────────────────────────────────────────
router.post('/', authorize('MANAGER'), validate(createVehicleSchema), createHandler);
router.patch('/:id', authorize('MANAGER'), validate(updateVehicleSchema), updateHandler);
router.patch('/:id/retire', authorize('MANAGER'), retireHandler);

export default router;