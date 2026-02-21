import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { driverApi, type CreateDriverPayload, type UpdateDriverPayload } from '@/lib/drivers.api'
import { QUERY_KEYS } from '@/constants/queryKeys'

export const useDrivers = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: QUERY_KEYS.drivers(filters),
    queryFn: () => driverApi.getAll(filters),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => ({ drivers: res.data.drivers, meta: res.meta }),
  })

export const useAvailableDrivers = (licenseCategory?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.driversAvailable(licenseCategory),
    queryFn: () => driverApi.getAvailable(licenseCategory),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data.drivers,
    staleTime: 30_000,
    enabled: !!licenseCategory,
  })

export const useDriver = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.driver(id),
    queryFn: () => driverApi.getById(id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data.driver,
    enabled: !!id,
  })

export const useDriverProfile = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.driverProfile(id),
    queryFn: () => driverApi.getProfile(id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res: any) => res.data.driver,
    enabled: !!id,
  })

export const useCreateDriver = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDriverPayload) => driverApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  })
}

export const useUpdateDriver = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDriverPayload) => driverApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.driver(id) })
    },
  })
}

export const useUpdateDriverStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; suspendedReason?: string }) =>
      driverApi.updateStatus(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  })
}

export const useLogIncident = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      driverId,
      ...data
    }: {
      driverId: string
      description: string
      severity: number
      tripId?: string
    }) => driverApi.logIncident(driverId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  })
}