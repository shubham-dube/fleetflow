'use client'

import { useState } from 'react'
import { useDrivers, useUpdateDriverStatus } from '@/hooks/useDrivers'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusPill } from '@/components/shared/StatusPill'
import { PageHeader, LoadingSpinner, EmptyState, ErrorState } from '@/components/shared/UI'
import { Pagination } from '@/components/shared/Pagination'
import { Select } from '@/components/shared/FormComponents'
import { DriverFormDrawer } from '@/components/drivers/DriverFormDrawer'
import { IncidentModal } from '@/components/drivers/IncidentModal'
import { formatDate, formatPercent } from '@/lib/utils'
import { Users, Plus, Filter, Shield, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Driver, DriverStatus } from '@/types/models.types'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ON_DUTY', label: 'On Duty' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

const LICENSE_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'TRUCK', label: 'Truck' },
  { value: 'VAN', label: 'Van' },
  { value: 'BIKE', label: 'Bike' },
]

function SafetyScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  const color = pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-display font-semibold text-text-primary">{score}</span>
    </div>
  )
}

export default function DriversPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<DriverStatus | ''>('')
  const [licenseCategory, setLicenseCategory] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [incidentDriver, setIncidentDriver] = useState<Driver | null>(null)

  const filters = {
    page,
    pageSize: 20,
    ...(status && { status }),
    ...(licenseCategory && { licenseCategory }),
  }
  const { data, isLoading, error } = useDrivers(filters)
  const updateStatus = useUpdateDriverStatus()

  const handleStatusToggle = async (driver: Driver) => {
    const nextStatus = driver.status === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY'
    try {
      await updateStatus.mutateAsync({ id: driver.id, status: nextStatus })
      toast.success(`${driver.name} is now ${nextStatus === 'ON_DUTY' ? 'On Duty' : 'Off Duty'}`)
    } catch {
      toast.error('Failed to update driver status')
    }
  }

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      label: 'Driver',
      render: (row) => (
        <div>
          <p className="text-xs font-body font-semibold text-text-primary">{row.name}</p>
          <p className="text-[10px] text-text-muted">{row.licenseNumber}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (row) => <span className="text-xs">{row.phone}</span>,
    },
    {
      key: 'licenseCategory',
      label: 'License',
      render: (row) => (
        <div>
          <span className="text-xs font-body">{row.licenseCategory}</span>
          <StatusPill status={row.licenseStatus} size="sm" className="ml-2" />
        </div>
      ),
    },
    {
      key: 'licenseExpiryDate',
      label: 'Expires',
      render: (row) => (
        <span className={cn('text-xs', row.licenseStatus === 'EXPIRED' ? 'text-red-400' : row.licenseStatus === 'EXPIRING_SOON' ? 'text-amber-400' : 'text-text-muted')}>
          {formatDate(row.licenseExpiryDate)}
        </span>
      ),
    },
    {
      key: 'safetyScore',
      label: 'Safety Score',
      render: (row) => <SafetyScoreBar score={Number(row.safetyScore)} />,
    },
    {
      key: 'completionRate',
      label: 'Completion',
      render: (row) => (
        <span className="text-xs">{row.totalTrips > 0 ? formatPercent(row.completionRate) : '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-28',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIncidentDriver(row)}
            className="btn-ghost py-1 px-2 text-xs text-amber-400 hover:text-amber-300"
            title="Log incident"
          >
            <AlertCircle className="size-3.5" />
          </button>
          <button
            onClick={() => { setEditDriver(row); setFormOpen(true) }}
            className="btn-ghost py-1 px-2 text-xs"
          >
            Edit
          </button>
          {row.status !== 'SUSPENDED' && (
            <button
              onClick={() => handleStatusToggle(row)}
              className="btn-ghost py-1 px-2 text-xs"
            >
              {row.status === 'ON_DUTY' ? 'Off' : 'On'}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Driver Profiles"
        subtitle={`${data?.meta?.total ?? '—'} drivers registered`}
        action={
          <button
            onClick={() => { setEditDriver(null); setFormOpen(true) }}
            className="btn-primary"
          >
            <Plus className="size-4" />
            Add Driver
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-3 flex items-center gap-3 flex-wrap">
        <Filter className="size-4 text-text-muted flex-shrink-0" />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => { setStatus(e.target.value as DriverStatus | ''); setPage(1) }}
          className="w-40 py-1.5 text-xs"
        />
        <Select
          options={LICENSE_OPTIONS}
          value={licenseCategory}
          onChange={(e) => { setLicenseCategory(e.target.value); setPage(1) }}
          className="w-40 py-1.5 text-xs"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message="Failed to load drivers" />
        ) : !data?.drivers?.length ? (
          <EmptyState
            icon={Users}
            title="No drivers found"
            description="Add your first driver to start dispatching trips"
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data.drivers}
              keyExtractor={(d) => d.id}
            />
            {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </div>

      <DriverFormDrawer
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDriver(null) }}
        driver={editDriver}
      />

      {incidentDriver && (
        <IncidentModal
          driver={incidentDriver}
          onClose={() => setIncidentDriver(null)}
        />
      )}
    </div>
  )
}