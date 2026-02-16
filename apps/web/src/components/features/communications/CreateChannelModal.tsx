import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalModal from '@/components/ui/BrutalModal'

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
}

export default function CreateChannelModal({ isOpen, onClose, workspaceId }: CreateChannelModalProps) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const createChannel = useMutation(api.communications.mutations.createInternalChannel)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed || creating) return

    setCreating(true)
    try {
      await createChannel({
        workspaceId: workspaceId as Id<'workspaces'>,
        name: trimmed,
      })
      setName('')
      onClose()
    } catch (err) {
      console.error('Failed to create channel:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <BrutalModal isOpen={isOpen} onClose={onClose} title="Create Channel" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
            Channel Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. general, design, backend"
            className="w-full bg-[#111111] border-2 border-[#2E2E35] px-3 py-2 font-mono text-xs text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none transition-colors"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border-2 border-[#2E2E35] font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF] hover:border-[#6B7280] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="px-3 py-1.5 border-2 border-[#6366F1] bg-[#6366F1] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </BrutalModal>
  )
}
