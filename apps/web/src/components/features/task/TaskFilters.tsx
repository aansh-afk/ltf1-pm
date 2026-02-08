import { useState, useEffect, memo, useCallback, useTransition } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineBookmark,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineTag,
  HiOutlineChevronDown,
  HiOutlineCheck
} from 'react-icons/hi'
import clsx from 'clsx'
import { format } from 'date-fns'

export interface TaskFilters {
  search: string
  status: string[]
  priority: string[]
  type: string[]
  assigneeIds: string[]
  labels: string[]
  dueDateRange: {
    start: string | null
    end: string | null
  }
  createdDateRange: {
    start: string | null
    end: string | null
  }
  hasTimeTracked: boolean | null
  isOverdue: boolean | null
}

interface TaskFiltersProps {
  isOpen: boolean
  onClose: () => void
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  workspaceId: string
}

const statusOptions = [
  { value: 'backlog', label: 'BACKLOG', color: 'bg-neutral-600' },
  { value: 'todo', label: 'TO DO', color: 'bg-primary-brutalist' },
  { value: 'in_progress', label: 'IN PROGRESS', color: 'bg-[var(--theme-info)]' },
  { value: 'in_review', label: 'IN REVIEW', color: 'bg-[var(--theme-accent)]' },
  { value: 'done', label: 'DONE', color: 'bg-[var(--theme-success)]' },
  { value: 'cancelled', label: 'CANCELLED', color: 'bg-[var(--theme-error)]' }
]

const priorityOptions = [
  { value: 'urgent', label: 'URGENT', color: 'text-[var(--theme-error)]' },
  { value: 'high', label: 'HIGH', color: 'text-[var(--theme-accent)]' },
  { value: 'medium', label: 'MEDIUM', color: 'text-primary-brutalist' },
  { value: 'low', label: 'LOW', color: 'text-neutral-400' }
]

const typeOptions = [
  { value: 'feature', label: 'FEATURE', color: 'bg-[var(--theme-success)]' },
  { value: 'bug', label: 'BUG', color: 'bg-[var(--theme-error)]' },
  { value: 'improvement', label: 'IMPROVEMENT', color: 'bg-[var(--theme-info)]' },
  { value: 'task', label: 'TASK', color: 'bg-primary-brutalist' },
  { value: 'epic', label: 'EPIC', color: 'bg-[var(--theme-accent)]' }
]

