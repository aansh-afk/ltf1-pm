import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface VelocityChartProps {
  projectId: Id<'projects'>
}

export default function VelocityChart({ projectId }: VelocityChartProps) {
  const data = useQuery(api.sprints.snapshots.getVelocityData, { projectId })

  if (data === undefined) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-6">
        <div className="flex items-center gap-2 text-[var(--theme-foreground)]/60 text-sm font-mono">
          <div className="w-2 h-2 bg-[#6366F1] animate-pulse" />
          LOADING VELOCITY...
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-6">
        <h3 className="text-sm font-bold font-mono uppercase mb-2 text-[var(--theme-foreground)]">
          TEAM VELOCITY
        </h3>
        <div className="flex flex-col items-center justify-center h-32 text-[var(--theme-foreground)]/40">
          <div className="text-2xl mb-2">📈</div>
          <p className="text-xs font-mono text-center">
            No completed sprints yet.<br />
            Velocity data will appear after your first sprint completes.
          </p>
        </div>
      </div>
    )
  }

  // Calculate average velocity
  const avgVelocity =
    data.reduce((sum, d) => sum + d.completedPoints, 0) / data.length

  const chartData = [...data].reverse().map((d) => ({
    sprint: d.sprintName.length > 12 ? d.sprintName.slice(0, 12) + '…' : d.sprintName,
    completed: d.completedPoints,
    total: d.totalPoints,
    tasks: d.completedTasks,
  }))

  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold font-mono uppercase text-[var(--theme-foreground)]">
          TEAM VELOCITY
        </h3>
        <div className="text-xs font-mono text-[#9CA3AF]">
          AVG:{' '}
          <span className="text-[#6366F1] font-bold">
            {Math.round(avgVelocity)} pts/sprint
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E2E35" />
          <XAxis
            dataKey="sprint"
            tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: '#2E2E35' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
            axisLine={{ stroke: '#2E2E35' }}
            tickLine={false}
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
            formatter={(value: number, name: string) => {
              if (name === 'completed') return [`${value} pts`, 'Completed']
              if (name === 'total') return [`${value} pts`, 'Planned']
              return [value, name]
            }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: '#9CA3AF',
            }}
            formatter={(value) =>
              value === 'completed' ? 'Completed' : value === 'total' ? 'Planned' : value
            }
          />
          <Bar dataKey="total" fill="#2E2E35" radius={0} />
          <Bar dataKey="completed" fill="#6366F1" fillOpacity={0.9} radius={0} />
          <ReferenceLine
            y={avgVelocity}
            stroke="#F59E0B"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: 'AVG',
              fill: '#F59E0B',
              fontSize: 10,
              fontFamily: "'IBM Plex Mono', monospace",
              position: 'right',
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
