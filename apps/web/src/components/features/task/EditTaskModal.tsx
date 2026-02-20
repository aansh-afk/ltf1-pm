import { useReducer } from 'react'
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

type EditTaskState = {
  title: string
  description: string
  type: 'feature' | 'bug' | 'improvement' | 'task' | 'epic'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked'
  assigneeIds: string[]
  labels: string
  estimateHours: string
  startDate: string
  dueDate: string
  isUpdating: boolean
  useSmartAssignment: boolean
}

const initialEditState: EditTaskState = {
  title: '',
  description: '',
  type: 'task',
  priority: 'medium',
  status: 'todo',
  assigneeIds: [],
  labels: '',
  estimateHours: '',
  startDate: '',
  dueDate: '',
  isUpdating: false,
  useSmartAssignment: true,
}

type EditTaskAction =
  | { type: 'UPDATE'; field: keyof EditTaskState; value: EditTaskState[keyof EditTaskState] }
  | { type: 'SET_ASSIGNEE_IDS'; value: string[] }
  | { type: 'TOGGLE_SMART_ASSIGNMENT' }
  | { type: 'SET_IS_UPDATING'; value: boolean }
  | { type: 'LOAD_TASK'; payload: EditTaskState }

function editTaskReducer(state: EditTaskState, action: EditTaskAction): EditTaskState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'SET_ASSIGNEE_IDS':
      return { ...state, assigneeIds: action.value }
    case 'TOGGLE_SMART_ASSIGNMENT':
      return { ...state, useSmartAssignment: !state.useSmartAssignment }
    case 'SET_IS_UPDATING':
      return { ...state, isUpdating: action.value }
    case 'LOAD_TASK':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

// ── Sub-components ──

interface TaskFormFieldsProps {
  title: string
  description: string
  type: string
  priority: string
  status: string
  dispatch: React.Dispatch<EditTaskAction>
  typeOptions: Array<{ value: string; label: string }>
  priorityOptions: Array<{ value: string; label: string; className: string }>
  statusOptions: Array<{ value: string; label: string }>
}

function TaskFormFields({ title, description, type, priority, status, dispatch, typeOptions, priorityOptions, statusOptions }: TaskFormFieldsProps) {
  return (
    <>
      {/* Title */}
      <div className="space-y-[4px]">
        <label htmlFor="title" className="text-xs font-mono uppercase tracking-wider">
          TITLE*
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => dispatch({ type: 'UPDATE', field: 'title', value: e.target.value })}
          className="brutal-input"
          placeholder="ENTER TASK TITLE"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-[4px]">
        <label htmlFor="description" className="text-xs font-mono uppercase tracking-wider">
          DESCRIPTION
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => dispatch({ type: 'UPDATE', field: 'description', value: e.target.value })}
          className="brutal-input min-h-[100px]"
          placeholder="DESCRIBE THE TASK..."
          rows={4}
        />
      </div>

      {/* Type and Priority */}
      <div className="grid grid-cols-2 gap-[8px]">
        <div className="space-y-[4px]">
          <label htmlFor="type" className="text-xs font-mono uppercase tracking-wider">
            TYPE
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'type', value: e.target.value as any })}
            className="brutal-input"
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-[4px]">
          <label htmlFor="priority" className="text-xs font-mono uppercase tracking-wider">
            PRIORITY
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'priority', value: e.target.value as any })}
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
      <div className="space-y-[4px]">
        <label htmlFor="status" className="text-xs font-mono uppercase tracking-wider">
          STATUS
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => dispatch({ type: 'UPDATE', field: 'status', value: e.target.value as any })}
          className="brutal-input"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </>
  )
}

interface TaskDatesEstimateProps {
  startDate: string
  dueDate: string
  estimateHours: string
  dispatch: React.Dispatch<EditTaskAction>
}

