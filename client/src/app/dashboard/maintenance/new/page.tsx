'use client'

import { useState } from 'react'
import { useMaintenance, useCompleteMaintenance } from '@/hooks/useData'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusPill } from '@/components/shared/StatusPill'
import { PageHeader, LoadingSpinner, EmptyState, ErrorState, Badge } from '@/components/shared/UI'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { MaintenanceFormDrawer } from '@/components/maintenance/MaintenanceFormDrawer'
import { formatDate, formatCurrency, serviceTypeLabels } from '@/lib/utils'
import { Wrench, Plus, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { MaintenanceLog } from '@/types/models.types'

export default function MaintenancePage() {
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [completeTarget, setCompleteTarget] = useState<MaintenanceLog | null>(null)

  const { data, isLoading, error } = useMaintenance({ page, pageSize: 20 })
  const completeMutation = useCompleteMaintenance()

  const handleComplete = async () => {
    if (!completeTarget) return
    try {
      const res = await completeMutation.mutateAsync(completeTarget.id)
      const data = (res as any).data
      toast.success(
        data?.vehicleRestored
          ? `Service completed — ${completeTarget.vehicle.licensePlate} is now Available`
          : `Service completed — ${data?.remainingOpenLogs} open log(s) remaining`,
      )
      setCompleteTarget(null)
    } catch {
      toast.error('Failed to complete service')
    }
  }

  const columns: Column<MaintenanceLog>[] = [
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row) => (
        <div>
          <p className="text-xs font-body font-semibold text-text-primary">{row.vehicle.licensePlate}</p>
          <p className="text-[10px] text-text-muted">{row.vehicle.make} {row.vehicle.model}</p>
        </div>
      ),
    },
    {
      key: 'serviceType',
      label: 'Service Type',
      render: (row) => (
        <Badge>{serviceTypeLabels[row.serviceType] ?? row.serviceType}</Badge>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="text-xs text-text-secondary max-w-xs truncate block">{row.description}</span>
      ),
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (row) => (
        <span className="text-xs font-display font-semibold text-text-primary">{formatCurrency(row.cost)}</span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (row) => <span className="text-xs text-text-muted">{row.vendor ?? '—'}</span>,
    },
    {
      key: 'serviceDate',
      label: 'Date',
      render: (row) => <span className="text-xs">{formatDate(row.serviceDate)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={cn(
            'text-xs font-body font-medium px-2 py-0.5 rounded-md',
            row.completedAt
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-amber-500/10 text-amber-400',
          )}
        >
          {row.completedAt ? 'Completed' : 'In Progress'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          {!row.completedAt && (
            <button
              onClick={() => setCompleteTarget(row)}
              className="flex items-center gap-1 btn-ghost py-1 px-2 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <CheckCircle className="size-3.5" />
              Done
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Maintenance Logs"
        subtitle="Track vehicle service history"
        action={
          <button onClick={() => setFormOpen(true)} className="btn-primary">
            <Plus className="size-4" />
            Log Service
          </button>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message="Failed to load maintenance logs" />
        ) : !data?.logs?.length ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance logs"
            description="Log a service to track vehicle health"
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data.logs}
              keyExtractor={(l) => l.id}
            />
            {data.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </div>

      <MaintenanceFormDrawer open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleComplete}
        title="Mark Service Complete"
        description={`Mark service for ${completeTarget?.vehicle.licensePlate} as completed? If no other open logs exist, the vehicle will be restored to Available.`}
        confirmLabel="Mark Complete"
        variant="default"
        isLoading={completeMutation.isPending}
      />
    </div>
  )
}