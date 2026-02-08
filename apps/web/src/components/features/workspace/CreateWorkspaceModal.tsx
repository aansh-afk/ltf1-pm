import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'
import BrutalInput from '../../ui/BrutalInput'
import BrutalButton from '../../ui/BrutalButton'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createWorkspace = useMutation(api.workspaces.mutations.createWorkspace)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('WORKSPACE NAME REQUIRED', {
        style: {
          background: 'var(--theme-error)',
          color: '#000000',
          border: '2px solid #000000',
          borderRadius: '0',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      })
      return
    }

    setIsCreating(true)
    
    try {
      await createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      
      toast.success('WORKSPACE CREATED', {
        style: {
          background: 'var(--theme-success)',
          color: '#000000',
          border: '2px solid #000000',
          borderRadius: '0',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      })
      setName('')
      setDescription('')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(`ERROR: ${error.message || 'CREATION FAILED'}`.toUpperCase(), {
        style: {
          background: 'var(--theme-error)',
          color: '#000000',
          border: '2px solid #000000',
          borderRadius: '0',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="CREATE NEW WORKSPACE"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-[12px]">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-[4px] text-[var(--theme-foreground)]">
            WORKSPACE NAME *
          </label>
          <BrutalInput
            type="text"
            placeholder="ENTER WORKSPACE NAME"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={isCreating}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-[4px] text-[var(--theme-foreground)]">
            DESCRIPTION (OPTIONAL)
          </label>
          <textarea
            placeholder="DESCRIBE THIS WORKSPACE..."
            className="w-full bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)] border-2 border-[var(--theme-border)] 
                     focus:border-brutal-info focus:shadow-brutal px-[10px] py-[4px]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     placeholder:text-[var(--theme-foreground)]/50 font-mono text-sm uppercase"
            style={{ borderRadius: '0 !important' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={isCreating}
          />
        </div>

        <div className="border-t-2 border-[var(--theme-border)] pt-[12px] flex justify-end gap-[8px]">
          <BrutalButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isCreating}
          >
            CANCEL
          </BrutalButton>
          <BrutalButton
            type="submit"
            disabled={isCreating || !name.trim()}
            loading={isCreating}
          >
            {isCreating ? 'CREATING...' : 'CREATE WORKSPACE'}
          </BrutalButton>
        </div>
      </form>
    </BrutalModal>
  )
}