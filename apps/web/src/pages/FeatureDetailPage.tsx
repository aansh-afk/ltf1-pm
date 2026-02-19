import { useParams, Link, Navigate } from 'react-router-dom'
import { m, type Variants } from 'framer-motion'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import ColoredPre from '../components/landing/ascii/ColoredPre'

/* ─── Types ─────────────────────────────────────────────────── */

interface FeatureSection {
  headline: string
  description: string
  ascii: string
  align?: 'left' | 'right'
}

interface FeaturePageData {
  slug: string
  category: string
  categoryColor: string
  heroTitle: string
  heroSubtitle: string
  heroAscii: string
  sections: FeatureSection[]
  ctaTitle: string
  ctaDescription: string
}

/* ─── Feature Data ──────────────────────────────────────────── */

const features: FeaturePageData[] = [
  {
    slug: 'pr-driven-updates',
    category: 'Git Integration',
    categoryColor: '#22C55E',
    heroTitle: 'Ship code.\nTasks update themselves.',
    heroSubtitle: 'Connect your repos and let pull requests drive your project management. When you push, review, or merge — tasks move automatically.',
    heroAscii: [
      '  {g:$ git push origin feat/auth-flow}',
      '  ',
      '  +-- {w:PR #142} opened -------------------------+',
      '  |                                            |',
      '  |  {c:3 tasks linked}        {p:<- auto}            |',
      '  |  {c:status: IN REVIEW}     {p:<- auto}            |',
      '  |  {g:2 approvals, checks passing}               |',
      '  |  {g:merged -> main}                            |',
      '  |  {g:3 tasks moved to DONE} {p:<- auto}            |',
      '  +--------------------------------------------+',
    ].join('\n'),
    sections: [
      {
        headline: 'Automatic task linking',
        description: 'Reference task IDs in your branch names, commit messages, or PR descriptions. LTF1 detects them instantly and creates bidirectional links between code and tasks.',
        ascii: [
          '  {g:branch:} {w:feat/TSK-38-auth-flow}',
          '  ',
          '  {g:commit:} {w:"implement OAuth2 flow (TSK-38)"}',
          '  |',
          '  +-> {w:TSK-38} {c:linked automatically}',
          '  +-> status: {y:IN PROGRESS} -> {g:IN REVIEW}',
          '  +-> {c:assignee notified}',
        ].join('\n'),
      },
      {
        headline: 'Status transitions on merge',
        description: 'When a PR merges, linked tasks move to done. When a PR is opened, tasks move to in review. No manual updates. No stale boards.',
        ascii: [
          '  {w:PR opened}    -> task: {c:IN REVIEW}',
          '  {w:PR approved}  -> task: {y:APPROVED}',
          '  {w:PR merged}    -> task: {g:DONE}',
          '  {w:PR closed}    -> task: {p:reverted to previous}',
          '  ',
          '  {c:all transitions logged in activity feed}',
        ].join('\n'),
        align: 'right',
      },
      {
        headline: 'Multi-repo support',
        description: 'Connect GitHub, GitLab, and Bitbucket repositories to the same project. Track PRs across your entire stack from one board.',
        ascii: [
          '  {w:repos connected:}',
          '  +-- {c:github.com/acme/frontend}   [{g:synced}]',
          '  +-- {c:github.com/acme/api}        [{g:synced}]',
          '  +-- {c:gitlab.com/acme/infra}      [{g:synced}]',
          '  ',
          '  total PRs tracked: {p:47}',
          '  auto-linked tasks: {p:142}',
        ].join('\n'),
      },
    ],
    ctaTitle: 'Stop updating tickets manually',
    ctaDescription: 'Connect your first repo in under a minute.',
  },
  {
    slug: 'git-based-velocity',
    category: 'Analytics',
    categoryColor: '#8B5CF6',
    heroTitle: 'Measure what\nyou actually ship.',
    heroSubtitle: 'Velocity calculated from commits, PRs, and deploys — not story point guesses. See exactly how fast your team ships.',
    heroAscii: [
      '  {w:velocity} ------------------- {c:last 14 days} -------------------',
      '  |',
      '  |  commits    [{g:====================}..........] {p:82}  {g:+ 12%}',
      '  |  merged     [{g:================}..............] {p:47}  {g:+ 23%}',
      '  |  deployed   [{g:==============}................] {p:31}  {g:+  8%}',
      '  |  reverted   [{r:=}.............................] {p:2}   {r:- 50%}',
      '  |',
      '  |  {w:cycle time} -------------------------------------------',
      '  |  |  PR open -> merge    avg {p:4.2h}   [{g:==}....] {g: good}',
      '  |  |  merge -> deploy     avg {p:1.1h}   [{g:=}.....]  {g:great}',
      '  |  |  deploy -> rollback  avg {p:0.3%}   [......] {g: excellent}',
      '  |',
      '  |  {w:trend: shipping 23% faster than last sprint}',
      '  +--------------------------------------------------------',
    ].join('\n'),
    sections: [
      {
        headline: 'Cycle time breakdown',
        description: 'Track every stage from first commit to production deploy. Identify exactly where your pipeline slows down and fix it with data.',
        ascii: [
          '  {w:first commit -> PR open}     avg {p:2.1 days}',
          '  {w:PR open -> first review}     avg {p:4.2 hours}',
          '  {w:first review -> approval}    avg {p:1.3 hours}',
          '  {w:approval -> merge}           avg {p:0.4 hours}',
          '  {w:merge -> deploy}             avg {p:1.1 hours}',
          '  ',
          '  {r:bottleneck: first commit -> PR open}',
          '  {y:suggestion: smaller PRs, more frequent pushes}',
        ].join('\n'),
      },
      {
        headline: 'Sprint-over-sprint trends',
        description: 'Compare velocity across sprints to see if your team is accelerating, plateauing, or burning out. Backed by real shipping data.',
        ascii: [
          '  {w:sprint 11}  [{g:==========}..........] {p:48 pts} shipped',
          '  {w:sprint 12}  [{g:============}........] {p:57 pts} shipped',
          '  {w:sprint 13}  [{g:==============}......] {p:64 pts} shipped',
          '  {w:sprint 14}  [{g:===============}.....] {p:71 pts} shipped',
          '  ',
          '  {g:trend: +47% over 4 sprints}',
          '  {c:consistency: 92% (low variance)}',
        ].join('\n'),
        align: 'right',
      },
      {
        headline: 'Individual contributor insights',
        description: 'See per-developer metrics without micromanaging. Spot blockers, celebrate output, and balance workload across the team.',
        ascii: [
          '  {c:@ada}   commits: {p:34}  PRs: {p:12}  cycle: {p:3.2h}  [{g:======}]',
          '  {c:@bob}   commits: {p:28}  PRs: {p: 9}  cycle: {p:5.1h}  [{g:====}..]',
          '  {c:@eve}   commits: {p:19}  PRs: {p: 6}  cycle: {p:8.4h}  [{y:===}...]',
          '  {c:@max}   commits: {p:41}  PRs: {p:15}  cycle: {p:2.8h}  [{g:======}]',
          '  ',
          '  {r:note: @eve blocked on PR reviews (avg wait: 6h)}',
        ].join('\n'),
      },
    ],
    ctaTitle: 'Stop guessing your velocity',
    ctaDescription: 'See what your team actually ships.',
  },
  {
    slug: 'code-complexity-estimates',
    category: 'Intelligence',
    categoryColor: '#F59E0B',
    heroTitle: 'Estimates from code,\nnot gut feelings.',
    heroSubtitle: 'AI analyzes your diffs to estimate story points from actual code complexity. No more planning poker debates.',
    heroAscii: [
      '  {w:diff --stat} --------------------------------',
      '  |',
      '  |  {w:auth.ts}       {g:+142}  {r:-38}   complexity: {r:high}',
      '  |  {w:db.ts}          {g:+67}  {r:-12}   complexity: {y:med}',
      '  |  {w:routes.ts}      {g:+23}   {r:-8}   complexity: {g:low}',
      '  |  {w:tests.ts}       {g:+89}   {r:-4}   complexity: {g:low}',
      '  |',
      '  |  total:  {g:+321} {r:-62}  across {p:4} files',
      '  |  estimated effort: {w:5 pts} [{y:medium}]',
      '  |  confidence: {g:94%}',
      '  +--------------------------------------------',
    ].join('\n'),
    sections: [
      {
        headline: 'Complexity scoring',
        description: 'Each file change is scored for cyclomatic complexity, nesting depth, and dependency impact. The AI weighs all factors into a single point estimate.',
        ascii: [
          '  {w:auth.ts analysis:}',
          '  |  cyclomatic complexity:  {r:+12}  ({r:high})',
          '  |  nesting depth:         {y:+3}   ({y:moderate})',
          '  |  dependency impact:     {r:+8}   ({r:high})',
          '  |  test coverage delta:   {r:-15%} ({r:risk})',
          '  |',
          '  |  file score: {p:7/10} complexity',
          '  |  weight in estimate: {p:45%}',
        ].join('\n'),
      },
      {
        headline: 'Historical calibration',
        description: 'The model learns from your team\'s actual delivery history. Over time, estimates calibrate to match how your team works — not generic benchmarks.',
        ascii: [
          '  {w:calibration (last 30 tasks):}',
          '  |  predicted vs actual:',
          '  |  {p:1 pt}:  predicted {p:1.1}  ({g:accurate})',
          '  |  {p:3 pts}: predicted {p:2.8}  ({g:accurate})',
          '  |  {p:5 pts}: predicted {p:5.2}  ({g:accurate})',
          '  |  {p:8 pts}: predicted {p:6.9}  ({y:under by 14%})',
          '  |',
          '  |  overall accuracy: {g:91%}',
        ].join('\n'),
        align: 'right',
      },
    ],
    ctaTitle: 'End estimation theater',
    ctaDescription: 'Let code complexity speak for itself.',
  },
  {
    slug: 'tech-debt-surfacing',
    category: 'Quality',
    categoryColor: '#EF4444',
    heroTitle: 'See debt before\nit compounds.',
    heroSubtitle: 'Automatically flags growing complexity, missing tests, and architectural drift before they become crises.',
    heroAscii: [
      '  {r:!} {w:debt report} ---- {c:sprint 14} ---- generated 2h ago ----',
      '  |',
      '  |  complexity  [{y:====}..] {p:67%}   {r:+ 5%} vs last sprint',
      '  |  coverage    [{r:==}....] {p:34%}   {r:- 3%} vs last sprint',
      '  |  drift       [{g:=}.....] {p:12%}   {y:+ 2%} vs last sprint',
      '  |  duplication [{y:==}....] {p:28%}   {y:+ 1%} vs last sprint',
      '  |',
      '  |  {r:critical: 3 items need attention}',
      '  |  > {w:auth.ts}    {r:complexity score exceeds threshold}',
      '  |  > {w:db.ts}      {r:test coverage below 20%}',
      '  |  > {w:utils.ts}   {y:4 duplicate patterns detected}',
      '  +------------------------------------------------------',
    ].join('\n'),
    sections: [
      {
        headline: 'Automated detection',
        description: 'Every PR is scanned for complexity growth, coverage drops, and pattern duplication. Debt surfaces in your dashboard before it hits production.',
        ascii: [
          '  {w:PR #203 scan results:}',
          '  |  {r:+} new complexity in {w:auth.ts}',
          '  |  {r:+} coverage dropped {r:3%} in {w:api/}',
          '  |  {y:+} duplicate pattern in {w:utils.ts}',
          '  |',
          '  |  auto-created: {c:DEBT-12} ({r:auth complexity})',
          '  |  auto-created: {c:DEBT-13} ({r:coverage gap})',
        ].join('\n'),
      },
      {
        headline: 'Trend tracking',
        description: 'Track debt metrics sprint-over-sprint. See if your codebase is improving or deteriorating with hard numbers, not vibes.',
        ascii: [
          '  {w:debt trend (last 6 sprints):}',
          '  |  s9  [{y:====}..] {p:62%}  baseline',
          '  |  s10 [{y:====}..] {p:64%}  {y:+ 2%}',
          '  |  s11 [{r:=====}.] {p:68%}  {r:+ 4%}  {r:! warning}',
          '  |  s12 [{g:====}..] {p:63%}  {g:- 5%}  {g:cleanup sprint}',
          '  |  s13 [{y:====}..] {p:65%}  {y:+ 2%}',
          '  |  s14 [{y:====}..] {p:67%}  {y:+ 2%}',
        ].join('\n'),
        align: 'right',
      },
    ],
    ctaTitle: 'Stay ahead of tech debt',
    ctaDescription: 'Catch it early, fix it fast.',
  },
  {
    slug: 'sprint-planning',
    category: 'Planning',
    categoryColor: '#06B6D4',
    heroTitle: 'Plan sprints\nwith confidence.',
    heroSubtitle: 'AI-assisted sprint creation from your backlog. Auto-fill capacity, suggest scope, and ship on time.',
    heroAscii: [
      '  +-- {w:sprint 14 planning} ----------------------------------+',
      '  |                                                         |',
      '  |  team capacity:   {p:8 devs} x {p:5 days} = {w:40 pts} available   |',
      '  |  planned work:    {w:34 pts} across {p:12} tasks                |',
      '  |  load factor:     [{g:================}.....] {p:85%}           |',
      '  |                                                         |',
      '  |  risk assessment: {g:LOW}                                   |',
      '  |  confidence:      {g:91%}                                   |',
      '  |  suggested:       {y:remove 2 low-priority tasks (-6 pts)}  |',
      '  +---------------------------------------------------------+',
    ].join('\n'),
    sections: [
      {
        headline: 'AI-powered scope suggestions',
        description: 'Based on team velocity, complexity estimates, and PTO, LTF1 suggests which tasks to include, exclude, or defer to keep sprints realistic.',
        ascii: [
          '  {w:suggested sprint scope:}',
          '  |  {g:include:}',
          '  |    {w:TSK-82}  auth refactor     {p:5 pts}  [{g:high priority}]',
          '  |    {w:TSK-85}  api caching       {p:3 pts}  [{g:high priority}]',
          '  |    {w:TSK-91}  fix login bug     {p:1 pt}   [{r:critical}]',
          '  |  {y:defer:}',
          '  |    {w:TSK-88}  redesign nav      {p:8 pts}  [{y:over capacity}]',
          '  |    {w:TSK-93}  docs update       {p:2 pts}  [{y:low priority}]',
        ].join('\n'),
      },
      {
        headline: 'Capacity planning',
        description: 'Factor in PTO, meeting load, and historical delivery rates. LTF1 calculates realistic capacity — not theoretical maximums.',
        ascii: [
          '  {w:capacity breakdown:}',
          '  |  {c:@ada}   {p:5} days  - {y:0.5d} meetings = {w:4.5d}  [{p:9 pts}]',
          '  |  {c:@bob}   {p:5} days  - {y:1.0d} PTO      = {w:4.0d}  [{p:8 pts}]',
          '  |  {c:@eve}   {p:5} days  - {y:0.5d} meetings = {w:4.5d}  [{p:9 pts}]',
          '  |  {c:@max}   {p:3} days  - {g:0.0d}           = {w:3.0d}  [{p:6 pts}]',
          '  |',
          '  |  total realistic capacity: {w:32 pts}',
        ].join('\n'),
        align: 'right',
      },
    ],
    ctaTitle: 'Plan sprints that actually work',
    ctaDescription: 'No more overcommitting.',
  },
  {
    slug: 'team-management',
    category: 'Collaboration',
    categoryColor: '#EC4899',
    heroTitle: 'See your team.\nNot just their tickets.',
    heroSubtitle: 'Workload visibility and capacity planning across your entire team. See who ships, who is blocked, and where help is needed.',
    heroAscii: [
      '  +-- {w:team overview} ---- {c:sprint 14} ----+',
      '  |                                     |',
      '  |  {c:@ada}  [{g:========}..] {p:4/5 pts}  {g:active} |',
      '  |  {c:@bob}  [{y:======}....] {p:3/5 pts}  {r:BLOCKED}|',
      '  |  {c:@eve}  [{g:==}........] {p:1/5 pts}  {g:avail}  |',
      '  |  {c:@max}  [{g:====}......] {p:2/5 pts}  {g:active} |',
      '  |                                     |',
      '  |  total: {p:10/20 pts} in progress       |',
      '  |  {r:blocked}: {p:1} member (PR review)      |',
      '  |  {g:available}: {p:1} member (9 pts free)   |',
      '  +-------------------------------------+',
    ].join('\n'),
    sections: [
      {
        headline: 'Workload distribution',
        description: 'See at a glance who is overloaded and who has capacity. Rebalance work before burnout happens, not after.',
        ascii: [
          '  {w:workload this sprint:}',
          '  |  {c:@ada}  [{r:==========}]  {p:10/10}  {r:overloaded !}',
          '  |  {c:@bob}  [{g:========}..]   {p:8/10}  {g:healthy}',
          '  |  {c:@eve}  [{g:===}.......]   {p:3/10}  {g:available}',
          '  |  {c:@max}  [{g:=======}...]   {p:7/10}  {g:healthy}',
          '  |',
          '  |  {y:suggestion: move TSK-94 from @ada to @eve}',
        ].join('\n'),
      },
      {
        headline: 'Blocker detection',
        description: 'LTF1 flags when team members are blocked — waiting on reviews, missing specs, or dependency issues. Unblock fast.',
        ascii: [
          '  {r:blockers detected:}',
          '  |  {c:@bob}  {r:blocked} {p:4.2h} on {w:PR #198}',
          '  |    -> waiting for review from {c:@ada}',
          '  |    -> {g:auto-notified @ada via Slack & Discord}',
          '  |',
          '  |  {c:@max}  {r:blocked} {p:1.1h} on {w:TSK-95}',
          '  |    -> missing API spec from {c:@eve}',
          '  |    -> {y:flagged in standup summary}',
        ].join('\n'),
        align: 'right',
      },
    ],
    ctaTitle: 'Manage people, not just projects',
    ctaDescription: 'See the humans behind the tickets.',
  },
  {
    slug: 'terminal-first',
    category: 'Developer Experience',
    categoryColor: '#10B981',
    heroTitle: 'Never leave\nyour terminal.',
    heroSubtitle: 'Full TUI and CLI for managing projects without context switching. Because leaving your editor kills flow.',
    heroAscii: [
      '  {g:$ ltf1 tasks --mine --sprint current}',
      '  +----------------------------------------+',
      '  |  {w:#38}  auth flow      [{g:*}] {g:in progress}   |',
      '  |  {w:#41}  api cache      [o] todo           |',
      '  |  {w:#55}  token refresh  [{g:v}] {g:done}           |',
      '  |  {w:#62}  rate limiting  [o] todo           |',
      '  |                                         |',
      '  |  {p:3} remaining, {g:1} done                    |',
      '  |  sprint velocity: {g:+ 23%} vs average      |',
      '  +----------------------------------------+',
    ].join('\n'),
    sections: [
      {
        headline: 'Full CLI toolkit',
        description: 'Create tasks, update status, manage sprints, and view dashboards — all from the command line. Scriptable, pipeable, fast.',
        ascii: [
          '  {g:$ ltf1 task create "fix auth bug" --priority high}',
          '  {c:created TSK-98 (assigned to you)}',
          '  ',
          '  {g:$ ltf1 task move TSK-98 --status "in progress"}',
          '  {w:TSK-98} moved to {g:IN PROGRESS}',
          '  ',
          '  {g:$ ltf1 sprint status}',
          '  sprint 14: {p:10/34 pts} complete ({p:29%})',
          '  {y:3 days remaining}',
        ].join('\n'),
      },
      {
        headline: 'Interactive TUI',
        description: 'Full-screen terminal interface with keyboard navigation. Browse boards, view tasks, and manage sprints without touching a mouse.',
        ascii: [
          '  +-- {w:ltf1 board} ------ {c:sprint 14} ------+',
          '  | {w:TODO}      | {w:PROGRESS}  | {w:DONE}        |',
          '  |-----------|-----------|-------------|',
          '  | {c:TSK-41}    | {y:TSK-38}    | {g:TSK-55}      |',
          '  | {c:TSK-62}    | {y:TSK-44}    | {g:TSK-49}      |',
          '  |           |           | {g:TSK-51}      |',
          '  +-----------+-----------+-------------+',
          '  {p:[j/k] navigate  [enter] open  [q] quit}',
        ].join('\n'),
        align: 'right',
      },
    ],
    ctaTitle: 'Stay in your flow',
    ctaDescription: 'Manage projects without leaving the terminal.',
  },
  {
    slug: 'open-source',
    category: 'Open Source',
    categoryColor: '#F9FAFB',
    heroTitle: 'Your data.\nYour infrastructure.',
    heroSubtitle: 'Fully open source under AGPL. Self-host it, audit it, fork it. No vendor lock-in, no data hostage.',
    heroAscii: [
      '  license: {w:AGPL-3.0-or-later}',
      '  +----------------------------------------------+',
      '  |  source code    {g:+} {w:fully available on GitHub}   |',
      '  |  modify         {g:+} {w:permitted under AGPL}        |',
      '  |  self-host      {g:+} {w:Docker, k8s, bare metal}     |',
      '  |  audit          {g:+} {w:full source access}           |',
      '  |  vendor lock-in {g:+} {w:none}                        |',
      '  |  data export    {g:+} {w:full, anytime}               |',
      '  |                                               |',
      '  |  {g:your data never leaves your infrastructure}   |',
      '  +----------------------------------------------+',
    ].join('\n'),
    sections: [
      {
        headline: 'Self-host anywhere',
        description: 'Deploy with Docker, Kubernetes, or bare metal. Your data stays on your servers, in your cloud, under your control.',
        ascii: [
          '  {g:$ docker compose up -d}',
          '  ',
          '  {w:[+] Running 4/4}',
          '  {g:+} {c:ltf1-web}     {g:running}  (port {p:3000})',
          '  {g:+} {c:ltf1-api}     {g:running}  (port {p:8080})',
          '  {g:+} {c:ltf1-db}      {g:running}  (port {p:5432})',
          '  {g:+} {c:ltf1-worker}  {g:running}',
          '  ',
          '  {w:ready at} {c:http://localhost:3000}',
        ].join('\n'),
      },
      {
        headline: 'Contribute and extend',
        description: 'Built by developers, for developers. Contribute features, fix bugs, or build custom integrations. The community drives the roadmap.',
        ascii: [
          '  {c:github.com/ltf1/ltf1}',
          '  |  stars:        {p:2,400+}',
          '  |  contributors: {p:45+}',
          '  |  releases:     {w:v0.9.2} ({g:latest})',
          '  |  issues:       {p:12} open, {p:340} closed',
          '  |',
          '  |  good first issues: {g:8 available}',
          '  |  roadmap: {g:public}',
        ].join('\n'),
        align: 'right',
      },
    ],
    ctaTitle: 'Take ownership of your tools',
    ctaDescription: 'Fork it, host it, own it.',
  },
]

