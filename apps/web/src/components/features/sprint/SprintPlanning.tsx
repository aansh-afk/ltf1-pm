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

const typeIcons: Record<string, string> = {
  task: '\uD83D\uDCCB',
  feature: '\u2728',
  bug: '\uD83D\uDC1B',
  improvement: '\uD83D\uDCA1',
  epic: '\uD83C\uDFAF'
}

const priorityIcons: Record<string, string> = {
  urgent: '\uD83D\uDD34',
  high: '\uD83D\uDFE0',
  medium: '\uD83D\uDFE1',
  low: '\uD83D\uDFE2'
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
    <div className="grid grid-cols-2 gap-3">
      {/* Backlog Column */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">BACKLOG</h2>
          <div className="flex items-center gap-2">
            {backlogTasks && backlogTasks.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-2 py-1 bg-[#111111] border-2 border-[#2E2E35] font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB]"
              >
                {selectedTasks.size === backlogTasks.length ? 'DESELECT ALL' : 'SELECT ALL'}
              </button>
            )}
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="px-2 py-1 bg-[#111111] border-2 border-[#2E2E35] font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB] flex items-center gap-1"
            >
              <HiOutlinePlus className="w-3 h-3" />
              NEW TASK
            </button>
          </div>
        </div>

        <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] p-2.5 space-y-2 max-h-[600px] overflow-y-auto">
          {!backlogTasks ? (
            <p className="text-xs text-[#6B7280] font-mono uppercase">Loading tasks...</p>
          ) : backlogTasks.length === 0 ? (
            <p className="text-xs text-[#6B7280] font-mono uppercase">No tasks in backlog</p>
          ) : (
            backlogTasks.map((task) => (
              <button
                type="button"
                key={task._id}
                className={clsx(
                  "w-full text-left p-2.5 border-2 cursor-pointer",
                  selectedTasks.has(task._id)
                    ? "border-[#6366F1] bg-[#6366F1]/10"
                    : "border-[#2E2E35] hover:border-[#6366F1]/50"
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
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] text-[#6B7280] uppercase">
                      {task.key}
                    </span>
                    <span className="text-xs">{typeIcons[task.type]}</span>
                    <span className="text-xs">{priorityIcons[task.priority]}</span>
                  </div>
                  {task.estimate?.points && (
                    <span className="font-mono text-[10px] text-[#9CA3AF]">
                      {task.estimate.points} PTS
                    </span>
                  )}
                </div>
                <h4 className="font-mono text-xs text-[#F9FAFB]">{task.title}</h4>
                {task.assigneeName && (
                  <p className="text-[10px] text-[#6B7280] font-mono mt-1">
                    {task.assigneeName}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {selectedTasks.size > 0 && (
          <div className="bg-[#6366F1] border-2 border-[#4F46E5] p-2.5">
            <p className="font-mono text-xs text-white mb-1 font-bold">
              {selectedTasks.size} TASKS SELECTED
            </p>
            <p className="font-mono text-[10px] text-white/80 uppercase">
              SELECT A SPRINT TO ADD THESE TASKS &rarr;
            </p>
          </div>
        )}
      </div>

      {/* Sprints Column */}
      <div className="space-y-2">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">SPRINTS</h2>

        <div className="space-y-2">
          {sprints.map((sprint) => {
            const isActive = sprint.status === 'active'
            const isCompleted = sprint.status === 'completed'

            return (
              <div
                key={sprint._id}
                className={clsx(
                  "border-2 p-4",
                  isActive ? "border-[#6366F1]/60 bg-[#6366F1]/5" :
                  isCompleted ? "border-[#22C55E]/40 bg-[#22C55E]/5" :
                  "border-[#2E2E35] bg-[#0A0A0A]"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-mono text-sm font-bold uppercase text-[#F9FAFB]">{sprint.name}</h3>
                      {isActive && (
                        <span className="px-1.5 py-0.5 bg-[#6366F1]/20 text-[#6366F1] font-mono text-[10px] uppercase tracking-wider font-bold border border-[#6366F1]/40">
                          ACTIVE
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-1.5 py-0.5 bg-[#22C55E]/20 text-[#22C55E] font-mono text-[10px] uppercase tracking-wider font-bold border border-[#22C55E]/40">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    {sprint.goal && (
                      <p className="text-xs text-[#6B7280] font-mono">{sprint.goal}</p>
                    )}
                  </div>

                  {!isActive && !isCompleted && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartSprint(sprint._id)}
                        className="p-1 border-2 border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white"
                      >
                        <HiOutlinePlay className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSprint(sprint._id)}
                        className="p-1 border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mb-2 text-[10px] font-mono text-[#6B7280]">
                  <div className="flex items-center gap-1">
                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                    <span>
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HiOutlineChartBar className="w-3.5 h-3.5" />
                    <span>
                      {sprint.taskStats.total} TASKS
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider">PROGRESS</span>
                    <span className="font-mono text-[10px] text-[#9CA3AF]">{sprint.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-[#2E2E35] border border-[#2E2E35]">
                    <div
                      className="h-full bg-[#6366F1]"
                      style={{ width: `${sprint.progress}%` }}
                    />
                  </div>
                </div>

                {/* Task Stats */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  <div className="text-center p-1.5 bg-[#111111]">
                    <p className="font-mono text-[10px] text-[#6B7280] uppercase">TODO</p>
                    <p className="font-mono text-xs font-bold text-[#F9FAFB]">{sprint.taskStats.todo}</p>
                  </div>
                  <div className="text-center p-1.5 bg-[#06B6D4]/10">
                    <p className="font-mono text-[10px] text-[#6B7280] uppercase">WIP</p>
                    <p className="font-mono text-xs font-bold text-[#F9FAFB]">{sprint.taskStats.inProgress}</p>
                  </div>
                  <div className="text-center p-1.5 bg-[#6366F1]/10">
                    <p className="font-mono text-[10px] text-[#6B7280] uppercase">REVIEW</p>
                    <p className="font-mono text-xs font-bold text-[#F9FAFB]">{sprint.taskStats.inReview}</p>
                  </div>
                  <div className="text-center p-1.5 bg-[#22C55E]/10">
                    <p className="font-mono text-[10px] text-[#6B7280] uppercase">DONE</p>
                    <p className="font-mono text-xs font-bold text-[#F9FAFB]">{sprint.taskStats.done}</p>
                  </div>
                </div>

                {/* Add Tasks Button */}
                {!isCompleted && selectedTasks.size > 0 && (
                  <button
                    onClick={() => handleAddToSprint(sprint._id)}
                    className="w-full px-3 py-2 bg-[#6366F1] text-white font-mono text-xs uppercase tracking-wider font-bold border-2 border-[#4F46E5] flex items-center justify-center gap-1.5 hover:bg-[#4F46E5]"
                  >
                    <HiOutlineArrowRight className="w-4 h-4" />
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
