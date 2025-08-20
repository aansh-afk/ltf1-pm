import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineHashtag,
  HiOutlineChevronDown,
  HiOutlineChevronUp
} from 'react-icons/hi'
import clsx from 'clsx'
import { format } from 'date-fns'
import CreateTaskModal from './CreateTaskModal'
import { BrutalCheckbox } from '../../ui'

interface TaskListProps {
  tasks: any[]
  projectId: string
  onTaskUpdate?: () => void
  onTaskEdit?: (task: any) => void
  onTaskDelete?: (task: any) => void
  onTaskDuplicate?: (task: any) => void
}

const statusConfig = {
  backlog: { label: 'BACKLOG', color: 'bg-neutral-600', icon: HiOutlineClock },
  todo: { label: 'TO DO', color: 'bg-primary-brutalist text-event-horizon', icon: HiOutlinePlay },
  in_progress: { label: 'IN PROGRESS', color: 'bg-[var(--theme-info)] text-event-horizon', icon: HiOutlinePlay },
  in_review: { label: 'IN REVIEW', color: 'bg-[var(--theme-accent)] text-event-horizon', icon: HiOutlineClock },
  done: { label: 'DONE', color: 'bg-[var(--theme-success)] text-event-horizon', icon: HiOutlineCheckCircle },
  cancelled: { label: 'CANCELLED', color: 'bg-[var(--theme-error)] text-[var(--theme-foreground)]', icon: HiOutlineExclamation }
}

const priorityConfig = {
  urgent: { label: 'URGENT', color: 'text-[var(--theme-error)]' },
  high: { label: 'HIGH', color: 'text-[var(--theme-accent)]' },
  medium: { label: 'MEDIUM', color: 'text-primary-brutalist' },
  low: { label: 'LOW', color: 'text-neutral-400' }
}

const typeConfig = {
  feature: { label: 'FEATURE', color: 'bg-[var(--theme-success)]' },
  bug: { label: 'BUG', color: 'bg-[var(--theme-error)]' },
  improvement: { label: 'IMPROVEMENT', color: 'bg-[var(--theme-info)]' },
  task: { label: 'TASK', color: 'bg-primary-brutalist' },
  epic: { label: 'EPIC', color: 'bg-[var(--theme-accent)]' }
}

