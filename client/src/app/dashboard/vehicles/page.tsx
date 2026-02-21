'use client'

import { useState } from 'react'
import { useVehicles, useRetireVehicle } from '@/hooks/useVehicles'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusPill } from '@/components/shared/StatusPill'
import { PageHeader, LoadingSpinner, EmptyState, ErrorState } from '@/components/shared/UI'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Select } from '@/components/shared/FormComponents'
import { VehicleFormDrawer } from '@/components/vehicles/VehicleFormDrawer'
import { formatOdometer, formatWeight, formatCurrency, formatDate, vehicleTypeLabels } from '@/lib/utils'
import { Truck, Plus, Filter, Ban } from 'lucide-react'
import { toast } from 'sonner'
import type { Vehicle, VehicleStatus, VehicleType } from '@/types/models.types'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'IN_SHOP', label: 'In Shop' },
  { value: 'RETIRED', label: 'Retired' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'TRUCK', label: 'Truck' },
  { value: 'VAN', label: 'Van' },
  { value: 'BIKE', label: 'Bike' },
]

export default function VehiclesPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<VehicleStatus | ''>('')
  const [type, setType] = useState<VehicleType | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [retireTarget, setRetireTarget] = useState<Vehicle | null>(null)

  const filters = { page, pageSize: 20, ...(status && { status }), ...(type && { type }) }
  const { data, isLoading, error } = useVehicles(filters)
  const retireMutation = useRetireVehicle()

  const columns: Column<Vehicle>[] = [
    {
      key: 'licensePlate',
      label: 'License Plate',
      render: (row) => (
        <span className="font-display font-semibold text-text-primary text-xs">
          {row.licensePlate}
        </span>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row) => (
        <div>
          <p className="text-xs font-body text-text-primary">{row.make} {row.model}</p>
          <p className="text-[10px] text-text-muted">{row.year}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span className="text-xs font-body text-text-secondary">{vehicleTypeLabels[row.type]}</span>
      ),
    },
    {
      key: 'maxCapacityKg',
      label: 'Capacity',
      render: (row) => <span className="text-xs">{formatWeight(row.maxCapacityKg)}</span>,
    },
    {
      key: 'odometerKm',
      label: 'Odometer',
      render: (row) => <span className="text-xs">{formatOdometer(row.odometerKm)}</span>,
    },
    {
      key: 'acquisitionCost',
      label: 'Acq. Cost',
      render: (row) => <span className="text-xs">{formatCurrency(row.acquisitionCost)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditVehicle(row); setFormOpen(true) }}
            className="btn-ghost py-1 px-2 text-xs"
          >
            Edit
          </button>
          {row.status !== 'RETIRED' && (
            <button
              onClick={() => setRetireTarget(row)}
              className="btn-ghost py-1 px-2 text-xs text-red-400 hover:text-red-300"
            >
              <Ban className="size-3" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const handleRetire = async () => {
    if (!retireTarget) return
    try {
      await retireMutation.mutateAsync(retireTarget.id)
      toast.success(`${retireTarget.licensePlate} retired successfully`)
      setRetireTarget(null)
    } catch {
      toast.error('Failed to retire vehicle')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Vehicle Registry"
        subtitle={`${data?.meta?.total ?? '—'} vehicles in fleet`}
        action={
          <button
            onClick={() => { setEditVehicle(null); setFormOpen(true) }}
            className="btn-primary"
          >
            <Plus className="size-4" />
            Add Vehicle
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-3 flex items-center gap-3">
        <Filter className="size-4 text-text-muted flex-shrink-0" />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => { setStatus(e.target.value as VehicleStatus | ''); setPage(1) }}
          className="w-40 py-1.5 text-xs"
        />
        <Select
          options={TYPE_OPTIONS}
          value={type}
          onChange={(e) => { setType(e.target.value as VehicleType | ''); setPage(1) }}
          className="w-36 py-1.5 text-xs"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message="Failed to load vehicles" />
        ) : !data?.vehicles?.length ? (
          <EmptyState
            icon={Truck}
            title="No vehicles found"
            description="Add your first vehicle to get started"
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data.vehicles}
              keyExtractor={(v) => v.id}
            />
            {data.meta && (
              <Pagination meta={data.meta} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      {/* Form Drawer */}
      <VehicleFormDrawer
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditVehicle(null) }}
        vehicle={editVehicle}
      />

      {/* Retire confirm */}
      <ConfirmDialog
        open={!!retireTarget}
        onClose={() => setRetireTarget(null)}
        onConfirm={handleRetire}
        title="Retire Vehicle"
        description={`Are you sure you want to retire ${retireTarget?.licensePlate}? This action cannot be undone.`}
        confirmLabel="Retire Vehicle"
        variant="danger"
        isLoading={retireMutation.isPending}
      />
    </div>
  )
}