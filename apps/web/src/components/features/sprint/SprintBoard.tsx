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
  HiOutlineDuplicate
} from 'react-icons/hi'
import TaskCard from '../task/TaskCard'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface SprintBoardProps {
  sprint: any
  projectId?: string
  tasks?: any[]
  onTaskEdit?: (task: any) => void
  onTaskDelete?: (task: any) => void
  onTaskDuplicate?: (task: any) => void
}

const columns = [
  { id: 'todo', title: 'TODO', dotColor: 'bg-[#6B7280]' },
  { id: 'in_progress', title: 'IN PROGRESS', dotColor: 'bg-[#3B82F6]' },
  { id: 'in_review', title: 'IN REVIEW', dotColor: 'bg-[#8B5CF6]' },
  { id: 'done', title: 'DONE', dotColor: 'bg-[#22C55E]' }
]

const priorityColors: Record<string, string> = {
  urgent: 'border-l-[#EF4444]',
  high: 'border-l-[#F59E0B]',
  medium: 'border-l-[#2E2E35]',
  low: 'border-l-[#2E2E35]'
}

const typeIcons: Record<string, string> = {
  task: '\uD83D\uDCCB',
  feature: '\u2728',
  bug: '\uD83D\uDC1B',
  improvement: '\uD83D\uDCA1',
  epic: '\uD83C\uDFAF'
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

  const moveTask = useMutation(api.tasks.mutations.moveTask)
  const removeTaskFromSprint = useMutation(api.sprints.mutations.removeTaskFromSprint)
  const updateSprint = useMutation(api.sprints.mutations.updateSprint)

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
        status: newStatus as any,
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
    <div className="space-y-3">
      {/* Sprint Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleCompleteSprint}
          className="px-3 py-1.5 bg-[#111111] border-2 border-[#2E2E35] text-xs font-mono text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5 hover:border-[#22C55E] hover:text-[#22C55E]"
        >
          <HiOutlineCheck className="w-3.5 h-3.5" />
          Complete Sprint
        </button>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-3">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className="bg-[#111111] border-2 border-[#2E2E35] p-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={clsx("w-2 h-2 shrink-0", column.dotColor)} />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#F9FAFB]">
                    {column.title}
                  </h3>
                </div>
                <p className="font-mono text-[10px] text-[#6B7280] mt-1 ml-4">
                  {tasksByStatus[column.id].length} tasks
                </p>
              </div>

              {/* Tasks */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      "flex-1 space-y-2 p-2 border-2 border-dashed min-h-[300px]",
                      snapshot.isDraggingOver
                        ? "border-[#6366F1] bg-[#6366F1]/5"
                        : "border-[#2E2E35]/50"
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
                              "bg-[#0A0A0A] border-2 border-[#2E2E35] border-l-[3px] p-3",
                              priorityColors[task.priority] || 'border-l-[#2E2E35]',
                              snapshot.isDragging && "shadow-[4px_4px_0px_#000000]"
                            )}
                          >
                            {/* Task Header */}
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-[#6B7280]">
                                  {task.key}
                                </span>
                                <span className="text-xs">{typeIcons[task.type]}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onTaskEdit?.(task)
                                  }}
                                  className="p-1 hover:bg-[#111111] text-[#6B7280] hover:text-[#F9FAFB]"
                                  title="Edit"
                                >
                                  <HiOutlinePencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveFromSprint(task._id)
                                  }}
                                  className="p-1 hover:bg-[#111111] text-[#6B7280] hover:text-[#EF4444]"
                                  title="Remove from sprint"
                                >
                                  <HiOutlineX className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Task Title */}
                            <h4 className="text-xs font-semibold text-[#F9FAFB] mb-1.5">
                              {task.title}
                            </h4>

                            {/* Task Meta */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {task.assigneeName && (
                                <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-mono">
                                  <HiOutlineUser className="w-3 h-3" />
                                  {task.assigneeName}
                                </div>
                              )}
                              {task.estimate?.points && (
                                <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-mono">
                                  <HiOutlineFlag className="w-3 h-3" />
                                  {task.estimate.points} pts
                                </div>
                              )}
                              {task.dueDate && (
                                <div className={clsx(
                                  "flex items-center gap-1 text-[10px] font-mono",
                                  new Date(task.dueDate) < new Date() ? "text-[#EF4444]" : "text-[#6B7280]"
                                )}>
                                  <HiOutlineClock className="w-3 h-3" />
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
