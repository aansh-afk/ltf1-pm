import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlineViewBoards, HiOutlineViewList, HiOutlineFilter, HiOutlineCalendar, HiOutlineViewGrid, HiOutlineSearch } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import TaskBoard from '@/components/features/task/TaskBoard'
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
  const { currentWorkspaceId, isLoading: workspaceLoading } = useCurrentWorkspace()
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

  if (workspaceLoading) {
    return <LoadingSpinner size="lg" />
  }

  if (!currentWorkspaceId) {
    return (
      <div className="p-6">
        <EmptyState
          title="No workspace selected"
          description="Please select a workspace to view tasks"
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

  return (
    <div className="p-24px">
      <div className="flex items-center justify-between mb-24px">
        <div>
          <h1 className="text-brutal-2xl font-bold mb-16px uppercase">TASKS</h1>
          <div className="flex items-center gap-16px">
            <select
              className="px-16px py-8px bg-carbon-plate border-2 border-basalt-border 
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

        <div className="flex items-center gap-16px">
          {/* Quick Search */}
          <div className="relative">
            <HiOutlineSearch className="absolute left-12px top-1/2 -translate-y-1/2 w-16px h-16px text-neutral-500" />
            <input
              type="text"
              placeholder="QUICK SEARCH..."
              className="w-240px pl-40px pr-16px py-8px bg-event-horizon border-2 border-basalt-border 
                       font-mono text-brutal-sm uppercase placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none transition-colors"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
          </div>

          <div className="flex border-2 border-basalt-border">
            <button
              className={clsx(
                "px-16px py-8px flex items-center gap-8px",
                "font-mono text-brutal-sm uppercase transition-colors",
                "border-r-2 border-basalt-border",
                viewMode === 'board' 
                  ? "bg-primary-brutalist text-event-horizon" 
                  : "bg-carbon-plate hover:bg-event-horizon"
              )}
              onClick={() => setViewMode('board')}
            >
              <HiOutlineViewBoards className="w-16px h-16px" />
              BOARD
            </button>
            <button
              className={clsx(
                "px-16px py-8px flex items-center gap-8px",
                "font-mono text-brutal-sm uppercase transition-colors",
                viewMode === 'list' 
                  ? "bg-primary-brutalist text-event-horizon" 
                  : "bg-carbon-plate hover:bg-event-horizon"
              )}
              onClick={() => setViewMode('list')}
            >
              <HiOutlineViewList className="w-16px h-16px" />
              LIST
            </button>
            <button
              className={clsx(
                "px-16px py-8px flex items-center gap-8px",
                "font-mono text-brutal-sm uppercase transition-colors",
                "border-r-2 border-basalt-border",
                viewMode === 'calendar' 
                  ? "bg-primary-brutalist text-event-horizon" 
                  : "bg-carbon-plate hover:bg-event-horizon"
              )}
              onClick={() => setViewMode('calendar')}
            >
              <HiOutlineCalendar className="w-16px h-16px" />
              CALENDAR
            </button>
            <button
              className={clsx(
                "px-16px py-8px flex items-center gap-8px",
                "font-mono text-brutal-sm uppercase transition-colors",
                viewMode === 'table' 
                  ? "bg-primary-brutalist text-event-horizon" 
                  : "bg-carbon-plate hover:bg-event-horizon"
              )}
              onClick={() => setViewMode('table')}
            >
              <HiOutlineViewGrid className="w-16px h-16px" />
              TABLE
            </button>
          </div>
          <button 
            className={clsx(
              "brutal-btn flex items-center gap-8px",
              getActiveFilterCount() > 0 && "bg-primary-brutalist text-event-horizon"
            )}
            onClick={() => setIsFiltersOpen(true)}
          >
            <HiOutlineFilter className="w-16px h-16px" />
            FILTER
            {getActiveFilterCount() > 0 && (
              <span className="px-6px py-2px bg-event-horizon text-primary-brutalist text-brutal-xs font-bold">
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