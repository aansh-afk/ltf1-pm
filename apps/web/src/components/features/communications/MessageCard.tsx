import { FaGithub, FaSlack, FaDiscord, FaJira } from 'react-icons/fa'
import { HiOutlineReply } from 'react-icons/hi'
import clsx from 'clsx'

type Source = 'slack' | 'github' | 'discord' | 'jira' | 'internal'

interface MessageCardProps {
  message: {
    _id: string
    source: Source
    senderName: string
    senderAvatarUrl?: string
    content: string
    contentType: 'text' | 'markdown' | 'code' | 'system'
    metadata?: any
    createdAt: number
    channelName?: string
  }
  showChannel?: boolean
  onReply?: () => void
}

const SOURCE_BADGE: Record<string, { icon: any; color: string; bg: string }> = {
  slack: { icon: FaSlack, color: '#4A154B', bg: '#4A154B' },
  github: { icon: FaGithub, color: '#F9FAFB', bg: '#333333' },
  discord: { icon: FaDiscord, color: '#5865F2', bg: '#5865F2' },
  jira: { icon: FaJira, color: '#0052CC', bg: '#0052CC' },
  internal: { icon: FaSlack, color: '#6366F1', bg: '#6366F1' },
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MessageCard({ message, showChannel = false, onReply }: MessageCardProps) {
  const badge = SOURCE_BADGE[message.source] || SOURCE_BADGE.internal
  const Icon = badge.icon

  return (
    <div className="group bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-3 hover:border-[var(--theme-primary)]/30 transition-colors">
      <div className="flex items-start gap-2.5">
        {/* Source badge */}
        <div
          className="w-7 h-7 flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: badge.bg }}
        >
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-[var(--theme-foreground)] truncate">
              {message.senderName}
            </span>
            {showChannel && message.channelName && (
              <>
                <span className="text-[var(--theme-border)]">&rarr;</span>
                <span className="font-mono text-[10px] text-[var(--theme-primary)] truncate">
                  {message.channelName}
                </span>
              </>
            )}
            <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] ml-auto flex-shrink-0">
              {formatTime(message.createdAt)}
            </span>
          </div>

          {/* Message content */}
          <div
            className={clsx(
              'text-xs leading-relaxed',
              message.contentType === 'system'
                ? 'font-mono text-[var(--theme-foreground-tertiary)] italic'
                : message.contentType === 'code'
                  ? 'font-mono text-[var(--theme-success)] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] px-2 py-1.5'
                  : 'text-[var(--theme-foreground-secondary)]'
            )}
          >
            {message.content}
          </div>

          {/* Metadata link (e.g. PR url, issue link) */}
          {message.metadata?.url && (
            <a
              href={message.metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 font-mono text-[10px] text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)] transition-colors"
            >
              {message.metadata.url}
            </a>
          )}
        </div>

        {/* Reply button */}
        {onReply && (
          <button
            onClick={onReply}
            className="opacity-0 group-hover:opacity-100 p-1.5 border border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition-all"
          >
            <HiOutlineReply className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
