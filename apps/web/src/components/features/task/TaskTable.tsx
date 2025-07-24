import { useState, useMemo } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDuplicate,
  HiOutlineClock
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import CreateTaskModal from './CreateTaskModal'

interface TaskTableProps {
  tasks: any[]
  projectId: string
  onTaskUpdate?: () => void
}

const typeIcons = {
  task: '📋',
  feature: '✨',
  bug: '🐛',
  improvement: '💡',
  epic: '🎯'
}

const priorityIcons = {
  urgent: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢'
}

const statusLabels = {
  backlog: 'BACKLOG',
  todo: 'TODO',
  in_progress: 'IN PROGRESS',
  in_review: 'IN REVIEW',
  done: 'DONE',
  cancelled: 'CANCELLED'
}

const statusColors = {
  backlog: 'text-neutral-500',
  todo: 'text-primary-brutalist',
  in_progress: 'text-[#00FFFF]',
  in_review: 'text-[#FF00FF]',
  done: 'text-[#00FF00]',
  cancelled: 'text-[#FF0000]'
}

interface Column {
  key: string
  label: string
  width?: string
  sortable?: boolean
}

const columns: Column[] = [
  { key: 'select', label: '', width: 'w-40px' },
  { key: 'id', label: 'ID', width: 'w-80px', sortable: true },
  { key: 'title', label: 'TITLE', sortable: true },
  { key: 'type', label: 'TYPE', width: 'w-100px', sortable: true },
  { key: 'status', label: 'STATUS', width: 'w-140px', sortable: true },
  { key: 'priority', label: 'PRIORITY', width: 'w-100px', sortable: true },
  { key: 'assignee', label: 'ASSIGNEE', width: 'w-140px', sortable: true },
  { key: 'estimate', label: 'EST.', width: 'w-60px' },
  { key: 'dueDate', label: 'DUE DATE', width: 'w-120px', sortable: true },
  { key: 'actions', label: '', width: 'w-40px' }
]

