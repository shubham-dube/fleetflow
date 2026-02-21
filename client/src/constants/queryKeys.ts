export const QUERY_KEYS = {
  // Auth
  me: ['auth', 'me'] as const,

  // Vehicles
  vehicles: (filters?: Record<string, unknown>) => ['vehicles', filters] as const,
  vehicle: (id: string) => ['vehicles', id] as const,
  vehicleHistory: (id: string) => ['vehicles', id, 'history'] as const,
  vehiclesAvailable: (type?: string) => ['vehicles', 'available', type] as const,

  // Drivers
  drivers: (filters?: Record<string, unknown>) => ['drivers', filters] as const,
  driver: (id: string) => ['drivers', id] as const,
  driverProfile: (id: string) => ['drivers', id, 'profile'] as const,
  driversAvailable: (licenseCategory?: string) =>
    ['drivers', 'available', licenseCategory] as const,

  // Trips
  trips: (filters?: Record<string, unknown>) => ['trips', filters] as const,
  trip: (id: string) => ['trips', id] as const,

  // Maintenance
  maintenance: (filters?: Record<string, unknown>) => ['maintenance', filters] as const,
  maintenanceLog: (id: string) => ['maintenance', id] as const,
  maintenanceOpen: ['maintenance', 'open'] as const,

  // Fuel Logs
  fuelLogs: (filters?: Record<string, unknown>) => ['fuel-logs', filters] as const,
  fuelLogSummary: (vehicleId: string) => ['fuel-logs', 'summary', vehicleId] as const,

  // Analytics
  analyticsDashboard: ['analytics', 'dashboard'] as const,
  analyticsFleet: ['analytics', 'fleet'] as const,
  analyticsFinancial: (month?: string) => ['analytics', 'financial', month] as const,
  analyticsTrend: ['analytics', 'trend'] as const,
}