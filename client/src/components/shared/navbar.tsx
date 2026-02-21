'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOpenMaintenance } from '@/hooks/useData'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Command Center',
  '/dashboard/vehicles': 'Vehicle Registry',
  '/dashboard/trips': 'Trip Dispatcher',
  '/dashboard/trips/new': 'New Trip',
  '/dashboard/drivers': 'Driver Profiles',
  '/dashboard/maintenance': 'Maintenance Logs',
  '/dashboard/expenses': 'Expenses & Fuel',
  '/dashboard/analytics': 'Analytics',
}

export function Navbar() {
  const pathname = usePathname()
  const { data: openLogs } = useOpenMaintenance()

  const title = PAGE_TITLES[pathname] ?? 'FleetFlow'
  const alertCount = openLogs?.length ?? 0

  return (
    <header className="h-12 flex items-center justify-between gap-4 px-5 border-b border-bg-border bg-bg-surface/80 backdrop-blur-sm flex-shrink-0">
      {/* Page title (mobile visible, hidden on large) */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-display font-semibold text-text-primary">{title}</h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search hint */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-bg-base border border-bg-border rounded-md text-text-muted text-xs font-body hover:border-bg-hover transition-colors">
          <Search className="size-3" />
          <span>Search...</span>
          <kbd className="text-[10px] bg-bg-elevated px-1 rounded border border-bg-border">⌘K</kbd>
        </button>

        {/* Alerts bell */}
        <button className="relative flex items-center justify-center size-8 rounded-md hover:bg-bg-elevated transition-colors">
          <Bell className="size-4 text-text-muted" strokeWidth={1.5} />
          {alertCount > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 size-4 rounded-full bg-amber-500 text-bg-base',
              'text-[9px] font-display font-bold flex items-center justify-center',
            )}>
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}