'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useCreateTrip } from '@/hooks/useData'
import { useAvailableVehicles } from '@/hooks/useVehicles'
import { useAvailableDrivers } from '@/hooks/useDrivers'
import { FormField, Select, Input, Textarea, FormRow, FormSection } from '@/components/shared/FormComponents'
import { PageHeader } from '@/components/shared/UI'
import { AlertTriangle, Loader2, ArrowLeft } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { toast } from 'sonner'
import type { ApiError } from '@/types/api.types'
import Link from 'next/link'

const schema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  driverId: z.string().min(1, 'Select a driver'),
  origin: z.string().min(1, 'Required').max(200),
  destination: z.string().min(1, 'Required').max(200),
  cargoWeightKg: z.coerce.number().positive('Must be positive'),
  cargoDescription: z.string().optional(),
  estimatedFuelCost: z.coerce.number().positive().optional(),
  odometerStart: z.coerce.number().min(0).optional(),
  revenueGenerated: z.coerce.number().positive().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewTripPage() {
  const router = useRouter()
  const createTrip = useCreateTrip()
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | undefined>()
  const [selectedVehicleCapacity, setSelectedVehicleCapacity] = useState<number | null>(null)
  const [cargoWeight, setCargoWeight] = useState(0)

  const { data: vehicles } = useAvailableVehicles()
  const { data: drivers } = useAvailableDrivers(selectedVehicleType)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const watchVehicleId = watch('vehicleId')
  const watchCargo = watch('cargoWeightKg')

  // When vehicle changes, update type + capacity
  useEffect(() => {
    if (watchVehicleId && vehicles) {
      const v = vehicles.find((v) => v.id === watchVehicleId)
      if (v) {
        setSelectedVehicleType(v.type)
        setSelectedVehicleCapacity(Number(v.maxCapacityKg))
        setValue('driverId', '') // reset driver when vehicle changes
      }
    }
  }, [watchVehicleId, vehicles, setValue])

  // Track cargo weight for capacity warning
  useEffect(() => {
    setCargoWeight(Number(watchCargo) || 0)
  }, [watchCargo])

  const capacityWarning =
    selectedVehicleCapacity && cargoWeight > 0
      ? cargoWeight / selectedVehicleCapacity
      : 0

  const vehicleOptions = (vehicles ?? []).map((v) => ({
    value: v.id,
    label: `${v.licensePlate} — ${v.make} ${v.model} (${Number(v.maxCapacityKg).toLocaleString()} kg)`,
  }))

  const driverOptions = (drivers ?? []).map((d) => ({
    value: d.id,
    label: `${d.name} — Score: ${Number(d.safetyScore).toFixed(0)}`,
  }))

  const onSubmit = async (data: FormValues) => {
    try {
      await createTrip.mutateAsync(data)
      toast.success('Trip created successfully!')
      router.push(ROUTES.TRIPS)
    } catch (err) {
      const apiError = err as ApiError
      if (apiError?.error?.details) {
        Object.entries(apiError.error.details).forEach(([field, messages]) => {
          setError(field as keyof FormValues, { message: messages[0] })
        })
      } else {
        toast.error(apiError?.error?.message ?? 'Failed to create trip')
      }
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={ROUTES.TRIPS} className="btn-ghost p-1.5">
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          title="New Trip"
          subtitle="Dispatch a vehicle and driver for a delivery"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Vehicle & Driver */}
        <div className="card p-5 space-y-4">
          <FormSection title="Assignment">
            <FormField label="Vehicle" required error={errors.vehicleId?.message} hint={selectedVehicleCapacity ? `Max capacity: ${selectedVehicleCapacity.toLocaleString()} kg` : undefined}>
              <Select
                {...register('vehicleId')}
                options={vehicleOptions}
                placeholder={vehicles === undefined ? 'Loading vehicles...' : 'Select available vehicle'}
                error={!!errors.vehicleId}
              />
            </FormField>

            <FormField
              label="Driver"
              required
              error={errors.driverId?.message}
              hint={!selectedVehicleType ? 'Select a vehicle first' : driverOptions.length === 0 ? 'No available drivers for this vehicle type' : undefined}
            >
              <Select
                {...register('driverId')}
                options={driverOptions}
                placeholder={!selectedVehicleType ? 'Select vehicle first' : 'Select available driver'}
                error={!!errors.driverId}
                disabled={!selectedVehicleType}
              />
            </FormField>
          </FormSection>
        </div>

        {/* Route */}
        <div className="card p-5 space-y-4">
          <FormSection title="Route">
            <FormRow>
              <FormField label="Origin" required error={errors.origin?.message}>
                <Input {...register('origin')} placeholder="Mumbai, MH" error={!!errors.origin} />
              </FormField>
              <FormField label="Destination" required error={errors.destination?.message}>
                <Input {...register('destination')} placeholder="Pune, MH" error={!!errors.destination} />
              </FormField>
            </FormRow>
            <FormField label="Starting Odometer" error={errors.odometerStart?.message}>
              <Input
                {...register('odometerStart')}
                type="number"
                placeholder="0"
                suffix="km"
                error={!!errors.odometerStart}
              />
            </FormField>
          </FormSection>
        </div>

        {/* Cargo */}
        <div className="card p-5 space-y-4">
          <FormSection title="Cargo">
            <FormField label="Cargo Weight" required error={errors.cargoWeightKg?.message}>
              <Input
                {...register('cargoWeightKg')}
                type="number"
                placeholder="0"
                suffix="kg"
                error={!!errors.cargoWeightKg}
              />
            </FormField>

            {/* Capacity warning */}
            {capacityWarning > 0 && selectedVehicleCapacity && (
              <div
                className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-xs font-body border ${
                  capacityWarning > 1
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : capacityWarning > 0.85
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  {capacityWarning > 1
                    ? `Cargo weight exceeds vehicle capacity of ${selectedVehicleCapacity.toLocaleString()} kg`
                    : capacityWarning > 0.85
                      ? `Cargo is at ${Math.round(capacityWarning * 100)}% of vehicle capacity — close to limit`
                      : `Cargo is within safe range (${Math.round(capacityWarning * 100)}% of capacity)`}
                </span>
              </div>
            )}

            <FormField label="Cargo Description" error={errors.cargoDescription?.message}>
              <Input
                {...register('cargoDescription')}
                placeholder="e.g. Electronics, Furniture..."
                error={!!errors.cargoDescription}
              />
            </FormField>
          </FormSection>
        </div>

        {/* Financials */}
        <div className="card p-5 space-y-4">
          <FormSection title="Financials (Optional)">
            <FormRow>
              <FormField label="Estimated Fuel Cost" error={errors.estimatedFuelCost?.message}>
                <Input
                  {...register('estimatedFuelCost')}
                  type="number"
                  placeholder="0"
                  prefix="₹"
                  error={!!errors.estimatedFuelCost}
                />
              </FormField>
              <FormField label="Expected Revenue" error={errors.revenueGenerated?.message}>
                <Input
                  {...register('revenueGenerated')}
                  type="number"
                  placeholder="0"
                  prefix="₹"
                  error={!!errors.revenueGenerated}
                />
              </FormField>
            </FormRow>
          </FormSection>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={ROUTES.TRIPS} className="btn-secondary flex-1 justify-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || capacityWarning > 1}
            className="btn-primary flex-1 justify-center"
          >
            {isSubmitting ? (
              <><Loader2 className="size-4 animate-spin" /> Creating Trip...</>
            ) : (
              'Create & Dispatch'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}