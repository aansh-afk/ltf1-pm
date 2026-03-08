import { useState, useEffect, useReducer } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineGlobeAlt,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineCog,
  HiOutlineChevronRight,
  HiOutlineDuplicate,
  HiOutlineFilter
} from 'react-icons/hi'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalInput from '@/components/ui/BrutalInput'
import BrutalModal from '@/components/ui/BrutalModal'
import BrutalSelect from '@/components/ui/BrutalSelect'
import FlowCanvas from './FlowCanvas'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface WorkflowBuilderProps {
  workspaceId: Id<"workspaces">
  projectId?: Id<"projects">
}

interface WorkflowActionInput {
  type: string
  config: Record<string, unknown>
}

interface WorkflowConditionInput {
  field: string
  operator: string
  value: string
}

interface WorkflowTriggerInput {
  type: string
  event?: string
  schedule?: string
  webhookUrl?: string
}

/** Shape returned from the Convex getWorkflows query */
interface WorkflowRecord {
  _id: Id<"workflows">
  _creationTime: number
  workspaceId: Id<"workspaces">
  name: string
  description?: string
  enabled: boolean
  trigger: {
    type: string
    event?: string
    eventType?: string
    schedule?: string
    webhookUrl?: string
    conditions?: { field: string; operator: string; value: unknown; connector?: 'AND' | 'OR' }[]
  }
  actions: { type: string; config: unknown; order: number }[]
  conditions?: { field: string; operator: string; value: unknown }[]
  runCount: number
  lastRun?: number
  lastRunAt?: number
  createdBy: string
  createdAt: number
  updatedAt: number
}

const TRIGGER_TYPES = {
  EVENT: { 
    value: 'event', 
    label: 'Event', 
    icon: HiOutlineLightningBolt,
    description: 'Triggered by system events'
  },
  SCHEDULE: { 
    value: 'schedule', 
    label: 'Schedule', 
    icon: HiOutlineClock,
    description: 'Run on a schedule'
  },
  WEBHOOK: { 
    value: 'webhook', 
    label: 'Webhook', 
    icon: HiOutlineGlobeAlt,
    description: 'External webhook trigger'
  },
  MANUAL: { 
    value: 'manual', 
    label: 'Manual', 
    icon: HiOutlinePlay,
    description: 'Run manually'
  }
}

const EVENT_TYPES = [
  { value: 'task.created', label: 'Task Created' },
  { value: 'task.updated', label: 'Task Updated' },
  { value: 'task.assigned', label: 'Task Assigned' },
  { value: 'task.completed', label: 'Task Completed' },
  { value: 'task.overdue', label: 'Task Overdue' },
  { value: 'sprint.started', label: 'Sprint Started' },
  { value: 'sprint.ending', label: 'Sprint Ending' },
  { value: 'sprint.completed', label: 'Sprint Completed' },
  { value: 'project.created', label: 'Project Created' },
  { value: 'project.milestone_reached', label: 'Project Milestone Reached' },
  { value: 'meeting.scheduled', label: 'Meeting Scheduled' },
  { value: 'meeting.starting', label: 'Meeting Starting' },
  { value: 'time_entry.created', label: 'Time Entry Created' },
]

const ACTION_TYPES = [
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_task', label: 'Update Task' },
  { value: 'assign_task', label: 'Assign Task' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'send_email', label: 'Send Email' },
  { value: 'slack_message', label: 'Send Slack Message' },
  { value: 'create_meeting', label: 'Schedule Meeting' },
  { value: 'add_comment', label: 'Add Comment' },
  { value: 'update_field', label: 'Update Field' },
  { value: 'webhook', label: 'Call Webhook' },
]

type WorkflowBuilderState = {
  viewMode: 'list' | 'flow'
  showCreateModal: boolean
  editingWorkflow: WorkflowRecord | null
  selectedWorkflowForFlow: WorkflowRecord | null
  selectedTriggerType: string
  workflowName: string
  workflowDescription: string
  selectedEvent: string
  scheduleConfig: string
  webhookUrl: string
  actions: WorkflowActionInput[]
  conditions: WorkflowConditionInput[]
}

