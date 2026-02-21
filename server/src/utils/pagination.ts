import { Request } from 'express';
import { PaginationMeta } from './apiResponse';

export interface PaginationOptions {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}

export const parsePagination = (req: Request): PaginationOptions => {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize'] as string) || 20));
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize, page, pageSize };
};

export const buildMeta = (total: number, options: PaginationOptions): PaginationMeta => ({
  total,
  page: options.page,
  pageSize: options.pageSize,
  totalPages: Math.ceil(total / options.pageSize),
});