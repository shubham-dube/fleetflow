'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/useVehicles'
import { FormField, Input, Select, Textarea, FormRow, FormSection } from '@/components/shared/FormComponents'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/types/models.types'
import type { ApiError } from '@/types/api.types'

const schema = z.object({
  licensePlate: z.string().min(1, 'Required').max(20),
  make: z.string().min(1, 'Required').max(50),
  model: z.string().min(1, 'Required').max(50),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  type: z.enum(['TRUCK', 'VAN', 'BIKE']),
  maxCapacityKg: z.coerce.number().positive('Must be positive').max(100000),
  acquisitionCost: z.coerce.number().positive('Must be positive'),
  odometerKm: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// Explicit output type for handleSubmit — avoids resolver mismatch
type SubmitValues = {
  licensePlate: string
  make: string
  model: string
  year: number
  type: 'TRUCK' | 'VAN' | 'BIKE'
  maxCapacityKg: number
  acquisitionCost: number
  odometerKm?: number
  notes?: string
}

interface VehicleFormDrawerProps {
  open: boolean
  onClose: () => void
  vehicle?: Vehicle | null
}

const TYPE_OPTIONS = [
  { value: 'TRUCK', label: 'Truck' },
  { value: 'VAN', label: 'Van' },
  { value: 'BIKE', label: 'Bike' },
]

export function VehicleFormDrawer({ open, onClose, vehicle }: VehicleFormDrawerProps) {
  const isEdit = !!vehicle
  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle(vehicle?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: vehicle
      ? {
          licensePlate: vehicle.licensePlate,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          type: vehicle.type,
          maxCapacityKg: Number(vehicle.maxCapacityKg),
          acquisitionCost: Number(vehicle.acquisitionCost),
          odometerKm: Number(vehicle.odometerKm),
          notes: vehicle.notes ?? '',
        }
      : { year: new Date().getFullYear() },
  })

  useEffect(() => {
    if (vehicle) {
      reset({
        licensePlate: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        maxCapacityKg: Number(vehicle.maxCapacityKg),
        acquisitionCost: Number(vehicle.acquisitionCost),
        odometerKm: Number(vehicle.odometerKm),
        notes: vehicle.notes ?? '',
      })
    } else {
      reset({ year: new Date().getFullYear() })
    }
  }, [vehicle, reset])

  const onSubmit = async (data: SubmitValues) => {
    try {
      if (isEdit) {
        const { licensePlate: _, ...updateData } = data
        await updateMutation.mutateAsync(updateData)
        toast.success('Vehicle updated successfully')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Vehicle added successfully')
      }
      onClose()
      reset()
    } catch (err) {
      const apiError = err as ApiError
      if (apiError?.error?.details) {
        Object.entries(apiError.error.details).forEach(([field, messages]) => {
          setError(field as keyof FormValues, { message: messages[0] })
        })
      } else {
        toast.error(apiError?.error?.message ?? 'Something went wrong')
      }
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-bg-base/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-bg-surface border-l border-bg-border shadow-card',
          'transition-transform duration-300 ease-in-out overflow-y-auto',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border sticky top-0 bg-bg-surface z-10">
          <div>
            <h2 className="text-base font-display font-semibold text-text-primary">
              {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEdit ? `Editing ${vehicle?.licensePlate}` : 'Register a new fleet vehicle'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          <FormSection title="Identification">
            <FormRow>
              <FormField label="License Plate" required error={errors.licensePlate?.message}>
                <Input
                  {...register('licensePlate')}
                  placeholder="MH-05-AB-1234"
                  error={!!errors.licensePlate}
                  disabled={isEdit}
                />
              </FormField>
              <FormField label="Vehicle Type" required error={errors.type?.message}>
                <Select
                  {...register('type')}
                  options={TYPE_OPTIONS}
                  placeholder="Select type"
                  error={!!errors.type}
                />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Make" required error={errors.make?.message}>
                <Input {...register('make')} placeholder="Toyota" error={!!errors.make} />
              </FormField>
              <FormField label="Model" required error={errors.model?.message}>
                <Input {...register('model')} placeholder="Hilux" error={!!errors.model} />
              </FormField>
            </FormRow>
            <FormField label="Year" required error={errors.year?.message} className="w-1/2">
              <Input
                {...register('year')}
                type="number"
                placeholder="2024"
                error={!!errors.year}
              />
            </FormField>
          </FormSection>

          <FormSection title="Specifications">
            <FormRow>
              <FormField label="Max Capacity (kg)" required error={errors.maxCapacityKg?.message}>
                <Input
                  {...register('maxCapacityKg')}
                  type="number"
                  placeholder="1000"
                  suffix="kg"
                  error={!!errors.maxCapacityKg}
                />
              </FormField>
              <FormField label="Current Odometer" error={errors.odometerKm?.message}>
                <Input
                  {...register('odometerKm')}
                  type="number"
                  placeholder="0"
                  suffix="km"
                  error={!!errors.odometerKm}
                />
              </FormField>
            </FormRow>
            <FormField label="Acquisition Cost" required error={errors.acquisitionCost?.message}>
              <Input
                {...register('acquisitionCost')}
                type="number"
                placeholder="500000"
                prefix="₹"
                error={!!errors.acquisitionCost}
              />
            </FormField>
          </FormSection>

          <FormSection title="Additional">
            <FormField label="Notes" error={errors.notes?.message}>
              <Input {...register('notes')} placeholder="Any additional notes..." />
            </FormField>
          </FormSection>

          {/* Footer */}
          <div className="flex gap-3 pt-2 border-t border-bg-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? (
                <><Loader2 className="size-4 animate-spin" /> Saving...</>
              ) : (
                isEdit ? 'Save Changes' : 'Add Vehicle'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}