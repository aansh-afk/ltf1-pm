import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlineViewBoards, HiOutlineViewList, HiOutlineFilter, HiOutlineCalendar, HiOutlineViewGrid, HiOutlineSearch, HiOutlineClipboardList } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import WorkspaceSelector from '@/components/common/WorkspaceSelector'
import KanbanBoard from '@/components/features/kanban/KanbanBoard'
import TaskList from '@/components/features/task/TaskList'
import TaskCalendar from '@/components/features/task/TaskCalendar'
import TaskTable from '@/components/features/task/TaskTable'
import TaskFilters, { type TaskFilters as TaskFiltersType } from '@/components/features/task/TaskFilters'
import FilterPresets from '@/components/features/task/FilterPresets'
import { useCurrentWorkspace } from '../hooks/useCurrentWorkspace'
import clsx from 'clsx'

const defaultFilters: TaskFiltersType = {
  search: '',
  status: [],
  priority: [],
  type: [],
  assigneeIds: [],
  labels: [],
  dueDateRange: { start: null, end: null },
  createdDateRange: { start: null, end: null },
  hasTimeTracked: null,
  isOverdue: null
}

export default function TasksPage() {
  const { currentWorkspaceId, isLoading: workspaceLoading, hasWorkspaceContext, workspaces } = useCurrentWorkspace()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar' | 'table'>('board')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<TaskFiltersType>(defaultFilters)
  const [quickSearch, setQuickSearch] = useState('')

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    currentWorkspaceId ? { workspaceId: currentWorkspaceId as any } : 'skip'
  )

  // Use filtered query when filters are active, otherwise use basic query
  const hasActiveFilters = filters.search ||
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
    quickSearch

  const effectiveFilters = quickSearch ? { ...filters, search: quickSearch } : filters

  const tasks = useQuery(
    hasActiveFilters && selectedProjectId
      ? api.tasks.queries.getFilteredTasks
      : selectedProjectId
        ? api.tasks.queries.getProjectTasks
        : 'skip',
    selectedProjectId
      ? hasActiveFilters
        ? {
          projectId: selectedProjectId as any,
          search: effectiveFilters.search || undefined,
          status: effectiveFilters.status.length > 0 ? effectiveFilters.status : undefined,
          priority: effectiveFilters.priority.length > 0 ? effectiveFilters.priority : undefined,
          type: effectiveFilters.type.length > 0 ? effectiveFilters.type : undefined,
          assigneeIds: effectiveFilters.assigneeIds.length > 0 ? effectiveFilters.assigneeIds : undefined,
          labels: effectiveFilters.labels.length > 0 ? effectiveFilters.labels : undefined,
          dueDateStart: effectiveFilters.dueDateRange.start || undefined,
          dueDateEnd: effectiveFilters.dueDateRange.end || undefined,
          createdDateStart: effectiveFilters.createdDateRange.start || undefined,
          createdDateEnd: effectiveFilters.createdDateRange.end || undefined,
          hasTimeTracked: effectiveFilters.hasTimeTracked,
          isOverdue: effectiveFilters.isOverdue
        }
        : { projectId: selectedProjectId as any }
      : 'skip'
  )

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    setFilters(newFilters)
  }

  const handlePresetApply = (presetFilters: TaskFiltersType) => {
    setFilters(presetFilters)
    setQuickSearch('')
    setIsFiltersOpen(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (effectiveFilters.search) count++
    if (effectiveFilters.status.length > 0) count++
    if (effectiveFilters.priority.length > 0) count++
    if (effectiveFilters.type.length > 0) count++
    if (effectiveFilters.assigneeIds.length > 0) count++
    if (effectiveFilters.labels.length > 0) count++
    if (effectiveFilters.dueDateRange.start || effectiveFilters.dueDateRange.end) count++
    if (effectiveFilters.createdDateRange.start || effectiveFilters.createdDateRange.end) count++
    if (effectiveFilters.hasTimeTracked !== null) count++
    if (effectiveFilters.isOverdue !== null) count++
    return count
  }

  // Keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            setViewMode('board')
            break
          case 'l':
            setViewMode('list')
            break
          case 'c':
            setViewMode('calendar')
            break
          case 't':
            setViewMode('table')
            break
          case 'f':
            setIsFiltersOpen(!isFiltersOpen)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isFiltersOpen])

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show workspace selector for pages without URL workspace context
  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-primary)]">
            <HiOutlineClipboardList className="w-5 h-5 text-[var(--theme-primary)]" />
          </div>
          <h1 className="text-lg font-bold uppercase mb-2 tracking-tight text-[var(--theme-foreground)]">Select Workspace</h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-4">
            Select a workspace to view tasks.
          </p>
          <div className="bg-[var(--theme-background-secondary)] p-3 border border-[var(--theme-border)]">
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no workspaces exist
  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="border-2 border-dashed border-[var(--theme-error)]/40 p-8 text-center max-w-md w-full">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineClipboardList className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 text-[var(--theme-foreground)]">No Workspaces</h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
            Create a workspace to initialize task tracking.
          </p>
        </div>
      </div>
    )
  }

  if (projects === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="border-2 border-dashed border-[var(--theme-border)] p-8 text-center max-w-md w-full">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineClipboardList className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 text-[var(--theme-foreground)]">No Projects Found</h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-4 max-w-sm mx-auto">
            Create a project in your workspace to start tracking tasks.
          </p>
        </div>
      </div>
    )
  }

  if (!selectedProjectId && projects.length > 0) {
    setSelectedProjectId(projects[0]._id)
  }

  const currentWorkspace = workspaces?.find(w => w && w._id === currentWorkspaceId)

  return (
    <div className="flex flex-col h-screen bg-[var(--theme-background)] overflow-hidden">
      {/* Single compact toolbar */}
      <div className="flex-none z-10 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
        {/* Row 1: breadcrumb + project selector + view toggles */}
        <div className="flex items-center justify-between px-3 py-1.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <HiOutlineClipboardList className="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
            <span className="font-mono text-xs font-bold uppercase text-[var(--theme-foreground)] shrink-0">TASKS</span>
            {!hasWorkspaceContext && currentWorkspace && (
              <>
                <span className="text-[var(--theme-border)] shrink-0">/</span>
                <span className="font-mono text-[10px] uppercase text-[var(--theme-foreground-tertiary)] truncate">{currentWorkspace.name}</span>
              </>
            )}
            <span className="text-[var(--theme-border)] shrink-0">/</span>
            <div className="relative shrink-0">
              <select
                className="appearance-none pl-2 pr-6 py-0.5 bg-transparent border border-[var(--theme-border)]
                         font-mono text-[10px] uppercase font-bold text-[var(--theme-foreground)]
                         focus:border-[var(--theme-primary)] focus:outline-none transition-colors cursor-pointer max-w-[160px]"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((project: any) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[var(--theme-foreground-tertiary)]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!hasWorkspaceContext && (
              <div className="hidden md:block">
                <WorkspaceSelector size="sm" showLabel={false} />
              </div>
            )}

            {/* View Mode Toggles */}
            <div className="flex border border-[var(--theme-border)]">
              {[
                { id: 'board', icon: HiOutlineViewBoards, label: 'BOARD' },
                { id: 'list', icon: HiOutlineViewList, label: 'LIST' },
                { id: 'calendar', icon: HiOutlineCalendar, label: 'CAL' },
                { id: 'table', icon: HiOutlineViewGrid, label: 'GRID' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  className={clsx(
                    "w-7 h-7 flex items-center justify-center transition-all",
                    "border-r border-[var(--theme-border)] last:border-r-0",
                    viewMode === mode.id
                      ? "bg-[var(--theme-primary)] text-white"
                      : "text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-tertiary)]"
                  )}
                  onClick={() => setViewMode(mode.id as any)}
                  title={`${mode.label} View`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: search + filter presets + filter button */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[var(--theme-border)]">
          <div className="relative shrink-0">
            <HiOutlineSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--theme-foreground-tertiary)]" />
            <input
              type="text"
              placeholder="SEARCH..."
              className="w-[160px] pl-7 pr-2 py-1 bg-[var(--theme-background)] border border-[var(--theme-border)]
                       font-mono text-[10px] uppercase text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)]
                       focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
          </div>

          <div className="h-4 w-px bg-[var(--theme-border)] shrink-0" />

          {/* Inline filter presets */}
          {currentWorkspaceId && (
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
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
            onClick={() => setIsFiltersOpen(true)}
            title="Filter Tasks"
            className={clsx(
              "flex items-center gap-1.5 px-2 py-1 border font-mono text-[10px] uppercase font-semibold transition-colors shrink-0",
              getActiveFilterCount() > 0
                ? "bg-[var(--theme-primary)] border-[var(--theme-primary-active)] text-white"
                : "bg-transparent border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)]"
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

      {/* Task Content - Maximum area */}
      <div className="flex-1 min-h-0 p-2 overflow-hidden">
        {tasks === undefined ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--theme-border)] p-6 text-center h-full flex flex-col items-center justify-center">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
              <HiOutlineClipboardList className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-[var(--theme-foreground)] mb-0.5">
              {hasActiveFilters ? "No Matching Tasks" : "No Tasks Yet"}
            </h2>
            <p className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] max-w-sm mx-auto">
              {hasActiveFilters ? "Adjust your filters to expand the search." : "Create your first task to get started."}
            </p>
          </div>
        ) : (
          <div className="h-full">
            {viewMode === 'board' ? (
              <KanbanBoard
                tasks={tasks}
                projectId={selectedProjectId}
                onTaskUpdate={() => { }}
              />
            ) : viewMode === 'list' ? (
              <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
                <TaskList
                  tasks={tasks}
                  projectId={selectedProjectId}
                  onTaskUpdate={() => { }}
                />
              </div>
            ) : viewMode === 'calendar' ? (
              <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
                <TaskCalendar
                  tasks={tasks}
                  projectId={selectedProjectId}
                  onTaskUpdate={() => { }}
                />
              </div>
            ) : (
              <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
                <TaskTable
                  tasks={tasks}
                  projectId={selectedProjectId}
                  onTaskUpdate={() => { }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {currentWorkspaceId && (
        <TaskFilters
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          workspaceId={currentWorkspaceId}
        />
      )}
    </div>
  )
}
