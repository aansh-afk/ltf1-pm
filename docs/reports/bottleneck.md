# LTF1 Bottleneck Analysis & MVP Shipping Plan

**Date:** February 2026
**Purpose:** Reference guide for shipping priorities — what to fix, what to hide, what to ship.

---

## The Core Problem

LTF1 has **50+ database tables**, **23 authenticated pages**, **59 backend modules**, GitHub/Slack integrations, AI features, a whiteboard, chat, custom fields, developer profiles, and a command palette.

Linear launched with ~5 tables and 3 views.

**We're not behind on features. We're behind on shipping.**

---

## Current Feature Inventory vs Linear

### What We Already Have That Linear Has

| Feature | Status |
|---------|--------|
| Task management (kanban/list/table) | Done |
| Projects & teams | Done |
| Sprint/cycle management | Done |
| Command palette (Cmd+K) | Done |
| Keyboard shortcuts | Done |
| Dark mode (brutalist terminal) | Done |
| GitHub integration (bi-directional) | Done |
| Comments & mentions | Done |
| Custom fields (8 types) | Done |
| Filter presets / saved searches | Done |
| API / HTTP endpoints | Done |
| AI features (suggestions, insights, BYOK) | Done |

### What We Have That Linear Doesn't

- Whiteboard (infinite canvas, Konva.js)
- Chat / messaging (channels, threads, reactions)
- Developer profiles + expertise search
- Standalone CLI tool (separate from web app — real terminal tool, not browser-based)

### What Linear Has That We're Missing

| Feature | Impact | Effort |
|---------|--------|--------|
| **Polish & speed** | Critical | High |
| **Offline support** | High | Very High |
| **Native mobile app** | High | Very High |
| **Real-time presence** | Medium | Medium |
| **Onboarding that converts** | Critical | Medium |
| **Marketing site that sells** | Critical | Medium |

---

## Feature Completeness Audit

| Feature | Completeness | Ship? |
|---------|-------------|-------|
| Task Management | 95% | Yes |
| Project Management | 90% | Yes |
| Sprint Planning | 85% | Yes |
| Team Management | 85% | Yes |
| GitHub Integration | 80% | Yes |
| Custom Fields | 80% | Yes |
| Command Palette | Done | Yes |
| Keyboard Shortcuts | Done | Yes |
| Dashboard | Done | Yes |
| Whiteboard | 75% | Hide for MVP |
| Chat/Messaging | 70% | Hide for MVP |
| AI Features | 60% | Ship basic, hide advanced |
| Mobile Responsiveness | 50% | Audit and fix |
| Slack Integration | 40% | Hide for MVP |
| Real-time Presence | 30% | Skip for MVP |
| GitLab Integration | 20% | Hide for MVP |
| Offline Support | 0% | Skip for MVP |

---

## MVP Scope (What Actually Ships)

After all cuts, the MVP is:

| Feature | Description |
|---------|-------------|
| **Dashboard** | Project overview, activity feed, quick stats |
| **Projects** | Create, manage, invite members, settings |
| **Tasks** | Kanban, list, table views with full CRUD, dependencies, subtasks |
| **Sprints** | Planning board, cycle management, velocity tracking |
| **Teams** | Team creation, roles, member management |
| **GitHub Integration** | Bi-directional issue/PR/commit sync, branch creation |
| **Developer Profiles** | Expertise search, tech stack, GitHub stats |
| **Command Palette** | Cmd+K universal access, fuzzy search, recent commands |
| **Keyboard Shortcuts** | Full navigation without mouse |
| **Custom Fields** | 8 field types, per-workspace, validation rules |
| **AI (Basic)** | Task suggestions from commits/PRs, basic insights |
| **Filter Presets** | Saved searches, advanced filtering |
| **CLI Tool** | Standalone terminal tool (separate package) |
| **Settings** | Workspace settings, user preferences, accessibility |

**That's 14 shipping features. More than Linear had at launch.**

### What's NOT in MVP

| Removed (delete code) | Hidden (keep code, remove from nav) |
|------------------------|--------------------------------------|
| Video Rooms | Whiteboard |
| Time Tracking | Chat / Messaging |
| Meetings / Calendar | Automation Workflows |
| Browser Terminal (in-app) | Reports |
| | Slack Integration |
| | GitLab Integration |
| | Blog Page |

---

## Tier 1: Ship-Blocking (Do These or Don't Launch)

### 1. Fix All Broken UI From Migrations

Still finding broken CSS classes from density migration (`px-16px`, `brutal-card`, `text-brutal-md`, theme variable remnants). Every page needs a visual audit.

**Action:** Grep entire codebase for old class patterns, fix every instance.

