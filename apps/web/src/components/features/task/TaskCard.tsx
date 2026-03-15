import { useState, useRef, useEffect } from "react";
import {
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDuplicate,
  HiOutlineLink,
  HiOutlineClock,
  HiOutlineChat,
} from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";
import UserDisplay from "../user/UserDisplay";
import toast from "react-hot-toast";

interface TaskCardProps {
  task: any;
  isCompact?: boolean;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (task: any) => void;
  onViewDetails?: (taskId: string) => void;
}

// Priority left border accent
const priorityColorVar: Record<string, string> = {
  urgent: "var(--theme-error)",
  high: "var(--theme-warning)",
  medium: "var(--theme-primary)",
  low: "var(--theme-border)",
};

// Status top bar accent
const statusColorVar: Record<string, string> = {
  backlog: "var(--theme-foreground-tertiary)",
  todo: "var(--theme-primary)",
  in_progress: "var(--theme-info)",
  in_review: "var(--theme-warning)",
  done: "var(--theme-success)",
  blocked: "var(--theme-error)",
  cancelled: "var(--theme-error)",
};

// Type label color
const typeColorVar: Record<string, string> = {
  bug: "var(--theme-error)",
  feature: "var(--theme-success)",
  improvement: "var(--theme-info)",
  task: "var(--theme-foreground-secondary)",
  epic: "var(--theme-warning)",
};

const typeLabel: Record<string, string> = {
  bug: "[BUG]",
  feature: "[FEAT]",
  improvement: "[IMPR]",
  task: "[TASK]",
  epic: "[EPIC]",
};

export default function TaskCard({
  task,
  isCompact = false,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onViewDetails?.(task._id);
    } else if (e.key === "e" && e.ctrlKey) {
      e.preventDefault();
      onEdit?.(task);
    } else if (e.key === "Delete") {
      e.preventDefault();
      onDelete?.(task._id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (confirm("Delete this task? This cannot be undone.")) {
      onDelete?.(task._id);
    }
  };

  const priColor = priorityColorVar[task.priority] || "var(--theme-border)";
  const statusColor = statusColorVar[task.status] || "var(--theme-border)";
  const taskTypeColor =
    typeColorVar[task.type] || "var(--theme-foreground-tertiary)";

  return (
    <div
      className="relative overflow-hidden transition-all duration-150 group bg-[var(--theme-background)] border border-[var(--theme-border)] border-l-[3px] hover:border-[var(--theme-foreground)]/20 hover:-translate-y-[1px]"
      style={{ borderLeftColor: priColor }}
      role="article"
      aria-label={`Task: ${task.title}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => onViewDetails?.(task._id)}
    >
      {/* Status top bar */}
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{ backgroundColor: statusColor }}
      />

      <div
        className={
          isCompact ? "p-1.5 space-y-0.5 pt-2.5" : "px-2.5 py-2 space-y-1 pt-3"
        }
      >
        {/* Header: type + number + menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="text-[9px] font-mono font-bold shrink-0"
              style={{ color: taskTypeColor }}
            >
              {typeLabel[task.type] || "[TASK]"}
            </span>
            <span className="text-[9px] font-mono text-[var(--theme-foreground-tertiary)] truncate">
              {task.project?.key
                ? `${task.project.key}-${task.number}`
                : `#${task.number}`}
            </span>
            {task.priority === "urgent" && (
              <span
                className="text-[10px] font-bold animate-pulse shrink-0"
                style={{ color: "var(--theme-error)" }}
              >
                !
              </span>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-0.5 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--theme-background-secondary)]"
              aria-label="Task options"
            >
              <HiOutlineDotsVertical className="w-3 h-3 text-[var(--theme-foreground-tertiary)]" />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 z-50 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] [box-shadow:4px_4px_0px_var(--theme-shadow)] min-w-[130px]"
                role="menu"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowMenu(false);
                }}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit?.(task);
                  }}
                  className="w-full px-2.5 py-1.5 text-[9px] font-mono uppercase text-left text-[var(--theme-foreground-secondary)] hover:bg-[var(--theme-background-secondary)] hover:text-[var(--theme-foreground)] transition-colors flex items-center gap-1.5"
                >
                  <HiOutlinePencil className="w-3 h-3" />
                  EDIT
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate?.(task);
                  }}
                  className="w-full px-2.5 py-1.5 text-[9px] font-mono uppercase text-left text-[var(--theme-foreground-secondary)] hover:bg-[var(--theme-background-secondary)] hover:text-[var(--theme-foreground)] transition-colors flex items-center gap-1.5"
                >
                  <HiOutlineDuplicate className="w-3 h-3" />
                  DUPLICATE
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/task/${task._id}`,
                    );
                    toast.success("Link copied!");
                    setShowMenu(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-[9px] font-mono uppercase text-left text-[var(--theme-foreground-secondary)] hover:bg-[var(--theme-background-secondary)] hover:text-[var(--theme-foreground)] transition-colors flex items-center gap-1.5"
                >
                  <HiOutlineLink className="w-3 h-3" />
                  COPY LINK
                </button>
                <div className="border-t border-[var(--theme-border)]" />
                <button
                  onClick={handleDelete}
                  className="w-full px-2.5 py-1.5 text-[9px] font-mono uppercase text-left transition-colors flex items-center gap-1.5"
                  style={{ color: "var(--theme-error)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--theme-error)";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--theme-background)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--theme-error)";
                  }}
                >
                  <HiOutlineTrash className="w-3 h-3" />
                  DELETE
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-mono text-xs font-bold leading-snug text-[var(--theme-foreground)] break-words line-clamp-2">
          {task.title}
        </h4>

        {/* Labels */}
        {!isCompact && task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 2).map((label: string) => (
              <span
                key={label}
                className="text-[9px] font-mono uppercase tracking-wider px-1 py-px border truncate max-w-[80px]"
                style={{
                  color: "var(--theme-foreground-secondary)",
                  backgroundColor: "var(--theme-background-secondary)",
                  borderColor: "var(--theme-border)",
                }}
              >
                {label}
              </span>
            ))}
            {task.labels.length > 2 && (
              <span className="text-[9px] font-mono text-[var(--theme-foreground-tertiary)]">
                +{task.labels.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        {!isCompact && (
          <div className="flex items-center justify-between pt-1 border-t border-[var(--theme-border)]/50">
            <div className="flex items-center gap-1.5">
              <UserDisplay
                userId={
                  task.assigneeId || (task.assigneeIds && task.assigneeIds[0])
                }
                size="sm"
                showStatus={false}
                compact={true}
              />
              {task.commentCount > 0 && (
                <span className="text-[9px] font-mono text-[var(--theme-foreground-tertiary)] flex items-center gap-0.5">
                  <HiOutlineChat className="w-2.5 h-2.5" />
                  {task.commentCount}
                </span>
              )}
              {task.points && (
                <span
                  className="text-[9px] font-mono"
                  style={{ color: "var(--theme-primary)" }}
                >
                  {task.points}pt
                </span>
              )}
            </div>
            {task.dueDate && (
              <span
                className="text-[9px] font-mono flex items-center gap-0.5"
                style={{
                  color:
                    new Date(task.dueDate) < new Date()
                      ? "var(--theme-error)"
                      : "var(--theme-foreground-tertiary)",
                }}
              >
                <HiOutlineClock className="w-2.5 h-2.5" />
                {formatDistanceToNow(new Date(task.dueDate), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
