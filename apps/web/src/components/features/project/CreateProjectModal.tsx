import { useReducer } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import posthog from 'posthog-js'
import BrutalModal from '../../ui/BrutalModal'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onSuccess?: () => void
}

type CreateProjectState = {
  name: string
  key: string
  description: string
  workflowType: 'kanban' | 'scrum' | 'hybrid'
  isCreating: boolean
}

const createProjectInitialState: CreateProjectState = {
  name: '',
  key: '',
  description: '',
  workflowType: 'kanban',
  isCreating: false,
}

type CreateProjectAction =
  | { type: 'UPDATE'; field: keyof CreateProjectState; value: CreateProjectState[keyof CreateProjectState] }
  | { type: 'RESET' }

function createProjectReducer(state: CreateProjectState, action: CreateProjectAction): CreateProjectState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return createProjectInitialState
    default:
      return state
  }
}

export default function CreateProjectModal({ isOpen, onClose, workspaceId, onSuccess }: CreateProjectModalProps) {
  const [state, dispatch] = useReducer(createProjectReducer, createProjectInitialState)
  const { name, key, description, workflowType, isCreating } = state

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

    dispatch({ type: 'UPDATE', field: 'isCreating', value: true })

    try {
      await createProject({
        workspaceId,
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        workflowType,
      })

      posthog.capture('project_created', { workflow_type: workflowType, has_description: !!description.trim() })
      toast.success('Project created successfully!')
      dispatch({ type: 'RESET' })
      onSuccess?.()
      onClose()
    } catch (error: any) {
      posthog.capture('project_creation_failed', { error: error.message })
      toast.error(error.message || 'Failed to create project')
    } finally {
      dispatch({ type: 'UPDATE', field: 'isCreating', value: false })
    }
  }

  const handleNameChange = (value: string) => {
    dispatch({ type: 'UPDATE', field: 'name', value })
    if (!key && value) {
      const generatedKey = value
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 5)
      dispatch({ type: 'UPDATE', field: 'key', value: generatedKey })
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
            <label htmlFor="create-project-name" className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
              Project Name
            </label>
            <input
              id="create-project-name"
              type="text"
              placeholder="My Awesome Project"
              className="w-full px-3 py-2 bg-[#111111] border-2 border-[#2E2E35]
                       font-mono text-sm text-[#F9FAFB] uppercase placeholder:text-[#6B7280] placeholder:normal-case
                       focus:border-[#6366F1] focus:outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div>
            <label htmlFor="create-project-key" className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
              Key
            </label>
            <input
              id="create-project-key"
              type="text"
              placeholder="MAP"
              className="w-full px-3 py-2 bg-[#111111] border-2 border-[#2E2E35]
                       font-mono text-sm text-[#F9FAFB] uppercase placeholder:text-[#6B7280]
                       focus:border-[#6366F1] focus:outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
              value={key}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'key', value: e.target.value.toUpperCase() })}
              maxLength={5}
              disabled={isCreating}
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label htmlFor="create-project-description" className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
            Description (optional)
          </label>
          <textarea
            id="create-project-description"
            placeholder="What's this project about?"
            className="w-full px-3 py-2 bg-[#111111] border-2 border-[#2E2E35]
                     font-mono text-sm text-[#F9FAFB] placeholder:text-[#6B7280]
                     focus:border-[#6366F1] focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            value={description}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'description', value: e.target.value })}
            rows={3}
            disabled={isCreating}
          />
        </div>

        {/* WORKFLOW TYPE */}
        <div>
          <label htmlFor="create-project-workflow" className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
            Workflow Type
          </label>
          <select
            id="create-project-workflow"
            className="w-full px-3 py-2 bg-[#111111] border-2 border-[#2E2E35]
                     font-mono text-sm text-[#F9FAFB] uppercase
                     focus:border-[#6366F1] focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed"
            value={workflowType}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'workflowType', value: e.target.value as 'kanban' | 'scrum' | 'hybrid' })}
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