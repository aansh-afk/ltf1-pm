import { useState, useEffect } from 'react'
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
import FlowCanvas from './FlowCanvas'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface WorkflowBuilderProps {
  workspaceId: Id<"workspaces">
  projectId?: Id<"projects">
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

export default function WorkflowBuilder({ workspaceId, projectId }: WorkflowBuilderProps) {
  const [viewMode, setViewMode] = useState<'list' | 'flow'>('list')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null)
  const [selectedWorkflowForFlow, setSelectedWorkflowForFlow] = useState<any>(null)
  const [selectedTriggerType, setSelectedTriggerType] = useState('event')
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [scheduleConfig, setScheduleConfig] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [actions, setActions] = useState<any[]>([])
  const [conditions, setConditions] = useState<any[]>([])

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
      let trigger: any = { type: selectedTriggerType }
      
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
      setShowCreateModal(false)
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
    setActions([...actions, { 
      type: 'create_task', 
      config: {} 
    }])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, action: any) => {
    const updatedActions = [...actions]
    updatedActions[index] = action
    setActions(updatedActions)
  }

  const addCondition = () => {
    setConditions([...conditions, { 
      field: '', 
      operator: 'equals', 
      value: '' 
    }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setWorkflowName('')
    setWorkflowDescription('')
    setSelectedTriggerType('event')
    setSelectedEvent('')
    setScheduleConfig('')
    setWebhookUrl('')
    setActions([])
    setConditions([])
    setEditingWorkflow(null)
  }

  return (
    <div className="space-y-24px">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-brutal-2xl font-bold">WORKFLOW AUTOMATION</h2>
        <div className="flex items-center gap-12px">
          {/* View Toggle */}
          <div className="flex border-2 border-[var(--theme-border)]">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "px-16px py-8px text-xs font-bold uppercase transition-all",
                viewMode === 'list'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "bg-[var(--theme-background)] text-[var(--theme-foreground)] hover:bg-[var(--theme-hover)]"
              )}
            >
              LIST VIEW
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={clsx(
                "px-16px py-8px text-xs font-bold uppercase border-l-2 border-[var(--theme-border)] transition-all",
                viewMode === 'flow'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "bg-[var(--theme-background)] text-[var(--theme-foreground)] hover:bg-[var(--theme-hover)]"
              )}
            >
              FLOW VIEW
            </button>
          </div>

          <BrutalButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            icon={<HiOutlinePlus className="w-20px h-20px" />}
          >
            CREATE WORKFLOW
          </BrutalButton>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-16px">
        {workflows.length === 0 ? (
          <BrutalCard className="p-48px text-center">
            <HiOutlineLightningBolt className="w-48px h-48px mx-auto mb-16px text-[var(--theme-muted)]" />
            <p className="text-brutal-lg font-bold mb-8px">NO WORKFLOWS YET</p>
            <p className="text-[var(--theme-muted)] mb-24px">
              Create automated workflows to streamline your processes
            </p>
            <BrutalButton
              onClick={() => setShowCreateModal(true)}
              variant="primary"
            >
              CREATE FIRST WORKFLOW
            </BrutalButton>
          </BrutalCard>
        ) : (
          workflows.map((workflow: any) => {
            const TriggerIcon = TRIGGER_TYPES[workflow.trigger.type.toUpperCase() as keyof typeof TRIGGER_TYPES]?.icon || HiOutlineLightningBolt
            
            return (
              <BrutalCard key={workflow._id} className="p-24px">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-12px mb-8px">
                      <TriggerIcon className="w-20px h-20px text-[var(--theme-primary)]" />
                      <h3 className="text-brutal-lg font-bold">{workflow.name}</h3>
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
                      <p className="text-sm text-[var(--theme-muted)] mb-12px">
                        {workflow.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-8px mb-12px">
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
                      {workflow.conditions.length > 0 && (
                        <span className="px-8px py-4px bg-[var(--theme-background-secondary)] text-xs font-mono">
                          {workflow.conditions.length} CONDITIONS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-8px text-xs text-[var(--theme-muted)]">
                      <span>RUNS: {workflow.runCount || 0}</span>
                      <span>•</span>
                      <span>LAST RUN: {workflow.lastRunAt ? new Date(workflow.lastRunAt).toLocaleString() : 'Never'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8px">
                    {workflow.trigger.type === 'manual' && (
                      <BrutalButton
                        onClick={() => handleRunWorkflow(workflow._id)}
                        variant="secondary"
                        size="sm"
                        icon={<HiOutlinePlay className="w-16px h-16px" />}
                      >
                        RUN
                      </BrutalButton>
                    )}
                    
                    <BrutalButton
                      onClick={() => handleToggleWorkflow(workflow._id, !workflow.enabled)}
                      variant="secondary"
                      size="sm"
                      icon={workflow.enabled ? 
                        <HiOutlinePause className="w-16px h-16px" /> : 
                        <HiOutlinePlay className="w-16px h-16px" />
                      }
                    >
                      {workflow.enabled ? 'PAUSE' : 'ENABLE'}
                    </BrutalButton>

                    <BrutalButton
                      onClick={() => {
                        setSelectedWorkflowForFlow(workflow)
                        setViewMode('flow')
                      }}
                      variant="secondary"
                      size="sm"
                      title="View in flow canvas"
                    >
                      FLOW
                    </BrutalButton>

                    <BrutalButton
                      onClick={() => {
                        setEditingWorkflow(workflow)
                        setShowCreateModal(true)
                      }}
                      variant="secondary"
                      size="sm"
                      icon={<HiOutlinePencil className="w-16px h-16px" />}
                    />

                    <BrutalButton
                      onClick={() => handleDeleteWorkflow(workflow._id)}
                      variant="secondary"
                      size="sm"
                      icon={<HiOutlineTrash className="w-16px h-16px" />}
                    />
                  </div>
                </div>
              </BrutalCard>
            )
          })
        )}
        </div>
      )}

      {/* Flow View */}
      {viewMode === 'flow' && (
        <div className="space-y-16px">
          {workflows.length === 0 ? (
            <BrutalCard className="p-48px text-center">
              <HiOutlineLightningBolt className="w-48px h-48px mx-auto mb-16px text-[var(--theme-muted)]" />
              <p className="text-brutal-lg font-bold mb-8px">NO WORKFLOWS TO VISUALIZE</p>
              <p className="text-[var(--theme-muted)] mb-24px">
                Create a workflow first to see it visualized in the flow canvas
              </p>
              <BrutalButton
                onClick={() => setShowCreateModal(true)}
                variant="primary"
              >
                CREATE FIRST WORKFLOW
              </BrutalButton>
            </BrutalCard>
          ) : (
            <>
              {/* Workflow Selector */}
              <div className="flex items-center gap-12px">
                <label className="text-xs font-bold uppercase">SELECT WORKFLOW:</label>
                <select
                  value={selectedWorkflowForFlow?._id || ''}
                  onChange={(e) => {
                    const workflow = workflows.find((w: any) => w._id === e.target.value)
                    setSelectedWorkflowForFlow(workflow)
                  }}
                  className="px-12px py-8px border-2 border-[var(--theme-border)] bg-[var(--theme-background)] text-brutal-sm font-bold"
                >
                  <option value="">Select a workflow...</option>
                  {workflows.map((workflow: any) => (
                    <option key={workflow._id} value={workflow._id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Flow Canvas */}
              {selectedWorkflowForFlow ? (
                <FlowCanvas workflow={selectedWorkflowForFlow} />
              ) : (
                <BrutalCard className="p-48px text-center">
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
          setShowCreateModal(false)
          resetForm()
        }}
        title={editingWorkflow ? 'EDIT WORKFLOW' : 'CREATE WORKFLOW'}
        size="xl"
      >
        <div className="space-y-24px">
          {/* Basic Info */}
          <div className="space-y-16px">
            <BrutalInput
              label="Workflow Name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g., Auto-assign new tasks"
              required
            />
            <BrutalInput
              label="Description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="What does this workflow do?"
            />
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-16px">
            <label className="text-xs font-bold uppercase">TRIGGER TYPE</label>
            <div className="grid grid-cols-2 gap-12px">
              {Object.values(TRIGGER_TYPES).map((trigger) => (
                <button
                  key={trigger.value}
                  onClick={() => setSelectedTriggerType(trigger.value)}
                  className={clsx(
                    "p-16px border-2 text-left transition-all",
                    selectedTriggerType === trigger.value
                      ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/10"
                      : "border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50"
                  )}
                >
                  <div className="flex items-center gap-12px mb-8px">
                    <trigger.icon className="w-20px h-20px" />
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
                <label className="text-xs font-bold uppercase mb-8px block">SELECT EVENT</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full px-12px py-8px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                >
                  <option value="">Select an event...</option>
                  {EVENT_TYPES.map((event) => (
                    <option key={event.value} value={event.value}>
                      {event.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTriggerType === 'schedule' && (
              <BrutalInput
                label="Schedule (Cron Expression)"
                value={scheduleConfig}
                onChange={(e) => setScheduleConfig(e.target.value)}
                placeholder="0 9 * * MON-FRI"
                helperText="Run at 9 AM every weekday"
              />
            )}

            {selectedTriggerType === 'webhook' && (
              <div className="space-y-12px">
                <BrutalInput
                  label="Webhook URL"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
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
          <div className="space-y-16px">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase">CONDITIONS (OPTIONAL)</label>
              <BrutalButton
                onClick={addCondition}
                variant="secondary"
                size="sm"
                icon={<HiOutlinePlus className="w-16px h-16px" />}
              >
                ADD CONDITION
              </BrutalButton>
            </div>
            
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-8px p-12px border-2 border-[var(--theme-border)]">
                <input
                  type="text"
                  value={condition.field}
                  onChange={(e) => {
                    const updated = [...conditions]
                    updated[index].field = e.target.value
                    setConditions(updated)
                  }}
                  placeholder="Field"
                  className="flex-1 px-8px py-4px border-2 border-[var(--theme-border)]"
                />
                <select
                  value={condition.operator}
                  onChange={(e) => {
                    const updated = [...conditions]
                    updated[index].operator = e.target.value
                    setConditions(updated)
                  }}
                  className="px-8px py-4px border-2 border-[var(--theme-border)]"
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => {
                    const updated = [...conditions]
                    updated[index].value = e.target.value
                    setConditions(updated)
                  }}
                  placeholder="Value"
                  className="flex-1 px-8px py-4px border-2 border-[var(--theme-border)]"
                />
                <button
                  onClick={() => removeCondition(index)}
                  className="p-4px text-brutal-error hover:bg-brutal-error hover:text-event-horizon"
                >
                  <HiOutlineTrash className="w-16px h-16px" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-16px">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase">ACTIONS</label>
              <BrutalButton
                onClick={addAction}
                variant="secondary"
                size="sm"
                icon={<HiOutlinePlus className="w-16px h-16px" />}
              >
                ADD ACTION
              </BrutalButton>
            </div>
            
            {actions.map((action, index) => (
              <div key={index} className="p-12px border-2 border-[var(--theme-border)] space-y-8px">
                <div className="flex items-center justify-between">
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(index, { ...action, type: e.target.value })}
                    className="flex-1 px-8px py-4px border-2 border-[var(--theme-border)]"
                  >
                    {ACTION_TYPES.map((actionType) => (
                      <option key={actionType.value} value={actionType.value}>
                        {actionType.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeAction(index)}
                    className="ml-8px p-4px text-brutal-error hover:bg-brutal-error hover:text-event-horizon"
                  >
                    <HiOutlineTrash className="w-16px h-16px" />
                  </button>
                </div>
                
                {/* Action-specific configuration */}
                {action.type === 'create_task' && (
                  <div className="space-y-8px">
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
                  <div className="space-y-8px">
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
              <p className="text-sm text-[var(--theme-muted)] text-center py-16px">
                Add at least one action for your workflow
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-12px">
            <BrutalButton
              onClick={() => {
                setShowCreateModal(false)
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