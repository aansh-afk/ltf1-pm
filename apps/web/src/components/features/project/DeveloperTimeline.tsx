import React from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineCode,
  HiOutlineClipboardCheck,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowRight,
  HiOutlineRefresh
} from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'

interface DeveloperTimelineProps {
  projectId: Id<'projects'>
}

export default function DeveloperTimeline({ projectId }: DeveloperTimelineProps) {
  const activity = useQuery(api.integrations.github.projectQueries.getProjectRecentActivity, {
    projectId,
    limit: 10
  })

  const stats = useQuery(api.integrations.github.projectQueries.getProjectRepoStats, {
    projectId
  })

  if (!activity) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
        <h2 className="text-brutal-lg font-bold uppercase mb-16px flex items-center gap-8px">
          <HiOutlineClock className="w-20px h-20px" />
          DEVELOPER TIMELINE
        </h2>
        <div className="flex items-center justify-center py-32px">
          <div className="animate-pulse text-[var(--theme-foreground-secondary)]">
            Loading activity...
          </div>
        </div>
      </div>
    )
  }

  if (activity.combined.length === 0) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
        <h2 className="text-brutal-lg font-bold uppercase mb-16px flex items-center gap-8px">
          <HiOutlineClock className="w-20px h-20px" />
          DEVELOPER TIMELINE
        </h2>
        <div className="text-center py-32px text-[var(--theme-foreground-secondary)]">
          <p className="mb-8px">No GitHub activity found.</p>
          <p className="text-brutal-xs">Connect a repository or sync GitHub data to see activity.</p>
        </div>
      </div>
    )
  }

  const getActivityIcon = (type: string, state?: string) => {
    switch (type) {
      case 'commit':
        return <HiOutlineCode className="w-16px h-16px" />
      case 'pull_request':
        if (state === 'merged') return <HiOutlineCheckCircle className="w-16px h-16px text-[var(--theme-success)]" />
        if (state === 'closed') return <HiOutlineXCircle className="w-16px h-16px text-[var(--theme-error)]" />
        return <HiOutlineArrowRight className="w-16px h-16px text-[var(--theme-info)]" />
      case 'issue':
        if (state === 'closed') return <HiOutlineCheckCircle className="w-16px h-16px text-[var(--theme-success)]" />
        return <HiOutlineExclamationCircle className="w-16px h-16px text-[var(--theme-warning)]" />
      default:
        return <HiOutlineRefresh className="w-16px h-16px" />
    }
  }

  const getActivityColor = (type: string, state?: string) => {
    switch (type) {
      case 'commit':
        return 'var(--theme-primary)'
      case 'pull_request':
        if (state === 'merged') return 'var(--theme-success)'
        if (state === 'closed') return 'var(--theme-error)'
        return 'var(--theme-info)'
      case 'issue':
        if (state === 'closed') return 'var(--theme-success)'
        return 'var(--theme-warning)'
      default:
        return 'var(--theme-foreground-secondary)'
    }
  }

  const formatActivityTitle = (item: any) => {
    switch (item.type) {
      case 'commit':
        return item.data.message.split('\n')[0] // First line of commit message
      case 'pull_request':
        return `PR #${item.data.number}: ${item.data.title}`
      case 'issue':
        return `Issue #${item.data.number}: ${item.data.title}`
      default:
        return 'Unknown activity'
    }
  }

  const formatActivityDescription = (item: any) => {
    switch (item.type) {
      case 'commit':
        return `${item.data.author.name} • ${item.data.sha.substring(0, 7)}`
      case 'pull_request':
        return `${item.data.author} • ${item.data.state}`
      case 'issue':
        return `${item.data.author} • ${item.data.state}${item.data.labels.length > 0 ? ` • ${item.data.labels.join(', ')}` : ''}`
      default:
        return ''
    }
  }

  const getActivityUrl = (item: any) => {
    switch (item.type) {
      case 'commit':
        return item.data.url
      case 'pull_request':
      case 'issue':
        return item.data.url
      default:
        return null
    }
  }

  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
      <div className="flex items-center justify-between mb-16px">
        <h2 className="text-brutal-lg font-bold uppercase flex items-center gap-8px">
          <HiOutlineClock className="w-20px h-20px" />
          DEVELOPER TIMELINE
        </h2>
        {stats && (
          <div className="flex items-center gap-16px text-brutal-xs font-mono">
            <span className="text-[var(--theme-foreground-secondary)]">
              {stats.totalCommits} commits
            </span>
            <span className="text-[var(--theme-info)]">
              {stats.openPullRequests} open PRs
            </span>
            <span className="text-[var(--theme-warning)]">
              {stats.openIssues} open issues
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4px">
        {activity.combined.map((item, index) => {
          const url = getActivityUrl(item)
          const state = item.data.state || (item.data.mergedAt ? 'merged' : undefined)
          
          return (
            <div
              key={`${item.type}-${item.data._id || item.data.sha || index}`}
              className="group"
            >
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-12px p-8px hover:bg-[var(--theme-hover)] transition-colors rounded-none border-l-2 border-transparent hover:border-[var(--theme-primary)] cursor-pointer"
                >
                  <div className="flex items-center gap-8px min-w-[80px]">
                    <span className="text-brutal-xs font-mono text-[var(--theme-foreground-secondary)]">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: false })}
                    </span>
                  </div>
                  <div className="flex items-start gap-8px flex-1">
                    <span style={{ color: getActivityColor(item.type, state) }}>
                      {getActivityIcon(item.type, state)}
                    </span>
                    <div className="flex-1">
                      <div className="text-brutal-sm font-medium" style={{ color: getActivityColor(item.type, state) }}>
                        {formatActivityTitle(item)}
                      </div>
                      <div className="text-brutal-xs text-[var(--theme-foreground-secondary)] mt-2px">
                        {formatActivityDescription(item)}
                      </div>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="flex items-start gap-12px p-8px">
                  <div className="flex items-center gap-8px min-w-[80px]">
                    <span className="text-brutal-xs font-mono text-[var(--theme-foreground-secondary)]">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: false })}
                    </span>
                  </div>
                  <div className="flex items-start gap-8px flex-1">
                    <span style={{ color: getActivityColor(item.type, state) }}>
                      {getActivityIcon(item.type, state)}
                    </span>
                    <div className="flex-1">
                      <div className="text-brutal-sm font-medium" style={{ color: getActivityColor(item.type, state) }}>
                        {formatActivityTitle(item)}
                      </div>
                      <div className="text-brutal-xs text-[var(--theme-foreground-secondary)] mt-2px">
                        {formatActivityDescription(item)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {activity.combined.length >= 10 && (
        <div className="mt-16px pt-16px border-t border-[var(--theme-border)]">
          <p className="text-brutal-xs text-[var(--theme-foreground-secondary)] text-center">
            Showing last 10 activities
          </p>
        </div>
      )}
    </div>
  )
}