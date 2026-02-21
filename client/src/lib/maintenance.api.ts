import api from './api'
import type { MaintenanceLog, FuelLog } from '@/types/models.types'
import type { ApiSuccess, PaginationMeta } from '@/types/api.types'

// ─── Maintenance API ──────────────────────────────────────────────────────────
export type CreateMaintenancePayload = {
  vehicleId: string
  serviceType: string
  description: string
  cost: number
  vendor?: string
  serviceDate: string
  odometerAtService?: number
}

export const maintenanceApi = {
  getAll: (
    params?: Record<string, unknown>,
  ): Promise<ApiSuccess<{ logs: MaintenanceLog[] }> & { meta: PaginationMeta }> =>
    api.get('/maintenance', { params }),

  getOpen: (): Promise<ApiSuccess<{ logs: MaintenanceLog[] }>> => api.get('/maintenance/open'),

  getById: (id: string): Promise<ApiSuccess<{ log: MaintenanceLog }>> =>
    api.get(`/maintenance/${id}`),

  create: (data: CreateMaintenancePayload): Promise<ApiSuccess<{ log: MaintenanceLog }>> =>
    api.post('/maintenance', data),

  update: (
    id: string,
    data: Partial<CreateMaintenancePayload>,
  ): Promise<ApiSuccess<{ log: MaintenanceLog }>> => api.patch(`/maintenance/${id}`, data),

  complete: (
    id: string,
  ): Promise<
    ApiSuccess<{ log: MaintenanceLog; vehicleRestored: boolean; remainingOpenLogs: number }>
  > => api.patch(`/maintenance/${id}/complete`),
}

// ─── Fuel Logs API ────────────────────────────────────────────────────────────
export type CreateFuelLogPayload = {
  vehicleId: string
  tripId?: string
  liters: number
  costPerLiter: number
  odometerKm: number
  driverName?: string
  notes?: string
}

export const fuelLogApi = {
  getAll: (
    params?: Record<string, unknown>,
  ): Promise<ApiSuccess<{ logs: FuelLog[] }> & { meta: PaginationMeta }> =>
    api.get('/fuel-logs', { params }),

  getById: (id: string): Promise<ApiSuccess<{ log: FuelLog }>> => api.get(`/fuel-logs/${id}`),

  getSummary: (
    vehicleId: string,
  ): Promise<ApiSuccess<{ summary: Record<string, number> }>> =>
    api.get(`/fuel-logs/vehicle/${vehicleId}/summary`),

  create: (
    data: CreateFuelLogPayload,
  ): Promise<ApiSuccess<{ log: FuelLog; fuelEfficiency: number | null }>> =>
    api.post('/fuel-logs', data),
}