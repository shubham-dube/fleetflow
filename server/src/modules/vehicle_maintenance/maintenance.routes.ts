import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createMaintenanceSchema, updateMaintenanceSchema } from './maintenance.schema';
import {
  getAllHandler, getByIdHandler, getOpenLogsHandler,
  createHandler, updateHandler, completeHandler,
} from './maintenance.controller';

const router = Router();
router.use(authenticate);

router.get('/', getAllHandler);
router.get('/open', getOpenLogsHandler); // dashboard quick-view
router.get('/:id', getByIdHandler);

// MANAGER + SAFETY_OFFICER can manage maintenance
router.post('/', authorize('MANAGER', 'SAFETY_OFFICER'), validate(createMaintenanceSchema), createHandler);
router.patch('/:id', authorize('MANAGER', 'SAFETY_OFFICER'), validate(updateMaintenanceSchema), updateHandler);
router.patch('/:id/complete', authorize('MANAGER', 'SAFETY_OFFICER'), completeHandler);

export default router;