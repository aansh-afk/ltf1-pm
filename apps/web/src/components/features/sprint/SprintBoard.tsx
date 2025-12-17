import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineFlag,
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDuplicate,
  HiSparkles
} from 'react-icons/hi'
import TaskCard from '../task/TaskCard'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { useAI } from '../../../hooks/useAI'
import BrutalModal from '../../ui/BrutalModal'

interface SprintBoardProps {
  sprint: any
  projectId?: string
  tasks?: any[]
  onTaskEdit?: (task: any) => void
  onTaskDelete?: (task: any) => void
  onTaskDuplicate?: (task: any) => void
}

const columns = [
  { id: 'todo', title: 'TODO', color: 'bg-neutral-600' },
  { id: 'in_progress', title: 'IN PROGRESS', color: 'bg-[var(--theme-info)]' },
  { id: 'in_review', title: 'IN REVIEW', color: 'bg-[var(--theme-accent)]' },
  { id: 'done', title: 'DONE', color: 'bg-[var(--theme-success)]' }
]

const priorityColors = {
  urgent: 'border-[var(--theme-error)]',
  high: 'border-[#FF8800]',
  medium: 'border-primary-brutalist',
  low: 'border-neutral-600'
}

const typeIcons = {
  task: '📋',
  feature: '✨',
  bug: '🐛',
  improvement: '💡',
  epic: '🎯'
}

