import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  accent?: 'cyan' | 'amber' | 'red' | 'emerald' | 'violet' | 'blue'
  className?: string
}

const accentMap = {
  cyan:    { icon: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20'    },
  amber:   { icon: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  red:     { icon: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  violet:  { icon: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
  blue:    { icon: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
}

export function KPICard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  accent = 'cyan',
  className,
}: KPICardProps) {
  const colors = accentMap[accent]

  return (
    <div
      className={cn(
        'card group relative overflow-hidden transition-all duration-200',
        'hover:shadow-card-hover hover:-translate-y-0.5',
        className,
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className={cn('flex-shrink-0 rounded-lg p-2.5 border', colors.bg, colors.border)}>
          <Icon className={cn('size-5', colors.icon)} strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="label-base mb-1">{label}</p>
          <p className={cn('text-2xl font-display font-bold text-text-primary leading-none')}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-text-muted mt-1 font-body">{subtext}</p>
          )}
        </div>

        {/* Trend */}
        {trend && (
          <div
            className={cn(
              'flex-shrink-0 text-xs font-body font-medium px-1.5 py-0.5 rounded',
              trend.value >= 0
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10',
            )}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </div>
  )
}