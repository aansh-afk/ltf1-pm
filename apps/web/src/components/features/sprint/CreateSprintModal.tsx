import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import { HiOutlineCalendar } from 'react-icons/hi'

interface CreateSprintModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export default function CreateSprintModal({ isOpen, onClose, projectId }: CreateSprintModalProps) {
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

    const start = new Date(startDate)
    const end = new Date(endDate)

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
        startDate,
        endDate,
      })

      toast.success('Sprint created successfully!')
      setName('')
      setGoal('')
      setStartDate('')
      setEndDate('')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create sprint')
    } finally {
      setIsCreating(false)
    }
  }

  // Set default dates (2 week sprint starting tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const twoWeeksLater = new Date(tomorrow)
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 13)

  if (!startDate && isOpen) {
    setStartDate(tomorrow.toISOString().split('T')[0])
    setEndDate(twoWeeksLater.toISOString().split('T')[0])
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="CREATE NEW SPRINT"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-24px">
        {/* Sprint Name */}
        <div>
          <label className="block text-brutal-sm mb-8px">
            SPRINT NAME
          </label>
          <input
            type="text"
            placeholder="SPRINT 1"
            className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                     font-mono text-brutal-md uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={isCreating}
          />
        </div>

        {/* Sprint Goal */}
        <div>
          <label className="block text-brutal-sm mb-8px">
            SPRINT GOAL (OPTIONAL)
          </label>
          <textarea
            placeholder="COMPLETE USER AUTHENTICATION AND PROFILE FEATURES..."
            className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                     font-mono text-brutal-md placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors resize-none"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            disabled={isCreating}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-16px">
          <div>
            <label className="block text-brutal-sm mb-8px">
              START DATE
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                         font-mono text-brutal-md
                         focus:border-primary-brutalist focus:outline-none transition-colors"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isCreating}
              />
              <HiOutlineCalendar className="absolute right-16px top-1/2 -translate-y-1/2 w-16px h-16px text-neutral-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-brutal-sm mb-8px">
              END DATE
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-16px py-12px bg-carbon-plate border-2 border-basalt-border 
                         font-mono text-brutal-md
                         focus:border-primary-brutalist focus:outline-none transition-colors"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isCreating}
              />
              <HiOutlineCalendar className="absolute right-16px top-1/2 -translate-y-1/2 w-16px h-16px text-neutral-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Sprint Duration Info */}
        {startDate && endDate && (
          <div className="p-16px bg-event-horizon/10 border-2 border-basalt-border">
            <p className="font-mono text-brutal-sm">
              SPRINT DURATION: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} DAYS
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-16px pt-24px border-t-2 border-basalt-border">
          <button 
            type="button" 
            className="brutal-btn-secondary"
            onClick={onClose}
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