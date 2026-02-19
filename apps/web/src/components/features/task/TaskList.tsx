import { useState, memo, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlineChevronUp
} from 'react-icons/hi'
import clsx from 'clsx'
import { format } from 'date-fns'
import CreateTaskModal from './CreateTaskModal'
import BrutalCheckbox from '../../ui/BrutalCheckbox'

interface TaskListProps {
  tasks: any[]
  projectId: string
  onTaskUpdate?: () => void
  onTaskEdit?: (task: any) => void
  onTaskDelete?: (task: any) => void
  onTaskDuplicate?: (task: any) => void
}

const statusConfig = {
  backlog: { label: 'BACKLOG', color: 'bg-[#6B7280]', icon: HiOutlineClock },
  todo: { label: 'TO DO', color: 'bg-[#6366F1]', icon: HiOutlinePlay },
  in_progress: { label: 'IN PROGRESS', color: 'bg-[#06B6D4]', icon: HiOutlinePlay },
  in_review: { label: 'IN REVIEW', color: 'bg-[#F59E0B]', icon: HiOutlineClock },
  done: { label: 'DONE', color: 'bg-[#22C55E]', icon: HiOutlineCheckCircle },
  cancelled: { label: 'CANCELLED', color: 'bg-[#EF4444]', icon: HiOutlineExclamation }
}

const priorityConfig = {
  urgent: { label: 'URGENT', color: 'text-[#EF4444]' },
  high: { label: 'HIGH', color: 'text-[#F59E0B]' },
  medium: { label: 'MEDIUM', color: 'text-[#6366F1]' },
  low: { label: 'LOW', color: 'text-[#6B7280]' }
}

const typeConfig = {
  feature: { label: 'FEATURE', color: 'bg-[#22C55E]' },
  bug: { label: 'BUG', color: 'bg-[#EF4444]' },
  improvement: { label: 'IMPROVEMENT', color: 'bg-[#06B6D4]' },
  task: { label: 'TASK', color: 'bg-[#6366F1]' },
  epic: { label: 'EPIC', color: 'bg-[#F59E0B]' }
}

