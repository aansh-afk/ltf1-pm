import { m } from 'framer-motion'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import { usePageTitle } from '../hooks/usePageTitle'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

interface ChangeEntry {
  type: 'feat' | 'fix' | 'security' | 'perf'
  text: string
}

interface Release {
  version: string
  date: string
  tag: string
  tagColor: string
  summary: string
  changes: ChangeEntry[]
}

const RELEASES: Release[] = [
  {
    version: '0.3.0',
    date: 'Feb 2026',
    tag: 'SECURITY + POLISH',
    tagColor: '#EF4444',
    summary: 'Security hardening across the backend, notification system polish, and time tracking refinements.',
    changes: [
      { type: 'security', text: 'Automation mutations now verify workspace membership before executing actions' },
      { type: 'security', text: 'Time entries scoped to requesting user — cross-user data leak eliminated' },
      { type: 'security', text: 'Audit log creation moved to internalMutation — no longer callable from the browser' },
      { type: 'security', text: 'Bulk task operations require workspace membership verification per task' },
      { type: 'security', text: 'Slack botAccessToken removed from client-facing query return values' },
      { type: 'perf', text: 'Composite index on timeEntries (workspaceId + userId) for faster report queries' },
      { type: 'perf', text: 'Composite index on auditLogs (workspaceId + _creationTime) for paginated history' },
      { type: 'fix', text: 'NotificationCenter now uses CSS variable color tokens — no more hardcoded hex' },
      { type: 'fix', text: 'WorkflowBuilder operator precedence bug: runCount ?? 0 + 1 → (runCount ?? 0) + 1' },
      { type: 'fix', text: 'WorkspaceSettings page no longer crashes on feature key lookup' },
      { type: 'fix', text: 'Project members now queried from projectMembers junction table, not stale array field' },
      { type: 'feat', text: 'Per-type notification preferences: granular on/off per notification category' },
      { type: 'feat', text: 'CSV export on TimeReportPage for workspace billing and audit use cases' },
      { type: 'fix', text: 'Time tracker deduplication — simultaneous entries on same task prevented' },
    ],
  },
  {
    version: '0.2.0',
    date: 'Feb 2026',
    tag: 'FEATURES',
    tagColor: '#6366F1',
    summary: 'Notification system, time tracking UI, sprint analytics, and bulk task operations.',
    changes: [
      { type: 'feat', text: 'Real-time notification center: bell icon, unread count, mark-as-read, mark-all-read' },
      { type: 'feat', text: 'All notification types wired to backend — task updates, mentions, sprint events, and more' },
      { type: 'feat', text: 'TimeTracker component: start, pause, resume, and stop with live elapsed timer' },
      { type: 'feat', text: 'TaskTimePanel: per-task time entry history with total tracked time' },
      { type: 'feat', text: 'TimeReportPage: workspace-wide time report with date range filters and user breakdown' },
      { type: 'feat', text: 'Sprint burndown chart using recharts — actual vs ideal remaining story points' },
      { type: 'feat', text: 'Velocity chart: completed story points across last 6 sprints with average line' },
      { type: 'feat', text: 'TeamPage analytics tab — burndown and velocity charts side by side' },
      { type: 'feat', text: 'Daily sprint snapshot cron captures points and task counts for burndown history' },
      { type: 'feat', text: 'Bulk task select: checkboxes on TaskTable, select-all, Cmd+A shortcut' },
      { type: 'feat', text: 'BulkActionBar: floating action bar for status, priority, assign, and delete on selected tasks' },
      { type: 'feat', text: 'bulkUpdateTasks and bulkDeleteTasks mutations with auth enforcement' },
      { type: 'feat', text: 'Early Access beta banner — dismissible, stored in localStorage' },
      { type: 'fix', text: 'Dashboard meetings count uses real getUserMeetings query instead of hardcoded 0' },
      { type: 'fix', text: 'System Metrics widget removed from Dashboard — was showing fake CPU/memory values' },
      { type: 'feat', text: 'WorkflowBuilder: field condition support, schedule triggers, Slack and webhook steps, AI summarize action' },
    ],
  },
  {
    version: '0.1.0',
    date: 'Jan 2026',
    tag: 'INITIAL RELEASE',
    tagColor: '#22C55E',
    summary: 'Core platform launch — tasks, sprints, workspaces, developer profiles, and integrations.',
    changes: [
      { type: 'feat', text: 'Task management: create, edit, delete, priority, status, labels, assignees, custom fields' },
      { type: 'feat', text: 'Sprint planning: backlog, active sprint board, story points, sprint lifecycle' },
      { type: 'feat', text: 'Multi-workspace support with project members, roles, and invitations' },
      { type: 'feat', text: 'Developer profiles: skills, expertise search, GitHub account linking' },
      { type: 'feat', text: 'Collaborative whiteboard: Yjs-powered canvas with multi-user cursors' },
      { type: 'feat', text: 'GitHub integration: PR and commit linking to tasks and sprints' },
      { type: 'feat', text: 'Slack integration: workspace notifications and channel webhooks' },
      { type: 'feat', text: 'AI task descriptions and sprint planning suggestions' },
      { type: 'feat', text: 'Automation builder: cron triggers, conditional logic, multi-step action chains' },
      { type: 'feat', text: 'Comment threads on tasks with @mention support' },
      { type: 'feat', text: 'Custom fields: text, number, date, select, multi-select per project' },
      { type: 'feat', text: 'Keyboard shortcut system: Cmd+K command palette, assignable workspace shortcuts' },
      { type: 'feat', text: 'Dark brutalist terminal UI — IBM Plex Mono, hard shadows, zero border radius on cards' },
    ],
  },
]