/* ─── Animations ────────────────────────────────────────────── */

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

/* ─── Component ─────────────────────────────────────────────── */

export default function FeatureDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const feature = features.find((f) => f.slug === slug)

  if (!feature) {
    return <Navigate to="/coming-soon" replace />
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-5xl mx-auto px-4">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Category label */}
            <div className="flex items-center gap-2 mb-6">
              <span
                className="w-2 h-2"
                style={{ backgroundColor: feature.categoryColor }}
              />
              <span className="text-xs font-mono text-[#6B7280] uppercase tracking-wider">
                {feature.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#F9FAFB] mb-3 whitespace-pre-line">
              {feature.heroTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-[#6B7280] max-w-2xl mb-6">
              {feature.heroSubtitle}
            </p>
          </m.div>

          {/* Hero ASCII */}
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-[#0A0A0A] border-2 border-[#2E2E35] p-4 md:p-6 overflow-x-auto"
          >
            <ColoredPre
              text={feature.heroAscii}
              className="font-mono text-[11px] md:text-xs text-[#6B7280] leading-relaxed whitespace-pre select-none"
            />
          </m.div>
        </div>
      </section>

      {/* Feature Sections */}
      {feature.sections.map((section, i) => (
        <section key={section.headline} className="py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-4">
            <m.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center ${
                section.align === 'right' ? 'md:[direction:rtl]' : ''
              }`}
            >
              {/* Text */}
              <div className={section.align === 'right' ? 'md:[direction:ltr]' : ''}>
                <span className="text-xs font-mono text-[#6B7280] uppercase tracking-wider">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-[#F9FAFB] mt-2 mb-4">
                  {section.headline}
                </h2>
                <p className="text-base text-[#6B7280] leading-relaxed">
                  {section.description}
                </p>
              </div>

              {/* ASCII block */}
              <div className={`bg-[#0A0A0A] border border-[#2E2E35] p-4 overflow-x-auto ${
                section.align === 'right' ? 'md:[direction:ltr]' : ''
              }`}>
                <ColoredPre
                  text={section.ascii}
                  className="font-mono text-[11px] md:text-xs text-[#6B7280] leading-relaxed whitespace-pre select-none"
                />
              </div>
            </m.div>
          </div>
        </section>
      ))}

      {/* Bottom CTA */}
      <section className="py-12 md:py-16 border-t border-[#2E2E35]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F9FAFB] mb-4">
              {feature.ctaTitle}
            </h2>
            <p className="text-base text-[#6B7280] mb-4">
              {feature.ctaDescription}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/sign-up"
                className="bg-[#F9FAFB] text-[#050505] font-bold text-sm px-6 py-3"
              >
                Get Started
              </Link>
              <Link
                to="/features"
                className="text-[#9CA3AF] font-bold text-sm px-6 py-3 border border-[#2E2E35]"
              >
                View all features
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
