import { useState, memo, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import {
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi";
import clsx from "clsx";
import { format } from "date-fns";
import CreateTaskModal from "./CreateTaskModal";
import BrutalCheckbox from "../../ui/BrutalCheckbox";

interface TaskListItem {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  key?: string;
  dueDate?: number;
  labels?: string[];
  assignees?: Array<{ _id: string; name: string }>;
  reporter?: { name: string };
  estimate?: { points?: number; hours?: number };
  [key: string]: unknown;
}

interface TaskListProps {
  tasks: TaskListItem[];
  projectId: string;
  onTaskUpdate?: () => void;
  onTaskEdit?: (task: TaskListItem) => void;
  onTaskDelete?: (task: TaskListItem) => void;
  onTaskDuplicate?: (task: TaskListItem) => void;
}

// Status dot + label using CSS variable tokens
const statusConfig: Record<
  string,
  {
    label: string;
    colorVar: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  backlog: {
    label: "BACKLOG",
    colorVar: "var(--theme-foreground-tertiary)",
    icon: HiOutlineClock,
  },
  todo: {
    label: "TO DO",
    colorVar: "var(--theme-primary)",
    icon: HiOutlinePlay,
  },
  in_progress: {
    label: "IN PROGRESS",
    colorVar: "var(--theme-info)",
    icon: HiOutlinePlay,
  },
  in_review: {
    label: "IN REVIEW",
    colorVar: "var(--theme-warning)",
    icon: HiOutlineClock,
  },
  done: {
    label: "DONE",
    colorVar: "var(--theme-success)",
    icon: HiOutlineCheckCircle,
  },
  cancelled: {
    label: "CANCELLED",
    colorVar: "var(--theme-error)",
    icon: HiOutlineExclamation,
  },
};

const priorityConfig: Record<string, { label: string; colorVar: string }> = {
  urgent: { label: "URGENT", colorVar: "var(--theme-error)" },
  high: { label: "HIGH", colorVar: "var(--theme-warning)" },
  medium: { label: "MEDIUM", colorVar: "var(--theme-primary)" },
  low: { label: "LOW", colorVar: "var(--theme-foreground-tertiary)" },
};

const typeConfig: Record<string, { label: string; colorVar: string }> = {
  feature: { label: "FEAT", colorVar: "var(--theme-success)" },
  bug: { label: "BUG", colorVar: "var(--theme-error)" },
  improvement: { label: "IMPR", colorVar: "var(--theme-info)" },
  task: { label: "TASK", colorVar: "var(--theme-primary)" },
  epic: { label: "EPIC", colorVar: "var(--theme-warning)" },
};

const TaskList = memo(function TaskList({
  tasks,
  projectId,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
  onTaskDuplicate: _onTaskDuplicate,
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    "status" | "priority" | "dueDate" | "assignee"
  >("status");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const _updateTask = useMutation(api.tasks.mutations.updateTask);

  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const selectAllTasks = useCallback(() => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t._id)));
    }
  }, [selectedTasks.size, tasks]);

  const handleSort = useCallback(
    (field: typeof sortBy) => {
      if (field === sortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
    },
    [sortBy],
  );

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case "status": {
        const statusOrder = [
          "backlog",
          "todo",
          "in_progress",
          "in_review",
          "done",
          "cancelled",
        ];
        compareValue =
          statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        break;
      }
      case "priority": {
        const priorityOrder = ["urgent", "high", "medium", "low"];
        compareValue =
          priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        break;
      }
      case "dueDate":
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        compareValue =
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case "assignee": {
        const aName = a.assignees?.[0]?.name || "";
        const bName = b.assignees?.[0]?.name || "";
        if (!aName) return 1;
        if (!bName) return -1;
        compareValue = aName.localeCompare(bName);
        break;
      }
    }

    return sortOrder === "asc" ? compareValue : -compareValue;
  });

  return (
    <div className="space-y-3">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrutalCheckbox
            checked={selectedTasks.size === tasks.length && tasks.length > 0}
            onChange={selectAllTasks}
            size="sm"
          />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">
            {selectedTasks.size > 0 && `${selectedTasks.size} SELECTED`}
          </span>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-1.5 bg-[var(--theme-primary)] text-[var(--theme-background)] font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity border-2 border-[var(--theme-primary)]"
        >
          + NEW TASK
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-[var(--theme-foreground-tertiary)] border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="col-span-1" />
          <div className="col-span-4">TASK</div>
          <button
            className="col-span-2 text-left font-mono text-[9px] uppercase tracking-widest hover:text-[var(--theme-primary)] transition-colors"
            onClick={() => handleSort("status")}
          >
            STATUS {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            className="col-span-1 text-left font-mono text-[9px] uppercase tracking-widest hover:text-[var(--theme-primary)] transition-colors"
            onClick={() => handleSort("priority")}
          >
            PRI {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            className="col-span-2 text-left font-mono text-[9px] uppercase tracking-widest hover:text-[var(--theme-primary)] transition-colors"
            onClick={() => handleSort("assignee")}
          >
            ASSIGNEE{" "}
            {sortBy === "assignee" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            className="col-span-2 text-left font-mono text-[9px] uppercase tracking-widest hover:text-[var(--theme-primary)] transition-colors"
            onClick={() => handleSort("dueDate")}
          >
            DUE {sortBy === "dueDate" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>

        {/* Task Rows */}
        {sortedTasks.map((task) => {
          const statusCfg =
            statusConfig[task.status as keyof typeof statusConfig];
          const StatusIcon = statusCfg?.icon || HiOutlineClock;
          const isExpanded = expandedTasks.has(task._id);
          const isSelected = selectedTasks.has(task._id);
          const typeCfg = typeConfig[task.type as keyof typeof typeConfig];
          const priCfg =
            priorityConfig[task.priority as keyof typeof priorityConfig];

          return (
            <div
              key={task._id}
              className="border-b border-[var(--theme-border)]/50 last:border-b-0"
              style={
                isSelected
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--theme-primary) 5%, transparent)",
                    }
                  : undefined
              }
            >
              {/* Main Row */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-[var(--theme-background-secondary)]/40 transition-colors">
                {/* Checkbox + expand */}
                <div className="col-span-1 flex items-center gap-1">
                  <BrutalCheckbox
                    checked={isSelected}
                    onChange={() => toggleTaskSelection(task._id)}
                    size="sm"
                  />
                  <button
                    onClick={() => toggleTaskExpansion(task._id)}
                    className="p-0.5 text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] transition-colors"
                  >
                    {isExpanded ? (
                      <HiOutlineChevronUp className="w-3 h-3" />
                    ) : (
                      <HiOutlineChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Task key + title */}
                <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                  {typeCfg && (
                    <span
                      className="px-1 py-0.5 text-[9px] font-mono font-bold shrink-0"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${typeCfg.colorVar} 15%, transparent)`,
                        color: typeCfg.colorVar,
                        border: `1px solid color-mix(in srgb, ${typeCfg.colorVar} 30%, transparent)`,
                      }}
                    >
                      {task.key}
                    </span>
                  )}
                  {!typeCfg && (
                    <span className="px-1 py-0.5 text-[9px] font-mono font-bold shrink-0 bg-[var(--theme-background-secondary)] text-[var(--theme-foreground-tertiary)] border border-[var(--theme-border)]">
                      {task.key}
                    </span>
                  )}
                  <span className="font-mono text-xs text-[var(--theme-foreground)] truncate">
                    {task.title}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] uppercase font-bold"
                    style={{
                      color:
                        statusCfg?.colorVar ||
                        "var(--theme-foreground-tertiary)",
                      backgroundColor: `color-mix(in srgb, ${statusCfg?.colorVar || "var(--theme-foreground-tertiary)"} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${statusCfg?.colorVar || "var(--theme-foreground-tertiary)"} 20%, transparent)`,
                    }}
                  >
                    <StatusIcon className="w-2.5 h-2.5" />
                    {statusCfg?.label || task.status}
                  </div>
                </div>

                {/* Priority */}
                <div className="col-span-1">
                  <span
                    className="font-mono text-[9px] uppercase font-bold"
                    style={{
                      color:
                        priCfg?.colorVar || "var(--theme-foreground-tertiary)",
                    }}
                  >
                    {priCfg?.label || task.priority}
                  </span>
                </div>

                {/* Assignee */}
                <div className="col-span-2">
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {task.assignees
                        .slice(0, 2)
                        .map((assignee: { _id: string; name: string }, index: number) => (
                          <div
                            key={assignee._id}
                            className="flex items-center gap-1"
                          >
                            <div
                              className="w-5 h-5 flex items-center justify-center border border-[var(--theme-border)] shrink-0"
                              style={{
                                backgroundColor:
                                  "color-mix(in srgb, var(--theme-primary) 15%, transparent)",
                                color: "var(--theme-primary)",
                              }}
                            >
                              <span className="text-[9px] font-bold font-mono">
                                {assignee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {index === 0 && task.assignees.length === 1 && (
                              <span className="text-[10px] font-mono text-[var(--theme-foreground-secondary)] truncate max-w-[60px]">
                                {assignee.name}
                              </span>
                            )}
                          </div>
                        ))}
                      {task.assignees.length > 2 && (
                        <span className="text-[9px] font-mono text-[var(--theme-foreground-tertiary)]">
                          +{task.assignees.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] font-mono text-[var(--theme-foreground-tertiary)] uppercase">
                      NONE
                    </span>
                  )}
                </div>

                {/* Due date */}
                <div className="col-span-2">
                  {task.dueDate ? (
                    <div
                      className="flex items-center gap-1 text-[9px] font-mono"
                      style={{
                        color:
                          new Date(task.dueDate) < new Date()
                            ? "var(--theme-error)"
                            : "var(--theme-foreground-secondary)",
                      }}
                    >
                      <HiOutlineCalendar className="w-3 h-3 shrink-0" />
                      {format(new Date(task.dueDate), "MMM dd")}
                    </div>
                  ) : (
                    <span className="text-[9px] font-mono text-[var(--theme-foreground-tertiary)]">
                      —
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-10 py-3 bg-[var(--theme-background-secondary)]/30 border-t border-[var(--theme-border)]/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--theme-foreground-tertiary)] mb-1">
                        Description
                      </h4>
                      <p className="text-xs font-mono text-[var(--theme-foreground-secondary)] leading-relaxed">
                        {task.description || "No description provided."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--theme-foreground-tertiary)] mb-1">
                        Details
                      </h4>
                      <div className="space-y-1 text-[9px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--theme-foreground-tertiary)] w-16">
                            TYPE
                          </span>
                          <span className="text-[var(--theme-foreground)] uppercase">
                            {task.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--theme-foreground-tertiary)] w-16">
                            REPORTER
                          </span>
                          <span className="text-[var(--theme-foreground)]">
                            {task.reporter?.name || "—"}
                          </span>
                        </div>
                        {task.estimate && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[var(--theme-foreground-tertiary)] w-16">
                              ESTIMATE
                            </span>
                            <span className="text-[var(--theme-foreground)]">
                              {task.estimate.points || task.estimate.hours}h
                            </span>
                          </div>
                        )}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[var(--theme-foreground-tertiary)] w-16">
                              LABELS
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {task.labels.map((label: string) => (
                                <span
                                  key={label}
                                  className="px-1 py-0.5 text-[9px] font-mono"
                                  style={{
                                    color: "var(--theme-primary)",
                                    backgroundColor:
                                      "color-mix(in srgb, var(--theme-primary) 10%, transparent)",
                                    border:
                                      "1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)",
                                  }}
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => onTaskEdit?.(task)}
                          className="px-2 py-1 text-[9px] font-mono font-bold uppercase border border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => onTaskDelete?.(task)}
                          className="px-2 py-1 text-[9px] font-mono font-bold uppercase border text-[var(--theme-error)] hover:bg-[var(--theme-error)] hover:text-[var(--theme-background)] transition-colors"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--theme-error) 40%, transparent)",
                          }}
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {projectId && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={projectId}
          onSuccess={onTaskUpdate}
        />
      )}
    </div>
  );
});

export default TaskList;
