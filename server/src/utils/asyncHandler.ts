import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps async route handlers to forward thrown errors to Express error middleware.
// Eliminates try/catch boilerplate in every controller.
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };