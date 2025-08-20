import { useState, useMemo } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { format, parseISO } from 'date-fns'
import BrutalCalendar from '../../ui/BrutalCalendar'
import CreateTaskModal from './CreateTaskModal'
import {
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineCalendar
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
          date: parseISO(task.dueDate),
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
          date: parseISO(task.startDate),
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
      const dueDate = task.dueDate ? format(parseISO(task.dueDate), 'yyyy-MM-dd') : null
      const startDate = task.startDate ? format(parseISO(task.startDate), 'yyyy-MM-dd') : null
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

  return (
    <div className="grid grid-cols-3 gap-24px">
      {/* Calendar View */}
      <div className="col-span-2">
        <BrutalCalendar
          events={calendarEvents}
          selectedDate={selectedDate || undefined}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
        />
      </div>

      {/* Task Details Sidebar */}
      <div className="space-y-24px">
        {/* Selected Date Info */}
        {selectedDate && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="flex items-center justify-between mb-16px">
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
              <div className="space-y-8px">
                {selectedDateTasks.map(task => {
                  const isDue = task.dueDate && format(parseISO(task.dueDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  const isStart = task.startDate && format(parseISO(task.startDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  
                  return (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTask(task)}
                      className={clsx(
                        "p-8px border-2 border-[var(--theme-border)] cursor-pointer",
                        "hover:bg-[var(--theme-background-secondary)] transition-colors",
                        selectedTask?._id === task._id && "bg-primary-brutalist text-event-horizon"
                      )}
                    >
                      <div className="flex items-center gap-8px mb-4px">
                        <span className={clsx(
                          "px-4px py-2px text-brutal-xs",
                          statusColors[task.status as keyof typeof statusColors],
                          "text-event-horizon"
                        )}>
                          {task.key}
                        </span>
                        {isDue && <span className="text-brutal-xs text-[var(--theme-error)]">DUE</span>}
                        {isStart && <span className="text-brutal-xs text-[var(--theme-success)]">START</span>}
                      </div>
                      <div className="font-mono text-brutal-xs">{task.title}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-brutal-sm text-neutral-500">NO TASKS ON THIS DATE</p>
            )}
          </div>
        )}

        {/* Selected Task Details */}
        {selectedTask && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <h3 className="font-mono text-brutal-md uppercase mb-16px">TASK DETAILS</h3>
            
            <div className="space-y-12px">
              <div>
                <span className="text-brutal-xs text-neutral-500">TITLE:</span>
                <p className="font-mono text-brutal-sm">{selectedTask.title}</p>
              </div>
              
              <div>
                <span className="text-brutal-xs text-neutral-500">STATUS:</span>
                <div className={clsx(
                  "inline-flex items-center gap-4px px-8px py-4px mt-4px",
                  statusColors[selectedTask.status as keyof typeof statusColors],
                  "font-mono text-brutal-xs uppercase text-event-horizon"
                )}>
                  {selectedTask.status.replace('_', ' ')}
                </div>
              </div>
              
              <div>
                <span className="text-brutal-xs text-neutral-500">PRIORITY:</span>
                <p className="font-mono text-brutal-sm">
                  {priorityIcons[selectedTask.priority as keyof typeof priorityIcons]} {selectedTask.priority.toUpperCase()}
                </p>
              </div>
              
              {selectedTask.assignee && (
                <div>
                  <span className="text-brutal-xs text-neutral-500">ASSIGNEE:</span>
                  <p className="font-mono text-brutal-sm">{selectedTask.assignee.name}</p>
                </div>
              )}
              
              {selectedTask.description && (
                <div>
                  <span className="text-brutal-xs text-neutral-500">DESCRIPTION:</span>
                  <p className="text-brutal-sm mt-4px">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="pt-12px flex gap-8px">
                <button className="brutal-btn-sm">EDIT</button>
                <button 
                  onClick={() => {
                    // Navigate to task in board view
                    const element = document.getElementById(`task-${selectedTask._id}`)
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className="brutal-btn-sm"
                >
                  VIEW IN BOARD
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Legend */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
          <h3 className="font-mono text-brutal-md uppercase mb-16px">LEGEND</h3>
          <div className="space-y-8px text-brutal-xs">
            <div className="flex items-center gap-8px">
              <div className="w-16px h-16px bg-[var(--theme-info)] border border-[var(--theme-border)]"></div>
              <span>TODAY</span>
            </div>
            <div className="flex items-center gap-8px">
              <span>🔴</span>
              <span>URGENT PRIORITY</span>
            </div>
            <div className="flex items-center gap-8px">
              <span>🟠</span>
              <span>HIGH PRIORITY</span>
            </div>
            <div className="flex items-center gap-8px">
              <span>🟡</span>
              <span>MEDIUM PRIORITY</span>
            </div>
            <div className="flex items-center gap-8px">
              <span>🟢</span>
              <span>LOW PRIORITY</span>
            </div>
            <div className="flex items-center gap-8px">
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