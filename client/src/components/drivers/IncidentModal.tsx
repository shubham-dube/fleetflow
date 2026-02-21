'use client'

import { useState } from 'react'
import { useLogIncident } from '@/hooks/useDrivers'
import { FormField, Input, Select } from '@/components/shared/FormComponents'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Driver } from '@/types/models.types'

const SEVERITY_OPTIONS = [
  { value: '1', label: 'Severity 1 — Minor (-2 pts)' },
  { value: '2', label: 'Severity 2 — Low (-5 pts)' },
  { value: '3', label: 'Severity 3 — Moderate (-10 pts)' },
  { value: '4', label: 'Severity 4 — High (-20 pts)' },
  { value: '5', label: 'Severity 5 — Critical (-35 pts)' },
]

interface IncidentModalProps {
  driver: Driver
  onClose: () => void
}

export function IncidentModal({ driver, onClose }: IncidentModalProps) {
  const logIncident = useLogIncident()
  const [severity, setSeverity] = useState('1')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    try {
      const res = await logIncident.mutateAsync({
        driverId: driver.id,
        severity: Number(severity),
        description: description.trim(),
      })
      toast.success(`Incident logged. New safety score: ${(res as any).data?.newSafetyScore ?? 'updated'}`)
      onClose()
    } catch {
      toast.error('Failed to log incident')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm card p-5 animate-fade-in shadow-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2 bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="size-4 text-amber-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-text-primary">Log Incident</h3>
              <p className="text-xs text-text-muted">{driver.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-bg-elevated rounded-md px-3 py-2 text-xs text-text-secondary font-body border border-bg-border">
            Current safety score:{' '}
            <span className="font-display font-bold text-text-primary">{Number(driver.safetyScore).toFixed(0)}</span>
          </div>

          <FormField label="Severity" required>
            <Select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              options={SEVERITY_OPTIONS}
            />
          </FormField>

          <FormField label="Description" required>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident..."
              required
            />
          </FormField>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              type="submit"
              disabled={logIncident.isPending || !description.trim()}
              className="btn-destructive flex-1 justify-center"
            >
              {logIncident.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Logging...</>
              ) : (
                'Log Incident'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}