const workflowBuilderInitialState: WorkflowBuilderState = {
  viewMode: 'list',
  showCreateModal: false,
  editingWorkflow: null,
  selectedWorkflowForFlow: null,
  selectedTriggerType: 'event',
  workflowName: '',
  workflowDescription: '',
  selectedEvent: '',
  scheduleConfig: '',
  webhookUrl: '',
  actions: [],
  conditions: [],
}

type WorkflowBuilderAction =
  | { type: 'UPDATE'; field: keyof WorkflowBuilderState; value: unknown }
  | { type: 'RESET_FORM' }

function workflowBuilderReducer(state: WorkflowBuilderState, action: WorkflowBuilderAction): WorkflowBuilderState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET_FORM':
      return {
        ...state,
        workflowName: '',
        workflowDescription: '',
        selectedTriggerType: 'event',
        selectedEvent: '',
        scheduleConfig: '',
        webhookUrl: '',
        actions: [],
        conditions: [],
        editingWorkflow: null,
      }
    default:
      return state
  }
}

// --- Sub-components ---

interface WorkflowListItemCardProps {
  workflow: WorkflowRecord
  onRun: (workflowId: Id<"workflows">) => void
  onToggle: (workflowId: Id<"workflows">, enabled: boolean) => void
  onViewFlow: (workflow: WorkflowRecord) => void
  onEdit: (workflow: WorkflowRecord) => void
  onDelete: (workflowId: Id<"workflows">) => void
}

