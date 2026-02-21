import api from './api'
import type { DashboardData, FleetAnalytics, FinancialSummary, TrendData } from '@/types/models.types'
import type { ApiSuccess } from '@/types/api.types'

export const analyticsApi = {
  getDashboard: (): Promise<ApiSuccess<DashboardData>> => api.get('/analytics/dashboard'),

  getFleet: (): Promise<ApiSuccess<FleetAnalytics>> => api.get('/analytics/fleet'),

  getFinancial: (month?: string): Promise<ApiSuccess<FinancialSummary>> =>
    api.get('/analytics/financial', { params: { month } }),

  getTrend: (): Promise<ApiSuccess<TrendData>> => api.get('/analytics/trend'),

  exportCsv: (month: string): Promise<Blob> =>
    api.get('/analytics/export', {
      params: { month, type: 'csv' },
      responseType: 'blob',
    }),
}