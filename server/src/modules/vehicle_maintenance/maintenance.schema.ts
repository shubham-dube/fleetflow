import { z } from 'zod';
import { ServiceType } from '@prisma/client';

export const createMaintenanceSchema = z.object({
  vehicleId: z.string({ required_error: 'Vehicle is required' }).uuid('Invalid vehicle ID'),
  serviceType: z.nativeEnum(ServiceType, {
    required_error: 'Service type is required',
    invalid_type_error: 'Invalid service type',
  }),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(1000, 'Description must be at most 1000 characters'),
  cost: z
    .number({ required_error: 'Cost is required', invalid_type_error: 'Cost must be a number' })
    .min(0, 'Cost cannot be negative')
    .max(10000000, 'Cost cannot exceed 10,000,000'),
  vendor: z.string().trim().max(200, 'Vendor name must be at most 200 characters').optional(),
  serviceDate: z
    .string({ required_error: 'Service date is required' })
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date format')
    .transform((v) => new Date(v)),
  odometerAtService: z
    .number({ invalid_type_error: 'Odometer must be a number' })
    .min(0, 'Odometer cannot be negative')
    .optional(),
});

export const updateMaintenanceSchema = createMaintenanceSchema
  .omit({ vehicleId: true })  // vehicle cannot be changed after creation
  .partial();

export const maintenanceFiltersSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  inShop: z.string().transform((v) => v === 'true').optional(), // true = not completed yet
  serviceType: z.nativeEnum(ServiceType).optional(),
  page: z.string().transform(Number).optional(),
  pageSize: z.string().transform(Number).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;