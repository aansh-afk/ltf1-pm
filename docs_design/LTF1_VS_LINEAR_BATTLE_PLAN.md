# LTF1 vs Linear: The Battle Plan

> **Mission**: Give Linear a run for their money. Make them scared.
>
> **Date**: April 10, 2026
>
> **Status**: Active competitive analysis and execution roadmap

---

## Table of Contents

1. [The Luxury Car Problem](#the-luxury-car-problem)
2. [What We Already Win](#what-we-already-win)
3. [The Critical Gaps](#the-critical-gaps)
4. [Priority Execution Order](#priority-execution-order)
5. [Linear's Announced Roadmap (What's Coming)](#linears-announced-roadmap)
6. [Our Unfair Advantages](#our-unfair-advantages)

---

## The Luxury Car Problem

### Linear Feels Like Driving a Porsche

This is the single most important section in this document. Read it twice.

Linear is not winning because of features. They're winning because of **feel**. Using Linear feels like driving a luxury car — every interaction is smooth, every transition is buttery, every pixel is intentional. There's no jank. No stutter. No "wait, where did that go?" moment. The door closes with a satisfying thunk. The engine purrs. You never think about the car — you just drive.

That's what Linear did to project management. They made it disappear. You don't "use" Linear — you just *work*.

### What Makes the Luxury Car Feel Luxurious

**1. Speed as Identity**

Linear's entire brand is built on speed. Sub-50ms interactions. 60fps animations at all times. Instant page transitions. Optimistic updates so aggressive that the UI changes before the server even knows about it. They famously rebuilt their sync engine multiple times just to shave milliseconds.

This isn't a feature. It's their religion.

For LTF1, this means: **every single interaction must feel instant**. Not "fast." Not "good enough." *Instant*. If you click a status dropdown and there's a 200ms delay before it opens, you've already lost. Linear users will feel that delay like a pothole on a highway.

**2. Keyboard-First, Mouse-Optional**

Linear power users never touch their mouse. Every action has a shortcut:
- `1-6` to change status
- `Alt+1-4` to change priority
- `A` to assign
- `L` to label
- `J/K` to navigate between issues
- `Cmd+K` for command palette
- `Shift+click` for bulk selection
- `X` to select, then bulk actions

The keyboard isn't an afterthought — it's the primary input method. The mouse is the fallback. This is backwards from how most apps think, and it's why developers love Linear.

For LTF1: We have a command palette. That's table stakes. We need a **comprehensive, discoverable, consistent shortcut system** that covers every mutation in the app. Every. Single. One.

**3. Pixel-Perfect Polish**

Linear's animations aren't decorative. They're informational. When you drag a task to a new status column, the animation tells you "this moved." When a sidebar collapses, the easing curve communicates "this is hiding but still there." When a notification appears, the entrance animation says "this is new and worth seeing."

Every shadow, border radius, spacing value, and color choice in Linear was debated. Nothing is default. Nothing is "good enough for now."

For LTF1: Our brutalist design system is actually a strong differentiator — it's opinionated and memorable. But brutalist doesn't mean unpolished. Hard edges can still be pixel-perfect. 2px borders can still align perfectly. IBM Plex Mono can still be kerned beautifully. **Polish the brutalism. Don't abandon it.**

**4. Information Density Without Clutter**

Linear shows you a lot of data without feeling overwhelming. Their list view has status, priority, assignee, labels, project, cycle — all visible — but the hierarchy is so clear that your eye naturally finds what matters. They achieve this through:
- Consistent iconography (tiny, monochrome, meaningful)
- Typography hierarchy (weight and size, not color)
- Whitespace as structure (not decoration)
- Progressive disclosure (hover to reveal secondary actions)

For LTF1: Audit every view. Can a user scan 50 tasks and immediately find what they need? If not, the information hierarchy needs work.

**5. No Loading States (Perceived)**

Linear almost never shows a spinner. They use:
- Optimistic updates (assume success, rollback on failure)
- Skeleton screens (structure appears instantly, data fills in)
- Prefetching (load data before the user clicks)
- Local-first patterns (display cached data, refresh in background)

The result: it feels like the data is already there. Always.

For LTF1: Convex gives us real-time subscriptions, which is actually better than Linear's sync engine for many cases. But we need to pair it with optimistic updates on every mutation and skeleton loading on every query. **No spinners. Ever.**

### The 3,671-Line Elephant in the Room

Our `ProjectManagementPage.tsx` is 3,671 lines. That's not a page — that's a monolith. This single file is likely the source of:
- Slow initial renders (too much code parsed at once)
- State management complexity (too many useState calls in one component)
- Re-render cascades (one state change triggers re-renders across the entire page)
- Developer friction (nobody wants to touch a 3,671-line file)

Linear's equivalent is probably 50+ small, focused components that compose together. Each one renders independently. Each one can be optimized independently. Each one can be lazy-loaded independently.

**This is the single highest-ROI task in the entire battle plan**: Break `ProjectManagementPage.tsx` into modular, independently-renderable components. This alone will make the app feel dramatically faster.

### The Luxury Car Checklist

Before we ship any feature, it must pass the Luxury Car Test:

- [ ] **Does it respond in under 50ms?** If not, optimize.
- [ ] **Can it be triggered via keyboard?** If not, add a shortcut.
- [ ] **Does it have a loading state?** Replace spinner with skeleton or optimistic update.
- [ ] **Is the animation purposeful?** If decorative, remove it. If informational, keep it smooth.
- [ ] **Does it work at 1000 items?** Virtualize if needed.
- [ ] **Is the typography hierarchy clear?** Can you scan it in under 2 seconds?
- [ ] **Does it feel inevitable?** Like this is obviously how it should work?

This checklist is non-negotiable. Tape it to the wall.

---

## What We Already Win

These are features where LTF1 has competitive parity or outright beats Linear. This is our foundation — we're not starting from zero.

### Features Linear Doesn't Have

| Feature | LTF1 Status | Linear Status | Advantage |
|---------|------------|---------------|-----------|
| **Gantt Chart** | Implemented with dependencies | Not available | Major differentiator for teams that need timeline views |
| **Time Tracking** | Built-in timer, manual entries, billable flags, reports, approval workflow | Not available | Entire category Linear ignores — forces users to buy Toggl/Harvest |
| **Meetings** | Full meeting system — standup, retro, planning, review, custom, recurring, Google Cal sync | Not available | Linear has zero meeting support |
| **CLI** | Full-featured — auth, tasks, sprints, time, git, agents, 30+ commands | No official CLI | Developer power-user magnet |
| **TUI** | Go + Bubble Tea terminal UI | Nothing | Unique in the market. No PM tool has a TUI |
| **Multiple Assignees** | Supported per task | Single assignee only | Better for pair programming, shared ownership |

### Competitive Parity

| Feature | LTF1 | Linear | Notes |
|---------|-------|--------|-------|
| Task/Issue Management | Full CRUD, types, priorities, 6 statuses | Same | Core feature parity |
| Sprint/Cycles | Planning, active, completed | Cycles | Similar capability |
| Kanban Board | Implemented | Implemented | Table stakes |
| List/Table Views | Both available | Both available | Table stakes |
| AI Triage | Gemini-powered, duplicate detection, confidence scoring | Triage Intelligence | Comparable |
| Skills/Automations | Built-in + custom skills, trigger conditions | Skills system | Comparable |
| GitHub Integration | Bi-directional sync, 30 files of depth | Deep integration | Comparable |
| Documents/Pages | Rich editor, AI templates, block-based | Documents | Comparable |
| Custom Fields | Implemented | Implemented | Table stakes |
| Command Palette | Cmd+K | Cmd+K | Table stakes |
| Real-time Updates | Convex subscriptions | Custom sync engine | Comparable |
| Activity Feed | Workspace-wide + task-level | Activity stream | Comparable |
| Notifications | In-app + email | In-app + email + mobile push | Linear has mobile edge |
| Teams | Team management, membership | Teams + sub-teams | Linear has sub-teams |

---

## The Critical Gaps

### Tier 1: Must-Have to Be Taken Seriously

These gaps, if left open, will prevent any Linear user from taking LTF1 seriously. They are blocking.

#### Gap 1: Performance & Polish

**What Linear Does**: Sub-50ms interactions everywhere. Virtualized lists. Optimistic updates on every mutation. Skeleton screens. Prefetching. No jank, ever.

**What We Have**: A 3,671-line ProjectManagementPage. Unknown performance characteristics. Likely spinners instead of skeletons. Unclear if optimistic updates are used.

**What We Need**:
- Break `ProjectManagementPage.tsx` into 15-20 focused components
- Virtualize every list that could exceed 100 items (react-window or @tanstack/virtual)
- Optimistic updates on every mutation (status change, assignment, priority)
- Skeleton screens on every query (no spinners)
- Code-split aggressively (already using React.lazy — verify it's working)
- Profile with React DevTools and fix re-render cascades
- Target: every interaction under 100ms, ideally under 50ms

**Impact**: This is 40% of the battle. Speed is Linear's brand. Match it and the rest is feature comparison where we win.

#### Gap 2: Keyboard-First UX

**What Linear Does**: Every action has a shortcut. Vim-style navigation. Bulk operations via keyboard. Keyboard shortcuts are discoverable (? to show all).

**What We Have**: Command palette (Cmd+K). ShortcutHelp component. Unknown shortcut coverage.

**What We Need**:
- Global shortcuts: status (1-6), priority (Alt+1-4), assign (A), label (L)
- Navigation: next/prev task (J/K), back (Esc), focus search (/)
- Actions: new task (C), delete (Backspace), duplicate (D), copy ID (Cmd+Shift+C)
- Bulk: select (X), select all (Cmd+A), then bulk status/priority/assign
- Discovery: `?` to show all shortcuts, inline hints in menus
- Context-aware: different shortcuts for board vs list vs detail view

**Impact**: This is what makes power users fall in love. Linear users will try keyboard shortcuts in the first 30 seconds. If they don't work, they leave.

#### Gap 3: Views & Filters System

**What Linear Does**: Save any filter combination as a named View. Share views with team. Pin views to sidebar. Group by any field. Sort by multiple criteria. Display density options.

**What We Have**: `filterPresets` table. Basic filtering on tasks page.

**What We Need**:
- Elevate filterPresets to first-class "Views"
- Grouping by: status, priority, assignee, label, project, sprint, type
- Multi-criteria sorting (e.g., priority desc, then created desc)
- Display density: comfortable, compact, dense
- Personal vs shared views
- Pin views to sidebar for quick access
- Default view per project/workspace
- View count badges (show number of matching items)

**Impact**: Views are how teams customize Linear to their workflow. Without them, LTF1 feels rigid.

#### Gap 4: Initiatives & Roadmap

**What Linear Does**: Initiatives (strategic goals) → Projects → Issues. Three-level hierarchy. Roadmap view showing projects on a timeline.

**What We Have**: Projects → Tasks. Two-level hierarchy. No roadmap timeline.

**What We Need**:
- `initiatives` table: name, description, status, owner, target date, linked projects
- Roadmap timeline view (horizontal timeline showing project bars)
- Initiative progress rollup (% complete based on linked project progress)
- Initiative-level filtering and reporting
- Strategic planning view (initiatives on a board or timeline)

**Impact**: This is how leadership uses Linear. Without it, LTF1 is a team tool but not an org tool. Initiatives make it strategic.

#### Gap 5: Intake / Asks System

**What Linear Does**: Linear Asks — capture requests from Slack channels, email, and web forms. Auto-route to triage. AI categorizes and suggests actions.

**What We Have**: Triage page. AI triage agent. But no multi-channel intake.

**What We Need**:
- Slack integration: message → task creation (slash command or emoji reaction)
- Email intake: forward email → creates task in triage
- Web forms: public form → creates task in triage (for external requests)
- Intake routing rules: based on channel/sender/keywords, route to correct project
- Intake dashboard: see all incoming requests, batch triage

**Impact**: This is how Linear becomes the "inbox" for an entire org. Without it, tasks only come from people who open LTF1. With it, tasks come from everywhere.

---

### Tier 2: Competitive Differentiators

These gaps are important but won't block adoption. They're what makes someone choose LTF1 over Linear.

#### Gap 6: Public API + Agent SDK

**What Linear Does**: GraphQL API. Agent SDK. OAuth for third-party apps. Webhooks. 75% of enterprise workspaces have coding agents integrated.

**What We Need**:
- REST or GraphQL API layer on top of Convex
- API key management in workspace settings
- Webhook subscriptions (task created, status changed, sprint started, etc.)
- Agent SDK: npm package that wraps the API for coding agents
- OAuth provider: let third-party apps authenticate with LTF1
- Rate limiting and usage tracking

**Impact**: This is the moat. When Cursor/Copilot/Devin integrate with LTF1, switching costs become enormous.

#### Gap 7: Mobile App

**What Linear Does**: iOS and Android apps. Read and write. Push notifications.

**What We Have**: `apps/mobile/` directory, appears early/empty.

**What We Need**:
- React Native or Expo app
- Phase 1: Read-only — view tasks, activity feed, notifications
- Phase 2: Write — update status, assign, comment, create tasks
- Phase 3: Full — all features, offline support
- Push notifications via Expo or Firebase

**Impact**: Mobile is where quick status updates happen. "Is this done yet?" shouldn't require opening a laptop.

#### Gap 8: Enhanced Sprints (Cycles)

**What Linear Does**: Auto-roll incomplete issues to next cycle. Velocity charts. Cooldown periods. Cycle comparison.

**What We Need**:
- Auto-rollover: when sprint completes, incomplete tasks auto-move to next sprint
- Velocity tracking: story points completed per sprint, trend line over time
- Burndown chart: daily progress toward sprint completion
- Burnup chart: scope changes visible over sprint duration
- Cycle comparison: side-by-side metrics across sprints
- Cooldown period: configurable gap between sprints for cleanup

**Impact**: Makes sprint management feel mature and data-driven instead of manual.

#### Gap 9: Templates

**What Linear Does**: Issue templates (bug report, feature request). Project templates.

**What We Need**:
- Task templates: predefined title, description, type, priority, labels, custom fields
- Project templates: predefined task set, sprint structure, team assignment
- Template library: workspace-level, sharable
- Quick-create from template (in command palette and create dialog)

**Impact**: Reduces friction for common workflows. "New bug report" should be one click.

#### Gap 10: Sub-Teams

**What Linear Does**: Multi-level team hierarchy. Parent team → child team.

**What We Need**:
- `parentTeamId` field on teams table
- Team tree view in sidebar
- Permission inheritance (child team inherits parent permissions)
- Roll-up views (see all tasks across a team and its sub-teams)

**Impact**: Required for orgs with 50+ people. Without hierarchy, team management becomes flat and chaotic.

---

### Tier 3: Future Moat

These are features that don't exist yet in Linear (or are "coming soon") where we can leapfrog them.

#### Gap 11: Code Intelligence

Linear announced this as "coming soon" — understand codebases, debug, answer questions.

**Our Advantage**: We have a CLI and TUI that already run in the terminal alongside the codebase. An `ltf1 agent` command that reads your repo context, suggests tasks from TODOs and FIXMEs, links commits automatically, and answers "what's the status of feature X?" would be incredibly powerful.

**What to Build**:
- `ltf1 agent watch` — daemon that monitors git activity and auto-creates/updates tasks
- `ltf1 agent ask "what's blocking the auth refactor?"` — queries tasks + code context
- `ltf1 agent plan "implement OAuth"` — generates task breakdown from codebase analysis
- In-browser: show related code snippets in task detail view

#### Gap 12: Code Diffs / Review Interface

Linear announced this as "coming soon" — modern interface for human-agent code iteration.

**What to Build**:
- Embed PR diff viewer in task detail panel
- Show inline comments from GitHub PR
- Review queue: tasks with linked PRs that need review
- Agent-authored code diffs shown inline with task context

#### Gap 13: Linear/Jira Import

The killer onboarding feature. If someone can import their entire Linear workspace into LTF1 in 5 minutes, the switching cost drops to near zero.

**What to Build**:
- Linear JSON export → LTF1 import (map teams, projects, issues, labels, cycles)
- Jira CSV/JSON import
- Asana export import
- GitHub Issues import (we already have the sync — make it a one-time import option too)

#### Gap 14: SLA Tracking

For customer-facing teams: response time targets, breach alerts, escalation rules.

**What to Build**:
- SLA definitions per project (e.g., "urgent bugs resolved within 4 hours")
- Auto-track time from creation to resolution
- Breach alerts: notification when SLA is about to be missed
- SLA dashboard: compliance rates, average resolution times

---

## Priority Execution Order

### Phase 1: "Holy Shit This Is Fast" — Polish & Speed
*Timeline: Immediate priority*

1. Break up `ProjectManagementPage.tsx` into modular components
2. Comprehensive keyboard shortcuts system (every action, discoverable)
3. Performance audit — virtualized lists, optimistic updates, skeleton loading
4. Views system (grouping, sorting, saved views, pinned to sidebar)
5. Burndown/velocity charts for sprints
6. Animation polish pass (purposeful Framer Motion, no jank)

**Success Metric**: A Linear user opens LTF1 and says "oh, this is fast."

### Phase 2: "Wait, It Does MORE Than Linear?" — Unique Value
*Timeline: After Phase 1*

6. Intake/Asks system (Slack → triage, email → triage, web forms)
7. Initiatives + Roadmap timeline view
8. Task and project templates
9. Enhanced CLI agent — reads codebase, suggests tasks, links commits
10. Auto-rollover sprints, cycle analytics, burndown charts

**Success Metric**: A Linear user discovers a feature they've been requesting for years.

### Phase 3: "We Need to Switch" — Platform & Lock-in
*Timeline: After Phase 2*

11. Public API + Agent SDK (let Cursor/Copilot/Devin integrate)
12. Linear/Jira import tool (5-minute migration)
13. Mobile app (React Native, start read-only)
14. Code diff viewer embedded in task detail
15. Sub-teams with hierarchy

**Success Metric**: A team migrates from Linear to LTF1 in a single afternoon.

### Phase 4: "Enterprise Ready" — Scale
*Timeline: After Phase 3*

16. SSO/SAML via Clerk enterprise
17. Audit logs (who changed what, when)
18. Offline support (service worker + IndexedDB)
19. Advanced permissions (field-level, team-level)
20. SLA tracking and compliance dashboard

**Success Metric**: A 500-person company adopts LTF1 org-wide.

---

## Linear's Announced Roadmap

What Linear has told the world is "coming soon" — and where we can beat them to market:

| Linear "Coming Soon" | Our Status | Opportunity |
|----------------------|-----------|-------------|
| **Code Intelligence** (understand codebases, debug) | CLI already in terminal | Build `ltf1 agent` with codebase awareness FIRST |
| **Code Diffs** (human-agent code iteration UI) | PR linking exists | Embed diff viewer in task detail |
| **Linear Coding Agent** (writes code, fixes bugs) | AI triage exists | Extend agent to suggest code changes via CLI |

Linear is moving toward being a "shared product system" — not just issue tracking. They want to be the operating system for product development. We should be thinking the same way, but with a developer-first angle they can't match (CLI, TUI, terminal-native).

---

## Our Unfair Advantages

These are things Linear cannot easily replicate because of architectural or philosophical choices they've already made:

1. **Terminal-Native**: CLI + TUI means developers never leave their terminal. Linear is browser-only. This is a fundamental architectural advantage for dev teams.

2. **Brutalist Identity**: Our design is opinionated and memorable. Linear looks like Linear. We look like nothing else. In a market of "clean and minimal," standing out matters.

3. **Convex Real-Time**: Convex's subscription model gives us real-time updates without building a custom sync engine. Linear spent years building theirs. We got it for free.

4. **Time Tracking Built-In**: Linear deliberately doesn't do time tracking. Many teams need it. They're forced to use Toggl/Harvest/Clockify alongside Linear. We're all-in-one.

5. **Meetings Built-In**: Same story. Linear has no meeting support. Teams use Notion/Google Docs alongside Linear for meeting notes. We have it integrated.

6. **Gantt Charts**: Timeline-based project planning. Linear doesn't have it. Teams that need it use Monday.com or MS Project alongside Linear.

7. **Multiple Assignees**: Pair programming, shared ownership, collaborative tasks. Linear forces single assignee. We don't.

8. **Open Source (AGPL)**: Transparency, self-hosting potential, community contributions. Linear is closed source. For developer tools, open source is a trust signal.

---

## The Bottom Line

We're not 100 features behind Linear. We're actually ahead in several categories. The gap is **feel**, not **function**. 

Close the feel gap (speed, keyboard UX, polish) and we have a genuinely superior product for developer teams. Linear serves product managers who code. We serve developers who ship.

That's a market worth owning.

---

*This document should be updated as gaps are closed. Check items off. Add new gaps as Linear ships new features. This is a living battle plan, not a static analysis.*
