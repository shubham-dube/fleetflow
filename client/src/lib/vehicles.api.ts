import api from './api'
import type { Vehicle } from '@/types/models.types'
import type { ApiSuccess, PaginationMeta } from '@/types/api.types'

export type CreateVehiclePayload = {
  licensePlate: string
  make: string
  model: string
  year: number
  type: string
  maxCapacityKg: number
  acquisitionCost: number
  odometerKm?: number
  notes?: string
}

export type UpdateVehiclePayload = Partial<Omit<CreateVehiclePayload, 'licensePlate'>>

export const vehicleApi = {
  getAll: (
    params?: Record<string, unknown>,
  ): Promise<ApiSuccess<{ vehicles: Vehicle[] }> & { meta: PaginationMeta }> =>
    api.get('/vehicles', { params }),

  getAvailable: (
    type?: string,
  ): Promise<
    ApiSuccess<{
      vehicles: Pick<
        Vehicle,
        'id' | 'licensePlate' | 'make' | 'model' | 'type' | 'maxCapacityKg' | 'odometerKm'
      >[]
    }>
  > => api.get('/vehicles/available', { params: { type } }),

  getById: (id: string): Promise<ApiSuccess<{ vehicle: Vehicle }>> => api.get(`/vehicles/${id}`),

  getHistory: (
    id: string,
  ): Promise<ApiSuccess<{ vehicle: Vehicle; summary: Record<string, number> }>> =>
    api.get(`/vehicles/${id}/history`),

  create: (data: CreateVehiclePayload): Promise<ApiSuccess<{ vehicle: Vehicle }>> =>
    api.post('/vehicles', data),

  update: (id: string, data: UpdateVehiclePayload): Promise<ApiSuccess<{ vehicle: Vehicle }>> =>
    api.patch(`/vehicles/${id}`, data),

  retire: (id: string): Promise<ApiSuccess<{ vehicle: Vehicle }>> =>
    api.patch(`/vehicles/${id}/retire`),
}