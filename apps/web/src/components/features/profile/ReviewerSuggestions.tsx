import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineUser,
  HiOutlineCode,
  HiOutlineStar,
  HiOutlineCheckCircle,
  HiOutlineLightBulb,
  HiOutlineChat,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineQuestionMarkCircle,
  HiOutlineExclamationCircle
} from 'react-icons/hi'
import clsx from 'clsx'
import DeveloperStatusIndicator from '../developer/DeveloperStatusIndicator'

// --- Sub-components ---

interface DetailedReviewerCardProps {
  reviewer: {
    user: { _id: string; name?: string; email?: string };
    profile?: { role?: string };
    score: number;
    reasons: string[];
  };
  isSelected: boolean;
  showAllReasons: boolean;
  onSelect: (userId: string) => void;
  onToggleReasons: (userId: string | null) => void;
  getScoreColor: (score: number) => string;
  getScoreLabel: (score: number) => string;
}

function DetailedReviewerCard({ reviewer, isSelected, showAllReasons, onSelect, onToggleReasons, getScoreColor, getScoreLabel }: DetailedReviewerCardProps) {
  return (
    <div
      className={clsx(
        "brutal-card p-[10px] transition-all",
        isSelected
          ? "border-2 border-primary-brutalist bg-primary-brutalist/10"
          : "border-2 border-[var(--theme-border)] hover:border-primary-brutalist/50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-[6px] flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(reviewer.user._id)}
            className="brutal-checkbox mt-2px"
          />

          <div className="flex-1">
            <div className="flex items-center gap-[6px] mb-[4px]">
              <h4 className="font-mono text-brutal-sm font-bold">
                {reviewer.user.name || 'UNNAMED DEVELOPER'}
              </h4>
              <DeveloperStatusIndicator
                userId={reviewer.user._id}
                size="sm"
                showLabel={true}
              />
            </div>

            {reviewer.profile?.role && (
              <p className="font-mono text-brutal-xs text-primary-brutalist/80 mb-[4px]">
                {reviewer.profile.role}
              </p>
            )}

            {/* Score and Match Quality */}
            <div className="flex items-center gap-[6px] mb-[4px]">
              <div className="flex items-center gap-6px">
                <span className="font-mono text-brutal-xs text-primary-brutalist/60">MATCH SCORE:</span>
                <span className={clsx(
                  "font-mono text-brutal-sm font-bold",
                  getScoreColor(reviewer.score)
                )}>
                  {reviewer.score}/10
                </span>
              </div>
              <span className={clsx(
                "px-[4px] py-2px font-mono text-brutal-xs font-bold",
                reviewer.score >= 7 ? "bg-brutal-success/20 text-brutal-success" :
                reviewer.score >= 4 ? "bg-brutal-info/20 text-brutal-info" :
                reviewer.score >= 2 ? "bg-brutal-warning/20 text-brutal-warning" :
                "bg-primary-brutalist/10 text-primary-brutalist"
              )}>
                {getScoreLabel(reviewer.score)}
              </span>
            </div>

            {/* Reasons */}
            <div className="space-y-4px">
              {reviewer.reasons.slice(0, showAllReasons ? undefined : 2).map((reason) => (
                <div key={reason} className="flex items-center gap-6px">
                  <HiOutlineCheckCircle className="w-14px h-14px text-brutal-success flex-shrink-0" />
                  <span className="font-mono text-brutal-xs text-primary-brutalist/80">
                    {reason}
                  </span>
                </div>
              ))}
              {reviewer.reasons.length > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleReasons(showAllReasons ? null : reviewer.user._id)
                  }}
                  className="font-mono text-brutal-xs text-brutal-info hover:underline"
                >
                  {showAllReasons
                    ? 'Show less'
                    : `+${reviewer.reasons.length - 2} more reasons`}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-[4px] ml-[6px]">
          {reviewer.user.email && (
            <a
              href={`mailto:${reviewer.user.email}?subject=Code Review Request`}
              onClick={(e) => e.stopPropagation()}
              className="brutal-btn-secondary p-6px"
              title="Send email"
            >
              <HiOutlineChat className="w-16px h-16px" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---

interface ReviewerSuggestionsProps {
  technologies: string[]
  workspaceId: Id<"workspaces">
  excludeUserId?: Id<"users">
  maxSuggestions?: number
  onSelectReviewer?: (userId: string) => void
  mode?: 'compact' | 'detailed'
}

export function ReviewerSuggestions({ 
  technologies, 
  workspaceId, 
  excludeUserId,
  maxSuggestions = 3,
  onSelectReviewer,
  mode = 'detailed' 
}: ReviewerSuggestionsProps) {
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [showAllReasons, setShowAllReasons] = useState<string | null>(null)

  // Get suggested reviewers
  const suggestions = useQuery(
    api.developers.queries.getSuggestedReviewers,
    technologies.length > 0 ? {
      technologies,
      excludeUserId,
      workspaceId,
      limit: maxSuggestions * 2 // Get extra to filter out unavailable
    } : 'skip'
  )

  // Filter to only show available reviewers
  const availableReviewers = suggestions?.filter(s => 
    s.profile.status === 'AVAILABLE' || s.profile.status === undefined
  ).slice(0, maxSuggestions)

  const handleSelectReviewer = (userId: string) => {
    if (selectedReviewers.includes(userId)) {
      setSelectedReviewers(prev => prev.filter(id => id !== userId))
    } else {
      setSelectedReviewers(prev => [...prev, userId])
    }
    onSelectReviewer?.(userId)
  }

  const copyReviewerNames = () => {
    if (!availableReviewers || selectedReviewers.length === 0) return
    
    const names = availableReviewers
      .filter(r => selectedReviewers.includes(r.user._id))
      .map(r => `@${r.user.name || r.user.email}`)
      .join(' ')
    
    navigator.clipboard.writeText(names)
  }

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-brutal-success'
    if (score >= 4) return 'text-brutal-info'
    if (score >= 2) return 'text-brutal-warning'
    return 'text-primary-brutalist/60'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 7) return 'EXCELLENT MATCH'
    if (score >= 4) return 'GOOD MATCH'
    if (score >= 2) return 'POSSIBLE MATCH'
    return 'LOW MATCH'
  }

  if (!technologies || technologies.length === 0) {
    return (
      <div className={clsx(
        "brutal-card",
        mode === 'compact' ? "p-[8px]" : "p-[16px]"
      )}>
        <div className="flex items-center gap-[6px] text-primary-brutalist/60">
          <HiOutlineQuestionMarkCircle className="w-20px h-20px" />
          <span className="font-mono text-brutal-sm">
            Add technologies to get reviewer suggestions
          </span>
        </div>
      </div>
    )
  }

  if (!availableReviewers || availableReviewers.length === 0) {
    return (
      <div className={clsx(
        "brutal-card",
        mode === 'compact' ? "p-[8px]" : "p-[16px]"
      )}>
        <div className="flex items-center gap-[6px] text-brutal-warning">
          <HiOutlineExclamationCircle className="w-20px h-20px" />
          <span className="font-mono text-brutal-sm">
            No available reviewers with matching expertise
          </span>
        </div>
      </div>
    )
  }

  if (mode === 'compact') {
    return (
      <div className="brutal-card p-[8px]">
        <div className="flex items-center justify-between mb-[4px]">
          <h4 className="font-mono text-brutal-xs font-bold flex items-center gap-6px">
            <HiOutlineLightBulb className="w-14px h-14px" />
            SUGGESTED REVIEWERS
          </h4>
          {selectedReviewers.length > 0 && (
            <button
              onClick={copyReviewerNames}
              className="p-4px text-primary-brutalist/60 hover:text-primary-brutalist"
              title="Copy selected names"
            >
              <HiOutlineClipboardCopy className="w-14px h-14px" />
            </button>
          )}
        </div>
        <div className="space-y-6px">
          {availableReviewers.map((reviewer) => (
            <button
              type="button"
              key={reviewer.user._id}
              className={clsx(
                "flex items-center gap-[4px] p-6px border cursor-pointer transition-all w-full text-left",
                selectedReviewers.includes(reviewer.user._id)
                  ? "bg-primary-brutalist/20 border-primary-brutalist"
                  : "bg-[var(--theme-background-secondary)] border-[var(--theme-border)] hover:border-primary-brutalist/50"
              )}
              onClick={() => handleSelectReviewer(reviewer.user._id)}
            >
              <input
                type="checkbox"
                checked={selectedReviewers.includes(reviewer.user._id)}
                onChange={() => {}}
                className="brutal-checkbox"
              />
              <DeveloperStatusIndicator 
                userId={reviewer.user._id}
                size="sm"
                showLabel={false}
              />
              <span className="font-mono text-brutal-xs flex-1 truncate">
                {reviewer.user.name || 'Unknown'}
              </span>
              <span className={clsx(
                "font-mono text-brutal-xs font-bold",
                getScoreColor(reviewer.score)
              )}>
                {reviewer.score}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="brutal-card p-[16px]">
      <div className="flex items-center justify-between mb-[8px]">
        <h3 className="text-brutal-md font-bold flex items-center gap-[4px]">
          <HiOutlineLightBulb className="w-20px h-20px text-brutal-warning" />
          SUGGESTED REVIEWERS
        </h3>
        <div className="flex items-center gap-[4px]">
          {selectedReviewers.length > 0 && (
            <button
              onClick={copyReviewerNames}
              className="brutal-btn-secondary flex items-center gap-6px px-[8px] py-6px"
              title="Copy selected reviewer names"
            >
              <HiOutlineClipboardCopy className="w-16px h-16px" />
              <span className="font-mono text-brutal-xs">COPY NAMES</span>
            </button>
          )}
          <div className="font-mono text-brutal-xs text-primary-brutalist/60">
            {selectedReviewers.length} SELECTED
          </div>
        </div>
      </div>

      <div className="mb-[6px]">
        <div className="flex items-center gap-[4px] flex-wrap">
          <span className="font-mono text-brutal-xs text-primary-brutalist/60">LOOKING FOR:</span>
          {technologies.map((tech) => (
            <span
              key={tech}
              className="px-[4px] py-4px font-mono text-brutal-xs bg-primary-brutalist/20 border border-primary-brutalist text-primary-brutalist font-bold"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-[6px]">
        {availableReviewers.map((reviewer) => (
          <DetailedReviewerCard
            key={reviewer.user._id}
            reviewer={reviewer}
            isSelected={selectedReviewers.includes(reviewer.user._id)}
            showAllReasons={showAllReasons === reviewer.user._id}
            onSelect={handleSelectReviewer}
            onToggleReasons={setShowAllReasons}
            getScoreColor={getScoreColor}
            getScoreLabel={getScoreLabel}
          />
        ))}
      </div>

      {availableReviewers.length < maxSuggestions && (
        <div className="mt-[6px] p-[8px] bg-brutal-warning/10 border border-brutal-warning">
          <p className="font-mono text-brutal-xs text-brutal-warning">
            Limited reviewers available. Consider scheduling review for when more team members are available.
          </p>
        </div>
      )}
    </div>
  )
}