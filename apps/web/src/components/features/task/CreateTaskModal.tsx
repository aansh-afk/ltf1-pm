import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../lib/convex'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  defaultStatus?: string
  onSuccess?: () => void
}

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  projectId, 
  defaultStatus = 'backlog',
  onSuccess 
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'feature' | 'bug' | 'improvement' | 'task' | 'epic'>('task')
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [labels, setLabels] = useState<string>('')
  const [estimateHours, setEstimateHours] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)

  const createTask = useMutation(api.tasks.mutations.createTask)
  const project = useQuery(api.projects.queries.getProject, { projectId })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    setIsCreating(true)
    
    try {
      await createTask({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        assigneeId: assigneeId || undefined,
        labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : undefined,
        estimate: estimateHours ? { hours: parseFloat(estimateHours) } : undefined,
      })
      
      toast.success('Task created successfully!')
      setTitle('')
      setDescription('')
      setType('task')
      setPriority('medium')
      setAssigneeId('')
      setLabels('')
      setEstimateHours('')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task')
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
            <div className="card bg-base-200 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="card-body">
                <h2 className="card-title text-2xl mb-4">Create New Task</h2>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Task title"
                    className="input input-bordered focus-ring"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    disabled={isCreating}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description (optional)</span>
                  </label>
                  <textarea
                    placeholder="Add a description..."
                    className="textarea textarea-bordered focus-ring"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    disabled={isCreating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Type</span>
                    </label>
                    <select
                      className="select select-bordered focus-ring"
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      disabled={isCreating}
                    >
                      <option value="task">📋 Task</option>
                      <option value="feature">✨ Feature</option>
                      <option value="bug">🐛 Bug</option>
                      <option value="improvement">💡 Improvement</option>
                      <option value="epic">🎯 Epic</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Priority</span>
                    </label>
                    <select
                      className="select select-bordered focus-ring"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      disabled={isCreating}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Assignee (optional)</span>
                    </label>
                    <select
                      className="select select-bordered focus-ring"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      disabled={isCreating}
                    >
                      <option value="">Unassigned</option>
                      {project?.members?.map((member: any) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Estimate (hours)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="input input-bordered focus-ring"
                      value={estimateHours}
                      onChange={(e) => setEstimateHours(e.target.value)}
                      min="0"
                      step="0.5"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Labels (comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="frontend, urgent, refactor"
                    className="input input-bordered focus-ring"
                    value={labels}
                    onChange={(e) => setLabels(e.target.value)}
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
                    {isCreating ? 'Creating...' : 'Create Task'}
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