import React, { useState, useEffect } from 'react'
import type { Id } from '../../../../../../convex/_generated/dataModel'

type RechartsModuleType = typeof import('recharts')

function useRecharts() {
  const [mod, setMod] = useState<RechartsModuleType | null>(null)
  useEffect(() => {
    import('recharts').then(setMod)
  }, [])
  return mod
}

interface VelocityTrendChartProps {
  sprints: {
    _id: Id<'sprints'>
    name: string
    startDate: string
    endDate: string
    status: string
    totalPoints: number
    completedPoints?: number
  }[]
  tasks: {
    _id: Id<'tasks'>
    sprintId?: Id<'sprints'>
    status: string
    points?: number
  }[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[4px]">
        <p className="text-brutal-xs font-bold mb-[2px]">{label}</p>
        <p className="text-brutal-xs" style={{ color: 'var(--theme-info)' }}>
          Committed: {data.committed} pts
        </p>
        <p className="text-brutal-xs" style={{ color: 'var(--theme-success)' }}>
          Completed: {data.completed} pts
        </p>
        <p className="text-brutal-xs" style={{ color: 'var(--theme-foreground-secondary)' }}>
          Average: {data.average} pts
        </p>
        {data.status === 'active' && (
          <p className="text-brutal-xs text-[var(--theme-warning)] mt-4px">
            Sprint in progress
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function VelocityTrendChart({ sprints, tasks }: VelocityTrendChartProps) {
  const recharts = useRecharts()
  // Calculate velocity for each sprint
  const velocityData = sprints
    .filter(sprint => sprint.status === 'completed' || sprint.status === 'active')
    .slice(-6) // Last 6 sprints
    .map(sprint => {
      const sprintTasks = tasks.filter(t => t.sprintId === sprint._id)
      const completedPoints = sprintTasks
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + (t.points || 0), 0)
      
      const committedPoints = sprint.totalPoints || sprintTasks.reduce((sum, t) => sum + (t.points || 0), 0)
      
      return {
        name: sprint.name.length > 10 ? sprint.name.substring(0, 10) + '...' : sprint.name,
        committed: committedPoints,
        completed: completedPoints,
        status: sprint.status,
      }
    })
  
  // Calculate average velocity
  const completedSprints = velocityData.filter(s => s.status === 'completed')
  const avgVelocity = completedSprints.length > 0
    ? completedSprints.reduce((sum, s) => sum + s.completed, 0) / completedSprints.length
    : 0
  
  // Add average line to data
  const dataWithAverage = velocityData.map(d => ({
    ...d,
    average: Math.round(avgVelocity),
  }))
  
  // Calculate trend (is velocity improving?)
  const recentVelocities = completedSprints.slice(-3).map(s => s.completed)
  const olderVelocities = completedSprints.slice(-6, -3).map(s => s.completed)
  const recentAvg = recentVelocities.length > 0 
    ? recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length 
    : 0
  const olderAvg = olderVelocities.length > 0 
    ? olderVelocities.reduce((a, b) => a + b, 0) / olderVelocities.length 
    : 0
  const trend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable'
  const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100).toFixed(0) : '0'
  
  const getTrendIcon = () => {
    if (trend === 'improving') return '↑'
    if (trend === 'declining') return '↓'
    return '→'
  }
  
  const getTrendColor = () => {
    if (trend === 'improving') return 'var(--theme-success)'
    if (trend === 'declining') return 'var(--theme-error)'
    return 'var(--theme-info)'
  }
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-[8px]">
        <h3 className="text-brutal-md font-bold uppercase">Sprint Velocity Trend</h3>
        <div className="flex items-center gap-[8px]">
          <div className="flex items-center gap-[4px]">
            <span className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Avg Velocity:</span>
            <span className="text-brutal-sm font-bold">{Math.round(avgVelocity)} pts</span>
          </div>
          <div 
            className="flex items-center gap-4px px-[4px] py-4px border"
            style={{ 
              borderColor: getTrendColor(),
              backgroundColor: getTrendColor() + '20',
              color: getTrendColor()
            }}
          >
            <span className="text-brutal-sm font-bold">{getTrendIcon()}</span>
            <span className="text-brutal-xs">
              {trend === 'stable' ? 'STABLE' : `${trendPercentage}%`}
            </span>
          </div>
        </div>
      </div>
      
      {recharts ? (
        <recharts.ResponsiveContainer width="100%" height={250}>
          <recharts.ComposedChart data={dataWithAverage} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <recharts.CartesianGrid
              strokeDasharray="0"
              stroke="var(--theme-border)"
              strokeOpacity={0.3}
            />
            <recharts.XAxis
              dataKey="name"
              stroke="var(--theme-foreground-secondary)"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <recharts.YAxis
              stroke="var(--theme-foreground-secondary)"
              tick={{ fontSize: 10 }}
              label={{
                value: 'Story Points',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'var(--theme-foreground-secondary)' }
              }}
            />
            <recharts.Tooltip content={<CustomTooltip />} />
            <recharts.Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />

            {/* Committed points bar */}
            <recharts.Bar
              dataKey="committed"
              fill="var(--theme-info)"
              fillOpacity={0.3}
              name="Committed"
            />

            {/* Completed points bar */}
            <recharts.Bar
              dataKey="completed"
              fill="var(--theme-success)"
              name="Completed"
            />

            {/* Average velocity line */}
            <recharts.Line
              type="monotone"
              dataKey="average"
              stroke="var(--theme-warning)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Average"
            />
          </recharts.ComposedChart>
        </recharts.ResponsiveContainer>
      ) : (
        <div className="w-full h-[250px] flex items-center justify-center text-brutal-xs font-mono text-[var(--theme-foreground-secondary)]">
          Loading chart...
        </div>
      )}
      
      {/* Insights */}
      <div className="mt-[8px] p-[8px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[8px] text-brutal-xs">
          <div>
            <span className="text-[var(--theme-foreground-secondary)]">Completion Rate:</span>
            <span className="ml-[4px] font-bold">
              {completedSprints.length > 0 
                ? `${Math.round(completedSprints.reduce((sum, s) => sum + (s.completed / s.committed * 100), 0) / completedSprints.length)}%`
                : 'N/A'
              }
            </span>
          </div>
          <div>
            <span className="text-[var(--theme-foreground-secondary)]">Best Sprint:</span>
            <span className="ml-[4px] font-bold">
              {completedSprints.length > 0 
                ? `${Math.max(...completedSprints.map(s => s.completed))} pts`
                : 'N/A'
              }
            </span>
          </div>
          <div>
            <span className="text-[var(--theme-foreground-secondary)]">Predictability:</span>
            <span className="ml-[4px] font-bold">
              {completedSprints.length > 1
                ? (() => {
                    const variance = completedSprints.map(s => s.completed)
                      .reduce((sum, val, _, arr) => {
                        const mean = arr.reduce((a, b) => a + b, 0) / arr.length
                        return sum + Math.pow(val - mean, 2)
                      }, 0) / completedSprints.length
                    const stdDev = Math.sqrt(variance)
                    const cv = (stdDev / avgVelocity) * 100 // Coefficient of variation
                    if (cv < 15) return 'High'
                    if (cv < 30) return 'Medium'
                    return 'Low'
                  })()
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}