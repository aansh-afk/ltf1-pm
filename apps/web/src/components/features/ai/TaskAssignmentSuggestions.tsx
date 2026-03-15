import { useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import toast from 'react-hot-toast'
import {
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineUserAdd,
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'
import BrutalAvatar from '@/components/ui/BrutalAvatar'

interface Suggestion {
  userId: string
  score: number
  reason: string
}

interface UserInfo {
  _id: string
  name: string
  avatarUrl?: string
}

interface TaskAssignmentSuggestionsProps {
  projectId: Id<"projects">
  taskTitle: string
  taskDescription?: string
  taskType?: string
  priority?: string
  labels?: string[]
  currentAssignees?: string[]
  onAssign: (userId: string) => void
  compact?: boolean
}

export default function TaskAssignmentSuggestions({
  projectId,
  taskTitle,
  taskDescription,
  taskType,
  priority,
  labels,
  currentAssignees = [],
  onAssign,
  compact = false,
}: TaskAssignmentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const suggestAssignees = useAction(api.ai.taskAssignment.suggestAssignees)

  // Get project members for avatar/name resolution
  const project = useQuery(api.projects.queries.getProject, { projectId })

  const handleSuggest = async () => {
    if (!taskTitle.trim()) {
      toast.error('Enter a task title first')
      return
    }

    setIsLoading(true)
    setHasRun(true)

    try {
      const result = await suggestAssignees({
        title: taskTitle,
        description: taskDescription || undefined,
        projectId,
        taskType: taskType || undefined,
        priority: priority || undefined,
        labels: labels && labels.length > 0 ? labels : undefined,
      })
      setSuggestions(result)

      if (result.length === 0) {
        toast('No strong matches found', { icon: '!' })
      }
    } catch (error: any) {
      console.error('AI suggestion failed:', error)
      toast.error(error.message || 'AI suggestion failed')
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const getMemberInfo = (userId: string): UserInfo | undefined => {
    const member = project?.members?.find(
      (m: any) => m._id === userId || m.user?._id === userId
    )
    if (member) {
      return {
        _id: userId,
        name: (member as any).name || (member as any).user?.name || 'Unknown',
        avatarUrl: (member as any).avatarUrl || (member as any).user?.avatarUrl,
      }
    }
    return undefined
  }

  const getScoreBg = (score: number): string => {
    if (score >= 8) return 'var(--theme-success)'
    if (score >= 5) return 'var(--theme-info)'
    if (score >= 3) return 'var(--theme-warning)'
    return 'var(--theme-foreground)'
  }

  // Not yet run -- show trigger button
  if (!hasRun && !isLoading) {
    return (
      <button
        type="button"
        onClick={handleSuggest}
        className="flex items-center gap-[6px] px-3 py-2 border-2 border-[var(--theme-border)] font-mono text-xs uppercase tracking-wider transition-colors hover:border-[var(--theme-primary)] w-full justify-center"
        style={{ color: 'var(--theme-primary)', backgroundColor: 'transparent' }}
      >
        <HiOutlineSparkles className="w-4 h-4" />
        AI SUGGEST ASSIGNEES
      </button>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center gap-[6px] p-3 border-2 border-[var(--theme-border)]"
        style={{ backgroundColor: 'var(--theme-background)' }}
      >
        <div
          className="w-4 h-4 border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}
        />
        <span
          className="font-mono text-xs uppercase tracking-wider"
          style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}
        >
          ANALYZING TEAM SKILLS...
        </span>
      </div>
    )
  }

  // Results
  return (
    <div className="space-y-[4px]">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}
        >
          AI SUGGESTIONS
        </span>
        <button
          type="button"
          onClick={handleSuggest}
          className="flex items-center gap-[4px] font-mono text-[10px] uppercase tracking-wider transition-colors hover:opacity-100"
          style={{ color: 'var(--theme-primary)', opacity: 0.7 }}
        >
          <HiOutlineRefresh className="w-3 h-3" />
          REFRESH
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div
          className="flex items-center gap-[6px] p-2 border border-[var(--theme-border)]"
          style={{ backgroundColor: 'var(--theme-background)' }}
        >
          <HiOutlineExclamationCircle
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--theme-warning)' }}
          />
          <span
            className="font-mono text-[11px]"
            style={{ color: 'var(--theme-foreground)', opacity: 0.6 }}
          >
            No strong matches found for this task.
          </span>
        </div>
      ) : (
        suggestions.map((s) => {
          const memberInfo = getMemberInfo(s.userId)
          const isAssigned = currentAssignees.includes(s.userId)

          return (
            <div
              key={s.userId}
              className="flex items-center gap-[8px] p-2 border-2 transition-colors"
              style={{
                borderColor: isAssigned
                  ? 'var(--theme-primary)'
                  : 'var(--theme-border)',
                backgroundColor: isAssigned
                  ? 'color-mix(in srgb, var(--theme-primary) 8%, transparent)'
                  : 'var(--theme-background)',
              }}
            >
              {/* Avatar */}
              {memberInfo?.avatarUrl ? (
                <img
                  src={memberInfo.avatarUrl}
                  alt={memberInfo.name}
                  className="w-6 h-6 object-cover flex-shrink-0"
                  style={{ borderRadius: '0px' }}
                />
              ) : (
                <BrutalAvatar
                  name={memberInfo?.name || 'U'}
                  size="xs"
                />
              )}

              {/* Name + reason */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[6px]">
                  <span
                    className="font-mono text-xs font-bold uppercase truncate"
                    style={{ color: 'var(--theme-foreground)' }}
                  >
                    {memberInfo?.name || 'Unknown'}
                  </span>
                  <span
                    className="font-mono text-[10px] font-bold px-1 flex-shrink-0"
                    style={{
                      color: getScoreBg(s.score),
                      backgroundColor: `color-mix(in srgb, ${getScoreBg(s.score)} 15%, transparent)`,
                    }}
                  >
                    {s.score}/10
                  </span>
                </div>
                {!compact && (
                  <p
                    className="font-mono text-[10px] truncate mt-[1px]"
                    style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}
                    title={s.reason}
                  >
                    {s.reason}
                  </p>
                )}
              </div>

              {/* Assign button */}
              <button
                type="button"
                onClick={() => onAssign(s.userId)}
                className="flex items-center gap-[4px] px-2 py-1 border font-mono text-[10px] uppercase tracking-wider transition-colors flex-shrink-0"
                style={{
                  borderColor: isAssigned
                    ? 'var(--theme-primary)'
                    : 'var(--theme-border)',
                  color: isAssigned
                    ? 'var(--theme-primary)'
                    : 'var(--theme-foreground)',
                  opacity: isAssigned ? 1 : 0.7,
                  backgroundColor: isAssigned
                    ? 'color-mix(in srgb, var(--theme-primary) 15%, transparent)'
                    : 'transparent',
                }}
                title={isAssigned ? 'Remove assignee' : 'Assign to task'}
              >
                {isAssigned ? (
                  <>
                    <HiOutlineCheckCircle className="w-3 h-3" />
                    ASSIGNED
                  </>
                ) : (
                  <>
                    <HiOutlineUserAdd className="w-3 h-3" />
                    ASSIGN
                  </>
                )}
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
