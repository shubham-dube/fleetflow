
export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  VEHICLES: '/dashboard/vehicles',
  VEHICLE_DETAIL: (id: string) => `/dashboard/vehicles/${id}`,
  TRIPS: '/dashboard/trips',
  NEW_TRIP: '/dashboard/trips/new',
  TRIP_DETAIL: (id: string) => `/dashboard/trips/${id}`,
  DRIVERS: '/dashboard/drivers',
  DRIVER_DETAIL: (id: string) => `/dashboard/drivers/${id}`,
  MAINTENANCE: '/dashboard/maintenance',
  EXPENSES: '/dashboard/expenses',
  ANALYTICS: '/dashboard/analytics',
} as const