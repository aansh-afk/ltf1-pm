import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  HiOutlinePlay,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlinePlus,
  HiOutlineArrowRight
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import CreateTaskModal from '../task/CreateTaskModal'

interface SprintPlanningProps {
  projectId: string
  sprints: any[]
  currentSprint: any
}

const typeIcons = {
  task: '📋',
  feature: '✨',
  bug: '🐛',
  improvement: '💡',
  epic: '🎯'
}

const priorityIcons = {
  urgent: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢'
}

export default function SprintPlanning({ projectId, sprints, currentSprint }: SprintPlanningProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)

  const backlogTasks = useQuery(
    api.sprints.queries.getBacklogTasks,
    { projectId: projectId as any }
  )

  const updateSprint = useMutation(api.sprints.mutations.updateSprint)
  const deleteSprint = useMutation(api.sprints.mutations.deleteSprint)
  const addTasksToSprint = useMutation(api.sprints.mutations.addTasksToSprint)

  const handleStartSprint = async (sprintId: any) => {
    try {
      await updateSprint({ sprintId, status: 'active' })
      toast.success('Sprint started successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to start sprint')
    }
  }

  const handleDeleteSprint = async (sprintId: any) => {
    if (!confirm('Are you sure you want to delete this sprint?')) return

    try {
      await deleteSprint({ sprintId })
      toast.success('Sprint deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sprint')
    }
  }

  const handleAddToSprint = async (sprintId: any) => {
    if (selectedTasks.size === 0) {
      toast.error('Select tasks to add to sprint')
      return
    }

    try {
      const taskIds = Array.from(selectedTasks) as any[]
      await addTasksToSprint({ sprintId, taskIds })
      toast.success(`Added ${taskIds.length} tasks to sprint`)
      setSelectedTasks(new Set())
    } catch (error: any) {
      toast.error(error.message || 'Failed to add tasks')
    }
  }

  const handleSelectAll = () => {
    if (!backlogTasks) return
    
    if (selectedTasks.size === backlogTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(backlogTasks.map(t => t._id)))
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="grid grid-cols-2 gap-24px">
      {/* Backlog Column */}
      <div className="space-y-16px">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-brutal-lg uppercase">BACKLOG</h2>
          <div className="flex items-center gap-16px">
            {backlogTasks && backlogTasks.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="brutal-btn-sm"
              >
                {selectedTasks.size === backlogTasks.length ? 'DESELECT ALL' : 'SELECT ALL'}
              </button>
            )}
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="brutal-btn-sm flex items-center gap-8px"
            >
              <HiOutlinePlus className="w-12px h-12px" />
              NEW TASK
            </button>
          </div>
        </div>

        <div className="bg-carbon-plate border-2 border-basalt-border p-16px space-y-16px max-h-600px overflow-y-auto">
          {!backlogTasks ? (
            <p className="text-brutal-sm text-neutral-500">Loading tasks...</p>
          ) : backlogTasks.length === 0 ? (
            <p className="text-brutal-sm text-neutral-500">No tasks in backlog</p>
          ) : (
            backlogTasks.map((task) => (
              <div
                key={task._id}
                className={clsx(
                  "p-16px border-2 cursor-pointer transition-all",
                  selectedTasks.has(task._id)
                    ? "border-primary-brutalist bg-primary-brutalist/10"
                    : "border-basalt-border hover:border-primary-brutalist/50"
                )}
                onClick={() => {
                  const newSelected = new Set(selectedTasks)
                  if (newSelected.has(task._id)) {
                    newSelected.delete(task._id)
                  } else {
                    newSelected.add(task._id)
                  }
                  setSelectedTasks(newSelected)
                }}
              >
                <div className="flex items-center justify-between mb-8px">
                  <div className="flex items-center gap-8px">
                    <span className="font-mono text-brutal-xs text-neutral-500">
                      {task.key}
                    </span>
                    <span>{typeIcons[task.type]}</span>
                    <span>{priorityIcons[task.priority]}</span>
                  </div>
                  {task.estimate?.points && (
                    <span className="font-mono text-brutal-xs">
                      {task.estimate.points} PTS
                    </span>
                  )}
                </div>
                <h4 className="font-mono text-brutal-sm">{task.title}</h4>
                {task.assigneeName && (
                  <p className="text-brutal-xs text-neutral-500 mt-4px">
                    {task.assigneeName}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {selectedTasks.size > 0 && (
          <div className="bg-primary-brutalist border-2 border-basalt-border p-16px">
            <p className="font-mono text-brutal-sm text-event-horizon mb-8px">
              {selectedTasks.size} TASKS SELECTED
            </p>
            <p className="font-mono text-brutal-xs text-event-horizon">
              SELECT A SPRINT TO ADD THESE TASKS →
            </p>
          </div>
        )}
      </div>

      {/* Sprints Column */}
      <div className="space-y-16px">
        <h2 className="font-mono text-brutal-lg uppercase">SPRINTS</h2>

        <div className="space-y-16px">
          {sprints.map((sprint) => {
            const isActive = sprint.status === 'active'
            const isCompleted = sprint.status === 'completed'
            
            return (
              <div
                key={sprint._id}
                className={clsx(
                  "border-2 p-24px",
                  isActive ? "border-primary-brutalist bg-primary-brutalist/10" :
                  isCompleted ? "border-[#00FF00] bg-[#00FF00]/10" :
                  "border-basalt-border bg-carbon-plate"
                )}
              >
                <div className="flex items-start justify-between mb-16px">
                  <div>
                    <div className="flex items-center gap-8px mb-4px">
                      <h3 className="font-mono text-brutal-md uppercase">{sprint.name}</h3>
                      {isActive && (
                        <span className="px-8px py-4px bg-primary-brutalist text-event-horizon font-mono text-brutal-xs uppercase">
                          ACTIVE
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-8px py-4px bg-[#00FF00] text-event-horizon font-mono text-brutal-xs uppercase">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    {sprint.goal && (
                      <p className="text-brutal-sm text-neutral-500">{sprint.goal}</p>
                    )}
                  </div>
                  
                  {!isActive && !isCompleted && (
                    <div className="flex gap-8px">
                      <button
                        onClick={() => handleStartSprint(sprint._id)}
                        className="p-8px border-2 border-primary-brutalist text-primary-brutalist hover:bg-primary-brutalist hover:text-event-horizon transition-colors"
                      >
                        <HiOutlinePlay className="w-16px h-16px" />
                      </button>
                      <button
                        onClick={() => handleDeleteSprint(sprint._id)}
                        className="p-8px border-2 border-[#FF0000] text-[#FF0000] hover:bg-[#FF0000] hover:text-cathode-white transition-colors"
                      >
                        <HiOutlineTrash className="w-16px h-16px" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-24px mb-16px">
                  <div className="flex items-center gap-8px">
                    <HiOutlineCalendar className="w-16px h-16px text-neutral-500" />
                    <span className="font-mono text-brutal-xs">
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-8px">
                    <HiOutlineChartBar className="w-16px h-16px text-neutral-500" />
                    <span className="font-mono text-brutal-xs">
                      {sprint.taskStats.total} TASKS
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-16px">
                  <div className="flex justify-between mb-4px">
                    <span className="font-mono text-brutal-xs">PROGRESS</span>
                    <span className="font-mono text-brutal-xs">{sprint.progress}%</span>
                  </div>
                  <div className="h-16px bg-event-horizon/20 border-2 border-basalt-border">
                    <div 
                      className="h-full bg-primary-brutalist transition-all duration-300"
                      style={{ width: `${sprint.progress}%` }}
                    />
                  </div>
                </div>

                {/* Task Stats */}
                <div className="grid grid-cols-4 gap-8px mb-16px">
                  <div className="text-center p-8px bg-event-horizon/10">
                    <p className="font-mono text-brutal-xs text-neutral-500">TODO</p>
                    <p className="font-mono text-brutal-sm">{sprint.taskStats.todo}</p>
                  </div>
                  <div className="text-center p-8px bg-[#00FFFF]/10">
                    <p className="font-mono text-brutal-xs text-neutral-500">IN PROGRESS</p>
                    <p className="font-mono text-brutal-sm">{sprint.taskStats.inProgress}</p>
                  </div>
                  <div className="text-center p-8px bg-[#FF00FF]/10">
                    <p className="font-mono text-brutal-xs text-neutral-500">IN REVIEW</p>
                    <p className="font-mono text-brutal-sm">{sprint.taskStats.inReview}</p>
                  </div>
                  <div className="text-center p-8px bg-[#00FF00]/10">
                    <p className="font-mono text-brutal-xs text-neutral-500">DONE</p>
                    <p className="font-mono text-brutal-sm">{sprint.taskStats.done}</p>
                  </div>
                </div>

                {/* Add Tasks Button */}
                {!isCompleted && selectedTasks.size > 0 && (
                  <button
                    onClick={() => handleAddToSprint(sprint._id)}
                    className="w-full brutal-btn flex items-center justify-center gap-8px"
                  >
                    <HiOutlineArrowRight className="w-16px h-16px" />
                    ADD {selectedTasks.size} TASKS TO SPRINT
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        projectId={projectId}
      />
    </div>
  )
}