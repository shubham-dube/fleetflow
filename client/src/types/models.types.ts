// ─── Enums (mirror the Prisma enums exactly) ─────────────────────────────────
export type UserRole = 'MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'ANALYST'
export type VehicleType = 'TRUCK' | 'VAN' | 'BIKE'
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
export type DriverStatus = 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED'
export type LicenseCategory = 'TRUCK' | 'VAN' | 'BIKE'
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
export type ServiceType =
  | 'OIL_CHANGE'
  | 'TIRE_ROTATION'
  | 'BRAKE_SERVICE'
  | 'ENGINE_REPAIR'
  | 'ELECTRICAL'
  | 'BODY_WORK'
  | 'INSPECTION'
  | 'OTHER'
export type LicenseStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'

// ─── Models ───────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface Vehicle {
  id: string
  licensePlate: string
  make: string
  model: string
  year: number
  type: VehicleType
  maxCapacityKg: string // Prisma Decimal → string in JSON
  odometerKm: string
  status: VehicleStatus
  acquisitionCost: string
  notes: string | null
  isActive: boolean
  retiredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  email: string | null
  licenseNumber: string
  licenseCategory: LicenseCategory
  licenseExpiryDate: string
  status: DriverStatus
  safetyScore: string // Prisma Decimal → string in JSON
  totalTrips: number
  completedTrips: number
  completionRate: number // computed by backend
  licenseStatus: LicenseStatus // computed by backend
  isActive: boolean
  suspendedReason: string | null
  createdAt: string
  updatedAt: string
}

export interface Trip {
  id: string
  tripNumber: string
  status: TripStatus
  origin: string
  destination: string
  distanceKm: string | null
  cargoDescription: string | null
  cargoWeightKg: string
  estimatedFuelCost: string | null
  odometerStart: string | null
  odometerEnd: string | null
  revenueGenerated: string | null
  cancellationReason: string | null
  dispatchedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  vehicle: {
    id: string
    licensePlate: string
    make: string
    model: string
    type: VehicleType
  }
  driver: {
    id: string
    name: string
    phone: string
    licenseCategory: LicenseCategory
  }
  createdBy: { id: string; name: string; role: UserRole }
}

export interface MaintenanceLog {
  id: string
  serviceType: ServiceType
  description: string
  cost: string
  vendor: string | null
  serviceDate: string
  completedAt: string | null
  odometerAtService: string | null
  createdAt: string
  vehicle: { id: string; licensePlate: string; make: string; model: string }
  loggedBy: { id: string; name: string }
}

export interface FuelLog {
  id: string
  liters: string
  costPerLiter: string
  totalCost: string
  odometerKm: string
  loggedAt: string
  driverName: string | null
  notes: string | null
  createdAt: string
  vehicle: { id: string; licensePlate: string; make: string; model: string }
  trip: { id: string; tripNumber: string } | null
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  activeFleet: number
  maintenanceAlerts: number
  utilizationRate: number
  pendingCargo: number
}

export interface DashboardData {
  kpis: DashboardKPIs
  recentTrips: Trip[]
  fleetBreakdown: { status: VehicleStatus; count: number }[]
}

export interface FleetAnalytics {
  vehicles: Array<
    Vehicle & {
      totalRevenue: string
      totalFuelCost: string
      totalMaintenanceCost: string
      roi: number
    }
  >
}

export interface FinancialSummary {
  month: string
  summary: {
    revenue: string
    fuelCost: string
    maintenanceCost: string
    netProfit: string
  }
  trips: Trip[]
  maintenanceLogs: MaintenanceLog[]
  fuelLogs: FuelLog[]
}

export interface TrendData {
  trend: Array<{
    month: string
    revenue: number
    fuelCost: number
    maintenanceCost: number
    netProfit: number
    tripCount: number
  }>
}