const TaskList = memo(function TaskList({ tasks, projectId, onTaskUpdate, onTaskEdit, onTaskDelete, onTaskDuplicate }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'status' | 'priority' | 'dueDate' | 'assignee'>('status')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const updateTask = useMutation(api.tasks.mutations.updateTask)

  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }, [])

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }, [])

  const selectAllTasks = useCallback(() => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(tasks.map(t => t._id)))
    }
  }, [selectedTasks.size, tasks])

  const handleSort = useCallback((field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy])

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    let compareValue = 0

    switch (sortBy) {
      case 'status':
        const statusOrder = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']
        compareValue = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
        break
      case 'priority':
        const priorityOrder = ['urgent', 'high', 'medium', 'low']
        compareValue = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
        break
      case 'dueDate':
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        break
      case 'assignee':
        const aName = a.assignees?.[0]?.name || ''
        const bName = b.assignees?.[0]?.name || ''
        if (!aName) return 1
        if (!bName) return -1
        compareValue = aName.localeCompare(bName)
        break
    }

    return sortOrder === 'asc' ? compareValue : -compareValue
  })

  return (
    <div className="space-y-3">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrutalCheckbox
            checked={selectedTasks.size === tasks.length && tasks.length > 0}
            onChange={selectAllTasks}
            size="sm"
          />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF]">
            {selectedTasks.size > 0 && `${selectedTasks.size} SELECTED`}
          </span>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-1.5 bg-[#6366F1] text-[#F9FAFB] font-mono text-xs uppercase tracking-wider hover:bg-[#4F46E5] transition-colors border-2 border-[#6366F1]"
        >
          + NEW TASK
        </button>
      </div>

      {/* Table Header */}
      <div className="bg-[#0A0A0A] border-2 border-[#2E2E35]">
        <div className="grid grid-cols-12 gap-2 px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#6B7280] border-b-2 border-[#2E2E35]">
          <div className="col-span-1"></div>
          <div className="col-span-4">TASK</div>
          <button
            className="col-span-2 cursor-pointer hover:text-[#6366F1] transition-colors text-left text-[inherit] font-[inherit] tracking-[inherit] uppercase"
            onClick={() => handleSort('status')}
          >
            STATUS {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className="col-span-1 cursor-pointer hover:text-[#6366F1] transition-colors text-left text-[inherit] font-[inherit] tracking-[inherit] uppercase"
            onClick={() => handleSort('priority')}
          >
            PRIORITY {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className="col-span-2 cursor-pointer hover:text-[#6366F1] transition-colors text-left text-[inherit] font-[inherit] tracking-[inherit] uppercase"
            onClick={() => handleSort('assignee')}
          >
            ASSIGNEE {sortBy === 'assignee' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className="col-span-2 cursor-pointer hover:text-[#6366F1] transition-colors text-left text-[inherit] font-[inherit] tracking-[inherit] uppercase"
            onClick={() => handleSort('dueDate')}
          >
            DUE DATE {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>

        {/* Task Rows */}
        {sortedTasks.map((task) => {
          const StatusIcon = statusConfig[task.status as keyof typeof statusConfig]?.icon || HiOutlineClock
          const isExpanded = expandedTasks.has(task._id)
          const isSelected = selectedTasks.has(task._id)

          return (
            <div key={task._id} className="border-b border-[#1F1F23] last:border-b-0">
              {/* Main Row */}
              <div className={clsx(
                "grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-[#111111] transition-colors",
                isSelected && "bg-[#6366F1]/10"
              )}>
                <div className="col-span-1 flex items-center gap-1.5">
                  <BrutalCheckbox
                    checked={isSelected}
                    onChange={() => toggleTaskSelection(task._id)}
                    size="sm"
                  />
                  <button
                    onClick={() => toggleTaskExpansion(task._id)}
                    className="p-0.5 hover:bg-[#111111] transition-colors"
                  >
                    {isExpanded ? (
                      <HiOutlineChevronUp className="w-3.5 h-3.5 text-[#6B7280]" />
                    ) : (
                      <HiOutlineChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                    )}
                  </button>
                </div>

                <div className="col-span-4">
                  <div className="flex items-center gap-1.5">
                    <span className={clsx(
                      "px-1 py-0.5 text-[10px] font-mono font-bold",
                      typeConfig[task.type as keyof typeof typeConfig]?.color || 'bg-[#6366F1]',
                      "text-[#050505]"
                    )}>
                      {task.key}
                    </span>
                    <span className="font-mono text-xs text-[#F9FAFB]">{task.title}</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className={clsx(
                    "inline-flex items-center gap-1 px-1.5 py-0.5",
                    statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-[#6B7280]',
                    "text-[#050505] font-mono text-[10px] uppercase"
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                  </div>
                </div>

                <div className="col-span-1">
                  <span className={clsx(
                    "font-mono text-[10px] uppercase",
                    priorityConfig[task.priority as keyof typeof priorityConfig]?.color || 'text-[#6B7280]'
                  )}>
                    {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
                  </span>
                </div>

                <div className="col-span-2">
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {task.assignees.slice(0, 2).map((assignee: any, index: number) => (
                        <div key={assignee._id} className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-[#6366F1] border border-[#2E2E35] flex items-center justify-center">
                            <span className="text-[#050505] text-[10px] font-bold">
                              {assignee.name.charAt(0)}
                            </span>
                          </div>
                          {index === 0 && task.assignees.length === 1 && (
                            <span className="text-[10px] font-mono text-[#9CA3AF]">{assignee.name}</span>
                          )}
                        </div>
                      ))}
                      {task.assignees.length > 2 && (
                        <span className="text-[10px] font-mono text-[#6B7280]">
                          +{task.assignees.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-[#6B7280]">UNASSIGNED</span>
                  )}
                </div>

                <div className="col-span-2">
                  {task.dueDate ? (
                    <div className={clsx(
                      "flex items-center gap-1 text-[10px] font-mono",
                      new Date(task.dueDate) < new Date() ? 'text-[#EF4444]' : 'text-[#9CA3AF]'
                    )}>
                      <HiOutlineCalendar className="w-3 h-3" />
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-[#6B7280]">NO DUE DATE</span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-12 py-2.5 bg-[#111111] border-t border-[#1F1F23]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280] mb-1">Description</h4>
                      <p className="text-xs font-mono text-[#9CA3AF]">
                        {task.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280] mb-1">Details</h4>
                        <div className="space-y-1 text-[10px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#6B7280]">TYPE:</span>
                            <span className="text-[#9CA3AF] uppercase">{task.type}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#6B7280]">REPORTER:</span>
                            <span className="text-[#9CA3AF]">{task.reporter?.name || 'Unknown'}</span>
                          </div>
                          {task.estimate && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#6B7280]">ESTIMATE:</span>
                              <span className="text-[#9CA3AF]">{task.estimate.points || task.estimate.hours}h</span>
                            </div>
                          )}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#6B7280]">LABELS:</span>
                              <div className="flex gap-1">
                                {task.labels.map((label: string) => (
                                  <span key={label} className="px-1 py-0.5 bg-[#6366F1]/20 text-[#6366F1] text-[10px] font-mono">
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onTaskEdit?.(task)}
                          className="px-2 py-1 text-[10px] font-mono uppercase border-2 border-[#2E2E35] text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => onTaskDelete?.(task)}
                          className="px-2 py-1 text-[10px] font-mono uppercase border-2 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444] hover:text-[#F9FAFB] transition-colors"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Task Modal */}
      {projectId && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={projectId as any}
          onSuccess={onTaskUpdate}
        />
      )}
    </div>
  )
})

export default TaskList
