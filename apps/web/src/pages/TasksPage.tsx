import { useReducer, useEffect, useState, useCallback } from "react";
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  HiOutlineViewBoards,
  HiOutlineViewList,
  HiOutlineFilter,
  HiOutlineCalendar,
  HiOutlineViewGrid,
  HiOutlineSearch,
  HiOutlineClipboardList,
} from "react-icons/hi";
import BulkActionBar from "@/components/features/task/BulkActionBar";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import WorkspaceSelector from "@/components/common/WorkspaceSelector";
import TaskBoard from "@/components/features/task/TaskBoard";
import TaskList from "@/components/features/task/TaskList";
import TaskCalendar from "@/components/features/task/TaskCalendar";
import TaskTable from "@/components/features/task/TaskTable";
import TaskFilters, {
  type TaskFilters as TaskFiltersType,
} from "@/components/features/task/TaskFilters";
import FilterPresets from "@/components/features/task/FilterPresets";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";
import BrutalSelect from "@/components/ui/BrutalSelect";
import clsx from "clsx";

const defaultFilters: TaskFiltersType = {
  search: "",
  status: [],
  priority: [],
  type: [],
  assigneeIds: [],
  labels: [],
  dueDateRange: { start: null, end: null },
  createdDateRange: { start: null, end: null },
  hasTimeTracked: null,
  isOverdue: null,
};

type TasksPageState = {
  selectedProjectId: string;
  viewMode: "board" | "list" | "calendar" | "table";
  isFiltersOpen: boolean;
  filters: TaskFiltersType;
  quickSearch: string;
};

type TasksPageAction =
  | { type: "SET_SELECTED_PROJECT_ID"; value: string }
  | { type: "SET_VIEW_MODE"; value: "board" | "list" | "calendar" | "table" }
  | { type: "SET_IS_FILTERS_OPEN"; value: boolean }
  | { type: "TOGGLE_FILTERS" }
  | { type: "SET_FILTERS"; value: TaskFiltersType }
  | { type: "SET_QUICK_SEARCH"; value: string }
  | { type: "APPLY_PRESET"; filters: TaskFiltersType };

const initialTasksPageState: TasksPageState = {
  selectedProjectId: "",
  viewMode: "board",
  isFiltersOpen: false,
  filters: defaultFilters,
  quickSearch: "",
};

// --- Sub-components ---

interface TasksToolbarProps {
  hasWorkspaceContext: boolean;
  currentWorkspaceName: string | undefined;
  selectedProjectId: string;
  viewMode: "board" | "list" | "calendar" | "table";
  projects: Array<{ _id: string; name: string }>;
  onProjectChange: (id: string) => void;
  onViewModeChange: (mode: "board" | "list" | "calendar" | "table") => void;
}

