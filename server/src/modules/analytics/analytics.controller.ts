import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as analyticsService from './analytics.service';

export const getDashboardHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getDashboardKPIs();
  return sendSuccess(res, data);
});

export const getFleetAnalyticsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getFleetAnalytics();
  return sendSuccess(res, { vehicles: data });
});

export const getFinancialReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const month = req.query['month'] as string | undefined;
  const data = await analyticsService.getFinancialReport(month);
  return sendSuccess(res, data);
});

export const getMonthlyTrendHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getMonthlyTrend();
  return sendSuccess(res, { trend: data });
});

export const exportCSVHandler = asyncHandler(async (req: Request, res: Response) => {
  const month = req.query['month'] as string | undefined;
  const { csv, filename } = await analyticsService.generateCSV(month);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});