import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { MSG } from '../../constants/messages';
import * as maintenanceService from './maintenance.service';

export const getAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const { logs, meta } = await maintenanceService.getAll(req);
  return sendSuccess(res, { logs }, 200, undefined, meta);
});

export const getByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const log = await maintenanceService.getById(req.params['id']!);
  return sendSuccess(res, { log });
});

export const getOpenLogsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const logs = await maintenanceService.getOpenLogs();
  return sendSuccess(res, { logs });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const log = await maintenanceService.create(req.body, req.user!.userId);
  return sendCreated(res, { log }, MSG.CREATED('Maintenance log'));
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const log = await maintenanceService.update(req.params['id']!, req.body);
  return sendSuccess(res, { log }, 200, MSG.UPDATED('Maintenance log'));
});

export const completeHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await maintenanceService.complete(req.params['id']!);
  const message = result.vehicleRestored
    ? 'Maintenance complete. Vehicle is now available.'
    : `Maintenance complete. Vehicle remains IN_SHOP (${result.remainingOpenLogs} open log(s) remaining).`;
  return sendSuccess(res, { log: result.log }, 200, message);
});