import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import MessageCard from './MessageCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'

type Source = 'slack' | 'github' | 'discord' | 'jira' | 'internal'

interface UnifiedMessageFeedProps {
  workspaceId: Id<'workspaces'>
  selectedSources: Source[]
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

export default function UnifiedMessageFeed({ workspaceId, selectedSources }: UnifiedMessageFeedProps) {
  const messages = useQuery(
    api.communications.queries.getUnifiedFeed,
    {
      workspaceId,
      limit: 50,
      sources: selectedSources.length > 0 ? selectedSources : undefined,
    }
  )

  if (messages === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 font-mono text-[#6B7280]">
        <div className="w-10 h-10 border-2 border-[#2E2E35] flex items-center justify-center mb-3">
          <span className="text-lg">📭</span>
        </div>
        <p className="text-xs">No messages yet</p>
        <p className="text-[10px] mt-1">Messages from connected integrations will appear here</p>
      </div>
    )
  }

  // Group messages by date
  let lastDate = ''
  const elements: JSX.Element[] = []

  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString()
    if (dateKey !== lastDate) {
      lastDate = dateKey
      elements.push(
        <div key={`date-${dateKey}`} className="flex items-center gap-3 py-2 px-4">
          <div className="flex-1 h-px bg-[#2E2E35]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
            {formatDateSeparator(msg.createdAt)}
          </span>
          <div className="flex-1 h-px bg-[#2E2E35]" />
        </div>
      )
    }

    elements.push(
      <div key={msg._id} className="px-4">
        <MessageCard message={msg} showChannel />
      </div>
    )
  }

  return (
    <div className="py-2 space-y-2">
      {/* Feed header */}
      <div className="px-4 py-2">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
          Unified Feed
          {selectedSources.length > 0 && (
            <span className="ml-2 text-[#6366F1]">
              ({selectedSources.join(', ')})
            </span>
          )}
        </h3>
      </div>

      {elements}
    </div>
  )
}
