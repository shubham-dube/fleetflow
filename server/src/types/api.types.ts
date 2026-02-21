import { UserRole, VehicleType, VehicleStatus, DriverStatus, LicenseCategory, TripStatus, ServiceType } from '@prisma/client';

// ─── Re-export all enums for use in frontend types (via shared contract) ──────
export { UserRole, VehicleType, VehicleStatus, DriverStatus, LicenseCategory, TripStatus, ServiceType };

// ─── API Response wrapper types ───────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;