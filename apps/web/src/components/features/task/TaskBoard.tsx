import React, { useReducer, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import TaskBoardColumn from "./TaskBoardColumn";
import CreateTaskModal from "../task/CreateTaskModal";
import TaskDetailModal from "../task/TaskDetailModal";
import toast from "react-hot-toast";

interface TaskBoardProps {
  tasks: any[];
  projectId: string;
  onTaskUpdate?: () => void;
  onTaskEdit?: (task: any) => void;
  onTaskDelete?: (task: any) => void;
  onTaskDuplicate?: (task: any) => void;
  isCompact?: boolean;
  onCompactToggle?: (isCompact: boolean) => void;
}

const columns = [
  {
    id: "backlog",
    title: "BACKLOG",
    colorVar: "var(--theme-foreground-tertiary)",
  },
  { id: "todo", title: "TO DO", colorVar: "var(--theme-primary)" },
  { id: "in_progress", title: "IN PROGRESS", colorVar: "var(--theme-info)" },
  { id: "in_review", title: "IN REVIEW", colorVar: "var(--theme-warning)" },
  { id: "done", title: "DONE", colorVar: "var(--theme-success)" },
];

interface DragState {
  draggedTask: any;
  hoveredColumn: string | null;
  dropPosition: { column: string; index: number } | null;
  draggedOverTask: string | null;
}

type DragAction =
  | { type: "DRAG_START"; task: any }
  | { type: "SET_HOVERED_COLUMN"; column: string | null }
  | {
      type: "SET_DROP_POSITION";
      position: { column: string; index: number } | null;
    }
  | { type: "SET_DRAGGED_OVER_TASK"; taskId: string | null }
  | { type: "DRAG_END" };

const dragInitialState: DragState = {
  draggedTask: null,
  hoveredColumn: null,
  dropPosition: null,
  draggedOverTask: null,
};

function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case "DRAG_START":
      return { ...state, draggedTask: action.task };
    case "SET_HOVERED_COLUMN":
      return { ...state, hoveredColumn: action.column };
    case "SET_DROP_POSITION":
      return { ...state, dropPosition: action.position };
    case "SET_DRAGGED_OVER_TASK":
      return { ...state, draggedOverTask: action.taskId };
    case "DRAG_END":
      return dragInitialState;
    default:
      return state;
  }
}

type TaskBoardState = {
  showCreateModal: boolean;
  createStatus: string;
  hasOverflow: { [key: string]: boolean };
  showTaskDetail: boolean;
  selectedTaskId: string | null;
};

const taskBoardInitialState: TaskBoardState = {
  showCreateModal: false,
  createStatus: "backlog",
  hasOverflow: {},
  showTaskDetail: false,
  selectedTaskId: null,
};

type TaskBoardAction =
  | {
      type: "UPDATE";
      field: keyof TaskBoardState;
      value: TaskBoardState[keyof TaskBoardState];
    }
  | { type: "RESET" };

function taskBoardReducer(
  state: TaskBoardState,
  action: TaskBoardAction,
): TaskBoardState {
  switch (action.type) {
    case "UPDATE":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return taskBoardInitialState;
    default:
      return state;
  }
}

