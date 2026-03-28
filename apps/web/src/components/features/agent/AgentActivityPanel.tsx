import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import {
  HiOutlineInbox,
  HiOutlineLightningBolt,
  HiOutlineUserAdd,
  HiOutlineLightBulb,
  HiOutlineChevronRight,
} from 'react-icons/hi'
import BrutalCard from '@/components/ui/BrutalCard'

const TYPE_ICONS = {
  triage: HiOutlineInbox,
  skill_run: HiOutlineLightningBolt,
  auto_assign: HiOutlineUserAdd,
  insight: HiOutlineLightBulb,
  skill_auto_apply: HiOutlineLightningBolt,
} as const

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface AgentActivityPanelProps {
  workspaceId: Id<'workspaces'>
}

export default function AgentActivityPanel({ workspaceId }: AgentActivityPanelProps) {
  const activities = useQuery(api.agent.queries.getAgentActivityFeed, {
    workspaceId,
    limit: 10,
  })

  return (
    <BrutalCard variant="default" padding="sm" className="h-full">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--theme-border)]/50">
        <div className="flex items-center gap-2">
          <HiOutlineLightningBolt className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)]">
            Agent Activity
          </h2>
        </div>
        <Link
          to="/triage"
          className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/40 hover:text-[#F59E0B] flex items-center gap-1"
        >
          View All <HiOutlineChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        {activities === undefined ? (
          <div className="flex items-center justify-center py-8">
            <span className="animate-spin w-4 h-4 border-2 border-[#F59E0B] border-t-transparent rounded-full" />
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity, i) => {
            const Icon = TYPE_ICONS[activity.type] ?? HiOutlineLightningBolt
            return (
              <m.div
                key={activity._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group flex items-start gap-3 px-2 py-2 border border-transparent hover:border-[#F59E0B]/30 hover:bg-[#F59E0B]/5 cursor-default"
              >
                <div className="w-6 h-6 border border-[#F59E0B]/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--theme-foreground)]/70 leading-tight">
                    {activity.description}
                  </p>
                  {activity.taskTitle && (
                    <span className="font-mono text-[10px] text-[#F59E0B]/80 truncate block mt-0.5">
                      {activity.taskTitle}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-[var(--theme-foreground)]/30 shrink-0 mt-0.5">
                  {formatRelativeTime(activity._creationTime)}
                </span>
              </m.div>
            )
          })
        ) : (
          <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center border-2 border-[#F59E0B]/30 text-[#F59E0B]/40">
              <HiOutlineLightningBolt className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[var(--theme-foreground)] mb-0.5">No Agent Activity Yet</p>
            <p className="text-[11px] text-[var(--theme-foreground)]/40 font-mono">
              Create a task to see the triage agent in action.
            </p>
          </div>
        )}
      </div>
    </BrutalCard>
  )
}
