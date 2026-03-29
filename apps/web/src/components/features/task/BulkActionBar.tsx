import { useState, useRef, useEffect } from 'react'
import type { Id } from '../../../../../convex/_generated/dataModel'
import clsx from 'clsx'

interface BulkActionBarProps {
  selectedCount: number
  selectedIds: Id<'tasks'>[]
  onClearSelection: () => void
  onStatusChange: (status: string) => void
  onPriorityChange: (priority: string) => void
  onDelete: () => void
}

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'BACKLOG' },
  { value: 'todo', label: 'TO DO' },
  { value: 'in_progress', label: 'IN PROGRESS' },
  { value: 'in_review', label: 'IN REVIEW' },
  { value: 'done', label: 'DONE' },
  { value: 'cancelled', label: 'CANCELLED' },
]

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: '🔴 URGENT' },
  { value: 'high', label: '🟠 HIGH' },
  { value: 'medium', label: '🟡 MEDIUM' },
  { value: 'low', label: '🟢 LOW' },
]

function Dropdown({
  label,
  options,
  onSelect,
}: {
  label: string
  options: { value: string; label: string }[]
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase border border-[var(--theme-border)] text-[var(--theme-foreground)]/80 hover:text-[var(--theme-foreground)] hover:border-[#6366F1] transition-colors"
      >
        {label} ▾
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 min-w-[140px] bg-[#111111] border-2 border-[var(--theme-border)] z-50 shadow-[4px_4px_0px_rgba(0,0,0,0.8)]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="w-full text-left px-3 py-2 text-xs font-mono uppercase hover:bg-[var(--theme-hover)] transition-colors text-[var(--theme-foreground)]/80 hover:text-[var(--theme-foreground)]"
              onClick={() => {
                onSelect(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BulkActionBar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onStatusChange,
  onPriorityChange,
  onDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5"
      style={{
        backgroundColor: '#111111',
        border: '2px solid #6366F1',
        boxShadow: '4px 4px 0px rgba(99, 102, 241, 0.4)',
        whiteSpace: 'nowrap',
      }}
      role="toolbar"
      aria-label={`${selectedCount} tasks selected`}
    >
      {/* Count */}
      <span className="text-xs font-mono font-bold text-[#6366F1] uppercase">
        {selectedCount} {selectedCount === 1 ? 'TASK' : 'TASKS'} SELECTED
      </span>

      <div className="w-px h-4 bg-[var(--theme-border)]" />

      {/* Status dropdown */}
      <Dropdown label="STATUS" options={STATUS_OPTIONS} onSelect={onStatusChange} />

      {/* Priority dropdown */}
      <Dropdown label="PRIORITY" options={PRIORITY_OPTIONS} onSelect={onPriorityChange} />

      <div className="w-px h-4 bg-[var(--theme-border)]" />

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="px-3 py-1.5 text-xs font-mono uppercase border border-[#EF4444]/60 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition-colors"
      >
        DELETE
      </button>

      {/* Clear selection */}
      <button
        type="button"
        onClick={onClearSelection}
        className="px-2 py-1.5 text-xs font-mono text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] transition-colors"
        aria-label="Clear selection"
      >
        ✕
      </button>
    </div>
  )
}
