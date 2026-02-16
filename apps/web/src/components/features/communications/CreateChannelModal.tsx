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
          <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-1.5">
            Channel Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. general, design, backend"
            className="w-full bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] px-3 py-2 font-mono text-xs text-[var(--theme-foreground)] placeholder-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border-2 border-[var(--theme-border)] font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-foreground-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="px-3 py-1.5 border-2 border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[var(--theme-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </BrutalModal>
  )
}
