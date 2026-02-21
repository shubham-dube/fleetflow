'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import {
  LayoutDashboard,
  Truck,
  Route,
  Users,
  Wrench,
  Fuel,
  BarChart3,
  LogOut,
  Zap,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Command Center',  href: ROUTES.DASHBOARD,    icon: LayoutDashboard, roles: null },
  { label: 'Vehicle Registry', href: ROUTES.VEHICLES,   icon: Truck,           roles: null },
  { label: 'Trip Dispatcher',  href: ROUTES.TRIPS,       icon: Route,           roles: ['MANAGER', 'DISPATCHER'] },
  { label: 'Drivers',          href: ROUTES.DRIVERS,     icon: Users,           roles: null },
  { label: 'Maintenance',      href: ROUTES.MAINTENANCE,  icon: Wrench,          roles: null },
  { label: 'Expenses & Fuel',  href: ROUTES.EXPENSES,    icon: Fuel,            roles: null },
  { label: 'Analytics',        href: ROUTES.ANALYTICS,   icon: BarChart3,       roles: ['MANAGER', 'ANALYST'] },
]

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  ANALYST: 'Analyst',
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  )

  return (
    <aside className="flex flex-col w-56 h-screen bg-bg-surface border-r border-bg-border flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-bg-border">
        <div className="flex items-center justify-center size-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
          <Zap className="size-4 text-cyan-400" strokeWidth={2} />
        </div>
        <div>
          <span className="font-display font-bold text-text-primary text-base tracking-tight">
            Fleet<span className="text-cyan-400">Flow</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <p className="label-base px-2 pb-2 pt-1">Navigation</p>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-body font-medium transition-all duration-150',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              )}
            >
              <item.icon
                className={cn('size-4 flex-shrink-0', isActive ? 'text-cyan-400' : '')}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="size-3 text-cyan-500 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-bg-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md mb-1">
          <div className="size-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-display font-bold text-cyan-400">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-body font-semibold text-text-primary truncate">
              {user?.name ?? 'User'}
            </p>
            <p className="text-[10px] text-text-muted truncate">
              {user?.role ? ROLE_LABELS[user.role] : ''}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs font-body text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}