function TasksToolbar({
  hasWorkspaceContext,
  currentWorkspaceName,
  selectedProjectId,
  viewMode,
  projects,
  onProjectChange,
  onViewModeChange,
}: TasksToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <HiOutlineClipboardList className="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
        <span className="font-mono text-xs font-bold uppercase text-[var(--theme-foreground)] shrink-0">
          TASKS
        </span>
        {!hasWorkspaceContext && currentWorkspaceName && (
          <>
            <span className="text-[var(--theme-border)] shrink-0">/</span>
            <span className="font-mono text-[10px] uppercase text-[var(--theme-foreground-tertiary)] truncate">
              {currentWorkspaceName}
            </span>
          </>
        )}
        <span className="text-[var(--theme-border)] shrink-0">/</span>
        <BrutalSelect
          value={selectedProjectId}
          onChange={(v) => onProjectChange(v)}
          options={projects.map((project) => ({
            value: project._id,
            label: project.name,
          }))}
          compact
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!hasWorkspaceContext && (
          <div className="hidden md:block">
            <WorkspaceSelector size="sm" showLabel={false} />
          </div>
        )}

        <div className="flex border border-[var(--theme-border)]">
          {[
            { id: "board", icon: HiOutlineViewBoards, label: "BOARD" },
            { id: "list", icon: HiOutlineViewList, label: "LIST" },
            { id: "calendar", icon: HiOutlineCalendar, label: "CALENDAR" },
            { id: "table", icon: HiOutlineViewGrid, label: "TABLE" },
          ].map((mode) => (
            <button
              key={mode.id}
              className={clsx(
                "h-7 px-2 flex items-center gap-1 transition-all font-mono text-[9px] uppercase tracking-wider",
                "border-r border-[var(--theme-border)] last:border-r-0",
                viewMode === mode.id
                  ? "bg-[var(--theme-primary)] text-white font-bold"
                  : "text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-tertiary)]",
              )}
              onClick={() => onViewModeChange(mode.id as "board" | "list" | "calendar" | "table")}
              title={`${mode.label} View`}
            >
              <mode.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TaskContentAreaProps {
  tasks: Array<{
    _id: Id<"tasks">;
    title: string;
    number: number;
    status: string;
    priority: string;
    type: string;
    key?: string;
    dueDate?: number;
    startDate?: number;
    description?: string;
    labels?: string[];
    assignees?: Array<{ _id: string; name: string; avatarUrl?: string }>;
    assigneeIds?: string[];
    assigneeId?: string;
    assigneeName?: string;
    reporter?: { name: string };
    estimate?: { points?: number; hours?: number };
    project?: { key: string };
    position: number;
    createdAt: number;
    projectId: Id<"projects">;
    [key: string]: unknown;
  }> | undefined;
  hasActiveFilters: boolean;
  viewMode: "board" | "list" | "calendar" | "table";
  selectedProjectId: string;
  selectedTaskIds: Set<Id<"tasks">>;
  onToggleTask: (id: Id<"tasks">) => void;
  onToggleAll: (allIds: Id<"tasks">[]) => void;
}

function TaskContentArea({
  tasks,
  hasActiveFilters,
  viewMode,
  selectedProjectId,
  selectedTaskIds,
  onToggleTask,
  onToggleAll,
}: TaskContentAreaProps) {
  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="border-2 border-dashed border-[var(--theme-border)] p-6 text-center h-full flex flex-col items-center justify-center">
        <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
          <HiOutlineClipboardList className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-[var(--theme-foreground)] mb-0.5">
          {hasActiveFilters ? "No Matching Tasks" : "No Tasks Yet"}
        </h2>
        <p className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] max-w-sm mx-auto">
          {hasActiveFilters
            ? "Adjust your filters to expand the search."
            : "Create your first task to get started."}
        </p>
      </div>
    );
  }

  const allTaskIds = tasks.map((t) => t._id);
  const allSelected = tasks.length > 0 && selectedTaskIds.size === tasks.length;

  return (
    <div className="h-full flex flex-col">
      {/* Select-all bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-[var(--theme-border)] bg-[var(--theme-background-secondary)] shrink-0">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => onToggleAll(allTaskIds)}
          className="w-4 h-4 accent-[#6366F1] cursor-pointer"
          aria-label="Select all tasks"
        />
        <span className="font-mono text-[10px] uppercase text-[var(--theme-foreground-tertiary)]">
          {selectedTaskIds.size > 0
            ? `${selectedTaskIds.size} / ${tasks.length}`
            : "SELECT ALL"}
        </span>
        {/* Per-task quick selection chips */}
        {tasks.length <= 50 && (
          <div
            className="flex items-center gap-1 ml-2 overflow-x-auto scrollbar-hide flex-1"
            style={{ scrollbarWidth: "none" }}
          >
            {tasks.map((t) => (
              <button
                key={t._id}
                onClick={() => onToggleTask(t._id)}
                className={clsx(
                  "shrink-0 px-1.5 py-0.5 font-mono text-[9px] uppercase border transition-colors",
                  selectedTaskIds.has(t._id)
                    ? "border-[#6366F1] bg-[#6366F1]/20 text-[#6366F1]"
                    : "border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)] hover:border-[var(--theme-foreground-secondary)]",
                )}
                title={t.title}
              >
                #{t.number}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {viewMode === "board" ? (
          <TaskBoard
            tasks={tasks}
            projectId={selectedProjectId}
            onTaskUpdate={() => {}}
          />
        ) : viewMode === "list" ? (
          <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
            <TaskList
              tasks={tasks}
              projectId={selectedProjectId}
              onTaskUpdate={() => {}}
            />
          </div>
        ) : viewMode === "calendar" ? (
          <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
            <TaskCalendar
              tasks={tasks}
              projectId={selectedProjectId}
              onTaskUpdate={() => {}}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
            <TaskTable
              tasks={tasks}
              projectId={selectedProjectId}
              onTaskUpdate={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---

function tasksPageReducer(
  state: TasksPageState,
  action: TasksPageAction,
): TasksPageState {
  switch (action.type) {
    case "SET_SELECTED_PROJECT_ID":
      return { ...state, selectedProjectId: action.value };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.value };
    case "SET_IS_FILTERS_OPEN":
      return { ...state, isFiltersOpen: action.value };
    case "TOGGLE_FILTERS":
      return { ...state, isFiltersOpen: !state.isFiltersOpen };
    case "SET_FILTERS":
      return { ...state, filters: action.value };
    case "SET_QUICK_SEARCH":
      return { ...state, quickSearch: action.value };
    case "APPLY_PRESET":
      return {
        ...state,
        filters: action.filters,
        quickSearch: "",
        isFiltersOpen: false,
      };
    default:
      return state;
  }
}

export default function TasksPage() {
  const {
    currentWorkspaceId,
    isLoading: workspaceLoading,
    hasWorkspaceContext,
    workspaces,
  } = useCurrentWorkspace();
  const [state, dispatch] = useReducer(tasksPageReducer, initialTasksPageState);
  const { selectedProjectId, viewMode, isFiltersOpen, filters, quickSearch } =
    state;

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<Id<"tasks">>>(
    new Set(),
  );
  const bulkUpdate = useMutation(api.tasks.mutations.bulkUpdateTasks);
  const bulkDelete = useMutation(api.tasks.mutations.bulkDeleteTasks);

  const handleToggleTask = useCallback((id: Id<"tasks">) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((allIds: Id<"tasks">[]) => {
    setSelectedTaskIds((prev) => {
      if (prev.size === allIds.length) return new Set();
      return new Set(allIds);
    });
  }, []);

  const handleClearSelection = useCallback(
    () => setSelectedTaskIds(new Set()),
    [],
  );

  const handleBulkStatusChange = useCallback(
    async (status: string) => {
      const ids = Array.from(selectedTaskIds);
      await bulkUpdate({ taskIds: ids, updates: { status: status as "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled" } });
      setSelectedTaskIds(new Set());
    },
    [selectedTaskIds, bulkUpdate],
  );

  const handleBulkPriorityChange = useCallback(
    async (priority: string) => {
      const ids = Array.from(selectedTaskIds);
      await bulkUpdate({
        taskIds: ids,
        updates: { priority: priority as "urgent" | "high" | "medium" | "low" },
      });
      setSelectedTaskIds(new Set());
    },
    [selectedTaskIds, bulkUpdate],
  );

  const handleBulkDelete = useCallback(async () => {
    if (
      !confirm(`Delete ${selectedTaskIds.size} task(s)? This cannot be undone.`)
    )
      return;
    const ids = Array.from(selectedTaskIds);
    await bulkDelete({ taskIds: ids });
    setSelectedTaskIds(new Set());
  }, [selectedTaskIds, bulkDelete]);

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    currentWorkspaceId ? { workspaceId: currentWorkspaceId as Id<"workspaces"> } : "skip",
  );

  // Use filtered query when filters are active, otherwise use basic query
  const hasActiveFilters =
    filters.search ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.type.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.labels.length > 0 ||
    filters.dueDateRange.start ||
    filters.dueDateRange.end ||
    filters.createdDateRange.start ||
    filters.createdDateRange.end ||
    filters.hasTimeTracked !== null ||
    filters.isOverdue !== null ||
    quickSearch;

  const effectiveFilters = quickSearch
    ? { ...filters, search: quickSearch }
    : filters;

  const tasks = useQuery(
    hasActiveFilters && selectedProjectId
      ? api.tasks.queries.getFilteredTasks
      : selectedProjectId
        ? api.tasks.queries.getProjectTasks
        : "skip",
    selectedProjectId
      ? hasActiveFilters
        ? {
            projectId: selectedProjectId as Id<"projects">,
            search: effectiveFilters.search || undefined,
            status:
              effectiveFilters.status.length > 0
                ? effectiveFilters.status
                : undefined,
            priority:
              effectiveFilters.priority.length > 0
                ? effectiveFilters.priority
                : undefined,
            type:
              effectiveFilters.type.length > 0
                ? effectiveFilters.type
                : undefined,
            assigneeIds:
              effectiveFilters.assigneeIds.length > 0
                ? effectiveFilters.assigneeIds
                : undefined,
            labels:
              effectiveFilters.labels.length > 0
                ? effectiveFilters.labels
                : undefined,
            dueDateStart: effectiveFilters.dueDateRange.start || undefined,
            dueDateEnd: effectiveFilters.dueDateRange.end || undefined,
            createdDateStart:
              effectiveFilters.createdDateRange.start || undefined,
            createdDateEnd: effectiveFilters.createdDateRange.end || undefined,
            hasTimeTracked: effectiveFilters.hasTimeTracked,
            isOverdue: effectiveFilters.isOverdue,
          }
        : { projectId: selectedProjectId as Id<"projects"> }
      : "skip",
  );

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    dispatch({ type: "SET_FILTERS", value: newFilters });
  };

  const handlePresetApply = (presetFilters: TaskFiltersType) => {
    dispatch({ type: "APPLY_PRESET", filters: presetFilters });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (effectiveFilters.search) count++;
    if (effectiveFilters.status.length > 0) count++;
    if (effectiveFilters.priority.length > 0) count++;
    if (effectiveFilters.type.length > 0) count++;
    if (effectiveFilters.assigneeIds.length > 0) count++;
    if (effectiveFilters.labels.length > 0) count++;
    if (
      effectiveFilters.dueDateRange.start ||
      effectiveFilters.dueDateRange.end
    )
      count++;
    if (
      effectiveFilters.createdDateRange.start ||
      effectiveFilters.createdDateRange.end
    )
      count++;
    if (effectiveFilters.hasTimeTracked !== null) count++;
    if (effectiveFilters.isOverdue !== null) count++;
    return count;
  };

  // Keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const isEditableElement = Boolean(
        target?.isContentEditable ||
          target?.closest(
            'input, textarea, select, [contenteditable="true"], [role="textbox"]',
          ),
      );
      const hasOpenModal = Boolean(
        document.querySelector('[role="dialog"][aria-modal="true"]'),
      );

      if (isEditableElement || hasOpenModal) {
        return;
      }

      if (e.key === "Escape" && selectedTaskIds.size > 0) {
        setSelectedTaskIds(new Set());
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            dispatch({ type: "SET_VIEW_MODE", value: "board" });
            break;
          case "l":
            dispatch({ type: "SET_VIEW_MODE", value: "list" });
            break;
          case "c":
            dispatch({ type: "SET_VIEW_MODE", value: "calendar" });
            break;
          case "t":
            dispatch({ type: "SET_VIEW_MODE", value: "table" });
            break;
          case "f":
            dispatch({ type: "TOGGLE_FILTERS" });
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [selectedTaskIds.size]);

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show workspace selector for pages without URL workspace context
  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-primary)]">
            <HiOutlineClipboardList className="w-5 h-5 text-[var(--theme-primary)]" />
          </div>
          <h1 className="text-lg font-bold uppercase mb-2 tracking-tight text-[var(--theme-foreground)]">
            Select Workspace
          </h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-4">
            Select a workspace to view tasks.
          </p>
          <div className="bg-[var(--theme-background-secondary)] p-3 border border-[var(--theme-border)]">
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no workspaces exist
  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="border-2 border-dashed border-[var(--theme-error)]/40 p-8 text-center max-w-md w-full">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineClipboardList className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 text-[var(--theme-foreground)]">
            No Workspaces
          </h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
            Create a workspace to initialize task tracking.
          </p>
        </div>
      </div>
    );
  }

  if (projects === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="border-2 border-dashed border-[var(--theme-border)] p-8 text-center max-w-md w-full">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineClipboardList className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 text-[var(--theme-foreground)]">
            No Projects Found
          </h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-4 max-w-sm mx-auto">
            Create a project in your workspace to start tracking tasks.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedProjectId && projects.length > 0) {
    dispatch({ type: "SET_SELECTED_PROJECT_ID", value: projects[0]._id });
  }

  const currentWorkspace = workspaces?.find(
    (w) => w && w._id === currentWorkspaceId,
  );

  return (
    <ErrorBoundary>
    <div className="flex flex-col h-screen bg-[var(--theme-background)] overflow-hidden">
      {/* Single compact toolbar */}
      <div className="flex-none z-10 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
        {/* Row 1: breadcrumb + project selector + view toggles */}
        <TasksToolbar
          hasWorkspaceContext={hasWorkspaceContext}
          currentWorkspaceName={currentWorkspace?.name}
          selectedProjectId={selectedProjectId}
          viewMode={viewMode}
          projects={projects}
          onProjectChange={(id) =>
            dispatch({ type: "SET_SELECTED_PROJECT_ID", value: id })
          }
          onViewModeChange={(mode) =>
            dispatch({ type: "SET_VIEW_MODE", value: mode })
          }
        />

        {/* Row 2: search + filter presets + filter button */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[var(--theme-border)]">
          <div className="relative shrink-0">
            <HiOutlineSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--theme-foreground-tertiary)]" />
            <input
              type="text"
              placeholder="SEARCH..."
              aria-label="Quick search tasks"
              className="w-[160px] pl-7 pr-2 py-1 bg-[var(--theme-background)] border border-[var(--theme-border)]
                       font-mono text-[10px] uppercase text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)]
                       focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
              value={quickSearch}
              onChange={(e) =>
                dispatch({ type: "SET_QUICK_SEARCH", value: e.target.value })
              }
            />
          </div>

          <div className="h-4 w-px bg-[var(--theme-border)] shrink-0" />

          {/* Inline filter presets */}
          {currentWorkspaceId && (
            <div
              className="flex-1 min-w-0 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              <FilterPresets
                workspaceId={currentWorkspaceId}
                currentFilters={effectiveFilters}
                onApplyPreset={handlePresetApply}
              />
            </div>
          )}

          <div className="h-4 w-px bg-[var(--theme-border)] shrink-0" />

          {/* Filter Button */}
          <button
            onClick={() =>
              dispatch({ type: "SET_IS_FILTERS_OPEN", value: true })
            }
            title="Filter Tasks"
            className={clsx(
              "flex items-center gap-1.5 px-2 py-1 border font-mono text-[10px] uppercase font-semibold transition-colors shrink-0",
              getActiveFilterCount() > 0
                ? "bg-[var(--theme-primary)] border-[var(--theme-primary-active)] text-white"
                : "bg-transparent border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)]",
            )}
          >
            <HiOutlineFilter className="w-3 h-3" />
            <span className="hidden sm:inline">FILTER</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-[var(--theme-background)] text-[var(--theme-primary)] text-[9px] font-bold px-1 py-px">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter info bar — visible when filters are active */}
      {hasActiveFilters && tasks !== undefined && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--theme-primary)]/5 border-b border-[var(--theme-primary)]/20 shrink-0">
          <span className="font-mono text-[10px] text-[var(--theme-foreground-secondary)]">
            SHOWING{" "}
            <span className="text-[var(--theme-primary)] font-bold">
              {tasks.length}
            </span>{" "}
            TASK{tasks.length !== 1 ? "S" : ""}
            {getActiveFilterCount() > 0 && (
              <> WITH <span className="text-[var(--theme-primary)] font-bold">{getActiveFilterCount()}</span> FILTER{getActiveFilterCount() !== 1 ? "S" : ""}</>
            )}
          </span>
          <button
            onClick={() => {
              dispatch({ type: "SET_FILTERS", value: defaultFilters });
              dispatch({ type: "SET_QUICK_SEARCH", value: "" });
            }}
            className="font-mono text-[9px] text-[var(--theme-error)] hover:text-[var(--theme-foreground)] transition-colors uppercase tracking-wider"
          >
            CLEAR ALL
          </button>
        </div>
      )}

      {/* Task Content - Maximum area */}
      <div className="flex-1 min-h-0 p-2 overflow-hidden">
        <TaskContentArea
          tasks={tasks}
          hasActiveFilters={!!hasActiveFilters}
          viewMode={viewMode}
          selectedProjectId={selectedProjectId}
          selectedTaskIds={selectedTaskIds}
          onToggleTask={handleToggleTask}
          onToggleAll={handleToggleAll}
        />
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTaskIds.size}
        selectedIds={Array.from(selectedTaskIds)}
        onClearSelection={handleClearSelection}
        onStatusChange={handleBulkStatusChange}
        onPriorityChange={handleBulkPriorityChange}
        onDelete={handleBulkDelete}
      />

      {/* Filter Panel */}
      {currentWorkspaceId && (
        <TaskFilters
          isOpen={isFiltersOpen}
          onClose={() =>
            dispatch({ type: "SET_IS_FILTERS_OPEN", value: false })
          }
          filters={filters}
          onFiltersChange={handleFiltersChange}
          workspaceId={currentWorkspaceId}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
