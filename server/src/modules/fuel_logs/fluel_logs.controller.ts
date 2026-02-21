import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import * as fuelLogService from './fuel_logs.service';

export const getAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const { logs, meta } = await fuelLogService.getAll(req);
  return sendSuccess(res, { logs }, 200, undefined, meta);
});

export const getByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const log = await fuelLogService.getById(req.params['id']!);
  return sendSuccess(res, { log });
});

export const getVehicleSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const summary = await fuelLogService.getVehicleFuelSummary(req.params['vehicleId']!);
  return sendSuccess(res, { summary });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await fuelLogService.create(req.body);
  return sendCreated(res, result, 'Fuel log created successfully');
});