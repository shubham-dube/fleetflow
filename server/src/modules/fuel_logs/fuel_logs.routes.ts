import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createFuelLogSchema } from './fluel_logs.schema';
import { getAllHandler, getByIdHandler, getVehicleSummaryHandler, createHandler } from './fluel_logs.controller';

const router = Router();
router.use(authenticate);

router.get('/', getAllHandler);
router.get('/vehicle/:vehicleId/summary', getVehicleSummaryHandler);
router.get('/:id', getByIdHandler);
router.post('/', authorize('MANAGER', 'DISPATCHER'), validate(createFuelLogSchema), createHandler);

export default router;