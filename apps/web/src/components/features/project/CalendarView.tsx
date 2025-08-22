import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineDotsVertical,
  HiOutlineClock,
  HiOutlineVideoCamera,
  HiOutlineFlag,
  HiOutlineExclamation
} from 'react-icons/hi'
import clsx from 'clsx'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays, 
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  parseISO,
  differenceInDays
} from 'date-fns'
import toast from 'react-hot-toast'
import CreateTaskModal from '@/components/features/task/CreateTaskModal'
import EditTaskModal from '@/components/features/task/EditTaskModal'
import ScheduleMeetingModal from '@/components/features/meetings/ScheduleMeetingModal'

interface CalendarViewProps {
  projectId: Id<"projects">
  workspaceId: Id<"workspaces">
}

interface CalendarEvent {
  id: string
  title: string
  type: 'task' | 'meeting' | 'sprint' | 'milestone'
  date: Date
  endDate?: Date
  status?: string
  priority?: string
  assigneeIds?: Id<"users">[]
  color: string
  icon?: JSX.Element
  data: any
}

type ViewType = 'month' | 'week' | 'day' | 'agenda'

const priorityColors = {
  urgent: 'bg-[var(--theme-error)]',
  high: 'bg-[var(--theme-warning)]',
  medium: 'bg-[var(--theme-info)]',
  low: 'bg-[var(--theme-success)]'
}

const statusColors = {
  backlog: 'bg-[var(--theme-foreground)]/20',
  todo: 'bg-[var(--theme-primary)]',
  in_progress: 'bg-[var(--theme-info)]',
  in_review: 'bg-[var(--theme-warning)]',
  done: 'bg-[var(--theme-success)]',
  cancelled: 'bg-[var(--theme-error)]/50'
}

