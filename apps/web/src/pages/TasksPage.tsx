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
import { useShortcut } from '../contexts/ShortcutContext'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { BrutalCard, BrutalButton } from '@/components/ui'

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

  // Keyboard shortcuts integration
  useEffect(() => {
    const handleCommand = (event: CustomEvent) => {
      const { command } = event.detail

      switch (command) {
        case 'toggleTaskComplete':
          // This will be handled by individual task components
          break

        case 'editTask':
          // This will be handled by individual task components
          break

        case 'deleteTask':
          // This will be handled by individual task components
          break

        case 'assignTaskToMe':
          // This will be handled by individual task components
          break

        case 'setPriorityUrgent':
        case 'setPriorityHigh':
        case 'setPriorityMedium':
        case 'setPriorityLow':
          // These will be handled by individual task components
          break

        case 'addTaskLabel':
          // This will be handled by individual task components
          break

        case 'setTaskDueDate':
          // This will be handled by individual task components
          break
      }
    }

    const handleNewTask = () => {
      // This event should trigger the new task modal
      // The actual modal component should listen for this event
      toast.success('New task shortcut triggered')
    }

    // Keyboard shortcuts for view switching
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // View switching shortcuts
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
          case '/':
            e.preventDefault()
            // Focus search input
            const searchInput = document.querySelector('input[placeholder*="SEARCH"]') as HTMLInputElement
            searchInput?.focus()
            break
        }
      }
    }

    window.addEventListener('task-command' as any, handleCommand)
    window.addEventListener('open-new-task' as any, handleNewTask)
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('task-command' as any, handleCommand)
      window.removeEventListener('open-new-task' as any, handleNewTask)
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [isFiltersOpen])

  // Use specific shortcuts
  useShortcut('newTask', () => {
    window.dispatchEvent(new CustomEvent('open-new-task'))
  })

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
      <div className="p-8 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <BrutalCard variant="glitch" className="max-w-md w-full p-8 text-center border-2 border-[var(--theme-primary)]">
          <HiOutlineClipboardList className="w-16 h-16 mx-auto mb-6 text-[var(--theme-primary)]" />
          <h1 className="text-2xl font-bold uppercase mb-4 tracking-tight">Select Workspace</h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mb-8">
            Please select a workspace to view tasks.
          </p>
          <div className="bg-[var(--theme-background-secondary)] p-4 border border-[var(--theme-border)]">
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </BrutalCard>
      </div>
    )
  }

  // Show empty state if no workspaces exist
  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-8 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <BrutalCard variant="glitch" className="max-w-md w-full p-8 text-center border-dashed border-[var(--theme-error)]">
          <HiOutlineClipboardList className="w-16 h-16 mx-auto mb-6 text-[var(--theme-error)]" />
          <h1 className="text-2xl font-bold uppercase mb-4 tracking-tight text-[var(--theme-error)]">NO_WORKSPACES_DETECTED</h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mb-8">
            SYSTEM_HALTED: Create a workspace to initialize task matrix.
          </p>
        </BrutalCard>
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
      <div className="p-8 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <BrutalCard variant="default" className="max-w-md w-full p-8 text-center border-dashed">
          <HiOutlineClipboardList className="w-16 h-16 mx-auto mb-6 text-[var(--theme-foreground)]/20" />
          <h1 className="text-xl font-bold uppercase mb-4 tracking-tight">NO_PROJECTS_FOUND</h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mb-8">
            Initialize a project to enable task tracking protocols.
          </p>
        </BrutalCard>
      </div>
    )
  }

  if (!selectedProjectId && projects.length > 0) {
    setSelectedProjectId(projects[0]._id)
  }

  const currentWorkspace = workspaces?.find(w => w && w._id === currentWorkspaceId)

  return (
    <div className="flex flex-col h-screen bg-[var(--theme-background)] overflow-hidden">
      <div className="p-6 pb-0 flex-none z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 border-b-2 border-[var(--theme-border)] pb-6 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-4">
                <HiOutlineClipboardList className="w-8 h-8 md:w-10 md:h-10 text-[var(--theme-primary)]" />
                TASK_MATRIX
              </h1>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm text-[var(--theme-foreground)]/60 pl-2">
              {!hasWorkspaceContext && (
                <>
                  <span className="uppercase">{currentWorkspace?.name || 'WORKSPACE'}</span>
                  <span className="text-[var(--theme-primary)]">/</span>
                </>
              )}
              <span className="uppercase tracking-wide">OPERATIONAL_TASKS</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Show workspace selector for global routes */}
            {!hasWorkspaceContext && (
              <div className="hidden md:block">
                <WorkspaceSelector size="sm" showLabel={false} />
              </div>
            )}

            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                         font-mono text-sm uppercase font-bold
                         focus:border-[var(--theme-primary)] focus:outline-none transition-colors cursor-pointer min-w-[200px]"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((project: any) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[var(--theme-foreground)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <BrutalCard className="mb-6 p-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:flex-none">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-foreground)]/40" />
              <input
                type="text"
                placeholder="QUERY_TASKS..."
                className="w-full md:w-[240px] pl-9 pr-4 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                         font-mono text-xs uppercase placeholder:text-[var(--theme-foreground)]/40
                         focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <BrutalButton
              variant={getActiveFilterCount() > 0 ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIsFiltersOpen(true)}
              title="Filter Tasks"
              className="flex items-center gap-2"
            >
              <HiOutlineFilter className="w-4 h-4" />
              <span className="hidden sm:inline">FILTERS</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-[var(--theme-background)] text-[var(--theme-primary)] text-[10px] font-bold px-1.5 py-0.5 ml-1">
                  {getActiveFilterCount()}
                </span>
              )}
            </BrutalButton>
          </div>

          {/* View Mode Toggles */}
          <div className="flex bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
            {[
              { id: 'board', icon: HiOutlineViewBoards, label: 'BOARD' },
              { id: 'list', icon: HiOutlineViewList, label: 'LIST' },
              { id: 'calendar', icon: HiOutlineCalendar, label: 'CAL' },
              { id: 'table', icon: HiOutlineViewGrid, label: 'GRID' }
            ].map((mode) => (
              <button
                key={mode.id}
                className={clsx(
                  "w-10 h-10 flex items-center justify-center transition-all",
                  "border-r-2 border-[var(--theme-border)] last:border-r-0",
                  viewMode === mode.id
                    ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                    : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
                )}
                onClick={() => setViewMode(mode.id as any)}
                title={`${mode.label} View`}
              >
                <mode.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </BrutalCard>

        {/* Filter Presets */}
        {currentWorkspaceId && (
          <div className="mb-6">
            <FilterPresets
              workspaceId={currentWorkspaceId}
              currentFilters={effectiveFilters}
              onApplyPreset={handlePresetApply}
            />
          </div>
        )}
      </div>

      {/* Task Content - Flexible Area */}
      <div className="flex-1 min-h-0 px-6 pb-6 overflow-hidden">
        {tasks === undefined ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <BrutalCard variant="default" className="p-12 text-center border-dashed h-full flex flex-col items-center justify-center">
            <HiOutlineClipboardList className="w-16 h-16 mx-auto mb-6 text-[var(--theme-foreground)]/20" />
            <h2 className="text-xl font-bold uppercase mb-2">NO_TASKS_DETECTED</h2>
            <p className="font-mono text-sm text-[var(--theme-foreground)]/60">
              {hasActiveFilters ? "ADJUST_FILTERS_TO_EXPAND_SEARCH_MATRIX" : "INITIATE_NEW_TASK_SEQUENCE"}
            </p>
          </BrutalCard>
        ) : (
          <div className="h-full">
            {viewMode === 'board' ? (
              <KanbanBoard
                tasks={tasks}
                projectId={selectedProjectId}
                onTaskUpdate={() => { }}
              />
            ) : viewMode === 'list' ? (
              <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                <TaskList
                  tasks={tasks}
                  projectId={selectedProjectId}
                  onTaskUpdate={() => { }}
                />
              </div>
            ) : viewMode === 'calendar' ? (
              <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                <TaskCalendar
                  tasks={tasks}
                  projectId={selectedProjectId}
                  onTaskUpdate={() => { }}
                />
              </div>
            ) : (
              <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
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