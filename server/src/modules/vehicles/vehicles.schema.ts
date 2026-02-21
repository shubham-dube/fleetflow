import { z } from 'zod';
import { VehicleType } from '@prisma/client';

const currentYear = new Date().getFullYear();

export const createVehicleSchema = z.object({
  licensePlate: z
    .string({ required_error: 'License plate is required' })
    .trim()
    .min(1, 'License plate is required')
    .max(20, 'License plate must be at most 20 characters')
    .toUpperCase(),
  make: z
    .string({ required_error: 'Make is required' })
    .trim()
    .min(1, 'Make is required')
    .max(50, 'Make must be at most 50 characters'),
  model: z
    .string({ required_error: 'Model is required' })
    .trim()
    .min(1, 'Model is required')
    .max(50, 'Model must be at most 50 characters'),
  year: z
    .number({ required_error: 'Year is required', invalid_type_error: 'Year must be a number' })
    .int('Year must be a whole number')
    .min(1990, 'Year must be 1990 or later')
    .max(currentYear + 1, `Year cannot exceed ${currentYear + 1}`),
  type: z.nativeEnum(VehicleType, {
    required_error: 'Vehicle type is required',
    invalid_type_error: 'Invalid vehicle type. Must be TRUCK, VAN, or BIKE',
  }),
  maxCapacityKg: z
    .number({ required_error: 'Max capacity is required', invalid_type_error: 'Must be a number' })
    .positive('Max capacity must be a positive number')
    .max(100000, 'Max capacity cannot exceed 100,000 kg'),
  acquisitionCost: z
    .number({ required_error: 'Acquisition cost is required', invalid_type_error: 'Must be a number' })
    .positive('Acquisition cost must be a positive number')
    .max(10000000, 'Acquisition cost cannot exceed 10,000,000'),
  odometerKm: z
    .number({ invalid_type_error: 'Odometer must be a number' })
    .min(0, 'Odometer cannot be negative')
    .optional()
    .default(0),
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters').optional(),
});

export const updateVehicleSchema = createVehicleSchema
  .omit({ licensePlate: true }) // plate is immutable after creation
  .partial();

export const vehicleFiltersSchema = z.object({
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
  type: z.nativeEnum(VehicleType).optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  page: z.string().transform(Number).optional(),
  pageSize: z.string().transform(Number).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>;