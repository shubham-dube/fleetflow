'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateMaintenance } from '@/hooks/useData'
import { useVehicles } from '@/hooks/useVehicles'
import { FormField, Input, Select, Textarea, FormRow, FormSection } from '@/components/shared/FormComponents'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ApiError } from '@/types/api.types'

const schema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  serviceType: z.enum(['OIL_CHANGE','TIRE_ROTATION','BRAKE_SERVICE','ENGINE_REPAIR','ELECTRICAL','BODY_WORK','INSPECTION','OTHER']),
  description: z.string().min(1, 'Required'),
  cost: z.coerce.number().positive('Must be positive'),
  vendor: z.string().optional(),
  serviceDate: z.string().min(1, 'Required'),
  odometerAtService: z.coerce.number().min(0).optional(),
})

type FormValues = z.infer<typeof schema>

const SERVICE_TYPE_OPTIONS = [
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'TIRE_ROTATION', label: 'Tire Rotation' },
  { value: 'BRAKE_SERVICE', label: 'Brake Service' },
  { value: 'ENGINE_REPAIR', label: 'Engine Repair' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'BODY_WORK', label: 'Body Work' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'OTHER', label: 'Other' },
]

interface MaintenanceFormDrawerProps {
  open: boolean
  onClose: () => void
  preselectedVehicleId?: string
}

export function MaintenanceFormDrawer({ open, onClose, preselectedVehicleId }: MaintenanceFormDrawerProps) {
  const createMutation = useCreateMaintenance()
  const { data: vehiclesData } = useVehicles({ pageSize: 100 })

  const vehicleOptions = (vehiclesData?.vehicles ?? [])
    .filter((v) => v.isActive)
    .map((v) => ({ value: v.id, label: `${v.licensePlate} — ${v.make} ${v.model}` }))

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: preselectedVehicleId ?? '',
      serviceDate: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Maintenance log created. Vehicle status set to In Shop.')
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

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-bg-base/60 backdrop-blur-sm" onClick={onClose} />}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-bg-surface border-l border-bg-border shadow-card',
          'transition-transform duration-300 ease-in-out overflow-y-auto',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border sticky top-0 bg-bg-surface z-10">
          <div>
            <h2 className="text-base font-display font-semibold text-text-primary">Log Service</h2>
            <p className="text-xs text-text-muted mt-0.5">Vehicle will be set to In Shop</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="size-4" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          <FormSection title="Service Details">
            <FormField label="Vehicle" required error={errors.vehicleId?.message}>
              <Select
                {...register('vehicleId')}
                options={vehicleOptions}
                placeholder="Select vehicle"
                error={!!errors.vehicleId}
              />
            </FormField>
            <FormField label="Service Type" required error={errors.serviceType?.message}>
              <Select
                {...register('serviceType')}
                options={SERVICE_TYPE_OPTIONS}
                placeholder="Select service type"
                error={!!errors.serviceType}
              />
            </FormField>
            <FormField label="Description" required error={errors.description?.message}>
              <Input
                {...register('description')}
                placeholder="Describe the service performed..."
                error={!!errors.description}
              />
            </FormField>
          </FormSection>

          <FormSection title="Details">
            <FormRow>
              <FormField label="Cost" required error={errors.cost?.message}>
                <Input {...register('cost')} type="number" prefix="₹" placeholder="0" error={!!errors.cost} />
              </FormField>
              <FormField label="Vendor" error={errors.vendor?.message}>
                <Input {...register('vendor')} placeholder="Service center name" />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Service Date" required error={errors.serviceDate?.message}>
                <Input {...register('serviceDate')} type="date" error={!!errors.serviceDate} />
              </FormField>
              <FormField label="Odometer" error={errors.odometerAtService?.message}>
                <Input {...register('odometerAtService')} type="number" placeholder="0" suffix="km" />
              </FormField>
            </FormRow>
          </FormSection>

          <div className="flex gap-3 pt-2 border-t border-bg-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : 'Log Service'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}