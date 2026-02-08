import { useState, useMemo } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { format, parseISO, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay, addHours, isSameDay, isWithinInterval } from 'date-fns'
import BrutalCalendar from '../../ui/BrutalCalendar'
import CreateTaskModal from './CreateTaskModal'
import {
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi'
import clsx from 'clsx'

interface TaskCalendarProps {
  tasks: any[]
  projectId: string
  onTaskUpdate: () => void
}

const statusColors = {
  backlog: 'bg-neutral-600',
  todo: 'bg-primary-brutalist',
  in_progress: 'bg-[var(--theme-info)]',
  in_review: 'bg-[var(--theme-accent)]',
  done: 'bg-[var(--theme-success)]',
  cancelled: 'bg-[var(--theme-error)]'
}

const priorityIcons = {
  urgent: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢'
}

export default function TaskCalendar({ tasks, projectId, onTaskUpdate }: TaskCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalDate, setCreateModalDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const updateTask = useMutation(api.tasks.mutations.updateTask)

  // Convert tasks to calendar events
  const calendarEvents = useMemo(() => {
    const events = []
    
    // Add due dates
    tasks.forEach(task => {
      if (task.dueDate) {
        events.push({
          id: `${task._id}-due`,
          title: `${priorityIcons[task.priority as keyof typeof priorityIcons] || ''} ${task.title}`,
          date: new Date(task.dueDate),
          type: 'due',
          color: statusColors[task.status as keyof typeof statusColors],
          task
        })
      }
      
      // Add start dates if different from due date
      if (task.startDate && task.startDate !== task.dueDate) {
        events.push({
          id: `${task._id}-start`,
          title: `▶ ${task.title}`,
          date: new Date(task.startDate),
          type: 'start',
          color: 'bg-neutral-500',
          task
        })
      }
    })
    
    return events
  }, [tasks])

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    return tasks.filter(task => {
      const dueDate = task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : null
      const startDate = task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : null
      return dueDate === dateStr || startDate === dateStr
    })
  }, [tasks, selectedDate])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleEventClick = (event: any) => {
    setSelectedTask(event.task)
  }

  const handleCreateTask = (date: Date) => {
    setCreateModalDate(date)
    setIsCreateModalOpen(true)
  }

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    await updateTask({ taskId: taskId as any, ...updates })
    onTaskUpdate()
  }

  // Generate week view hours
  const weekHours = useMemo(() => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push(i)
    }
    return hours
  }, [])

  // Get week days for week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate)
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    return days
  }, [currentDate])

  // Navigate dates
  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, -7))
    } else {
      setCurrentDate(prev => addDays(prev, -1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, 7))
    } else {
      setCurrentDate(prev => addDays(prev, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Get tasks for a specific hour slot
  const getTasksForHourSlot = (date: Date, hour: number) => {
    const slotStart = addHours(startOfDay(date), hour)
    const slotEnd = addHours(slotStart, 1)
    
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      // For simplicity, we'll show tasks on the hour they're due
      return isSameDay(taskDate, date) && taskDate.getHours() === hour
    })
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {/* Calendar View */}
      <div className="w-full">
        {/* Compact Controls Bar */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[4px] mb-[4px]">
          <div className="flex flex-wrap items-center justify-between gap-[4px]">
            {/* Navigation & Date */}
            <div className="flex items-center gap-4px">
              <button
                onClick={handlePrevious}
                className="p-4px border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] transition-colors h-[28px] w-[28px] flex items-center justify-center"
                title="Previous"
              >
                <HiOutlineChevronLeft className="w-12px h-12px" />
              </button>
              
              <span className="font-mono text-brutal-xs uppercase px-[4px]">
                {viewMode === 'month' && format(currentDate, 'MMM yyyy')}
                {viewMode === 'week' && format(startOfWeek(currentDate), 'MMM dd')}
                {viewMode === 'day' && format(currentDate, 'MMM dd')}
              </span>
              
              <button
                onClick={handleNext}
                className="p-4px border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] transition-colors h-[28px] w-[28px] flex items-center justify-center"
                title="Next"
              >
                <HiOutlineChevronRight className="w-12px h-12px" />
              </button>
              
              <button
                onClick={handleToday}
                className="px-6px h-[28px] border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] transition-colors font-mono text-brutal-xs uppercase flex items-center"
                title="Today"
              >
                TODAY
              </button>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex border-2 border-[var(--theme-border)]">
              <button
                className={clsx(
                  "px-[4px] h-[28px] flex items-center justify-center",
                  "font-mono text-brutal-xs uppercase transition-colors",
                  "border-r border-[var(--theme-border)]",
                  viewMode === 'month' 
                    ? "bg-primary-brutalist text-event-horizon" 
                    : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                )}
                onClick={() => setViewMode('month')}
              >
                M
              </button>
              <button
                className={clsx(
                  "px-[4px] h-[28px] flex items-center justify-center",
                  "font-mono text-brutal-xs uppercase transition-colors",
                  "border-r border-[var(--theme-border)]",
                  viewMode === 'week' 
                    ? "bg-primary-brutalist text-event-horizon" 
                    : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                )}
                onClick={() => setViewMode('week')}
              >
                W
              </button>
              <button
                className={clsx(
                  "px-[4px] h-[28px] flex items-center justify-center",
                  "font-mono text-brutal-xs uppercase transition-colors",
                  viewMode === 'day' 
                    ? "bg-primary-brutalist text-event-horizon" 
                    : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                )}
                onClick={() => setViewMode('day')}
              >
                D
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Content based on view mode */}
        {viewMode === 'month' ? (
          <BrutalCalendar
            events={calendarEvents}
            selectedDate={selectedDate || undefined}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            currentDate={currentDate}
          />
        ) : viewMode === 'week' ? (
          /* Compact Week View */
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] overflow-x-auto overflow-y-hidden">
            <div className="w-full">
              {/* Week Days Header */}
              <div className="flex border-b-2 border-[var(--theme-border)]">
                <div className="w-[40px] flex-shrink-0 p-2px text-center font-mono text-[10px] uppercase bg-[var(--theme-background-secondary)] border-r border-[var(--theme-border)]">
                  TIME
                </div>
                {weekDays.map(day => (
                  <div
                    key={day.toString()}
                    className={clsx(
                      "flex-1 min-w-[60px] p-2px text-center font-mono text-[10px] uppercase bg-[var(--theme-background-secondary)] border-r border-[var(--theme-border)] last:border-r-0",
                      isSameDay(day, new Date()) && "bg-primary-brutalist text-event-horizon"
                    )}
                  >
                    <div>{format(day, 'E')[0]}</div>
                    <div className="text-brutal-xs font-bold">{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
              
              {/* Hour Rows */}
              <div className="max-h-[400px] overflow-y-auto">
                {weekHours.filter(h => h >= 7 && h <= 20).map(hour => (
                  <div key={hour} className="flex border-b border-[var(--theme-border)]">
                    <div className="w-[40px] flex-shrink-0 p-1px text-center font-mono text-[10px] bg-[var(--theme-background-secondary)] border-r border-[var(--theme-border)]">
                      {hour}:00
                    </div>
                    {weekDays.map(day => {
                      const dayTasks = getTasksForHourSlot(day, hour)
                      return (
                        <div
                          key={day.toString()}
                          className="flex-1 min-w-[60px] p-1px min-h-[40px] border-r border-[var(--theme-border)] last:border-r-0 hover:bg-[var(--theme-background-secondary)] cursor-pointer"
                          onClick={() => {
                            const date = new Date(day)
                            date.setHours(hour, 0, 0, 0)
                            handleCreateTask(date)
                          }}
                        >
                          {dayTasks.slice(0, 2).map(task => (
                            <div
                              key={task._id}
                              className={clsx(
                                "p-1px mb-1px text-[10px] truncate cursor-pointer",
                                statusColors[task.status as keyof typeof statusColors]
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTask(task)
                              }}
                              title={task.title}
                            >
                              {task.title.substring(0, 8)}
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-[10px] opacity-50">+{dayTasks.length - 2}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Compact Day View */
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] overflow-auto">
            <div className="w-full">
              {/* Hour Rows */}
              <div className="max-h-[500px] overflow-y-auto">
                {weekHours.filter(h => h >= 6 && h <= 22).map(hour => {
                  const hourTasks = getTasksForHourSlot(currentDate, hour)
                  return (
                    <div key={hour} className="flex border-b border-[var(--theme-border)]">
                      <div className="w-[50px] flex-shrink-0 p-2px text-center font-mono text-[11px] bg-[var(--theme-background-secondary)] border-r border-[var(--theme-border)]">
                        {hour}:00
                      </div>
                      <div 
                        className="flex-1 p-4px min-h-[50px] hover:bg-[var(--theme-background-secondary)] cursor-pointer"
                        onClick={() => {
                          const date = new Date(currentDate)
                          date.setHours(hour, 0, 0, 0)
                          handleCreateTask(date)
                        }}
                      >
                        {hourTasks.map(task => (
                          <div
                            key={task._id}
                            className={clsx(
                              "p-4px mb-[2px] border border-[var(--theme-border)] cursor-pointer",
                              statusColors[task.status as keyof typeof statusColors]
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTask(task)
                            }}
                          >
                            <div className="font-mono text-[11px] font-bold truncate">
                              {priorityIcons[task.priority as keyof typeof priorityIcons]} {task.title}
                            </div>
                            {task.description && (
                              <div className="text-[10px] mt-2px opacity-70 truncate">
                                {task.description.substring(0, 50)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Details Sidebar */}
      <div className="space-y-[12px]">
        {/* Selected Date Info */}
        {selectedDate && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[10px]">
            <div className="flex items-center justify-between mb-[8px]">
              <h3 className="font-mono text-brutal-md uppercase">
                {format(selectedDate, 'MMM dd, yyyy')}
              </h3>
              <button
                onClick={() => handleCreateTask(selectedDate)}
                className="brutal-btn-sm"
              >
                + ADD TASK
              </button>
            </div>
            
            {selectedDateTasks.length > 0 ? (
              <div className="flex flex-wrap gap-4px">
                {selectedDateTasks.slice(0, 5).map(task => {
                  return (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTask(task)}
                      className={clsx(
                        "px-4px py-2px border border-[var(--theme-border)] cursor-pointer text-[10px]",
                        "hover:bg-[var(--theme-background-secondary)] transition-colors",
                        statusColors[task.status as keyof typeof statusColors],
                        selectedTask?._id === task._id && "ring-2 ring-primary-brutalist"
                      )}
                      title={task.title}
                    >
                      {task.title.substring(0, 15)}
                    </div>
                  )
                })}
                {selectedDateTasks.length > 5 && (
                  <span className="text-[10px] opacity-50">+{selectedDateTasks.length - 5} more</span>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-neutral-500">No tasks</p>
            )}
          </div>
        )}

          {/* Selected Task Summary */}
          {selectedTask && (
            <div className="border-t border-[var(--theme-border)] pt-8px">
              <div className="flex items-center justify-between mb-[2px]">
                <h4 className="font-mono text-[11px] uppercase font-bold truncate">
                  {selectedTask.title}
                </h4>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-[14px] hover:text-[var(--theme-error)]">×</button>
              </div>
              
              <div className="flex flex-wrap gap-4px text-[10px]">
                <span className={clsx(
                  "px-2px py-1px",
                  statusColors[selectedTask.status as keyof typeof statusColors]
                )}>
                  {selectedTask.status.toUpperCase()}
                </span>
                <span className="px-2px py-1px border border-[var(--theme-border)]">
                  {priorityIcons[selectedTask.priority as keyof typeof priorityIcons]} {selectedTask.priority.toUpperCase()}
                </span>
                {selectedTask.dueDate && (
                  <span className="px-2px py-1px border border-[var(--theme-border)]">
                    DUE: {format(new Date(selectedTask.dueDate), 'MMM dd')}
                  </span>
                )}
                {selectedTask.status !== 'done' && (
                  <button
                    onClick={() => handleTaskUpdate(selectedTask._id, { status: 'done' })}
                    className="px-4px py-1px bg-[var(--theme-success)] text-white hover:bg-opacity-80 text-[10px] uppercase"
                  >
                    COMPLETE
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Calendar Legend */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[10px]">
          <h3 className="font-mono text-brutal-md uppercase mb-[8px]">LEGEND</h3>
          <div className="space-y-[4px] text-brutal-xs">
            <div className="flex items-center gap-[4px]">
              <div className="w-16px h-16px bg-[var(--theme-info)] border border-[var(--theme-border)]"></div>
              <span>TODAY</span>
            </div>
            <div className="flex items-center gap-[4px]">
              <span>🔴</span>
              <span>URGENT PRIORITY</span>
            </div>
            <div className="flex items-center gap-[4px]">
              <span>🟠</span>
              <span>HIGH PRIORITY</span>
            </div>
            <div className="flex items-center gap-[4px]">
              <span>🟡</span>
              <span>MEDIUM PRIORITY</span>
            </div>
            <div className="flex items-center gap-[4px]">
              <span>🟢</span>
              <span>LOW PRIORITY</span>
            </div>
            <div className="flex items-center gap-[4px]">
              <span>▶</span>
              <span>TASK START DATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setCreateModalDate(null)
        }}
        projectId={projectId as any}
        defaultDueDate={createModalDate?.toISOString()}
      />
    </div>
  )
}