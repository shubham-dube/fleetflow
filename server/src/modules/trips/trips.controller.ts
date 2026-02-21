import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { MSG } from '../../constants/messages';
import * as tripService from './trips.service';

export const getAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const { trips, meta } = await tripService.getAll(req);
  return sendSuccess(res, { trips }, 200, undefined, meta);
});

export const getByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const trip = await tripService.getById(req.params['id']!);
  return sendSuccess(res, { trip });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const trip = await tripService.create(req.body, req.user!.userId);
  return sendCreated(res, { trip }, MSG.CREATED('Trip'));
});

export const updateStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const trip = await tripService.updateStatus(req.params['id']!, req.body);
  return sendSuccess(res, { trip }, 200, MSG.UPDATED('Trip status'));
});