export default function SprintBoard({ sprint, projectId, tasks, onTaskEdit, onTaskDelete, onTaskDuplicate }: SprintBoardProps) {
  const [tasksByStatus, setTasksByStatus] = useState(() => {
    const grouped: Record<string, any[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: []
    }

    const sprintTasks = tasks || sprint.tasks || []
    sprintTasks.forEach((task: any) => {
      if (task.status === 'backlog') {
        grouped.todo.push(task)
      } else if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })

    return grouped
  })

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const moveTask = useMutation(api.tasks.mutations.moveTask)
  const removeTaskFromSprint = useMutation(api.sprints.mutations.removeTaskFromSprint)
  const updateSprint = useMutation(api.sprints.mutations.updateSprint)
  const { analyzeSprint, loading: aiLoading } = useAI()

  const handleAnalyzeSprint = async () => {
    try {
      setIsAnalysisOpen(true)
      const result = await analyzeSprint(sprint._id)
      setAnalysisResult(result)
    } catch (error) {
      setIsAnalysisOpen(false)
      // Error handled in hook
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const sourceColumn = [...tasksByStatus[source.droppableId]]
    const destColumn = source.droppableId === destination.droppableId
      ? sourceColumn
      : [...tasksByStatus[destination.droppableId]]

    const [removed] = sourceColumn.splice(source.index, 1)
    destColumn.splice(destination.index, 0, removed)

    const newTasksByStatus = {
      ...tasksByStatus,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    }

    setTasksByStatus(newTasksByStatus)

    try {
      const newStatus = destination.droppableId === 'todo' ? 'backlog' : destination.droppableId
      await moveTask({
        taskId: draggableId as any,
        status: newStatus as any, // Cast to any or appropriate union type if strict
        position: destination.index
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to move task')
      setTasksByStatus(tasksByStatus)
    }
  }

  const handleRemoveFromSprint = async (taskId: any) => {
    try {
      await removeTaskFromSprint({ taskId })
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove task')
    }
  }

  const handleCompleteSprint = async () => {
    if (tasksByStatus.todo.length > 0 || tasksByStatus.in_progress.length > 0 || tasksByStatus.in_review.length > 0) {
      toast.error('Complete all tasks before closing the sprint')
      return
    }

    try {
      await updateSprint({
        sprintId: sprint._id,
        status: 'completed'
      })
      toast.success('Sprint completed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete sprint')
    }
  }

  return (
    <div className="space-y-24px">
      {/* Sprint Actions */}
      <div className="flex justify-end gap-16px">
        <button
          onClick={handleAnalyzeSprint}
          className="brutal-btn flex items-center gap-8px bg-white hover:bg-neutral-200 text-black"
        >
          <HiSparkles className="w-16px h-16px" />
          ANALYZE SPRINT
        </button>
        <button
          onClick={handleCompleteSprint}
          className="brutal-btn flex items-center gap-8px"
        >
          <HiOutlineCheck className="w-16px h-16px" />
          COMPLETE SPRINT
        </button>
      </div>

      {/* Analysis Modal */}
      <BrutalModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        title="SPRINT ANALYSIS"
        size="lg"
      >
        <div className="space-y-6">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary-brutalist border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-mono text-brutal-sm">ANALYZING SPRINT DATA...</p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-8 font-mono">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-[var(--theme-border)] p-4">
                  <div className="text-brutal-xs text-neutral-500 mb-1">HEALTH SCORE</div>
                  <div className="text-brutal-xl font-bold">{analysisResult.healthScore}/100</div>
                </div>
                <div className="border-2 border-[var(--theme-border)] p-4">
                  <div className="text-brutal-xs text-neutral-500 mb-1">VELOCITY</div>
                  <div className="text-brutal-xl font-bold">{analysisResult.velocity} pts</div>
                </div>
              </div>

              {/* Risks */}
              <div>
                <h3 className="text-brutal-sm font-bold mb-4 uppercase text-[var(--theme-error)]">Identified Risks</h3>
                <ul className="space-y-3">
                  {analysisResult.risks.map((risk: any, i: number) => (
                    <li key={i} className="bg-[var(--theme-error)]/10 border-l-4 border-[var(--theme-error)] p-3 text-sm">
                      <div className="font-bold">{risk.title || risk.severity}</div>
                      <div>{risk.description}</div>
                    </li>
                  ))}
                  {analysisResult.risks.length === 0 && <p className="text-neutral-500 italic">No significant risks detected.</p>}
                </ul>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-brutal-sm font-bold mb-4 uppercase text-primary-brutalist">Recommendations</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {analysisResult.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </BrutalModal>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-24px">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={clsx(
                "p-16px border-2 border-[var(--theme-border)] mb-16px",
                column.color
              )}>
                <h3 className="font-mono text-brutal-sm uppercase text-event-horizon">
                  {column.title}
                </h3>
                <p className="font-mono text-brutal-xs text-event-horizon/80">
                  {tasksByStatus[column.id].length} TASKS
                </p>
              </div>

              {/* Tasks */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      "flex-1 space-y-16px p-16px border-2 border-dashed transition-colors min-h-400px",
                      snapshot.isDraggingOver
                        ? "border-primary-brutalist bg-primary-brutalist/10"
                        : "border-[var(--theme-border)]"
                    )}
                  >
                    {tasksByStatus[column.id].map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={clsx(
                              "bg-[var(--theme-background)] border-2 p-16px transition-all",
                              priorityColors[task.priority],
                              snapshot.isDragging && "shadow-brutal-lg rotate-2"
                            )}
                          >
                            {/* Task Header */}
                            <div className="flex items-start justify-between mb-8px">
                              <div className="flex items-center gap-8px">
                                <span className="font-mono text-brutal-xs text-neutral-500">
                                  {task.key}
                                </span>
                                <span>{typeIcons[task.type]}</span>
                              </div>
                              <div className="flex items-center gap-4px">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onTaskEdit?.(task)
                                  }}
                                  className="p-4px hover:bg-[var(--theme-background-secondary)]/20 transition-colors"
                                  title="Edit"
                                >
                                  <HiOutlinePencil className="w-12px h-12px" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveFromSprint(task._id)
                                  }}
                                  className="p-4px hover:bg-[var(--theme-background-secondary)]/20 transition-colors"
                                  title="Remove from sprint"
                                >
                                  <HiOutlineX className="w-12px h-12px" />
                                </button>
                              </div>
                            </div>

                            {/* Task Title */}
                            <h4 className="font-mono text-brutal-sm mb-8px">
                              {task.title}
                            </h4>

                            {/* Task Meta */}
                            <div className="flex items-center gap-12px text-brutal-xs">
                              {task.assigneeName && (
                                <div className="flex items-center gap-4px text-neutral-500">
                                  <HiOutlineUser className="w-12px h-12px" />
                                  {task.assigneeName}
                                </div>
                              )}
                              {task.estimate?.points && (
                                <div className="flex items-center gap-4px text-neutral-500">
                                  <HiOutlineFlag className="w-12px h-12px" />
                                  {task.estimate.points} PTS
                                </div>
                              )}
                              {task.dueDate && (
                                <div className={clsx(
                                  "flex items-center gap-4px",
                                  new Date(task.dueDate) < new Date() ? "text-[var(--theme-error)]" : "text-neutral-500"
                                )}>
                                  <HiOutlineClock className="w-12px h-12px" />
                                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}