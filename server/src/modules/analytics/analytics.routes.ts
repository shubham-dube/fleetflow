import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import {
  getDashboardHandler, getFleetAnalyticsHandler,
  getFinancialReportHandler, getMonthlyTrendHandler, exportCSVHandler,
} from './analytics.controller';

const router = Router();
router.use(authenticate);

// Dashboard available to all authenticated roles
router.get('/dashboard', getDashboardHandler);

// Analytics: MANAGER + ANALYST
router.get('/fleet', authorize('MANAGER', 'ANALYST'), getFleetAnalyticsHandler);
router.get('/financial', authorize('MANAGER', 'ANALYST'), getFinancialReportHandler);
router.get('/trend', authorize('MANAGER', 'ANALYST'), getMonthlyTrendHandler);
router.get('/export', authorize('MANAGER', 'ANALYST'), exportCSVHandler);

export default router;