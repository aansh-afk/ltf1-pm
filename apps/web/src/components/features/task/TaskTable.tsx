import React, { useState, useMemo, memo, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDuplicate,
  HiOutlineClock
} from 'react-icons/hi'
import clsx from 'clsx'
import BrutalSelect from '../../ui/BrutalSelect'
import toast from 'react-hot-toast'
import CreateTaskModal from './CreateTaskModal'
import BrutalCheckbox from '../../ui/BrutalCheckbox'

interface TaskTableProps {
  tasks: any[]
  projectId: string
  onTaskUpdate?: () => void
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

const typeLabels: Record<string, string> = {
  task: '[TASK]',
  feature: '[FEAT]',
  bug: '[BUG]',
  improvement: '[IMPR]',
  epic: '[EPIC]'
}

const typeColors: Record<string, string> = {
  task: 'text-[#9CA3AF]',
  feature: 'text-[#22C55E]',
  bug: 'text-[#EF4444]',
  improvement: 'text-[#06B6D4]',
  epic: 'text-[#F59E0B]'
}

const priorityLabels: Record<string, string> = {
  urgent: 'URGENT',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW'
}

const priorityColors: Record<string, string> = {
  urgent: 'text-[#EF4444]',
  high: 'text-[#F59E0B]',
  medium: 'text-[#6366F1]',
  low: 'text-[#6B7280]'
}

const statusLabels: Record<string, string> = {
  backlog: 'BACKLOG',
  todo: 'TODO',
  in_progress: 'IN PROGRESS',
  in_review: 'IN REVIEW',
  done: 'DONE',
  cancelled: 'CANCELLED'
}

const statusColors: Record<string, string> = {
  backlog: 'text-[#6B7280] border-[#6B7280]',
  todo: 'text-[#6366F1] border-[#6366F1]',
  in_progress: 'text-[#06B6D4] border-[#06B6D4]',
  in_review: 'text-[#F59E0B] border-[#F59E0B]',
  done: 'text-[#22C55E] border-[#22C55E]',
  cancelled: 'text-[#EF4444] border-[#EF4444]'
}

interface Column {
  key: string
  label: string
  width?: string
  sortable?: boolean
}

const columns: Column[] = [
  { key: 'select', label: '', width: 'w-10' },
  { key: 'id', label: 'ID', width: 'w-20', sortable: true },
  { key: 'title', label: 'TITLE', sortable: true },
  { key: 'type', label: 'TYPE', width: 'w-24', sortable: true },
  { key: 'status', label: 'STATUS', width: 'w-36', sortable: true },
  { key: 'priority', label: 'PRIORITY', width: 'w-24', sortable: true },
  { key: 'assignee', label: 'ASSIGNEE', width: 'w-36', sortable: true },
  { key: 'estimate', label: 'EST.', width: 'w-14' },
  { key: 'dueDate', label: 'DUE DATE', width: 'w-28', sortable: true },
  { key: 'actions', label: '', width: 'w-10' }
]

const TaskTable = memo(function TaskTable({ tasks, projectId, onTaskUpdate, selectedIds, onSelectionChange }: TaskTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  // Use external selection state if provided, otherwise fall back to internal state
  const effectiveSelectedIds = selectedIds ?? selectedTasks
  const effectiveOnSelectionChange = onSelectionChange ?? setSelectedTasks

  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null)

  const updateTask = useMutation(api.tasks.mutations.updateTask)
  const deleteTask = useMutation(api.tasks.mutations.deleteTask)

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }, [sortBy])

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

  const handleSelectAll = useCallback(() => {
    if (effectiveSelectedIds.size === tasks.length) {
      effectiveOnSelectionChange(new Set())
    } else {
      effectiveOnSelectionChange(new Set(tasks.map(t => t._id)))
    }
  }, [effectiveSelectedIds.size, tasks, effectiveOnSelectionChange])

  const handleSelectTask = useCallback((taskId: string) => {
    const newSelected = new Set(effectiveSelectedIds)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    effectiveOnSelectionChange(newSelected)
  }, [effectiveSelectedIds, effectiveOnSelectionChange])

  const handleStatusChange = useCallback(async (taskId: any, newStatus: any) => {
    try {
      await updateTask({ taskId, status: newStatus })
      toast.success('Status updated')
      onTaskUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    }
  }, [updateTask, onTaskUpdate])

  const handleDeleteTask = useCallback(async (taskId: any) => {
    try {
      await deleteTask({ taskId })
      toast.success('Task deleted')
      setShowContextMenu(null)
      onTaskUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task')
    }
  }, [deleteTask, onTaskUpdate])

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-3">
      {/* Bulk Actions Bar */}
      {effectiveSelectedIds.size > 0 && (
        <div className="bg-[#6366F1] border-2 border-[#2E2E35] px-3 py-2 flex items-center justify-between">
          <span className="font-mono text-xs text-[#050505] uppercase tracking-wider">
            {effectiveSelectedIds.size} TASKS SELECTED
          </span>
          <div className="flex gap-2">
            <button className="px-2 py-1 text-[10px] font-mono uppercase bg-[#0A0A0A] text-[#6366F1] border-2 border-[#2E2E35] hover:border-[#6366F1] transition-colors">
              ASSIGN
            </button>
            <button className="px-2 py-1 text-[10px] font-mono uppercase bg-[#0A0A0A] text-[#6366F1] border-2 border-[#2E2E35] hover:border-[#6366F1] transition-colors">
              UPDATE STATUS
            </button>
            <button className="px-2 py-1 text-[10px] font-mono uppercase bg-[#EF4444] text-[#F9FAFB] border-2 border-[#EF4444] hover:bg-[#DC2626] transition-colors">
              DELETE
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead>
              <tr className="border-b-2 border-[#2E2E35]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={clsx(
                      "px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-[#6B7280]",
                      column.width,
                      column.sortable && "cursor-pointer hover:text-[#6366F1] transition-colors"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    {column.key === 'select' ? (
                      <BrutalCheckbox
                        checked={effectiveSelectedIds.size === tasks.length && tasks.length > 0}
                        onChange={handleSelectAll}
                        size="sm"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.sortable && sortBy === column.key && (
                          sortOrder === 'asc'
                            ? <HiOutlineChevronUp className="w-3 h-3" />
                            : <HiOutlineChevronDown className="w-3 h-3" />
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
                <React.Fragment key={task._id}>
                  <tr
                    className={clsx(
                      "border-b border-[#1F1F23] hover:bg-[#111111] transition-colors",
                      expandedRow === task._id && "bg-[#111111]",
                      effectiveSelectedIds.has(task._id) && "border-l-2 border-l-[#6366F1] bg-[#6366F1]/5"
                    )}
                  >
                    {/* Select */}
                    <td
                      className="px-3 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BrutalCheckbox
                        checked={effectiveSelectedIds.has(task._id)}
                        onChange={() => handleSelectTask(task._id)}
                        size="sm"
                      />
                    </td>

                    {/* ID */}
                    <td className="px-3 py-2">
                      <span className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider">{task.key}</span>
                    </td>

                    {/* Title */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setExpandedRow(expandedRow === task._id ? null : task._id)}
                        className="text-left hover:text-[#6366F1] transition-colors"
                      >
                        <span className="font-mono text-xs text-[#F9FAFB]">{task.title}</span>
                      </button>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2">
                      <span className={clsx(
                        "font-mono text-[10px] font-bold",
                        typeColors[task.type] || 'text-[#9CA3AF]'
                      )}>
                        {typeLabels[task.type] || task.type?.toUpperCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      <BrutalSelect
                        value={task.status}
                        onChange={(v) => handleStatusChange(task._id, v)}
                        options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
                        compact
                      />
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-2">
                      <span className={clsx(
                        "font-mono text-[10px] uppercase font-bold",
                        priorityColors[task.priority] || 'text-[#6B7280]'
                      )}>
                        {priorityLabels[task.priority] || task.priority}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-2">
                      <span className="font-mono text-[10px] text-[#6B7280]">
                        {task.assigneeName || 'UNASSIGNED'}
                      </span>
                    </td>

                    {/* Estimate */}
                    <td className="px-3 py-2">
                      <span className="font-mono text-[10px] text-[#9CA3AF]">
                        {task.estimate?.hours || '-'}h
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-3 py-2">
                      <span className={clsx(
                        "font-mono text-[10px]",
                        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
                          ? "text-[#EF4444]"
                          : "text-[#9CA3AF]"
                      )}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowContextMenu(showContextMenu === task._id ? null : task._id)
                        }}
                        className="p-1 hover:bg-[#111111] transition-colors"
                      >
                        <HiOutlineDotsVertical className="w-3.5 h-3.5 text-[#6B7280]" />
                      </button>

                      {showContextMenu === task._id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#0A0A0A] border-2 border-[#2E2E35] z-50 min-w-[140px] shadow-[4px_4px_0px_#000000]">
                          <button
                            onClick={() => {
                              setShowContextMenu(null)
                            }}
                            className="w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase text-[#9CA3AF] hover:bg-[#111111] hover:text-[#F9FAFB] transition-colors flex items-center gap-2"
                          >
                            <HiOutlinePencil className="w-3.5 h-3.5" />
                            EDIT
                          </button>
                          <button
                            onClick={() => {
                              setShowContextMenu(null)
                            }}
                            className="w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase text-[#9CA3AF] hover:bg-[#111111] hover:text-[#F9FAFB] transition-colors flex items-center gap-2"
                          >
                            <HiOutlineDuplicate className="w-3.5 h-3.5" />
                            DUPLICATE
                          </button>
                          <button
                            onClick={() => {
                              setShowContextMenu(null)
                            }}
                            className="w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase text-[#9CA3AF] hover:bg-[#111111] hover:text-[#F9FAFB] transition-colors flex items-center gap-2"
                          >
                            <HiOutlineClock className="w-3.5 h-3.5" />
                            LOG TIME
                          </button>
                          <div className="border-t border-[#2E2E35]" />
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="w-full px-3 py-1.5 text-left font-mono text-[10px] uppercase text-[#EF4444] hover:bg-[#EF4444] hover:text-[#F9FAFB] transition-colors flex items-center gap-2"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                            DELETE
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedRow === task._id && (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-3 bg-[#111111] border-b border-[#1F1F23]">
                        <div className="space-y-2">
                          {task.description && (
                            <div>
                              <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#6B7280] mb-1">DESCRIPTION</h4>
                              <p className="text-xs font-mono text-[#9CA3AF] whitespace-pre-wrap">{task.description}</p>
                            </div>
                          )}

                          <div className="flex gap-4">
                            {task.startDate && (
                              <div>
                                <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#6B7280] mb-0.5">START DATE</h4>
                                <p className="text-xs font-mono text-[#9CA3AF]">{new Date(task.startDate).toLocaleDateString()}</p>
                              </div>
                            )}

                            {task.labels && task.labels.length > 0 && (
                              <div>
                                <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#6B7280] mb-0.5">LABELS</h4>
                                <div className="flex gap-1">
                                  {task.labels.map((label: string) => (
                                    <span
                                      key={label}
                                      className="px-1 py-0.5 bg-[#6366F1]/20 text-[#6366F1] font-mono text-[10px] uppercase"
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
                </React.Fragment>
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
})

export default TaskTable
