import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  Fake data for the mini previews                                    */
/* ------------------------------------------------------------------ */

const STATS = [
  { label: 'WORKSPACES', value: '3', color: '#06B6D4' },
  { label: 'PROJECTS', value: '12', color: '#6366F1' },
  { label: 'TEAM', value: '8', color: '#F59E0B' },
  { label: 'MEETINGS', value: '4', color: '#22C55E' },
]

const ACTIVITY = [
  { time: '2m', initials: 'AK', action: 'PUSHED', target: 'feat/auth-flow', color: '#22C55E' },
  { time: '5m', initials: 'JD', action: 'MERGED', target: 'PR #142 — api cache layer', color: '#8B5CF6' },
  { time: '12m', initials: 'SL', action: 'CLOSED', target: 'TSK-89 token refresh', color: '#EF4444' },
  { time: '18m', initials: 'AK', action: 'CREATED', target: 'TSK-102 rate limiting', color: '#06B6D4' },
  { time: '24m', initials: 'MR', action: 'REVIEWED', target: 'PR #139 — db migrations', color: '#F59E0B' },
  { time: '31m', initials: 'JD', action: 'DEPLOYED', target: 'v2.4.1 → production', color: '#22C55E' },
]

const WORKSPACES = [
  { name: 'LTF1 Core', members: 5, projects: 4 },
  { name: 'Mobile App', members: 3, projects: 2 },
]

const KANBAN_COLUMNS = [
  {
    title: 'TODO',
    color: '#6B7280',
    tasks: [
      { id: 'TSK-104', title: 'Rate limit middleware', priority: 'med', pColor: '#F59E0B' },
      { id: 'TSK-106', title: 'Webhook retry logic', priority: 'low', pColor: '#22C55E' },
    ],
  },
  {
    title: 'IN PROGRESS',
    color: '#6366F1',
    tasks: [
      { id: 'TSK-98', title: 'Auth flow refactor', priority: 'high', pColor: '#EF4444' },
      { id: 'TSK-101', title: 'Cache invalidation', priority: 'med', pColor: '#F59E0B' },
      { id: 'TSK-103', title: 'API response types', priority: 'low', pColor: '#22C55E' },
    ],
  },
  {
    title: 'IN REVIEW',
    color: '#F59E0B',
    tasks: [
      { id: 'TSK-95', title: 'DB migration v3', priority: 'high', pColor: '#EF4444' },
    ],
  },
  {
    title: 'DONE',
    color: '#22C55E',
    tasks: [
      { id: 'TSK-89', title: 'Token refresh', priority: 'med', pColor: '#F59E0B' },
      { id: 'TSK-91', title: 'Error boundaries', priority: 'low', pColor: '#22C55E' },
    ],
  },
]

const SPRINT_TASKS = [
  { status: 'done', count: 8 },
  { status: 'review', count: 2 },
  { status: 'progress', count: 4 },
  { status: 'todo', count: 3 },
]

const BURNDOWN_POINTS = [34, 32, 29, 27, 24, 22, 19, 17, 15, 12, 10, 8]
const IDEAL_POINTS = [34, 31, 28, 25.5, 23, 20, 17, 14, 11, 8.5, 5.5, 0]

/* ------------------------------------------------------------------ */
/*  Tabs                                                                */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'sprint', label: 'Sprint' },
] as const

type TabKey = (typeof TABS)[number]['key']

/* ------------------------------------------------------------------ */
/*  Mini Dashboard Preview                                             */
/* ------------------------------------------------------------------ */

