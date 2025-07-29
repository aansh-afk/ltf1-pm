import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { HiOutlineTerminal, HiOutlineUser, HiOutlineCheckCircle, HiOutlineClock, HiOutlinePlay, HiOutlinePause, HiOutlineChat, HiOutlineCode, HiOutlineExclamationCircle, HiOutlinePlus } from 'react-icons/hi'
import UserDisplay from '../user/UserDisplay'
import clsx from 'clsx'

interface TeamActivityFeedProps {
  projectId: string
  workspaceId?: string
  limit?: number
  showFilters?: boolean
  className?: string
}

const activityTypeConfig = {
  // Task activities
  task_created: { 
    icon: HiOutlinePlus, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'CREATED TASK'
  },
  task_completed: { 
    icon: HiOutlineCheckCircle, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'COMPLETED'
  },
  task_status_changed: { 
    icon: HiOutlineTerminal, 
    color: 'text-brutal-info', 
    bgColor: 'bg-brutal-info/20',
    label: 'STATUS CHANGED'
  },
  task_assigned: { 
    icon: HiOutlineUser, 
    color: 'text-brutal-info', 
    bgColor: 'bg-brutal-info/20',
    label: 'ASSIGNED'
  },
  task_priority_changed: { 
    icon: HiOutlineExclamationCircle, 
    color: 'text-brutal-warning', 
    bgColor: 'bg-brutal-warning/20',
    label: 'PRIORITY CHANGED'
  },
  task_time_started: { 
    icon: HiOutlinePlay, 
    color: 'text-brutal-info', 
    bgColor: 'bg-brutal-info/20',
    label: 'STARTED TIMER'
  },
  task_time_stopped: { 
    icon: HiOutlinePause, 
    color: 'text-brutal-warning', 
    bgColor: 'bg-brutal-warning/20',
    label: 'STOPPED TIMER'
  },
  task_commented: { 
    icon: HiOutlineChat, 
    color: 'text-primary-brutalist', 
    bgColor: 'bg-primary-brutalist/20',
    label: 'COMMENTED'
  },
  task_blocked: { 
    icon: HiOutlineExclamationCircle, 
    color: 'text-brutal-error', 
    bgColor: 'bg-brutal-error/20',
    label: 'BLOCKED'
  },
  task_unblocked: { 
    icon: HiOutlineCheckCircle, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'UNBLOCKED'
  },
  
  // Team activities
  member_joined: { 
    icon: HiOutlineUser, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'JOINED TEAM'
  },
  member_removed: { 
    icon: HiOutlineUser, 
    color: 'text-brutal-error', 
    bgColor: 'bg-brutal-error/20',
    label: 'LEFT TEAM'
  },
  member_role_changed: { 
    icon: HiOutlineUser, 
    color: 'text-brutal-info', 
    bgColor: 'bg-brutal-info/20',
    label: 'ROLE CHANGED'
  },
  
  // Project activities
  project_created: { 
    icon: HiOutlineTerminal, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'PROJECT CREATED'
  },
  project_updated: { 
    icon: HiOutlineTerminal, 
    color: 'text-brutal-info', 
    bgColor: 'bg-brutal-info/20',
    label: 'PROJECT UPDATED'
  },
  sprint_created: { 
    icon: HiOutlineTerminal, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'SPRINT CREATED'
  },
  sprint_started: { 
    icon: HiOutlinePlay, 
    color: 'text-brutal-info', 
    bgColor: 'bg-brutal-info/20',
    label: 'SPRINT STARTED'
  },
  sprint_completed: { 
    icon: HiOutlineCheckCircle, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'SPRINT COMPLETED'
  },
  
  // Meeting activities
  meeting_scheduled: { 
    icon: HiOutlineClock, 
    color: 'text-brutal-info', 
    bgColor: 'bg-brutal-info/20',
    label: 'MEETING SCHEDULED'
  },
  meeting_completed: { 
    icon: HiOutlineCheckCircle, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'MEETING COMPLETED'
  },
  meeting_cancelled: { 
    icon: HiOutlineExclamationCircle, 
    color: 'text-brutal-error', 
    bgColor: 'bg-brutal-error/20',
    label: 'MEETING CANCELLED'
  },
  
  // Code activities
  commit_pushed: { 
    icon: HiOutlineCode, 
    color: 'text-primary-brutalist', 
    bgColor: 'bg-primary-brutalist/20',
    label: 'COMMIT PUSHED'
  },
  pr_opened: { 
    icon: HiOutlineCode, 
    color: 'text-brutal-info', 
    bgColor: 'bg-brutal-info/20',
    label: 'PR OPENED'
  },
  pr_merged: { 
    icon: HiOutlineCheckCircle, 
    color: 'text-brutal-success', 
    bgColor: 'bg-brutal-success/20',
    label: 'PR MERGED'
  },
  pr_reviewed: { 
    icon: HiOutlineCode, 
    color: 'text-brutal-warning', 
    bgColor: 'bg-brutal-warning/20',
    label: 'PR REVIEWED'
  }
}

const timeFilterOptions = [
  { label: 'TODAY', value: 24 },
  { label: 'WEEK', value: 168 },
  { label: 'MONTH', value: 720 }
]

const typeFilterOptions = [
  { label: 'ALL', value: null },
  { label: 'TASKS', value: ['task_created', 'task_completed', 'task_status_changed', 'task_assigned'] },
  { label: 'TEAM', value: ['member_joined', 'member_removed', 'member_role_changed'] },
  { label: 'CODE', value: ['commit_pushed', 'pr_opened', 'pr_merged', 'pr_reviewed'] }
]

