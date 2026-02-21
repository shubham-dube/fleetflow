import { Response } from 'express';

// Standardized API response shape — every endpoint returns this exact format.
// Frontend can always rely on { success, data } or { success, error }.
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  meta?: PaginationMeta
): Response => {
  const response: ApiSuccessResponse<T> = { success: true, data, message, meta };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message?: string): Response =>
  sendSuccess(res, data, 201, message);

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string[]>
): Response => {
  const response: ApiErrorResponse = {
    success: false,
    error: { code, message, details },
  };
  return res.status(statusCode).json(response);
};