import React, { useState, useEffect } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { format, parseISO, isToday, isYesterday, isTomorrow, addDays, subDays } from 'date-fns'
import { 
  HiOutlineCalendar, 
  HiOutlineCheckCircle, 
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineSparkles,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlineEmojiHappy,
  HiOutlineEmojiSad,
  HiOutlineTrendingUp
} from 'react-icons/hi'

interface DailyStandupSummaryProps {
  projectId: Id<'projects'>
  compact?: boolean
}

interface StandupData {
  summary: {
    date: string
    completed: {
      tasks: number
      commits: number
      prsOpened: number
      prsMerged: number
    }
    inProgress: {
      tasks: number
      prsInReview: number
    }
    blockers: {
      title: string
      assignee?: Id<'users'>
      blockedSince: string
    }[]
    highlights: string[]
  }
  narrative?: string
  keyAchievements?: string[]
  focusAreas?: string[]
  teamMood?: 'energized' | 'productive' | 'normal' | 'struggling'
  aiGenerated: boolean
}

export default function DailyStandupSummary({ projectId, compact = false }: DailyStandupSummaryProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [standupData, setStandupData] = useState<StandupData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const generateStandup = useAction(api.ai.projectInsights.generateStandupSummary)
  
  const fetchStandup = async (date: Date) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await generateStandup({
        projectId,
        date: format(date, 'yyyy-MM-dd'),
      })
      setStandupData(data as StandupData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate standup')
      console.error('Standup generation failed:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchStandup(selectedDate)
  }, [projectId, selectedDate])
  
  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1))
  }
  
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d, yyyy')
  }
  
  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'energized':
        return <HiOutlineLightningBolt className="w-20px h-20px text-[var(--theme-success)]" />
      case 'productive':
        return <HiOutlineTrendingUp className="w-20px h-20px text-[var(--theme-info)]" />
      case 'normal':
        return <HiOutlineEmojiHappy className="w-20px h-20px text-[var(--theme-foreground)]" />
      case 'struggling':
        return <HiOutlineEmojiSad className="w-20px h-20px text-[var(--theme-warning)]" />
      default:
        return <HiOutlineEmojiHappy className="w-20px h-20px" />
    }
  }
  
  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'energized':
        return 'var(--theme-success)'
      case 'productive':
        return 'var(--theme-info)'
      case 'normal':
        return 'var(--theme-foreground)'
      case 'struggling':
        return 'var(--theme-warning)'
      default:
        return 'var(--theme-foreground-secondary)'
    }
  }
  
  if (loading && !standupData) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
        <div className="flex items-center gap-[6px]">
          <HiOutlineSparkles className="w-20px h-20px animate-pulse text-[var(--theme-primary)]" />
          <span className="text-brutal-sm">Generating standup summary...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-error)] p-[16px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[6px]">
            <HiOutlineExclamation className="w-20px h-20px text-[var(--theme-error)]" />
            <span className="text-brutal-sm">Failed to load standup</span>
          </div>
          <button
            onClick={() => fetchStandup(selectedDate)}
            className="p-[4px] hover:bg-[var(--theme-hover)] transition-colors"
            title="Retry"
          >
            <HiOutlineRefresh className="w-16px h-16px" />
          </button>
        </div>
      </div>
    )
  }
  
  if (!standupData) return null
  
  if (compact) {
    // Compact view for overview tab
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[10px]">
        <div className="flex items-center justify-between mb-[6px]">
          <div className="flex items-center gap-[4px]">
            <HiOutlineCalendar className="w-16px h-16px text-[var(--theme-primary)]" />
            <h3 className="text-brutal-sm font-bold uppercase">Today's Standup</h3>
            {standupData.aiGenerated && (
              <HiOutlineSparkles className="w-14px h-14px text-[var(--theme-primary)]" title="AI-Generated" />
            )}
          </div>
          {standupData.teamMood && (
            <div className="flex items-center gap-4px" title={`Team mood: ${standupData.teamMood}`}>
              {getMoodIcon(standupData.teamMood)}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[6px] mb-[6px]">
          <div className="flex items-center gap-[4px]">
            <HiOutlineCheckCircle className="w-16px h-16px text-[var(--theme-success)]" />
            <div>
              <div className="text-[14px] font-semibold font-bold">{standupData.summary.completed.tasks}</div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Completed</div>
            </div>
          </div>
          
          <div className="flex items-center gap-[4px]">
            <HiOutlineClock className="w-16px h-16px text-[var(--theme-info)]" />
            <div>
              <div className="text-[14px] font-semibold font-bold">{standupData.summary.inProgress.tasks}</div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">In Progress</div>
            </div>
          </div>
          
          <div className="flex items-center gap-[4px]">
            <HiOutlineExclamation className="w-16px h-16px text-[var(--theme-warning)]" />
            <div>
              <div className="text-[14px] font-semibold font-bold">{standupData.summary.blockers.length}</div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Blockers</div>
            </div>
          </div>
          
          <div className="flex items-center gap-[4px]">
            <svg className="w-16px h-16px" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <div>
              <div className="text-[14px] font-semibold font-bold">
                {standupData.summary.completed.commits + standupData.summary.completed.prsMerged}
              </div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Git Activity</div>
            </div>
          </div>
        </div>
        
        {standupData.narrative && (
          <p className="text-brutal-xs text-[var(--theme-foreground-secondary)] italic">
            "{standupData.narrative}"
          </p>
        )}
      </div>
    )
  }
  
  // Full view
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between mb-[12px]">
        <div className="flex items-center gap-[6px]">
          <HiOutlineCalendar className="w-4 h-4 text-[var(--theme-primary)]" />
          <h2 className="text-[14px] font-semibold font-bold uppercase">Daily Standup</h2>
          {standupData.aiGenerated && (
            <span className="text-brutal-xs text-[var(--theme-foreground-secondary)] px-[4px] py-4px bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]">
              AI-ENHANCED
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-[4px]">
          <button
            onClick={() => navigateDate('prev')}
            className="p-[4px] hover:bg-[var(--theme-hover)] transition-colors"
            disabled={loading}
          >
            <HiOutlineChevronLeft className="w-16px h-16px" />
          </button>
          
          <div className="px-[8px] py-6px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] min-w-[120px] text-center">
            <span className="text-brutal-sm font-bold">{getDateLabel(selectedDate)}</span>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-[4px] hover:bg-[var(--theme-hover)] transition-colors"
            disabled={loading || isTomorrow(selectedDate)}
          >
            <HiOutlineChevronRight className="w-16px h-16px" />
          </button>
          
          <button
            onClick={() => fetchStandup(selectedDate)}
            className="p-[4px] hover:bg-[var(--theme-hover)] transition-colors ml-[4px]"
            title="Refresh"
            disabled={loading}
          >
            <HiOutlineRefresh className={`w-16px h-16px ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Team Mood */}
      {standupData.teamMood && (
        <div 
          className="mb-[8px] p-[8px] border-2 flex items-center justify-between"
          style={{ 
            borderColor: getMoodColor(standupData.teamMood),
            backgroundColor: getMoodColor(standupData.teamMood) + '10'
          }}
        >
          <div className="flex items-center gap-[6px]">
            {getMoodIcon(standupData.teamMood)}
            <span className="text-brutal-sm font-bold">
              Team Mood: {standupData.teamMood.charAt(0).toUpperCase() + standupData.teamMood.slice(1)}
            </span>
          </div>
        </div>
      )}
      
      {/* Narrative Summary */}
      {standupData.narrative && (
        <div className="mb-[12px] p-[10px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
          <p className="text-brutal-sm italic">"{standupData.narrative}"</p>
        </div>
      )}
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[8px] mb-[12px]">
        <div className="p-[10px] border-2 border-[var(--theme-success)]">
          <div className="flex items-center gap-[4px] mb-[4px]">
            <HiOutlineCheckCircle className="w-20px h-20px text-[var(--theme-success)]" />
            <span className="text-brutal-xs font-bold uppercase">Completed</span>
          </div>
          <div className="text-[20px] font-bold font-bold">{standupData.summary.completed.tasks}</div>
          <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Tasks</div>
          {standupData.summary.completed.commits > 0 && (
            <div className="text-brutal-xs mt-4px">
              {standupData.summary.completed.commits} commits
            </div>
          )}
        </div>
        
        <div className="p-[10px] border-2 border-[var(--theme-info)]">
          <div className="flex items-center gap-[4px] mb-[4px]">
            <HiOutlineClock className="w-20px h-20px text-[var(--theme-info)]" />
            <span className="text-brutal-xs font-bold uppercase">In Progress</span>
          </div>
          <div className="text-[20px] font-bold font-bold">{standupData.summary.inProgress.tasks}</div>
          <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Tasks</div>
          {standupData.summary.inProgress.prsInReview > 0 && (
            <div className="text-brutal-xs mt-4px">
              {standupData.summary.inProgress.prsInReview} PRs in review
            </div>
          )}
        </div>
        
        <div className="p-[10px] border-2 border-[var(--theme-warning)]">
          <div className="flex items-center gap-[4px] mb-[4px]">
            <HiOutlineExclamation className="w-20px h-20px text-[var(--theme-warning)]" />
            <span className="text-brutal-xs font-bold uppercase">Blockers</span>
          </div>
          <div className="text-[20px] font-bold font-bold">{standupData.summary.blockers.length}</div>
          <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Issues</div>
        </div>
        
        <div className="p-[10px] border-2 border-[var(--theme-border)]">
          <div className="flex items-center gap-[4px] mb-[4px]">
            <svg className="w-20px h-20px" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="text-brutal-xs font-bold uppercase">Git Activity</span>
          </div>
          <div className="text-[20px] font-bold font-bold">
            {standupData.summary.completed.prsMerged}
          </div>
          <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">PRs Merged</div>
          {standupData.summary.completed.prsOpened > 0 && (
            <div className="text-brutal-xs mt-4px">
              {standupData.summary.completed.prsOpened} opened
            </div>
          )}
        </div>
      </div>
      
      {/* Key Achievements */}
      {standupData.keyAchievements && standupData.keyAchievements.length > 0 && (
        <div className="mb-[12px]">
          <h3 className="text-brutal-sm font-bold uppercase mb-[6px]">🎯 Key Achievements</h3>
          <div className="space-y-[4px]">
            {standupData.keyAchievements.map((achievement, index) => (
              <div key={index} className="flex items-start gap-[4px] p-[4px] bg-[var(--theme-success)]/10 border border-[var(--theme-success)]">
                <span className="text-brutal-sm">✓</span>
                <span className="text-brutal-sm">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Focus Areas */}
      {standupData.focusAreas && standupData.focusAreas.length > 0 && (
        <div className="mb-[12px]">
          <h3 className="text-brutal-sm font-bold uppercase mb-[6px]">🎯 Focus Areas</h3>
          <div className="space-y-[4px]">
            {standupData.focusAreas.map((area, index) => (
              <div key={index} className="flex items-start gap-[4px] p-[4px] bg-[var(--theme-info)]/10 border border-[var(--theme-info)]">
                <span className="text-brutal-sm font-bold">{index + 1}.</span>
                <span className="text-brutal-sm">{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Blockers Details */}
      {standupData.summary.blockers.length > 0 && (
        <div className="mb-[12px]">
          <h3 className="text-brutal-sm font-bold uppercase mb-[6px]">⚠️ Current Blockers</h3>
          <div className="space-y-[4px]">
            {standupData.summary.blockers.map((blocker, index) => (
              <div key={index} className="p-[4px] bg-[var(--theme-warning)]/10 border border-[var(--theme-warning)]">
                <div className="text-brutal-sm font-bold">{blocker.title}</div>
                <div className="text-brutal-xs text-[var(--theme-foreground-secondary)] mt-4px">
                  Blocked since: {format(parseISO(blocker.blockedSince), 'MMM d, h:mm a')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Highlights */}
      {standupData.summary.highlights.length > 0 && (
        <div className="pt-[8px] border-t border-[var(--theme-border)]">
          <div className="flex flex-wrap gap-[4px]">
            {standupData.summary.highlights.map((highlight, index) => (
              <span key={index} className="text-brutal-xs px-[4px] py-4px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}