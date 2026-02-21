import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { MSG } from '../../constants/messages';
import * as driverService from './drivers.service';

export const getAllHandler = asyncHandler(async (req: Request, res: Response) => {
  const { drivers, meta } = await driverService.getAll(req);
  return sendSuccess(res, { drivers }, 200, undefined, meta);
});

export const getByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.getById(req.params['id']!);
  return sendSuccess(res, { driver });
});

export const getProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.getDriverProfile(req.params['id']!);
  return sendSuccess(res, { driver });
});

export const getAvailableHandler = asyncHandler(async (req: Request, res: Response) => {
  const drivers = await driverService.getAvailable(req.query['licenseCategory'] as string | undefined);
  return sendSuccess(res, { drivers });
});

export const createHandler = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.create(req.body);
  return sendCreated(res, { driver }, MSG.CREATED('Driver'));
});

export const updateHandler = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.update(req.params['id']!, req.body);
  return sendSuccess(res, { driver }, 200, MSG.UPDATED('Driver'));
});

export const updateStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.updateStatus(req.params['id']!, req.body);
  return sendSuccess(res, { driver }, 200, MSG.UPDATED('Driver status'));
});

export const logIncidentHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await driverService.logIncident(req.params['id']!, req.body);
  return sendCreated(res, result, 'Incident logged successfully');
});

export const deactivateHandler = asyncHandler(async (req: Request, res: Response) => {
  await driverService.deactivate(req.params['id']!);
  return sendSuccess(res, null, 200, 'Driver deactivated successfully');
});