export default function TeamActivityFeed({ 
  projectId, 
  workspaceId, 
  limit = 20, 
  showFilters = true, 
  className 
}: TeamActivityFeedProps) {
  const [timeFilter, setTimeFilter] = useState(24) // Default to today
  const [typeFilter, setTypeFilter] = useState<string[] | null>(null)

  // Get activities based on project or workspace
  const activities = useQuery(
    projectId ? api.activities.queries.getRecentTeamActivity : api.activities.queries.getWorkspaceActivities,
    projectId 
      ? { projectId: projectId as any, hours: timeFilter }
      : workspaceId 
        ? { workspaceId: workspaceId as any, limit }
        : 'skip'
  )

  // Filter activities by type if filter is selected
  const filteredActivities = useMemo(() => {
    if (!activities) return []
    
    if (typeFilter && typeFilter.length > 0) {
      return activities.filter(activity => typeFilter.includes(activity.type))
    }
    
    return activities
  }, [activities, typeFilter])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatDescription = (activity: any) => {
    // Use the description from the activity or fall back to a formatted version
    if (activity.description) {
      return activity.description
    }

    // Fallback formatting for legacy activities
    const config = activityTypeConfig[activity.type as keyof typeof activityTypeConfig]
    return `${config?.label || activity.type.replace(/_/g, ' ').toUpperCase()}`
  }

  if (!activities) {
    return (
      <div className={clsx('bg-carbon-plate border-2 border-basalt-border p-24px', className)}>
        <div className="flex items-center justify-between mb-16px">
          <h3 className="text-brutal-lg font-bold uppercase">TEAM ACTIVITY</h3>
        </div>
        <div className="animate-pulse space-y-8px">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-16px p-8px bg-basalt-border/20">
              <div className="w-40px h-12px bg-basalt-border"></div>
              <div className="w-24px h-24px bg-basalt-border rounded"></div>
              <div className="w-80px h-12px bg-basalt-border"></div>
              <div className="flex-1 h-12px bg-basalt-border"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('bg-carbon-plate border-2 border-basalt-border p-24px', className)}>
      <div className="flex items-center justify-between mb-16px">
        <h3 className="text-brutal-lg font-bold uppercase">TEAM ACTIVITY</h3>
        
        {showFilters && (
          <div className="flex items-center gap-16px">
            {/* Time Filter */}
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(Number(e.target.value))}
                className="bg-event-horizon border-2 border-basalt-border font-mono text-brutal-xs uppercase text-primary-brutalist appearance-none pr-24px pl-8px py-4px cursor-pointer hover:border-primary-brutalist/50 transition-colors"
              >
                {timeFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span className="absolute right-8px top-1/2 transform -translate-y-1/2 text-primary-brutalist/60">▼</span>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter ? JSON.stringify(typeFilter) : 'null'}
                onChange={(e) => {
                  const value = e.target.value
                  setTypeFilter(value === 'null' ? null : JSON.parse(value))
                }}
                className="bg-event-horizon border-2 border-basalt-border font-mono text-brutal-xs uppercase text-primary-brutalist appearance-none pr-24px pl-8px py-4px cursor-pointer hover:border-primary-brutalist/50 transition-colors"
              >
                {typeFilterOptions.map(option => (
                  <option key={option.label} value={option.value ? JSON.stringify(option.value) : 'null'}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-8px top-1/2 transform -translate-y-1/2 text-primary-brutalist/60">▼</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-8px font-mono text-brutal-sm max-h-400px overflow-y-auto">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => {
            const config = activityTypeConfig[activity.type as keyof typeof activityTypeConfig] || {
              icon: HiOutlineTerminal,
              color: 'text-primary-brutalist',
              bgColor: 'bg-primary-brutalist/20',
              label: activity.type.replace(/_/g, ' ').toUpperCase()
            }
            
            const Icon = config.icon

            return (
              <div 
                key={`${activity._id}-${index}`}
                className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors border-l-2 border-transparent hover:border-primary-brutalist/30"
              >
                <span className="text-brutal-xs text-primary-brutalist/60 min-w-40px">
                  {formatTime(activity.timestamp)}
                </span>
                
                <div className={clsx(
                  'w-24px h-24px border-2 border-basalt-border flex items-center justify-center',
                  config.bgColor
                )}>
                  <Icon className={clsx('w-12px h-12px', config.color)} />
                </div>
                
                <div className="flex items-center gap-8px flex-1 min-w-0">
                  {activity.actor && (
                    <UserDisplay 
                      userId={activity.actorId}
                      size="xs"
                      showName={false}
                      showStatus={false}
                      compact
                    />
                  )}
                  
                  <span className="text-primary-brutalist font-semibold truncate">
                    {activity.actor?.name || activity.actorName || 'UNKNOWN USER'}
                  </span>
                  
                  <span className="text-primary-brutalist/80 truncate flex-1">
                    {formatDescription(activity)}
                  </span>
                  
                  {activity.project && projectId !== activity.projectId && (
                    <span className="text-brutal-xs text-primary-brutalist/40 bg-basalt-border px-4px py-1px uppercase">
                      {activity.project.key}
                    </span>
                  )}
                </div>

                {/* Show metadata for status changes, assignments, etc. */}
                {(activity.metadata?.oldValue || activity.metadata?.newValue) && (
                  <div className="text-brutal-xs text-primary-brutalist/60">
                    {activity.metadata.oldValue && activity.metadata.newValue && (
                      <span>{activity.metadata.oldValue} → {activity.metadata.newValue}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-48px">
            <HiOutlineTerminal className="w-48px h-48px text-primary-brutalist/30 mx-auto mb-16px" />
            <h3 className="font-mono text-brutal-sm uppercase mb-16px">NO RECENT ACTIVITY</h3>
            <p className="text-cathode-white/60">
              Team activity will appear here as actions are performed
            </p>
          </div>
        )}
      </div>
    </div>
  )
}