import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import MultiSelect from '../../ui/MultiSelect'
import { TaskAssignmentHelper } from '../task/TaskAssignmentHelper'
import { HiOutlineSwitchHorizontal, HiOutlineLightBulb, HiSparkles } from 'react-icons/hi'
import { useAI } from '../../../hooks/useAI'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  defaultStatus?: string
  defaultDueDate?: string
  onSuccess?: () => void
}

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  projectId, 
  defaultStatus = 'backlog',
  defaultDueDate,
  onSuccess 
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'feature' | 'bug' | 'improvement' | 'task' | 'epic'>('task')
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [labels, setLabels] = useState<string>('')
  const [estimateHours, setEstimateHours] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>(defaultDueDate || '')
  const [isCreating, setIsCreating] = useState(false)
  const [useSmartAssignment, setUseSmartAssignment] = useState(true)

  const createTask = useMutation(api.tasks.mutations.createTask)
  const project = useQuery(api.projects.queries.getProject, { projectId })
  const { generateTaskDetails, loading: aiLoading } = useAI()

  const handleAIMagic = async () => {
    if (!description.trim() && !title.trim()) {
      toast.error('Please enter a description or title first')
      return
    }

    try {
      const textToAnalyze = description || title
      const details = await generateTaskDetails(textToAnalyze)

      if (!title) setTitle(details.title)
      setPriority(details.priority as any)
      if (details.points) setEstimateHours(details.points.toString()) // Mapping points to hours roughly for now, or just filling the field
      if (details.labels && details.labels.length > 0) setLabels(details.labels.join(', '))

      toast.success('Task details generated!')
    } catch (error) {
      // Error handled in hook
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    setIsCreating(true)
    
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
      
      toast.success('Task created successfully!')
      setTitle('')
      setDescription('')
      setType('task')
      setPriority('medium')
      setAssigneeIds([])
      setLabels('')
      setEstimateHours('')
      setStartDate('')
      setDueDate('')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-24px">
        {/* TITLE */}
        <div>
          <label className="block text-brutal-sm mb-8px">
            TITLE
          </label>
          <input
            type="text"
            placeholder="TASK TITLE"
            className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                     font-mono text-brutal-md uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            disabled={isCreating}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <div className="flex justify-between items-center mb-8px">
            <label className="block text-brutal-sm">
              DESCRIPTION (OPTIONAL)
            </label>
            <button
              type="button"
              onClick={handleAIMagic}
              disabled={aiLoading || (!description && !title)}
              className="flex items-center gap-2 text-xs font-mono text-primary-brutalist hover:text-brutal-info disabled:opacity-50"
            >
              <HiSparkles className={aiLoading ? "animate-spin" : ""} />
              {aiLoading ? "GENERATING..." : "AUTO-FILL WITH AI"}
            </button>
          </div>
          <textarea
            placeholder="ADD A DESCRIPTION..."
            className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                     font-mono text-brutal-md placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={isCreating}
          />
        </div>

        {/* TYPE & PRIORITY */}
        <div className="grid grid-cols-2 gap-16px">
          <div>
            <label className="block text-brutal-sm mb-8px">
              TYPE
            </label>
            <select
              className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md uppercase
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
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
            <label className="block text-brutal-sm mb-8px">
              PRIORITY
            </label>
            <select
              className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md uppercase
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
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
        <div className="grid grid-cols-2 gap-16px">
          <div>
            <label className="block text-brutal-sm mb-8px">
              START DATE (OPTIONAL)
            </label>
            <input
              type="date"
              className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-brutal-sm mb-8px">
              DUE DATE (OPTIONAL)
            </label>
            <input
              type="date"
              className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isCreating}
            />
          </div>
        </div>

        {/* ASSIGNEE & ESTIMATE */}
        <div className="space-y-16px">
          <div className="flex items-center justify-between">
            <label className="block text-brutal-sm">
              TASK ASSIGNMENT
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
            <>
              <TaskAssignmentHelper
                workspaceId={project?.workspaceId as Id<"workspaces">}
                currentAssignees={assigneeIds as Id<"users">[]}
                onAssigneeChange={(ids) => setAssigneeIds(ids)}
                taskTitle={title}
                taskDescription={description}
                taskLabels={labels.split(',').map(l => l.trim()).filter(Boolean)}
                mode="compact"
              />
              <div>
                <label className="block text-brutal-sm mb-8px">
                  ESTIMATE (HOURS)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                           font-mono text-brutal-md placeholder:text-neutral-600
                           focus:border-primary-brutalist focus:outline-none transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(e.target.value)}
                  min="0"
                  step="0.5"
                  disabled={isCreating}
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-16px">
              <div>
                <label className="block text-brutal-sm mb-8px">
                  ASSIGNEES (OPTIONAL)
                </label>
                <MultiSelect
                  options={project?.members?.map((member: any) => ({
                    value: member._id,
                    label: member.name.toUpperCase(),
                    avatarUrl: member.avatarUrl
                  })) || []}
                  value={assigneeIds}
                  onChange={setAssigneeIds}
                  placeholder="SELECT ASSIGNEES"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-brutal-sm mb-8px">
                  ESTIMATE (HOURS)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                           font-mono text-brutal-md placeholder:text-neutral-600
                           focus:border-primary-brutalist focus:outline-none transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(e.target.value)}
                  min="0"
                  step="0.5"
                  disabled={isCreating}
                />
              </div>
            </div>
          )}
        </div>

        {/* LABELS */}
        <div>
          <label className="block text-brutal-sm mb-8px">
            LABELS (COMMA-SEPARATED)
          </label>
          <input
            type="text"
            placeholder="FRONTEND, URGENT, REFACTOR"
            className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                     font-mono text-brutal-md uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            disabled={isCreating}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-16px pt-24px border-t-2 border-[var(--theme-border)]">
          <button 
            type="button" 
            className="px-24px py-12px bg-transparent border-2 border-[var(--theme-border)] 
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
            className="px-24px py-12px bg-primary-brutalist border-2 border-[var(--theme-border)] 
                     font-mono text-brutal-md uppercase tracking-wider text-event-horizon
                     hover:bg-yellow-400 transition-colors shadow-brutal-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-8px"
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