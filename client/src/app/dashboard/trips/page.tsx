'use client'

import { useState } from 'react'
import { useTrips, useUpdateTripStatus } from '@/hooks/useData'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusPill } from '@/components/shared/StatusPill'
import { PageHeader, LoadingSpinner, EmptyState, ErrorState } from '@/components/shared/UI'
import { Pagination } from '@/components/shared/Pagination'
import { Select } from '@/components/shared/FormComponents'
import { formatDate, formatWeight, truncate } from '@/lib/utils'
import { Route, Plus, Filter } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { TripStatusModal } from '@/components/trips/TripStatusModal'
import type { Trip, TripStatus } from '@/types/models.types'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function TripsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<TripStatus | ''>('')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  const filters = { page, pageSize: 20, ...(status && { status }) }
  const { data, isLoading, error } = useTrips(filters)

  const columns: Column<Trip>[] = [
    {
      key: 'tripNumber',
      label: 'Trip #',
      render: (row) => (
        <span className="font-display font-semibold text-cyan-400 text-xs">{row.tripNumber}</span>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row) => (
        <div>
          <p className="text-xs text-text-primary font-body">{row.vehicle.licensePlate}</p>
          <p className="text-[10px] text-text-muted">
            {row.vehicle.make} {row.vehicle.model}
          </p>
        </div>
      ),
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (row) => (
        <span className="text-xs">{row.driver.name}</span>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-text-primary">{truncate(row.origin, 12)}</span>
          <span className="text-text-muted">→</span>
          <span className="text-text-primary">{truncate(row.destination, 12)}</span>
        </div>
      ),
    },
    {
      key: 'cargoWeightKg',
      label: 'Cargo',
      render: (row) => <span className="text-xs">{formatWeight(row.cargoWeightKg)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => <span className="text-xs text-text-muted">{formatDate(row.createdAt)}</span>,
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Trip Dispatcher"
        subtitle={`${data?.meta?.total ?? '—'} total trips`}
        action={
          <Link href={ROUTES.NEW_TRIP} className="btn-primary">
            <Plus className="size-4" />
            New Trip
          </Link>
        }
      />

      {/* Filters */}
      <div className="card p-3 flex items-center gap-3">
        <Filter className="size-4 text-text-muted flex-shrink-0" />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => { setStatus(e.target.value as TripStatus | ''); setPage(1) }}
          className="w-44 py-1.5 text-xs"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message="Failed to load trips" />
        ) : !data?.trips?.length ? (
          <EmptyState
            icon={Route}
            title="No trips found"
            description="Create a new trip to dispatch a vehicle"
            action={
              <Link href={ROUTES.NEW_TRIP} className="btn-primary">
                <Plus className="size-4" /> New Trip
              </Link>
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data.trips}
              keyExtractor={(t) => t.id}
              onRowClick={(t) => setSelectedTrip(t)}
            />
            {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* Trip status modal */}
      {selectedTrip && (
        <TripStatusModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
  )
}