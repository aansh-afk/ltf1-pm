import { useReducer } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import posthog from 'posthog-js'
import BrutalModal from '../../ui/BrutalModal'
import MultiSelect from '../../ui/MultiSelect'
import { TaskAssignmentHelper } from '../task/TaskAssignmentHelper'
import { HiOutlineSwitchHorizontal, HiOutlineLightBulb } from 'react-icons/hi'

// --- Sub-components ---

interface TaskAssignmentSectionProps {
  useSmartAssignment: boolean
  assigneeIds: string[]
  estimateHours: string
  isCreating: boolean
  workspaceId: string | undefined
  title: string
  description: string
  labels: string
  projectMembers: Array<{ _id: string; name: string; avatarUrl?: string }> | undefined
  onToggleSmartAssignment: () => void
  onAssigneeChange: (ids: string[]) => void
  onEstimateChange: (value: string) => void
}

function TaskAssignmentSection({
  useSmartAssignment,
  assigneeIds,
  estimateHours,
  isCreating,
  workspaceId,
  title,
  description,
  labels,
  projectMembers,
  onToggleSmartAssignment,
  onAssigneeChange,
  onEstimateChange,
}: TaskAssignmentSectionProps) {
  return (
    <div className="space-y-[8px]">
      <div className="flex items-center justify-between">
        <span className="block text-brutal-sm">
          TASK ASSIGNMENT
        </span>
        <button
          type="button"
          onClick={onToggleSmartAssignment}
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
        <>
          <TaskAssignmentHelper
            workspaceId={workspaceId as Id<"workspaces">}
            currentAssignees={assigneeIds as Id<"users">[]}
            onAssigneeChange={onAssigneeChange}
            taskTitle={title}
            taskDescription={description}
            taskLabels={labels.split(',').map(l => l.trim()).filter(Boolean)}
            mode="compact"
          />
          <div>
            <label htmlFor="create-task-estimate-smart" className="block text-brutal-sm mb-[4px]">
              ESTIMATE (HOURS)
            </label>
            <input
              id="create-task-estimate-smart"
              type="number"
              placeholder="0"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-brutal-md placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={estimateHours}
              onChange={(e) => onEstimateChange(e.target.value)}
              min="0"
              step="0.5"
              disabled={isCreating}
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <label htmlFor="create-task-assignees" className="block text-brutal-sm mb-[4px]">
              ASSIGNEES (OPTIONAL)
            </label>
            <MultiSelect
              options={projectMembers?.map((member: any) => ({
                value: member._id,
                label: member.name.toUpperCase(),
                avatarUrl: member.avatarUrl
              })) || []}
              value={assigneeIds}
              onChange={onAssigneeChange}
              placeholder="SELECT ASSIGNEES"
              disabled={isCreating}
            />
          </div>

          <div>
            <label htmlFor="create-task-estimate-manual" className="block text-brutal-sm mb-[4px]">
              ESTIMATE (HOURS)
            </label>
            <input
              id="create-task-estimate-manual"
              type="number"
              placeholder="0"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-brutal-md placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={estimateHours}
              onChange={(e) => onEstimateChange(e.target.value)}
              min="0"
              step="0.5"
              disabled={isCreating}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Component ---

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  defaultStatus?: string
  defaultDueDate?: string
  onSuccess?: () => void
}

type CreateTaskState = {
  title: string
  description: string
  type: 'feature' | 'bug' | 'improvement' | 'task' | 'epic'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  assigneeIds: string[]
  labels: string
  estimateHours: string
  startDate: string
  dueDate: string
  isCreating: boolean
  useSmartAssignment: boolean
}

type CreateTaskAction =
  | { type: 'UPDATE'; field: keyof CreateTaskState; value: CreateTaskState[keyof CreateTaskState] }
  | { type: 'SET_ASSIGNEE_IDS'; value: string[] }
  | { type: 'TOGGLE_SMART_ASSIGNMENT' }
  | { type: 'SET_IS_CREATING'; value: boolean }
  | { type: 'RESET' }

function createInitialState(defaultDueDate?: string): CreateTaskState {
  return {
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    assigneeIds: [],
    labels: '',
    estimateHours: '',
    startDate: '',
    dueDate: defaultDueDate || '',
    isCreating: false,
    useSmartAssignment: true,
  }
}

function createTaskReducer(state: CreateTaskState, action: CreateTaskAction): CreateTaskState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'SET_ASSIGNEE_IDS':
      return { ...state, assigneeIds: action.value }
    case 'TOGGLE_SMART_ASSIGNMENT':
      return { ...state, useSmartAssignment: !state.useSmartAssignment }
    case 'SET_IS_CREATING':
      return { ...state, isCreating: action.value }
    case 'RESET':
      return { ...state, title: '', description: '', type: 'task', priority: 'medium', assigneeIds: [], labels: '', estimateHours: '', startDate: '', dueDate: '' }
    default:
      return state
  }
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  defaultStatus = 'backlog',
  defaultDueDate,
  onSuccess
}: CreateTaskModalProps) {
  const [state, dispatch] = useReducer(createTaskReducer, defaultDueDate, createInitialState)
  const { title, description, type, priority, assigneeIds, labels, estimateHours, startDate, dueDate, isCreating, useSmartAssignment } = state

  const createTask = useMutation(api.tasks.mutations.createTask)
  const project = useQuery(api.projects.queries.getProject, { projectId })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    dispatch({ type: 'SET_IS_CREATING', value: true })

    try {
      await createTask({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
        labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : undefined,
        estimate: estimateHours ? { hours: parseFloat(estimateHours) } : undefined,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      })

      posthog.capture('task_created', {
        type,
        priority,
        has_assignees: assigneeIds.length > 0,
        has_estimate: !!estimateHours,
        has_due_date: !!dueDate,
        has_labels: !!labels,
      })
      toast.success('Task created successfully!')
      dispatch({ type: 'RESET' })
      onSuccess?.()
      onClose()
    } catch (error: any) {
      posthog.capture('task_creation_failed', { error: error.message })
      toast.error(error.message || 'Failed to create task')
    } finally {
      dispatch({ type: 'SET_IS_CREATING', value: false })
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-[12px]">
        {/* TITLE */}
        <div>
          <label htmlFor="create-task-title" className="block text-brutal-sm mb-[4px]">
            TITLE
          </label>
          <input
            id="create-task-title"
            type="text"
            placeholder="TASK TITLE"
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-md uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
            value={title}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'title', value: e.target.value })}
            disabled={isCreating}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label htmlFor="create-task-description" className="block text-brutal-sm mb-[4px]">
            DESCRIPTION (OPTIONAL)
          </label>
          <textarea
            id="create-task-description"
            placeholder="ADD A DESCRIPTION..."
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-md placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            value={description}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'description', value: e.target.value })}
            rows={4}
            disabled={isCreating}
          />
        </div>

        {/* TYPE & PRIORITY */}
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <label htmlFor="create-task-type" className="block text-brutal-sm mb-[4px]">
              TYPE
            </label>
            <select
              id="create-task-type"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-brutal-md uppercase
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={type}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'type', value: e.target.value as any })}
              disabled={isCreating}
            >
              <option value="task">📋 TASK</option>
              <option value="feature">✨ FEATURE</option>
              <option value="bug">🐛 BUG</option>
              <option value="improvement">💡 IMPROVEMENT</option>
              <option value="epic">🎯 EPIC</option>
            </select>
          </div>

          <div>
            <label htmlFor="create-task-priority" className="block text-brutal-sm mb-[4px]">
              PRIORITY
            </label>
            <select
              id="create-task-priority"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-brutal-md uppercase
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={priority}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'priority', value: e.target.value as any })}
              disabled={isCreating}
            >
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
              <option value="urgent">URGENT</option>
            </select>
          </div>
        </div>

        {/* DATES */}
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <label htmlFor="create-task-start-date" className="block text-brutal-sm mb-[4px]">
              START DATE (OPTIONAL)
            </label>
            <input
              id="create-task-start-date"
              type="date"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-brutal-md
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={startDate}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'startDate', value: e.target.value })}
              disabled={isCreating}
            />
          </div>

          <div>
            <label htmlFor="create-task-due-date" className="block text-brutal-sm mb-[4px]">
              DUE DATE (OPTIONAL)
            </label>
            <input
              id="create-task-due-date"
              type="date"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-brutal-md
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={dueDate}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'dueDate', value: e.target.value })}
              disabled={isCreating}
            />
          </div>
        </div>

        {/* ASSIGNEE & ESTIMATE */}
        <TaskAssignmentSection
          useSmartAssignment={useSmartAssignment}
          assigneeIds={assigneeIds}
          estimateHours={estimateHours}
          isCreating={isCreating}
          workspaceId={project?.workspaceId}
          title={title}
          description={description}
          labels={labels}
          projectMembers={project?.members}
          onToggleSmartAssignment={() => dispatch({ type: 'TOGGLE_SMART_ASSIGNMENT' })}
          onAssigneeChange={(ids) => dispatch({ type: 'SET_ASSIGNEE_IDS', value: ids })}
          onEstimateChange={(value) => dispatch({ type: 'UPDATE', field: 'estimateHours', value })}
        />

        {/* LABELS */}
        <div>
          <label htmlFor="create-task-labels" className="block text-brutal-sm mb-[4px]">
            LABELS (COMMA-SEPARATED)
          </label>
          <input
            id="create-task-labels"
            type="text"
            placeholder="FRONTEND, URGENT, REFACTOR"
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-md uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
            value={labels}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'labels', value: e.target.value })}
            disabled={isCreating}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-[8px] pt-[12px] border-t-2 border-[var(--theme-border)]">
          <button
            type="button"
            className="px-[12px] py-[8px] bg-transparent border-2 border-[var(--theme-border)]
                     font-mono text-brutal-md uppercase tracking-wider
                     hover:bg-basalt-border transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isCreating}
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="px-[12px] py-[8px] bg-primary-brutalist border-2 border-[var(--theme-border)]
                     font-mono text-brutal-md uppercase tracking-wider text-event-horizon
                     hover:bg-yellow-400 transition-colors shadow-brutal-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-[4px]"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <div className="w-16px h-16px border-2 border-event-horizon border-t-transparent rounded-full animate-spin" />
                CREATING...
              </>
            ) : (
              'CREATE TASK'
            )}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}