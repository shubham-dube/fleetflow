'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { VehicleStatus } from '@/types/models.types'

const STATUS_COLORS: Record<VehicleStatus, string> = {
  AVAILABLE: '#10B981',
  ON_TRIP:   '#3B82F6',
  IN_SHOP:   '#F59E0B',
  RETIRED:   '#6B7280',
}

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: 'Available',
  ON_TRIP:   'On Trip',
  IN_SHOP:   'In Shop',
  RETIRED:   'Retired',
}

interface FleetBreakdownChartProps {
  data: { status: VehicleStatus; count: number }[]
}

export function FleetBreakdownChart({ data }: FleetBreakdownChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        No fleet data
      </div>
    )
  }
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        No fleet data
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
    color: STATUS_COLORS[d.status] ?? '#6B7280',
    pct: Math.round((d.count / total) * 100),
  }))

  return (
    <div className="space-y-4">
      {/* Donut chart */}
      <div className="relative h-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="count"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1C2132',
                border: '1px solid #232840',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F0F4FF',
              }}
              formatter={(value, name) => [`${value}`, `${name}`] as [string, string]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-display font-bold text-text-primary">{total}</span>
          <span className="text-[10px] text-text-muted">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {chartData.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div
              className="size-2 rounded-full flex-shrink-0"
              style={{ background: item.color }}
            />
            <span className="text-xs text-text-secondary flex-1 font-body">{item.label}</span>
            <span className="text-xs font-display font-semibold text-text-primary">
              {item.count}
            </span>
            <span className="text-xs text-text-muted w-8 text-right">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}