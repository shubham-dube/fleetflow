'use client'

import { useState } from 'react'
import { useFuelLogs, useCreateFuelLog } from '@/hooks/useData'
import { useVehicles } from '@/hooks/useVehicles'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader, LoadingSpinner, EmptyState, ErrorState } from '@/components/shared/UI'
import { Pagination } from '@/components/shared/Pagination'
import { FormField, Input, Select, FormRow, FormSection } from '@/components/shared/FormComponents'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Fuel, Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { FuelLog } from '@/types/models.types'
import type { ApiError } from '@/types/api.types'

const schema = z.object({
  vehicleId: z.string().min(1, 'Select a vehicle'),
  liters: z.coerce.number().positive('Must be positive'),
  costPerLiter: z.coerce.number().positive('Must be positive'),
  odometerKm: z.coerce.number().min(0, 'Must be 0 or greater'),
  driverName: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function ExpensesPage() {
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)

  const { data, isLoading, error } = useFuelLogs({ page, pageSize: 20 })
  const createFuelLog = useCreateFuelLog()
  const { data: vehiclesData } = useVehicles({ pageSize: 100 })

  const vehicleOptions = (vehiclesData?.vehicles ?? [])
    .filter((v) => v.isActive)
    .map((v) => ({ value: v.id, label: `${v.licensePlate} — ${v.make} ${v.model}` }))

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const liters = watch('liters')
  const costPerLiter = watch('costPerLiter')
  const totalCost = liters && costPerLiter ? (Number(liters) * Number(costPerLiter)).toFixed(2) : '—'

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await createFuelLog.mutateAsync(data)
      const resData = (res as any).data
      const eff = resData?.fuelEfficiency
      toast.success(
        eff
          ? `Fuel logged. Efficiency: ${Number(eff).toFixed(2)} km/L`
          : 'Fuel log created successfully',
      )
      reset()
      setFormOpen(false)
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError?.error?.message ?? 'Failed to log fuel')
    }
  }

  const columns: Column<FuelLog>[] = [
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-text-primary">{row.vehicle.licensePlate}</p>
          <p className="text-[10px] text-text-muted">{row.vehicle.make} {row.vehicle.model}</p>
        </div>
      ),
    },
    {
      key: 'trip',
      label: 'Trip',
      render: (row) => (
        <span className="text-xs text-cyan-400">{row.trip?.tripNumber ?? '—'}</span>
      ),
    },
    {
      key: 'liters',
      label: 'Liters',
      render: (row) => <span className="text-xs">{Number(row.liters).toFixed(1)} L</span>,
    },
    {
      key: 'costPerLiter',
      label: '₹/L',
      render: (row) => <span className="text-xs">₹{Number(row.costPerLiter).toFixed(2)}</span>,
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      render: (row) => (
        <span className="text-xs font-display font-semibold text-text-primary">
          {formatCurrency(row.totalCost)}
        </span>
      ),
    },
    {
      key: 'odometerKm',
      label: 'Odometer',
      render: (row) => <span className="text-xs">{Number(row.odometerKm).toLocaleString()} km</span>,
    },
    {
      key: 'loggedAt',
      label: 'Date',
      render: (row) => <span className="text-xs text-text-muted">{formatDate(row.loggedAt)}</span>,
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Expenses & Fuel"
        subtitle="Track fuel consumption and operational costs"
        action={
          <button onClick={() => setFormOpen(true)} className="btn-primary">
            <Plus className="size-4" />
            Log Fuel
          </button>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message="Failed to load fuel logs" />
        ) : !data?.logs?.length ? (
          <EmptyState
            icon={Fuel}
            title="No fuel logs"
            description="Log fuel fills to track operational costs"
          />
        ) : (
          <>
            <DataTable columns={columns} data={data.logs} keyExtractor={(l) => l.id} />
            {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* Form Drawer */}
      {formOpen && <div className="fixed inset-0 z-40 bg-bg-base/60 backdrop-blur-sm" onClick={() => setFormOpen(false)} />}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-bg-surface border-l border-bg-border shadow-card',
          'transition-transform duration-300 ease-in-out overflow-y-auto',
          formOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border sticky top-0 bg-bg-surface z-10">
          <h2 className="text-base font-display font-semibold text-text-primary">Log Fuel Fill</h2>
          <button onClick={() => setFormOpen(false)} className="btn-ghost p-1.5"><X className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          <FormSection title="Fuel Details">
            <FormField label="Vehicle" required error={errors.vehicleId?.message}>
              <Select {...register('vehicleId')} options={vehicleOptions} placeholder="Select vehicle" error={!!errors.vehicleId} />
            </FormField>
            <FormRow>
              <FormField label="Liters" required error={errors.liters?.message}>
                <Input {...register('liters')} type="number" step="0.01" placeholder="0.00" suffix="L" error={!!errors.liters} />
              </FormField>
              <FormField label="Cost per Liter" required error={errors.costPerLiter?.message}>
                <Input {...register('costPerLiter')} type="number" step="0.001" placeholder="0.00" prefix="₹" error={!!errors.costPerLiter} />
              </FormField>
            </FormRow>
            {totalCost !== '—' && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-md px-3 py-2 text-xs font-body text-cyan-400">
                Total cost: <span className="font-display font-bold">₹{totalCost}</span>
              </div>
            )}
            <FormField label="Odometer Reading" required error={errors.odometerKm?.message}>
              <Input {...register('odometerKm')} type="number" placeholder="0" suffix="km" error={!!errors.odometerKm} />
            </FormField>
          </FormSection>
          <FormSection title="Optional">
            <FormField label="Driver Name" error={errors.driverName?.message}>
              <Input {...register('driverName')} placeholder="Driver who filled" />
            </FormField>
            <FormField label="Notes" error={errors.notes?.message}>
              <Input {...register('notes')} placeholder="Notes..." />
            </FormField>
          </FormSection>
          <div className="flex gap-3 pt-2 border-t border-bg-border">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : 'Log Fuel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}