function MiniDashboard() {
  return (
    <div className="p-4 md:p-5 space-y-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#9CA3AF]/60">
            Command Center
          </div>
          <div className="text-xs font-bold text-[#F9FAFB]">Dashboard</div>
        </div>
        <div className="px-2.5 py-1 bg-[#F9FAFB] text-[#050505] text-[7px] font-bold font-mono uppercase">
          Quick Action
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="border border-[#2E2E35] bg-[#0A0A0A] p-2"
          >
            <div className="text-[7px] font-mono uppercase tracking-wider text-[#6B7280] mb-1">
              {s.label}
            </div>
            <div
              className="text-base font-bold font-mono"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid — wider activity, narrower sidebar */}
      <div className="flex gap-2">
        {/* Activity feed — takes remaining space */}
        <div className="flex-[2] min-w-0 border border-[#2E2E35] bg-[#0A0A0A] p-2.5">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#2E2E35]/50">
            <div className="text-[8px] font-bold uppercase tracking-wider text-[#F9FAFB]">
              Activity Log
            </div>
            <div className="flex items-center gap-1 text-[7px] font-mono text-[#6B7280]">
              <span className="w-1.5 h-1.5 bg-[#22C55E] animate-pulse" />
              LIVE
            </div>
          </div>
          <div className="space-y-1">
            {ACTIVITY.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-0.5 px-1 hover:bg-[#111111]"
              >
                <span className="text-[7px] font-mono text-[#6B7280]/50 w-6 shrink-0">
                  {a.time}
                </span>
                <span
                  className="text-[8px] font-bold w-5 shrink-0"
                  style={{ color: a.color }}
                >
                  {a.initials}
                </span>
                <span className="text-[7px] uppercase tracking-wider text-[#6B7280]/60 shrink-0">
                  {a.action}
                </span>
                <span className="text-[8px] font-mono text-[#9CA3AF] truncate">
                  {a.target}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar — fixed width */}
        <div className="w-[180px] shrink-0 hidden md:block">
          <div className="border border-[#2E2E35] bg-[#0A0A0A] p-2.5">
            <div className="text-[8px] font-bold uppercase tracking-wider text-[#F9FAFB] mb-2 pb-1.5 border-b border-[#2E2E35]/50">
              Workspaces
            </div>
            <div className="space-y-1.5">
              {WORKSPACES.map((ws) => (
                <div
                  key={ws.name}
                  className="border border-[#2E2E35] p-2 hover:border-[#6366F1]/40"
                >
                  <div className="text-[8px] font-bold text-[#F9FAFB]">
                    {ws.name}
                  </div>
                  <div className="text-[7px] font-mono text-[#6B7280] mt-0.5">
                    {ws.members} mem &middot; {ws.projects} proj
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Mini Tasks (Kanban) Preview                                        */
/* ------------------------------------------------------------------ */

function MiniTasks() {
  return (
    <div className="p-3 space-y-2 select-none">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-[8px] font-mono font-bold uppercase text-[#6366F1]">
            TASKS
          </div>
          <span className="text-[#2E2E35]">/</span>
          <div className="text-[7px] font-mono uppercase text-[#6B7280]">
            LTF1 Core
          </div>
        </div>
        <div className="flex items-center gap-1">
          {['Board', 'List', 'Cal', 'Table'].map((v, i) => (
            <div
              key={v}
              className={`text-[6px] font-mono uppercase px-1.5 py-0.5 ${
                i === 0
                  ? 'bg-[#F9FAFB] text-[#050505] font-bold'
                  : 'text-[#6B7280] border border-[#2E2E35]'
              }`}
            >
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 border border-[#2E2E35] bg-[#0A0A0A] px-2 py-1 text-[7px] font-mono text-[#6B7280]">
          Search tasks...
        </div>
        <div className="border border-[#2E2E35] px-1.5 py-1 text-[6px] font-mono uppercase text-[#6B7280]">
          Filters
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-4 gap-1.5">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.title} className="space-y-1">
            {/* Column header */}
            <div className="flex items-center gap-1 mb-1">
              <span
                className="w-1.5 h-1.5"
                style={{ backgroundColor: col.color }}
              />
              <span className="text-[6px] font-mono font-bold uppercase tracking-wider text-[#9CA3AF]">
                {col.title}
              </span>
              <span className="text-[6px] font-mono text-[#6B7280]/50 ml-auto">
                {col.tasks.length}
              </span>
            </div>

            {/* Task cards */}
            {col.tasks.map((task) => (
              <div
                key={task.id}
                className="border border-[#2E2E35] bg-[#0A0A0A] p-1.5 hover:border-[#6366F1]/30"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[6px] font-mono text-[#6B7280]">
                    {task.id}
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: task.pColor }}
                  />
                </div>
                <div className="text-[7px] font-bold text-[#F9FAFB] leading-tight">
                  {task.title}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Mini Sprint Preview                                                */
/* ------------------------------------------------------------------ */

function MiniSprint() {
  const maxPt = 34
  return (
    <div className="p-3 space-y-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-[8px] font-mono font-bold uppercase text-[#F9FAFB]">
            SPRINTS
          </div>
          <span className="text-[#2E2E35]">/</span>
          <div className="text-[7px] font-mono uppercase text-[#6B7280]">
            Sprint 14
          </div>
        </div>
        <div className="px-1.5 py-0.5 bg-[#22C55E]/10 text-[#22C55E] text-[6px] font-mono uppercase tracking-wider border border-[#22C55E]/30">
          ACTIVE
        </div>
      </div>

      {/* Sprint info card */}
      <div className="border border-[#2E2E35] bg-[#0A0A0A] p-2 grid grid-cols-4 gap-2">
        <div>
          <div className="text-[6px] font-mono text-[#6B7280] uppercase mb-0.5">
            Days Left
          </div>
          <div className="text-sm font-bold font-mono text-[#06B6D4]">6</div>
        </div>
        <div>
          <div className="text-[6px] font-mono text-[#6B7280] uppercase mb-0.5">
            Progress
          </div>
          <div className="text-sm font-bold font-mono text-[#22C55E]">76%</div>
        </div>
        <div>
          <div className="text-[6px] font-mono text-[#6B7280] uppercase mb-0.5">
            Points
          </div>
          <div className="text-sm font-bold font-mono text-[#8B5CF6]">
            26/34
          </div>
        </div>
        <div>
          <div className="text-[6px] font-mono text-[#6B7280] uppercase mb-0.5">
            Velocity
          </div>
          <div className="text-sm font-bold font-mono text-[#F59E0B]">
            +12%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 h-2.5 overflow-hidden border border-[#2E2E35]">
          {SPRINT_TASKS.map((s) => {
            const colors: Record<string, string> = {
              done: '#22C55E',
              review: '#F59E0B',
              progress: '#6366F1',
              todo: '#2E2E35',
            }
            return (
              <div
                key={s.status}
                className="h-full"
                style={{
                  backgroundColor: colors[s.status],
                  width: `${(s.count / 17) * 100}%`,
                }}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-[6px] font-mono text-[#6B7280]">
          <span>8 done</span>
          <span>2 review</span>
          <span>4 progress</span>
          <span>3 todo</span>
        </div>
      </div>

      {/* Burndown + AI Insights */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Burndown chart (SVG) */}
        <div className="border border-[#2E2E35] bg-[#0A0A0A] p-2">
          <div className="text-[7px] font-bold uppercase tracking-wider text-[#F9FAFB] mb-1.5">
            Burndown
          </div>
          <svg
            viewBox="0 0 120 50"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {[0, 12.5, 25, 37.5, 50].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="120"
                y2={y}
                stroke="#2E2E35"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}

            {/* Ideal line */}
            <polyline
              fill="none"
              stroke="#6B7280"
              strokeWidth="0.8"
              strokeDasharray="3,2"
              points={IDEAL_POINTS.map(
                (p, i) =>
                  `${(i / (IDEAL_POINTS.length - 1)) * 120},${50 - (p / maxPt) * 50}`
              ).join(' ')}
            />

            {/* Actual line */}
            <polyline
              fill="none"
              stroke="#6366F1"
              strokeWidth="1.2"
              points={BURNDOWN_POINTS.map(
                (p, i) =>
                  `${(i / (BURNDOWN_POINTS.length - 1)) * 120},${50 - (p / maxPt) * 50}`
              ).join(' ')}
            />

            {/* Glow on actual line */}
            <polyline
              fill="none"
              stroke="#6366F1"
              strokeWidth="3"
              opacity="0.15"
              points={BURNDOWN_POINTS.map(
                (p, i) =>
                  `${(i / (BURNDOWN_POINTS.length - 1)) * 120},${50 - (p / maxPt) * 50}`
              ).join(' ')}
            />

            {/* Current dot */}
            <circle
              cx={(11 / 11) * 120}
              cy={50 - (8 / maxPt) * 50}
              r="2"
              fill="#6366F1"
            />
            <circle
              cx={(11 / 11) * 120}
              cy={50 - (8 / maxPt) * 50}
              r="4"
              fill="#6366F1"
              opacity="0.2"
            />
          </svg>
          <div className="flex justify-between text-[5px] font-mono text-[#6B7280] mt-1">
            <span>Day 1</span>
            <span>Day 6</span>
            <span>Day 12</span>
          </div>
        </div>

        {/* AI Insights */}
        <div className="border border-[#2E2E35] bg-[#0A0A0A] p-2">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[7px] font-bold uppercase tracking-wider text-[#F9FAFB]">
              AI Insights
            </span>
            <span className="w-1 h-1 bg-[#F59E0B] animate-pulse" />
          </div>
          <div className="space-y-1">
            {[
              { icon: '>', text: 'On track to complete 2 days early', c: '#22C55E' },
              { icon: '!', text: 'TSK-98 blocked — suggest reassign', c: '#EF4444' },
              { icon: '~', text: 'Velocity trending 12% above avg', c: '#8B5CF6' },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-1">
                <span
                  className="text-[7px] font-mono font-bold shrink-0 mt-px"
                  style={{ color: insight.c }}
                >
                  {insight.icon}
                </span>
                <span className="text-[6px] text-[#9CA3AF] leading-tight">
                  {insight.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Browser Chrome Frame                                                */
/* ------------------------------------------------------------------ */

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-[#2E2E35] bg-[#111111] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0A0A0A] border-b border-[#2E2E35]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#EF4444]/80" />
          <span className="w-2.5 h-2.5 bg-[#F59E0B]/80" />
          <span className="w-2.5 h-2.5 bg-[#22C55E]/80" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-[#111111] border border-[#2E2E35] px-3 py-0.5 text-[9px] font-mono text-[#6B7280] max-w-xs mx-auto text-center">
            app.ltf1.dev
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative bg-[#050505]">
        {children}
        {/* Bottom fade — inside the frame so it always covers content */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.8) 40%, transparent 100%)',
          }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Section                                                        */
/* ------------------------------------------------------------------ */

export default function AppShowcaseSection() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  const previews: Record<TabKey, React.ReactNode> = {
    dashboard: <MiniDashboard />,
    tasks: <MiniTasks />,
    sprint: <MiniSprint />,
  }

  return (
    <section className="py-24 md:py-32 bg-[#050505] overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="text-[#9CA3AF] text-xs font-mono font-semibold uppercase tracking-wider inline-block mb-4">
            See It In Action
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F9FAFB] mb-4">
            Your entire workflow,
            <br />
            <span className="text-[#6366F1]">one command center</span>
          </h2>
          <p className="text-sm md:text-base text-[#6B7280] max-w-lg mx-auto leading-relaxed">
            Tasks, sprints, velocity, and AI insights — all updated automatically
            from your git activity. No tab switching. No manual updates.
          </p>
        </m.div>

        {/* Tabs */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-center gap-1 mb-8"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'bg-[#F9FAFB] text-[#050505] border-[#F9FAFB]'
                  : 'bg-transparent text-[#6B7280] border-[#2E2E35] hover:text-[#F9FAFB] hover:border-[#6B7280]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </m.div>

        {/* Preview window with glow */}
        <m.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Glow layers */}
          <div
            className="absolute -inset-px z-0 opacity-60 blur-[80px] pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.35), transparent 70%)',
            }}
          />
          <div
            className="absolute -inset-px z-0 opacity-40 blur-[120px] pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% 60%, rgba(139,92,246,0.25), transparent 70%)',
            }}
          />

          {/* Perspective wrapper */}
          <m.div
            className="relative z-10"
            style={{ perspective: '1200px' }}
          >
            <m.div
              animate={{
                rotateX: 2,
                rotateY: activeTab === 'dashboard' ? 0 : activeTab === 'tasks' ? -1 : 1,
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Gradient border effect */}
              <div className="p-[1px] bg-gradient-to-b from-[#6366F1]/30 via-[#2E2E35]/50 to-[#2E2E35]/20">
                <BrowserFrame>
                  <div className="h-[360px] md:h-[420px] overflow-hidden">
                    <AnimatePresence mode="wait">
                      <m.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        {previews[activeTab]}
                      </m.div>
                    </AnimatePresence>
                  </div>
                </BrowserFrame>
              </div>
            </m.div>
          </m.div>

        </m.div>

        {/* Bottom feature pills */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-10"
        >
          {[
            { label: 'Real-time sync', color: '#22C55E' },
            { label: 'Git-powered', color: '#6366F1' },
            { label: 'AI estimates', color: '#F59E0B' },
            { label: 'Zero config', color: '#8B5CF6' },
          ].map((pill) => (
            <div
              key={pill.label}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#2E2E35] bg-[#0A0A0A]"
            >
              <span
                className="w-1.5 h-1.5"
                style={{ backgroundColor: pill.color }}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF]">
                {pill.label}
              </span>
            </div>
          ))}
        </m.div>
      </div>
    </section>
  )
}