export default function TaskTable({ tasks, projectId, onTaskUpdate }: TaskTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null)

  const updateTask = useMutation(api.tasks.mutations.updateTask)
  const deleteTask = useMutation(api.tasks.mutations.deleteTask)

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'id':
          compareValue = a.key.localeCompare(b.key)
          break
        case 'title':
          compareValue = a.title.localeCompare(b.title)
          break
        case 'type':
          compareValue = a.type.localeCompare(b.type)
          break
        case 'status':
          const statusOrder = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']
          compareValue = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          break
        case 'priority':
          const priorityOrder = ['low', 'medium', 'high', 'urgent']
          compareValue = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
          break
        case 'assignee':
          compareValue = (a.assigneeName || '').localeCompare(b.assigneeName || '')
          break
        case 'dueDate':
          compareValue = (a.dueDate || '').localeCompare(b.dueDate || '')
          break
        default:
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue
    })
  }, [tasks, sortBy, sortOrder])

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(tasks.map(t => t._id)))
    }
  }

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleStatusChange = async (taskId: any, newStatus: any) => {
    try {
      await updateTask({ taskId, status: newStatus })
      toast.success('Status updated')
      onTaskUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    }
  }

  const handleDeleteTask = async (taskId: any) => {
    try {
      await deleteTask({ taskId })
      toast.success('Task deleted')
      setShowContextMenu(null)
      onTaskUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task')
    }
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-24px">
      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <div className="bg-primary-brutalist border-2 border-basalt-border p-16px flex items-center justify-between">
          <span className="font-mono text-brutal-sm text-event-horizon">
            {selectedTasks.size} TASKS SELECTED
          </span>
          <div className="flex gap-16px">
            <button className="brutal-btn-sm bg-event-horizon text-primary-brutalist">
              ASSIGN
            </button>
            <button className="brutal-btn-sm bg-event-horizon text-primary-brutalist">
              UPDATE STATUS
            </button>
            <button className="brutal-btn-sm bg-[#FF0000] text-cathode-white">
              DELETE
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-carbon-plate border-2 border-basalt-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead>
              <tr className="border-b-2 border-basalt-border">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={clsx(
                      "p-16px text-left font-mono text-brutal-sm uppercase",
                      column.width,
                      column.sortable && "cursor-pointer hover:bg-event-horizon/10"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    {column.key === 'select' ? (
                      <input
                        type="checkbox"
                        checked={selectedTasks.size === tasks.length && tasks.length > 0}
                        onChange={handleSelectAll}
                        className="w-16px h-16px border-2 border-basalt-border bg-carbon-plate"
                      />
                    ) : (
                      <div className="flex items-center gap-8px">
                        {column.label}
                        {column.sortable && sortBy === column.key && (
                          sortOrder === 'asc' 
                            ? <HiOutlineChevronUp className="w-12px h-12px" />
                            : <HiOutlineChevronDown className="w-12px h-12px" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {sortedTasks.map((task) => (
                <>
                  <tr 
                    key={task._id}
                    className={clsx(
                      "border-b border-basalt-border/50 hover:bg-event-horizon/5",
                      expandedRow === task._id && "bg-event-horizon/10"
                    )}
                  >
                    {/* Select */}
                    <td className="p-16px">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task._id)}
                        onChange={() => handleSelectTask(task._id)}
                        className="w-16px h-16px border-2 border-basalt-border bg-carbon-plate"
                      />
                    </td>

                    {/* ID */}
                    <td className="p-16px">
                      <span className="font-mono text-brutal-sm">{task.key}</span>
                    </td>

                    {/* Title */}
                    <td className="p-16px">
                      <button
                        onClick={() => setExpandedRow(expandedRow === task._id ? null : task._id)}
                        className="text-left hover:text-primary-brutalist transition-colors"
                      >
                        <span className="font-mono text-brutal-sm">{task.title}</span>
                      </button>
                    </td>

                    {/* Type */}
                    <td className="p-16px">
                      <span className="font-mono text-brutal-sm">
                        {typeIcons[task.type]} {task.type.toUpperCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-16px">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className={clsx(
                          "px-8px py-4px bg-transparent border-2 border-current",
                          "font-mono text-brutal-xs uppercase",
                          "focus:outline-none cursor-pointer",
                          statusColors[task.status]
                        )}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value} className="bg-carbon-plate text-cathode-white">
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="p-16px">
                      <span className="font-mono text-brutal-sm">
                        {priorityIcons[task.priority]} {task.priority.toUpperCase()}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="p-16px">
                      <span className="font-mono text-brutal-sm text-neutral-500">
                        {task.assigneeName || 'UNASSIGNED'}
                      </span>
                    </td>

                    {/* Estimate */}
                    <td className="p-16px">
                      <span className="font-mono text-brutal-sm">
                        {task.estimate?.hours || '-'}h
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="p-16px">
                      <span className={clsx(
                        "font-mono text-brutal-sm",
                        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' 
                          ? "text-[#FF0000]" 
                          : ""
                      )}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-16px relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowContextMenu(showContextMenu === task._id ? null : task._id)
                        }}
                        className="p-4px hover:bg-event-horizon/20 transition-colors"
                      >
                        <HiOutlineDotsVertical className="w-16px h-16px" />
                      </button>

                      {showContextMenu === task._id && (
                        <div className="absolute right-0 top-full mt-4px bg-carbon-plate border-2 border-basalt-border z-10 min-w-160px">
                          <button
                            onClick={() => {
                              setShowContextMenu(null)
                            }}
                            className="w-full px-16px py-8px text-left font-mono text-brutal-sm hover:bg-event-horizon/20 flex items-center gap-8px"
                          >
                            <HiOutlinePencil className="w-16px h-16px" />
                            EDIT
                          </button>
                          <button
                            onClick={() => {
                              setShowContextMenu(null)
                            }}
                            className="w-full px-16px py-8px text-left font-mono text-brutal-sm hover:bg-event-horizon/20 flex items-center gap-8px"
                          >
                            <HiOutlineDuplicate className="w-16px h-16px" />
                            DUPLICATE
                          </button>
                          <button
                            onClick={() => {
                              setShowContextMenu(null)
                            }}
                            className="w-full px-16px py-8px text-left font-mono text-brutal-sm hover:bg-event-horizon/20 flex items-center gap-8px"
                          >
                            <HiOutlineClock className="w-16px h-16px" />
                            LOG TIME
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="w-full px-16px py-8px text-left font-mono text-brutal-sm hover:bg-[#FF0000] hover:text-cathode-white flex items-center gap-8px"
                          >
                            <HiOutlineTrash className="w-16px h-16px" />
                            DELETE
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedRow === task._id && (
                    <tr>
                      <td colSpan={columns.length} className="p-24px bg-event-horizon/5 border-b border-basalt-border">
                        <div className="space-y-16px">
                          {task.description && (
                            <div>
                              <h4 className="font-mono text-brutal-sm uppercase mb-8px">DESCRIPTION</h4>
                              <p className="text-brutal-sm whitespace-pre-wrap">{task.description}</p>
                            </div>
                          )}
                          
                          <div className="flex gap-32px">
                            {task.startDate && (
                              <div>
                                <h4 className="font-mono text-brutal-sm uppercase mb-4px">START DATE</h4>
                                <p className="text-brutal-sm">{new Date(task.startDate).toLocaleDateString()}</p>
                              </div>
                            )}
                            
                            {task.labels && task.labels.length > 0 && (
                              <div>
                                <h4 className="font-mono text-brutal-sm uppercase mb-4px">LABELS</h4>
                                <div className="flex gap-8px">
                                  {task.labels.map((label: string) => (
                                    <span 
                                      key={label}
                                      className="px-8px py-4px bg-primary-brutalist text-event-horizon font-mono text-brutal-xs uppercase"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onSuccess={onTaskUpdate}
      />
    </div>
  )
}