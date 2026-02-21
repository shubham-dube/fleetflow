import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Loading Spinner ──────────────────────────────────────────────────────────
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  centered?: boolean
}

export function LoadingSpinner({ size = 'md', className, centered = true }: LoadingSpinnerProps) {
  const sizeMap = { sm: 'size-4', md: 'size-6', lg: 'size-8' }
  const spinner = (
    <Loader2 className={cn('animate-spin text-cyan-400', sizeMap[size], className)} />
  )
  if (centered) {
    return (
      <div className="flex items-center justify-center py-12">
        {spinner}
      </div>
    )
  }
  return spinner
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 border-b border-bg-border/60 last:border-0"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={cn(
                'skeleton h-4 rounded',
                j === 0 ? 'w-24' : j === cols - 1 ? 'w-16' : 'flex-1',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title = 'No data found',
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 px-6 text-center', className)}>
      {Icon && (
        <div className="mb-4 rounded-xl p-3 bg-bg-elevated border border-bg-border">
          <Icon className="size-7 text-text-muted" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-display font-semibold text-text-secondary mb-1">{title}</p>
      {description && (
        <p className="text-xs text-text-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string
  retry?: () => void
}

export function ErrorState({ message = 'Something went wrong', retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="mb-3 rounded-xl p-3 bg-red-500/10 border border-red-500/20">
        <span className="text-xl">⚠</span>
      </div>
      <p className="text-sm font-body text-text-secondary mb-1">{message}</p>
      {retry && (
        <button onClick={retry} className="btn-ghost mt-3 text-cyan-400 text-xs">
          Try again
        </button>
      )}
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  breadcrumb?: string
}

export function PageHeader({ title, subtitle, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {breadcrumb && (
          <p className="text-xs text-text-muted font-body mb-1">{breadcrumb}</p>
        )}
        <h1 className="text-xl font-display font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-muted mt-0.5 font-body">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <h2 className="text-sm font-display font-semibold text-text-secondary uppercase tracking-wider">
        {title}
      </h2>
      {action}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-body font-medium',
        variant === 'default'
          ? 'bg-bg-elevated text-text-secondary border border-bg-border'
          : 'border border-bg-border text-text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={cn('border-t border-bg-border', className)} />
}