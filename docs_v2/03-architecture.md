# Technical Architecture — iceberg-pm

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│                                                                  │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  Web App  │    │   TUI    │    │   CLI    │    │  Mobile   │ │
│   │  React    │    │   Ink    │    │ Commander │    │   Expo    │ │
│   │  Vite     │    │  React   │    │          │    │  React    │ │
│   └─────┬────┘    └─────┬────┘    └─────┬────┘    └─────┬────┘ │
│         │               │               │               │       │
│         └───────────────┼───────────────┼───────────────┘       │
│                         │               │                        │
│                    ┌────┴────┐    ┌─────┴─────┐                 │
│                    │  Convex  │    │  Convex   │                 │
│                    │  React   │    │  HTTP     │                 │
│                    │  Client  │    │  Client   │                 │
│                    └────┬────┘    └─────┬─────┘                 │
└─────────────────────────┼───────────────┼───────────────────────┘
                          │               │
┌─────────────────────────┼───────────────┼───────────────────────┐
│                    CONVEX BACKEND                                 │
│                         │               │                        │
│   ┌─────────────────────┴───────────────┴─────────────────┐     │
│   │                  Convex Runtime                        │     │
│   │                                                        │     │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐           │     │
│   │   │ Queries   │  │Mutations │  │ Actions  │           │     │
│   │   │ (read)    │  │ (write)  │  │ (side    │           │     │
│   │   │           │  │          │  │  effects)│           │     │
│   │   └─────┬────┘  └─────┬────┘  └─────┬────┘           │     │
│   │         │              │              │                │     │
│   │   ┌─────┴──────────────┴──────────────┴─────┐         │     │
│   │   │            Convex Database               │         │     │
│   │   │            (60+ tables)                  │         │     │
│   │   └──────────────────────────────────────────┘         │     │
│   │                                                        │     │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐           │     │
│   │   │ Scheduler │  │  Crons   │  │   HTTP   │           │     │
│   │   │ (async)   │  │ (8 jobs) │  │ Endpoints│           │     │
│   │   └──────────┘  └──────────┘  └──────────┘           │     │
│   └────────────────────────────────────────────────────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│                  EXTERNAL SERVICES                               │
│                         │                                        │
│   ┌──────────┐  ┌──────┴───┐  ┌──────────┐  ┌──────────┐     │
│   │  Clerk   │  │  GitHub   │  │  Resend  │  │ Polar.sh │     │
│   │  (auth)  │  │  (git)   │  │  (email) │  │ (billing)│     │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│   │  OpenAI  │  │  Gemini  │  │  Groq    │  │ Cerebras │     │
│   │  (AI)    │  │  (AI)    │  │  (AI)    │  │  (AI)    │     │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│   │  Slack   │  │  Svix    │  │ PostHog  │                    │
│   │  (notif) │  │(webhooks)│  │(analytics│                    │
│   └──────────┘  └──────────┘  └──────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
iceberg-L/
├── apps/
│   ├── web/                    # React + Vite web application
│   │   ├── src/
│   │   │   ├── pages/          # 47 page components
│   │   │   ├── components/     # 122+ feature components
│   │   │   │   ├── ui/         # BrutalXXX design system primitives
│   │   │   │   ├── landing/    # Landing page sections + ASCII art
│   │   │   │   ├── tasks/      # Task management (16 components)
│   │   │   │   ├── whiteboard/ # Canvas/drawing (12 components)
│   │   │   │   ├── projects/   # Project management (10 components)
│   │   │   │   ├── github/     # GitHub integration (9 components)
│   │   │   │   ├── comms/      # Communications (10 components)
│   │   │   │   ├── meetings/   # Meeting management (5 components)
│   │   │   │   ├── sprints/    # Sprint management (5 components)
│   │   │   │   ├── documents/  # Block editor (5 components)
│   │   │   │   ├── remotion/   # Video animations (8 features)
│   │   │   │   └── ...         # 20+ more component directories
│   │   │   ├── hooks/          # 22 custom hooks
│   │   │   ├── services/       # AI service, shortcut manager
│   │   │   ├── contexts/       # Theme, Shortcuts, Accessibility
│   │   │   ├── stores/         # Zustand (workspace store)
│   │   │   └── styles/         # Global CSS, theme stylesheets
│   │   ├── public/             # Static assets
│   │   └── vite.config.ts      # Build config with manual chunks
│   │
│   ├── cli/                    # Commander.js + Ink TUI
│   │   ├── src/
│   │   │   ├── bin/            # Entry point (ltf.ts)
│   │   │   ├── tui/            # Full-screen TUI application
│   │   │   │   ├── App.tsx     # Shell, routing, keyboard input
│   │   │   │   ├── pages/      # 7 TUI pages
│   │   │   │   ├── hooks/      # 8 TUI hooks
│   │   │   │   ├── theme.ts    # Terminal color system
│   │   │   │   └── helpers.ts  # Render utilities
│   │   │   ├── commands/       # 14 command groups
│   │   │   ├── lib/            # Auth, config, output, git, convex
│   │   │   └── types/          # Shared type definitions
│   │   └── package.json        # @vvg-ltf1/cli v0.1.0-beta.3
│   │
│   └── mobile/                 # Expo React Native (early stage)
│
├── convex/                     # Convex backend
│   ├── schema.ts               # 60+ table definitions
│   ├── http.ts                 # 3 HTTP endpoints
│   ├── crons.ts                # 8 cron jobs
│   ├── tasks/                  # Task queries, mutations
│   ├── sprints/                # Sprint management + snapshots
│   ├── projects/               # Project CRUD + members
│   ├── workspaces/             # Workspace management
│   ├── teams/                  # Team management
│   ├── ai/                     # AI generation, assignment, insights
│   ├── github/                 # Extensive GitHub integration (15+ files)
│   ├── auth/                   # Auth utilities
│   ├── notifications/          # Notification system
│   ├── meetings/               # Meeting management
│   ├── search/                 # Global search
│   ├── documents/              # Document CRUD
│   ├── dashboard/              # Combined dashboard queries
│   ├── comments/               # Comment management
│   ├── activities/             # Activity logging
│   ├── automation/             # Workflow automation
│   ├── billing/                # Subscription management
│   └── ...                     # Additional modules
│
├── packages/
│   ├── backend/                # Shared backend utilities
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared UI components (future)
│
├── docs/                       # Documentation v1
├── docs_design/                # Design system (6 files)
├── docs_v2/                    # Documentation v2 (this)
└── package.json                # Root monorepo config (pnpm workspaces)
```

---

## Data Flow Patterns

### Web App: Real-Time Reactive Queries

```
User Action → React Component → useQuery(api.tasks.getProjectTasks)
                                        │
                                        ▼
                                  Convex Runtime
                                        │
                                        ▼
                                  Database Query
                                        │
                                        ▼
                                  Real-time Subscription
                                  (WebSocket push on data change)
                                        │
                                        ▼
                                  React re-render
```

Web app uses `ConvexReactClient` with Clerk token integration. Queries are reactive — when underlying data changes (any client, any mutation), all subscribed components re-render automatically. No polling required.

### TUI/CLI: Polling-Based Queries

```
TUI Page Mount → useConvexQuery(api.tasks.getProjectTasks, args, interval)
                        │
                        ▼
                  ConvexHttpClient.query()
                        │
                        ▼
                  HTTP Request to Convex Cloud
                        │
                        ▼
                  Response → setState → Re-render
                        │
                        ▼
                  Wait interval (10-30s) → Repeat
```

CLI/TUI uses `ConvexHttpClient` (HTTP-based, not WebSocket). Data freshness bounded by poll interval:
- Tasks: 10s polling (responsive)
- Dashboard: 30s polling
- Git status: 5s polling (only when active)

### Mutation Flow

```
User clicks "Create Task"
        │
        ▼
useMutation(api.tasks.createTask)({ title, type, priority, ... })
        │
        ▼
Convex Runtime executes mutation transactionally
        │
        ├──▶ Insert task document
        ├──▶ Log activity
        ├──▶ Schedule triage (future: agent.triage.triageTask)
        └──▶ Return task ID
        │
        ▼
All subscribed queries re-evaluate and push updates
```

### GitHub Webhook Flow

```
GitHub Event (push, PR, issue)
        │
        ▼
POST /clerk-webhook → http.ts handler
        │
        ▼
Validate webhook signature
        │
        ▼
Store in githubWebhookEvents table
        │
        ▼
Schedule processing: internal.github.sync.processEvent
        │
        ▼
Parse event type → Route to handler:
  - push → Parse commits for task keys → Link to tasks
  - PR → Create/update githubPullRequests → Update task status
  - issue → Bi-directional sync → Create/update task
  - review → Update PR status → Notify assignee
```

### AI Generation Flow

```
User triggers AI (task suggestion, sprint analysis, etc.)
        │
        ▼
Action: ai.generate.generateContent
        │
        ├──▶ Resolve AI config (provider, model, API key)
        ├──▶ Check credits (canMakeAIRequest)
        ├──▶ Assemble context (tasks, sprint, team data)
        ├──▶ Call AI provider (Gemini/Groq/Cerebras)
        ├──▶ Parse response
        ├──▶ Track usage (tokens, cost, latency)
        └──▶ Return structured result
        │
        ▼
Mutation: Store result (aiSessions, aiInsights, aiTasks)
        │
        ▼
Query: Frontend picks up new data reactively
```

---

## Authentication Architecture

### Web App (Clerk Integration)

```
App Load → ClerkProvider wraps application
        │
        ▼
SignIn/SignUp → Clerk UI components (branded)
        │
        ▼
Authenticated → useAuth() provides token
        │
        ▼
ConvexProviderWithClerk passes token to Convex
        │
        ▼
Convex backend: ctx.auth.getUserIdentity()
        │
        ▼
auth/users.ts: getOrCreateUser() → users table
```

### CLI Authentication

```
ltf login → Opens browser to /cli-auth?state=<csrf>&redirect=localhost:9876
        │
        ▼
User authenticates via Clerk in browser
        │
        ▼
Browser redirects to localhost:9876/callback?token=<jwt>&userId=...
        │
        ▼
CLI validates CSRF state, stores token in local config
        │
        ▼
All CLI/TUI requests include: Authorization: Bearer <jwt>
        │
        ▼
Token refresh: Silent refresh via sessionId or re-auth via browser
```

### Permission Model

```
Workspace Level:
  owner  → Full control (delete workspace, manage billing)
  admin  → Manage members, settings, integrations
  member → CRUD on projects, tasks, sprints
  viewer → Read-only access

Project Level:
  lead        → Project settings, member management
  member      → Full task management
  contributor → Create/update tasks (limited)
  viewer      → Read-only

Permission Check Pattern:
  1. Identify user from ctx.auth.getUserIdentity()
  2. Look up workspaceMember record
  3. Check role against required permission
  4. For project-specific: also check projectMember role
```

---

## Database Architecture

### Table Categories

| Category | Tables | Purpose |
|----------|--------|---------|
| **Core PM** | users, workspaces, workspaceMembers, projects, projectMembers, teams, teamMembers | Organizational structure |
| **Task Mgmt** | tasks, sprints, comments, attachments, timeEntries, activities | Day-to-day work tracking |
| **AI** | aiSessions, aiInsights, aiTasks, aiCredits, userAICredits, aiUsageLogs, aiPricingTiers, aiProviderKeys, projectAISettings | AI infrastructure |
| **GitHub** | githubInstallations, githubRepositories, githubCommits, githubPullRequests, githubIssues, githubActivities, githubConnections, githubWebhookEvents, githubUserMappings, githubTeamMappings, githubIssueSyncQueue, workspaceGitHubInstallations | Git integration |
| **Collab** | meetings, documents, communications, notifications | Collaboration tools |
| **Config** | customFields, filterPresets, integrations, developerProfiles, expertiseSearchIndex | Configuration and profiles |
| **Billing** | subscriptions, billingPortalSessions | Subscription management |
| **Other** | bugReports, feedback, nps, newsletter, wishlist, webhookEvents | Supporting features |

### Key Indexes

| Table | Index | Fields | Purpose |
|-------|-------|--------|---------|
| tasks | by_projectId | [projectId] | List tasks in project |
| tasks | by_projectId_and_status | [projectId, status] | Filter tasks by status |
| tasks | by_assigneeId | [assigneeId] | User's assigned tasks |
| tasks | by_workspaceId | [workspaceId] | Workspace-wide task queries |
| tasks | search_title | search: title, filter: projectId | Full-text search |
| sprints | by_projectId | [projectId] | Project sprints |
| sprints | by_projectId_and_status | [projectId, status] | Active sprint lookup |
| activities | by_workspaceId | [workspaceId] | Activity feed |
| activities | by_projectId | [projectId] | Project activity |
| notifications | by_userId | [userId] | User notifications |
| notifications | by_userId_and_isRead | [userId, isRead] | Unread notifications |
| githubIssues | by_repositoryId | [repositoryId] | Repo issue list |
| githubIssueSyncQueue | by_status | [status] | Sync queue processing |

### Cron Jobs

| Name | Interval | Purpose |
|------|----------|---------|
| process-github-issue-sync-queue | 1 min | Bi-directional GitHub issue sync |
| process-github-team-sync | 1 hour | Sync GitHub org teams |
| process-github-repository-sync | 15 min | Sync repository metadata |
| process-github-stats-sync | 30 min | Sync developer GitHub stats |
| process-due-date-reminders | 6 hours | Email due date reminders |
| process-overdue-alerts | 12 hours | Alert on overdue tasks |
| process-meeting-reminders | 15 min | Email meeting reminders |
| daily sprint snapshot | Daily 00:00 UTC | Capture burndown data |

---

## Frontend Architecture (Web)

### Build System

**Vite** with manual chunk splitting:
- `react-vendor`: react, react-dom, react-router-dom
- `clerk`: @clerk/clerk-react
- `convex`: convex
- `animation`: framer-motion, @remotion/player

### Routing

**React Router v6** with lazy loading for authenticated pages:

```typescript
// Public pages (eager load)
<Route path="/" element={<LandingPage />} />
<Route path="/pricing" element={<PricingPage />} />
<Route path="/features" element={<FeaturesPage />} />

// Authenticated pages (lazy load)
<Route element={<RequireAuth />}>
  <Route element={<DashboardLayout />}>
    <Route path="/dashboard" element={<Suspense><Dashboard /></Suspense>} />
    <Route path="/tasks" element={<Suspense><TasksPage /></Suspense>} />
    // ... 20+ more lazy-loaded routes
  </Route>
</Route>
```

### State Management

| Layer | Tool | Scope |
|-------|------|-------|
| Server state | Convex reactive queries | Global, real-time |
| Workspace context | Zustand (useWorkspaceStore) | Current workspace ID |
| Theme | React Context (ThemeContext) | Global theme selection |
| Shortcuts | React Context (ShortcutContext) | Keyboard binding registry |
| Accessibility | React Context (AccessibilityContext) | A11y preferences |
| Component state | useState / useReducer | Per-component |
| Persistent prefs | localStorage | Browser-local |

### Component Architecture

```
Page (e.g., TasksPage)
├── Uses useQuery() for data
├── Uses useReducer() for complex local state
├── Renders BrutalXXX primitives
├── Contains modals (CreateTaskModal, etc.)
├── Handles keyboard shortcuts
└── Wraps with ErrorBoundary

BrutalXXX Primitives
├── BrutalButton (variants: primary, secondary, ghost, danger, glitch, neon)
├── BrutalCard (container with 2px border, hard shadow)
├── BrutalModal (portal, focus trap, ESC handler, animations)
├── BrutalInput, BrutalSelect, BrutalToggle, BrutalCheckbox
├── BrutalTable, BrutalCalendar, BrutalSlider, BrutalProgress
├── BrutalBadge, BrutalAvatar, BrutalTooltip, BrutalNotification
└── All: 0px border-radius, 2px borders, IBM Plex Mono, hard shadows
```

---

## TUI Architecture

### Rendering Model

The TUI uses a **segment-based row rendering** approach instead of nested JSX:

```typescript
type Segment = { text: string; color: string }
type Row = { segments: Segment[]; bgColor?: string }

// Each TUI page returns Row[]
function DashboardPage(props): Row[] {
  return [
    pageHeader("DASHBOARD", time, width),
    blank(width),
    section("ACTIVE SPRINT", width),
    segRow([
      { text: "Sprint 1", color: theme.WHITE },
      { text: " — ", color: theme.DIM },
      { text: "7/10 tasks", color: theme.LIGHT },
    ]),
    // ...
  ];
}
```

This approach:
- Avoids React component tree overhead
- Enables full-screen rendering without layout engines
- Maps directly to terminal character grids
- Supports ANSI color codes natively

### Terminal Control

```typescript
// Alternate screen buffer (like vim)
process.stdout.write('\x1b[?1049h');  // Enter alternate screen
process.stdout.write('\x1b[?25l');     // Hide cursor
process.stdout.write('\x1b[H');        // Move to top-left

// On exit
process.stdout.write('\x1b[?25h');     // Show cursor
process.stdout.write('\x1b[?1049l');   // Leave alternate screen
```

### Navigation State Machine

```
┌──────────────────────────────────────────┐
│             UNAUTHENTICATED              │
│  (Welcome screen + login prompt)         │
└──────────────┬───────────────────────────┘
               │ Enter (login)
               ▼
┌──────────────────────────────────────────┐
│           WORKSPACE SELECTOR             │
│  (List workspaces, arrow keys + enter)   │
└──────────────┬───────────────────────────┘
               │ Select workspace
               ▼
┌──────────────────────────────────────────┐
│            PROJECT SELECTOR              │
│  (List projects, arrow keys + enter)     │
└──────────────┬───────────────────────────┘
               │ Select project
               ▼
┌──────────────────────────────────────────┐
│              DASHBOARD                    │
│  (Sprint summary, my tasks, stats)       │
│                                          │
│  t/1 → Tasks    s/2 → Sprint            │
│  g/3 → Git      /5  → Search            │
│  n/6 → Notif    ?/7 → Help              │
│  w   → Workspace  p  → Project          │
└──────────────────────────────────────────┘
```

---

## Deployment Architecture

### Current

| Component | Host | URL |
|-----------|------|-----|
| Web App | Vercel | ltf1.dev |
| Convex Backend | Convex Cloud | your-deployment.convex.cloud |
| Auth | Clerk Cloud | clerk.com |
| Email | Resend | resend.com |
| Billing | Polar.sh | polar.sh |
| Analytics | PostHog Cloud | posthog.com |
| CLI | npm registry | @vvg-ltf1/cli |

### Self-Hosted (Target)

```
Docker Compose:
├── web (nginx + static React build)
├── convex (self-hosted Convex or compatible)
├── clerk (self-hosted or compatible auth)
└── agents (Node.js agent runtime)
```

---

## Performance Characteristics

### Web App
- Initial bundle: ~500KB (gzipped) with code splitting
- Time to interactive: <2s on broadband
- Reactive queries: <100ms update latency
- 23 lazy-loaded page chunks
- Manual Vite chunks: react-vendor, clerk, convex, animation

### TUI
- Memory: 50-80MB (Node.js + React + Convex client)
- Render cycle: ~100ms (Ink refresh rate)
- Data freshness: 5-30s (poll interval dependent)
- Startup: 1-2s to dashboard (after auth)

### Backend
- Query latency: <50ms (indexed queries)
- Mutation latency: <100ms (single document operations)
- Cron processing: 1 min cycle for GitHub sync
- AI operations: 1-5s (model-dependent)
