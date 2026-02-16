import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import {
  HiOutlineClipboardCheck,
  HiOutlineChartBar,
  HiOutlineLightningBolt,
  HiOutlineExclamation,
} from 'react-icons/hi'

interface WorkspaceAnalyticsProps {
  workspaceId: string
}

const STATUS_COLORS: Record<string, string> = {
  backlog: '#6B7280',
  todo: '#9CA3AF',
  in_progress: '#6366F1',
  in_review: '#8B5CF6',
  done: '#22C55E',
  cancelled: '#EF4444',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#6366F1',
  low: '#6B7280',
}

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 flex items-center justify-center border-2 border-[var(--theme-border)]" style={{ color }}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-[var(--theme-foreground)] font-mono">{value}</div>
      {sub && <div className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] mt-1">{sub}</div>}
    </div>
  )
}

function HorizontalBar({ label, value, max, color }: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] text-[var(--theme-foreground-secondary)] w-20 text-right shrink-0">
        {label}
      </span>
      <div className="flex-1 h-5 bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)] relative">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs text-[var(--theme-foreground)] w-8 text-right shrink-0">{value}</span>
    </div>
  )
}

export default function WorkspaceAnalytics({ workspaceId }: WorkspaceAnalyticsProps) {
  const data = useQuery(
    api.analytics.queries.getWorkspaceAnalytics,
    { workspaceId: workspaceId as Id<'workspaces'> }
  )

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  const maxStatus = Math.max(...Object.values(data.tasks.byStatus), 1)
  const maxPriority = Math.max(...Object.values(data.tasks.byPriority), 1)
  const maxVelocity = Math.max(...data.velocity.map((v) => v.completedCount), 1)

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] inline-block mb-1">
          Workspace
        </span>
        <h2 className="text-lg font-bold text-[var(--theme-foreground)]">Analytics</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={HiOutlineClipboardCheck}
          label="Total Tasks"
          value={data.tasks.total}
          sub={`${data.tasks.recentCompletions} completed this week`}
          color="#6366F1"
        />
        <StatCard
          icon={HiOutlineChartBar}
          label="Completion Rate"
          value={`${data.tasks.completionRate}%`}
          sub={`${data.tasks.byStatus['done'] ?? 0} done of ${data.tasks.total - (data.tasks.byStatus['cancelled'] ?? 0)}`}
          color="#22C55E"
        />
        <StatCard
          icon={HiOutlineLightningBolt}
          label="Active Sprints"
          value={data.sprints.active}
          sub={`${data.sprints.total} total, ${data.sprints.completed} completed`}
          color="#8B5CF6"
        />
        <StatCard
          icon={HiOutlineExclamation}
          label="Overdue"
          value={data.tasks.overdue}
          sub={data.tasks.overdue > 0 ? 'Tasks past due date' : 'No overdue tasks'}
          color={data.tasks.overdue > 0 ? '#EF4444' : '#22C55E'}
        />
      </div>

      {/* Task Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Status */}
        <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)] mb-3">
            Tasks by Status
          </h3>
          <div className="space-y-2">
            {['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'].map((status) => (
              <HorizontalBar
                key={status}
                label={STATUS_LABELS[status] ?? status}
                value={data.tasks.byStatus[status] ?? 0}
                max={maxStatus}
                color={STATUS_COLORS[status] ?? '#6B7280'}
              />
            ))}
          </div>
        </div>

        {/* By Priority */}
        <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)] mb-3">
            Tasks by Priority
          </h3>
          <div className="space-y-2">
            {['urgent', 'high', 'medium', 'low'].map((priority) => (
              <HorizontalBar
                key={priority}
                label={PRIORITY_LABELS[priority] ?? priority}
                value={data.tasks.byPriority[priority] ?? 0}
                max={maxPriority}
                color={PRIORITY_COLORS[priority] ?? '#6B7280'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Velocity */}
      <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-4">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)] mb-3">
          Velocity (Last 4 Weeks)
        </h3>
        <div className="flex items-end gap-3 h-32">
          {data.velocity.map((week) => {
            const pct = maxVelocity > 0 ? (week.completedCount / maxVelocity) * 100 : 0
            return (
              <div key={week.weekLabel} className="flex-1 flex flex-col items-center gap-1">
                <span className="font-mono text-xs font-bold text-[var(--theme-foreground)]">
                  {week.completedCount}
                </span>
                <div className="w-full bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)] relative" style={{ height: '80px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[var(--theme-primary)] transition-all duration-500"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">{week.weekLabel}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Team & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Contributors */}
        <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)] mb-3">
            Top Contributors
          </h3>
          {data.team.length === 0 ? (
            <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">No assigned tasks yet</p>
          ) : (
            <div className="space-y-2">
              {data.team.map((member) => (
                <div key={member.userId} className="flex items-center justify-between py-1.5 border-b border-[var(--theme-border)] last:border-0">
                  <span className="font-mono text-xs text-[var(--theme-foreground-secondary)] truncate">{member.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-[var(--theme-success)]">{member.completedCount} done</span>
                    <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">{member.taskCount} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)] mb-3">
            Tasks by Project
          </h3>
          {data.projects.length === 0 ? (
            <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">No projects yet</p>
          ) : (
            <div className="space-y-2">
              {data.projects.map((project) => {
                const pct = project.taskCount > 0
                  ? Math.round((project.completedCount / project.taskCount) * 100)
                  : 0
                return (
                  <div key={project.projectId} className="py-1.5 border-b border-[var(--theme-border)] last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-[var(--theme-foreground-secondary)] truncate">{project.name}</span>
                      <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] shrink-0">{project.taskCount} tasks</span>
                    </div>
                    <div className="h-1.5 bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)]">
                      <div
                        className="h-full bg-[var(--theme-primary)] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
