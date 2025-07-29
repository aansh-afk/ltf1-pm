import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import {
  HiOutlineBookmark,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineCheck
} from 'react-icons/hi'
import clsx from 'clsx'
import type { TaskFilters } from './TaskFilters'

interface FilterPresetsProps {
  workspaceId: string
  currentFilters: TaskFilters
  onApplyPreset: (filters: TaskFilters) => void
}

export default function FilterPresets({ workspaceId, currentFilters, onApplyPreset }: FilterPresetsProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [presetName, setPresetName] = useState('')
  const { user: clerkUser } = useUser()

  const presets = useQuery(
    api.filterPresets.queries.getWorkspaceFilterPresets,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  const currentUser = useQuery(api.auth.users.getCurrentUser)

  const createPreset = useMutation(api.filterPresets.mutations.createFilterPreset)
  const deletePreset = useMutation(api.filterPresets.mutations.deleteFilterPreset)

  const handleCreatePreset = async () => {
    if (!presetName.trim()) return

    try {
      await createPreset({
        name: presetName.trim(),
        workspaceId: workspaceId as any,
        filters: currentFilters
      })
      setPresetName('')
      setIsCreating(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create preset')
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    try {
      await deletePreset({ presetId: presetId as any })
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete preset')
    }
  }

  const hasActiveFilters = () => {
    return currentFilters.search ||
           currentFilters.status.length > 0 ||
           currentFilters.priority.length > 0 ||
           currentFilters.type.length > 0 ||
           currentFilters.assigneeIds.length > 0 ||
           currentFilters.labels.length > 0 ||
           currentFilters.dueDateRange.start ||
           currentFilters.dueDateRange.end ||
           currentFilters.createdDateRange.start ||
           currentFilters.createdDateRange.end ||
           currentFilters.hasTimeTracked !== null ||
           currentFilters.isOverdue !== null
  }

  return (
    <div className="space-y-16px">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-brutal-sm uppercase">FILTER PRESETS</h3>
        {hasActiveFilters() && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="brutal-btn-sm flex items-center gap-4px"
          >
            <HiOutlinePlus className="w-12px h-12px" />
            SAVE
          </button>
        )}
      </div>

      {/* Create Preset Form */}
      {isCreating && (
        <div className="p-16px bg-event-horizon/10 border-2 border-basalt-border space-y-12px">
          <input
            type="text"
            placeholder="PRESET NAME..."
            className="w-full px-12px py-8px bg-carbon-plate border-2 border-basalt-border 
                     font-mono text-brutal-sm uppercase placeholder:text-neutral-600
                     focus:border-primary-brutalist focus:outline-none transition-colors"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreatePreset()
              } else if (e.key === 'Escape') {
                setIsCreating(false)
                setPresetName('')
              }
            }}
            autoFocus
          />
          <div className="flex gap-8px">
            <button
              onClick={handleCreatePreset}
              disabled={!presetName.trim()}
              className="brutal-btn-sm flex items-center gap-4px"
            >
              <HiOutlineCheck className="w-12px h-12px" />
              SAVE
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setPresetName('')
              }}
              className="brutal-btn-sm bg-neutral-600 border-neutral-600 hover:bg-neutral-700"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Preset List */}
      {presets && presets.length > 0 && (
        <div className="space-y-8px">
          {presets.map(preset => (
            <div
              key={preset._id}
              className="flex items-center justify-between p-12px bg-carbon-plate border-2 border-basalt-border hover:bg-event-horizon transition-colors"
            >
              <button
                onClick={() => onApplyPreset(preset.filters as TaskFilters)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-8px">
                  <HiOutlineBookmark className="w-16px h-16px text-primary-brutalist" />
                  <span className="font-mono text-brutal-sm uppercase">{preset.name}</span>
                </div>
                <div className="text-brutal-xs text-neutral-500 mt-4px">
                  {getPresetDescription(preset.filters as TaskFilters)}
                </div>
              </button>
              <button
                onClick={() => handleDeletePreset(preset._id)}
                className="brutal-hover p-4px text-neutral-500 hover:text-[#FF0000]"
              >
                <HiOutlineTrash className="w-14px h-14px" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Presets */}
      <div>
        <h4 className="font-mono text-brutal-xs uppercase text-neutral-500 mb-8px">QUICK FILTERS</h4>
        <div className="space-y-4px">
          <button
            onClick={() => onApplyPreset({
              ...getEmptyFilters(),
              assigneeIds: currentUser?._id ? [currentUser._id] : [],
              status: ['todo', 'in_progress']
            })}
            className="w-full text-left px-12px py-8px bg-carbon-plate border border-basalt-border hover:bg-event-horizon transition-colors"
          >
            <span className="font-mono text-brutal-xs uppercase">MY ACTIVE TASKS</span>
          </button>
          <button
            onClick={() => onApplyPreset({
              ...getEmptyFilters(),
              isOverdue: true
            })}
            className="w-full text-left px-12px py-8px bg-carbon-plate border border-basalt-border hover:bg-event-horizon transition-colors"
          >
            <span className="font-mono text-brutal-xs uppercase text-[#FF0000]">OVERDUE TASKS</span>
          </button>
          <button
            onClick={() => onApplyPreset({
              ...getEmptyFilters(),
              priority: ['urgent', 'high']
            })}
            className="w-full text-left px-12px py-8px bg-carbon-plate border border-basalt-border hover:bg-event-horizon transition-colors"
          >
            <span className="font-mono text-brutal-xs uppercase text-[#FF00FF]">HIGH PRIORITY</span>
          </button>
          <button
            onClick={() => onApplyPreset({
              ...getEmptyFilters(),
              status: ['done'],
              createdDateRange: {
                start: getDateDaysAgo(7),
                end: null
              }
            })}
            className="w-full text-left px-12px py-8px bg-carbon-plate border border-basalt-border hover:bg-event-horizon transition-colors"
          >
            <span className="font-mono text-brutal-xs uppercase text-[#00FF00]">COMPLETED THIS WEEK</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function getEmptyFilters(): TaskFilters {
  return {
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
}

function getPresetDescription(filters: TaskFilters): string {
  const parts: string[] = []
  
  if (filters.search) parts.push(`"${filters.search}"`)
  if (filters.status.length > 0) parts.push(`${filters.status.length} status`)
  if (filters.priority.length > 0) parts.push(`${filters.priority.length} priority`)
  if (filters.type.length > 0) parts.push(`${filters.type.length} type`)
  if (filters.assigneeIds.length > 0) parts.push(`${filters.assigneeIds.length} assignee`)
  if (filters.labels.length > 0) parts.push(`${filters.labels.length} labels`)
  if (filters.dueDateRange.start || filters.dueDateRange.end) parts.push('due date')
  if (filters.hasTimeTracked) parts.push('time tracked')
  if (filters.isOverdue) parts.push('overdue')
  
  return parts.length > 0 ? parts.join(', ') : 'no filters'
}

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}