import { useReducer } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import posthog from 'posthog-js'
import BrutalModal from '@/components/ui/BrutalModal'

interface CreateSprintModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

type CreateSprintState = {
  name: string
  goal: string
  startDate: string
  endDate: string
  isCreating: boolean
}

const createSprintInitialState: CreateSprintState = {
  name: '',
  goal: '',
  startDate: '',
  endDate: '',
  isCreating: false,
}

type CreateSprintAction =
  | { type: 'UPDATE'; field: keyof CreateSprintState; value: CreateSprintState[keyof CreateSprintState] }
  | { type: 'RESET' }

function createSprintReducer(state: CreateSprintState, action: CreateSprintAction): CreateSprintState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return createSprintInitialState
    default:
      return state
  }
}

export default function CreateSprintModal({
  isOpen,
  onClose,
  projectId,
  onSuccess
}: CreateSprintModalProps) {
  const [state, dispatch] = useReducer(createSprintReducer, createSprintInitialState)
  const { name, goal, startDate, endDate, isCreating } = state

  const createSprint = useMutation(api.sprints.mutations.createSprint)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Sprint name is required')
      return
    }

    if (!startDate || !endDate) {
      toast.error('Start and end dates are required')
      return
    }

    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    if (end <= start) {
      toast.error('End date must be after start date')
      return
    }

    dispatch({ type: 'UPDATE', field: 'isCreating', value: true })

    try {
      await createSprint({
        projectId: projectId as any,
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate,
        endDate: endDate,
      })

      posthog.capture('sprint_created', {
        has_goal: !!goal.trim(),
        duration_days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      })
      toast.success('Sprint created successfully')
      onSuccess?.()
      onClose()

      // Reset form
      dispatch({ type: 'RESET' })
    } catch (error: any) {
      posthog.capture('sprint_creation_failed', { error: error.message })
      toast.error(error.message || 'Failed to create sprint')
    } finally {
      dispatch({ type: 'UPDATE', field: 'isCreating', value: false })
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="CREATE NEW SPRINT"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Sprint Name */}
        <div>
          <label htmlFor="create-sprint-name" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-1.5">
            SPRINT NAME
          </label>
          <input
            id="create-sprint-name"
            type="text"
            value={name}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'name', value: e.target.value })}
            placeholder="SPRINT 1"
            className="w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] uppercase placeholder:text-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Sprint Goal */}
        <div>
          <label htmlFor="create-sprint-goal" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-1.5">
            SPRINT GOAL
          </label>
          <textarea
            id="create-sprint-goal"
            value={goal}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'goal', value: e.target.value })}
            placeholder="DELIVER USER AUTHENTICATION AND DASHBOARD..."
            rows={3}
            className="w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] uppercase placeholder:text-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="create-sprint-start-date" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-1.5">
              START DATE
            </label>
            <input
              id="create-sprint-start-date"
              type="date"
              value={startDate}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'startDate', value: e.target.value })}
              className="w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="create-sprint-end-date" className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-1.5">
              END DATE
            </label>
            <input
              id="create-sprint-end-date"
              type="date"
              value={endDate}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'endDate', value: e.target.value })}
              className="w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-3 border-t border-[var(--theme-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] font-mono text-xs uppercase tracking-wider hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-all disabled:opacity-50"
            disabled={isCreating}
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="px-3 py-2 bg-[var(--theme-primary)] text-[var(--theme-foreground)] font-mono text-xs uppercase tracking-wider font-bold border-2 border-[var(--theme-primary-hover)] hover:bg-[var(--theme-primary-hover)] transition-all disabled:opacity-50"
            disabled={isCreating}
          >
            {isCreating ? 'CREATING...' : 'CREATE SPRINT'}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}
