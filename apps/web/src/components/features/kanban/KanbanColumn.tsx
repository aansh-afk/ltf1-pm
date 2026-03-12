import React, { memo } from "react";
import { HiOutlinePlus } from "react-icons/hi";
import clsx from "clsx";
import KanbanCard from "./KanbanCard";
import { AnimatePresence, m } from "framer-motion";

interface KanbanTask {
  _id: string;
  title: string;
  status: string;
  priority: string;
  [key: string]: unknown;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: KanbanTask[];
  colorVar: string;
  isCompact?: boolean;
  onTaskEdit?: (task: KanbanTask) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskDuplicate?: (task: KanbanTask) => void;
  onViewDetails?: (taskId: string) => void;
  onAddTask?: (status: string) => void;
  draggedTask?: KanbanTask | null;
  hoveredColumn?: string | null;
  dropPosition?: { column: string; index: number } | null;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragStart?: (e: React.DragEvent, task: KanbanTask) => void;
  onDragOverTask?: (e: React.DragEvent, taskId: string, index: number) => void;
  columnRef?: (el: HTMLDivElement | null) => void;
  hasOverflow?: boolean;
}

const KanbanColumn = memo(function KanbanColumn({
  id,
  title,
  tasks,
  colorVar,
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
  hasOverflow,
}: KanbanColumnProps) {
  const taskCount = tasks.length;
  const isHovered = hoveredColumn === id && draggedTask;

  return (
    <div
      className="flex flex-col relative h-full transition-colors duration-200 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]"
      style={
        isHovered
          ? {
              borderColor: "var(--theme-primary)",
              backgroundColor:
                "color-mix(in srgb, var(--theme-primary) 3%, transparent)",
            }
          : undefined
      }
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="px-3 py-2 border-b-2 border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-background)]">
        <h3
          className="font-mono text-[10px] font-bold uppercase tracking-widest"
          style={{ color: colorVar }}
        >
          {title}
        </h3>
        <span
          className="px-1.5 py-0.5 text-[9px] font-mono font-bold border"
          style={{
            color:
              taskCount === 0 ? "var(--theme-foreground-tertiary)" : colorVar,
            borderColor:
              taskCount === 0
                ? "var(--theme-border)"
                : `color-mix(in srgb, ${colorVar} 30%, transparent)`,
            backgroundColor:
              taskCount === 0
                ? "transparent"
                : `color-mix(in srgb, ${colorVar} 10%, transparent)`,
          }}
        >
          {taskCount}
        </span>
      </div>

      {/* Color accent bar */}
      <div className="h-[2px]" style={{ backgroundColor: colorVar }} />

      {/* Task List Container */}
      <div
        ref={columnRef}
        className={clsx(
          "flex-1 overflow-y-auto custom-scrollbar relative",
          isCompact ? "p-1 space-y-1" : "p-1.5 space-y-1.5",
        )}
        style={{ scrollbarGutter: "stable" }}
      >
        <AnimatePresence>
          {tasks.map((task, index) => {
            const showDropBefore =
              dropPosition?.column === id && dropPosition?.index === index;

            return (
              <React.Fragment key={task._id}>
                {showDropBefore && draggedTask && (
                  <div
                    className="relative mb-1.5 transition-all duration-150 border-2 border-dashed flex items-center justify-center animate-pulse"
                    style={{
                      height: isCompact ? 48 : 72,
                      borderColor: "var(--theme-primary)",
                      backgroundColor:
                        "color-mix(in srgb, var(--theme-primary) 8%, transparent)",
                    }}
                  >
                    <span
                      className="text-[9px] font-mono uppercase"
                      style={{ color: "var(--theme-primary)" }}
                    >
                      DROP HERE
                    </span>
                  </div>
                )}

                <m.div
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: draggedTask?._id === task._id ? 0.4 : 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  draggable
                  onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, task)}
                  onDragOver={(e) =>
                    onDragOverTask?.(e as unknown as React.DragEvent, task._id, index)
                  }
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
            );
          })}

          {/* Drop indicator at end of column */}
          {dropPosition?.column === id &&
            dropPosition?.index === tasks.length &&
            draggedTask && (
              <div
                className="relative transition-all duration-150 border-2 border-dashed flex items-center justify-center animate-pulse"
                style={{
                  height: isCompact ? 48 : 72,
                  borderColor: "var(--theme-primary)",
                  backgroundColor:
                    "color-mix(in srgb, var(--theme-primary) 8%, transparent)",
                }}
              >
                <span
                  className="text-[9px] font-mono uppercase"
                  style={{ color: "var(--theme-primary)" }}
                >
                  DROP HERE
                </span>
              </div>
            )}
        </AnimatePresence>

        {/* Add Task Button */}
        <div className={isCompact ? "p-1" : "p-1.5"}>
          <button
            onClick={() => onAddTask?.(id)}
            className="w-full border border-dashed border-[var(--theme-border)] bg-transparent text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] hover:border-[var(--theme-primary)] flex items-center justify-center gap-1.5 py-1.5 font-mono text-[9px] uppercase transition-colors"
          >
            <HiOutlinePlus className="w-3 h-3" />
            {!isCompact && <span>ADD</span>}
          </button>
        </div>
      </div>

      {/* Scroll shadow indicator */}
      {hasOverflow && (
        <div
          className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none flex items-end justify-center pb-1"
          style={{
            background:
              "linear-gradient(to top, var(--theme-background-secondary), transparent)",
          }}
        >
          <div
            className="w-4 h-[2px] animate-pulse"
            style={{
              backgroundColor: `color-mix(in srgb, ${colorVar} 40%, transparent)`,
            }}
          />
        </div>
      )}
    </div>
  );
});

export default KanbanColumn;
