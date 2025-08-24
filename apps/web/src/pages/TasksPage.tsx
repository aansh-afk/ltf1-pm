import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlineViewBoards, HiOutlineViewList, HiOutlineFilter, HiOutlineCalendar, HiOutlineViewGrid, HiOutlineSearch } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import WorkspaceSelector from '@/components/common/WorkspaceSelector'
import TaskBoard from '@/components/features/task/TaskBoard'
import TaskList from '@/components/features/task/TaskList'
import TaskCalendar from '@/components/features/task/TaskCalendar'
import TaskTable from '@/components/features/task/TaskTable'
import TaskFilters, { type TaskFilters as TaskFiltersType } from '@/components/features/task/TaskFilters'
import FilterPresets from '@/components/features/task/FilterPresets'
import { useCurrentWorkspace } from '../hooks/useCurrentWorkspace'
import { useShortcut } from '../contexts/ShortcutContext'
import clsx from 'clsx'
import toast from 'react-hot-toast'

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
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show workspace selector for pages without URL workspace context
  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-24px">
        <div className="max-w-md mx-auto">
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-32px">
            <h1 className="text-brutal-lg font-bold mb-16px">SELECT WORKSPACE</h1>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mb-24px">
              Choose a workspace to view and manage tasks.
            </p>
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no workspaces exist
  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-24px">
        <EmptyState
          title="NO WORKSPACES FOUND"
          description="Create a workspace first to organize your tasks."
        />
      </div>
    )
  }

  if (projects === undefined) {
    return <LoadingSpinner size="lg" />
  }

  if (projects.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No projects yet"
          description="Create a project first to start managing tasks"
        />
      </div>
    )
  }

  if (!selectedProjectId && projects.length > 0) {
    setSelectedProjectId(projects[0]._id)
  }

  const currentWorkspace = workspaces?.find(w => w._id === currentWorkspaceId)

  return (
    <div className="p-24px">
      <div className="flex items-center justify-between mb-24px">
        <div>
          <div className="flex items-center gap-16px mb-8px">
            <h1 className="text-brutal-2xl font-bold uppercase">TASKS</h1>
            {!hasWorkspaceContext && (
              <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                IN: {currentWorkspace?.name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-16px">
            {/* Show workspace selector for global routes */}
            {!hasWorkspaceContext && (
              <WorkspaceSelector size="sm" showLabel={false} />
            )}
            
            <select
              className="px-16px py-8px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-sm uppercase
                       focus:border-primary-brutalist focus:outline-none transition-colors"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((project: any) => (
                <option key={project._id} value={project._id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-8px flex-wrap">
          {/* Compact Search */}
          <div className="relative">
            <HiOutlineSearch className="absolute left-6px top-1/2 -translate-y-1/2 w-10px h-10px text-neutral-500" />
            <input
              type="text"
              placeholder="SEARCH..."
              className="w-120px h-[24px] pl-20px pr-4px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] 
                       font-mono text-[10px] uppercase placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none transition-colors"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
          </div>

          {/* Compact View Mode Buttons */}
          <div className="flex border border-[var(--theme-border)]">
            <button
              className={clsx(
                "w-[24px] h-[24px] flex items-center justify-center transition-colors",
                "border-r border-[var(--theme-border)]",
                viewMode === 'board' 
                  ? "bg-primary-brutalist text-event-horizon" 
                  : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
              )}
              onClick={() => setViewMode('board')}
              title="Board View"
            >
              <HiOutlineViewBoards className="w-10px h-10px" />
            </button>
            <button
              className={clsx(
                "w-[24px] h-[24px] flex items-center justify-center transition-colors",
                "border-r border-[var(--theme-border)]",
                viewMode === 'list' 
                  ? "bg-primary-brutalist text-event-horizon" 
                  : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
              )}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <HiOutlineViewList className="w-10px h-10px" />
            </button>
            <button
              className={clsx(
                "w-[24px] h-[24px] flex items-center justify-center transition-colors",
                "border-r border-[var(--theme-border)]",
                viewMode === 'calendar' 
                  ? "bg-primary-brutalist text-event-horizon" 
                  : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
              )}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <HiOutlineCalendar className="w-10px h-10px" />
            </button>
            <button
              className={clsx(
                "w-[24px] h-[24px] flex items-center justify-center transition-colors",
                viewMode === 'table' 
                  ? "bg-primary-brutalist text-event-horizon" 
                  : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
              )}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <HiOutlineViewGrid className="w-10px h-10px" />
            </button>
          </div>
          {/* Compact Filter Button */}
          <button 
            className={clsx(
              "px-4px h-[24px] border border-[var(--theme-border)] flex items-center gap-2px transition-colors",
              getActiveFilterCount() > 0 
                ? "bg-primary-brutalist text-event-horizon" 
                : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
            )}
            onClick={() => setIsFiltersOpen(true)}
            title="Filter Tasks"
          >
            <HiOutlineFilter className="w-10px h-10px" />
            <span className="font-mono text-[10px] uppercase">FILTER</span>
            {getActiveFilterCount() > 0 && (
              <span className="w-[12px] h-[12px] bg-[var(--theme-error)] text-white text-[8px] flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Presets Bar */}
      {currentWorkspaceId && (
        <div className="mb-24px">
          <FilterPresets
            workspaceId={currentWorkspaceId}
            currentFilters={effectiveFilters}
            onApplyPreset={handlePresetApply}
          />
        </div>
      )}

      {tasks === undefined ? (
        <LoadingSpinner size="lg" />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create your first task to get started"
        />
      ) : viewMode === 'board' ? (
        <TaskBoard
          tasks={tasks}
          projectId={selectedProjectId}
          onTaskUpdate={() => {}}
        />
      ) : viewMode === 'list' ? (
        <TaskList
          tasks={tasks}
          projectId={selectedProjectId}
          onTaskUpdate={() => {}}
        />
      ) : viewMode === 'calendar' ? (
        <TaskCalendar
          tasks={tasks}
          projectId={selectedProjectId}
          onTaskUpdate={() => {}}
        />
      ) : (
        <TaskTable
          tasks={tasks}
          projectId={selectedProjectId}
          onTaskUpdate={() => {}}
        />
      )}

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