export default function CalendarView({ projectId, workspaceId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewType, setViewType] = useState<ViewType>('month')
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'meetings' | 'sprints'>('all')
  
  // Fetch data
  const tasks = useQuery(api.tasks.queries.getProjectTasks, { projectId }) || []
  const meetings = useQuery(api.meetings.queries.getProjectMeetings, { projectId }) || []
  const sprints = useQuery(api.sprints.queries.getProjectSprints, { projectId }) || []
  const updateTask = useMutation(api.tasks.mutations.updateTask)
  
  // Convert data to calendar events
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = []
    
    // Add tasks
    if (filterType === 'all' || filterType === 'tasks') {
      tasks.forEach(task => {
        // Due date events
        if (task.dueDate) {
          events.push({
            id: `task-due-${task._id}`,
            title: task.title,
            type: 'task',
            date: new Date(task.dueDate),
            status: task.status,
            priority: task.priority,
            assigneeIds: task.assigneeIds,
            color: priorityColors[task.priority as keyof typeof priorityColors] || 'bg-[var(--theme-foreground)]',
            icon: <HiOutlineFlag className="w-12px h-12px" />,
            data: task
          })
        }
        
        // Start date events (if different from due date)
        if (task.startDate && task.startDate !== task.dueDate) {
          events.push({
            id: `task-start-${task._id}`,
            title: `Start: ${task.title}`,
            type: 'task',
            date: new Date(task.startDate),
            status: task.status,
            priority: task.priority,
            assigneeIds: task.assigneeIds,
            color: 'bg-[var(--theme-info)]/50',
            icon: <HiOutlineClock className="w-12px h-12px" />,
            data: task
          })
        }
        
        // Milestone events
        if (task.milestone) {
          events.push({
            id: `milestone-${task._id}`,
            title: `⬥ ${task.title}`,
            type: 'milestone',
            date: new Date(task.dueDate || task.startDate || Date.now()),
            priority: 'high',
            color: 'bg-[var(--theme-primary)]',
            icon: <HiOutlineExclamation className="w-12px h-12px" />,
            data: task
          })
        }
      })
    }
    
    // Add meetings
    if (filterType === 'all' || filterType === 'meetings') {
      meetings.forEach(meeting => {
        if (meeting.startTime) {
          events.push({
            id: `meeting-${meeting._id}`,
            title: meeting.title,
            type: 'meeting',
            date: new Date(meeting.startTime),
            endDate: meeting.endTime ? new Date(meeting.endTime) : undefined,
            color: 'bg-[var(--theme-accent)]',
            icon: <HiOutlineVideoCamera className="w-12px h-12px" />,
            data: meeting
          })
        }
      })
    }
    
    // Add sprints
    if (filterType === 'all' || filterType === 'sprints') {
      sprints.forEach(sprint => {
        if (sprint.startDate) {
          events.push({
            id: `sprint-start-${sprint._id}`,
            title: `Sprint Start: ${sprint.name}`,
            type: 'sprint',
            date: new Date(sprint.startDate),
            color: 'bg-[var(--theme-success)]',
            data: sprint
          })
        }
        
        if (sprint.endDate) {
          events.push({
            id: `sprint-end-${sprint._id}`,
            title: `Sprint End: ${sprint.name}`,
            type: 'sprint',
            date: new Date(sprint.endDate),
            color: 'bg-[var(--theme-error)]',
            data: sprint
          })
        }
      })
    }
    
    return events
  }, [tasks, meetings, sprints, filterType])
  
  // Get calendar days for month view
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    const days = []
    let day = start
    
    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }
    
    return days
  }, [currentDate])
  
  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return calendarEvents.filter(event => 
      isSameDay(event.date, date)
    )
  }
  
  // Navigate calendar
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }
  
  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    
    if (event.type === 'task' || event.type === 'milestone') {
      setSelectedTask(event.data)
      setShowEditTaskModal(true)
    } else if (event.type === 'meeting') {
      // Could open meeting details modal
      toast.success(`Meeting: ${event.title}`)
    } else if (event.type === 'sprint') {
      // Could navigate to sprint view
      toast.success(`Sprint: ${event.title}`)
    }
  }
  
  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setShowCreateTaskModal(true)
  }
  
  // Render month view
  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-0 border-2 border-[var(--theme-border)]">
      {/* Day headers */}
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
        <div 
          key={day} 
          className="p-8px text-center font-bold text-xs border-b-2 border-r border-[var(--theme-border)] bg-[var(--theme-background-secondary)]"
        >
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {calendarDays.map((day, index) => {
        const dayEvents = getEventsForDay(day)
        const isCurrentMonth = isSameMonth(day, currentDate)
        const isSelected = selectedDate && isSameDay(day, selectedDate)
        const isTodayDate = isToday(day)
        
        return (
          <div
            key={index}
            onClick={() => handleDayClick(day)}
            className={clsx(
              'min-h-[100px] p-8px border-b border-r border-[var(--theme-border)] cursor-pointer transition-all',
              !isCurrentMonth && 'bg-[var(--theme-background)]/50 opacity-50',
              isSelected && 'bg-[var(--theme-hover)]',
              isTodayDate && 'bg-[var(--theme-primary)]/10',
              'hover:bg-[var(--theme-hover)]/50'
            )}
          >
            <div className={clsx(
              'text-xs font-bold mb-4px',
              isTodayDate && 'text-[var(--theme-primary)]',
              !isCurrentMonth && 'text-[var(--theme-foreground)]/40'
            )}>
              {format(day, 'd')}
            </div>
            
            {/* Events */}
            <div className="space-y-2px">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEventClick(event)
                  }}
                  className={clsx(
                    'text-[10px] px-4px py-2px truncate cursor-pointer hover:opacity-80',
                    event.color,
                    'text-[var(--theme-background)]'
                  )}
                  title={event.title}
                >
                  {event.icon && <span className="inline-block mr-2px">{event.icon}</span>}
                  {event.title}
                </div>
              ))}
              
              {dayEvents.length > 3 && (
                <div className="text-[10px] text-[var(--theme-foreground)]/60 px-4px">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
  
  // Render agenda view
  const renderAgendaView = () => {
    const upcomingEvents = calendarEvents
      .filter(event => isFuture(event.date) || isToday(event.date))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 20)
    
    return (
      <div className="space-y-16px">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-48px text-[var(--theme-foreground)]/60">
            NO UPCOMING EVENTS
          </div>
        ) : (
          upcomingEvents.map(event => {
            const daysUntil = differenceInDays(event.date, new Date())
            
            return (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className={clsx(
                  'p-16px border-2 border-[var(--theme-border)] cursor-pointer',
                  'hover:shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px]',
                  'transition-all'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-8px mb-8px">
                      <span className={clsx('px-8px py-4px text-xs font-bold', event.color, 'text-[var(--theme-background)]')}>
                        {event.type.toUpperCase()}
                      </span>
                      {event.priority && (
                        <span className={clsx(
                          'px-8px py-4px text-xs font-bold',
                          priorityColors[event.priority as keyof typeof priorityColors],
                          'text-[var(--theme-background)]'
                        )}>
                          {event.priority.toUpperCase()}
                        </span>
                      )}
                      {event.status && (
                        <span className="px-8px py-4px text-xs bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
                          {event.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-brutal-sm mb-4px">{event.title}</h3>
                    
                    <div className="flex items-center gap-16px text-xs text-[var(--theme-foreground)]/60">
                      <span>{format(event.date, 'MMM d, yyyy')}</span>
                      {event.endDate && (
                        <span>→ {format(event.endDate, 'MMM d, yyyy')}</span>
                      )}
                      <span className={clsx(
                        'font-bold',
                        daysUntil === 0 && 'text-[var(--theme-primary)]',
                        daysUntil === 1 && 'text-[var(--theme-warning)]',
                        daysUntil < 0 && 'text-[var(--theme-error)]'
                      )}>
                        {daysUntil === 0 ? 'TODAY' :
                         daysUntil === 1 ? 'TOMORROW' :
                         daysUntil > 0 ? `IN ${daysUntil} DAYS` :
                         `${Math.abs(daysUntil)} DAYS AGO`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-[var(--theme-background)]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-16px border-b-2 border-[var(--theme-border)]">
        <div className="flex items-center gap-16px">
          <h2 className="text-brutal-lg font-bold">
            {format(currentDate, 'MMMM yyyy').toUpperCase()}
          </h2>
          
          {/* Navigation */}
          <div className="flex items-center gap-8px">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-8px hover:bg-[var(--theme-hover)] transition-colors"
            >
              <HiOutlineChevronLeft className="w-16px h-16px" />
            </button>
            <button
              onClick={goToToday}
              className="px-12px py-6px text-xs font-bold border-2 border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
            >
              TODAY
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-8px hover:bg-[var(--theme-hover)] transition-colors"
            >
              <HiOutlineChevronRight className="w-16px h-16px" />
            </button>
          </div>
          
          {/* View switcher */}
          <div className="flex items-center gap-0 border-2 border-[var(--theme-border)]">
            <button
              onClick={() => setViewType('month')}
              className={clsx(
                'px-12px py-6px text-xs font-bold',
                viewType === 'month' 
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-background)]'
                  : 'hover:bg-[var(--theme-hover)]'
              )}
            >
              MONTH
            </button>
            <button
              onClick={() => setViewType('week')}
              className={clsx(
                'px-12px py-6px text-xs font-bold border-x border-[var(--theme-border)]',
                viewType === 'week' 
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-background)]'
                  : 'hover:bg-[var(--theme-hover)]'
              )}
              disabled
            >
              WEEK
            </button>
            <button
              onClick={() => setViewType('day')}
              className={clsx(
                'px-12px py-6px text-xs font-bold border-r border-[var(--theme-border)]',
                viewType === 'day' 
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-background)]'
                  : 'hover:bg-[var(--theme-hover)]'
              )}
              disabled
            >
              DAY
            </button>
            <button
              onClick={() => setViewType('agenda')}
              className={clsx(
                'px-12px py-6px text-xs font-bold',
                viewType === 'agenda' 
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-background)]'
                  : 'hover:bg-[var(--theme-hover)]'
              )}
            >
              AGENDA
            </button>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-8px">
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-12px py-6px text-xs font-bold bg-transparent border-2 border-[var(--theme-border)] outline-none"
          >
            <option value="all">ALL EVENTS</option>
            <option value="tasks">TASKS ONLY</option>
            <option value="meetings">MEETINGS ONLY</option>
            <option value="sprints">SPRINTS ONLY</option>
          </select>
          
          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="flex items-center gap-8px px-16px py-8px bg-[var(--theme-primary)] text-[var(--theme-background)] font-bold hover:opacity-90"
          >
            <HiOutlinePlus className="w-16px h-16px" />
            <span className="text-xs">NEW TASK</span>
          </button>
          
          <button
            onClick={() => setShowScheduleMeetingModal(true)}
            className="flex items-center gap-8px px-16px py-8px bg-transparent border-2 border-[var(--theme-border)] font-bold hover:bg-[var(--theme-hover)]"
          >
            <HiOutlineVideoCamera className="w-16px h-16px" />
            <span className="text-xs">SCHEDULE MEETING</span>
          </button>
        </div>
      </div>
      
      {/* Calendar Content */}
      <div className="flex-1 overflow-auto p-16px">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'agenda' && renderAgendaView()}
        {viewType === 'week' && (
          <div className="text-center py-48px text-[var(--theme-foreground)]/60">
            WEEK VIEW COMING SOON
          </div>
        )}
        {viewType === 'day' && (
          <div className="text-center py-48px text-[var(--theme-foreground)]/60">
            DAY VIEW COMING SOON
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showCreateTaskModal && (
        <CreateTaskModal
          projectId={projectId}
          initialData={selectedDate ? { dueDate: selectedDate.toISOString() } : undefined}
          onClose={() => {
            setShowCreateTaskModal(false)
            setSelectedDate(null)
          }}
        />
      )}
      
      {showEditTaskModal && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          onClose={() => {
            setShowEditTaskModal(false)
            setSelectedTask(null)
            setSelectedEvent(null)
          }}
        />
      )}
      
      {showScheduleMeetingModal && (
        <ScheduleMeetingModal
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() => setShowScheduleMeetingModal(false)}
        />
      )}
    </div>
  )
}