import React, { useMemo } from 'react'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'

interface TeamWorkloadHeatmapProps {
  team: {
    _id: Id<'users'>
    name: string
    avatar?: string
  }[]
  tasks: {
    _id: Id<'tasks'>
    assigneeId?: Id<'users'>
    status: string
    priority: string
    dueDate?: string
    estimatedHours?: number
    points?: number
  }[]
  meetings?: {
    _id: Id<'meetings'>
    date: string
    attendees: Id<'users'>[]
    duration?: number
  }[]
  dateRange?: number // Number of days to show (default 14)
}

const EMPTY_MEETINGS: NonNullable<TeamWorkloadHeatmapProps['meetings']> = []

export default function TeamWorkloadHeatmap({
  team,
  tasks,
  meetings = EMPTY_MEETINGS,
  dateRange = 14
}: TeamWorkloadHeatmapProps) {
  
  // Generate date range
  const dates = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(today, { weekStartsOn: 1 }) // Start from Monday
    return Array.from({ length: dateRange }, (_, i) => addDays(start, i))
  }, [dateRange])
  
  // Calculate workload intensity for each team member per day
  const heatmapData = useMemo(() => {
    return team.map(member => {
      const memberData = {
        member: member,
        dailyWorkload: dates.map(date => {
          // Count tasks due on this day
          const dayTasks = tasks.filter(task => {
            if (task.assigneeId !== member._id) return false
            if (!task.dueDate) return false
            
            const taskDueDate = parseISO(task.dueDate)
            return isSameDay(taskDueDate, date)
          })
          
          // Calculate task load (prioritize by urgency and points)
          const taskLoad = dayTasks.reduce((sum, task) => {
            const priorityWeight = 
              task.priority === 'urgent' ? 3 :
              task.priority === 'high' ? 2 :
              task.priority === 'medium' ? 1.5 : 1
            
            const points = task.points || 1
            const estimatedHours = task.estimatedHours || (points * 2) // Estimate 2 hours per point if not specified
            
            return sum + (estimatedHours * priorityWeight)
          }, 0)
          
          // Count meetings on this day
          const dayMeetings = meetings.filter(meeting => {
            const meetingDate = parseISO(meeting.date)
            return isSameDay(meetingDate, date) && meeting.attendees.includes(member._id)
          })
          
          const meetingLoad = dayMeetings.reduce((sum, meeting) => {
            return sum + (meeting.duration || 60) / 60 // Convert minutes to hours
          }, 0)
          
          // Count in-progress tasks (ongoing work)
          const inProgressTasks = tasks.filter(task => 
            task.assigneeId === member._id && 
            task.status === 'in_progress'
          ).length
          
          const totalLoad = taskLoad + meetingLoad + (inProgressTasks * 0.5) // Add baseline for ongoing work
          
          return {
            date,
            taskCount: dayTasks.length,
            meetingCount: dayMeetings.length,
            totalLoad,
            intensity: getIntensityLevel(totalLoad),
          }
        })
      }
      
      return memberData
    })
  }, [team, tasks, meetings, dates])
  
  // Determine intensity level
  function getIntensityLevel(load: number): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (load === 0) return 'none'
    if (load <= 2) return 'low'
    if (load <= 5) return 'medium'
    if (load <= 8) return 'high'
    return 'critical'
  }
  
  // Get color for intensity level
  function getIntensityColor(intensity: string): string {
    switch (intensity) {
      case 'none':
        return 'var(--theme-background-secondary)'
      case 'low':
        return 'var(--theme-success)'
      case 'medium':
        return 'var(--theme-info)'
      case 'high':
        return 'var(--theme-warning)'
      case 'critical':
        return 'var(--theme-error)'
      default:
        return 'var(--theme-background-secondary)'
    }
  }
  
  // Get opacity for intensity level
  function getIntensityOpacity(intensity: string): number {
    switch (intensity) {
      case 'none':
        return 0.1
      case 'low':
        return 0.3
      case 'medium':
        return 0.5
      case 'high':
        return 0.7
      case 'critical':
        return 0.9
      default:
        return 0.1
    }
  }
  
  // Check if date is weekend
  function isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6
  }
  
  // Check if date is today
  function isToday(date: Date): boolean {
    return isSameDay(date, new Date())
  }
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-[8px]">
        <h3 className="text-brutal-md font-bold uppercase">Team Workload Heatmap</h3>
        <div className="flex items-center gap-[8px]">
          {/* Legend */}
          <div className="flex items-center gap-[4px] text-brutal-xs">
            <span className="text-[var(--theme-foreground-secondary)]">Intensity:</span>
            <div className="flex items-center gap-4px">
              <div 
                className="w-16px h-16px border border-[var(--theme-border)]" 
                style={{ backgroundColor: getIntensityColor('none'), opacity: getIntensityOpacity('none') }}
                title="None"
              />
              <div 
                className="w-16px h-16px border border-[var(--theme-border)]" 
                style={{ backgroundColor: getIntensityColor('low'), opacity: getIntensityOpacity('low') }}
                title="Low"
              />
              <div 
                className="w-16px h-16px border border-[var(--theme-border)]" 
                style={{ backgroundColor: getIntensityColor('medium'), opacity: getIntensityOpacity('medium') }}
                title="Medium"
              />
              <div 
                className="w-16px h-16px border border-[var(--theme-border)]" 
                style={{ backgroundColor: getIntensityColor('high'), opacity: getIntensityOpacity('high') }}
                title="High"
              />
              <div 
                className="w-16px h-16px border border-[var(--theme-border)]" 
                style={{ backgroundColor: getIntensityColor('critical'), opacity: getIntensityOpacity('critical') }}
                title="Critical"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Date headers */}
          <div className="flex mb-[4px]">
            <div className="w-120px" /> {/* Space for names */}
            {dates.map((date) => (
              <div
                key={format(date, 'yyyy-MM-dd')}
                className="flex-1 min-w-[40px] text-center"
              >
                <div className={`text-brutal-xs ${isWeekend(date) ? 'text-[var(--theme-foreground-tertiary)]' : 'text-[var(--theme-foreground-secondary)]'}`}>
                  {format(date, 'EEE')}
                </div>
                <div className={`text-brutal-xs font-bold ${isToday(date) ? 'text-[var(--theme-primary)]' : ''}`}>
                  {format(date, 'd')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Team member rows */}
          {heatmapData.map((memberData, memberIndex) => (
            <div key={memberData.member._id} className="flex mb-[2px]">
              {/* Member name */}
              <div className="w-120px pr-[4px] flex items-center">
                <div className="flex items-center gap-[4px]">
                  {memberData.member.avatar ? (
                    <img 
                      src={memberData.member.avatar} 
                      alt={memberData.member.name}
                      className="w-4 h-4 rounded-full"
                    />
                  ) : (
                    <div className="w-4 h-4 bg-[var(--theme-primary)] flex items-center justify-center text-brutal-xs font-bold">
                      {memberData.member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-brutal-xs truncate">
                    {memberData.member.name.split(' ')[0]}
                  </span>
                </div>
              </div>
              
              {/* Workload cells */}
              {memberData.dailyWorkload.map((day) => (
                <div
                  key={format(day.date, 'yyyy-MM-dd')}
                  className="flex-1 min-w-[40px] p-1px"
                  title={`${memberData.member.name} - ${format(day.date, 'MMM d')}
Tasks: ${day.taskCount}
Meetings: ${day.meetingCount}
Load: ${day.totalLoad.toFixed(1)} hours`}
                >
                  <div 
                    className={`h-32px border transition-all hover:scale-110 cursor-pointer ${
                      isToday(day.date) ? 'border-2 border-[var(--theme-primary)]' : 'border-[var(--theme-border)]'
                    } ${isWeekend(day.date) ? 'opacity-50' : ''}`}
                    style={{ 
                      backgroundColor: getIntensityColor(day.intensity),
                      opacity: getIntensityOpacity(day.intensity)
                    }}
                  >
                    {day.taskCount > 0 && (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-brutal-xs font-bold">
                          {day.taskCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="mt-[8px] p-[8px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[8px] text-brutal-xs">
          <div>
            <span className="text-[var(--theme-foreground-secondary)]">Team Size:</span>
            <span className="ml-[4px] font-bold">{team.length} members</span>
          </div>
          <div>
            <span className="text-[var(--theme-foreground-secondary)]">Total Tasks:</span>
            <span className="ml-[4px] font-bold">{tasks.length} active</span>
          </div>
          <div>
            <span className="text-[var(--theme-foreground-secondary)]">Overloaded Days:</span>
            <span className="ml-[4px] font-bold text-[var(--theme-warning)]">
              {heatmapData.reduce((sum, member) => 
                sum + member.dailyWorkload.filter(d => d.intensity === 'high' || d.intensity === 'critical').length, 0
              )}
            </span>
          </div>
          <div>
            <span className="text-[var(--theme-foreground-secondary)]">Avg Daily Load:</span>
            <span className="ml-[4px] font-bold">
              {(heatmapData.reduce((sum, member) => 
                sum + member.dailyWorkload.reduce((dSum, d) => dSum + d.totalLoad, 0), 0
              ) / (team.length * dateRange)).toFixed(1)} hrs
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}