import ErrorBoundary from '@/components/common/ErrorBoundary'
import { m, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import PublicNavigation from '@/components/common/PublicNavigation'
import Footer from '@/components/common/Footer'
import { usePageTitle } from '@/hooks/usePageTitle'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

type Platform = 'web' | 'api' | 'cli'

interface ChangeEntry {
  type: 'feat' | 'fix' | 'security' | 'perf'
  platform: Platform
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
    version: '0.1.8',
    date: 'Apr 4, 2026',
    tag: 'TUI V3',
    tagColor: '#6366F1',
    summary: 'Major TUI design system overhaul — bordered sections with rounded corners, redesigned sidebar with highlight backgrounds and badge support, bracket key hints, kanban sprint view, split-pane git with diff preview, grouped search results, and table-based help page.',
    changes: [
      { type: 'feat', platform: 'cli', text: 'Bordered section component — all content areas wrapped in rounded box-drawing borders (╭─╮│╰─╯) with header text embedded in top border' },
      { type: 'feat', platform: 'cli', text: 'Sidebar redesign — active item gets ▌ left bar + BgHighlight background, notification badge count support' },
      { type: 'feat', platform: 'cli', text: 'Dashboard 60/40 split layout — MY TASKS list + WORKSPACE STATS (Total, Completed, In Progress, Blocked) side by side in bordered sections' },
      { type: 'feat', platform: 'cli', text: 'Sprint kanban view — 3-column bordered layout (TODO / IN PROGRESS / DONE) with ✓ checkmarks on completed tasks' },
      { type: 'feat', platform: 'cli', text: 'Git split-pane — left: staged/unstaged file lists, right: bordered diff preview with syntax-colored output, bottom: commit message input' },
      { type: 'feat', platform: 'cli', text: 'Search grouped results — results organized by type (TASKS / PROJECTS / FILES) with counts and status badges' },
      { type: 'feat', platform: 'cli', text: 'Help table layout — two-column bordered tables (GLOBAL + NAVIGATION side by side), TASK MANAGEMENT table, version footer' },
      { type: 'feat', platform: 'cli', text: 'Tasks filter bar — bracket-style dropdowns [Status: All] [Priority: All] [Assignee: Me]' },
      { type: 'feat', platform: 'cli', text: 'Priority badges in [BRACKETS] — colored [URGENT] [HIGH] [MEDIUM] [LOW] labels' },
      { type: 'feat', platform: 'cli', text: 'Skills page — subtitle text, Enabled ✓ / Disabled ○ toggle format' },
      { type: 'feat', platform: 'cli', text: 'Agent bordered sections — AGENT STATS key-value layout, PENDING TRIAGE with expanded selected card, RECENT ACTIVITY feed' },
      { type: 'feat', platform: 'cli', text: 'Modal redesign — uppercase title, status + priority line, key-value metadata, description, bracket action hints' },
      { type: 'feat', platform: 'cli', text: 'Bracket key hints throughout — all shortcuts now use [key] action format' },
      { type: 'fix', platform: 'cli', text: 'Settings/Help sub-headers now use TextPrimary color instead of accent Indigo' },
      { type: 'fix', platform: 'cli', text: 'Status badge labels properly formatted (In Progress, In Review, etc. instead of raw snake_case)' },
      { type: 'fix', platform: 'cli', text: 'Still looks like shit' },
    ],
  },
  {
    version: '0.1.7',
    date: 'Mar 28, 2026',
    tag: 'TUI V2',
    tagColor: '#22C55E',
    summary: 'Complete terminal UI redesign with panel-based layout, 11 pages, mouse support, auth persistence fix, auto-update system, and new agent/skill CLI commands.',
    changes: [
      { type: 'feat', platform: 'cli', text: 'Full TUI redesign — panel-based layout with bordered sections, color palette matching web app, header/sidebar/statusbar shell' },
      { type: 'feat', platform: 'cli', text: '11 TUI pages: Dashboard, Tasks, Sprint, Agent, Skills, Git, Projects, Search, Notifications, Settings, Help' },
      { type: 'feat', platform: 'cli', text: 'Mouse support via @zenobius/ink-mouse — click sidebar nav items, interactive elements' },
      { type: 'feat', platform: 'cli', text: 'Agent TUI page — inbox-zero triage queue with accept/reject/modify, stats, activity feed' },
      { type: 'feat', platform: 'cli', text: 'Skills TUI page — browse workspace skills, toggle active, run on tasks, skill library' },
      { type: 'feat', platform: 'cli', text: 'Git local-to-web repo linking — auto-detect repo, match to project, user-confirmed linking' },
      { type: 'feat', platform: 'cli', text: 'ltf agent triage/suggest/status commands for CLI scripting' },
      { type: 'feat', platform: 'cli', text: 'ltf skill list/run/create commands for skill management' },
      { type: 'feat', platform: 'cli', text: 'Auto-update system — npm version check on launch, ltf update command, silent auto-update option' },
      { type: 'feat', platform: 'cli', text: 'Projects page — select active project, view repo link status' },
      { type: 'feat', platform: 'cli', text: 'Settings page — triage mode, auto-update toggle, connection info, logout' },
      { type: 'fix', platform: 'cli', text: 'Auth persistence — login now persists between sessions (7-day session expiry, silent refresh via Clerk sessionId)' },
      { type: 'fix', platform: 'cli', text: 'Fixed all TypeScript errors across CLI codebase' },
    ],
  },
  {
    version: '0.1.6',
    date: 'Mar 28, 2026',
    tag: 'AGENT + SKILLS',
    tagColor: '#F59E0B',
    summary: 'Agent-first architecture with AI triage pipeline, skills system, triage page, onboarding wizards, and dashboard agent activity panel.',
    changes: [
      { type: 'feat', platform: 'api', text: 'Agent triage pipeline — auto-categorize, prioritize, and assign tasks on creation using AI' },
      { type: 'feat', platform: 'api', text: 'Skills system — 4 built-in skills (bug-triage, deploy-checklist, sprint-plan, pr-review) with custom skill creation' },
      { type: 'feat', platform: 'api', text: 'Triage suggestions table with pending/accepted/rejected/auto-applied status tracking' },
      { type: 'feat', platform: 'api', text: 'Agent activity logging for all agent actions (triage, skill runs, auto-assign)' },
      { type: 'feat', platform: 'api', text: 'Per-workspace triage mode setting (auto/review/off)' },
      { type: 'feat', platform: 'api', text: 'Skill execution engine with 7 action types: set_type, set_priority, add_label, set_assignee, create_tasks, add_to_sprint, notify_slack' },
      { type: 'feat', platform: 'api', text: 'Auto-skill matching — skills with auto trigger fire on matching task creation' },
      { type: 'feat', platform: 'web', text: 'Triage page — inbox-zero UI with accept/reject/modify, keyboard shortcuts (j/k/a/r/e), project filtering' },
      { type: 'feat', platform: 'web', text: 'Skills page — workspace skills + skill library with 4-step create modal' },
      { type: 'feat', platform: 'web', text: 'Task card agent badges — amber indicator for pending triage, green for auto-triaged' },
      { type: 'feat', platform: 'web', text: 'Task detail "Run Skill" dropdown — execute workspace skills on any task' },
      { type: 'feat', platform: 'web', text: 'Dashboard agent activity panel with triage stats card' },
      { type: 'feat', platform: 'web', text: 'Triage nav item in sidebar with pending count badge' },
      { type: 'feat', platform: 'web', text: 'Workspace onboarding wizard — 4 steps: GitHub, triage mode, invite team, pick skills' },
      { type: 'feat', platform: 'web', text: 'Project onboarding wizard — 3 steps: connect repo, import issues, first sprint' },
      { type: 'fix', platform: 'api', text: 'Automation ACL — 6 security gaps fixed, system functions converted to internal, workspace membership verified' },
      { type: 'fix', platform: 'web', text: 'TaskTable dead buttons wired up (edit, delete, duplicate, bulk actions)' },
      { type: 'fix', platform: 'web', text: 'BulkActionBar now includes all 6 status options (was missing backlog and cancelled)' },
      { type: 'security', platform: 'api', text: 'Time entries cross-user data leakage fixed — workspace membership verification on all queries' },
    ],
  },
  {
    version: '0.1.5',
    date: 'Mar 15, 2026',
    tag: 'PAGES',
    tagColor: '#6366F1',
    summary: 'Notion-like block editor replacing Whiteboard. Create, edit, and organize rich documents with slash commands, drag-and-drop blocks, and real-time collaboration.',
    changes: [
      { type: 'feat', platform: 'web', text: 'Pages — full block editor with 10 block types: paragraph, heading (h1-h3), bullet list, numbered list, toggle list, to-do/checkbox, quote, divider, code block, callout' },
      { type: 'feat', platform: 'web', text: 'Slash commands (/) to insert any block type, drag-and-drop block reordering, and inline formatting (bold, italic, underline, strikethrough, code, link, color)' },
      { type: 'feat', platform: 'web', text: 'Page management: create, rename, delete, archive, restore, nested sub-pages with tree sidebar' },
      { type: 'feat', platform: 'web', text: 'Emoji page icons with picker, debounced auto-save (1.5s), save status indicator' },
      { type: 'feat', platform: 'web', text: 'Multi-user presence indicators on active pages via Convex subscriptions' },
      { type: 'feat', platform: 'api', text: 'Document backend: create, update content/metadata, archive, restore, permanent delete, child documents, search' },
      { type: 'feat', platform: 'web', text: 'Dark brutalist editor theme: 0px radius, hard shadows, #050505 bg, Inter/IBM Plex Mono fonts' },
      { type: 'fix', platform: 'web', text: '/whiteboard route now redirects to /pages — sidebar updated from WHITEBOARD to PAGES' },
    ],
  },
  {
    version: '0.1.4',
    date: 'Feb 22, 2026',
    tag: 'ADMIN + EMAIL',
    tagColor: '#8B5CF6',
    summary: 'Admin bug reports page, email system rebrand to LTF1, external user invitation flow, and notification schema fixes.',
    changes: [
      { type: 'feat', platform: 'web', text: 'Admin Bug Reports page at /admin/bugs — filter by status and severity, expand rows for full detail, screenshots, recorded steps' },
      { type: 'security', platform: 'api', text: 'Bug report queries and mutations require admin role — backend + frontend guards' },
      { type: 'feat', platform: 'web', text: 'BUG REPORTS nav link in sidebar visible only to admin users' },
      { type: 'feat', platform: 'api', text: 'External user invitations — non-registered users receive signup link with workspace invite context' },
      { type: 'feat', platform: 'api', text: 'Auto-accept pending workspace invitations when new users complete signup' },
      { type: 'fix', platform: 'api', text: 'Email sender and templates rebranded from LTF1 to LTF1' },
      { type: 'fix', platform: 'api', text: 'Notifications schema relaxed to accept legacy document shapes (dot-notation types, old field names)' },
      { type: 'fix', platform: 'web', text: 'Report Bug button in beta banner sized down for cleaner layout' },
    ],
  },
  {
    version: '0.1.3',
    date: 'Feb 22, 2026',
    tag: 'SECURITY + POLISH',
    tagColor: '#EF4444',
    summary: 'Security hardening across the backend, notification system polish, and time tracking refinements.',
    changes: [
      { type: 'security', platform: 'api', text: 'Automation mutations now verify workspace membership before executing actions' },
      { type: 'security', platform: 'api', text: 'Time entries scoped to requesting user — cross-user data leak eliminated' },
      { type: 'security', platform: 'api', text: 'Audit log creation moved to internalMutation — no longer callable from the browser' },
      { type: 'security', platform: 'api', text: 'Bulk task operations require workspace membership verification per task' },
      { type: 'security', platform: 'api', text: 'Slack botAccessToken removed from client-facing query return values' },
      { type: 'perf', platform: 'api', text: 'Composite index on timeEntries (workspaceId + userId) for faster report queries' },
      { type: 'perf', platform: 'api', text: 'Composite index on auditLogs (workspaceId + _creationTime) for paginated history' },
      { type: 'fix', platform: 'web', text: 'NotificationCenter now uses CSS variable color tokens — no more hardcoded hex' },
      { type: 'fix', platform: 'api', text: 'WorkflowBuilder operator precedence bug: runCount ?? 0 + 1 → (runCount ?? 0) + 1' },
      { type: 'fix', platform: 'web', text: 'WorkspaceSettings page no longer crashes on feature key lookup' },
      { type: 'fix', platform: 'api', text: 'Project members now queried from projectMembers junction table, not stale array field' },
      { type: 'feat', platform: 'web', text: 'Per-type notification preferences: granular on/off per notification category' },
      { type: 'feat', platform: 'web', text: 'CSV export on TimeReportPage for workspace billing and audit use cases' },
      { type: 'fix', platform: 'api', text: 'Time tracker deduplication — simultaneous entries on same task prevented' },
    ],
  },
  {
    version: '0.1.2',
    date: 'Feb 15, 2026',
    tag: 'FEATURES',
    tagColor: '#6366F1',
    summary: 'Notification system, time tracking UI, sprint analytics, and bulk task operations.',
    changes: [
      { type: 'feat', platform: 'web', text: 'Real-time notification center: bell icon, unread count, mark-as-read, mark-all-read' },
      { type: 'feat', platform: 'api', text: 'All notification types wired to backend — task updates, mentions, sprint events, and more' },
      { type: 'feat', platform: 'web', text: 'TimeTracker component: start, pause, resume, and stop with live elapsed timer' },
      { type: 'feat', platform: 'web', text: 'TaskTimePanel: per-task time entry history with total tracked time' },
      { type: 'feat', platform: 'web', text: 'TimeReportPage: workspace-wide time report with date range filters and user breakdown' },
      { type: 'feat', platform: 'web', text: 'Sprint burndown chart using recharts — actual vs ideal remaining story points' },
      { type: 'feat', platform: 'web', text: 'Velocity chart: completed story points across last 6 sprints with average line' },
      { type: 'feat', platform: 'web', text: 'TeamPage analytics tab — burndown and velocity charts side by side' },
      { type: 'feat', platform: 'api', text: 'Daily sprint snapshot cron captures points and task counts for burndown history' },
      { type: 'feat', platform: 'web', text: 'Bulk task select: checkboxes on TaskTable, select-all, Cmd+A shortcut' },
      { type: 'feat', platform: 'web', text: 'BulkActionBar: floating action bar for status, priority, assign, and delete on selected tasks' },
      { type: 'feat', platform: 'api', text: 'bulkUpdateTasks and bulkDeleteTasks mutations with auth enforcement' },
      { type: 'fix', platform: 'web', text: 'Dashboard meetings count uses real getUserMeetings query instead of hardcoded 0' },
      { type: 'fix', platform: 'web', text: 'System Metrics widget removed from Dashboard — was showing fake CPU/memory values' },
      { type: 'feat', platform: 'web', text: 'WorkflowBuilder: field condition support, schedule triggers, Slack and webhook steps, AI summarize action' },
    ],
  },
  {
    version: '0.1.1',
    date: 'Jan 2026',
    tag: 'INITIAL RELEASE',
    tagColor: '#22C55E',
    summary: 'Core platform launch — tasks, sprints, workspaces, developer profiles, and integrations.',
    changes: [
      { type: 'feat', platform: 'web', text: 'Task management: create, edit, delete, priority, status, labels, assignees, custom fields' },
      { type: 'feat', platform: 'web', text: 'Sprint planning: backlog, active sprint board, story points, sprint lifecycle' },
      { type: 'feat', platform: 'api', text: 'Multi-workspace support with project members, roles, and invitations' },
      { type: 'feat', platform: 'web', text: 'Developer profiles: skills, expertise search, GitHub account linking' },
      { type: 'feat', platform: 'web', text: 'Collaborative whiteboard: Yjs-powered canvas with multi-user cursors' },
      { type: 'feat', platform: 'api', text: 'GitHub integration: PR and commit linking to tasks and sprints' },
      { type: 'feat', platform: 'api', text: 'Slack integration: workspace notifications and channel webhooks' },
      { type: 'feat', platform: 'api', text: 'AI task descriptions and sprint planning suggestions' },
      { type: 'feat', platform: 'web', text: 'Automation builder: cron triggers, conditional logic, multi-step action chains' },
      { type: 'feat', platform: 'api', text: 'Comment threads on tasks with @mention support' },
      { type: 'feat', platform: 'api', text: 'Custom fields: text, number, date, select, multi-select per project' },
      { type: 'feat', platform: 'web', text: 'Keyboard shortcut system: Cmd+K command palette, assignable workspace shortcuts' },
      { type: 'feat', platform: 'web', text: 'Dark brutalist terminal UI — IBM Plex Mono, hard shadows, zero border radius on cards' },
      { type: 'feat', platform: 'cli', text: 'CLI authentication flow with browser-based OAuth handoff' },
    ],
  },
]

