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
  weeks = 12 
}: GitHubStyleHeatmapProps) {
  
  // Calculate activity data for the past N weeks
  const heatmapData = useMemo(() => {
    const today = new Date()
    const startDate = subDays(today, weeks * 7)
    const endDate = today
    
    // Get all days in range
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    
    // Group by weeks (starting from Sunday)
    const weeksData: Date[][] = []
    let currentWeek: Date[] = []
    
    days.forEach(day => {
      if (getDay(day) === 0 && currentWeek.length > 0) {
        weeksData.push(currentWeek)
        currentWeek = [day]
      } else {
        currentWeek.push(day)
      }
    })
    if (currentWeek.length > 0) {
      weeksData.push(currentWeek)
    }
    
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
      weeks: weeksData,
      activityMap,
      maxActivity
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
  
  // Get color class for activity level
  function getActivityColor(level: number): string {
    // Using CSS variables that match GitHub's contribution graph
    switch (level) {
      case 0:
        return 'bg-[#161b22] dark:bg-[#161b22]' // No activity
      case 1:
        return 'bg-[#0e4429] dark:bg-[#0e4429]' // Low
      case 2:
        return 'bg-[#006d32] dark:bg-[#006d32]' // Medium-low
      case 3:
        return 'bg-[#26a641] dark:bg-[#26a641]' // Medium-high
      case 4:
        return 'bg-[#39d353] dark:bg-[#39d353]' // High
      default:
        return 'bg-[#161b22] dark:bg-[#161b22]'
    }
  }
  
  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = []
    let lastMonth = ''
    
    heatmapData.weeks.forEach((week, index) => {
      const firstDay = week[0]
      if (firstDay) {
        const month = format(firstDay, 'MMM')
        if (month !== lastMonth) {
          labels.push({ month, weekIndex: index })
          lastMonth = month
        }
      }
    })
    
    return labels
  }, [heatmapData.weeks])
  
  // Day labels
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-16px">
        <h3 className="text-brutal-md font-bold uppercase">Activity Heatmap</h3>
        <div className="flex items-center gap-16px">
          {/* Legend */}
          <div className="flex items-center gap-8px text-brutal-xs">
            <span className="text-[var(--theme-foreground-secondary)]">Less</span>
            <div className="flex items-center gap-4px">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-16px h-16px ${getActivityColor(level)} border border-[var(--theme-border)]`}
                  title={`Level ${level}`}
                />
              ))}
            </div>
            <span className="text-[var(--theme-foreground-secondary)]">More</span>
          </div>
        </div>
      </div>
      
      <div className="w-full">
        <div className="w-full">
          {/* Month labels */}
          <div className="flex mb-4px">
            <div className="w-32px" /> {/* Space for day labels */}
            {monthLabels.map((label, index) => (
              <div
                key={index}
                className="text-brutal-xs text-[var(--theme-foreground-secondary)]"
                style={{
                  marginLeft: index === 0 ? '0' : `${(label.weekIndex - (monthLabels[index - 1]?.weekIndex || 0)) * 13 - 13}px`,
                  minWidth: '30px'
                }}
              >
                {label.month}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="flex gap-4px">
            {/* Day labels */}
            <div className="flex flex-col gap-4px mr-8px">
              {dayLabels.map((label, index) => (
                <div
                  key={index}
                  className="h-20px flex items-center justify-end pr-4px"
                >
                  <span className="text-brutal-xs text-[var(--theme-foreground-secondary)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Weeks */}
            {heatmapData.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-4px">
                {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                  const day = week.find(d => getDay(d) === dayIndex)
                  if (!day) {
                    return <div key={dayIndex} className="w-20px h-20px" />
                  }
                  
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const activity = heatmapData.activityMap.get(dateStr) || 0
                  const level = getActivityLevel(activity)
                  const isToday = isSameDay(day, new Date())
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-20px h-20px ${getActivityColor(level)} border-2 ${
                        isToday 
                          ? 'border-[var(--theme-primary)]' 
                          : 'border-[var(--theme-border)]'
                      } hover:border-[var(--theme-primary)] transition-all cursor-pointer`}
                      title={`${format(day, 'MMM d, yyyy')}
${activity.toFixed(1)} contributions`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="mt-12px text-brutal-xs text-[var(--theme-foreground-secondary)]">
            {Array.from(heatmapData.activityMap.values()).reduce((a, b) => a + b, 0).toFixed(0)} contributions in the last {weeks} weeks
          </div>
        </div>
      </div>
    </div>
  )
}