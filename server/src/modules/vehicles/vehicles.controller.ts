import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { MSG } from '../../constants/messages';
import * as vehicleService from './vehicles.service';

export const getAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const { vehicles, meta } = await vehicleService.getAll(req);
  return sendSuccess(res, { vehicles }, 200, undefined, meta);
});

export const getByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.getById(req.params['id']!);
  return sendSuccess(res, { vehicle });
});

export const getHistoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await vehicleService.getHistory(req.params['id']!);
  return sendSuccess(res, result);
});

export const getAvailableHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicles = await vehicleService.getAvailable(req.query['type'] as string | undefined);
  return sendSuccess(res, { vehicles });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.create(req.body);
  return sendCreated(res, { vehicle }, MSG.CREATED('Vehicle'));
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.update(req.params['id']!, req.body);
  return sendSuccess(res, { vehicle }, 200, MSG.UPDATED('Vehicle'));
});

export const retireHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.retire(req.params['id']!);
  return sendSuccess(res, { vehicle }, 200, 'Vehicle retired successfully');
});