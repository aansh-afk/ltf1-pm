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
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* PROJECT NAME & KEY */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              placeholder="My Awesome Project"
              className="w-full px-3 py-2 bg-[#111111] border-2 border-[#2E2E35]
                       font-mono text-sm text-[#F9FAFB] uppercase placeholder:text-[#6B7280] placeholder:normal-case
                       focus:border-[#6366F1] focus:outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
              Key
            </label>
            <input
              type="text"
              placeholder="MAP"
              className="w-full px-3 py-2 bg-[#111111] border-2 border-[#2E2E35]
                       font-mono text-sm text-[#F9FAFB] uppercase placeholder:text-[#6B7280]
                       focus:border-[#6366F1] focus:outline-none
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
            Description (optional)
          </label>
          <textarea
            placeholder="What's this project about?"
            className="w-full px-3 py-2 bg-[#111111] border-2 border-[#2E2E35]
                     font-mono text-sm text-[#F9FAFB] placeholder:text-[#6B7280]
                     focus:border-[#6366F1] focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={isCreating}
          />
        </div>

        {/* WORKFLOW TYPE */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
            Workflow Type
          </label>
          <select
            className="w-full px-3 py-2 bg-[#111111] border-2 border-[#2E2E35]
                     font-mono text-sm text-[#F9FAFB] uppercase
                     focus:border-[#6366F1] focus:outline-none
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
        <div className="flex justify-end gap-2 pt-3 border-t border-[#1F1F23]">
          <button
            type="button"
            className="px-4 py-2 bg-transparent border-2 border-[#2E2E35]
                     font-mono text-xs uppercase tracking-wider text-[#9CA3AF]
                     hover:border-[#F9FAFB]/20 hover:text-[#F9FAFB]
                     disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#6366F1] border-2 border-[#4F46E5]
                     font-mono text-xs uppercase tracking-wider text-white
                     hover:bg-[#4F46E5]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-1.5"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}