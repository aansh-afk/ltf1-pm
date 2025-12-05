import React, { useState, useRef, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import KanbanColumn from './KanbanColumn'
import CreateTaskModal from '../task/CreateTaskModal'
import TaskDetailModal from '../task/TaskDetailModal'
import toast from 'react-hot-toast'

interface KanbanBoardProps {
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

export default function KanbanBoard({
    tasks,
    projectId,
    onTaskUpdate,
    onTaskEdit,
    onTaskDelete,
    onTaskDuplicate,
    isCompact = false,
    onCompactToggle
}: KanbanBoardProps) {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createStatus, setCreateStatus] = useState<string>('backlog')
    const [draggedTask, setDraggedTask] = useState<any>(null)
    const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)
    const [dropPosition, setDropPosition] = useState<{ column: string; index: number } | null>(null)
    const [draggedOverTask, setDraggedOverTask] = useState<string | null>(null)
    const columnRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const [hasOverflow, setHasOverflow] = useState<{ [key: string]: boolean }>({})
    const [showTaskDetail, setShowTaskDetail] = useState(false)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

    const moveTask = useMutation(api.tasks.mutations.moveTask)
    const deleteTask = useMutation(api.tasks.mutations.deleteTask)

    const handleDragStart = (e: React.DragEvent, task: any) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDragOverTask = (e: React.DragEvent, taskId: string, index: number) => {
        e.preventDefault()
        if (!draggedTask || draggedTask._id === taskId) return

        const rect = e.currentTarget.getBoundingClientRect()
        const midpoint = rect.top + rect.height / 2
        const insertIndex = e.clientY < midpoint ? index : index + 1

        // Only update if position actually changed to reduce re-renders
        // Also check if we are over a different column than the one currently stored in dropPosition
        // We need to find which column this task belongs to, but for now we can infer it from the parent context if passed, 
        // or we can rely on the column drag over handler setting the column part.
        // Actually, the column drag over handler sets the column. Here we set the index.

        // Wait, the column drag over handler sets hoveredColumn. 
        // We need to set dropPosition here.

        // Find the column of the task we are dragging over
        const task = tasks.find(t => t._id === taskId)
        if (!task) return

        const columnId = task.status

        if (!dropPosition || dropPosition.column !== columnId || dropPosition.index !== insertIndex) {
            setDropPosition({ column: columnId, index: insertIndex })
        }
    }

    const handleDragLeaveTask = () => {
        // Small delay to prevent flicker when moving between tasks
        // setTimeout(() => {
        //   setDraggedOverTask(null)
        // }, 50)
    }

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault()

        if (!draggedTask) {
            setDraggedTask(null)
            setDropPosition(null)
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
        setHoveredColumn(null)
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

    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteTask({ taskId: taskId as any })
            toast.success('Task deleted')
            onTaskUpdate?.()
        } catch (error) {
            toast.error('Failed to delete task')
        }
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

        checkOverflow()
        window.addEventListener('resize', checkOverflow)
        const timer = setTimeout(checkOverflow, 100)

        return () => {
            window.removeEventListener('resize', checkOverflow)
            clearTimeout(timer)
        }
    }, [tasks])

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-16px h-full">
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        id={column.id}
                        title={column.title}
                        tasks={getTasksByStatus(column.id)}
                        borderColor={column.borderColor}
                        bgColor={column.bgColor}
                        textColor={column.textColor}
                        isCompact={isCompact}
                        onTaskEdit={onTaskEdit}
                        onTaskDelete={handleDeleteTask}
                        onTaskDuplicate={onTaskDuplicate}
                        onViewDetails={(taskId) => {
                            setSelectedTaskId(taskId)
                            setShowTaskDetail(true)
                        }}
                        onAddTask={openCreateModal}
                        draggedTask={draggedTask}
                        hoveredColumn={hoveredColumn}
                        dropPosition={dropPosition}
                        onDragOver={(e) => {
                            handleDragOver(e)
                            setHoveredColumn(column.id)
                        }}
                        onDragLeave={() => setHoveredColumn(null)}
                        onDrop={(e) => handleDrop(e, column.id)}
                        onDragStart={handleDragStart}
                        onDragOverTask={handleDragOverTask}
                        columnRef={(el) => columnRefs.current[column.id] = el}
                        hasOverflow={hasOverflow[column.id]}
                    />
                ))}
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
