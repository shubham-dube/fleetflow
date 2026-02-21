import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tripApi, type CreateTripPayload, type UpdateTripStatusPayload } from '@/lib/trips.api'
import { maintenanceApi, fuelLogApi, type CreateMaintenancePayload, type CreateFuelLogPayload } from '@/lib/maintenance.api'
import { analyticsApi } from '@/lib/analytics.api'
import { QUERY_KEYS } from '@/constants/queryKeys'

// ─── Trips ────────────────────────────────────────────────────────────────────
export const useTrips = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: QUERY_KEYS.trips(filters),
    queryFn: () => tripApi.getAll(filters),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => ({ trips: res.data.trips, meta: res.meta }),
  })

export const useTrip = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.trip(id),
    queryFn: () => tripApi.getById(id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data.trip,
    enabled: !!id,
  })

export const useCreateTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTripPayload) => tripApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export const useUpdateTripStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateTripStatusPayload) =>
      tripApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ─── Maintenance ──────────────────────────────────────────────────────────────
export const useMaintenance = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: QUERY_KEYS.maintenance(filters),
    queryFn: () => maintenanceApi.getAll(filters),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => ({ logs: res.data.logs, meta: res.meta }),
  })

export const useOpenMaintenance = () =>
  useQuery({
    queryKey: QUERY_KEYS.maintenanceOpen,
    queryFn: maintenanceApi.getOpen,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data.logs,
    staleTime: 30_000,
  })

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMaintenancePayload) => maintenanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export const useCompleteMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => maintenanceApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

// ─── Fuel Logs ────────────────────────────────────────────────────────────────
export const useFuelLogs = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: QUERY_KEYS.fuelLogs(filters),
    queryFn: () => fuelLogApi.getAll(filters),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => ({ logs: res.data.logs, meta: res.meta }),
  })

export const useCreateFuelLog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFuelLogPayload) => fuelLogApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] })
    },
  })
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const useDashboard = () =>
  useQuery({
    queryKey: QUERY_KEYS.analyticsDashboard,
    queryFn: analyticsApi.getDashboard,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data,
    staleTime: 1000 * 60, // 1 minute
  })

export const useFleetAnalytics = () =>
  useQuery({
    queryKey: QUERY_KEYS.analyticsFleet,
    queryFn: analyticsApi.getFleet,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data,
  })

export const useFinancialAnalytics = (month?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.analyticsFinancial(month),
    queryFn: () => analyticsApi.getFinancial(month),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data,
  })

export const useTrendAnalytics = () =>
  useQuery({
    queryKey: QUERY_KEYS.analyticsTrend,
    queryFn: analyticsApi.getTrend,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data,
  })