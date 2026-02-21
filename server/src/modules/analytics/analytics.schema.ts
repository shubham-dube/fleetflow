import { z } from 'zod';

export const monthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format (e.g., 2025-06)')
    .optional(),
});

export const exportQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format')
    .optional(),
  type: z.enum(['csv']).default('csv'),
});

export type MonthQuery = z.infer<typeof monthQuerySchema>;