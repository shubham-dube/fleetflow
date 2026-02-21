import { z } from 'zod';

export const createFuelLogSchema = z.object({
  vehicleId: z.string({ required_error: 'Vehicle is required' }).uuid('Invalid vehicle ID'),
  tripId: z.string().uuid('Invalid trip ID').optional(),
  liters: z
    .number({ required_error: 'Liters is required', invalid_type_error: 'Must be a number' })
    .positive('Liters must be greater than 0')
    .max(10000, 'Liters cannot exceed 10,000'),
  costPerLiter: z
    .number({ required_error: 'Cost per liter is required', invalid_type_error: 'Must be a number' })
    .positive('Cost per liter must be greater than 0')
    .max(1000, 'Cost per liter cannot exceed 1000'),
  odometerKm: z
    .number({ required_error: 'Odometer reading is required', invalid_type_error: 'Must be a number' })
    .min(0, 'Odometer cannot be negative'),
  driverName: z.string().trim().max(100).optional(),
  loggedAt: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date format')
    .transform((v) => new Date(v))
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

export const fuelLogFiltersSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  page: z.string().transform(Number).optional(),
  pageSize: z.string().transform(Number).optional(),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;