const TYPE_CONFIG = {
  feat:     { label: 'FEAT',     color: '#6366F1' },
  fix:      { label: 'FIX',      color: '#F59E0B' },
  security: { label: 'SECURITY', color: '#EF4444' },
  perf:     { label: 'PERF',     color: '#22C55E' },
} as const

const PLATFORM_CONFIG = {
  web: { label: 'WEB',  color: '#9CA3AF' },
  api: { label: 'API',  color: '#6B7280' },
  cli: { label: 'CLI',  color: '#6B7280' },
} as const

function groupByPlatform(changes: ChangeEntry[]) {
  const groups: { platform: Platform; label: string; entries: ChangeEntry[] }[] = []
  const platformOrder: Platform[] = ['web', 'api', 'cli']
  const platformLabels = { web: 'Web App', api: 'Backend / API', cli: 'CLI' }

  for (const p of platformOrder) {
    const entries = changes.filter((c) => c.platform === p)
    if (entries.length > 0) {
      groups.push({ platform: p, label: platformLabels[p], entries })
    }
  }
  return groups
}

/* ── Mobile platform accordion ──────────────────────────── */

function MobilePlatformGroup({ platform, label, entries }: {
  platform: Platform
  label: string
  entries: ChangeEntry[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-[#2E2E35] bg-[#0A0A0A]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6366F1]"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest px-1.5 py-0.5 border border-[#2E2E35] text-[#6B7280]">
            {PLATFORM_CONFIG[platform].label}
          </span>
          <span className="text-[#6B7280] text-xs font-mono">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#6B7280] text-[10px] font-mono">{entries.length}</span>
          <span
            className="text-[#6B7280] text-xs transition-transform duration-200"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▸
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-2 px-4 pb-4">
              {entries.map((entry, j) => {
                const cfg = TYPE_CONFIG[entry.type]
                return (
                  <li key={j} className="flex items-start gap-2">
                    <span
                      className="shrink-0 font-mono text-[9px] tracking-wider px-1 py-px mt-[3px] font-semibold"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[#9CA3AF] text-[13px] leading-relaxed">
                      {entry.text}
                    </span>
                  </li>
                )
              })}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Floating mobile version indicator ──────────────────── */

function MobileVersionIndicator() {
  const [activeVersion, setActiveVersion] = useState<Release | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sectionEls = document.querySelectorAll<HTMLElement>('[data-version]')
    if (sectionEls.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const version = entry.target.getAttribute('data-version')
            const release = RELEASES.find((r) => r.version === version)
            if (release) setActiveVersion(release)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    )

    sectionEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!activeVersion || !visible) return null

  return (
    <m.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      className="md:hidden fixed top-[68px] left-0 right-0 z-40 flex justify-center pointer-events-none"
    >
      <div
        className="pointer-events-auto px-4 py-1.5 border bg-[#0A0A0A]/90 backdrop-blur-sm flex items-center gap-2 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
        style={{ borderColor: activeVersion.tagColor }}
      >
        <span
          className="font-mono text-sm font-bold"
          style={{ color: activeVersion.tagColor }}
        >
          v{activeVersion.version}
        </span>
        <span className="w-px h-3 bg-[#2E2E35]" />
        <span className="font-mono text-[9px] tracking-widest text-[#6B7280]">
          {activeVersion.tag}
        </span>
      </div>
    </m.div>
  )
}

/* ── Page ────────────────────────────────────────────────── */

export default function ChangelogPage() {
  usePageTitle('Changelog — LTF1')

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />
      <MobileVersionIndicator />

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
          <div className="flex flex-col gap-0">
            {RELEASES.map((release, i) => {
              const groups = groupByPlatform(release.changes)
              return (
                <m.div
                  key={release.version}
                  data-version={release.version}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  {/* ── Desktop: sticky sidebar layout ── */}
                  <div className="hidden md:flex md:items-start md:gap-12 pb-16">
                    <div className="md:w-44 shrink-0 md:self-stretch">
                      <div className="md:sticky md:top-24">
                        <span
                          className="font-mono text-2xl font-bold block mb-2"
                          style={{ color: release.tagColor }}
                        >
                          v{release.version}
                        </span>
                        <span
                          className="inline-block font-mono text-[10px] tracking-widest px-2 py-0.5 border mb-3"
                          style={{
                            color: release.tagColor,
                            borderColor: release.tagColor,
                            backgroundColor: `${release.tagColor}10`,
                          }}
                        >
                          {release.tag}
                        </span>
                        <p className="text-[#6B7280] text-xs font-mono">{release.date}</p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">
                        {release.summary}
                      </p>

                      <div className="flex flex-col gap-6">
                        {groups.map((group) => (
                          <div key={group.platform}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-mono text-[10px] tracking-widest px-1.5 py-0.5 border border-[#2E2E35] text-[#6B7280] bg-[#0A0A0A]">
                                {PLATFORM_CONFIG[group.platform].label}
                              </span>
                              <span className="text-[#6B7280] text-xs font-mono">
                                {group.label}
                              </span>
                              <div className="flex-1 h-px bg-[#1F1F23]" />
                            </div>

                            <ul className="flex flex-col gap-2 ml-1">
                              {group.entries.map((entry, j) => {
                                const cfg = TYPE_CONFIG[entry.type]
                                return (
                                  <li key={j} className="flex items-start gap-2.5">
                                    <span
                                      className="shrink-0 font-mono text-[9px] tracking-wider px-1.5 py-px mt-[3px] font-semibold"
                                      style={{ color: cfg.color }}
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Mobile: card layout with version header + accordion platforms ── */}
                  <div className="md:hidden pb-12">
                    {/* Version card header */}
                    <div
                      className="border-l-2 pl-4 mb-4"
                      style={{ borderColor: release.tagColor }}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className="font-mono text-xl font-bold"
                          style={{ color: release.tagColor }}
                        >
                          v{release.version}
                        </span>
                        <span
                          className="font-mono text-[9px] tracking-widest px-1.5 py-0.5 border"
                          style={{
                            color: release.tagColor,
                            borderColor: release.tagColor,
                            backgroundColor: `${release.tagColor}10`,
                          }}
                        >
                          {release.tag}
                        </span>
                      </div>
                      <p className="text-[#6B7280] text-xs font-mono mb-3">{release.date}</p>
                      <p className="text-[#9CA3AF] text-[13px] leading-relaxed">{release.summary}</p>
                    </div>

                    {/* Platform accordions */}
                    <div className="flex flex-col gap-2">
                      {groups.map((group) => (
                        <MobilePlatformGroup
                          key={group.platform}
                          platform={group.platform}
                          label={group.label}
                          entries={group.entries}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Version separator */}
                  {i < RELEASES.length - 1 && (
                    <div className="h-px bg-gradient-to-r from-[#2E2E35] via-[#2E2E35]/50 to-transparent mb-12 md:mb-16" />
                  )}
                </m.div>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </ErrorBoundary>
  )
}
