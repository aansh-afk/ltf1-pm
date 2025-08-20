import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'

interface CreateSprintModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

export default function CreateSprintModal({ 
  isOpen, 
  onClose, 
  projectId,
  onSuccess 
}: CreateSprintModalProps) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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

    setIsCreating(true)
    
    try {
      await createSprint({
        projectId: projectId as any,
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate,
        endDate: endDate,
      })
      
      toast.success('Sprint created successfully')
      onSuccess?.()
      onClose()
      
      // Reset form
      setName('')
      setGoal('')
      setStartDate('')
      setEndDate('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create sprint')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="CREATE NEW SPRINT"
    >
      <form onSubmit={handleSubmit} className="space-y-24px">
        {/* Sprint Name */}
        <div>
          <label className="block text-brutal-sm uppercase mb-8px">
            SPRINT NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="SPRINT 1"
            className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] 
                     font-mono text-brutal-sm uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Sprint Goal */}
        <div>
          <label className="block text-brutal-sm uppercase mb-8px">
            SPRINT GOAL
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="DELIVER USER AUTHENTICATION AND DASHBOARD..."
            rows={3}
            className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] 
                     font-mono text-brutal-sm uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-16px">
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">
              START DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-sm
                       focus:border-primary-brutalist focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-brutal-sm uppercase mb-8px">
              END DATE
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-sm
                       focus:border-primary-brutalist focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-16px justify-end pt-24px border-t-2 border-[var(--theme-border)]">
          <button
            type="button"
            onClick={onClose}
            className="brutal-btn-secondary"
            disabled={isCreating}
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="brutal-btn"
            disabled={isCreating}
          >
            {isCreating ? 'CREATING...' : 'CREATE SPRINT'}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}