function WorkflowListItemCard({ workflow, onRun, onToggle, onViewFlow, onEdit, onDelete }: WorkflowListItemCardProps) {
  const TriggerIcon = TRIGGER_TYPES[workflow.trigger.type.toUpperCase() as keyof typeof TRIGGER_TYPES]?.icon || HiOutlineLightningBolt

  return (
    <BrutalCard key={workflow._id} className="p-[16px]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-[6px] mb-[8px]">
            <TriggerIcon className="w-5 h-5 text-[var(--theme-primary)]" />
            <h3 className="text-[14px] font-semibold font-bold">{workflow.name}</h3>
            <span className={clsx(
              "px-8px py-2px text-xs font-bold uppercase",
              workflow.enabled
                ? "bg-brutal-success text-event-horizon"
                : "bg-[var(--theme-muted)] text-[var(--theme-background)]"
            )}>
              {workflow.enabled ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>

          {workflow.description && (
            <p className="text-sm text-[var(--theme-muted)] mb-[6px]">
              {workflow.description}
            </p>
          )}

          <div className="flex flex-wrap gap-[8px] mb-[6px]">
            <span className="px-8px py-4px bg-[var(--theme-background-secondary)] text-xs font-mono">
              TRIGGER: {workflow.trigger.type.toUpperCase()}
            </span>
            {workflow.trigger.event && (
              <span className="px-8px py-4px bg-[var(--theme-background-secondary)] text-xs font-mono">
                EVENT: {workflow.trigger.event}
              </span>
            )}
            <span className="px-8px py-4px bg-[var(--theme-background-secondary)] text-xs font-mono">
              {workflow.actions.length} ACTIONS
            </span>
            {(workflow.conditions?.length ?? 0) > 0 && (
              <span className="px-8px py-4px bg-[var(--theme-background-secondary)] text-xs font-mono">
                {workflow.conditions?.length} CONDITIONS
              </span>
            )}
          </div>

          <div className="flex items-center gap-[8px] text-xs text-[var(--theme-muted)]">
            <span>RUNS: {workflow.runCount || 0}</span>
            <span>•</span>
            <span>LAST RUN: {workflow.lastRunAt ? new Date(workflow.lastRunAt).toLocaleString() : 'Never'}</span>
          </div>
        </div>

        <div className="flex items-center gap-[8px]">
          {workflow.trigger.type === 'manual' && (
            <BrutalButton
              onClick={() => onRun(workflow._id)}
              variant="secondary"
              size="sm"
              icon={<HiOutlinePlay className="w-4 h-4" />}
            >
              RUN
            </BrutalButton>
          )}

          <BrutalButton
            onClick={() => onToggle(workflow._id, !workflow.enabled)}
            variant="secondary"
            size="sm"
            icon={workflow.enabled ?
              <HiOutlinePause className="w-4 h-4" /> :
              <HiOutlinePlay className="w-4 h-4" />
            }
          >
            {workflow.enabled ? 'PAUSE' : 'ENABLE'}
          </BrutalButton>

          <BrutalButton
            onClick={() => onViewFlow(workflow)}
            variant="secondary"
            size="sm"
            title="View in flow canvas"
          >
            FLOW
          </BrutalButton>

          <BrutalButton
            onClick={() => onEdit(workflow)}
            variant="secondary"
            size="sm"
            icon={<HiOutlinePencil className="w-4 h-4" />}
          />

          <BrutalButton
            onClick={() => onDelete(workflow._id)}
            variant="secondary"
            size="sm"
            icon={<HiOutlineTrash className="w-4 h-4" />}
          />
        </div>
      </div>
    </BrutalCard>
  )
}

// --- Main component ---

export default function WorkflowBuilder({ workspaceId, projectId }: WorkflowBuilderProps) {
  const [state, dispatch] = useReducer(workflowBuilderReducer, workflowBuilderInitialState)
  const { viewMode, showCreateModal, editingWorkflow, selectedWorkflowForFlow, selectedTriggerType, workflowName, workflowDescription, selectedEvent, scheduleConfig, webhookUrl, actions, conditions } = state

  // Fetch workflows
  const workflows = useQuery(api.automation.getWorkflows, { 
    workspaceId,
    projectId 
  }) || []

  // Mutations
  const createWorkflow = useMutation(api.automation.createWorkflow)
  const updateWorkflow = useMutation(api.automation.updateWorkflow)
  const deleteWorkflow = useMutation(api.automation.deleteWorkflow)
  const toggleWorkflow = useMutation(api.automation.toggleWorkflow)
  const runWorkflow = useMutation(api.automation.runWorkflow)

  const handleCreateWorkflow = async () => {
    if (!workflowName) {
      toast.error('Please enter a workflow name')
      return
    }

    try {
      const trigger: WorkflowTriggerInput = { type: selectedTriggerType }

      if (selectedTriggerType === 'event') {
        trigger.event = selectedEvent
      } else if (selectedTriggerType === 'schedule') {
        trigger.schedule = scheduleConfig
      } else if (selectedTriggerType === 'webhook') {
        trigger.webhookUrl = webhookUrl
      }

      await createWorkflow({
        workspaceId,
        projectId,
        name: workflowName,
        description: workflowDescription,
        trigger,
        conditions,
        actions,
        enabled: true
      })

      toast.success('Workflow created successfully')
      resetForm()
      dispatch({ type: 'UPDATE', field: 'showCreateModal', value: false })
    } catch (error) {
      toast.error('Failed to create workflow')
    }
  }

  const handleToggleWorkflow = async (workflowId: Id<"workflows">, enabled: boolean) => {
    try {
      await toggleWorkflow({ workflowId, enabled })
      toast.success(enabled ? 'Workflow enabled' : 'Workflow disabled')
    } catch (error) {
      toast.error('Failed to toggle workflow')
    }
  }

  const handleRunWorkflow = async (workflowId: Id<"workflows">) => {
    try {
      await runWorkflow({ workflowId })
      toast.success('Workflow triggered successfully')
    } catch (error) {
      toast.error('Failed to run workflow')
    }
  }

  const handleDeleteWorkflow = async (workflowId: Id<"workflows">) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await deleteWorkflow({ workflowId })
        toast.success('Workflow deleted')
      } catch (error) {
        toast.error('Failed to delete workflow')
      }
    }
  }

  const addAction = () => {
    dispatch({ type: 'UPDATE', field: 'actions', value: [...actions, { type: 'create_task', config: {} }] })
  }

  const removeAction = (index: number) => {
    dispatch({ type: 'UPDATE', field: 'actions', value: actions.filter((_: WorkflowActionInput, i: number) => i !== index) })
  }

  const updateAction = (index: number, action: WorkflowActionInput) => {
    const updatedActions = [...actions]
    updatedActions[index] = action
    dispatch({ type: 'UPDATE', field: 'actions', value: updatedActions })
  }

  const addCondition = () => {
    dispatch({ type: 'UPDATE', field: 'conditions', value: [...conditions, { field: '', operator: 'equals', value: '' }] })
  }

  const removeCondition = (index: number) => {
    dispatch({ type: 'UPDATE', field: 'conditions', value: conditions.filter((_: WorkflowConditionInput, i: number) => i !== index) })
  }

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' })
  }

  return (
    <div className="space-y-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold font-bold">WORKFLOW AUTOMATION</h2>
        <div className="flex items-center gap-[6px]">
          {/* View Toggle */}
          <div className="flex border-2 border-[var(--theme-border)]">
            <button
              onClick={() => dispatch({ type: 'UPDATE', field: 'viewMode', value: 'list' })}
              className={clsx(
                "px-[10px] py-[8px] text-xs font-bold uppercase transition-all",
                viewMode === 'list'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "bg-[var(--theme-background)] text-[var(--theme-foreground)] hover:bg-[var(--theme-hover)]"
              )}
            >
              LIST VIEW
            </button>
            <button
              onClick={() => dispatch({ type: 'UPDATE', field: 'viewMode', value: 'flow' })}
              className={clsx(
                "px-[10px] py-[8px] text-xs font-bold uppercase border-l-2 border-[var(--theme-border)] transition-all",
                viewMode === 'flow'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "bg-[var(--theme-background)] text-[var(--theme-foreground)] hover:bg-[var(--theme-hover)]"
              )}
            >
              FLOW VIEW
            </button>
          </div>

          <BrutalButton
            onClick={() => dispatch({ type: 'UPDATE', field: 'showCreateModal', value: true })}
            variant="primary"
            icon={<HiOutlinePlus className="w-5 h-5" />}
          >
            CREATE WORKFLOW
          </BrutalButton>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-[10px]">
        {workflows.length === 0 ? (
          <BrutalCard className="p-[24px] text-center">
            <HiOutlineLightningBolt className="w-6 h-6 mx-auto mb-[8px] text-[var(--theme-muted)]" />
            <p className="text-[14px] font-semibold font-bold mb-[8px]">NO WORKFLOWS YET</p>
            <p className="text-[var(--theme-muted)] mb-[12px]">
              Create automated workflows to streamline your processes
            </p>
            <BrutalButton
              onClick={() => dispatch({ type: 'UPDATE', field: 'showCreateModal', value: true })}
              variant="primary"
            >
              CREATE FIRST WORKFLOW
            </BrutalButton>
          </BrutalCard>
        ) : (
          workflows.map((workflow) => (
              <WorkflowListItemCard
                key={workflow._id}
                workflow={workflow}
                onRun={handleRunWorkflow}
                onToggle={handleToggleWorkflow}
                onViewFlow={(wf) => {
                  dispatch({ type: 'UPDATE', field: 'selectedWorkflowForFlow', value: wf })
                  dispatch({ type: 'UPDATE', field: 'viewMode', value: 'flow' })
                }}
                onEdit={(wf) => {
                  dispatch({ type: 'UPDATE', field: 'editingWorkflow', value: wf })
                  dispatch({ type: 'UPDATE', field: 'showCreateModal', value: true })
                }}
                onDelete={handleDeleteWorkflow}
              />
          ))
        )}
        </div>
      )}

      {/* Flow View */}
      {viewMode === 'flow' && (
        <div className="space-y-[8px]">
          {workflows.length === 0 ? (
            <BrutalCard className="p-[24px] text-center">
              <HiOutlineLightningBolt className="w-6 h-6 mx-auto mb-[8px] text-[var(--theme-muted)]" />
              <p className="text-[14px] font-semibold font-bold mb-[8px]">NO WORKFLOWS TO VISUALIZE</p>
              <p className="text-[var(--theme-muted)] mb-[12px]">
                Create a workflow first to see it visualized in the flow canvas
              </p>
              <BrutalButton
                onClick={() => dispatch({ type: 'UPDATE', field: 'showCreateModal', value: true })}
                variant="primary"
              >
                CREATE FIRST WORKFLOW
              </BrutalButton>
            </BrutalCard>
          ) : (
            <>
              {/* Workflow Selector */}
              <div className="flex items-center gap-[6px]">
                <BrutalSelect
                  id="workflow-select"
                  label="SELECT WORKFLOW:"
                  value={selectedWorkflowForFlow?._id || ''}
                  onChange={(v) => {
                    const workflow = workflows.find((w) => w._id === v)
                    dispatch({ type: 'UPDATE', field: 'selectedWorkflowForFlow', value: workflow })
                  }}
                  placeholder="Select a workflow..."
                  options={workflows.map((workflow) => ({
                    value: workflow._id,
                    label: workflow.name,
                  }))}
                />
              </div>

              {/* Flow Canvas */}
              {selectedWorkflowForFlow ? (
                <FlowCanvas workflow={selectedWorkflowForFlow} />
              ) : (
                <BrutalCard className="p-[24px] text-center">
                  <p className="text-[var(--theme-muted)]">
                    Select a workflow above to visualize it in the flow canvas
                  </p>
                </BrutalCard>
              )}
            </>
          )}
        </div>
      )}

      {/* Create/Edit Workflow Modal */}
      <BrutalModal
        isOpen={showCreateModal}
        onClose={() => {
          dispatch({ type: 'UPDATE', field: 'showCreateModal', value: false })
          resetForm()
        }}
        title={editingWorkflow ? 'EDIT WORKFLOW' : 'CREATE WORKFLOW'}
        size="xl"
      >
        <div className="space-y-[12px]">
          {/* Basic Info */}
          <div className="space-y-[8px]">
            <BrutalInput
              label="Workflow Name"
              value={workflowName}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'workflowName', value: e.target.value })}
              placeholder="e.g., Auto-assign new tasks"
              required
            />
            <BrutalInput
              label="Description"
              value={workflowDescription}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'workflowDescription', value: e.target.value })}
              placeholder="What does this workflow do?"
            />
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-[8px]">
            <span className="text-xs font-bold uppercase">TRIGGER TYPE</span>
            <div className="grid grid-cols-2 gap-[6px]">
              {Object.values(TRIGGER_TYPES).map((trigger) => (
                <button
                  key={trigger.value}
                  onClick={() => dispatch({ type: 'UPDATE', field: 'selectedTriggerType', value: trigger.value })}
                  className={clsx(
                    "p-[10px] border-2 text-left transition-all",
                    selectedTriggerType === trigger.value
                      ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/10"
                      : "border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50"
                  )}
                >
                  <div className="flex items-center gap-[6px] mb-[8px]">
                    <trigger.icon className="w-5 h-5" />
                    <span className="font-bold">{trigger.label}</span>
                  </div>
                  <p className="text-xs text-[var(--theme-muted)]">
                    {trigger.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Trigger-specific configuration */}
            {selectedTriggerType === 'event' && (
              <div>
                <BrutalSelect
                  id="workflow-event"
                  label="SELECT EVENT"
                  value={selectedEvent}
                  onChange={(v) => dispatch({ type: 'UPDATE', field: 'selectedEvent', value: v })}
                  placeholder="Select an event..."
                  options={EVENT_TYPES}
                  fullWidth
                />
              </div>
            )}

            {selectedTriggerType === 'schedule' && (
              <BrutalInput
                label="Schedule (Cron Expression)"
                value={scheduleConfig}
                onChange={(e) => dispatch({ type: 'UPDATE', field: 'scheduleConfig', value: e.target.value })}
                placeholder="0 9 * * MON-FRI"
                helperText="Run at 9 AM every weekday"
              />
            )}

            {selectedTriggerType === 'webhook' && (
              <div className="space-y-[6px]">
                <BrutalInput
                  label="Webhook URL"
                  value={webhookUrl}
                  onChange={(e) => dispatch({ type: 'UPDATE', field: 'webhookUrl', value: e.target.value })}
                  placeholder="https://your-app.com/webhook"
                  disabled
                />
                <p className="text-xs text-[var(--theme-muted)]">
                  Webhook URL will be generated after creation
                </p>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="space-y-[8px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase">CONDITIONS (OPTIONAL)</span>
              <BrutalButton
                onClick={addCondition}
                variant="secondary"
                size="sm"
                icon={<HiOutlinePlus className="w-4 h-4" />}
              >
                ADD CONDITION
              </BrutalButton>
            </div>
            
            {conditions.map((condition, index) => (
              <div key={`condition-${condition.field || 'empty'}-${condition.operator}-${condition.value || 'empty'}`} className="flex items-center gap-[8px] p-[10px] border-2 border-[var(--theme-border)]">
                <input
                  type="text"
                  value={condition.field}
                  onChange={(e) => {
                    const updated = [...conditions]
                    updated[index].field = e.target.value
                    dispatch({ type: 'UPDATE', field: 'conditions', value: updated })
                  }}
                  placeholder="Field"
                  aria-label={`Condition ${index + 1} field`}
                  className="flex-1 px-8px py-4px border-2 border-[var(--theme-border)]"
                />
                <BrutalSelect
                  value={condition.operator}
                  onChange={(v) => {
                    const updated = [...conditions]
                    updated[index].operator = v
                    dispatch({ type: 'UPDATE', field: 'conditions', value: updated })
                  }}
                  options={[
                    { value: 'equals', label: 'Equals' },
                    { value: 'not_equals', label: 'Not Equals' },
                    { value: 'contains', label: 'Contains' },
                    { value: 'greater_than', label: 'Greater Than' },
                    { value: 'less_than', label: 'Less Than' },
                  ]}
                  compact
                />
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => {
                    const updated = [...conditions]
                    updated[index].value = e.target.value
                    dispatch({ type: 'UPDATE', field: 'conditions', value: updated })
                  }}
                  placeholder="Value"
                  aria-label={`Condition ${index + 1} value`}
                  className="flex-1 px-8px py-4px border-2 border-[var(--theme-border)]"
                />
                <button
                  onClick={() => removeCondition(index)}
                  className="p-4px text-brutal-error hover:bg-brutal-error hover:text-event-horizon"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-[8px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase">ACTIONS</span>
              <BrutalButton
                onClick={addAction}
                variant="secondary"
                size="sm"
                icon={<HiOutlinePlus className="w-4 h-4" />}
              >
                ADD ACTION
              </BrutalButton>
            </div>
            
            {actions.map((action, index) => (
              <div key={`action-${action.type}-${JSON.stringify(action.config)}`} className="p-[10px] border-2 border-[var(--theme-border)] space-y-[8px]">
                <div className="flex items-center justify-between">
                  <BrutalSelect
                    value={action.type}
                    onChange={(v) => updateAction(index, { ...action, type: v })}
                    options={ACTION_TYPES}
                    compact
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeAction(index)}
                    className="ml-[8px] p-4px text-brutal-error hover:bg-brutal-error hover:text-event-horizon"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Action-specific configuration */}
                {action.type === 'create_task' && (
                  <div className="space-y-[8px]">
                    <input
                      type="text"
                      placeholder="Task title"
                      className="w-full px-8px py-4px border-2 border-[var(--theme-border)]"
                      onChange={(e) => updateAction(index, { 
                        ...action, 
                        config: { ...action.config, title: e.target.value }
                      })}
                    />
                    <textarea
                      placeholder="Task description"
                      className="w-full px-8px py-4px border-2 border-[var(--theme-border)]"
                      rows={2}
                      onChange={(e) => updateAction(index, { 
                        ...action, 
                        config: { ...action.config, description: e.target.value }
                      })}
                    />
                  </div>
                )}
                
                {action.type === 'send_notification' && (
                  <div className="space-y-[8px]">
                    <input
                      type="text"
                      placeholder="Notification message"
                      className="w-full px-8px py-4px border-2 border-[var(--theme-border)]"
                      onChange={(e) => updateAction(index, { 
                        ...action, 
                        config: { ...action.config, message: e.target.value }
                      })}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {actions.length === 0 && (
              <p className="text-sm text-[var(--theme-muted)] text-center py-[8px]">
                Add at least one action for your workflow
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-[6px]">
            <BrutalButton
              onClick={() => {
                dispatch({ type: 'UPDATE', field: 'showCreateModal', value: false })
                resetForm()
              }}
              variant="secondary"
            >
              CANCEL
            </BrutalButton>
            <BrutalButton
              onClick={handleCreateWorkflow}
              variant="primary"
              disabled={!workflowName || (selectedTriggerType === 'event' && !selectedEvent) || actions.length === 0}
            >
              {editingWorkflow ? 'UPDATE WORKFLOW' : 'CREATE WORKFLOW'}
            </BrutalButton>
          </div>
        </div>
      </BrutalModal>
    </div>
  )
}