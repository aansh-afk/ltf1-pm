import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import MessageCard from './MessageCard'
import MessageReplyInput from './MessageReplyInput'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { FaGithub, FaSlack, FaDiscord, FaJira } from 'react-icons/fa'

type Source = 'slack' | 'github' | 'discord' | 'jira' | 'internal'

interface ChannelMessageFeedProps {
  channelId: Id<'commsChannels'>
  channels: Array<{
    _id: Id<'commsChannels'>
    source: Source
    name: string
    channelType: string
    replyEnabled: boolean
  }>
}

const SOURCE_ICONS: Record<string, any> = {
  slack: FaSlack,
  github: FaGithub,
  discord: FaDiscord,
  jira: FaJira,
}

function formatDateSeparator(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function ChannelMessageFeed({ channelId, channels }: ChannelMessageFeedProps) {
  const channel = channels.find((c) => c._id === channelId)

  const messages = useQuery(
    api.communications.queries.getChannelMessages,
    { channelId, limit: 50 }
  )

  if (messages === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  const Icon = channel ? SOURCE_ICONS[channel.source] : null

  // Group messages by date
  let lastDate = ''
  const elements: JSX.Element[] = []

  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString()
    if (dateKey !== lastDate) {
      lastDate = dateKey
      elements.push(
        <div key={`date-${dateKey}`} className="flex items-center gap-3 py-2 px-4">
          <div className="flex-1 h-px bg-[var(--theme-border)]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">
            {formatDateSeparator(msg.createdAt)}
          </span>
          <div className="flex-1 h-px bg-[var(--theme-border)]" />
        </div>
      )
    }

    elements.push(
      <div key={msg._id} className="px-4">
        <MessageCard message={msg} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="px-4 py-3 border-b border-[var(--theme-border)] flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[var(--theme-foreground-tertiary)]" />}
        <h3 className="font-mono text-sm font-bold text-[var(--theme-foreground)] uppercase">
          {channel?.channelType === 'channel' && '# '}
          {channel?.name ?? 'Channel'}
        </h3>
        <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] ml-2">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 font-mono text-xs text-[var(--theme-foreground-tertiary)]">
            No messages in this channel
          </div>
        ) : (
          elements
        )}
      </div>

      {/* Reply input */}
      {channel?.replyEnabled && (
        <MessageReplyInput channelId={channelId} source={channel.source} />
      )}
    </div>
  )
}
