import { useState, useRef, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { motion } from 'framer-motion'
import { HiOutlinePlus } from 'react-icons/hi'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'
import TaskDetailModal from './TaskDetailModal'
import toast from 'react-hot-toast'
import clsx from 'clsx'

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

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    const columnTasks = tasks.filter(t => t.status === newStatus)
    const newPosition = columnTasks.length

    try {
      await moveTask({
        taskId: draggedTask._id,
        status: newStatus as any,
        position: newPosition,
      })
      
      onTaskUpdate?.()
    } catch (error) {
      toast.error('Failed to move task')
    }
    
    setDraggedTask(null)
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
            <div
              key={column.id}
              className={clsx(
                "flex flex-col bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-brutal relative",
                "transition-all duration-200",
                hoveredColumn === column.id && "border-primary-brutalist",
                draggedTask && "border-opacity-50"
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
                {columnTasks.map((task, index) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
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
                ))}
                
                {/* Add Task Button */}
                <button
                  onClick={() => openCreateModal(column.id)}
                  className={clsx(
                    "w-full border-2 border-dashed border-[var(--theme-border)]",
                    "text-[var(--theme-foreground)]/50 hover:text-[var(--theme-foreground)] hover:border-primary-brutalist",
                    "transition-all flex items-center justify-center gap-8px",
                    "uppercase text-brutal-xs font-mono font-bold",
                    isCompactView ? "p-8px" : "p-16px"
                  )}
                >
                  <HiOutlinePlus className="w-16px h-16px" />
                  {!isCompactView && <span>ADD TASK</span>}
                </button>
              </div>

              {/* Scroll Indicator */}
              {hasOverflow[column.id] && (
                <div className="absolute bottom-0 left-0 right-0 h-24px bg-gradient-to-t from-carbon-plate to-transparent pointer-events-none flex items-end justify-center pb-4px">
                  <div className="w-24px h-2px bg-primary-brutalist/40 animate-pulse" />
                </div>
              )}
            </div>
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