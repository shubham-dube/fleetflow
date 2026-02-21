import { z } from 'zod';
import { LicenseCategory, DriverStatus } from '@prisma/client';

export const createDriverSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  phone: z
    .string({ required_error: 'Phone is required' })
    .trim()
    .min(7, 'Phone must be at least 7 characters')
    .max(20, 'Phone must be at most 20 characters'),
  email: z
    .string()
    .email('Must be a valid email address')
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal('')),
  licenseNumber: z
    .string({ required_error: 'License number is required' })
    .trim()
    .min(3, 'License number is required')
    .max(50, 'License number must be at most 50 characters')
    .toUpperCase(),
  licenseCategory: z.nativeEnum(LicenseCategory, {
    required_error: 'License category is required',
    invalid_type_error: 'Invalid license category. Must be TRUCK, VAN, or BIKE',
  }),
  licenseExpiryDate: z
    .string({ required_error: 'License expiry date is required' })
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date format')
    .refine(
      (v) => new Date(v) > new Date(),
      'License expiry date must be in the future — expired licenses cannot be registered'
    )
    .transform((v) => new Date(v)),
});

export const updateDriverSchema = createDriverSchema.partial();

export const updateDriverStatusSchema = z.object({
  status: z.nativeEnum(DriverStatus, {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status. Must be ON_DUTY, OFF_DUTY, or SUSPENDED',
  }),
  suspendedReason: z.string().trim().max(500).optional(),
}).refine(
  (data) => data.status !== 'SUSPENDED' || (data.suspendedReason && data.suspendedReason.length > 0),
  { message: 'A suspension reason is required when suspending a driver', path: ['suspendedReason'] }
);

export const logIncidentSchema = z.object({
  description: z
    .string({ required_error: 'Incident description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be at most 1000 characters'),
  severity: z
    .number({ required_error: 'Severity is required', invalid_type_error: 'Severity must be a number' })
    .int('Severity must be a whole number')
    .min(1, 'Severity must be between 1 and 5')
    .max(5, 'Severity must be between 1 and 5'),
  tripId: z.string().uuid('Invalid trip ID').optional(),
  reportedBy: z.string().trim().max(100).optional(),
});

export const driverFiltersSchema = z.object({
  status: z.nativeEnum(DriverStatus).optional(),
  licenseCategory: z.nativeEnum(LicenseCategory).optional(),
  expiringWithinDays: z.string().transform(Number).optional(),
  isActive: z.string().transform((v) => v === 'true').optional(),
  page: z.string().transform(Number).optional(),
  pageSize: z.string().transform(Number).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>;
export type LogIncidentInput = z.infer<typeof logIncidentSchema>;