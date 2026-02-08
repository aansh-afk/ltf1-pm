import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import IntegrationStatusBar from './IntegrationStatusBar'
import SourceFilter from './SourceFilter'
import ChannelSidebar from './ChannelSidebar'
import UnifiedMessageFeed from './UnifiedMessageFeed'
import ChannelMessageFeed from './ChannelMessageFeed'
import CommsEmptyState from './CommsEmptyState'

type Source = 'slack' | 'github' | 'discord' | 'jira' | 'internal'

interface CommunicationsTabProps {
  workspace: any
  workspaceId: string
}

export default function CommunicationsTab({ workspace, workspaceId }: CommunicationsTabProps) {
  const [selectedSources, setSelectedSources] = useState<Source[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<Id<'commsChannels'> | null>(null)

  const stats = useQuery(
    api.communications.queries.getCommsStats,
    { workspaceId: workspaceId as Id<'workspaces'> }
  )

  const channels = useQuery(
    api.communications.queries.getCommsChannels,
    { workspaceId: workspaceId as Id<'workspaces'> }
  )

  const hasChannels = channels && channels.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1F1F23]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] inline-block mb-1">
              Communications
            </span>
            <h2 className="text-lg font-bold text-[#F9FAFB]">Comms Hub</h2>
          </div>
          {stats && (
            <div className="flex items-center gap-4 font-mono text-[10px] text-[#6B7280]">
              <span>{stats.totalChannels} channels</span>
              <span className="text-[#2E2E35]">|</span>
              <span>{stats.messagesLast24h} msgs/24h</span>
              {stats.totalUnread > 0 && (
                <>
                  <span className="text-[#2E2E35]">|</span>
                  <span className="text-[#EF4444] font-bold">{stats.totalUnread} unread</span>
                </>
              )}
            </div>
          )}
        </div>

        <IntegrationStatusBar workspaceId={workspaceId} stats={stats} />
        <SourceFilter
          selectedSources={selectedSources}
          onSourcesChange={setSelectedSources}
          stats={stats}
        />
      </div>

      {/* Content */}
      {!hasChannels ? (
        <CommsEmptyState />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Channel Sidebar */}
          <ChannelSidebar
            channels={channels}
            selectedChannelId={selectedChannelId}
            selectedSources={selectedSources}
            onSelectChannel={setSelectedChannelId}
          />

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto">
            {selectedChannelId ? (
              <ChannelMessageFeed
                channelId={selectedChannelId}
                channels={channels}
              />
            ) : (
              <UnifiedMessageFeed
                workspaceId={workspaceId as Id<'workspaces'>}
                selectedSources={selectedSources}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
