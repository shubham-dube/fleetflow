import api from './api'
import type { Trip } from '@/types/models.types'
import type { ApiSuccess, PaginationMeta } from '@/types/api.types'

export type CreateTripPayload = {
  vehicleId: string
  driverId: string
  origin: string
  destination: string
  cargoWeightKg: number
  cargoDescription?: string
  estimatedFuelCost?: number
  odometerStart?: number
  revenueGenerated?: number
}

export type UpdateTripStatusPayload = {
  status: string
  odometerEnd?: number
  revenueGenerated?: number
  cancellationReason?: string
}

export const tripApi = {
  getAll: (
    params?: Record<string, unknown>,
  ): Promise<ApiSuccess<{ trips: Trip[] }> & { meta: PaginationMeta }> =>
    api.get('/trips', { params }),

  getById: (id: string): Promise<ApiSuccess<{ trip: Trip }>> => api.get(`/trips/${id}`),

  create: (data: CreateTripPayload): Promise<ApiSuccess<{ trip: Trip }>> =>
    api.post('/trips', data),

  updateStatus: (id: string, data: UpdateTripStatusPayload): Promise<ApiSuccess<{ trip: Trip }>> =>
    api.patch(`/trips/${id}/status`, data),
}