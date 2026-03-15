import { useReducer, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import posthog from 'posthog-js'
import BrutalModal from '@/components/ui/BrutalModal'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalToggle from '@/components/ui/BrutalToggle'
import MultiSelect from '@/components/ui/MultiSelect'
import { TaskAssignmentHelper } from '@/components/features/task/TaskAssignmentHelper'
import { HiOutlineLightBulb } from 'react-icons/hi'

// --- Type & Priority chip data ---

const TASK_TYPES = [
  { value: 'task',        label: 'TASK',    icon: '▣', color: 'var(--theme-foreground)' },
  { value: 'feature',     label: 'FEATURE', icon: '◆', color: 'var(--theme-primary)' },
  { value: 'bug',         label: 'BUG',     icon: '✕', color: 'var(--theme-error)' },
  { value: 'improvement', label: 'IMPROVE', icon: '▲', color: 'var(--theme-info)' },
  { value: 'epic',        label: 'EPIC',    icon: '★', color: 'var(--theme-warning)' },
] as const

const PRIORITIES = [
  { value: 'low',    label: 'LOW',       color: 'var(--theme-foreground)', bg: 'var(--theme-foreground)' },
  { value: 'medium', label: 'MED',       color: 'var(--theme-warning)',    bg: 'var(--theme-warning)' },
  { value: 'high',   label: 'HIGH',      color: 'var(--theme-error)',      bg: 'var(--theme-error)' },
  { value: 'urgent', label: '⚡ URGENT', color: 'var(--theme-error)',      bg: 'var(--theme-error)' },
] as const

// --- Sub-components ---

interface TaskAssignmentSectionProps {
  useSmartAssignment: boolean
  assigneeIds: string[]
  estimateHours: string
  isCreating: boolean
  workspaceId: string | undefined
  projectId: string
  title: string
  description: string
  labels: string
  taskType: string
  priority: string
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
  projectId,
  title,
  description,
  labels,
  taskType,
  priority,
  projectMembers,
  onToggleSmartAssignment,
  onAssigneeChange,
  onEstimateChange,
}: TaskAssignmentSectionProps) {
  return (
    <div className="space-y-[8px]">
      {/* Smart Assignment toggle row */}
      <div
        className="flex items-center justify-between p-3 border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
      >
        <div className="flex items-center gap-2">
          <HiOutlineLightBulb
            className="w-4 h-4 flex-shrink-0"
            style={{ color: useSmartAssignment ? 'var(--theme-primary)' : 'var(--theme-foreground)', opacity: useSmartAssignment ? 1 : 0.4 }}
          />
          <div>
            <div className="font-mono text-xs font-bold uppercase" style={{ color: 'var(--theme-foreground)' }}>
              Smart Assignment
            </div>
            <div className="font-mono text-[10px]" style={{ color: 'var(--theme-foreground)', opacity: 0.4 }}>
              AI-powered team matching
            </div>
          </div>
        </div>
        <BrutalToggle
          checked={useSmartAssignment}
          onChange={onToggleSmartAssignment}
          disabled={isCreating}
          size="sm"
        />
      </div>

      {/* Assignment content */}
      {useSmartAssignment ? (
        <>
          <TaskAssignmentHelper
            workspaceId={workspaceId as Id<"workspaces">}
            projectId={projectId as Id<"projects">}
            currentAssignees={assigneeIds as Id<"users">[]}
            onAssigneeChange={onAssigneeChange}
            taskTitle={title}
            taskDescription={description}
            taskLabels={labels.split(',').map(l => l.trim()).filter(Boolean)}
            taskType={taskType}
            priority={priority}
            mode="compact"
          />
          <div>
            <label htmlFor="create-task-estimate-smart" className="block font-mono text-[11px] font-bold uppercase tracking-wider mb-[4px]" style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
              ESTIMATE (HOURS)
            </label>
            <input
              id="create-task-estimate-smart"
              type="number"
              placeholder="0"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-sm placeholder:opacity-30
                       focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--theme-foreground)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = '')}
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
            <label htmlFor="create-task-assignees" className="block font-mono text-[11px] font-bold uppercase tracking-wider mb-[4px]" style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
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
            <label htmlFor="create-task-estimate-manual" className="block font-mono text-[11px] font-bold uppercase tracking-wider mb-[4px]" style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
              ESTIMATE (HOURS)
            </label>
            <input
              id="create-task-estimate-manual"
              type="number"
              placeholder="0"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-sm placeholder:opacity-30
                       focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--theme-foreground)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = '')}
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

// --- Chip sub-components ---

interface TaskTypeChipsProps {
  selectedType: CreateTaskState['type']
  isDisabled: boolean
  onSelect: (v: CreateTaskState['type']) => void
}

