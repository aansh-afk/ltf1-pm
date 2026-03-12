import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
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

// --- Sub-components ---

interface FilterTierButtonsProps {
  currentUserId: string | undefined
  hasActiveFilters: boolean
  isCreating: boolean
  onApplyPreset: (filters: TaskFilters) => void
  onStartCreating: () => void
}

function FilterTierButtons({ currentUserId, hasActiveFilters, isCreating, onApplyPreset, onStartCreating }: FilterTierButtonsProps) {
  return (
    <div className="flex items-center gap-1 max-w-full overflow-x-auto md:overflow-x-visible scrollbar-hide"
         style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Tier 1: Primary Filters */}
      <div className="flex items-center gap-[2px] flex-shrink-0">
        <button
          onClick={() => onApplyPreset(getEmptyFilters())}
          className="h-[22px] px-2 border border-[var(--theme-border)] bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase transition-colors"
          title="Show all tasks"
        >
          ALL
        </button>
        <button
          onClick={() => onApplyPreset({
            ...getEmptyFilters(),
            assigneeIds: currentUserId ? [currentUserId] : []
          })}
          className="h-[22px] px-2 border border-[var(--theme-border)] bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase transition-colors"
          title="Show only my tasks"
        >
          MINE
        </button>
        <button
          onClick={() => onApplyPreset({
            ...getEmptyFilters(),
            assigneeIds: ['unassigned']
          })}
          className="h-[22px] px-2 border border-[var(--theme-border)] bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase transition-colors"
          title="Show unassigned tasks"
        >
          NONE
        </button>
      </div>

      <div className="w-[1px] h-[16px] bg-[var(--theme-border)] flex-shrink-0" />

      {/* Tier 2: Status Filters */}
      <div className="flex items-center gap-[2px] flex-shrink-0">
        <button
          onClick={() => onApplyPreset({
            ...getEmptyFilters(),
            status: ['in_progress']
          })}
          className="h-[22px] px-2 border border-[var(--theme-border)] bg-blue-500/20 hover:bg-blue-500/30 font-mono text-[9px] uppercase transition-colors"
          title="In progress tasks"
        >
          WIP
        </button>
        <button
          onClick={() => onApplyPreset({
            ...getEmptyFilters(),
            status: ['blocked']
          })}
          className="h-[22px] px-2 border border-[var(--theme-border)] bg-red-500/20 hover:bg-red-500/30 font-mono text-[9px] uppercase transition-colors"
          title="Blocked tasks"
        >
          BLOCK
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
          className="h-[22px] px-2 border border-[var(--theme-border)] bg-green-500/20 hover:bg-green-500/30 font-mono text-[9px] uppercase transition-colors"
          title="Recently completed"
        >
          DONE
        </button>
      </div>

      <div className="w-[1px] h-[16px] bg-[var(--theme-border)] flex-shrink-0" />

      {/* Tier 2.5: Priority Filters */}
      <div className="flex items-center gap-[2px] flex-shrink-0">
        <button
          onClick={() => onApplyPreset({
            ...getEmptyFilters(),
            isOverdue: true
          })}
          className="h-[22px] px-2 border border-red-600 bg-red-600 text-white hover:bg-red-700 font-mono text-[9px] uppercase transition-colors"
          title="Overdue tasks"
        >
          !DUE
        </button>
        <button
          onClick={() => onApplyPreset({
            ...getEmptyFilters(),
            priority: ['urgent', 'high']
          })}
          className="h-[22px] px-2 border border-orange-500 bg-orange-500 text-white hover:bg-orange-600 font-mono text-[9px] uppercase transition-colors"
          title="High priority tasks"
        >
          !PRI
        </button>
      </div>

      {/* Tier 3: Advanced Options */}
      <details className="relative flex-shrink-0 ml-auto">
        <summary className="h-[22px] px-2 border border-[var(--theme-border)] bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase cursor-pointer transition-colors list-none flex items-center gap-1">
          MORE
          <span className="text-[7px]">▼</span>
        </summary>
        <div className="absolute top-[24px] right-0 z-10 bg-[var(--theme-background)] border border-[var(--theme-border)] shadow-lg min-w-[120px] p-1">
          <button
            onClick={() => onApplyPreset({
              ...getEmptyFilters(),
              dueDateRange: {
                start: new Date(),
                end: getDateDaysAgo(-7)
              }
            })}
            className="w-full h-[22px] px-2 text-left hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase transition-colors"
          >
            DUE THIS WEEK
          </button>
          <button
            onClick={() => onApplyPreset({
              ...getEmptyFilters(),
              createdDateRange: {
                start: getDateDaysAgo(1),
                end: null
              }
            })}
            className="w-full h-[22px] px-2 text-left hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase transition-colors"
          >
            CREATED TODAY
          </button>
          <button
            onClick={() => onApplyPreset({
              ...getEmptyFilters(),
              hasTimeTracked: true
            })}
            className="w-full h-[22px] px-2 text-left hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase transition-colors"
          >
            TIME TRACKED
          </button>
        </div>
      </details>

      {hasActiveFilters && !isCreating && (
        <button
          onClick={onStartCreating}
          className="h-[22px] px-2 ml-1 border border-primary-brutalist bg-primary-brutalist text-event-horizon hover:bg-opacity-90 font-mono text-[9px] uppercase transition-colors flex-shrink-0"
          title="Save current filter"
        >
          +
        </button>
      )}
    </div>
  )
}

