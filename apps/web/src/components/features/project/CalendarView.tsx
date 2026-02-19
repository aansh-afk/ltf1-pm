import { useMemo, useEffect, useReducer } from 'react'
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

type CalendarAction =
  | { type: 'SET_DATE'; date: Date }
  | { type: 'SELECT_DATE'; date: Date | null }
  | { type: 'SET_VIEW'; view: ViewType }
  | { type: 'SET_FILTER'; filter: 'all' | 'tasks' | 'meetings' | 'sprints' }
  | { type: 'OPEN_CREATE_TASK' }
  | { type: 'OPEN_EDIT_TASK'; task: any }
  | { type: 'OPEN_SCHEDULE_MEETING' }
  | { type: 'SELECT_EVENT'; event: CalendarEvent | null }
  | { type: 'CLOSE_MODALS' }

interface CalendarState {
  currentDate: Date
  selectedDate: Date | null
  viewType: ViewType
  filterType: 'all' | 'tasks' | 'meetings' | 'sprints'
  showCreateTaskModal: boolean
  showEditTaskModal: boolean
  showScheduleMeetingModal: boolean
  selectedTask: any
  selectedEvent: CalendarEvent | null
}

const calendarInitialState: CalendarState = {
  currentDate: new Date(),
  selectedDate: null,
  viewType: 'month',
  filterType: 'all',
  showCreateTaskModal: false,
  showEditTaskModal: false,
  showScheduleMeetingModal: false,
  selectedTask: null,
  selectedEvent: null,
}

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, currentDate: action.date }
    case 'SELECT_DATE':
      return { ...state, selectedDate: action.date }
    case 'SET_VIEW':
      return { ...state, viewType: action.view }
    case 'SET_FILTER':
      return { ...state, filterType: action.filter }
    case 'OPEN_CREATE_TASK':
      return { ...state, showCreateTaskModal: true }
    case 'OPEN_EDIT_TASK':
      return { ...state, showEditTaskModal: true, selectedTask: action.task }
    case 'OPEN_SCHEDULE_MEETING':
      return { ...state, showScheduleMeetingModal: true }
    case 'SELECT_EVENT':
      return { ...state, selectedEvent: action.event }
    case 'CLOSE_MODALS':
      return { ...state, showCreateTaskModal: false, showEditTaskModal: false, showScheduleMeetingModal: false, selectedTask: null }
    default:
      return state
  }
}

// --- Sub-components ---