export default function TaskBoard({
  tasks,
  projectId,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
  onTaskDuplicate,
  isCompact = false,
  onCompactToggle,
}: TaskBoardProps) {
  const [drag, dispatchDrag] = useReducer(dragReducer, dragInitialState);
  const columnRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [boardState, dispatchBoard] = useReducer(
    taskBoardReducer,
    taskBoardInitialState,
  );
  const {
    showCreateModal,
    createStatus,
    hasOverflow,
    showTaskDetail,
    selectedTaskId,
  } = boardState;

  const moveTask = useMutation(api.tasks.mutations.moveTask);
  const deleteTask = useMutation(api.tasks.mutations.deleteTask);

  const handleDragStart = (e: React.DragEvent, task: any) => {
    dispatchDrag({ type: "DRAG_START", task });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragOverTask = (
    e: React.DragEvent,
    taskId: string,
    index: number,
  ) => {
    e.preventDefault();
    if (!drag.draggedTask || drag.draggedTask._id === taskId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const insertIndex = e.clientY < midpoint ? index : index + 1;

    // Find the column of the task we are dragging over
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const columnId = task.status;

    if (
      !drag.dropPosition ||
      drag.dropPosition.column !== columnId ||
      drag.dropPosition.index !== insertIndex
    ) {
      dispatchDrag({
        type: "SET_DROP_POSITION",
        position: { column: columnId, index: insertIndex },
      });
    }
  };

  const handleDragLeaveTask = () => {
    // Small delay to prevent flicker when moving between tasks
    // setTimeout(() => {
    //   setDraggedOverTask(null)
    // }, 50)
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();

    if (!drag.draggedTask) {
      dispatchDrag({ type: "DRAG_END" });
      return;
    }

    const targetPosition =
      drag.dropPosition?.column === newStatus &&
      drag.dropPosition?.index !== undefined
        ? drag.dropPosition.index
        : tasks.filter((t) => t.status === newStatus).length;

    try {
      await moveTask({
        taskId: drag.draggedTask._id,
        status: newStatus as any,
        position: targetPosition,
      });

      onTaskUpdate?.();
    } catch (error) {
      toast.error("Failed to move task");
    }

    dispatchDrag({ type: "DRAG_END" });
  };

  const getTasksByStatus = (status: string) => {
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const openCreateModal = (status: string) => {
    dispatchBoard({ type: "UPDATE", field: "createStatus", value: status });
    dispatchBoard({ type: "UPDATE", field: "showCreateModal", value: true });
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask({ taskId: taskId as any });
      toast.success("Task deleted");
      onTaskUpdate?.();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  // Check for column overflow
  useEffect(() => {
    const checkOverflow = () => {
      const newOverflowState: { [key: string]: boolean } = {};
      columns.forEach((column) => {
        const element = columnRefs.current[column.id];
        if (element) {
          newOverflowState[column.id] =
            element.scrollHeight > element.clientHeight;
        }
      });
      dispatchBoard({
        type: "UPDATE",
        field: "hasOverflow",
        value: newOverflowState,
      });
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    const timer = setTimeout(checkOverflow, 100);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      clearTimeout(timer);
    };
  }, [tasks]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-[8px] h-full">
        {columns.map((column) => (
          <TaskBoardColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={getTasksByStatus(column.id)}
            colorVar={column.colorVar}
            isCompact={isCompact}
            onTaskEdit={onTaskEdit}
            onTaskDelete={handleDeleteTask}
            onTaskDuplicate={onTaskDuplicate}
            onViewDetails={(taskId) => {
              dispatchBoard({
                type: "UPDATE",
                field: "selectedTaskId",
                value: taskId,
              });
              dispatchBoard({
                type: "UPDATE",
                field: "showTaskDetail",
                value: true,
              });
            }}
            onAddTask={openCreateModal}
            draggedTask={drag.draggedTask}
            hoveredColumn={drag.hoveredColumn}
            dropPosition={drag.dropPosition}
            onDragOver={(e) => {
              handleDragOver(e);
              dispatchDrag({ type: "SET_HOVERED_COLUMN", column: column.id });
            }}
            onDragLeave={() =>
              dispatchDrag({ type: "SET_HOVERED_COLUMN", column: null })
            }
            onDrop={(e) => handleDrop(e, column.id)}
            onDragStart={handleDragStart}
            onDragOverTask={handleDragOverTask}
            columnRef={(el) => (columnRefs.current[column.id] = el)}
            hasOverflow={hasOverflow[column.id]}
          />
        ))}
      </div>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() =>
          dispatchBoard({
            type: "UPDATE",
            field: "showCreateModal",
            value: false,
          })
        }
        projectId={projectId}
        defaultStatus={createStatus}
        onSuccess={onTaskUpdate}
      />

      {selectedTaskId && (
        <TaskDetailModal
          isOpen={showTaskDetail}
          onClose={() => {
            dispatchBoard({
              type: "UPDATE",
              field: "showTaskDetail",
              value: false,
            });
            dispatchBoard({
              type: "UPDATE",
              field: "selectedTaskId",
              value: null,
            });
          }}
          taskId={selectedTaskId}
        />
      )}
    </>
  );
}
