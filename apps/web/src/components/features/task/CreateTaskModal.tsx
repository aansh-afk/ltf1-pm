import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import MultiSelect from '../../ui/MultiSelect'

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

  const createTask = useMutation(api.tasks.mutations.createTask)
  const project = useQuery(api.projects.queries.getProject, { projectId })

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
            className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
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
          <label className="block text-brutal-sm mb-8px">
            DESCRIPTION (OPTIONAL)
          </label>
          <textarea
            placeholder="ADD A DESCRIPTION..."
            className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
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
              className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
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
              className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
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
              className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
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
              className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
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
              className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
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

        {/* LABELS */}
        <div>
          <label className="block text-brutal-sm mb-8px">
            LABELS (COMMA-SEPARATED)
          </label>
          <input
            type="text"
            placeholder="FRONTEND, URGENT, REFACTOR"
            className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                     font-mono text-brutal-md uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            disabled={isCreating}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-16px pt-24px border-t-2 border-basalt-border">
          <button 
            type="button" 
            className="px-24px py-12px bg-transparent border-2 border-basalt-border 
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
            className="px-24px py-12px bg-primary-brutalist border-2 border-basalt-border 
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