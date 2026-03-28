import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { m } from 'framer-motion'
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlinePencil,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineInbox,
  HiOutlineFilter,
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import BrutalSelect from '@/components/ui/BrutalSelect'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import WorkspaceSelector from '@/components/common/WorkspaceSelector'
import { useCurrentWorkspace } from '@/hooks/useCurrentWorkspace'

// --- Sub-components ---

interface StatsBarProps {
  pendingCount: number
  acceptanceRate: number
  acceptedCount: number
  rejectedCount: number
}

function StatsBar({ pendingCount, acceptanceRate, acceptedCount, rejectedCount }: StatsBarProps) {
  return (
    <div className="flex items-center gap-4 font-mono text-[11px]">
      <span>
        <span className="text-[var(--theme-warning)]">PENDING:</span>{' '}
        <span className="text-[var(--theme-foreground)] font-bold">{pendingCount}</span>
      </span>
      <span>
        <span className="text-[var(--theme-success)]">ACCEPTED:</span>{' '}
        <span className="text-[var(--theme-foreground)]/60">{acceptedCount}</span>
      </span>
      <span>
        <span className="text-[var(--theme-error)]">REJECTED:</span>{' '}
        <span className="text-[var(--theme-foreground)]/60">{rejectedCount}</span>
      </span>
      <span className="ml-auto">
        <span className="text-[var(--theme-info)]">RATE:</span>{' '}
        <span className={clsx(
          'font-bold',
          acceptanceRate >= 70 ? 'text-[var(--theme-success)]' :
          acceptanceRate >= 40 ? 'text-[var(--theme-warning)]' :
          'text-[var(--theme-error)]'
        )}>
          {acceptanceRate}%
        </span>
      </span>
    </div>
  )
}

// Badge variant helpers
function getPriorityVariant(priority: string): 'error' | 'warning' | 'info' | 'default' {
  switch (priority) {
    case 'urgent': return 'error'
    case 'high': return 'warning'
    case 'medium': return 'info'
    default: return 'default'
  }
}

function getTypeVariant(type: string): 'error' | 'info' | 'warning' | 'default' {
  switch (type) {
    case 'bug': return 'error'
    case 'feature': return 'info'
    case 'improvement': return 'warning'
    default: return 'default'
  }
}

// Confidence bar
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[6px] bg-[var(--theme-background)] border border-[var(--theme-border)]">
        <div
          className={clsx(
            'h-full transition-all',
            pct >= 80 ? 'bg-[var(--theme-success)]' :
            pct >= 50 ? 'bg-[var(--theme-warning)]' :
            'bg-[var(--theme-error)]'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-[var(--theme-foreground)]/60 w-[32px] text-right">
        {pct}%
      </span>
    </div>
  )
}

// Single triage item
interface TriageItemProps {
  suggestion: {
    _id: Id<"triageSuggestions">
    suggestedType?: string
    suggestedPriority?: string
    suggestedLabels?: string[]
    confidence: number
    reasoning?: string
    task: {
      _id: Id<"tasks">
      title: string
      description?: string
      reporterName?: string
    } | null
  }
  isActive: boolean
  onAccept: (id: Id<"triageSuggestions">) => void
  onReject: (id: Id<"triageSuggestions">) => void
  onModify: (id: Id<"triageSuggestions">) => void
  isProcessing: boolean
}