const defaultFilters: TaskFilters = {
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

const TaskFiltersComponent = memo(function TaskFiltersComponent({ isOpen, onClose, filters, onFiltersChange, workspaceId }: TaskFiltersProps) {
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Get workspace members for assignee filter
  const workspaceMembers = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  // Get all unique labels from workspace tasks
  const workspaceLabels = useQuery(
    api.tasks.queries.getWorkspaceLabels,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters)
    onClose()
  }, [localFilters, onFiltersChange, onClose])

  const handleResetFilters = useCallback(() => {
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }, [onFiltersChange])

  const toggleArrayFilter = useCallback((key: keyof TaskFilters, value: string) => {
    startTransition(() => {
      setLocalFilters(prev => {
        const currentArray = prev[key] as string[]
        const newArray = currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
        return { ...prev, [key]: newArray }
      })
    })
  }, [])

  const handleBooleanFilter = useCallback((key: 'hasTimeTracked' | 'isOverdue', value: boolean | null) => {
    startTransition(() => {
      setLocalFilters(prev => ({ ...prev, [key]: value }))
    })
  }, [])

  const handleDateRangeChange = useCallback((
    rangeKey: 'dueDateRange' | 'createdDateRange',
    dateKey: 'start' | 'end',
    value: string
  ) => {
    startTransition(() => {
      setLocalFilters(prev => ({
        ...prev,
        [rangeKey]: {
          ...prev[rangeKey],
          [dateKey]: value || null
        }
      }))
    })
  }, [])

  const getActiveFilterCount = () => {
    let count = 0
    if (localFilters.search) count++
    if (localFilters.status.length > 0) count++
    if (localFilters.priority.length > 0) count++
    if (localFilters.type.length > 0) count++
    if (localFilters.assigneeIds.length > 0) count++
    if (localFilters.labels.length > 0) count++
    if (localFilters.dueDateRange.start || localFilters.dueDateRange.end) count++
    if (localFilters.createdDateRange.start || localFilters.createdDateRange.end) count++
    if (localFilters.hasTimeTracked !== null) count++
    if (localFilters.isOverdue !== null) count++
    return count
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[var(--theme-background-secondary)]/50 z-40"
        onClick={onClose}
      />
      
      {/* Filter Panel */}
      <div className="fixed right-0 top-0 h-full w-480px bg-[var(--theme-background)] border-l-4 border-[var(--theme-border)] z-50 overflow-y-auto">
        {/* Header */}
        <div className="p-[16px] border-b-2 border-[var(--theme-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6px]">
              <HiOutlineFilter className="w-20px h-20px" />
              <h2 className="font-mono text-[14px] font-semibold uppercase">FILTERS</h2>
              {getActiveFilterCount() > 0 && (
                <span className="px-[4px] py-2px bg-primary-brutalist text-event-horizon text-brutal-xs font-bold">
                  {getActiveFilterCount()}
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="brutal-hover p-[4px]"
            >
              <HiOutlineX className="w-20px h-20px" />
            </button>
          </div>
        </div>

        <div className="p-[16px] space-y-32px">
          {/* Search */}
          <div>
            <label className="block text-brutal-sm mb-[4px] uppercase">SEARCH</label>
            <div className="relative">
              <HiOutlineSearch className="absolute left-12px top-1/2 -translate-y-1/2 w-16px h-16px text-neutral-500" />
              <input
                type="text"
                placeholder="SEARCH TASKS..."
                className="w-full pl-40px pr-[8px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] 
                         font-mono text-brutal-sm uppercase placeholder:text-neutral-600
                         focus:border-primary-brutalist focus:outline-none transition-colors"
                value={localFilters.search}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'status' ? null : 'status')}
              className="flex items-center justify-between w-full text-brutal-sm mb-[4px] uppercase hover:text-primary-brutalist transition-colors"
            >
              <span>STATUS ({localFilters.status.length})</span>
              <HiOutlineChevronDown className={clsx(
                "w-16px h-16px transition-transform",
                activeSection === 'status' && "rotate-180"
              )} />
            </button>
            {activeSection === 'status' && (
              <div className="space-y-[4px]">
                {statusOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-[6px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.status.includes(option.value)}
                      onChange={() => toggleArrayFilter('status', option.value)}
                      className="w-16px h-16px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                    />
                    <div className={clsx(
                      "px-[4px] py-4px text-brutal-xs font-bold text-event-horizon",
                      option.color
                    )}>
                      {option.label}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Priority Filter */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'priority' ? null : 'priority')}
              className="flex items-center justify-between w-full text-brutal-sm mb-[4px] uppercase hover:text-primary-brutalist transition-colors"
            >
              <span>PRIORITY ({localFilters.priority.length})</span>
              <HiOutlineChevronDown className={clsx(
                "w-16px h-16px transition-transform",
                activeSection === 'priority' && "rotate-180"
              )} />
            </button>
            {activeSection === 'priority' && (
              <div className="space-y-[4px]">
                {priorityOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-[6px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.priority.includes(option.value)}
                      onChange={() => toggleArrayFilter('priority', option.value)}
                      className="w-16px h-16px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                    />
                    <span className={clsx("font-mono text-brutal-sm uppercase", option.color)}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'type' ? null : 'type')}
              className="flex items-center justify-between w-full text-brutal-sm mb-[4px] uppercase hover:text-primary-brutalist transition-colors"
            >
              <span>TYPE ({localFilters.type.length})</span>
              <HiOutlineChevronDown className={clsx(
                "w-16px h-16px transition-transform",
                activeSection === 'type' && "rotate-180"
              )} />
            </button>
            {activeSection === 'type' && (
              <div className="space-y-[4px]">
                {typeOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-[6px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.type.includes(option.value)}
                      onChange={() => toggleArrayFilter('type', option.value)}
                      className="w-16px h-16px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                    />
                    <div className={clsx(
                      "px-[4px] py-4px text-brutal-xs font-bold text-event-horizon",
                      option.color
                    )}>
                      {option.label}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Assignee Filter */}
          {workspaceMembers && workspaceMembers.length > 0 && (
            <div>
              <button
                onClick={() => setActiveSection(activeSection === 'assignee' ? null : 'assignee')}
                className="flex items-center justify-between w-full text-brutal-sm mb-[4px] uppercase hover:text-primary-brutalist transition-colors"
              >
                <span>ASSIGNEE ({localFilters.assigneeIds.length})</span>
                <HiOutlineChevronDown className={clsx(
                  "w-16px h-16px transition-transform",
                  activeSection === 'assignee' && "rotate-180"
                )} />
              </button>
              {activeSection === 'assignee' && (
                <div className="space-y-[4px]">
                  <label className="flex items-center gap-[6px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.assigneeIds.includes('unassigned')}
                      onChange={() => toggleArrayFilter('assigneeIds', 'unassigned')}
                      className="w-16px h-16px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                    />
                    <span className="font-mono text-brutal-sm text-neutral-500">UNASSIGNED</span>
                  </label>
                  {workspaceMembers.map(member => (
                    <label key={member.userId} className="flex items-center gap-[6px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localFilters.assigneeIds.includes(member.userId)}
                        onChange={() => toggleArrayFilter('assigneeIds', member.userId)}
                        className="w-16px h-16px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                      />
                      <div className="flex items-center gap-[4px]">
                        <div className="w-4 h-4 bg-primary-brutalist border border-[var(--theme-border)] flex items-center justify-center">
                          <HiOutlineUser className="w-16px h-16px text-event-horizon" />
                        </div>
                        <span className="font-mono text-brutal-sm">{member.user.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Labels Filter */}
          {workspaceLabels && workspaceLabels.length > 0 && (
            <div>
              <button
                onClick={() => setActiveSection(activeSection === 'labels' ? null : 'labels')}
                className="flex items-center justify-between w-full text-brutal-sm mb-[4px] uppercase hover:text-primary-brutalist transition-colors"
              >
                <span>LABELS ({localFilters.labels.length})</span>
                <HiOutlineChevronDown className={clsx(
                  "w-16px h-16px transition-transform",
                  activeSection === 'labels' && "rotate-180"
                )} />
              </button>
              {activeSection === 'labels' && (
                <div className="space-y-[4px]">
                  {workspaceLabels.map(label => (
                    <label key={label} className="flex items-center gap-[6px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localFilters.labels.includes(label)}
                        onChange={() => toggleArrayFilter('labels', label)}
                        className="w-16px h-16px border-2 border-[var(--theme-border)] bg-[var(--theme-background)]"
                      />
                      <div className="flex items-center gap-[4px]">
                        <HiOutlineTag className="w-16px h-16px text-primary-brutalist" />
                        <span className="font-mono text-brutal-sm">{label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Due Date Range */}
          <div>
            <button
              onClick={() => setActiveSection(activeSection === 'dueDate' ? null : 'dueDate')}
              className="flex items-center justify-between w-full text-brutal-sm mb-[4px] uppercase hover:text-primary-brutalist transition-colors"
            >
              <span>DUE DATE</span>
              <HiOutlineChevronDown className={clsx(
                "w-16px h-16px transition-transform",
                activeSection === 'dueDate' && "rotate-180"
              )} />
            </button>
            {activeSection === 'dueDate' && (
              <div className="space-y-[6px]">
                <div>
                  <label className="block text-brutal-xs mb-[2px] text-neutral-500">FROM</label>
                  <input
                    type="date"
                    className="w-full px-[8px] py-[4px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] 
                             font-mono text-brutal-sm
                             focus:border-primary-brutalist focus:outline-none transition-colors"
                    value={localFilters.dueDateRange.start || ''}
                    onChange={(e) => handleDateRangeChange('dueDateRange', 'start', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-brutal-xs mb-[2px] text-neutral-500">TO</label>
                  <input
                    type="date"
                    className="w-full px-[8px] py-[4px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] 
                             font-mono text-brutal-sm
                             focus:border-primary-brutalist focus:outline-none transition-colors"
                    value={localFilters.dueDateRange.end || ''}
                    onChange={(e) => handleDateRangeChange('dueDateRange', 'end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Special Filters */}
          <div>
            <h3 className="text-brutal-sm mb-[6px] uppercase">SPECIAL FILTERS</h3>
            <div className="space-y-[4px]">
              <div className="flex items-center gap-[6px]">
                <button
                  onClick={() => handleBooleanFilter('hasTimeTracked', localFilters.hasTimeTracked === true ? null : true)}
                  className={clsx(
                    "px-[8px] py-6px border-2 border-[var(--theme-border)] font-mono text-brutal-xs uppercase transition-colors",
                    localFilters.hasTimeTracked === true
                      ? "bg-primary-brutalist text-event-horizon"
                      : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                  )}
                >
                  HAS TIME TRACKED
                </button>
              </div>
              <div className="flex items-center gap-[6px]">
                <button
                  onClick={() => handleBooleanFilter('isOverdue', localFilters.isOverdue === true ? null : true)}
                  className={clsx(
                    "px-[8px] py-6px border-2 border-[var(--theme-border)] font-mono text-brutal-xs uppercase transition-colors",
                    localFilters.isOverdue === true
                      ? "bg-[var(--theme-error)] text-[var(--theme-foreground)]"
                      : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                  )}
                >
                  OVERDUE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 p-[16px] bg-[var(--theme-background)] border-t-2 border-[var(--theme-border)]">
          <div className="flex gap-[6px]">
            <button
              onClick={handleResetFilters}
              className="flex-1 brutal-btn-secondary"
            >
              RESET ALL
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex-1 brutal-btn"
            >
              APPLY FILTERS
            </button>
          </div>
        </div>
      </div>
    </>
  )
})

export default TaskFiltersComponent