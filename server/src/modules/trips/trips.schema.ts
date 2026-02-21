import { z } from 'zod';
import { TripStatus } from '@prisma/client';

export const createTripSchema = z.object({
  vehicleId: z.string({ required_error: 'Vehicle is required' }).uuid('Invalid vehicle ID'),
  driverId: z.string({ required_error: 'Driver is required' }).uuid('Invalid driver ID'),
  origin: z
    .string({ required_error: 'Origin is required' })
    .trim()
    .min(2, 'Origin is required')
    .max(200, 'Origin must be at most 200 characters'),
  destination: z
    .string({ required_error: 'Destination is required' })
    .trim()
    .min(2, 'Destination is required')
    .max(200, 'Destination must be at most 200 characters'),
  cargoWeightKg: z
    .number({ required_error: 'Cargo weight is required', invalid_type_error: 'Must be a number' })
    .positive('Cargo weight must be greater than 0')
    .max(100000, 'Cargo weight cannot exceed 100,000 kg'),
  cargoDescription: z
    .string()
    .trim()
    .max(500, 'Cargo description must be at most 500 characters')
    .optional(),
  estimatedFuelCost: z
    .number({ invalid_type_error: 'Estimated fuel cost must be a number' })
    .positive('Must be a positive number')
    .optional(),
  odometerStart: z
    .number({ invalid_type_error: 'Odometer must be a number' })
    .min(0, 'Odometer cannot be negative')
    .optional(),
  revenueGenerated: z
    .number({ invalid_type_error: 'Revenue must be a number' })
    .min(0, 'Revenue cannot be negative')
    .optional(),
}).refine(
  (data) => data.origin.toLowerCase() !== data.destination.toLowerCase(),
  { message: 'Origin and destination cannot be the same', path: ['destination'] }
);

export const updateTripStatusSchema = z.object({
  status: z.nativeEnum(TripStatus, {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid trip status',
  }),
  odometerEnd: z
    .number({ invalid_type_error: 'Odometer must be a number' })
    .min(0, 'Odometer cannot be negative')
    .optional(),
  revenueGenerated: z
    .number({ invalid_type_error: 'Revenue must be a number' })
    .min(0, 'Revenue cannot be negative')
    .optional(),
  cancellationReason: z.string().trim().max(500).optional(),
}).refine(
  (data) => data.status !== 'CANCELLED' || (data.cancellationReason && data.cancellationReason.length >= 3),
  { message: 'Cancellation reason is required when cancelling a trip', path: ['cancellationReason'] }
).refine(
  (data) => data.status !== 'COMPLETED' || data.odometerEnd !== undefined,
  { message: 'Final odometer reading is required when completing a trip', path: ['odometerEnd'] }
);

export const tripFiltersSchema = z.object({
  status: z.nativeEnum(TripStatus).optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  page: z.string().transform(Number).optional(),
  pageSize: z.string().transform(Number).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;