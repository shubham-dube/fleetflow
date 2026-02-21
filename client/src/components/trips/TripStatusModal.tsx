'use client'

import { useState } from 'react'
import { useUpdateTripStatus } from '@/hooks/useData'
import { StatusPill } from '@/components/shared/StatusPill'
import { FormField, Input, Textarea } from '@/components/shared/FormComponents'
import { X, MapPin, Truck, User, Package, Loader2, ChevronRight } from 'lucide-react'
import { formatWeight, formatDate, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Trip, TripStatus } from '@/types/models.types'

interface TripStatusModalProps {
  trip: Trip
  onClose: () => void
}

type TripAction = { status: TripStatus; label: string; needsOdometer?: boolean; needsReason?: boolean }

const NEXT_STATUSES: Partial<Record<TripStatus, TripAction[]>> = {
  DRAFT: [{ status: 'DISPATCHED', label: 'Dispatch Trip' }, { status: 'CANCELLED', label: 'Cancel Trip', needsReason: true }],
  DISPATCHED: [{ status: 'IN_TRANSIT', label: 'Mark In Transit' }, { status: 'CANCELLED', label: 'Cancel Trip', needsReason: true }],
  IN_TRANSIT: [{ status: 'COMPLETED', label: 'Complete Trip', needsOdometer: true }],
}

export function TripStatusModal({ trip, onClose }: TripStatusModalProps) {
  const updateStatus = useUpdateTripStatus()
  const [selectedAction, setSelectedAction] = useState<TripAction | null>(null)
  const [odometerEnd, setOdometerEnd] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [revenue, setRevenue] = useState('')

  const actions = NEXT_STATUSES[trip.status] ?? []

  const handleAction = async () => {
    if (!selectedAction) return
    try {
      await updateStatus.mutateAsync({
        id: trip.id,
        status: selectedAction.status,
        ...(selectedAction.needsOdometer && odometerEnd ? { odometerEnd: Number(odometerEnd) } : {}),
        ...(selectedAction.needsReason && cancellationReason ? { cancellationReason } : {}),
        ...(revenue ? { revenueGenerated: Number(revenue) } : {}),
      })
      toast.success(`Trip ${trip.tripNumber} updated to ${selectedAction.status}`)
      onClose()
    } catch {
      toast.error('Failed to update trip status')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card p-5 animate-fade-in shadow-card">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold text-cyan-400 text-sm">{trip.tripNumber}</span>
              <StatusPill status={trip.status} />
            </div>
            <p className="text-xs text-text-muted font-body">Created {formatDate(trip.createdAt)}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="size-4" />
          </button>
        </div>

        {/* Trip details */}
        <div className="card bg-bg-elevated p-3 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <MapPin className="size-3.5 text-cyan-400 flex-shrink-0" />
            <span>{trip.origin}</span>
            <ChevronRight className="size-3 text-text-muted" />
            <span>{trip.destination}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Truck className="size-3.5 text-text-muted flex-shrink-0" />
            <span>{trip.vehicle.licensePlate} — {trip.vehicle.make} {trip.vehicle.model}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <User className="size-3.5 text-text-muted flex-shrink-0" />
            <span>{trip.driver.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Package className="size-3.5 text-text-muted flex-shrink-0" />
            <span>{formatWeight(trip.cargoWeightKg)}</span>
            {trip.cargoDescription && <span className="text-text-muted">— {trip.cargoDescription}</span>}
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 ? (
          <div className="space-y-4">
            <div>
              <p className="label-base mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => setSelectedAction(selectedAction?.status === action.status ? null : action)}
                    className={`text-xs px-3 py-1.5 rounded-md border font-body font-medium transition-all ${
                      selectedAction?.status === action.status
                        ? action.status === 'CANCELLED'
                          ? 'bg-red-500/15 border-red-500/40 text-red-400'
                          : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                        : 'bg-bg-elevated border-bg-border text-text-secondary hover:border-bg-hover'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional inputs */}
            {selectedAction?.needsOdometer && (
              <FormField label="Final Odometer Reading" hint="Enter the odometer at trip end">
                <Input
                  type="number"
                  value={odometerEnd}
                  onChange={(e) => setOdometerEnd(e.target.value)}
                  placeholder="Enter km"
                  suffix="km"
                />
              </FormField>
            )}

            {selectedAction?.status === 'COMPLETED' && (
              <FormField label="Revenue Generated" hint="Optional — leave blank if unknown">
                <Input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="0"
                  prefix="₹"
                />
              </FormField>
            )}

            {selectedAction?.needsReason && (
              <FormField label="Cancellation Reason" required>
                <Input
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                />
              </FormField>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={handleAction}
                disabled={!selectedAction || updateStatus.isPending || (selectedAction.needsReason && !cancellationReason)}
                className="btn-primary flex-1 justify-center"
              >
                {updateStatus.isPending ? <><Loader2 className="size-4 animate-spin" /> Updating...</> : 'Update Status'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-text-muted font-body">
            No further actions available for this trip.
          </div>
        )}
      </div>
    </div>
  )
}