function TriageItem({ suggestion, isActive, onAccept, onReject, onModify, isProcessing }: TriageItemProps) {
  const [reasoningOpen, setReasoningOpen] = useState(false)

  if (!suggestion.task) return null

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <BrutalCard
        variant={isActive ? 'elevated' : 'default'}
        padding="none"
        className={clsx(
          'transition-all',
          isActive && 'border-[var(--theme-primary)]'
        )}
      >
        <div className="p-4">
          {/* Task header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[var(--theme-foreground)] truncate">
                {suggestion.task.title}
              </h3>
              {suggestion.task.description && (
                <p className="text-[11px] text-[var(--theme-foreground)]/50 mt-1 line-clamp-2 font-mono">
                  {suggestion.task.description}
                </p>
              )}
              {suggestion.task.reporterName && (
                <span className="text-[10px] text-[var(--theme-foreground)]/40 font-mono mt-1 block">
                  BY {suggestion.task.reporterName.toUpperCase()}
                </span>
              )}
            </div>
            <ConfidenceBar value={suggestion.confidence} />
          </div>

          {/* Suggestion badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {suggestion.suggestedType && (
              <BrutalBadge variant={getTypeVariant(suggestion.suggestedType)} size="xs">
                {suggestion.suggestedType.toUpperCase()}
              </BrutalBadge>
            )}
            {suggestion.suggestedPriority && (
              <BrutalBadge variant={getPriorityVariant(suggestion.suggestedPriority)} size="xs">
                {suggestion.suggestedPriority.toUpperCase()}
              </BrutalBadge>
            )}
            {suggestion.suggestedLabels?.map((label) => (
              <BrutalBadge key={label} variant="default" size="xs">
                {label.toUpperCase()}
              </BrutalBadge>
            ))}
          </div>

          {/* Reasoning collapsible */}
          {suggestion.reasoning && (
            <div className="mb-3">
              <button
                onClick={() => setReasoningOpen(!reasoningOpen)}
                className="flex items-center gap-1 text-[10px] font-mono uppercase text-[var(--theme-foreground)]/50 hover:text-[var(--theme-foreground)] transition-colors"
              >
                {reasoningOpen ? <HiOutlineChevronUp className="w-3 h-3" /> : <HiOutlineChevronDown className="w-3 h-3" />}
                REASONING
              </button>
              {reasoningOpen && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 p-2 bg-[var(--theme-background)] border border-[var(--theme-border)] text-[11px] font-mono text-[var(--theme-foreground)]/70 leading-relaxed"
                >
                  {suggestion.reasoning}
                </m.div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <BrutalButton
              size="sm"
              variant="primary"
              onClick={() => onAccept(suggestion._id)}
              disabled={isProcessing}
              className="!bg-[#22C55E] !border-[#22C55E] hover:!bg-[#16A34A]"
            >
              <HiOutlineCheck className="w-3.5 h-3.5 mr-1" />
              ACCEPT
            </BrutalButton>
            <BrutalButton
              size="sm"
              variant="secondary"
              onClick={() => onModify(suggestion._id)}
              disabled={isProcessing}
              className="!border-[#F59E0B] !text-[#F59E0B] hover:!bg-[#F59E0B]/10"
            >
              <HiOutlinePencil className="w-3.5 h-3.5 mr-1" />
              MODIFY
            </BrutalButton>
            <BrutalButton
              size="sm"
              variant="danger"
              onClick={() => onReject(suggestion._id)}
              disabled={isProcessing}
            >
              <HiOutlineX className="w-3.5 h-3.5 mr-1" />
              REJECT
            </BrutalButton>
            <span className="ml-auto font-mono text-[9px] text-[var(--theme-foreground)]/30 hidden sm:inline">
              A / E / R
            </span>
          </div>
        </div>
      </BrutalCard>
    </m.div>
  )
}

// Modify modal (inline)
interface ModifyPanelProps {
  suggestion: {
    _id: Id<"triageSuggestions">
    suggestedType?: string
    suggestedPriority?: string
    suggestedLabels?: string[]
    task: { title: string } | null
  }
  onSubmit: (id: Id<"triageSuggestions">, overrides: { type?: string; priority?: string; labels?: string[] }) => void
  onCancel: () => void
  isProcessing: boolean
}

function ModifyPanel({ suggestion, onSubmit, onCancel, isProcessing }: ModifyPanelProps) {
  const [type, setType] = useState(suggestion.suggestedType || '')
  const [priority, setPriority] = useState(suggestion.suggestedPriority || '')
  const [labelsStr, setLabelsStr] = useState((suggestion.suggestedLabels || []).join(', '))

  const typeOptions = [
    { value: '', label: 'No change' },
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'improvement', label: 'Improvement' },
    { value: 'task', label: 'Task' },
    { value: 'story', label: 'Story' },
    { value: 'epic', label: 'Epic' },
  ]

  const priorityOptions = [
    { value: '', label: 'No change' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <BrutalCard variant="bordered" padding="md">
        <h4 className="text-xs font-bold uppercase mb-3 text-[var(--theme-warning)]">
          MODIFY: {suggestion.task?.title}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--theme-foreground)]/50 mb-1">TYPE</label>
            <BrutalSelect value={type} onChange={setType} options={typeOptions} compact />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--theme-foreground)]/50 mb-1">PRIORITY</label>
            <BrutalSelect value={priority} onChange={setPriority} options={priorityOptions} compact />
          </div>
        </div>

        <div className="mb-3">
          <label className="block font-mono text-[10px] uppercase text-[var(--theme-foreground)]/50 mb-1">LABELS (comma-separated)</label>
          <input
            type="text"
            value={labelsStr}
            onChange={(e) => setLabelsStr(e.target.value)}
            className="w-full px-2 py-1.5 bg-[var(--theme-background)] border border-[var(--theme-border)] font-mono text-[11px] text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] focus:outline-none"
            placeholder="bug, frontend, urgent"
          />
        </div>

        <div className="flex items-center gap-2">
          <BrutalButton
            size="sm"
            variant="primary"
            onClick={() => {
              const labels = labelsStr.split(',').map(l => l.trim()).filter(Boolean)
              onSubmit(suggestion._id, {
                type: type || undefined,
                priority: priority || undefined,
                labels: labels.length > 0 ? labels : undefined,
              })
            }}
            disabled={isProcessing}
            className="!bg-[#F59E0B] !border-[#F59E0B]"
          >
            SAVE & ACCEPT
          </BrutalButton>
          <BrutalButton size="sm" variant="ghost" onClick={onCancel} disabled={isProcessing}>
            CANCEL
          </BrutalButton>
        </div>
      </BrutalCard>
    </m.div>
  )
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 flex items-center justify-center border-2 border-[var(--theme-success)] mb-4">
        <HiOutlineCheck className="w-6 h-6 text-[var(--theme-success)]" />
      </div>
      <h2 className="text-sm font-bold uppercase text-[var(--theme-foreground)] mb-1">
        All Caught Up
      </h2>
      <p className="font-mono text-[11px] text-[var(--theme-foreground)]/50 max-w-xs">
        No pending triage suggestions. New suggestions will appear here when the AI agent processes incoming tasks.
      </p>
    </div>
  )
}