export default function TaskList({ tasks, projectId, onTaskUpdate, onTaskEdit, onTaskDelete, onTaskDuplicate }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'status' | 'priority' | 'dueDate' | 'assignee'>('status')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  const updateTask = useMutation(api.tasks.mutations.updateTask)

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const selectAllTasks = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(tasks.map(t => t._id)))
    }
  }

  const handleSort = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

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
    <div className="space-y-24px">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-16px">
          <BrutalCheckbox
            checked={selectedTasks.size === tasks.length && tasks.length > 0}
            onChange={selectAllTasks}
            size="sm"
            className="w-16px h-16px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
          />
          <span className="text-brutal-sm">
            {selectedTasks.size > 0 && `${selectedTasks.size} SELECTED`}
          </span>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="brutal-btn"
        >
          + NEW TASK
        </button>
      </div>

      {/* Table Header */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
        <div className="grid grid-cols-12 gap-16px p-16px font-mono text-brutal-sm uppercase border-b-2 border-[var(--theme-border)]">
          <div className="col-span-1"></div>
          <div className="col-span-4">TASK</div>
          <div 
            className="col-span-2 cursor-pointer hover:text-primary-brutalist"
            onClick={() => handleSort('status')}
          >
            STATUS {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="col-span-1 cursor-pointer hover:text-primary-brutalist"
            onClick={() => handleSort('priority')}
          >
            PRIORITY {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="col-span-2 cursor-pointer hover:text-primary-brutalist"
            onClick={() => handleSort('assignee')}
          >
            ASSIGNEE {sortBy === 'assignee' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="col-span-2 cursor-pointer hover:text-primary-brutalist"
            onClick={() => handleSort('dueDate')}
          >
            DUE DATE {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
        </div>

        {/* Task Rows */}
        {sortedTasks.map((task) => {
          const StatusIcon = statusConfig[task.status as keyof typeof statusConfig].icon
          const isExpanded = expandedTasks.has(task._id)
          const isSelected = selectedTasks.has(task._id)
          
          return (
            <div key={task._id} className="border-b-2 border-[var(--theme-border)] last:border-b-0">
              {/* Main Row */}
              <div className={clsx(
                "grid grid-cols-12 gap-16px p-16px items-center hover:bg-[var(--theme-background-secondary)]/20 transition-colors",
                isSelected && "bg-primary-brutalist/10"
              )}>
                <div className="col-span-1 flex items-center gap-8px">
                  <BrutalCheckbox
                    checked={isSelected}
                    onChange={() => toggleTaskSelection(task._id)}
                    size="sm"
                    className="w-16px h-16px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                  />
                  <button
                    onClick={() => toggleTaskExpansion(task._id)}
                    className="brutal-hover"
                  >
                    {isExpanded ? (
                      <HiOutlineChevronUp className="w-16px h-16px" />
                    ) : (
                      <HiOutlineChevronDown className="w-16px h-16px" />
                    )}
                  </button>
                </div>
                
                <div className="col-span-4">
                  <div className="flex items-center gap-8px">
                    <span className={clsx(
                      "px-8px py-2px text-brutal-xs font-bold",
                      typeConfig[task.type as keyof typeof typeConfig].color,
                      "text-event-horizon"
                    )}>
                      {task.key}
                    </span>
                    <span className="font-mono text-brutal-sm">{task.title}</span>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className={clsx(
                    "inline-flex items-center gap-4px px-8px py-4px",
                    statusConfig[task.status as keyof typeof statusConfig].color,
                    "font-mono text-brutal-xs uppercase"
                  )}>
                    <StatusIcon className="w-12px h-12px" />
                    {statusConfig[task.status as keyof typeof statusConfig].label}
                  </div>
                </div>
                
                <div className="col-span-1">
                  <span className={clsx(
                    "font-mono text-brutal-xs uppercase",
                    priorityConfig[task.priority as keyof typeof priorityConfig].color
                  )}>
                    {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                  </span>
                </div>
                
                <div className="col-span-2">
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex items-center gap-4px flex-wrap">
                      {task.assignees.slice(0, 2).map((assignee: any, index: number) => (
                        <div key={assignee._id} className="flex items-center gap-4px">
                          <div className="w-20px h-20px bg-primary-brutalist border border-[var(--theme-border)] flex items-center justify-center">
                            <span className="text-event-horizon text-[10px] font-bold">
                              {assignee.name.charAt(0)}
                            </span>
                          </div>
                          {index === 0 && task.assignees.length === 1 && (
                            <span className="text-brutal-xs">{assignee.name}</span>
                          )}
                        </div>
                      ))}
                      {task.assignees.length > 2 && (
                        <span className="text-brutal-xs text-neutral-400">
                          +{task.assignees.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-brutal-xs text-neutral-500">UNASSIGNED</span>
                  )}
                </div>
                
                <div className="col-span-2">
                  {task.dueDate ? (
                    <div className="flex items-center gap-4px text-brutal-xs">
                      <HiOutlineCalendar className="w-12px h-12px" />
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </div>
                  ) : (
                    <span className="text-brutal-xs text-neutral-500">NO DUE DATE</span>
                  )}
                </div>
              </div>
              
              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-64px py-16px bg-[var(--theme-background-secondary)]/10 border-t-2 border-[var(--theme-border)]">
                  <div className="grid grid-cols-2 gap-24px">
                    <div>
                      <h4 className="text-brutal-sm font-bold mb-8px uppercase">Description</h4>
                      <p className="text-brutal-sm text-[var(--theme-foreground)]/80">
                        {task.description || 'No description provided.'}
                      </p>
                    </div>
                    
                    <div className="space-y-16px">
                      <div>
                        <h4 className="text-brutal-sm font-bold mb-8px uppercase">Details</h4>
                        <div className="space-y-8px text-brutal-xs">
                          <div className="flex items-center gap-8px">
                            <span className="text-neutral-500">TYPE:</span>
                            <span className="uppercase">{task.type}</span>
                          </div>
                          <div className="flex items-center gap-8px">
                            <span className="text-neutral-500">REPORTER:</span>
                            <span>{task.reporter?.name || 'Unknown'}</span>
                          </div>
                          {task.estimate && (
                            <div className="flex items-center gap-8px">
                              <span className="text-neutral-500">ESTIMATE:</span>
                              <span>{task.estimate.points || task.estimate.hours}h</span>
                            </div>
                          )}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex items-center gap-8px">
                              <span className="text-neutral-500">LABELS:</span>
                              <div className="flex gap-4px">
                                {task.labels.map((label: string) => (
                                  <span key={label} className="px-8px py-2px bg-primary-brutalist text-event-horizon text-brutal-xs">
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-8px">
                        <button className="brutal-btn-sm">EDIT</button>
                        <button className="brutal-btn-sm bg-[var(--theme-error)] border-[var(--theme-error)] hover:bg-[#CC0000]">DELETE</button>
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
}