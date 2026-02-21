'use client'

import { cn } from '@/lib/utils'
import { X, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
  isLoading,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm card p-5 animate-fade-in shadow-card">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 btn-ghost p-1 text-text-muted hover:text-text-primary"
        >
          <X className="size-4" />
        </button>

        {/* Icon */}
        <div
          className={cn(
            'mb-4 inline-flex rounded-lg p-2.5 border',
            variant === 'danger'
              ? 'bg-red-500/10 border-red-500/20'
              : variant === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-bg-elevated border-bg-border',
          )}
        >
          <AlertTriangle
            className={cn(
              'size-5',
              variant === 'danger'
                ? 'text-red-400'
                : variant === 'warning'
                  ? 'text-amber-400'
                  : 'text-text-secondary',
            )}
            strokeWidth={1.5}
          />
        </div>

        <h3 className="text-base font-display font-semibold text-text-primary mb-1.5">{title}</h3>
        <p className="text-sm text-text-muted font-body mb-5">{description}</p>

        <div className="flex items-center gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              variant === 'danger' ? 'btn-destructive' : 'btn-primary',
              'disabled:opacity-50',
            )}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}