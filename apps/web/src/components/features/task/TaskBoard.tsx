import React, { useState, useReducer, useRef, useEffect, memo, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { m, AnimatePresence } from 'framer-motion'
import { HiOutlinePlus } from 'react-icons/hi'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'
import TaskDetailModal from './TaskDetailModal'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'

interface BoardTask {
  _id: string
  title: string
  status: string
  priority: string
  position: number
  [key: string]: unknown
}

interface TaskBoardProps {
  tasks: BoardTask[]
  projectId: string
  onTaskUpdate?: () => void
  onTaskEdit?: (task: BoardTask) => void
  onTaskDelete?: (task: BoardTask) => void
  onTaskDuplicate?: (task: BoardTask) => void
  isCompact?: boolean
  onCompactToggle?: (isCompact: boolean) => void
}

const columns = [
  { id: 'backlog', title: 'BACKLOG', borderColor: 'border-[var(--theme-border)]', bgColor: 'bg-basalt-border', textColor: 'text-[var(--theme-foreground)]/60' },
  { id: 'todo', title: 'TO DO', borderColor: 'border-brutal-info', bgColor: 'bg-brutal-info', textColor: 'text-brutal-info' },
  { id: 'in_progress', title: 'IN PROGRESS', borderColor: 'border-brutal-warning', bgColor: 'bg-brutal-warning', textColor: 'text-brutal-warning' },
  { id: 'in_review', title: 'IN REVIEW', borderColor: 'border-brutal-error', bgColor: 'bg-brutal-error', textColor: 'text-brutal-error' },
  { id: 'done', title: 'DONE', borderColor: 'border-brutal-success', bgColor: 'bg-brutal-success', textColor: 'text-brutal-success' },
]

interface DragState {
  draggedTask: BoardTask | null
  hoveredColumn: string | null
  dropPosition: { column: string; index: number } | null
  draggedOverTask: string | null
}

type DragAction =
  | { type: 'DRAG_START'; task: BoardTask }
  | { type: 'SET_HOVERED_COLUMN'; column: string | null }
  | { type: 'SET_DROP_POSITION'; position: { column: string; index: number } | null }
  | { type: 'SET_DRAGGED_OVER_TASK'; taskId: string | null }
  | { type: 'DRAG_END' }

const dragInitialState: DragState = {
  draggedTask: null,
  hoveredColumn: null,
  dropPosition: null,
  draggedOverTask: null,
}

function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case 'DRAG_START':
      return { ...state, draggedTask: action.task }
    case 'SET_HOVERED_COLUMN':
      return { ...state, hoveredColumn: action.column }
    case 'SET_DROP_POSITION':
      return { ...state, dropPosition: action.position }
    case 'SET_DRAGGED_OVER_TASK':
      return { ...state, draggedOverTask: action.taskId }
    case 'DRAG_END':
      return dragInitialState
    default:
      return state
  }
}

