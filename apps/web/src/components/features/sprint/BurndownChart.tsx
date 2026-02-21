import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

interface BurndownChartProps {
  sprintId: Id<'sprints'>
  sprintName?: string
}

export default function BurndownChart({ sprintId, sprintName }: BurndownChartProps) {
  const data = useQuery(api.sprints.snapshots.getBurndownData, { sprintId })

  if (data === undefined) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-6">
        <div className="flex items-center gap-2 text-[var(--theme-foreground)]/60 text-sm font-mono">
          <div className="w-2 h-2 bg-[#6366F1] animate-pulse" />
          CALCULATING BURNDOWN...
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-6">
        <h3 className="text-sm font-bold font-mono uppercase mb-2 text-[var(--theme-foreground)]">
          {sprintName ? `${sprintName} — BURNDOWN` : 'BURNDOWN CHART'}
        </h3>
        <div className="flex flex-col items-center justify-center h-32 text-[var(--theme-foreground)]/40">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-xs font-mono text-center">
            No snapshot data yet.<br />
            Snapshots are captured nightly — check back tomorrow.
          </p>
        </div>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    date: format(new Date(d.date), 'MMM d'),
    actual: d.remainingPoints,
    ideal: d.idealRemaining,
  }))

  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-4">
      <h3 className="text-sm font-bold font-mono uppercase mb-4 text-[var(--theme-foreground)]">
        {sprintName ? `${sprintName} — BURNDOWN` : 'BURNDOWN CHART'}
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E2E35" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: '#2E2E35' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: '#2E2E35' }}
            tickLine={false}
            label={{
              value: 'Points',
              angle: -90,
              position: 'insideLeft',
              fill: '#6B7280',
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111111',
              border: '2px solid #2E2E35',
              borderRadius: 0,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: '#F9FAFB',
            }}
            formatter={(value: number, name: string) => [
              `${value} pts`,
              name === 'actual' ? 'Remaining' : 'Ideal',
            ]}
          />
          <Legend
            wrapperStyle={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: '#9CA3AF',
            }}
            formatter={(value) => (value === 'actual' ? 'Remaining' : 'Ideal Burndown')}
          />
          <Area
            type="monotone"
            dataKey="actual"
            fill="#6366F1"
            fillOpacity={0.15}
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
