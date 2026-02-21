import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodTypeAny } from 'zod';

/**
 * validate
 * Factory middleware that validates req.body against a Zod schema.
 * On success: replaces req.body with the parsed (coerced + stripped) value.
 * On failure: forwards ZodError to global error handler → returns 422 with field errors.
 *
 * Why replace req.body?
 * Zod's .parse() returns the transformed value (e.g., .toLowerCase() on email),
 * so the controller/service always receives clean, normalized input.
 */
export const validate =
  (schema: ZodTypeAny) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      next(err instanceof ZodError ? err : err);
    }
  };

/**
 * validateQuery
 * Same as validate but for req.query parameters.
 */
export const validateQuery =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };

/**
 * validateParams
 * Same as validate but for req.params (route parameters).
 */
export const validateParams =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (err) {
      next(err);
    }
  };