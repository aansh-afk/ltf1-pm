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
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Sprint Name */}
        <div>
          <label className="block font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
            SPRINT NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="SPRINT 1"
            className="w-full px-2.5 py-2 bg-[#0A0A0A] border-2 border-[#2E2E35] rounded-lg font-['IBM_Plex_Mono',monospace] text-xs text-[#F9FAFB] uppercase placeholder:text-[#6B7280] focus:border-[#6366F1] focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Sprint Goal */}
        <div>
          <label className="block font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
            SPRINT GOAL
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="DELIVER USER AUTHENTICATION AND DASHBOARD..."
            rows={3}
            className="w-full px-2.5 py-2 bg-[#0A0A0A] border-2 border-[#2E2E35] rounded-lg font-['IBM_Plex_Mono',monospace] text-xs text-[#F9FAFB] uppercase placeholder:text-[#6B7280] focus:border-[#6366F1] focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
              START DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0A0A0A] border-2 border-[#2E2E35] rounded-lg font-['IBM_Plex_Mono',monospace] text-xs text-[#F9FAFB] focus:border-[#6366F1] focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
              END DATE
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#0A0A0A] border-2 border-[#2E2E35] rounded-lg font-['IBM_Plex_Mono',monospace] text-xs text-[#F9FAFB] focus:border-[#6366F1] focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-3 border-t border-[#1F1F23]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-[#111111] border-2 border-[#2E2E35] rounded-lg text-[#9CA3AF] font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-wider hover:border-[#6366F1] hover:text-[#F9FAFB] transition-all disabled:opacity-50"
            disabled={isCreating}
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="px-3 py-2 bg-[#6366F1] text-white font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-wider font-bold border-2 border-[#4F46E5] rounded-lg hover:bg-[#4F46E5] transition-all disabled:opacity-50"
            disabled={isCreating}
          >
            {isCreating ? 'CREATING...' : 'CREATE SPRINT'}
          </button>
        </div>
      </form>
    </BrutalModal>
  )
}