**Known broken patterns to search for:**
- `brutal-card`, `brutal-btn`, `brutal-badge`
- `text-brutal-*`, `bg-brutal-*`
- `*-brutalist`, `*-basalt-*`
- `px-*px` (invalid like `px-16px` instead of `px-4` or `px-[16px]`)
- `gap-*px`, `py-*px` (same pattern)
- `var(--theme-*)` CSS variables that may not exist

### 2. Onboarding Flow (New User to Value in <2 Minutes)

- Sign up -> create workspace -> create first project -> create first task
- Guided, opinionated, no dead ends
- Pre-populate with sample data so the app doesn't look empty
- Show the command palette (Cmd+K) on first use

### 3. Landing Page That Converts

- Clear value prop in 5 seconds
- Demo video or interactive preview
- Pricing that makes sense
- Social proof (even if just "built by developers, for developers")

### 4. Performance Audit

Current problems:
- `App.tsx` bundle: **697KB** (gzip 195KB) — enormous
- `WhiteboardPage`: **314KB** (gzip 96KB)
- `ProjectManagementPage`: **206KB** (gzip 46KB)

Targets:
- Page load: **<1s**
- Task creation: **<2s**
- Search: **instant (<100ms)**
- View switching: **<200ms**

Actions:
- Audit and split large bundles
- Ensure all pages are lazy-loaded (already using React.lazy)
- Optimize Vite manual chunks configuration
- Add optimistic UI updates to all mutations
- Measure with Lighthouse, set budgets

### 5. Empty States & Error States Everywhere

Every page needs:
- A useful empty state (not a blank screen)
- Error boundary fallback that helps
- Loading skeleton that matches layout

---

## Tier 2: Competitive Edge (Do These to Stand Out)

### 6. Real-Time Presence Indicators

- Who's online, who's viewing what
- Convex subscriptions make this feasible
- Makes the app feel alive vs static

### 7. Mobile Responsiveness Audit

- Not building a native app yet — just make the web app not break on phones
- Touch targets (min 44px), responsive layouts, collapsible sidebars
- Test every page at 375px, 768px, 1024px widths

### 8. Tighten the Core Loop: Tasks -> Kanban -> Sprint

This is the bread and butter. It needs to feel as fast as Linear:
- Every interaction sub-200ms
- Drag and drop must be smooth
- Inline editing where possible
- Keyboard navigation through task lists

---

## Tier 3: Remove or Hide for MVP

**Remove** = delete code, pages, routes, and related backend tables/functions.
**Hide** = feature-flag or remove from navigation, keep code for post-MVP.

| Feature | Action |
|---------|--------|
| Video Rooms | **Remove** — Zoom/Meet exist |
| Time Tracking | **Remove** — not core PM |
| Meetings / Calendar | **Remove** — Google Calendar exists |
| Browser Terminal | **Remove** — replaced by standalone CLI tool |
| Automation Workflows | Hide — 65% done, polish post-MVP |
| Whiteboard | Hide — cool but not core PM |
| Chat / Messaging | Hide — Slack/Discord exist |
| Reports Page | Hide — build based on user feedback |
| Blog Page | Hide — not core product |
| Slack Integration | Hide — 40% = broken experience |
| GitLab Integration | Hide — 20% = not usable |

**Rules:**
- If it's being replaced by external tools (video, calendar, time tracking) or the standalone CLI: **remove it**.
- If it's below 80% complete but has future value: **hide it**.
- Ship what works perfectly, not everything partially.

---

## What Linear Gets Right (Apply These Principles)

### 1. Speed Is THE Feature

Linear feels instant because of optimistic UI. Every click responds immediately, then syncs in background. Convex supports optimistic updates — use them on every mutation.

### 2. Opinionated Defaults

Stop making everything configurable. Pick the best workflow and make it the default:
- Default task states: Backlog -> Todo -> In Progress -> In Review -> Done
- Default sprint length: 2 weeks
- Default priority levels: Urgent, High, Medium, Low
- Users can customize later. Ship the opinion first.

### 3. Information Density Done Right

Not just small text — the *right* information at the *right* time:
- Kanban card: title, assignee, priority. That's it.
- Task list row: key, title, status, assignee, priority, due date.
- No noise, no decorative elements, no redundant data.

### 4. Subtle Micro-Interactions

Framer Motion usage should be:
- 150ms fades, no bounces
- No spring physics on data tables
- Instant response on user input
- Animations that inform, not entertain

---

## Concrete Action Checklist

