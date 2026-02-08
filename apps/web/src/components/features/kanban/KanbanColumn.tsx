import React, { memo } from 'react'
import { HiOutlinePlus } from 'react-icons/hi'
import clsx from 'clsx'
import BrutalCard from '../../ui/BrutalCard'
import BrutalButton from '../../ui/BrutalButton'
import KanbanCard from './KanbanCard'
import { AnimatePresence, motion } from 'framer-motion'

interface KanbanColumnProps {
    id: string
    title: string
    tasks: any[]
    borderColor: string
    bgColor: string
    textColor: string
    isCompact?: boolean
    onTaskEdit?: (task: any) => void
    onTaskDelete?: (taskId: string) => void
    onTaskDuplicate?: (task: any) => void
    onViewDetails?: (taskId: string) => void
    onAddTask?: (status: string) => void
    draggedTask?: any
    hoveredColumn?: string | null
    dropPosition?: { column: string; index: number } | null
    onDragOver?: (e: React.DragEvent) => void
    onDragLeave?: () => void
    onDrop?: (e: React.DragEvent) => void
    onDragStart?: (e: React.DragEvent, task: any) => void
    onDragOverTask?: (e: React.DragEvent, taskId: string, index: number) => void
    columnRef?: (el: HTMLDivElement | null) => void
    hasOverflow?: boolean
}

const KanbanColumn = memo(function KanbanColumn({
    id,
    title,
    tasks,
    borderColor,
    bgColor,
    textColor,
    isCompact = false,
    onTaskEdit,
    onTaskDelete,
    onTaskDuplicate,
    onViewDetails,
    onAddTask,
    draggedTask,
    hoveredColumn,
    dropPosition,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragStart,
    onDragOverTask,
    columnRef,
    hasOverflow
}: KanbanColumnProps) {
    const taskCount = tasks.length

    return (
        <BrutalCard
            variant="default"
            padding="none"
            className={clsx(
                "flex flex-col relative h-full transition-colors duration-200",
                hoveredColumn === id && draggedTask && "border-primary-brutalist bg-primary-brutalist/5",
                draggedTask && !hoveredColumn && "border-opacity-50"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Column Header */}
            <div className={clsx(
                "p-[10px] border-b-2",
                "flex items-center justify-between",
                "bg-[var(--theme-background-secondary)]",
                borderColor
            )}>
                <h3 className={clsx(
                    "font-mono text-brutal-sm font-bold uppercase",
                    textColor
                )}>{title}</h3>
                <div className="flex items-center gap-[8px]">
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
            <div className={clsx("h-4px", bgColor)} />

            {/* Task List Container */}
            <div
                ref={columnRef}
                className={clsx(
                    "flex-1 overflow-y-auto custom-scrollbar",
                    "p-[10px] space-y-[8px]",
                    "relative"
                )}
                style={{
                    scrollbarGutter: 'stable'
                }}
            >
                <AnimatePresence>
                    {tasks.map((task, index) => {
                        const showDropIndicatorBefore = dropPosition?.column === id && dropPosition?.index === index

                        return (
                            <React.Fragment key={task._id}>
                                {/* Drop Position Indicator */}
                                {showDropIndicatorBefore && draggedTask && (
                                    <div
                                        className="relative mb-[8px] transition-all duration-150"
                                        style={{ height: isCompact ? 64 : 136 }}
                                    >
                                        <div className="absolute inset-0 border-2 border-dashed border-primary-brutalist bg-primary-brutalist/10 flex items-center justify-center animate-pulse">
                                            <span className="text-brutal-xs font-mono uppercase text-primary-brutalist">
                                                DROP HERE
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: draggedTask?._id === task._id ? 0.5 : 1,
                                        y: 0
                                    }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    draggable
                                    onDragStart={(e) => onDragStart?.(e as any, task)}
                                    onDragOver={(e) => onDragOverTask?.(e as any, task._id, index)}
                                    className="cursor-move"
                                >
                                    <KanbanCard
                                        task={task}
                                        isCompact={isCompact}
                                        onEdit={onTaskEdit}
                                        onDelete={onTaskDelete}
                                        onDuplicate={onTaskDuplicate}
                                        onViewDetails={onViewDetails}
                                    />
                                </motion.div>
                            </React.Fragment>
                        )
                    })}

                    {/* Drop indicator at the end of the column */}
                    {dropPosition?.column === id && dropPosition?.index === tasks.length && draggedTask && (
                        <div
                            className="relative transition-all duration-150"
                            style={{ height: isCompact ? 64 : 136 }}
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
                <div className={clsx(isCompact ? "p-8px" : "p-[10px]")}>
                    <BrutalButton
                        onClick={() => onAddTask?.(id)}
                        variant="secondary"
                        className="w-full border-dashed flex items-center justify-center gap-[8px] opacity-50 hover:opacity-100"
                        size={isCompact ? "sm" : "md"}
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        {!isCompact && <span>ADD TASK</span>}
                    </BrutalButton>
                </div>
            </div>

            {/* Scroll Indicator */}
            {hasOverflow && (
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-carbon-plate to-transparent pointer-events-none flex items-end justify-center pb-4px">
                    <div className="w-4 h-2px bg-primary-brutalist/40 animate-pulse" />
                </div>
            )}
        </BrutalCard>
    )
})

export default KanbanColumn