function TaskDatesEstimate({ startDate, dueDate, estimateHours, dispatch }: TaskDatesEstimateProps) {
  return (
    <div className="grid grid-cols-3 gap-[8px]">
      <div className="space-y-[4px]">
        <label htmlFor="startDate" className="text-xs font-mono uppercase tracking-wider">
          START DATE
        </label>
        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => dispatch({ type: 'UPDATE', field: 'startDate', value: e.target.value })}
          className="brutal-input"
        />
      </div>

      <div className="space-y-[4px]">
        <label htmlFor="dueDate" className="text-xs font-mono uppercase tracking-wider">
          DUE DATE
        </label>
        <input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => dispatch({ type: 'UPDATE', field: 'dueDate', value: e.target.value })}
          className="brutal-input"
        />
      </div>

      <div className="space-y-[4px]">
        <label htmlFor="estimate" className="text-xs font-mono uppercase tracking-wider">
          ESTIMATE (HOURS)
        </label>
        <input
          id="estimate"
          type="number"
          step="0.5"
          min="0"
          value={estimateHours}
          onChange={(e) => dispatch({ type: 'UPDATE', field: 'estimateHours', value: e.target.value })}
          className="brutal-input"
          placeholder="0.0"
        />
      </div>
    </div>
  )
}

function deriveInitialState(task: any): EditTaskState {
  if (!task) return initialEditState

  let taskAssigneeIds: string[] = []
  if (task.assigneeIds && task.assigneeIds.length > 0) {
    taskAssigneeIds = task.assigneeIds
  } else if (task.assigneeId) {
    taskAssigneeIds = [task.assigneeId]
  }

  return {
    title: task.title || '',
    description: task.description || '',
    type: task.type || 'task',
    priority: task.priority || 'medium',
    status: task.status || 'todo',
    assigneeIds: taskAssigneeIds,
    labels: task.labels?.join(', ') || '',
    estimateHours: task.estimate?.hours?.toString() || '',
    startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    isUpdating: false,
    useSmartAssignment: true,
  }
}

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
  onDelete
}: EditTaskModalProps) {
  const [state, dispatch] = useReducer(editTaskReducer, task, deriveInitialState)
  const { title, description, type, priority, status, assigneeIds, labels, estimateHours, startDate, dueDate, isUpdating, useSmartAssignment } = state

  const updateTask = useMutation(api.tasks.mutations.updateTask)
  const project = useQuery(api.projects.queries.getProject, { projectId: task?.projectId })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    dispatch({ type: 'SET_IS_UPDATING', value: true })

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
      dispatch({ type: 'SET_IS_UPDATING', value: false })
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
    { value: 'low', label: 'LOW', className: 'text-[var(--theme-foreground)]/60' },
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
      key={task?._id ?? 'new'}
      isOpen={isOpen}
      onClose={onClose}
      title={`EDIT TASK: ${task?.project?.key || 'PROJ'}-${task?.number || '0'}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-[12px]">
        <TaskFormFields
          title={title}
          description={description}
          type={type}
          priority={priority}
          status={status}
          dispatch={dispatch}
          typeOptions={typeOptions}
          priorityOptions={priorityOptions}
          statusOptions={statusOptions}
        />

        {/* Assignees */}
        <div className="space-y-[4px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider">
              ASSIGNEES
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_SMART_ASSIGNMENT' })}
              className="flex items-center gap-[4px] font-mono text-brutal-xs text-primary-brutalist hover:text-brutal-info transition-colors"
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
              onAssigneeChange={(ids) => dispatch({ type: 'SET_ASSIGNEE_IDS', value: ids })}
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
              onChange={(ids) => dispatch({ type: 'SET_ASSIGNEE_IDS', value: ids })}
              placeholder="SELECT ASSIGNEES"
              disabled={isUpdating}
            />
          )}
        </div>

        {/* Labels */}
        <div className="space-y-[4px]">
          <label htmlFor="labels" className="text-xs font-mono uppercase tracking-wider">
            LABELS (COMMA SEPARATED)
          </label>
          <input
            id="labels"
            type="text"
            value={labels}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'labels', value: e.target.value })}
            className="brutal-input"
            placeholder="FRONTEND, BUG-FIX, URGENT"
          />
        </div>

        {/* Dates and Estimate */}
        <TaskDatesEstimate startDate={startDate} dueDate={dueDate} estimateHours={estimateHours} dispatch={dispatch} />

        {/* Actions */}
        <div className="flex items-center justify-between border-t-2 border-[var(--theme-border)] pt-[12px]">
          <button
            type="button"
            onClick={onDelete}
            className="brutal-btn brutal-btn-error flex items-center gap-[4px]"
          >
            <HiOutlineTrash className="w-16px h-16px" />
            DELETE TASK
          </button>

          <div className="flex items-center gap-[8px]">
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