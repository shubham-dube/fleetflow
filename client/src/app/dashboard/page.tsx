'use client'

import { useDashboard, useTrips } from '@/hooks/useData'
import { KPICard } from '@/components/shared/KPICard'
import { StatusPill } from '@/components/shared/StatusPill'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader, LoadingSpinner, ErrorState, SectionHeader } from '@/components/shared/UI'
import { formatDate, formatWeight, truncate } from '@/lib/utils'
import { Truck, Wrench, TrendingUp, Package, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import type { Trip } from '@/types/models.types'
import { FleetBreakdownChart } from '@/components/analytics/FleetBreakdownChart'

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorState message="Failed to load dashboard" />

  const kpis = data?.kpis
  const recentTrips = data?.recentTrips ?? []
  const fleetBreakdown = data?.fleetBreakdown ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Command Center"
        subtitle="Real-time fleet overview"
        action={
          <Link href={ROUTES.NEW_TRIP} className="btn-primary">
            <Truck className="size-4" />
            New Trip
          </Link>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Active Fleet"
          value={kpis?.activeFleet ?? 0}
          subtext="Vehicles on trip"
          icon={Truck}
          accent="blue"
        />
        <KPICard
          label="Maintenance Alerts"
          value={kpis?.maintenanceAlerts ?? 0}
          subtext="Vehicles in shop"
          icon={Wrench}
          accent="amber"
        />
        <KPICard
          label="Utilization Rate"
          value={`${(kpis?.utilizationRate ?? 0).toFixed(1)}%`}
          subtext="Fleet assigned vs idle"
          icon={TrendingUp}
          accent="emerald"
        />
        <KPICard
          label="Pending Cargo"
          value={kpis?.pendingCargo ?? 0}
          subtext="Awaiting dispatch"
          icon={Package}
          accent="violet"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Trips table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
            <h3 className="text-sm font-display font-semibold text-text-primary">Recent Trips</h3>
            <Link
              href={ROUTES.TRIPS}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-body"
            >
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <RecentTripsTable trips={recentTrips} />
        </div>

        {/* Fleet Breakdown */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-border">
            <h3 className="text-sm font-display font-semibold text-text-primary">Fleet Status</h3>
          </div>
          <div className="p-4">
            <FleetBreakdownChart data={fleetBreakdown} />
          </div>
        </div>
      </div>
    </div>
  )
}

function RecentTripsTable({ trips }: { trips: Trip[] }) {
  const columns = [
    {
      key: 'tripNumber',
      label: 'Trip #',
      render: (row: Trip) => (
        <span className="font-display font-semibold text-text-primary text-xs">
          {row.tripNumber}
        </span>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row: Trip) => (
        <span className="text-xs">{row.vehicle.licensePlate}</span>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (row: Trip) => (
        <span className="text-xs">
          {truncate(row.origin, 10)} → {truncate(row.destination, 10)}
        </span>
      ),
    },
    {
      key: 'cargo',
      label: 'Cargo',
      render: (row: Trip) => (
        <span className="text-xs">{formatWeight(row.cargoWeightKg)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Trip) => <StatusPill status={row.status} />,
    },
  ]

  return (
    <DataTable
      columns={columns as never}
      data={trips as never[]}
      keyExtractor={(row: never) => (row as Trip).id}
      emptyMessage="No recent trips"
    />
  )
}