// --- Main Component ---

export default function TriagePage() {
  const {
    currentWorkspaceId,
    isLoading: workspaceLoading,
    workspaces,
  } = useCurrentWorkspace()

  const [activeIndex, setActiveIndex] = useState(0)
  const [modifyingId, setModifyingId] = useState<Id<"triageSuggestions"> | null>(null)
  const [processingId, setProcessingId] = useState<Id<"triageSuggestions"> | null>(null)
  const [filterProjectId, setFilterProjectId] = useState<string>('')

  const acceptMutation = useMutation(api.agent.triageMutations.acceptTriageSuggestion)
  const rejectMutation = useMutation(api.agent.triageMutations.rejectTriageSuggestion)
  const modifyMutation = useMutation(api.agent.triageMutations.modifyAndAcceptTriageSuggestion)

  const triageQueue = useQuery(
    api.agent.queries.getTriageQueue,
    currentWorkspaceId
      ? {
          workspaceId: currentWorkspaceId as Id<"workspaces">,
          ...(filterProjectId ? { projectId: filterProjectId as Id<"projects"> } : {}),
        }
      : 'skip',
  )

  const triageStats = useQuery(
    api.agent.queries.getTriageStats,
    currentWorkspaceId
      ? { workspaceId: currentWorkspaceId as Id<"workspaces"> }
      : 'skip',
  )

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    currentWorkspaceId
      ? { workspaceId: currentWorkspaceId as Id<"workspaces"> }
      : 'skip',
  )

  // Clamp active index
  useEffect(() => {
    if (triageQueue && activeIndex >= triageQueue.length) {
      setActiveIndex(Math.max(0, triageQueue.length - 1))
    }
  }, [triageQueue, activeIndex])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return

      const target = e.target as HTMLElement | null
      const isEditable = Boolean(
        target?.isContentEditable ||
        target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
      )
      const hasOpenModal = Boolean(
        document.querySelector('[role="dialog"][aria-modal="true"]')
      )

      if (isEditable || hasOpenModal || modifyingId) return
      if (!triageQueue || triageQueue.length === 0) return

      const currentItem = triageQueue[activeIndex]
      if (!currentItem) return

      switch (e.key.toLowerCase()) {
        case 'j':
          e.preventDefault()
          setActiveIndex(prev => Math.min(prev + 1, triageQueue.length - 1))
          break
        case 'k':
          e.preventDefault()
          setActiveIndex(prev => Math.max(prev - 1, 0))
          break
        case 'a':
          e.preventDefault()
          handleAccept(currentItem._id)
          break
        case 'r':
          e.preventDefault()
          handleReject(currentItem._id)
          break
        case 'e':
          e.preventDefault()
          setModifyingId(currentItem._id)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [triageQueue, activeIndex, modifyingId])

  const handleAccept = useCallback(async (id: Id<"triageSuggestions">) => {
    setProcessingId(id)
    try {
      await acceptMutation({ suggestionId: id })
      toast.success('Suggestion accepted')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to accept suggestion'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }, [acceptMutation])

  const handleReject = useCallback(async (id: Id<"triageSuggestions">) => {
    setProcessingId(id)
    try {
      await rejectMutation({ suggestionId: id })
      toast.success('Suggestion rejected')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject suggestion'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }, [rejectMutation])

  const handleModifySubmit = useCallback(async (
    id: Id<"triageSuggestions">,
    overrides: { type?: string; priority?: string; labels?: string[] }
  ) => {
    setProcessingId(id)
    try {
      await modifyMutation({ suggestionId: id, ...overrides })
      toast.success('Suggestion modified and accepted')
      setModifyingId(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to modify suggestion'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }, [modifyMutation])

  // Loading state
  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Workspace selector
  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-primary)]">
            <HiOutlineInbox className="w-5 h-5 text-[var(--theme-primary)]" />
          </div>
          <h1 className="text-lg font-bold uppercase mb-2 tracking-tight text-[var(--theme-foreground)]">
            Select Workspace
          </h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-4">
            Select a workspace to view triage queue.
          </p>
          <div className="bg-[var(--theme-background-secondary)] p-3 border border-[var(--theme-border)]">
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    )
  }

  // No workspaces
  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="border-2 border-dashed border-[var(--theme-error)]/40 p-8 text-center max-w-md w-full">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineInbox className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 text-[var(--theme-foreground)]">
            No Workspaces
          </h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
            Create a workspace to use AI triage.
          </p>
        </div>
      </div>
    )
  }

  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...(projects || []).map(p => ({ value: p._id, label: p.name })),
  ]

  return (
    <div className="flex flex-col h-full bg-[var(--theme-background)]">
      {/* Header */}
      <div className="flex-none border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
        <div className="flex items-center justify-between px-3 py-1.5 gap-2">
          <div className="flex items-center gap-2">
            <HiOutlineInbox className="w-4 h-4 text-[var(--theme-warning)] shrink-0" />
            <span className="font-mono text-xs font-bold uppercase text-[var(--theme-foreground)] shrink-0">
              TRIAGE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HiOutlineFilter className="w-3 h-3 text-[var(--theme-foreground)]/40" />
            <BrutalSelect
              value={filterProjectId}
              onChange={setFilterProjectId}
              options={projectOptions}
              compact
            />
          </div>
        </div>

        {/* Stats bar */}
        {triageStats && (
          <div className="px-3 py-1.5 border-t border-[var(--theme-border)]">
            <StatsBar
              pendingCount={triageStats.pendingCount}
              acceptanceRate={triageStats.acceptanceRate}
              acceptedCount={triageStats.acceptedCount}
              rejectedCount={triageStats.rejectedCount}
            />
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="flex-none px-3 py-1 border-b border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50">
        <div className="flex items-center gap-3 font-mono text-[9px] text-[var(--theme-foreground)]/30 uppercase">
          <span><kbd className="px-1 py-px border border-[var(--theme-border)]">J</kbd> / <kbd className="px-1 py-px border border-[var(--theme-border)]">K</kbd> Navigate</span>
          <span><kbd className="px-1 py-px border border-[var(--theme-border)]">A</kbd> Accept</span>
          <span><kbd className="px-1 py-px border border-[var(--theme-border)]">E</kbd> Modify</span>
          <span><kbd className="px-1 py-px border border-[var(--theme-border)]">R</kbd> Reject</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {triageQueue === undefined ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : triageQueue.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {triageQueue.map((suggestion, index) => (
              <div key={suggestion._id}>
                {modifyingId === suggestion._id ? (
                  <ModifyPanel
                    suggestion={suggestion}
                    onSubmit={handleModifySubmit}
                    onCancel={() => setModifyingId(null)}
                    isProcessing={processingId === suggestion._id}
                  />
                ) : (
                  <TriageItem
                    suggestion={suggestion}
                    isActive={index === activeIndex}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onModify={(id) => setModifyingId(id)}
                    isProcessing={processingId === suggestion._id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
