import React, { useState, useRef, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlinePlus } from 'react-icons/hi'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'
import TaskDetailModal from './TaskDetailModal'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { BrutalCard, BrutalButton } from '../../ui'

interface TaskBoardProps {
  tasks: any[]
  projectId: string
  onTaskUpdate?: () => void
  onTaskEdit?: (task: any) => void
  onTaskDelete?: (task: any) => void
  onTaskDuplicate?: (task: any) => void
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

export default function TaskBoard({ tasks, projectId, onTaskUpdate, onTaskEdit, onTaskDelete, onTaskDuplicate, isCompact = false, onCompactToggle }: TaskBoardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createStatus, setCreateStatus] = useState<string>('backlog')
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<{ column: string; index: number } | null>(null)
  const [draggedOverTask, setDraggedOverTask] = useState<string | null>(null)
  const columnRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [hasOverflow, setHasOverflow] = useState<{ [key: string]: boolean }>({})
  const [isCompactView, setIsCompactView] = useState(isCompact)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const moveTask = useMutation(api.tasks.mutations.moveTask)

  // Sync internal state with prop
  useEffect(() => {
    setIsCompactView(isCompact)
  }, [isCompact])

  // Handle compact toggle
  const handleCompactToggle = () => {
    const newValue = !isCompactView
    setIsCompactView(newValue)
    onCompactToggle?.(newValue)
  }

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragOverTask = (e: React.DragEvent, taskId: string, columnId: string, index: number) => {
    e.preventDefault()
    if (!draggedTask || draggedTask._id === taskId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const insertIndex = e.clientY < midpoint ? index : index + 1

    // Only update if position actually changed to reduce re-renders
    if (!dropPosition || dropPosition.column !== columnId || dropPosition.index !== insertIndex) {
      setDropPosition({ column: columnId, index: insertIndex })
    }
    if (draggedOverTask !== taskId) {
      setDraggedOverTask(taskId)
    }
  }

  const handleDragLeaveTask = () => {
    // Small delay to prevent flicker when moving between tasks
    setTimeout(() => {
      setDraggedOverTask(null)
    }, 50)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()

    if (!draggedTask) {
      setDraggedTask(null)
      setDropPosition(null)
      setDraggedOverTask(null)
      return
    }

    const targetPosition = dropPosition?.column === newStatus && dropPosition?.index !== undefined
      ? dropPosition.index
      : tasks.filter(t => t.status === newStatus).length

    try {
      await moveTask({
        taskId: draggedTask._id,
        status: newStatus as any,
        position: targetPosition,
      })

      onTaskUpdate?.()
    } catch (error) {
      toast.error('Failed to move task')
    }

    setDraggedTask(null)
    setDropPosition(null)
    setDraggedOverTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDropPosition(null)
    setDraggedOverTask(null)
  }

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.position - b.position)
  }

  const openCreateModal = (status: string) => {
    setCreateStatus(status)
    setShowCreateModal(true)
  }

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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-16px">
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
                hoveredColumn === column.id && draggedTask && "border-primary-brutalist bg-primary-brutalist/5",
                draggedTask && !hoveredColumn && "border-opacity-50"
              )}
              onDragOver={(e) => {
                handleDragOver(e)
                setHoveredColumn(column.id)
              }}
              onDragLeave={() => setHoveredColumn(null)}
              onDrop={(e) => {
                handleDrop(e, column.id)
                setHoveredColumn(null)
              }}
            >
              {/* Column Header */}
              <div className={clsx(
                "p-12px border-b-2",
                "flex items-center justify-between",
                "bg-[var(--theme-background-secondary)]",
                column.borderColor
              )}>
                <h3 className={clsx(
                  "font-mono text-brutal-sm font-bold uppercase",
                  column.textColor
                )}>{column.title}</h3>
                <div className="flex items-center gap-8px">
                  <span className={clsx(
                    "px-8px py-2px text-brutal-xs font-mono font-bold",
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
                  "p-12px space-y-8px",
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
                    const showDropIndicatorBefore = dropPosition?.column === column.id && dropPosition?.index === index

                    return (
                      <React.Fragment key={task._id}>
                        {/* Drop Position Indicator */}
                        {showDropIndicatorBefore && draggedTask && (
                          <div
                            className="relative mb-8px transition-all duration-150"
                            style={{ height: isCompactView ? 64 : 136 }}
                          >
                            <div className="absolute inset-0 border-2 border-dashed border-primary-brutalist bg-primary-brutalist/10 flex items-center justify-center animate-pulse">
                              <span className="text-brutal-xs font-mono uppercase text-primary-brutalist">
                                DROP HERE
                              </span>
                            </div>
                          </div>
                        )}

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: draggedTask?._id === task._id ? 0.5 : 1
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
                        </motion.div>
                      </React.Fragment>
                    )
                  })}

                  {/* Drop indicator at the end of the column */}
                  {dropPosition?.column === column.id && dropPosition?.index === columnTasks.length && draggedTask && (
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
                <div className={clsx(isCompactView ? "p-8px" : "p-16px")}>
                  <BrutalButton
                    onClick={() => openCreateModal(column.id)}
                    variant="outline"
                    className="w-full border-dashed flex items-center justify-center gap-8px"
                    size={isCompactView ? "sm" : "md"}
                  >
                    <HiOutlinePlus className="w-16px h-16px" />
                    {!isCompactView && <span>ADD TASK</span>}
                  </BrutalButton>
                </div>
              </div>

              {/* Scroll Indicator */}
              {hasOverflow[column.id] && (
                <div className="absolute bottom-0 left-0 right-0 h-24px bg-gradient-to-t from-carbon-plate to-transparent pointer-events-none flex items-end justify-center pb-4px">
                  <div className="w-24px h-2px bg-primary-brutalist/40 animate-pulse" />
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
}