import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ltf1/backend'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
            <div className="card bg-base-200 w-full max-w-lg shadow-xl">
              <form onSubmit={handleSubmit} className="card-body">
                <h2 className="card-title text-2xl mb-4">Create New Project</h2>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="form-control col-span-2">
                    <label className="label">
                      <span className="label-text">Project Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="My Awesome Project"
                      className="input input-bordered focus-ring"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      autoFocus
                      disabled={isCreating}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Key</span>
                    </label>
                    <input
                      type="text"
                      placeholder="MAP"
                      className="input input-bordered focus-ring uppercase"
                      value={key}
                      onChange={(e) => setKey(e.target.value.toUpperCase())}
                      maxLength={5}
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description (optional)</span>
                  </label>
                  <textarea
                    placeholder="What's this project about?"
                    className="textarea textarea-bordered focus-ring"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isCreating}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Workflow Type</span>
                  </label>
                  <select
                    className="select select-bordered focus-ring"
                    value={workflowType}
                    onChange={(e) => setWorkflowType(e.target.value as any)}
                    disabled={isCreating}
                  >
                    <option value="kanban">Kanban (Continuous flow)</option>
                    <option value="scrum">Scrum (Sprint-based)</option>
                    <option value="hybrid">Hybrid (Mix of both)</option>
                  </select>
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
                    {isCreating ? 'Creating...' : 'Create Project'}
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