import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onSuccess?: () => void
}

export default function CreateProjectModal({ isOpen, onClose, workspaceId, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [workflowType, setWorkflowType] = useState<'kanban' | 'scrum' | 'hybrid'>('kanban')
  const [isCreating, setIsCreating] = useState(false)

  const createProject = useMutation(api.projects.mutations.createProject)
  const members = useQuery(api.workspaces.queries.getWorkspaceMembers, { workspaceId })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !key.trim()) {
      toast.error('Project name and key are required')
      return
    }

    if (key.length > 5) {
      toast.error('Project key must be 5 characters or less')
      return
    }

    setIsCreating(true)
    
    try {
      await createProject({
        workspaceId,
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        workflowType,
      })
      
      toast.success('Project created successfully!')
      setName('')
      setKey('')
      setDescription('')
      setWorkflowType('kanban')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!key && value) {
      const generatedKey = value
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 5)
      setKey(generatedKey)
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-[12px]">
        {/* PROJECT NAME & KEY */}
        <div className="grid grid-cols-3 gap-[8px]">
          <div className="col-span-2">
            <label className="block text-brutal-sm mb-[4px]">
              PROJECT NAME
            </label>
            <input
              type="text"
              placeholder="MY AWESOME PROJECT"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md uppercase placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-brutal-sm mb-[4px]">
              KEY
            </label>
            <input
              type="text"
              placeholder="MAP"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md uppercase placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              maxLength={5}
              disabled={isCreating}
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-brutal-sm mb-[4px]">
            DESCRIPTION (OPTIONAL)
          </label>
          <textarea
            placeholder="WHAT'S THIS PROJECT ABOUT?"
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                     font-mono text-brutal-md placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={isCreating}
          />
        </div>

        {/* WORKFLOW TYPE */}
        <div>
          <label className="block text-brutal-sm mb-[4px]">
            WORKFLOW TYPE
          </label>
          <select
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                     font-mono text-brutal-md uppercase
                     focus:border-primary-brutalist focus:outline-none transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
            value={workflowType}
            onChange={(e) => setWorkflowType(e.target.value as any)}
            disabled={isCreating}
          >
            <option value="kanban">KANBAN (CONTINUOUS FLOW)</option>
            <option value="scrum">SCRUM (SPRINT-BASED)</option>
            <option value="hybrid">HYBRID (MIX OF BOTH)</option>
          </select>
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
              'CREATE PROJECT'
            )}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}