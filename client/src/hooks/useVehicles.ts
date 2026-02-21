import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehicleApi, type CreateVehiclePayload, type UpdateVehiclePayload } from '@/lib/vehicles.api'
import { QUERY_KEYS } from '@/constants/queryKeys'

export const useVehicles = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: QUERY_KEYS.vehicles(filters),
    queryFn: () => vehicleApi.getAll(filters),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => ({ vehicles: res.data.vehicles, meta: res.meta }),
  })

export const useAvailableVehicles = (type?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.vehiclesAvailable(type),
    queryFn: () => vehicleApi.getAvailable(type),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data.vehicles,
    staleTime: 30_000, // 30s — availability changes frequently
  })

export const useVehicle = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.vehicle(id),
    queryFn: () => vehicleApi.getById(id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data.vehicle,
    enabled: !!id,
  })

export const useVehicleHistory = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.vehicleHistory(id),
    queryFn: () => vehicleApi.getHistory(id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => ({ vehicle: res.data.vehicle, summary: res.data.summary }),
    enabled: !!id,
  })

export const useCreateVehicle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVehiclePayload) => vehicleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export const useUpdateVehicle = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateVehiclePayload) => vehicleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicle(id) })
    },
  })
}

export const useRetireVehicle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vehicleId: string) => vehicleApi.retire(vehicleId),
    onSuccess: (_data, vehicleId) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicle(vehicleId) })
    },
  })
}