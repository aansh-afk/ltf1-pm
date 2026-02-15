import React, { useMemo } from 'react'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, getDay, isSameDay } from 'date-fns'

interface GitHubStyleHeatmapProps {
  tasks: {
    _id: Id<'tasks'>
    assigneeId?: Id<'users'>
    completedAt?: number
    createdAt: number
    updatedAt: number
    status: string
  }[]
  userId?: Id<'users'>
  weeks?: number // Number of weeks to show (default 12)
}

export default function GitHubStyleHeatmap({
  tasks,
  userId,
  weeks = 16
}: GitHubStyleHeatmapProps) {

  // Calculate activity data for the past N weeks
  const heatmapData = useMemo(() => {
    const today = new Date()
    // Align to the end of the current week (Saturday)
    const endDate = endOfWeek(today)
    // Go back N weeks and start on Sunday
    const startDate = startOfWeek(subDays(today, (weeks - 1) * 7))

    // Get all days in range
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Calculate activity for each day
    const activityMap = new Map<string, number>()

    tasks.forEach(task => {
      // Filter by user if specified
      if (userId && task.assigneeId !== userId) return

      // Count task creation
      const createdDate = format(new Date(task.createdAt), 'yyyy-MM-dd')
      activityMap.set(createdDate, (activityMap.get(createdDate) || 0) + 1)

      // Count task completion
      if (task.completedAt) {
        const completedDate = format(new Date(task.completedAt), 'yyyy-MM-dd')
        activityMap.set(completedDate, (activityMap.get(completedDate) || 0) + 2) // Weight completion higher
      }

      // Count task updates
      if (task.updatedAt !== task.createdAt) {
        const updatedDate = format(new Date(task.updatedAt), 'yyyy-MM-dd')
        activityMap.set(updatedDate, (activityMap.get(updatedDate) || 0) + 0.5)
      }
    })

    // Find max activity for normalization
    const maxActivity = Math.max(...Array.from(activityMap.values()), 1)

    return {
      days,
      activityMap,
      maxActivity,
      startDate
    }
  }, [tasks, userId, weeks])

  // Get color intensity based on activity level
  function getActivityLevel(count: number): number {
    if (count === 0) return 0
    const normalized = count / heatmapData.maxActivity
    if (normalized <= 0.25) return 1
    if (normalized <= 0.5) return 2
    if (normalized <= 0.75) return 3
    return 4
  }

  // Get color class for activity level - GITHUB PALETTE
  function getActivityColor(level: number): string {
    switch (level) {
      case 0:
        return 'bg-[#0A0A0A]' // Empty (matches surface)
      case 1:
        return 'bg-[#0e4429]' // Low
      case 2:
        return 'bg-[#006d32]' // Medium-Low
      case 3:
        return 'bg-[#26a641]' // Medium-High
      case 4:
        return 'bg-[#39d353]' // High
      default:
        return 'bg-[#0A0A0A]'
    }
  }

  // Generate CSS Grid explanation:
  // We want columns for weeks and rows for days (Mon-Sun or Sun-Sat).
  // Standard contribution graph is 7 rows.

  return (
    <div className="w-full overflow-x-auto pb-4px">
      <div className="flex items-center justify-between mb-[8px] sticky left-0">
        <h3 className="text-sm font-bold uppercase tracking-tight text-[#F9FAFB] font-['IBM_Plex_Mono',monospace]">Activity</h3>
        <div className="flex items-center gap-[8px]">
          {/* Legend */}
          <div className="flex items-center gap-4px text-[10px] text-[#6B7280]">
            <span className="mr-4px">Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-[10px] h-[10px] rounded-none ${getActivityColor(level)}`}
                title={`Level ${level}`}
              />
            ))}
            <span className="ml-4px">More</span>
          </div>
        </div>
      </div>

      <div className="min-w-max p-4 bg-[#0A0A0A] border-2 border-[#2E2E35] rounded-none">
        <div className="flex">
          {/* Day Labels - Fixed width */}
          <div className="flex flex-col gap-[3px] mr-2 pt-[14px]">
            {['Mon', 'Wed', 'Fri'].map((day, i) => (
              <div key={day} className="h-[10px] text-[9px] text-[#6B7280] leading-none flex items-center h-[10px] mt-[13px] first:mt-0">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Container */}
          <div className="flex flex-col">
            {/* Month Labels */}
            <div className="flex mb-2 relative h-[12px]">
              {heatmapData.days.filter((d, i) => {
                return getDay(d) === 0 && format(d, 'd') <= '7'
              }).map(d => {
                const weeksDiff = Math.floor((d.getTime() - heatmapData.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
                return (
                  <div
                    key={d.toISOString()}
                    className="absolute text-[10px] text-[#6B7280]"
                    style={{ left: `${weeksDiff * 13}px` }}
                  >
                    {format(d, 'MMM')}
                  </div>
                )
              })}
            </div>

            {/* The Heatmap Grid */}
            <div
              className="grid grid-rows-7 gap-[3px] grid-flow-col"
              style={{
                gridTemplateColumns: `repeat(${weeks}, 10px)`
              }}
            >
              {heatmapData.days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const activity = heatmapData.activityMap.get(dateStr) || 0
                const level = getActivityLevel(activity)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={dateStr}
                    className={`
                                w-[10px] h-[10px]
                                rounded-none
                                ${getActivityColor(level)}
                                ${isToday ? 'ring-1 ring-white z-10' : ''}
                                hover:ring-1 hover:ring-[rgba(255,255,255,0.5)] hover:z-20
                                transition-colors
                            `}
                    title={`${format(day, 'yyyy-MM-dd')}: ${activity} contributions`}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 pt-4 border-t border-[#2E2E35] text-[10px] text-[#6B7280] flex justify-between">
          <span>Last {weeks} Weeks</span>
          <span>
            <span className="text-[#F9FAFB] font-bold">{Array.from(heatmapData.activityMap.values()).reduce((a, b) => a + b, 0).toFixed(0)}</span> contributions
          </span>
        </div>
      </div>
    </div>
  )
}