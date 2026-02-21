'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateDriver, useUpdateDriver } from '@/hooks/useDrivers'
import { FormField, Input, Select, FormRow, FormSection } from '@/components/shared/FormComponents'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Driver } from '@/types/models.types'
import type { ApiError } from '@/types/api.types'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().min(10, 'Enter valid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  licenseNumber: z.string().min(1, 'Required'),
  licenseCategory: z.enum(['TRUCK', 'VAN', 'BIKE']),
  licenseExpiryDate: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

const CATEGORY_OPTIONS = [
  { value: 'TRUCK', label: 'Truck' },
  { value: 'VAN', label: 'Van' },
  { value: 'BIKE', label: 'Bike' },
]

interface DriverFormDrawerProps {
  open: boolean
  onClose: () => void
  driver?: Driver | null
}

export function DriverFormDrawer({ open, onClose, driver }: DriverFormDrawerProps) {
  const isEdit = !!driver
  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver(driver?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: driver
      ? {
          name: driver.name,
          phone: driver.phone,
          email: driver.email ?? '',
          licenseNumber: driver.licenseNumber,
          licenseCategory: driver.licenseCategory,
          licenseExpiryDate: driver.licenseExpiryDate.split('T')[0],
        }
      : undefined,
  })

  useEffect(() => {
    if (driver) {
      reset({
        name: driver.name,
        phone: driver.phone,
        email: driver.email ?? '',
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.licenseCategory,
        licenseExpiryDate: driver.licenseExpiryDate.split('T')[0],
      })
    } else {
      reset({})
    }
  }, [driver, reset])

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data)
        toast.success('Driver updated successfully')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Driver added successfully')
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-bg-base/60 backdrop-blur-sm" onClick={onClose} />
      )}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-bg-surface border-l border-bg-border shadow-card',
          'transition-transform duration-300 ease-in-out overflow-y-auto',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border sticky top-0 bg-bg-surface z-10">
          <div>
            <h2 className="text-base font-display font-semibold text-text-primary">
              {isEdit ? 'Edit Driver' : 'Add Driver'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEdit ? `Editing ${driver?.name}` : 'Register a new fleet driver'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          <FormSection title="Personal Info">
            <FormField label="Full Name" required error={errors.name?.message}>
              <Input {...register('name')} placeholder="John Doe" error={!!errors.name} />
            </FormField>
            <FormRow>
              <FormField label="Phone" required error={errors.phone?.message}>
                <Input {...register('phone')} placeholder="+91 98765 43210" error={!!errors.phone} />
              </FormField>
              <FormField label="Email" error={errors.email?.message}>
                <Input {...register('email')} type="email" placeholder="john@example.com" />
              </FormField>
            </FormRow>
          </FormSection>

          <FormSection title="License Details">
            <FormField label="License Number" required error={errors.licenseNumber?.message}>
              <Input {...register('licenseNumber')} placeholder="MH-1234567890" error={!!errors.licenseNumber} />
            </FormField>
            <FormRow>
              <FormField label="License Category" required error={errors.licenseCategory?.message}>
                <Select
                  {...register('licenseCategory')}
                  options={CATEGORY_OPTIONS}
                  placeholder="Select category"
                  error={!!errors.licenseCategory}
                />
              </FormField>
              <FormField label="Expiry Date" required error={errors.licenseExpiryDate?.message}>
                <Input
                  {...register('licenseExpiryDate')}
                  type="date"
                  error={!!errors.licenseExpiryDate}
                />
              </FormField>
            </FormRow>
          </FormSection>

          <div className="flex gap-3 pt-2 border-t border-bg-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? (
                <><Loader2 className="size-4 animate-spin" /> Saving...</>
              ) : (
                isEdit ? 'Save Changes' : 'Add Driver'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}