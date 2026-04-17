import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineLightningBolt,
  HiOutlineInbox,
  HiOutlineUserAdd,
  HiOutlineLightBulb,
} from 'react-icons/hi'

interface TaskAgentActivityProps {
  taskId: Id<'tasks'>
}

const TYPE_ICON = {
  triage: HiOutlineInbox,
  skill_run: HiOutlineLightningBolt,
  skill_auto_apply: HiOutlineLightningBolt,
  auto_assign: HiOutlineUserAdd,
  insight: HiOutlineLightBulb,
} as const

const TYPE_COLOR = {
  triage: '#06B6D4',
  skill_run: '#F59E0B',
  skill_auto_apply: '#F59E0B',
  auto_assign: '#8B5CF6',
  insight: '#22C55E',
} as const

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function TaskAgentActivity({ taskId }: TaskAgentActivityProps) {
  const activities = useQuery(api.agent.queries.getTaskAgentActivity, {
    taskId,
    limit: 15,
  })

  // Hide entirely until we know there's something to show. Prevents a flash
  // of an empty "Agent Activity" section on fresh tasks.
  if (!activities || activities.length === 0) return null

  return (
    <div>
      <h3 className="text-brutal-sm font-mono uppercase mb-[6px] flex items-center gap-[4px]">
        <HiOutlineLightningBolt className="w-16px h-16px text-[#F59E0B]" />
        AGENT ACTIVITY
        <span className="text-brutal-xs text-[var(--theme-foreground-tertiary)] font-normal">
          ({activities.length})
        </span>
      </h3>
      <div className="space-y-[4px]">
        {activities.map((activity) => {
          const Icon = TYPE_ICON[activity.type] ?? HiOutlineLightningBolt
          const color = TYPE_COLOR[activity.type] ?? '#F59E0B'
          const isAuto = activity.type === 'skill_auto_apply'
          return (
            <div
              key={activity._id}
              className="flex items-start gap-[8px] p-[8px] border border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/5"
            >
              <div
                className="w-[20px] h-[20px] flex items-center justify-center flex-shrink-0 border"
                style={{ borderColor: `${color}40`, color, backgroundColor: `${color}0d` }}
              >
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[6px] flex-wrap">
                  {activity.skillName && (
                    <span
                      className="px-1 py-px text-[9px] font-mono font-bold uppercase tracking-wider border"
                      style={{
                        color,
                        borderColor: `${color}40`,
                        backgroundColor: `${color}0d`,
                      }}
                    >
                      {activity.skillName}
                    </span>
                  )}
                  {isAuto && (
                    <span className="px-1 py-px text-[9px] font-mono uppercase tracking-wider text-[var(--theme-foreground-tertiary)] border border-[var(--theme-border)]">
                      AUTO
                    </span>
                  )}
                </div>
                <p className="text-brutal-xs text-[var(--theme-foreground-secondary)] mt-px">
                  {activity.description}
                </p>
              </div>
              <span className="text-[10px] font-mono text-[var(--theme-foreground-tertiary)] flex-shrink-0">
                {relativeTime(activity._creationTime)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
