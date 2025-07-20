import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@ltf1/backend'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
      toast.error('Workspace name is required')
      return
    }

    setIsCreating(true)
    
    try {
      await createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      
      toast.success('Workspace created successfully!')
      setName('')
      setDescription('')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="card bg-base-200 w-full max-w-md shadow-xl">
              <form onSubmit={handleSubmit} className="card-body">
                <h2 className="card-title text-2xl mb-4">Create New Workspace</h2>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Workspace Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="My Awesome Team"
                    className="input input-bordered focus-ring"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    disabled={isCreating}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description (optional)</span>
                  </label>
                  <textarea
                    placeholder="What's this workspace for?"
                    className="textarea textarea-bordered focus-ring"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isCreating}
                  />
                </div>

                <div className="card-actions justify-end mt-6">
                  <button 
                    type="button" 
                    className="btn btn-ghost"
                    onClick={onClose}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`btn btn-primary ${isCreating ? 'loading' : ''}`}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Workspace'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}