const TYPE_CONFIG = {
  feat:     { label: 'FEAT',     color: '#6366F1', bg: 'rgba(99,102,241,0.1)'  },
  fix:      { label: 'FIX',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  security: { label: 'SECURITY', color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  perf:     { label: 'PERF',     color: '#22C55E', bg: 'rgba(34,197,94,0.1)'   },
}

export default function ChangelogPage() {
  usePageTitle('Changelog — LTF1')

  return (
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <m.div {...fadeUp}>
            <span className="text-[#6B7280] text-xs font-mono uppercase tracking-wider inline-block mb-4">
              Changelog
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#F9FAFB] mb-6">
              What we shipped
            </h1>
            <p className="text-lg text-[#6B7280] max-w-xl leading-relaxed">
              Every release. Every fix. No marketing spin — just what changed and why it matters.
            </p>
          </m.div>
        </div>
      </section>

      {/* Releases */}
      <section className="pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col gap-16">
            {RELEASES.map((release, i) => (
              <m.div
                key={release.version}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <div className="flex flex-col md:flex-row md:gap-12">
                  {/* Version sidebar */}
                  <div className="md:w-48 shrink-0 mb-6 md:mb-0">
                    <div className="md:sticky md:top-28">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="font-mono text-2xl font-bold"
                          style={{ color: release.tagColor }}
                        >
                          v{release.version}
                        </span>
                      </div>
                      <span
                        className="inline-block font-mono text-[10px] tracking-widest px-2 py-1 border mb-3"
                        style={{
                          color: release.tagColor,
                          borderColor: release.tagColor,
                          backgroundColor: `${release.tagColor}15`,
                        }}
                      >
                        {release.tag}
                      </span>
                      <p className="text-[#6B7280] text-xs font-mono">{release.date}</p>
                    </div>
                  </div>

                  {/* Release body */}
                  <div className="flex-1 border-2 border-[#2E2E35] bg-[#0A0A0A] p-6 shadow-[4px_4px_0px_#111111]">
                    <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6 border-b border-[#1F1F23] pb-6">
                      {release.summary}
                    </p>

                    <ul className="flex flex-col gap-3">
                      {release.changes.map((entry, j) => {
                        const cfg = TYPE_CONFIG[entry.type]
                        return (
                          <li key={j} className="flex items-start gap-3">
                            <span
                              className="shrink-0 font-mono text-[9px] tracking-widest px-1.5 py-0.5 mt-0.5 border font-semibold"
                              style={{
                                color: cfg.color,
                                borderColor: cfg.color,
                                backgroundColor: cfg.bg,
                              }}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-[#9CA3AF] text-sm leading-relaxed">
                              {entry.text}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </m.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <m.div
            {...fadeUp}
            className="mt-20 border-2 border-[#2E2E35] bg-[#0A0A0A] p-8 text-center shadow-[4px_4px_0px_#111111]"
          >
            <span className="text-[#6B7280] text-xs font-mono uppercase tracking-wider block mb-4">
              Early Access
            </span>
            <h2 className="text-2xl font-bold text-[#F9FAFB] mb-3">
              Shipping fast, every week
            </h2>
            <p className="text-[#6B7280] text-sm max-w-md mx-auto mb-6 leading-relaxed">
              LTF1 is in active development. New releases drop weekly.
              Join early access to get updates as they ship.
            </p>
            <a
              href="/sign-up"
              className="inline-block px-8 py-3 font-mono text-sm font-semibold bg-[#6366F1] hover:bg-[#4F46E5] text-white border-2 border-[#4F46E5] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200"
            >
              JOIN EARLY ACCESS
            </a>
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