interface SavePresetFormProps {
  presetName: string
  onNameChange: (name: string) => void
  onSave: () => void
  onCancel: () => void
}

function SavePresetForm({ presetName, onNameChange, onSave, onCancel }: SavePresetFormProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--theme-background-secondary)]/5 border border-[var(--theme-border)]">
      <input
        type="text"
        placeholder="NAME..."
        aria-label="Preset name"
        className="flex-1 min-w-[60px] px-2 h-[20px] bg-[var(--theme-background)] border border-[var(--theme-border)]
                 font-mono text-[9px] uppercase placeholder:text-neutral-600
                 focus:border-primary-brutalist focus:outline-none transition-colors"
        value={presetName}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave()
          } else if (e.key === 'Escape') {
            onCancel()
          }
        }}
      />
      <button
        onClick={onSave}
        disabled={!presetName.trim()}
        className="h-[20px] px-2 border border-green-600 bg-green-600 text-white hover:bg-green-700 font-mono text-[9px] uppercase disabled:opacity-50 transition-colors"
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        className="h-[20px] px-2 border border-[var(--theme-border)] bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

interface SavedPresetsRowProps {
  presets: Array<{ _id: string; name: string; filters: unknown }>
  onApplyPreset: (filters: TaskFilters) => void
  onDeletePreset: (presetId: string) => void
}

function SavedPresetsRow({ presets, onApplyPreset, onDeletePreset }: SavedPresetsRowProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[8px] uppercase text-neutral-500 mr-1">SAVED:</span>
      {presets.slice(0, 4).map(preset => (
        <div key={preset._id} className="flex items-center group">
          <button
            onClick={() => onApplyPreset(preset.filters as TaskFilters)}
            className="h-[20px] px-2 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase truncate max-w-[60px] transition-colors"
            title={preset.name}
          >
            {preset.name}
          </button>
          <button
            onClick={() => onDeletePreset(preset._id)}
            className="h-[20px] w-[16px] -ml-[1px] border border-[var(--theme-border)] bg-[var(--theme-background)] opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"
            title="Delete"
          >
            <HiOutlineTrash className="w-[7px] h-[7px]" />
          </button>
        </div>
      ))}
      {presets.length > 4 && (
        <details className="relative inline-block">
          <summary className="h-[20px] px-2 border border-[var(--theme-border)] bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)] font-mono text-[9px] uppercase cursor-pointer list-none transition-colors">
            +{presets.length - 4}
          </summary>
          <div className="absolute top-[22px] left-0 z-10 bg-[var(--theme-background)] border border-[var(--theme-border)] shadow-lg min-w-[100px] p-1">
            {presets.slice(4).map(preset => (
              <div key={preset._id} className="flex items-center justify-between hover:bg-[var(--theme-background-secondary)] px-1">
                <button
                  onClick={() => onApplyPreset(preset.filters as TaskFilters)}
                  className="flex-1 text-left h-[20px] font-mono text-[9px] uppercase truncate"
                >
                  {preset.name}
                </button>
                <button
                  onClick={() => onDeletePreset(preset._id)}
                  className="w-[16px] h-[16px] flex items-center justify-center text-neutral-500 hover:text-red-600"
                >
                  <HiOutlineTrash className="w-[7px] h-[7px]" />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// --- Main Component ---

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
    workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : 'skip'
  )

  const currentUser = useQuery(api.auth.users.getCurrentUser)

  const createPreset = useMutation(api.filterPresets.mutations.createFilterPreset)
  const deletePreset = useMutation(api.filterPresets.mutations.deleteFilterPreset)

  const handleCreatePreset = async () => {
    if (!presetName.trim()) return

    try {
      await createPreset({
        name: presetName.trim(),
        workspaceId: workspaceId as Id<"workspaces">,
        filters: currentFilters
      })
      setPresetName('')
      setIsCreating(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create preset'
      toast.error(message)
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    try {
      await deletePreset({ presetId: presetId as Id<"filterPresets"> })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete preset'
      toast.error(message)
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
    <div className="space-y-2">
      <FilterTierButtons
        currentUserId={currentUser?._id}
        hasActiveFilters={!!hasActiveFilters()}
        isCreating={isCreating}
        onApplyPreset={onApplyPreset}
        onStartCreating={() => setIsCreating(true)}
      />

      {isCreating && (
        <SavePresetForm
          presetName={presetName}
          onNameChange={setPresetName}
          onSave={handleCreatePreset}
          onCancel={() => {
            setIsCreating(false)
            setPresetName('')
          }}
        />
      )}

      {presets && presets.length > 0 && (
        <SavedPresetsRow
          presets={presets}
          onApplyPreset={onApplyPreset}
          onDeletePreset={handleDeletePreset}
        />
      )}
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

function getDateDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

