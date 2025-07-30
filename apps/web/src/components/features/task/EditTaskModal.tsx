import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import { HiOutlineX, HiOutlineTrash, HiOutlineSwitchHorizontal, HiOutlineLightBulb } from 'react-icons/hi'
import clsx from 'clsx'
import MultiSelect from '../../ui/MultiSelect'
import { TaskAssignmentHelper } from '../task/TaskAssignmentHelper'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: any
  onDelete?: () => void
}

export default function EditTaskModal({ 
  isOpen, 
  onClose, 
  task,
  onDelete
}: EditTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'feature' | 'bug' | 'improvement' | 'task' | 'epic'>('task')
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked'>('todo')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [labels, setLabels] = useState<string>('')
  const [estimateHours, setEstimateHours] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [useSmartAssignment, setUseSmartAssignment] = useState(true)

  const updateTask = useMutation(api.tasks.mutations.updateTask)
  const project = useQuery(api.projects.queries.getProject, { projectId: task?.projectId })

  // Initialize form with task data
  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setType(task.type || 'task')
      setPriority(task.priority || 'medium')
      setStatus(task.status || 'todo')
      // Handle both old assigneeId and new assigneeIds
      if (task.assigneeIds && task.assigneeIds.length > 0) {
        setAssigneeIds(task.assigneeIds)
      } else if (task.assigneeId) {
        setAssigneeIds([task.assigneeId])
      } else {
        setAssigneeIds([])
      }
      setLabels(task.labels?.join(', ') || '')
      setEstimateHours(task.estimate?.hours?.toString() || '')
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '')
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    setIsUpdating(true)
    
    try {
      await updateTask({
        taskId: task._id,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        status,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
        labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : undefined,
        estimate: estimateHours ? { hours: parseFloat(estimateHours) } : undefined,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      })
      
      toast.success('Task updated successfully!')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task')
    } finally {
      setIsUpdating(false)
    }
  }

  const typeOptions = [
    { value: 'task', label: 'TASK' },
    { value: 'bug', label: 'BUG' },
    { value: 'feature', label: 'FEATURE' },
    { value: 'improvement', label: 'IMPROVEMENT' },
    { value: 'epic', label: 'EPIC' },
  ]

  const priorityOptions = [
    { value: 'urgent', label: 'URGENT', className: 'text-brutal-error' },
    { value: 'high', label: 'HIGH', className: 'text-brutal-warning' },
    { value: 'medium', label: 'MEDIUM', className: 'text-brutal-info' },
    { value: 'low', label: 'LOW', className: 'text-cathode-white/60' },
  ]

  const statusOptions = [
    { value: 'todo', label: 'TODO' },
    { value: 'in_progress', label: 'IN PROGRESS' },
    { value: 'in_review', label: 'IN REVIEW' },
    { value: 'done', label: 'DONE' },
    { value: 'blocked', label: 'BLOCKED' },
  ]

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title={`EDIT TASK: ${task?.project?.key || 'PROJ'}-${task?.number || '0'}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-24px">
        {/* Title */}
        <div className="space-y-8px">
          <label htmlFor="title" className="text-xs font-mono uppercase tracking-wider">
            TITLE*
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="brutal-input"
            placeholder="ENTER TASK TITLE"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-8px">
          <label htmlFor="description" className="text-xs font-mono uppercase tracking-wider">
            DESCRIPTION
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="brutal-input min-h-[100px]"
            placeholder="DESCRIBE THE TASK..."
            rows={4}
          />
        </div>

        {/* Type and Priority */}
        <div className="grid grid-cols-2 gap-16px">
          <div className="space-y-8px">
            <label htmlFor="type" className="text-xs font-mono uppercase tracking-wider">
              TYPE
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="brutal-input"
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-8px">
            <label htmlFor="priority" className="text-xs font-mono uppercase tracking-wider">
              PRIORITY
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="brutal-input"
            >
              {priorityOptions.map(opt => (
                <option key={opt.value} value={opt.value} className={opt.className}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-8px">
          <label htmlFor="status" className="text-xs font-mono uppercase tracking-wider">
            STATUS
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="brutal-input"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Assignees */}
        <div className="space-y-8px">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider">
              ASSIGNEES
            </label>
            <button
              type="button"
              onClick={() => setUseSmartAssignment(!useSmartAssignment)}
              className="flex items-center gap-8px font-mono text-brutal-xs text-primary-brutalist hover:text-brutal-info transition-colors"
            >
              {useSmartAssignment ? (
                <>
                  <HiOutlineLightBulb className="w-20px h-20px" />
                  SMART ASSIGNMENT ON
                </>
              ) : (
                <>
                  <HiOutlineSwitchHorizontal className="w-20px h-20px" />
                  SMART ASSIGNMENT OFF
                </>
              )}
            </button>
          </div>

          {useSmartAssignment ? (
            <TaskAssignmentHelper
              workspaceId={project?.workspaceId as Id<"workspaces">}
              currentAssignees={assigneeIds as Id<"users">[]}
              onAssigneeChange={(ids) => setAssigneeIds(ids)}
              taskTitle={title}
              taskDescription={description}
              taskLabels={labels.split(',').map(l => l.trim()).filter(Boolean)}
              mode="compact"
            />
          ) : (
            <MultiSelect
              options={project?.members?.map((member: any) => ({
                value: member.user._id,
                label: member.user.name?.toUpperCase() || member.user.email?.toUpperCase(),
                avatarUrl: member.user.avatarUrl
              })) || []}
              value={assigneeIds}
              onChange={setAssigneeIds}
              placeholder="SELECT ASSIGNEES"
              disabled={isUpdating}
            />
          )}
        </div>

        {/* Labels */}
        <div className="space-y-8px">
          <label htmlFor="labels" className="text-xs font-mono uppercase tracking-wider">
            LABELS (COMMA SEPARATED)
          </label>
          <input
            id="labels"
            type="text"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            className="brutal-input"
            placeholder="FRONTEND, BUG-FIX, URGENT"
          />
        </div>

        {/* Dates and Estimate */}
        <div className="grid grid-cols-3 gap-16px">
          <div className="space-y-8px">
            <label htmlFor="startDate" className="text-xs font-mono uppercase tracking-wider">
              START DATE
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="brutal-input"
            />
          </div>

          <div className="space-y-8px">
            <label htmlFor="dueDate" className="text-xs font-mono uppercase tracking-wider">
              DUE DATE
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="brutal-input"
            />
          </div>

          <div className="space-y-8px">
            <label htmlFor="estimate" className="text-xs font-mono uppercase tracking-wider">
              ESTIMATE (HOURS)
            </label>
            <input
              id="estimate"
              type="number"
              step="0.5"
              min="0"
              value={estimateHours}
              onChange={(e) => setEstimateHours(e.target.value)}
              className="brutal-input"
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t-2 border-basalt-border pt-24px">
          <button
            type="button"
            onClick={onDelete}
            className="brutal-btn brutal-btn-error flex items-center gap-8px"
          >
            <HiOutlineTrash className="w-16px h-16px" />
            DELETE TASK
          </button>

          <div className="flex items-center gap-16px">
            <button
              type="button"
              onClick={onClose}
              className="brutal-btn brutal-btn-secondary"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="brutal-btn brutal-btn-primary"
            >
              {isUpdating ? 'UPDATING...' : 'UPDATE TASK'}
            </button>
          </div>
        </div>
      </form>
    </BrutalModal>
  )
}