import React, { useState, useEffect } from 'react'
import { format, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns'
import type { Id } from '../../../../../../convex/_generated/dataModel'

type RechartsModuleType = typeof import('recharts')

function useRecharts() {
  const [mod, setMod] = useState<RechartsModuleType | null>(null)
  useEffect(() => {
    import('recharts').then(setMod)
  }, [])
  return mod
}

interface SprintBurndownChartProps {
  sprint: {
    _id: Id<'sprints'>
    name: string
    startDate: string
    endDate: string
    totalPoints: number
  }
  tasks: {
    _id: Id<'tasks'>
    points?: number
    status: string
    completedAt?: string
    sprintId?: Id<'sprints'>
  }[]
  showPrediction?: boolean
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111111] border-2 border-[#2E2E35] p-2">
        <p className="text-xs font-bold text-[#F9FAFB]">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value !== null ? `${entry.value} pts` : 'N/A'}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function SprintBurndownChart({ sprint, tasks, showPrediction = true }: SprintBurndownChartProps) {
  const recharts = useRecharts()

  // Filter tasks for this sprint
  const sprintTasks = tasks.filter(t => t.sprintId === sprint._id)

  // Calculate burndown data
  const startDate = new Date(sprint.startDate)
  const endDate = new Date(sprint.endDate)
  const totalDays = differenceInDays(endDate, startDate) + 1
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Calculate ideal burndown
  const pointsPerDay = sprint.totalPoints / (totalDays - 1) // -1 because we start with full points

  // Calculate actual burndown
  const burndownData = days.map((day, index) => {
    const dayStr = format(day, 'MMM dd')
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)

    // Calculate remaining points up to this day
    const completedByDay = sprintTasks.filter(task => {
      if (task.status === 'done' && task.completedAt) {
        const completedDate = typeof task.completedAt === 'string'
          ? parseISO(task.completedAt)
          : new Date(task.completedAt)
        return completedDate <= dayEnd
      }
      return false
    })

    const completedPoints = completedByDay.reduce((sum, task) => sum + (task.points || 0), 0)
    const remainingPoints = sprint.totalPoints - completedPoints

    // Ideal line
    const idealRemaining = Math.max(0, sprint.totalPoints - (pointsPerDay * index))

    // Only show actual data up to today
    const today = new Date()
    const isActualData = day <= today

    return {
      day: dayStr,
      ideal: Math.round(idealRemaining * 10) / 10,
      actual: isActualData ? remainingPoints : null,
      predicted: null, // Will calculate this next
    }
  })

  // Calculate prediction based on current velocity
  if (showPrediction) {
    const today = new Date()
    const todayIndex = days.findIndex(d => format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))

    if (todayIndex >= 0 && todayIndex < days.length - 1) {
      const daysElapsed = todayIndex + 1
      const pointsCompleted = sprintTasks
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + (t.points || 0), 0)

      const velocity = daysElapsed > 0 ? pointsCompleted / daysElapsed : 0
      const remainingPoints = sprint.totalPoints - pointsCompleted

      // Add prediction from today onwards
      for (let i = todayIndex; i < burndownData.length; i++) {
        const daysFromToday = i - todayIndex
        const predictedCompleted = Math.min(
          remainingPoints,
          velocity * daysFromToday
        )
        burndownData[i].predicted = Math.max(0, remainingPoints - predictedCompleted)
      }
    }
  }

  // Calculate sprint health
  const today = new Date()
  const todayIndex = days.findIndex(d => format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
  const currentActual = todayIndex >= 0 ? burndownData[todayIndex]?.actual || 0 : sprint.totalPoints
  const currentIdeal = todayIndex >= 0 ? burndownData[todayIndex]?.ideal || 0 : sprint.totalPoints
  const healthStatus = currentActual <= currentIdeal ? 'on-track' : 'behind'
  const healthColor = healthStatus === 'on-track' ? '#22C55E' : '#F59E0B'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-[8px]">
        <h3 className="text-sm font-bold uppercase text-[#F9FAFB] font-['IBM_Plex_Mono',monospace]">Sprint Burndown</h3>
        <div className="flex items-center gap-[8px]">
          <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#9CA3AF]">
            {Math.round(currentActual)} / {sprint.totalPoints} pts remaining
          </span>
          <span
            className="text-xs font-['IBM_Plex_Mono',monospace] px-1.5 py-0.5 border"
            style={{
              borderColor: healthColor,
              backgroundColor: healthColor + '20',
              color: healthColor
            }}
          >
            {healthStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {recharts ? (
        <recharts.ResponsiveContainer width="100%" height={300}>
          <recharts.ComposedChart data={burndownData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <recharts.CartesianGrid
              strokeDasharray="0"
              stroke="#2E2E35"
              strokeOpacity={0.3}
            />
            <recharts.XAxis
              dataKey="day"
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <recharts.YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              label={{
                value: 'Story Points',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: '#9CA3AF' }
              }}
            />
            <recharts.Tooltip content={<CustomTooltip />} />
            <recharts.Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />

            {/* Ideal burndown line */}
            <recharts.Line
              type="monotone"
              dataKey="ideal"
              stroke="#2E2E35"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Ideal"
            />

            {/* Actual burndown line */}
            <recharts.Line
              type="monotone"
              dataKey="actual"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ fill: '#6366F1', r: 4 }}
              name="Actual"
              connectNulls={false}
            />

            {/* Predicted line */}
            {showPrediction && (
              <recharts.Line
                type="monotone"
                dataKey="predicted"
                stroke="#06B6D4"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={false}
                name="Predicted"
                connectNulls={false}
              />
            )}

            {/* Fill area between actual and ideal to show deviation */}
            <recharts.Area
              type="monotone"
              dataKey="actual"
              fill={healthStatus === 'on-track' ? '#22C55E' : '#F59E0B'}
              fillOpacity={0.1}
              stroke="none"
            />
          </recharts.ComposedChart>
        </recharts.ResponsiveContainer>
      ) : (
        <div className="w-full h-[300px] flex items-center justify-center text-xs font-mono text-[#9CA3AF]">
          Loading chart...
        </div>
      )}

      {/* Legend and insights */}
      <div className="mt-[8px] flex items-center gap-[12px] text-xs text-[#9CA3AF]">
        <div className="flex items-center gap-[4px]">
          <div className="w-16px h-2px bg-[#2E2E35]" style={{ borderStyle: 'dashed' }} />
          <span>Ideal Pace</span>
        </div>
        <div className="flex items-center gap-[4px]">
          <div className="w-16px h-3px bg-[#6366F1]" />
          <span>Actual Progress</span>
        </div>
        {showPrediction && (
          <div className="flex items-center gap-[4px]">
            <div className="w-16px h-2px bg-[#06B6D4]" style={{ borderStyle: 'dashed' }} />
            <span>Predicted</span>
          </div>
        )}
      </div>
    </div>
  )
}