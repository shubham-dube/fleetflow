export const MSG = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication token',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action',

  // ── Vehicle ───────────────────────────────────────────────────────────────
  VEHICLE_NOT_FOUND: 'Vehicle not found',
  VEHICLE_NOT_AVAILABLE: 'Vehicle is not available — it may be on a trip or in the shop',
  VEHICLE_PLATE_EXISTS: 'A vehicle with this license plate is already registered',
  VEHICLE_RETIRED: 'Cannot assign a retired vehicle',

  // ── Driver ────────────────────────────────────────────────────────────────
  DRIVER_NOT_FOUND: 'Driver not found',
  DRIVER_NOT_AVAILABLE: 'Driver is not available — check their duty status',
  DRIVER_SUSPENDED: 'Driver is suspended and cannot be assigned to trips',
  DRIVER_LICENSE_EXPIRED: 'Driver\'s license has expired. Renew before assigning.',
  DRIVER_LICENSE_MISMATCH: (driverCategory: string, vehicleType: string) =>
    `Driver holds a ${driverCategory} license but vehicle type is ${vehicleType}`,

  // ── Trip ──────────────────────────────────────────────────────────────────
  TRIP_NOT_FOUND: 'Trip not found',
  TRIP_OVERWEIGHT: (cargo: number, max: number) =>
    `Cargo weight (${cargo}kg) exceeds vehicle max capacity (${max}kg)`,
  TRIP_INVALID_TRANSITION: (from: string, to: string) =>
    `Cannot move a trip from "${from}" to "${to}"`,
  TRIP_CANCEL_REASON_REQUIRED: 'A cancellation reason is required',

  // ── Maintenance ───────────────────────────────────────────────────────────
  MAINTENANCE_NOT_FOUND: 'Maintenance log not found',
  MAINTENANCE_ALREADY_COMPLETE: 'This maintenance log is already marked as complete',

  // ── Generic CRUD ──────────────────────────────────────────────────────────
  CREATED: (entity: string) => `${entity} created successfully`,
  UPDATED: (entity: string) => `${entity} updated successfully`,
  DELETED: (entity: string) => `${entity} deleted successfully`,
  NOT_FOUND: (entity: string) => `${entity} not found`,
} as const;