function TaskTypeChips({ selectedType, isDisabled, onSelect }: TaskTypeChipsProps) {
  return (
    <div>
      <div className="font-mono text-[11px] font-bold uppercase tracking-wider mb-[8px]" style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
        TYPE
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {TASK_TYPES.map(t => {
          const isSelected = selectedType === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onSelect(t.value)}
              disabled={isDisabled}
              className="inline-flex items-center gap-[5px] px-3 py-1.5 border-2 font-mono text-xs uppercase tracking-wider transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: isSelected ? t.color : 'var(--theme-border)',
                backgroundColor: isSelected ? `color-mix(in srgb, ${t.color} 12%, transparent)` : 'transparent',
                color: isSelected ? t.color : undefined,
                opacity: isSelected ? 1 : undefined,
              }}
              aria-pressed={isSelected}
            >
              <span style={{ color: isSelected ? t.color : 'var(--theme-foreground)', opacity: isSelected ? 1 : 0.35 }}>{t.icon}</span>
              <span style={{ color: isSelected ? t.color : 'var(--theme-foreground)', opacity: isSelected ? 1 : 0.4 }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface TaskPriorityChipsProps {
  selectedPriority: CreateTaskState['priority']
  isDisabled: boolean
  onSelect: (v: CreateTaskState['priority']) => void
}

function TaskPriorityChips({ selectedPriority, isDisabled, onSelect }: TaskPriorityChipsProps) {
  return (
    <div>
      <div className="font-mono text-[11px] font-bold uppercase tracking-wider mb-[8px]" style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
        PRIORITY
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {PRIORITIES.map(p => {
          const isSelected = selectedPriority === p.value
          const isUrgent = p.value === 'urgent'
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onSelect(p.value)}
              disabled={isDisabled}
              className="inline-flex items-center px-3 py-1.5 border-2 font-mono text-xs uppercase tracking-wider transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: isSelected ? p.color : 'var(--theme-border)',
                backgroundColor: isSelected ? `color-mix(in srgb, ${p.bg} ${isUrgent ? '20%' : '12%'}, transparent)` : 'transparent',
                color: isSelected ? p.color : undefined,
              }}
              aria-pressed={isSelected}
            >
              <span style={{ color: isSelected ? p.color : 'var(--theme-foreground)', opacity: isSelected ? 1 : 0.4 }}>{p.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface TaskDateFieldsProps {
  startDate: string
  dueDate: string
  isDisabled: boolean
  onStartDateChange: (v: string) => void
  onDueDateChange: (v: string) => void
}

function TaskDateFields({ startDate, dueDate, isDisabled, onStartDateChange, onDueDateChange }: TaskDateFieldsProps) {
  const inputClass = "w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  const labelClass = "block font-mono text-[11px] font-bold uppercase tracking-wider mb-[4px]"
  return (
    <div className="grid grid-cols-2 gap-[8px]">
      <div>
        <label htmlFor="create-task-start-date" className={labelClass} style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
          START DATE (OPTIONAL)
        </label>
        <input
          id="create-task-start-date"
          type="date"
          className={inputClass}
          style={{ color: 'var(--theme-foreground)' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
          onBlur={e => (e.currentTarget.style.borderColor = '')}
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          disabled={isDisabled}
        />
      </div>
      <div>
        <label htmlFor="create-task-due-date" className={labelClass} style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
          DUE DATE (OPTIONAL)
        </label>
        <input
          id="create-task-due-date"
          type="date"
          className={inputClass}
          style={{ color: 'var(--theme-foreground)' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
          onBlur={e => (e.currentTarget.style.borderColor = '')}
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          disabled={isDisabled}
        />
      </div>
    </div>
  )
}

interface TaskLabelsFieldProps {
  labels: string
  parsedLabels: string[]
  isDisabled: boolean
  onLabelsChange: (v: string) => void
}

function TaskLabelsField({ labels, parsedLabels, isDisabled, onLabelsChange }: TaskLabelsFieldProps) {
  return (
    <div>
      <label htmlFor="create-task-labels" className="block font-mono text-[11px] font-bold uppercase tracking-wider mb-[4px]" style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
        LABELS (COMMA-SEPARATED)
      </label>
      <input
        id="create-task-labels"
        type="text"
        placeholder="FRONTEND, URGENT, REFACTOR"
        className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm uppercase placeholder:opacity-30 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: 'var(--theme-foreground)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
        onBlur={e => (e.currentTarget.style.borderColor = '')}
        value={labels}
        onChange={(e) => onLabelsChange(e.target.value)}
        disabled={isDisabled}
      />
      {parsedLabels.length > 0 && (
        <div className="flex flex-wrap gap-[4px] mt-[6px]">
          {parsedLabels.map((lbl) => (
            <span
              key={lbl}
              className="inline-flex items-center px-2 py-0.5 border font-mono text-[10px] uppercase tracking-wider"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)', opacity: 0.6, backgroundColor: 'var(--theme-background)' }}
            >
              {lbl}
            </span>
          ))}
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

  const [titleFocused, setTitleFocused] = useState(false)

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

  // Parsed label chips for live preview
  const parsedLabels = labels
    .split(',')
    .map(l => l.trim())
    .filter(Boolean)

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="NEW TASK"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-[14px]">

        {/* BREADCRUMB SUBTITLE */}
        <div className="font-mono text-[10px] -mt-1 mb-1 uppercase tracking-widest" style={{ color: 'var(--theme-foreground)', opacity: 0.3 }}>
          {project?.name?.toUpperCase() || 'PROJECT'} / CREATE
        </div>

        {/* TITLE — with left accent bar on focus */}
        <div>
          <label htmlFor="create-task-title" className="block font-mono text-[11px] font-bold uppercase tracking-wider mb-[4px]" style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
            TITLE
          </label>
          <div className="relative">
            {/* Left accent bar visible when focused */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 transition-opacity duration-150"
              style={{
                backgroundColor: 'var(--theme-primary)',
                opacity: titleFocused ? 1 : 0,
              }}
            />
            <input
              id="create-task-title"
              type="text"
              placeholder="TASK TITLE"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-sm uppercase placeholder:opacity-30
                       focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--theme-foreground)', borderColor: titleFocused ? 'var(--theme-primary)' : undefined }}
              value={title}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'title', value: e.target.value })}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
              disabled={isCreating}
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label htmlFor="create-task-description" className="block font-mono text-[11px] font-bold uppercase tracking-wider mb-[4px]" style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}>
            DESCRIPTION (OPTIONAL)
          </label>
          <textarea
            id="create-task-description"
            placeholder="ADD A DESCRIPTION..."
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                     font-mono text-sm placeholder:opacity-30
                     focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            style={{ color: 'var(--theme-foreground)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = '')}
            value={description}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'description', value: e.target.value })}
            rows={3}
            disabled={isCreating}
          />
        </div>

        {/* TYPE & PRIORITY chips */}
        <TaskTypeChips
          selectedType={type}
          isDisabled={isCreating}
          onSelect={(v) => dispatch({ type: 'UPDATE', field: 'type', value: v })}
        />
        <TaskPriorityChips
          selectedPriority={priority}
          isDisabled={isCreating}
          onSelect={(v) => dispatch({ type: 'UPDATE', field: 'priority', value: v })}
        />

        {/* DATES */}
        <TaskDateFields
          startDate={startDate}
          dueDate={dueDate}
          isDisabled={isCreating}
          onStartDateChange={(v) => dispatch({ type: 'UPDATE', field: 'startDate', value: v })}
          onDueDateChange={(v) => dispatch({ type: 'UPDATE', field: 'dueDate', value: v })}
        />

        {/* SECTION DIVIDER */}
        <div className="border-t border-[var(--theme-border)] opacity-50" />

        {/* ASSIGNEE & ESTIMATE */}
        <TaskAssignmentSection
          useSmartAssignment={useSmartAssignment}
          assigneeIds={assigneeIds}
          estimateHours={estimateHours}
          isCreating={isCreating}
          workspaceId={project?.workspaceId}
          projectId={projectId}
          title={title}
          description={description}
          labels={labels}
          taskType={type}
          priority={priority}
          projectMembers={project?.members}
          onToggleSmartAssignment={() => dispatch({ type: 'TOGGLE_SMART_ASSIGNMENT' })}
          onAssigneeChange={(ids) => dispatch({ type: 'SET_ASSIGNEE_IDS', value: ids })}
          onEstimateChange={(value) => dispatch({ type: 'UPDATE', field: 'estimateHours', value })}
        />

        {/* SECTION DIVIDER */}
        <div className="border-t border-[var(--theme-border)] opacity-50" />

        {/* LABELS */}
        <TaskLabelsField
          labels={labels}
          parsedLabels={parsedLabels}
          isDisabled={isCreating}
          onLabelsChange={(v) => dispatch({ type: 'UPDATE', field: 'labels', value: v })}
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-[8px] pt-[12px] border-t-2 border-[var(--theme-border)]">
          <BrutalButton
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isCreating}
          >
            CANCEL
          </BrutalButton>
          <BrutalButton
            type="submit"
            variant="primary"
            size="md"
            loading={isCreating}
            disabled={isCreating}
          >
            CREATE TASK
          </BrutalButton>
        </div>
      </form>
    </BrutalModal>
  )
}
