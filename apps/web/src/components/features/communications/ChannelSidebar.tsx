import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { FaGithub, FaSlack, FaDiscord, FaJira } from 'react-icons/fa'
import { HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi'
import clsx from 'clsx'

type Source = 'slack' | 'github' | 'discord' | 'jira' | 'internal'

interface Channel {
  _id: Id<'commsChannels'>
  source: Source
  name: string
  channelType: string
  unreadCount: number
  muted: boolean
  active: boolean
  lastMessageAt?: number
}

interface ChannelSidebarProps {
  channels: Channel[]
  selectedChannelId: Id<'commsChannels'> | null
  selectedSources: Source[]
  onSelectChannel: (id: Id<'commsChannels'> | null) => void
}

const SOURCE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  slack: { icon: FaSlack, color: '#4A154B', label: 'Slack' },
  github: { icon: FaGithub, color: '#F9FAFB', label: 'GitHub' },
  discord: { icon: FaDiscord, color: '#5865F2', label: 'Discord' },
  jira: { icon: FaJira, color: '#0052CC', label: 'Jira' },
  internal: { icon: FaSlack, color: '#6366F1', label: 'Internal' },
}

export default function ChannelSidebar({
  channels,
  selectedChannelId,
  selectedSources,
  onSelectChannel,
}: ChannelSidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const markRead = useMutation(api.communications.mutations.markChannelRead)

  // Filter channels by selected sources
  const filteredChannels =
    selectedSources.length === 0
      ? channels
      : channels.filter((ch) => selectedSources.includes(ch.source))

  // Group by source
  const grouped: Record<string, Channel[]> = {}
  for (const ch of filteredChannels) {
    if (!grouped[ch.source]) grouped[ch.source] = []
    grouped[ch.source].push(ch)
  }

  const toggleGroup = (source: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return next
    })
  }

  const handleSelectChannel = async (channelId: Id<'commsChannels'>) => {
    onSelectChannel(channelId === selectedChannelId ? null : channelId)
    // Mark as read when selecting
    const channel = channels.find((c) => c._id === channelId)
    if (channel && channel.unreadCount > 0) {
      await markRead({ channelId })
    }
  }

  return (
    <div className="w-56 border-r border-[var(--theme-border)] bg-[var(--theme-background)] overflow-y-auto flex-shrink-0">
      {/* All Messages button */}
      <button
        onClick={() => onSelectChannel(null)}
        className={clsx(
          'w-full px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-left transition-colors border-b border-[var(--theme-border)]',
          selectedChannelId === null
            ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
            : 'text-[var(--theme-foreground-secondary)] hover:bg-[var(--theme-background-tertiary)]'
        )}
      >
        All Messages
      </button>

      {/* Grouped channels */}
      {Object.entries(grouped).map(([source, sourceChannels]) => {
        const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.internal
        const Icon = config.icon
        const isCollapsed = collapsedGroups.has(source)
        const totalUnread = sourceChannels.reduce((sum, ch) => sum + ch.unreadCount, 0)

        return (
          <div key={source}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(source)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground-secondary)] border-b border-[var(--theme-border)]/50 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                {isCollapsed ? (
                  <HiOutlineChevronRight className="w-3 h-3" />
                ) : (
                  <HiOutlineChevronDown className="w-3 h-3" />
                )}
                <Icon className="w-3 h-3" style={{ color: config.color }} />
                {config.label}
              </div>
              {totalUnread > 0 && (
                <span className="px-1 py-px text-[10px] font-mono font-bold bg-[var(--theme-error)] text-white min-w-[16px] text-center">
                  {totalUnread}
                </span>
              )}
            </button>

            {/* Channel list */}
            {!isCollapsed &&
              sourceChannels.map((channel) => (
                <button
                  key={channel._id}
                  onClick={() => handleSelectChannel(channel._id)}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-2 text-xs font-mono transition-colors',
                    selectedChannelId === channel._id
                      ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-foreground)]'
                      : channel.muted
                        ? 'text-[var(--theme-foreground-tertiary)]/50 hover:bg-[var(--theme-background-tertiary)]'
                        : 'text-[var(--theme-foreground-secondary)] hover:bg-[var(--theme-background-tertiary)] hover:text-[var(--theme-foreground)]'
                  )}
                >
                  <span className="truncate">
                    {channel.channelType === 'channel' && '# '}
                    {channel.name}
                  </span>
                  {channel.unreadCount > 0 && !channel.muted && (
                    <span className="px-1 py-px text-[10px] font-bold bg-[var(--theme-primary)] text-white min-w-[16px] text-center flex-shrink-0">
                      {channel.unreadCount}
                    </span>
                  )}
                </button>
              ))}
          </div>
        )
      })}

      {filteredChannels.length === 0 && (
        <div className="px-3 py-6 text-center font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
          No channels found
        </div>
      )}
    </div>
  )
}
