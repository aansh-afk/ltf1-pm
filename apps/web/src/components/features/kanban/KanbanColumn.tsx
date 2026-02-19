import React, { memo } from 'react'
import { HiOutlinePlus } from 'react-icons/hi'
import clsx from 'clsx'
import KanbanCard from './KanbanCard'
import { AnimatePresence, m } from 'framer-motion'

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
        <div
            className={clsx(
                "flex flex-col relative h-full transition-colors duration-200 bg-[#111111] border-2 border-[#2E2E35]",
                hoveredColumn === id && draggedTask && "border-[#6366F1] bg-[#6366F1]/5",
                draggedTask && !hoveredColumn && "border-opacity-50"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Column Header */}
            <div className={clsx(
                "px-3 py-2.5 border-b-2 border-[#2E2E35]",
                "flex items-center justify-between",
                "bg-[#0A0A0A]"
            )}>
                <h3 className={clsx(
                    "font-mono text-xs font-bold uppercase tracking-wider",
                    textColor
                )}>{title}</h3>
                <div className="flex items-center gap-2">
                    <span className={clsx(
                        "px-2 py-0.5 text-[10px] font-mono font-bold",
                        "border-2",
                        taskCount === 0
                            ? "border-[#2E2E35] text-[#6B7280]"
                            : taskCount > 10
                                ? "border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10"
                                : "border-[#6366F1] text-[#6366F1] bg-[#6366F1]/10"
                    )}>
                        {taskCount}
                    </span>
                </div>
            </div>

            {/* Color indicator bar */}
            <div className={clsx("h-[3px]", bgColor)} />

            {/* Task List Container */}
            <div
                ref={columnRef}
                className={clsx(
                    "flex-1 overflow-y-auto custom-scrollbar",
                    "p-1.5 space-y-1.5",
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
                                        className="relative mb-1.5 transition-all duration-150"
                                        style={{ height: isCompact ? 48 : 72 }}
                                    >
                                        <div className="absolute inset-0 border-2 border-dashed border-[#6366F1] bg-[#6366F1]/10 flex items-center justify-center animate-pulse">
                                            <span className="text-[10px] font-mono uppercase text-[#6366F1]">
                                                DROP HERE
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <m.div
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
                                </m.div>
                            </React.Fragment>
                        )
                    })}

                    {/* Drop indicator at the end of the column */}
                    {dropPosition?.column === id && dropPosition?.index === tasks.length && draggedTask && (
                        <div
                            className="relative transition-all duration-150"
                            style={{ height: isCompact ? 48 : 72 }}
                        >
                            <div className="absolute inset-0 border-2 border-dashed border-[#6366F1] bg-[#6366F1]/10 flex items-center justify-center animate-pulse">
                                <span className="text-[10px] font-mono uppercase text-[#6366F1]">
                                    DROP HERE
                                </span>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Add Task Button */}
                <div className={clsx(isCompact ? "p-1" : "p-1.5")}>
                    <button
                        onClick={() => onAddTask?.(id)}
                        className="w-full border border-dashed border-[#2E2E35] bg-transparent text-[#6B7280] hover:text-[#F9FAFB] hover:border-[#6366F1] flex items-center justify-center gap-1.5 py-1.5 font-mono text-[10px] uppercase transition-colors"
                    >
                        <HiOutlinePlus className="w-3 h-3" />
                        {!isCompact && <span>ADD</span>}
                    </button>
                </div>
            </div>

            {/* Scroll Indicator */}
            {hasOverflow && (
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#111111] to-transparent pointer-events-none flex items-end justify-center pb-1">
                    <div className="w-4 h-[2px] bg-[#6366F1]/40 animate-pulse" />
                </div>
            )}
        </div>
    )
})

export default KanbanColumn