### Week 1: Remove Dead Code
- [ ] Delete Video Rooms — pages, components, convex functions, schema tables (`videoRooms`)
- [ ] Delete Time Tracking — pages, components, convex functions, schema tables (`timeEntries`)
- [ ] Delete Meetings/Calendar — pages, components, convex functions, schema tables (`meetings`)
- [ ] Delete Browser Terminal — `CommandTerminal`, command registry, terminal themes
- [ ] Remove all routes for deleted features from App.tsx
- [ ] Remove all lazy imports for deleted pages from App.tsx
- [ ] Remove deleted features from navigation/sidebar
- [ ] Remove related convex crons/scheduled jobs if any
- [ ] Run `npx convex dev --once` to validate schema changes
- [ ] Run `pnpm build` — verify clean build with no dead imports
- [ ] Measure bundle size reduction (target: App.tsx under 500KB)

### Week 2: Fix & Polish
- [ ] Grep and fix all broken CSS classes (brutal-card, px-*px, theme vars)
- [ ] Visual audit every remaining page at 1440px and 768px
- [ ] Add empty states to every page (Dashboard, Projects, Tasks, Teams, Sprints)
- [ ] Add error boundary fallbacks that help (not just "something went wrong")
- [ ] Add loading skeletons that match page layouts
- [ ] Hide features from nav: Whiteboard, Chat, Automation, Reports, Slack, GitLab, Blog

### Week 3-4: Tighten Core Loop
- [ ] Polish Dashboard -> Projects -> Tasks -> Kanban -> Sprint flow
- [ ] Add optimistic updates to all task mutations (create, update, move, delete)
- [ ] Add optimistic updates to project and sprint mutations
- [ ] Keyboard navigation through task list/table/kanban
- [ ] Inline editing on task cards and table rows
- [ ] Drag and drop performance audit (smooth at 60fps)
- [ ] Command palette: verify top 10 actions work flawlessly
- [ ] Performance audit (Lighthouse scores, bundle analysis, set budgets)

### Week 5-6: Onboard & Convert
- [ ] Build onboarding flow: signup -> workspace -> project -> first task
- [ ] Create sample data seeding (demo project with tasks in various states)
- [ ] Show Cmd+K tooltip on first use
- [ ] Add empty state CTAs that guide users to next action
- [ ] Polish landing page (value prop, demo, pricing, social proof)
- [ ] Write 3 key help articles (getting started, keyboard shortcuts, GitHub setup)

### Week 7-8: Ship
- [ ] Production deployment
- [ ] Error monitoring (Sentry or similar)
- [ ] Analytics (feature usage, drop-off points, performance metrics)
- [ ] In-app feedback mechanism
- [ ] Final smoke test of entire MVP flow
- [ ] Launch

---

## User Feedback Strategy

### Pre-Launch (Now → Ship Date)

**1. Waitlist With One Question**
The newsletter/wishlist signup should ask: *"What's your biggest pain with your current PM tool?"*
Open text field. This tells you what problem to solve first post-MVP.

**2. Discord as Beta Channel**
- Invite waitlist signups to Discord (discord.gg/jWMS6Pcr)
- Create #feedback and #bug-reports channels
- Let beta users see development in real-time
- Direct conversation > surveys

**3. Five User Interviews**
Find 5 developers who use PM tools daily. 30-minute screen share.
- Don't explain anything — watch where they get stuck
- Ask: "What were you trying to do?" not "Did you like it?"
- Record sessions (with permission) for the team
- Worth more than 500 survey responses

### Post-Launch (In-App)

**4. Feedback Widget (Built-In)**
Small button in bottom-right corner of the app. Two fields:
- "What's broken or missing?" (required)
- Email (optional, pre-filled from Clerk)
- Stored in `feedback` Convex table
- Route: type = bug | feature | general

**5. Analytics**
PostHog (free tier, self-hostable) or Mixpanel. Track:
- Feature usage (which pages, which actions)
- Drop-off points (where users leave)
- Time-to-first-task (onboarding quality)
- Session duration and frequency
- Command palette usage vs mouse navigation

**6. NPS Survey (Day 7)**
After 7 days of usage, one question:
- "How likely are you to recommend LTF1 to a colleague?" (0-10)
- Score 0-6: "What would need to change?" (open text)
- Score 9-10: "What do you love most?" (open text)
- Don't show again for 90 days

### What NOT to Do
- Don't build a feature voting board before 100+ users — it'll look dead
- Don't send long surveys — nobody fills them out
- Don't ask "what features do you want?" — ask about pain instead
- Don't ignore analytics in favor of gut feeling
- Don't wait for feedback to fix obvious issues

---

## The North Star

> The enemy isn't Linear. The enemy is not shipping. We have more features than Linear had at launch. We need to polish and ship.

**Success metric:** A new user signs up, creates a workspace, adds a project, creates 3 tasks on a kanban board, and says "this is fast" — all in under 5 minutes.
