import api from './api'
import type { Driver } from '@/types/models.types'
import type { ApiSuccess, PaginationMeta } from '@/types/api.types'

export type CreateDriverPayload = {
  name: string
  phone: string
  email?: string
  licenseNumber: string
  licenseCategory: string
  licenseExpiryDate: string
}

export type UpdateDriverPayload = Partial<CreateDriverPayload>

export const driverApi = {
  getAll: (
    params?: Record<string, unknown>,
  ): Promise<ApiSuccess<{ drivers: Driver[] }> & { meta: PaginationMeta }> =>
    api.get('/drivers', { params }),

  getAvailable: (
    licenseCategory?: string,
  ): Promise<ApiSuccess<{ drivers: Pick<Driver, 'id' | 'name' | 'phone' | 'licenseCategory' | 'safetyScore'>[] }>> =>
    api.get('/drivers/available', { params: { licenseCategory } }),

  getById: (id: string): Promise<ApiSuccess<{ driver: Driver }>> => api.get(`/drivers/${id}`),

  getProfile: (id: string): Promise<ApiSuccess<{ driver: Driver }>> =>
    api.get(`/drivers/${id}/profile`),

  create: (data: CreateDriverPayload): Promise<ApiSuccess<{ driver: Driver }>> =>
    api.post('/drivers', data),

  update: (id: string, data: UpdateDriverPayload): Promise<ApiSuccess<{ driver: Driver }>> =>
    api.patch(`/drivers/${id}`, data),

  updateStatus: (
    id: string,
    data: { status: string; suspendedReason?: string },
  ): Promise<ApiSuccess<{ driver: Driver }>> => api.patch(`/drivers/${id}/status`, data),

  logIncident: (
    id: string,
    data: { description: string; severity: number; tripId?: string; reportedBy?: string },
  ): Promise<ApiSuccess<{ incident: unknown; newSafetyScore: number; penaltyApplied: number }>> =>
    api.post(`/drivers/${id}/incidents`, data),

  deactivate: (id: string): Promise<ApiSuccess<null>> => api.patch(`/drivers/${id}/deactivate`),
}