interface MonthViewProps {
  calendarDays: Date[]
  currentDate: Date
  selectedDate: Date | null
  getEventsForDay: (date: Date) => CalendarEvent[]
  onDayClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

function MonthView({ calendarDays, currentDate, selectedDate, getEventsForDay, onDayClick, onEventClick }: MonthViewProps) {
  return (
    <div className="grid grid-cols-7 gap-0 border-2 border-[var(--theme-border)]">
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
        <div
          key={day}
          className="p-[4px] text-center font-bold text-xs border-b-2 border-r border-[var(--theme-border)] bg-[var(--theme-background-secondary)]"
        >
          {day}
        </div>
      ))}

      {calendarDays.map((day) => {
        const dayEvents = getEventsForDay(day)
        const isCurrentMonth = isSameMonth(day, currentDate)
        const isSelected = selectedDate && isSameDay(day, selectedDate)
        const isTodayDate = isToday(day)

        return (
          <button
            type="button"
            key={format(day, 'yyyy-MM-dd')}
            onClick={() => onDayClick(day)}
            className={clsx(
              'min-h-[100px] p-[4px] border-b border-r border-[var(--theme-border)] cursor-pointer transition-all text-left',
              !isCurrentMonth && 'bg-[var(--theme-background)]/50 opacity-50',
              isSelected && 'bg-[var(--theme-hover)]',
              isTodayDate && 'bg-[var(--theme-primary)]/10',
              'hover:bg-[var(--theme-hover)]/50'
            )}
          >
            <div className={clsx(
              'text-xs font-bold mb-[2px]',
              isTodayDate && 'text-[var(--theme-primary)]',
              !isCurrentMonth && 'text-[var(--theme-foreground)]/40'
            )}>
              {format(day, 'd')}
            </div>

            <div className="space-y-2px">
              {dayEvents.slice(0, 3).map(event => (
                <button
                  type="button"
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                  className={clsx(
                    'w-full text-left text-[10px] px-4px py-2px truncate cursor-pointer hover:opacity-80',
                    event.color,
                    'text-[var(--theme-background)]'
                  )}
                  title={event.title}
                >
                  {event.icon && <span className="inline-block mr-2px">{event.icon}</span>}
                  {event.title}
                </button>
              ))}

              {dayEvents.length > 3 && (
                <div className="text-[10px] text-[var(--theme-foreground)]/60 px-4px">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

interface AgendaViewProps {
  calendarEvents: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

function AgendaView({ calendarEvents, onEventClick }: AgendaViewProps) {
  const upcomingEvents = calendarEvents
    .filter(event => isFuture(event.date) || isToday(event.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 20)

  return (
    <div className="space-y-[8px]">
      {upcomingEvents.length === 0 ? (
        <div className="text-center py-[24px] text-[var(--theme-foreground)]/60">
          NO UPCOMING EVENTS
        </div>
      ) : (
        upcomingEvents.map(event => {
          const daysUntil = differenceInDays(event.date, new Date())

          return (
            <button
              type="button"
              key={event.id}
              onClick={() => onEventClick(event)}
              className={clsx(
                'w-full text-left p-[10px] border-2 border-[var(--theme-border)] cursor-pointer',
                'hover:shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px]',
                'transition-all'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-[4px] mb-[4px]">
                    <span className={clsx('px-[4px] py-4px text-xs font-bold', event.color, 'text-[var(--theme-background)]')}>
                      {event.type.toUpperCase()}
                    </span>
                    {event.priority && (
                      <span className={clsx(
                        'px-[4px] py-4px text-xs font-bold',
                        priorityColors[event.priority as keyof typeof priorityColors],
                        'text-[var(--theme-background)]'
                      )}>
                        {event.priority.toUpperCase()}
                      </span>
                    )}
                    {event.status && (
                      <span className="px-[4px] py-4px text-xs bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
                        {event.status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-brutal-sm mb-[2px]">{event.title}</h3>

                  <div className="flex items-center gap-[8px] text-xs text-[var(--theme-foreground)]/60">
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
            </button>
          )
        })
      )}
    </div>
  )
}

interface CalendarHeaderProps {
  currentDate: Date
  viewType: ViewType
  filterType: 'all' | 'tasks' | 'meetings' | 'sprints'
  onNavigateMonth: (direction: 'prev' | 'next') => void
  onGoToToday: () => void
  onSetView: (view: ViewType) => void
  onSetFilter: (filter: 'all' | 'tasks' | 'meetings' | 'sprints') => void
  onCreateTask: () => void
  onScheduleMeeting: () => void
}

function CalendarHeader({ currentDate, viewType, filterType, onNavigateMonth, onGoToToday, onSetView, onSetFilter, onCreateTask, onScheduleMeeting }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-[10px] border-b-2 border-[var(--theme-border)]">
      <div className="flex items-center gap-[8px]">
        <h2 className="text-[14px] font-semibold font-bold">
          {format(currentDate, 'MMMM yyyy').toUpperCase()}
        </h2>

        {/* Navigation */}
        <div className="flex items-center gap-[4px]">
          <button
            onClick={() => onNavigateMonth('prev')}
            className="p-[4px] hover:bg-[var(--theme-hover)] transition-colors"
          >
            <HiOutlineChevronLeft className="w-16px h-16px" />
          </button>
          <button
            onClick={onGoToToday}
            className="px-[8px] py-6px text-xs font-bold border-2 border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
          >
            TODAY
          </button>
          <button
            onClick={() => onNavigateMonth('next')}
            className="p-[4px] hover:bg-[var(--theme-hover)] transition-colors"
          >
            <HiOutlineChevronRight className="w-16px h-16px" />
          </button>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-0 border-2 border-[var(--theme-border)]">
          <button
            onClick={() => onSetView('month')}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold',
              viewType === 'month'
                ? 'bg-[var(--theme-primary)] text-[var(--theme-background)]'
                : 'hover:bg-[var(--theme-hover)]'
            )}
          >
            MONTH
          </button>
          <button
            onClick={() => onSetView('week')}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold border-x border-[var(--theme-border)]',
              viewType === 'week'
                ? 'bg-[var(--theme-primary)] text-[var(--theme-background)]'
                : 'hover:bg-[var(--theme-hover)]'
            )}
            disabled
          >
            WEEK
          </button>
          <button
            onClick={() => onSetView('day')}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold border-r border-[var(--theme-border)]',
              viewType === 'day'
                ? 'bg-[var(--theme-primary)] text-[var(--theme-background)]'
                : 'hover:bg-[var(--theme-hover)]'
            )}
            disabled
          >
            DAY
          </button>
          <button
            onClick={() => onSetView('agenda')}
            className={clsx(
              'px-[8px] py-6px text-xs font-bold',
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
      <div className="flex items-center gap-[4px]">
        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => onSetFilter(e.target.value as any)}
          aria-label="Filter event type"
          className="px-[8px] py-6px text-xs font-bold bg-transparent border-2 border-[var(--theme-border)] outline-none"
        >
          <option value="all">ALL EVENTS</option>
          <option value="tasks">TASKS ONLY</option>
          <option value="meetings">MEETINGS ONLY</option>
          <option value="sprints">SPRINTS ONLY</option>
        </select>

        <button
          onClick={onCreateTask}
          className="flex items-center gap-[4px] px-[10px] py-[4px] bg-[var(--theme-primary)] text-[var(--theme-background)] font-bold hover:opacity-90"
        >
          <HiOutlinePlus className="w-16px h-16px" />
          <span className="text-xs">NEW TASK</span>
        </button>

        <button
          onClick={onScheduleMeeting}
          className="flex items-center gap-[4px] px-[10px] py-[4px] bg-transparent border-2 border-[var(--theme-border)] font-bold hover:bg-[var(--theme-hover)]"
        >
          <HiOutlineVideoCamera className="w-16px h-16px" />
          <span className="text-xs">SCHEDULE MEETING</span>
        </button>
      </div>
    </div>
  )
}

// --- Main Component ---

export default function CalendarView({ projectId, workspaceId }: CalendarViewProps) {
  const [state, dispatch] = useReducer(calendarReducer, calendarInitialState)
  const { currentDate, selectedDate, viewType, filterType, showCreateTaskModal, showEditTaskModal, showScheduleMeetingModal, selectedTask, selectedEvent } = state
  
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
    dispatch({ type: 'SET_DATE', date: direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1) })
  }

  const goToToday = () => {
    dispatch({ type: 'SET_DATE', date: new Date() })
    dispatch({ type: 'SELECT_DATE', date: new Date() })
  }

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    dispatch({ type: 'SELECT_EVENT', event })

    if (event.type === 'task' || event.type === 'milestone') {
      dispatch({ type: 'OPEN_EDIT_TASK', task: event.data })
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
    dispatch({ type: 'SELECT_DATE', date })
    dispatch({ type: 'OPEN_CREATE_TASK' })
  }
  
  return (
    <div className="h-full flex flex-col bg-[var(--theme-background)]">
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewType={viewType}
        filterType={filterType}
        onNavigateMonth={navigateMonth}
        onGoToToday={goToToday}
        onSetView={(view) => dispatch({ type: 'SET_VIEW', view })}
        onSetFilter={(filter) => dispatch({ type: 'SET_FILTER', filter })}
        onCreateTask={() => dispatch({ type: 'OPEN_CREATE_TASK' })}
        onScheduleMeeting={() => dispatch({ type: 'OPEN_SCHEDULE_MEETING' })}
      />
      
      {/* Calendar Content */}
      <div className="flex-1 overflow-auto p-[10px]">
        {viewType === 'month' && (
          <MonthView
            calendarDays={calendarDays}
            currentDate={currentDate}
            selectedDate={selectedDate}
            getEventsForDay={getEventsForDay}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
        {viewType === 'agenda' && (
          <AgendaView
            calendarEvents={calendarEvents}
            onEventClick={handleEventClick}
          />
        )}
        {viewType === 'week' && (
          <div className="text-center py-[24px] text-[var(--theme-foreground)]/60">
            WEEK VIEW COMING SOON
          </div>
        )}
        {viewType === 'day' && (
          <div className="text-center py-[24px] text-[var(--theme-foreground)]/60">
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
            dispatch({ type: 'CLOSE_MODALS' })
            dispatch({ type: 'SELECT_DATE', date: null })
          }}
        />
      )}
      
      {showEditTaskModal && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          onClose={() => {
            dispatch({ type: 'CLOSE_MODALS' })
            dispatch({ type: 'SELECT_EVENT', event: null })
          }}
        />
      )}
      
      {showScheduleMeetingModal && (
        <ScheduleMeetingModal
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
        />
      )}
    </div>
  )
}