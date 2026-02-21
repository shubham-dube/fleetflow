import { cn } from '@/lib/utils'
import type { VehicleStatus, DriverStatus, TripStatus, LicenseStatus } from '@/types/models.types'

type StatusValue = VehicleStatus | DriverStatus | TripStatus | LicenseStatus

const STATUS_MAP: Record<
  StatusValue,
  { label: string; bg: string; text: string; dot: string }
> = {
  // Vehicle
  AVAILABLE:    { label: 'Available',  bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  ON_TRIP:      { label: 'On Trip',    bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
  IN_SHOP:      { label: 'In Shop',    bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
  RETIRED:      { label: 'Retired',    bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400'     },
  // Driver
  ON_DUTY:      { label: 'On Duty',    bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  OFF_DUTY:     { label: 'Off Duty',   bg: 'bg-slate-500/10',   text: 'text-slate-400',   dot: 'bg-slate-400'   },
  SUSPENDED:    { label: 'Suspended',  bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400'     },
  // Trip
  DRAFT:        { label: 'Draft',      bg: 'bg-slate-500/10',   text: 'text-slate-400',   dot: 'bg-slate-400'   },
  DISPATCHED:   { label: 'Dispatched', bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
  IN_TRANSIT:   { label: 'In Transit', bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    dot: 'bg-cyan-400'    },
  COMPLETED:    { label: 'Completed',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  dot: 'bg-violet-400'  },
  CANCELLED:    { label: 'Cancelled',  bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400'     },
  // License
  VALID:        { label: 'Valid',      bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  EXPIRING_SOON:{ label: 'Expiring',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
  EXPIRED:      { label: 'Expired',    bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400'     },
}

interface StatusPillProps {
  status: StatusValue
  showDot?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function StatusPill({ status, showDot = true, size = 'sm', className }: StatusPillProps) {
  const config = STATUS_MAP[status]
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-body font-medium',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      {showDot && (
        <span className={cn('size-1.5 rounded-full flex-shrink-0', config.dot)} />
      )}
      {config.label}
    </span>
  )
}