const TaskBoard = memo(function TaskBoard({ tasks, projectId, onTaskUpdate, onTaskEdit, onTaskDelete, onTaskDuplicate, isCompact = false, onCompactToggle }: TaskBoardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createStatus, setCreateStatus] = useState<string>('backlog')
  const [drag, dispatchDrag] = useReducer(dragReducer, dragInitialState)
  const columnRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [hasOverflow, setHasOverflow] = useState<{ [key: string]: boolean }>({})
  const [isCompactView, setIsCompactView] = useState(isCompact)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const moveTask = useMutation(api.tasks.mutations.moveTask)

  // Handle compact toggle
  const handleCompactToggle = useCallback(() => {
    const newValue = !isCompactView
    setIsCompactView(newValue)
    onCompactToggle?.(newValue)
  }, [isCompactView, onCompactToggle])

  const handleDragStart = useCallback((e: React.DragEvent, task: BoardTask) => {
    dispatchDrag({ type: 'DRAG_START', task })
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDragOverTask = (e: React.DragEvent, taskId: string, columnId: string, index: number) => {
    e.preventDefault()
    if (!drag.draggedTask || drag.draggedTask._id === taskId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const insertIndex = e.clientY < midpoint ? index : index + 1

    // Only update if position actually changed to reduce re-renders
    if (!drag.dropPosition || drag.dropPosition.column !== columnId || drag.dropPosition.index !== insertIndex) {
      dispatchDrag({ type: 'SET_DROP_POSITION', position: { column: columnId, index: insertIndex } })
    }
    if (drag.draggedOverTask !== taskId) {
      dispatchDrag({ type: 'SET_DRAGGED_OVER_TASK', taskId })
    }
  }

  const handleDragLeaveTask = useCallback(() => {
    // Small delay to prevent flicker when moving between tasks
    setTimeout(() => {
      dispatchDrag({ type: 'SET_DRAGGED_OVER_TASK', taskId: null })
    }, 50)
  }, [])

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()

    if (!drag.draggedTask) {
      dispatchDrag({ type: 'DRAG_END' })
      return
    }

    const targetPosition = drag.dropPosition?.column === newStatus && drag.dropPosition?.index !== undefined
      ? drag.dropPosition.index
      : tasks.filter(t => t.status === newStatus).length

    try {
      await moveTask({
        taskId: drag.draggedTask._id as Id<"tasks">,
        status: newStatus as "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled",
        position: targetPosition,
      })

      onTaskUpdate?.()
    } catch (error) {
      toast.error('Failed to move task')
    }

    dispatchDrag({ type: 'DRAG_END' })
  }

  const handleDragEnd = useCallback(() => {
    dispatchDrag({ type: 'DRAG_END' })
  }, [])

  const getTasksByStatus = useCallback((status: string) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.position - b.position)
  }, [tasks])

  const openCreateModal = useCallback((status: string) => {
    setCreateStatus(status)
    setShowCreateModal(true)
  }, [])

  // Check for column overflow
  useEffect(() => {
    const checkOverflow = () => {
      const newOverflowState: { [key: string]: boolean } = {}
      columns.forEach(column => {
        const element = columnRefs.current[column.id]
        if (element) {
          newOverflowState[column.id] = element.scrollHeight > element.clientHeight
        }
      })
      setHasOverflow(newOverflowState)
    }

    // Check initially and on window resize
    checkOverflow()
    window.addEventListener('resize', checkOverflow)

    // Check whenever tasks change
    const timer = setTimeout(checkOverflow, 100)

    return () => {
      window.removeEventListener('resize', checkOverflow)
      clearTimeout(timer)
    }
  }, [tasks])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-[8px]">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id)
          const taskCount = columnTasks.length

          return (
            <BrutalCard
              key={column.id}
              variant="default"
              padding="none"
              className={clsx(
                "flex flex-col relative h-full",
                drag.hoveredColumn === column.id && drag.draggedTask && "border-primary-brutalist bg-primary-brutalist/5",
                drag.draggedTask && !drag.hoveredColumn && "border-opacity-50"
              )}
              onDragOver={(e) => {
                handleDragOver(e)
                dispatchDrag({ type: 'SET_HOVERED_COLUMN', column: column.id })
              }}
              onDragLeave={() => dispatchDrag({ type: 'SET_HOVERED_COLUMN', column: null })}
              onDrop={(e) => {
                handleDrop(e, column.id)
                dispatchDrag({ type: 'SET_HOVERED_COLUMN', column: null })
              }}
            >
              {/* Column Header */}
              <div className={clsx(
                "p-[8px] border-b-2",
                "flex items-center justify-between",
                "bg-[var(--theme-background-secondary)]",
                column.borderColor
              )}>
                <h3 className={clsx(
                  "font-mono text-brutal-sm font-bold uppercase",
                  column.textColor
                )}>{column.title}</h3>
                <div className="flex items-center gap-[4px]">
                  <span className={clsx(
                    "px-[4px] py-2px text-brutal-xs font-mono font-bold",
                    "border-2",
                    taskCount === 0
                      ? "border-[var(--theme-border)] text-[var(--theme-foreground)]/40"
                      : taskCount > 10
                        ? "border-brutal-warning text-brutal-warning bg-brutal-warning/10"
                        : "border-primary-brutalist text-primary-brutalist bg-primary-brutalist/10"
                  )}>
                    {taskCount}
                  </span>
                </div>
              </div>

              {/* Color indicator bar */}
              <div className={clsx("h-4px", column.bgColor)} />

              {/* Task List Container */}
              <div
                ref={(el) => columnRefs.current[column.id] = el}
                className={clsx(
                  "flex-1 overflow-y-auto custom-scrollbar",
                  "p-[8px] space-y-[4px]",
                  "relative"
                )}
                style={{
                  // Fixed height to show exactly 3 task cards in normal view, more in compact
                  // Normal: Task card height ~128px + gap 8px = ~136px per task
                  // Compact: Task card height ~56px + gap 8px = ~64px per task
                  // Normal: 3 tasks = 408px + padding 24px = 432px
                  // Compact: 6 tasks = 384px + padding 24px = 408px
                  height: isCompactView ? '408px' : '432px',
                  scrollbarGutter: 'stable'
                }}
              >
                <AnimatePresence>
                  {columnTasks.map((task, index) => {
                    // Show drop indicator before this task
                    const showDropIndicatorBefore = drag.dropPosition?.column === column.id && drag.dropPosition?.index === index

                    return (
                      <React.Fragment key={task._id}>
                        {/* Drop Position Indicator */}
                        {showDropIndicatorBefore && drag.draggedTask && (
                          <div
                            className="relative mb-[4px] transition-all duration-150"
                            style={{ height: isCompactView ? 64 : 136 }}
                          >
                            <div className="absolute inset-0 border-2 border-dashed border-primary-brutalist bg-primary-brutalist/10 flex items-center justify-center animate-pulse">
                              <span className="text-brutal-xs font-mono uppercase text-primary-brutalist">
                                DROP HERE
                              </span>
                            </div>
                          </div>
                        )}

                        <m.div
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: drag.draggedTask?._id === task._id ? 0.5 : 1
                          }}
                          exit={{ opacity: 0 }}
                          whileHover={{
                            scale: 1.02,
                            transition: { duration: 0.1 }
                          }}
                          whileDrag={{
                            scale: 1.05,
                            cursor: "grabbing"
                          }}
                          transition={{
                            duration: 0.2
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragOver={(e) => handleDragOverTask(e, task._id, column.id, index)}
                          onDragLeave={handleDragLeaveTask}
                          className="cursor-move"
                        >
                          <TaskCard
                            task={task}
                            onEdit={() => onTaskEdit?.(task)}
                            onDelete={() => onTaskDelete?.(task)}
                            onDuplicate={() => onTaskDuplicate?.(task)}
                            onViewDetails={() => {
                              setSelectedTaskId(task._id)
                              setShowTaskDetail(true)
                            }}
                            isCompact={isCompactView}
                          />
                        </m.div>
                      </React.Fragment>
                    )
                  })}

                  {/* Drop indicator at the end of the column */}
                  {drag.dropPosition?.column === column.id && drag.dropPosition?.index === columnTasks.length && drag.draggedTask && (
                    <div
                      className="relative transition-all duration-150"
                      style={{ height: isCompactView ? 64 : 136 }}
                    >
                      <div className="absolute inset-0 border-2 border-dashed border-primary-brutalist bg-primary-brutalist/10 flex items-center justify-center animate-pulse">
                        <span className="text-brutal-xs font-mono uppercase text-primary-brutalist">
                          DROP HERE
                        </span>
                      </div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Add Task Button */}
                <div className={clsx(isCompactView ? "p-[4px]" : "p-[10px]")}>
                  <BrutalButton
                    onClick={() => openCreateModal(column.id)}
                    variant="outline"
                    className="w-full border-dashed flex items-center justify-center gap-[4px]"
                    size={isCompactView ? "sm" : "md"}
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                    {!isCompactView && <span>ADD TASK</span>}
                  </BrutalButton>
                </div>
              </div>

              {/* Scroll Indicator */}
              {hasOverflow[column.id] && (
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-carbon-plate to-transparent pointer-events-none flex items-end justify-center pb-4px">
                  <div className="w-4 h-2px bg-primary-brutalist/40 animate-pulse" />
                </div>
              )}
            </BrutalCard>
          )
        })}
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        defaultStatus={createStatus}
        onSuccess={onTaskUpdate}
      />

      {selectedTaskId && (
        <TaskDetailModal
          isOpen={showTaskDetail}
          onClose={() => {
            setShowTaskDetail(false)
            setSelectedTaskId(null)
          }}
          taskId={selectedTaskId}
        />
      )}
    </>
  )
})

export default TaskBoard