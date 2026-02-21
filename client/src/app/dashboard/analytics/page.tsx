'use client'

import { useState } from 'react'
import { useTrendAnalytics, useFinancialAnalytics, useFleetAnalytics } from '@/hooks/useData'
import { PageHeader, LoadingSpinner, ErrorState, SectionHeader } from '@/components/shared/UI'
import { KPICard } from '@/components/shared/KPICard'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Input } from '@/components/shared/FormComponents'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart3, TrendingUp, DollarSign, Download } from 'lucide-react'
import { analyticsApi } from '@/lib/analytics.api'
import { toast } from 'sonner'
import type { FleetAnalytics } from '@/types/models.types'

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1C2132',
    border: '1px solid #232840',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#F0F4FF',
  },
}

export default function AnalyticsPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const { data: trend, isLoading: trendLoading } = useTrendAnalytics()
  const { data: financial, isLoading: financialLoading } = useFinancialAnalytics(month)
  const { data: fleet, isLoading: fleetLoading } = useFleetAnalytics()

  const trendData = trend?.trend ?? []
  const financialSummary = financial?.summary
  const fleetVehicles = (fleet as any)?.vehicles ?? []

  const handleExport = async () => {
    try {
      const blob = await analyticsApi.exportCsv(month)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fleetflow-${month}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics & Reports"
        subtitle="Financial and operational insights"
        action={
          <div className="flex items-center gap-2">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-36 py-1.5 text-xs"
            />
            <button onClick={handleExport} className="btn-secondary">
              <Download className="size-4" />
              Export CSV
            </button>
          </div>
        }
      />

      {/* Financial KPIs */}
      {financialLoading ? (
        <LoadingSpinner />
      ) : financialSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label="Revenue"
            value={formatCurrency(financialSummary.revenue)}
            icon={TrendingUp}
            accent="emerald"
          />
          <KPICard
            label="Fuel Cost"
            value={formatCurrency(financialSummary.fuelCost)}
            icon={DollarSign}
            accent="amber"
          />
          <KPICard
            label="Maintenance Cost"
            value={formatCurrency(financialSummary.maintenanceCost)}
            icon={BarChart3}
            accent="red"
          />
          <KPICard
            label="Net Profit"
            value={formatCurrency(financialSummary.netProfit)}
            icon={TrendingUp}
            accent={Number(financialSummary.netProfit) >= 0 ? 'cyan' : 'red'}
          />
        </div>
      ) : null}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Cost Trend */}
        <div className="card p-4">
          <SectionHeader title="Revenue vs Cost (6 Months)" />
          {trendLoading ? (
            <LoadingSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232840" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#8A94B0' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8A94B0' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`₹${Number(v).toLocaleString()}`]} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#8A94B0' }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="fuelCost" name="Fuel" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="maintenanceCost" name="Maintenance" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Net Profit Trend */}
        <div className="card p-4">
          <SectionHeader title="Net Profit Trend" />
          {trendLoading ? (
            <LoadingSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232840" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#8A94B0' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8A94B0' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`₹${Number(v).toLocaleString()}`]} />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke="#00D4FF"
                  strokeWidth={2}
                  dot={{ fill: '#00D4FF', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fleet ROI Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-bg-border">
          <h3 className="text-sm font-display font-semibold text-text-primary">Vehicle ROI Analysis</h3>
          <p className="text-xs text-text-muted mt-0.5">ROI = (Revenue − Costs) / Acquisition Cost</p>
        </div>
        {fleetLoading ? (
          <LoadingSpinner />
        ) : (
          <FleetROITable vehicles={fleetVehicles} />
        )}
      </div>
    </div>
  )
}

function FleetROITable({ vehicles }: { vehicles: any[] }) {
  const columns: Column<any>[] = [
    {
      key: 'licensePlate',
      label: 'Vehicle',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-text-primary">{row.licensePlate}</p>
          <p className="text-[10px] text-text-muted">{row.make} {row.model}</p>
        </div>
      ),
    },
    {
      key: 'acquisitionCost',
      label: 'Acq. Cost',
      render: (row) => <span className="text-xs">{formatCurrency(row.acquisitionCost)}</span>,
    },
    {
      key: 'totalRevenue',
      label: 'Revenue',
      render: (row) => <span className="text-xs text-emerald-400">{formatCurrency(row.totalRevenue ?? 0)}</span>,
    },
    {
      key: 'totalCosts',
      label: 'Total Costs',
      render: (row) => (
        <span className="text-xs text-red-400">
          {formatCurrency((Number(row.totalFuelCost ?? 0) + Number(row.totalMaintenanceCost ?? 0)))}
        </span>
      ),
    },
    {
      key: 'roi',
      label: 'ROI',
      render: (row) => {
        const roi = Number(row.roi ?? 0)
        return (
          <span className={`text-xs font-display font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
          </span>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={vehicles}
      keyExtractor={(v) => v.id}
      emptyMessage="No fleet analytics data available"
    />
  )
}