# LTF CLI Audit — MVP Readiness Report

> **Date**: 2026-02-15
> **CLI Version**: 0.1.0-beta.2
> **Codebase**: `apps/cli/` — 80 files, 13,264 LOC
> **Backend**: `convex/` — 53 tables, 423+ functions
> **CLI surfaces ~15% of backend API**

---

## Table of Contents

- [1. Architecture Overview](#1-architecture-overview)
- [2. What's Built (Current State)](#2-whats-built-current-state)
- [3. Critical Bugs — Ship Blockers](#3-critical-bugs--ship-blockers)
- [4. Backend Functions Not Exposed by CLI](#4-backend-functions-not-exposed-by-cli)
- [5. Missing MVP Features](#5-missing-mvp-features)
- [6. Quality of Life Gaps](#6-quality-of-life-gaps)
- [7. Hardcoded Values That Need Config](#7-hardcoded-values-that-need-config)
- [8. Convex Client Mapping Gaps](#8-convex-client-mapping-gaps)
- [9. TUI Dashboard Deep Audit](#9-tui-dashboard-deep-audit)
- [10. TUI Component Audit](#10-tui-component-audit)
- [11. TUI Hooks & Infrastructure](#11-tui-hooks--infrastructure)
- [12. TUI Bugs & Missing Features](#12-tui-bugs--missing-features)
- [13. Unified MVP Roadmap (TUI-First)](#13-unified-mvp-roadmap-tui-first)
- [14. File Reference Index](#14-file-reference-index)

---

## 1. Architecture Overview

### Directory Structure

```
apps/cli/
├── src/
│   ├── bin/ltf.ts                    # Entry point (Commander.js)
│   ├── commands/                     # 7 command modules
│   │   ├── auth/                     # login, logout, status (3 files)
│   │   ├── task/                     # CRUD operations (8 files)
│   │   ├── sprint/                   # Sprint management (5 files)
│   │   ├── project/                  # Project selection (5 files)
│   │   ├── ai/                       # AI features (4 files)
│   │   ├── git/                      # Git integration (6 files)
│   │   └── daemon/                   # Background process (6 files)
│   ├── lib/                          # Core utilities
│   │   ├── config.ts                 # Persistent config (~/.config/ltf-nodejs/config.json)
│   │   ├── convex.ts                 # Convex client + API references
│   │   ├── auth.ts                   # OAuth + token auth
│   │   ├── output.ts                 # Terminal formatting (colors, tables, spinners)
│   │   ├── git.ts                    # Git operations (simple-git)
│   │   ├── errors.ts                 # Error handling
│   │   └── __tests__/                # 4 test files (auth, config, errors, git)
│   ├── tui/                          # React Ink dashboard
│   │   ├── App.tsx                   # Main TUI app
│   │   ├── pages/                    # 4 pages (Dashboard, Tasks, Sprint, Git)
│   │   ├── components/               # 11 reusable components
│   │   ├── hooks/                    # 6 custom hooks
│   │   ├── types.ts                  # Type definitions
│   │   └── theme.ts                  # Terminal theme
│   └── types/                        # TypeScript definitions
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Key Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| `commander` | v12 | CLI framework |
| `convex` | v1.13 | Backend client (ConvexHttpClient) |
| `ink` | v5 | React for terminal UIs (TUI dashboard) |
| `chalk` | v5 | Terminal colors |
| `ora` | v8 | Spinners |
| `cli-table3` | v0.6 | Table output |
| `boxen` | v8 | Box drawing |
| `figures` | v6 | Unicode icons |
| `conf` | v13 | Persistent JSON config |
| `simple-git` | v3.27 | Git operations |
| `inquirer` | v10 | Interactive prompts |
| `open` | v10 | Open browser for auth |
| `express` | v4.21 | Auth callback server |
| `date-fns` | v4.1 | Date formatting |
| `tsup` | — | Build (ESM) |
| `vitest` | — | Testing |

### Auth Flow

1. `ltf auth login` opens browser to `/cli-auth`
2. Local HTTP callback server listens on port 9876
3. CSRF protection via state parameter
4. JWT token stored in `~/.config/ltf-nodejs/config.json`
5. Silent refresh via Clerk sessionId
6. Fallback: `--token` flag for API token login

### Config Storage

Location: `~/.config/ltf-nodejs/config.json`

```typescript
{
  auth: { token, tokenType, userId, email, expiresAt, sessionId },
  context: { workspaceId, projectId, projectKey, projectName },
  preferences: { defaultFormat, colorOutput, autoSync },
  daemon: { enabled, pid, logFile },
  gitHooks: { installed, installedAt }
}
```

---

## 2. What's Built (Current State)

### Command Registry

| Command | Subcommands | Status | Backend Wired |
|---------|-------------|--------|---------------|
| `ltf auth` | `login`, `logout`, `status` | Working | Yes |
| `ltf task` | `create`, `list`, `view`, `update`, `done`, `assign` | Working | Yes |
| `ltf sprint` | `list`, `status`, `create`, `add` | Partial | Yes |
| `ltf project` | `list`, `select`, `info`, `detect` | Working | Yes |
| `ltf ai` | `suggest`, `analyze`, `describe` | Working (fallback) | Partial |
| `ltf git` | `link`, `sync`, `hooks install/uninstall`, `status`, `hook` | Broken | No (see bugs) |
| `ltf daemon` | `start`, `stop`, `status`, `logs` | Working | N/A (local) |
| `ltf dashboard` (alias: `d`) | — | Working | Yes |

### TUI Dashboard

4 full pages built with React Ink:

| Page | Features | Interactions Wired |
|------|----------|--------------------|
| **Dashboard** | Welcome flow, project selector, task stats, sprint progress, recent activity | Read-only |
| **Tasks** | Task list, filtering, keyboard nav, pagination | Read-only |
| **Sprint** | Sprint overview, burndown chart, task breakdown | Read-only |
| **Git** | Branch status, commits, PR status, hook status | Read-only |

11 reusable components, 6 custom hooks.

### Output System (`lib/output.ts`)

- Status-aware colors (backlog, todo, in_progress, in_review, done, cancelled)
- Priority colors (urgent=red/bold, high=red, medium=yellow, low=gray)
- Type colors (feature, bug, improvement, task, epic)
- `spinner()`, `table()`, `keyValue()`, `json()`, `box()`, `header()`
- `formatStatus()`, `formatPriority()`, `formatType()`, `formatTaskNumber()`
- `progressBar()` for sprint visualizations

### Test Coverage

4 test files in `lib/__tests__/`:
- `auth.test.ts` — Token validation, JWT parsing, login flows, expiry
- `config.test.ts` — Config management
- `errors.test.ts` — Error handling
- `git.test.ts` — Branch/commit parsing, task reference extraction

Coverage threshold: 50% (statements, branches, functions, lines).

---

## 3. Critical Bugs — Ship Blockers

### BUG-001: `ltf git sync` is non-functional

**File**: `src/commands/git/sync.ts`
**Severity**: Critical
**Description**: The sync command iterates through repos and increments a counter but **never calls any backend function**. It is pure UI simulation.

```
Lines 89-119: --all flag loops through repos, increments syncedRepos, calls nothing
Lines 122-229: Single repo sync outputs messages but triggers no mutation/action
```

**Fix**: Wire to `syncRepository` action or `fetchGitHubActivity` action from the backend.

---

### BUG-002: `ltf git link` doesn't persist data

**File**: `src/commands/git/link.ts`
**Severity**: Critical
**Description**: Calls `updateTask` with an empty update object. Comment at line 132 says "The backend would need to support this." PR linking at lines 164-173 only outputs info messages.

**Fix**: Backend `updateTask` already supports fields — pass PR URL, branch name in the update payload. Or use GitHub integration functions.

---

### BUG-003: Git hook handlers silently swallow all errors

**File**: `src/commands/git/hook-handler.ts`
**Severity**: High
**Description**: Every try-catch block has empty catch clauses (lines 35-37, 67-70, 152-154). When hooks fail, there is zero feedback. Debugging is impossible.

**Fix**: Log errors to daemon log file or stderr. At minimum `console.error()` in catch blocks.

---

### BUG-004: `ltf task assign <id> --to me` is broken

**File**: `src/commands/task/assign.ts`
**Severity**: High
**Description**: No `getCurrentUser` query mapped in Convex client. The workaround at line 127 tries to find the user from workspace members but fails when there's more than 1 member.

**Fix**: Add `getCurrentUser` or `auth/users:getCurrentUser` to the Convex client API references. Use authenticated user's Clerk ID to resolve.

---

### BUG-005: `validateAuth()` doesn't validate against backend

**File**: `src/lib/convex.ts`, lines 112-124
**Severity**: Medium
**Description**: Only checks if a token exists locally. Never hits the backend to verify the token is still valid. Comment says "We'll implement a simple query to validate the token."

**Fix**: Call `getCurrentUser` query as a validation ping. If it throws, token is invalid.

---

## 4. Backend Functions Not Exposed by CLI

The Convex backend has 423+ functions. The CLI maps ~60. These features have full backend support but no CLI commands:

### Tier 1 — High Value, Backend Ready

| Feature | Backend Functions | CLI Impact |
|---------|-------------------|------------|
| **Comments** | `createComment`, `updateComment`, `deleteComment` | Can't discuss tasks from terminal |
| **Time Tracking** | `startTimer`, `stopTimer`, `createManualEntry`, `getTimeEntriesByUser`, `getTimeEntriesByProject`, `approveTimeEntries` | Major Linear feature, fully built |
| **Search** | `globalSearch`, `quickSearch`, `searchSuggestions` | Can't find anything without browsing |
| **Notifications** | Full notification system in schema | No way to stay in the loop |
| **Task Delete** | `deleteTask` mutation | Can't delete tasks from CLI |
| **Task Move** | `moveTask` mutation | Can't move tasks between sprints |
| **Sprint Lifecycle** | `updateSprint`, `deleteSprint`, `removeTaskFromSprint` | Can create but can't close/activate |
| **Sprint Backlog** | `getBacklogTasks` query | Can't view unassigned backlog |
| **Labels** | `getWorkspaceLabels` query | Labels exist on tasks but can't manage them |

### Tier 2 — Competitive Features

| Feature | Backend Functions | CLI Impact |
|---------|-------------------|------------|
| **Teams** | `getTeams`, `createTeam`, `addTeamMember`, `getTeamMembers` | Can't manage teams |
| **Workspace Mgmt** | `inviteToWorkspace`, `updateMemberRole`, `removeMember`, `getWorkspaceStats` | Can't admin workspace |
| **Project CRUD** | `createProject`, `updateProject`, `deleteProject`, `addProjectMember` | Can only list/select projects |
| **Activities** | `getProjectActivities`, `getWorkspaceActivities`, `getRecentTeamActivity` | No activity feed |
| **Custom Fields** | Full CRUD + `searchByCustomFields` | Can't use custom fields |
| **Filter Presets** | `getWorkspaceFilterPresets`, `createFilterPreset` | Can't save/load filters |
| **Developer Profiles** | `getMyProfile`, `updateStatus`, `updateTechStack` | No dev presence |
| **AI Credits** | `getUserAICredits`, `canMakeAIRequest`, `saveApiKey` | No credit management |

### Tier 3 — Advanced/Integration Features

| Feature | Backend Functions | Notes |
|---------|-------------------|-------|
| **GitHub Deep** | 51 functions (PRs, issues, commits, team mapping, webhooks) | CLI barely scratches surface |
| **GitLab** | 13 functions (OAuth, projects, MRs, issue sync) | Not exposed at all |
| **Slack** | 17 functions (integration, channels, events, standups) | Not exposed at all |
| **Meetings** | Full CRUD + action items + recording | Not exposed |
| **Automation** | `createWorkflow`, `triggerWorkflow`, workflow runs | Not exposed |
| **Audit Logs** | `getAuditLogs`, `exportAuditLogs` | Not exposed |
| **Resources** | Allocation, capacity, workload balance, utilization | Not exposed |

---

## 5. Missing MVP Features

### 5.1 Task Management

| Missing Command | Description | Backend Function |
|-----------------|-------------|-----------------|
| `ltf task comment <id> "text"` | Add comment to task | `createComment` |
| `ltf task delete <id>` | Delete a task | `deleteTask` |
| `ltf task move <id> --sprint <s>` | Move task to sprint | `moveTask` |
| `ltf task search "query"` | Full-text search | `globalSearch` |
| `ltf task mine` | Show my assigned tasks | `getMyTasks` (already mapped) |
| `ltf task subtask <id> "title"` | Create subtask | `createTask` with parent |
| `ltf task watch/unwatch <id>` | Subscribe to updates | Needs backend |
| `ltf task bulk-update` | Bulk status/priority change | Loop `updateTask` |
| `ltf task recent` | Recently updated tasks | `getFilteredTasks` sorted |

### 5.2 Sprint Management

| Missing Command | Description | Backend Function |
|-----------------|-------------|-----------------|
| `ltf sprint update <id>` | Modify sprint after creation | `updateSprint` |
| `ltf sprint delete <id>` | Delete a sprint | `deleteSprint` |
| `ltf sprint activate <id>` | Start a sprint | `updateSprint` (status=active) |
| `ltf sprint close <id>` | Complete a sprint | `updateSprint` (status=completed) |
| `ltf sprint remove <task>` | Remove task from sprint | `removeTaskFromSprint` |
| `ltf sprint backlog` | View backlog tasks | `getBacklogTasks` |

### 5.3 Project Management

| Missing Command | Description | Backend Function |
|-----------------|-------------|-----------------|
| `ltf project create <name>` | Create project | `createProject` |
| `ltf project update` | Modify project | `updateProject` |
| `ltf project members` | List project members | `getProjectMembers` |
| `ltf project invite <email>` | Invite to project | `addProjectMember` |

### 5.4 Workspace Management (Entire Module Missing)

| Missing Command | Description | Backend Function |
|-----------------|-------------|-----------------|
| `ltf workspace list` | List workspaces | `getUserWorkspaces` (mapped, no command) |
| `ltf workspace select` | Switch workspace | Config update |
| `ltf workspace members` | List members | `getWorkspaceMembers` |
| `ltf workspace invite <email>` | Invite member | `inviteToWorkspace` |
| `ltf workspace stats` | Show statistics | `getWorkspaceStats` |

### 5.5 Time Tracking (Entire Module Missing)

| Missing Command | Description | Backend Function |
|-----------------|-------------|-----------------|
| `ltf time start <task>` | Start timer | `startTimer` |
| `ltf time stop` | Stop active timer | `stopTimer` |
| `ltf time pause` | Pause timer | `pauseTimeTracking` |
| `ltf time log <task> 2h "desc"` | Manual entry | `createManualEntry` |
| `ltf time status` | Show active timer | `getActiveTimeEntry` |
| `ltf time report` | Time report | `getTimeEntriesByUser`, `getTimeStatsByUser` |

### 5.6 Search (Module Missing)

| Missing Command | Description | Backend Function |
|-----------------|-------------|-----------------|
| `ltf search "query"` | Global search | `globalSearch` |
| `ltf search --tasks "query"` | Search tasks only | `quickSearch` |
| `ltf search --suggest "query"` | Autocomplete | `searchSuggestions` |

### 5.7 Notifications (Module Missing)

| Missing Command | Description | Backend Function |
|-----------------|-------------|-----------------|
| `ltf notifications` | List notifications | Needs query |
| `ltf notifications --unread` | Unread only | Needs query |
| `ltf notifications mark-read` | Mark all read | Needs mutation |

### 5.8 Shell Completions (Not Implemented)

Commander.js supports shell completions natively. Needs:
- `ltf completion bash` — Output bash completions
- `ltf completion zsh` — Output zsh completions
- `ltf completion fish` — Output fish completions

---

## 6. Quality of Life Gaps

### 6.1 Missing Command Aliases

Terminal-native developers need short aliases:

| Full Command | Missing Alias |
|-------------|---------------|
| `ltf task` | `ltf t` |
| `ltf sprint` | `ltf s` |
| `ltf project` | `ltf p` |
| `ltf task list` | `ltf t l` |
| `ltf task create` | `ltf t c` |
| `ltf task view` | `ltf t v` |
| `ltf task done` | `ltf t d` |
| `ltf task mine` | `ltf t m` |
| `ltf search` | `ltf /` |

### 6.2 Scripting / Piping Support

- `--json` flag exists globally but not consistently honored by all commands
- Missing `--ids-only` flag for piping task IDs to other commands
- Missing `--quiet` flag to suppress non-essential output
- Missing `--no-header` flag for table output without headers
- Should support: `ltf task list --json | jq '.[] | select(.priority == "urgent")'`
- Should support: `ltf task list --ids-only | xargs -I{} ltf task done {}`

### 6.3 Interactive Wizards

`inquirer` is installed but barely used. Missing:
- `ltf task create` (no args) should open interactive wizard
- `ltf sprint create` (no args) should prompt for dates/goal
- `ltf project select` already has interactive mode (good)

### 6.4 Configuration Command (Missing)

No way to manage config from CLI:
- `ltf config list` — Show all settings
- `ltf config get <key>` — Get a value
- `ltf config set <key> <value>` — Set a value
- `ltf config reset` — Reset to defaults

### 6.5 Version & Update (Missing)

- No `ltf version` or `ltf --version` with detailed info
- No auto-update check on startup
- No `ltf update` command

### 6.6 Help Enhancements

- No usage examples in help text
- Commander supports `.addHelpText('after', ...)` for examples
- No `ltf examples` or `ltf quickstart` command

### 6.7 TUI Dashboard Gaps

- Task creation/editing from TUI not wired (read-only)
- No task detail view in TUI (only list)
- No keyboard shortcut to quick-create from any page
- No notifications page
- No search from TUI

---

## 7. Hardcoded Values That Need Config

| File | Line | Current Value | Should Be |
|------|------|---------------|-----------|
| `daemon/watcher.ts` | 286 | 500ms poll interval | `preferences.daemon.pollInterval` |
| `sprint/create.ts` | 32-33 | 2-week default duration | `preferences.sprint.defaultDuration` |
| `daemon/logs.ts` | 41 | 10 default log lines | `preferences.daemon.defaultLogLines` |
| `git/hook-handler.ts` | 294 | `['main','master','develop']` | `preferences.git.mainBranches` |
| `task/list.ts` | 71-73 | Excludes done/cancelled | `preferences.task.defaultStatusFilter` |
| `task/view.ts` | 235 | Last 5 comments | `preferences.task.commentLimit` |
| `task/view.ts` | 247 | Last 10 activities | `preferences.task.activityLimit` |
| `sprint/status.ts` | 224 | 10-point burndown | Terminal-width-aware calculation |
| `daemon/start.ts` | 268 | Hardcoded exe search paths | `$PATH` lookup |
| `daemon/start.ts` | 310-314 | 5s poll timeout (25 x 200ms) | `preferences.daemon.startTimeout` |
| `daemon/logs.ts` | 89-111 | 1000ms follow interval | `preferences.daemon.followInterval` |

---

## 8. Convex Client Mapping Gaps

The CLI's `src/lib/convex.ts` needs these additional API references to support new commands:

### Must Add (P0/P1)

```typescript
// Auth - needed for --to me fix
'auth/users:getCurrentUser'                    // query

// Comments - needed for ltf task comment
'comments/mutations:createComment'             // mutation
'comments/mutations:updateComment'             // mutation
'comments/mutations:deleteComment'             // mutation

// Task operations - missing from current mapping
'tasks/mutations:deleteTask'                   // mutation
'tasks/mutations:moveTask'                     // mutation

// Time tracking - entire module
'timeEntries:startTimer'                       // mutation
'timeEntries:stopTimer'                        // mutation
'timeEntries:createManualEntry'                // mutation
'timeEntries:getActiveTimeEntry'               // query
'timeEntries:getTimeEntriesByUser'             // query
'timeEntries:getTimeEntriesByProject'          // query
'timeEntries:getTimeStatsByUser'               // query

// Search - entire module
'search:globalSearch'                          // query
'search:quickSearch'                           // query

// Sprint lifecycle - missing operations
'sprints/mutations:updateSprint'               // mutation
'sprints/mutations:deleteSprint'               // mutation
'sprints/mutations:removeTaskFromSprint'       // mutation
'sprints/queries:getBacklogTasks'              // query
```

### Should Add (P2)

```typescript
// Teams
'teams:getTeams'                               // query
'teams:createTeam'                             // mutation
'teams:addTeamMember'                          // mutation
'teams:getTeamMembers'                         // query

// Projects - extended CRUD
'projects/mutations:createProject'             // mutation
'projects/mutations:updateProject'             // mutation
'projects/mutations:deleteProject'             // mutation
'projects/mutations:addProjectMember'          // mutation
'projects/mutations:removeProjectMember'       // mutation

// Workspace management
'workspaces/mutations:inviteToWorkspace'       // mutation
'workspaces/mutations:updateMemberRole'        // mutation
'workspaces/mutations:removeMember'            // mutation
'workspaces/queries:getWorkspaceStats'         // query

// Activities
'activities/queries:getProjectActivities'      // query
'activities/queries:getWorkspaceActivities'    // query

// Labels
'tasks/queries:getWorkspaceLabels'             // query

// Custom fields
'customFields:getCustomFields'                 // query
'customFields:setCustomFieldValue'             // mutation

// Filter presets
'filterPresets/queries:getWorkspaceFilterPresets'   // query
'filterPresets/mutations:createFilterPreset'        // mutation
```

### Nice to Have (P3)

```typescript
// Developer profiles
'developers/queries:getMyProfile'              // query
'developers/mutations:updateStatus'            // mutation

// AI credits
'aiCredits/queries:getUserAICredits'           // query
'aiCredits/queries:canMakeAIRequest'           // query
'aiCredits/mutations:saveApiKey'               // mutation

// Audit
'audit:getAuditLogs'                           // query

// Automation
'automation:getWorkflows'                      // query
'automation:triggerWorkflow'                    // action

// GitHub deep
'github/queries:getTaskPullRequests'           // query
'github/queries:getTaskCommits'                // query
```

---

## 9. TUI Dashboard Deep Audit

The TUI is the default experience (`ltf` with no args or `ltf dashboard`). Built with React Ink, it renders a full-screen alternate-buffer terminal app (like vim/htop).

### 9.1 Architecture

```
src/tui/
├── App.tsx              # Main shell: routing, keyboard, auth, resize (300+ LOC)
├── index.tsx            # Entry: alternate screen buffer, ANSI control, TTY check
├── theme.ts             # Grayscale color system (6 levels)
├── types.ts             # Page, Row, Segment, ConnectionStatus types
├── helpers.ts           # Row builders, string utils, layout helpers
├── styles/theme.ts      # Extended theme with box chars, icons, progress
├── pages/
│   ├── Dashboard.tsx    # 769 LOC — Auth, workspace/project selectors, stats
│   ├── Tasks.tsx        # 445 LOC — Task list, create, move, detail view
│   ├── Sprint.tsx       # 297 LOC — Sprint overview, burndown, metrics
│   └── Git.tsx          # 181 LOC — Branch, staged/unstaged, commits
├── components/          # 11 display-only components
│   ├── BorderBox.tsx    # Generic bordered container + fixedWidth/line utils
│   ├── Header.tsx       # Sprint progress, waveform viz, date/clock
│   ├── StatusBar.tsx    # Footer bar (path, email, version)
│   ├── SearchBox.tsx    # BROKEN — display only, onChange never called
│   ├── TasksPanel.tsx   # Task list grouped by status
│   ├── SprintPanel.tsx  # Sprint progress bar + task counts
│   ├── GitPanel.tsx     # Branch, changes, last commit
│   ├── NotePanel.tsx    # Project metadata (hardcoded description)
│   ├── QuickLinks.tsx   # Hardcoded navigation links
│   └── Logo.tsx         # ASCII art "LTF1" branding
└── hooks/
    ├── useAuth.ts       # Auth state polling (5s/30s)
    ├── useConfig.ts     # Workspace/project context polling (10s)
    ├── useConvex.ts     # Generic Convex query hook with polling
    ├── useGitStatus.ts  # Local git status polling (5s)
    ├── useMutations.ts  # Task create/update/move mutations
    └── useParticles.ts  # Animated particle field + X-wing flyby
```

### 9.2 Rendering Pipeline

1. `index.tsx` switches to alternate screen buffer via ANSI escapes
2. Intercepts Ink's full-screen clear, replaces with cursor-home (prevents flicker)
3. `App.tsx` renders all 4 page hooks unconditionally (React rules of hooks)
4. Active page's `Row[]` selected by `view` state
5. Each Row = `{ segments: Segment[], bgColor? }` where Segment = `{ text, color }`
6. Rows rendered top-to-bottom as `<Text>` elements with color props
7. Clock updates every 100ms in top-right corner

### 9.3 Page-by-Page Audit

#### Dashboard (`pages/Dashboard.tsx` — 769 LOC)

**Modes**: Unauthenticated login screen | Workspace selector | Project selector | Normal dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| ASCII world map on login | Working | Only shows if terminal >= 76w x 38h |
| Browser OAuth flow | Working | Opens browser, local callback on :9876 |
| Auth animated dots | Working | 3-frame animation during auth |
| Workspace selector | Working | Arrow nav, Enter select, role/member metadata |
| Project selector | Working | Arrow nav, Enter select, key/status display |
| Particle field animation | Working | 60 particles, left-scrolling, edge fade |
| X-wing flyby easter egg | Working | ASCII ship every 30-40s |
| Breadcrumb navigation | Working | LTF1 > Workspace > Project |
| My Tasks (5 recent) | Working | Fetches from getProjectTasks |
| Sprint progress | Working | From getCurrentSprint |
| Connection indicator | Working | Ready/Connecting/Error/Offline |
| Main menu | Working | Arrow nav to Tasks/Sprint/Git/Quit |
| Create workspace/project | **Missing** | Shows "Create at app.ltf1.com" |
| Search in selectors | **Missing** | No filter/search for workspaces/projects |
| Favorites/pinning | **Missing** | No quick access for frequent projects |

**Keyboard**: `Arrow keys` navigate, `Enter` select, `W` workspace selector, `P` project selector, `T/S/G` page jump, `B` back, `Q` quit

**Data fetched**: `getUserWorkspaces`, `getWorkspaceStats`, `getWorkspaceProjects`, `getProjectTasks`, `getCurrentSprint`

**Mutations**: None. **Dashboard is fully read-only.**

---

#### Tasks (`pages/Tasks.tsx` — 445 LOC)

**Modes**: List | Create | Move | Detail

| Feature | Status | Notes |
|---------|--------|-------|
| Scrollable task list | Working | j/k vim nav, arrow keys |
| Status filtering (6 filters) | Working | `f` cycles: All/Active/Review/ToDo/Backlog/Done |
| Live filter counts | Working | Shows count per filter |
| Progress bar (done/total) | Working | Filled/empty blocks |
| Task creation (title only) | Working | `c` opens inline input |
| Move task status | Working | `m` opens status selector |
| Task detail view | Working | `Enter` shows full info |
| Priority badges | Working | URG/High/Med/Low labels |
| Scroll indicator (X-Y of Z) | Working | Shows when list > visible rows |
| Status grouping | Working | Section headers in "All" view |
| Edit task properties | **Missing** | Can't change title/desc/priority/labels |
| Delete task | **Missing** | No delete action |
| Assign task | **Missing** | No assignee selection |
| Add comment | **Missing** | No comment from TUI |
| Set priority on create | **Missing** | Create only accepts title |
| Filter by priority | **Missing** | Only status filter exists |
| Filter by assignee | **Missing** | — |
| Search within tasks | **Missing** | — |
| Bulk operations | **Missing** | — |
| Time tracking | **Missing** | No timer start/stop |
| Labels UI | **Missing** | — |

**Keyboard**: `j/k` or `arrows` scroll, `f` filter cycle, `c` create, `m` move, `Enter` detail, `Esc` back

**Data fetched**: `getProjectTasks` (10s cache)

**Mutations**: `createTask` (title only), `moveTask` (status change). **Only 2 of ~15 possible mutations exposed.**

---

#### Sprint (`pages/Sprint.tsx` — 297 LOC)

**Entirely read-only. No mutations. No keyboard shortcuts.**

| Feature | Status | Notes |
|---------|--------|-------|
| Sprint name + date range | Working | Short date format |
| Days remaining | Working | Countdown |
| Progress bar | Working | Filled/empty blocks + percentage |
| Task breakdown (3 bars) | Working | Done/InProgress/ToDo with counts |
| Burndown chart (5 points) | Working | Checkpoints: Day 1, 1/4, 1/2, 3/4, current |
| Velocity metric | Working | Total tasks count |
| Burn rate metric | Working | Tasks/day calculation |
| Blockers count | Working | Count of blocked tasks |
| Sprint history (3 past) | Working | Completion status + date range |
| Create sprint | **Missing** | "Start a sprint from the web app" |
| Close/complete sprint | **Missing** | — |
| Add/remove tasks | **Missing** | — |
| Edit goal | **Missing** | — |
| Capacity planning | **Missing** | — |
| Velocity trends | **Missing** | No historical comparison |
| Navigate to task from sprint | **Missing** | Can't drill into task detail |

**Data fetched**: `getCurrentSprint` (15s), `getProjectSprints` (30s), `getProjectTasks` (10s)

---

#### Git (`pages/Git.tsx` — 181 LOC)

**Entirely read-only. No mutations. No keyboard shortcuts.**

| Feature | Status | Notes |
|---------|--------|-------|
| Branch name | Working | Shows HEAD detached state |
| Clean/uncommitted indicator | Working | — |
| Remote info (provider/owner/repo) | Working | Parses GitHub/GitLab URLs |
| Hook install status | Working | Installed/Not installed |
| Staged files (up to 8) | Working | +N more if exceeding |
| Unstaged files (up to 5) | Working | Distinguishes untracked vs modified |
| Recent commits (up to 8) | Working | Short hash + message + relative time |
| Not-a-repo detection | Working | Shows "git init" hint |
| Git commit from TUI | **Missing** | — |
| Git push/pull | **Missing** | — |
| Branch switching | **Missing** | — |
| Diff viewing | **Missing** | — |
| Stash management | **Missing** | — |
| Stage/unstage files | **Missing** | — |
| Link task to branch | **Missing** | — |

**Data fetched**: `useGitStatus` hook (5s poll, local git only)

### 9.4 Cross-Page Summary

| Capability | Dashboard | Tasks | Sprint | Git |
|------------|-----------|-------|--------|-----|
| **Data source** | Convex queries | Convex query | Convex queries | Local git |
| **Mutations** | 0 | 2 (create, move) | 0 | 0 |
| **Keyboard shortcuts** | 8+ keys | 8+ keys (vim) | 0 | 0 |
| **Modes/views** | 4 (login, ws, proj, normal) | 4 (list, create, move, detail) | 1 | 1 |
| **Filtering** | None | Status (6 options) | None | None |
| **Scrolling** | Selector scroll | j/k vim scroll | None | None |
| **Error display** | Partial | Partial | Partial | Complete |
| **Empty states** | Complete | Complete | Complete | Complete |
| **Responsive** | Yes (truncation) | Yes (viewport calc) | Yes | Yes (truncation) |

---

## 10. TUI Component Audit

### 10.1 Component Health Matrix

| Component | LOC | Interactive | Theme-Based | Reusability | Issues |
|-----------|-----|-------------|-------------|-------------|--------|
| **BorderBox** | ~60 | No | Yes | High | None |
| **Header** | ~120 | No | Yes | Medium | Weather/location hardcoded as stubs |
| **StatusBar** | ~40 | No | Yes | High | `availableSpace` computed but unused |
| **SearchBox** | ~45 | **BROKEN** | Yes | Low | `onChange` accepted but never called, no input handling |
| **TasksPanel** | ~80 | No | Partial | Good | Missing priority color coding, uses hardcoded icons instead of theme |
| **SprintPanel** | ~50 | No | Yes | High | None |
| **GitPanel** | ~45 | No | Yes | High | None |
| **NotePanel** | ~40 | No | Partial | Low | Description text hardcoded |
| **QuickLinks** | ~50 | No | Yes | Low | All links hardcoded, no click handlers |
| **Logo** | ~30 | No | Yes | Low | Version hardcoded "v0.1.0" |

### 10.2 Component Bugs

**BUG-TUI-001: SearchBox is non-functional**

**File**: `src/tui/components/SearchBox.tsx`
**Severity**: Medium
**Description**: Component accepts `onChange` callback prop but never invokes it. No `useInput` hook for keyboard handling. Despite the name "SearchBox", it's purely a display component that renders a static text field. Width clamped to max 32 characters.

**Fix**: Add Ink's `useInput` hook when `focused` is true. Call `onChange` on keypress. Handle backspace/delete for editing.

---

**BUG-TUI-002: TasksPanel ignores priority colors**

**File**: `src/tui/components/TasksPanel.tsx`
**Severity**: Low
**Description**: Theme defines `high/medium/low` priority colors but TasksPanel uses `theme.colors.text` for all priority labels. Status icons are hardcoded strings instead of referencing `theme.icons`.

**Fix**: Map `task.priority` to `theme.colors.priority[task.priority]`.

---

**BUG-TUI-003: Header has hardcoded weather/location stubs**

**File**: `src/tui/components/Header.tsx`, lines 115-116
**Severity**: Low
**Description**: Displays "TEMP: 24C, CITY: SYD" as hardcoded strings. These are stub values that were never wired to real data or removed.

**Fix**: Remove weather display entirely or make it configurable.

---

**BUG-TUI-004: NotePanel hardcoded description**

**File**: `src/tui/components/NotePanel.tsx`, lines 24-26
**Severity**: Low
**Description**: Panel description reads "A sleek futuristic HUD themed project dashboard." instead of accepting it as a prop.

**Fix**: Accept `description` as prop, fall back to project description from context.

---

## 11. TUI Hooks & Infrastructure

### 11.1 Hook Inventory

| Hook | Purpose | Polling | Network | State |
|------|---------|---------|---------|-------|
| **useAuth** | Auth state tracking | 5s (near-expiry) / 30s (normal) | No (reads local Conf) | `isAuthenticated`, `token`, `userId`, `email`, `expired`, `needsRefresh`, `sessionId` |
| **useConfig** | Workspace/project context | 10s | No (reads local Conf) | `workspaceId`, `workspaceName`, `projectId`, `projectKey`, `projectName`, `hasContext` |
| **useConvexQuery** | Generic backend query | Configurable (default 10s) | Yes (ConvexHttpClient) | `data<T>`, `loading`, `error`, `connectionStatus` |
| **useGitStatus** | Local git repo status | 5s (when page active) | No (local git) | `isRepo`, `branch`, `commits[]`, `hasChanges`, `stagedFiles[]`, `unstagedFiles[]`, `remoteInfo`, `hooksInstalled` |
| **useMutations** | Task CRUD operations | N/A (on-demand) | Yes (ConvexHttpClient) | `loading`, `error`, methods: `createTask()`, `updateTask()`, `moveTask()` |
| **useParticleField** | Animated background | 100ms render loop | No | `Row[]` (12 rows of particles + X-wing flyby) |

### 11.2 Auth Flow in TUI

```
App mounts
  → useAuth reads local Conf
  → If no token: show login screen (Dashboard unauthenticated mode)
  → User presses Enter: browser opens /cli-auth
  → Callback on :9876 stores token in Conf
  → useAuth detects token on next poll (5s)
  → Dashboard transitions to workspace selector

Token near expiry (within 5min):
  → useAuth.needsRefresh = true, polls every 5s
  → App.tsx useEffect triggers:
    → If sessionId exists: silent refresh via Convex HTTP endpoint
    → If no sessionId or refresh fails: browser login flow
  → On success: auth.refresh() called twice (500ms apart)
```

### 11.3 Data Flow

```
useConvexQuery(queryRef, args, interval)
  → Lazy-init ConvexHttpClient with auth token
  → Poll on interval:
    → Check isAuthenticated()
    → Set auth token on client
    → client.query(queryRef, args)
    → On success: data = result, connectionStatus = 'connected'
    → On auth error: clearAuth(), connectionStatus = 'disconnected'
    → On network error: error = msg, connectionStatus = 'error', retryCount++
  → Args stabilized via JSON.stringify (prevents re-fetch on object equality)
```

### 11.4 Theme System

**Color palette** — Pure grayscale only (6 levels):

| Name | Hex | Usage |
|------|-----|-------|
| BG | `#000000` | Background (absolute black) |
| WHITE | `#ffffff` | Primary text, in_progress status, urgent/high priority |
| LIGHT | `#cccccc` | In_review status, medium priority |
| GRAY | `#888888` | Todo status, low priority, secondary text |
| DIM | `#555555` | Backlog/done status, muted text, separators |
| DARK | `#333333` | Cancelled status, borders, lowest emphasis |

**Status icon mapping**:

| Status | Icon | Color |
|--------|------|-------|
| backlog | `◌` | DIM |
| todo | `○` | GRAY |
| in_progress | `●` | WHITE |
| in_review | `◉` | LIGHT |
| done | `✓` | DIM |
| cancelled | `✕` | DARK |

**Box drawing**: `┌ ─ ┐ │ └ ┘ ├ ┤ ┬ ┴ ┼`
**Progress bar**: `█` filled, `░` empty, `▒` partial
**Waveform chars**: `▁ ▂ ▃ ▄ ▅ ▆ ▇ █`

### 11.5 Rendering Optimizations

1. **Segment chunking**: Particle rows use fixed 8-column chunks to prevent React tree structure changes (which cause Ink flicker)
2. **Cursor-home override**: `index.tsx` replaces Ink's full-screen clear with cursor-home ANSI escape (prevents background flash)
3. **Alternate screen buffer**: Switches to alt buffer on mount, restores on exit (like vim)
4. **Conditional git polling**: `useGitStatus` only fetches when its page is active
5. **Args stabilization**: `useConvexQuery` serializes args to prevent unnecessary refetches

### 11.6 Navigation & Routing

**Page switching**:

| Key | Action | From |
|-----|--------|------|
| `t` or `1` | Go to Tasks | Any page |
| `s` or `2` | Go to Sprint | Any page |
| `g` or `3` | Go to Git | Any page |
| `d` or `Esc` | Go to Dashboard | Tasks/Sprint/Git |
| `w` | Workspace selector | Dashboard |
| `p` | Project selector | Dashboard |
| `b` | Back (proj→ws selector) | Dashboard selectors |
| `q` or `Ctrl+C` | Quit | Any page |

**Minimum terminal size**: 100 columns x 30 rows. Below this, a resize overlay blocks all interaction.

---

## 12. TUI Bugs & Missing Features

### 12.1 TUI Bugs

| ID | Severity | File | Description |
|----|----------|------|-------------|
| TUI-001 | Medium | `components/SearchBox.tsx` | `onChange` prop accepted but never called. No keyboard input handling. Component is display-only despite name. |
| TUI-002 | Medium | `App.tsx` | All 4 page hooks run unconditionally on every render. All polling hooks fetch data for ALL pages simultaneously, even inactive ones. Causes unnecessary network traffic. |
| TUI-003 | Medium | `hooks/useConvex.ts` | `retryCount` incremented on errors but never used. No exponential backoff. Failed queries just retry on next interval. |
| TUI-004 | Medium | `hooks/useMutations.ts` | Doesn't detect auth expiry like `useConvexQuery` does. Stale tokens in mutation client aren't cleared when auth expires. |
| TUI-005 | Low | `components/TasksPanel.tsx` | Priority colors from theme not applied. All priorities render in same `theme.colors.text`. Hardcoded status icons instead of `theme.icons`. |
| TUI-006 | Low | `components/Header.tsx:115-116` | Hardcoded weather stub: "TEMP: 24C, CITY: SYD" — stub data shipped in component. |
| TUI-007 | Low | `components/NotePanel.tsx:24-26` | Description hardcoded: "A sleek futuristic HUD themed project dashboard." Should be a prop. |
| TUI-008 | Low | `components/StatusBar.tsx` | `availableSpace` computed but unused (dead code). |
| TUI-009 | Low | `hooks/useParticles.ts` | Particles ref mutated directly, not cloned. Can cause inconsistent state with concurrent renders. |
| TUI-010 | Low | `App.tsx` | No debouncing on keyboard input. Rapid presses can cause state thrashing. |
| TUI-011 | Low | `components/Logo.tsx` | Version hardcoded as "v0.1.0" instead of reading from package.json. |

### 12.2 TUI Missing Features — What a Terminal-Native Dev Expects

#### Interactions (The Big Gap)

The TUI is **95% read-only**. Only the Tasks page has 2 mutations (create title-only, move status). Everything else is display-only. A terminal-native developer expects to DO things, not just VIEW things.

| Missing Interaction | Page | Backend Ready | Impact |
|---------------------|------|---------------|--------|
| Edit task title/description | Tasks | `updateTask` | High |
| Edit task priority | Tasks | `updateTask` | High |
| Delete task | Tasks | `deleteTask` | High |
| Assign task to user | Tasks | `updateTask` | High |
| Add task comment | Tasks | `createComment` | High |
| Set priority during create | Tasks | `createTask` | Medium |
| Set type during create | Tasks | `createTask` | Medium |
| Start/stop time tracker | Tasks | `startTimer`/`stopTimer` | Medium |
| Create sprint | Sprint | `createSprint` | High |
| Close/complete sprint | Sprint | `updateSprint` | High |
| Add task to sprint | Sprint | `addTasksToSprint` | Medium |
| Remove task from sprint | Sprint | `removeTaskFromSprint` | Medium |
| Navigate sprint → task detail | Sprint | N/A | Medium |
| Git commit from TUI | Git | N/A (local) | Medium |
| Stage/unstage files | Git | N/A (local) | Medium |
| Link task to branch | Git | `updateTask` | Medium |
| Create workspace | Dashboard | `createWorkspace` | Low |
| Create project | Dashboard | `createProject` | Low |

#### Navigation & UX

| Missing Feature | Description | Impact |
|-----------------|-------------|--------|
| Keyboard help screen | `?` or `h` to show all keybindings | High |
| Search across pages | Global search with `/` key | High |
| Notification indicator | Unread count in header/statusbar | High |
| Vim keys on Sprint/Git pages | j/k navigation (only works on Tasks) | Medium |
| Tab between sections | Tab to cycle focus within a page | Medium |
| Mouse support | Click on tasks, scroll with wheel | Medium |
| Breadcrumb in all pages | Currently only Dashboard has breadcrumb | Low |
| Page transition animation | Smooth fade/slide between pages | Low |
| Configurable refresh rates | User sets polling intervals | Low |
| Connection status display | `connectionStatus` exists but never shown | Medium |

#### Data Display

| Missing Feature | Description | Impact |
|-----------------|-------------|--------|
| Task detail in side panel | Split view: list left, detail right | High |
| Sprint tasks list | Show actual tasks in sprint (not just counts) | High |
| Activity feed page | Recent activity across project | Medium |
| Notification page | View/dismiss notifications | Medium |
| Filter by priority | Tasks only filters by status | Medium |
| Filter by assignee | — | Medium |
| Multi-column task view | Status columns like a kanban board | Medium |
| Sort options | Sort by priority/date/assignee | Medium |
| Git diff preview | Show diff of selected file | Low |
| Commit detail view | Show full commit message + files | Low |

---

## 13. Unified MVP Roadmap (TUI-First)

> The TUI is the primary interface. Every feature must be usable from the TUI.
> CLI subcommands serve as the scripting/piping layer and power-user escape hatch.
> Both must ship together — TUI for daily workflow, CLI for automation.

### P0 — Ship Blockers (Fix Before Any Release)

**Bugs that break core flows:**

| # | Item | Where | Files | Effort |
|---|------|-------|-------|--------|
| 1 | Fix SearchBox — wire `useInput`, call `onChange` | TUI | `components/SearchBox.tsx` | S |
| 2 | Only poll active page's data (lazy hooks) | TUI | `App.tsx` | M |
| 3 | Fix mutation client auth sync with query client | TUI | `hooks/useMutations.ts` | S |
| 4 | Remove hardcoded stubs (weather, description, version) | TUI | `Header.tsx`, `NotePanel.tsx`, `Logo.tsx` | S |
| 5 | Fix `ltf git sync` — wire to backend sync actions | CLI | `commands/git/sync.ts`, `lib/convex.ts` | M |
| 6 | Fix `ltf git link` — persist PR/branch via task update | CLI | `commands/git/link.ts` | S |
| 7 | Fix `ltf task assign --to me` — add getCurrentUser | Both | `commands/task/assign.ts`, `lib/convex.ts` | S |
| 8 | Fix git hook error handling — log errors, don't swallow | CLI | `commands/git/hook-handler.ts` | S |
| 9 | Fix `validateAuth()` — verify token against backend | Both | `lib/convex.ts` | S |
| 10 | Add keyboard help screen (`?` key) | TUI | `App.tsx`, new `Help` component | S |
| 11 | Display connection status in StatusBar | TUI | `components/StatusBar.tsx`, `App.tsx` | S |

### P1 — Core MVP (What Makes It a Linear Competitor)

**Tasks page — make it interactive (currently 95% read-only):**

| # | Item | Where | Files | Effort |
|---|------|-------|-------|--------|
| 12 | Task create wizard (title + type + priority + description) | TUI + CLI | `pages/Tasks.tsx`, `commands/task/create.ts` | M |
| 13 | Edit task properties (inline edit mode: title, desc, priority, type) | TUI + CLI | `pages/Tasks.tsx`, `hooks/useMutations.ts` | M |
| 14 | Delete task (with `d` key + confirmation prompt) | TUI + CLI | `pages/Tasks.tsx`, new `commands/task/delete.ts` | S |
| 15 | Assign task to user (member picker in TUI, `--to` in CLI) | TUI + CLI | `pages/Tasks.tsx`, `commands/task/assign.ts` | M |
| 16 | Add comment to task (inline input in detail view) | TUI + CLI | `pages/Tasks.tsx`, new `commands/task/comment.ts`, `lib/convex.ts` | M |
| 17 | Task search / filter (wire SearchBox, filter by priority + assignee) | TUI + CLI | `pages/Tasks.tsx`, `components/SearchBox.tsx`, new `commands/search/` | M |
| 18 | `ltf task mine` — quick view my assigned tasks | TUI + CLI | `pages/Tasks.tsx`, `commands/task/index.ts` | S |

**Sprint page — make it interactive (currently fully read-only):**

| # | Item | Where | Files | Effort |
|---|------|-------|-------|--------|
| 19 | Create sprint from TUI (`c` key) + CLI `ltf sprint create` | TUI + CLI | `pages/Sprint.tsx`, `hooks/useMutations.ts` | M |
| 20 | Close/complete sprint (`Enter` on active sprint) | TUI + CLI | `pages/Sprint.tsx`, new sprint CLI subcommands | S |
| 21 | Sprint tasks list (show actual tasks, not just counts) | TUI | `pages/Sprint.tsx` | M |
| 22 | Sprint → task navigation (Enter on task drills into detail) | TUI | `pages/Sprint.tsx` | M |
| 23 | Add/remove tasks from sprint | TUI + CLI | `pages/Sprint.tsx`, new `commands/sprint/remove.ts` | M |
| 24 | Sprint backlog view | TUI + CLI | `pages/Sprint.tsx`, new `commands/sprint/backlog.ts` | S |
| 25 | Vim keybindings (j/k) on Sprint page | TUI | `pages/Sprint.tsx` | S |

**Git page — make it interactive (currently fully read-only):**

| # | Item | Where | Files | Effort |
|---|------|-------|-------|--------|
| 26 | Stage/unstage files (space to toggle) | TUI | `pages/Git.tsx` | M |
| 27 | Git commit with message input (`c` key opens input) | TUI | `pages/Git.tsx` | M |
| 28 | Link task to current branch | TUI + CLI | `pages/Git.tsx`, `commands/git/link.ts` | S |
| 29 | Vim keybindings (j/k) on Git page | TUI | `pages/Git.tsx` | S |

**Time tracking — new page/section (backend fully built):**

| # | Item | Where | Files | Effort |
|---|------|-------|-------|--------|
| 30 | Start/stop/pause timer on selected task (`T` key) | TUI + CLI | `pages/Tasks.tsx`, new `commands/time/`, `lib/convex.ts` | L |
| 31 | Active timer indicator in header/statusbar | TUI | `components/Header.tsx` or `StatusBar.tsx` | S |
| 32 | Time log / manual entry | CLI | New `commands/time/log.ts` | M |
| 33 | Time report (my hours this week/sprint) | TUI + CLI | New section in Dashboard or Sprint page | M |

**Search & notifications — new capabilities:**

| # | Item | Where | Files | Effort |
|---|------|-------|-------|--------|
| 34 | Global search with `/` key across all pages | TUI + CLI | `App.tsx`, new search overlay, `lib/convex.ts` | L |
| 35 | Notification indicator in header (unread count) | TUI | `components/Header.tsx`, `lib/convex.ts` | M |
| 36 | Notifications page (new TUI page, `n` key) | TUI + CLI | New `pages/Notifications.tsx`, new `commands/notifications/` | L |

**CLI scripting layer (non-TUI commands):**

| # | Item | Where | Effort |
|---|------|-------|--------|
| 37 | Shell completions (bash/zsh/fish) | CLI | M |
| 38 | Command aliases (`t`, `s`, `p`, `d`, `n`) | CLI | S |
| 39 | `ltf config set/get/list` | CLI | S |
| 40 | Consistent `--json` output across all commands | CLI | M |

### P2 — Competitive Parity

| # | Item | Where | Effort |
|---|------|-------|--------|
| 41 | Dashboard: create workspace/project from TUI | TUI + CLI | M |
| 42 | `ltf workspace list/select/invite/members/stats` | CLI (+ TUI workspace page) | L |
| 43 | `ltf project create/update/members/invite` | CLI (+ TUI project settings) | M |
| 44 | `ltf team list/create/members` | CLI | M |
| 45 | `ltf label list/create` + label picker in TUI task edit | TUI + CLI | M |
| 46 | Subtask creation in TUI detail view + `ltf task subtask` | TUI + CLI | M |
| 47 | Bulk operations: multi-select in TUI (`x` to mark, bulk move/delete) | TUI + CLI | L |
| 48 | Task detail side panel (split view: list left, detail right) | TUI | L |
| 49 | Sort options in TUI (priority/date/assignee/type) | TUI | M |
| 50 | `--ids-only`, `--quiet`, `--no-header` flags | CLI | M |
| 51 | `ltf version` + update checker | CLI | S |
| 52 | Usage examples in help text | CLI | M |
| 53 | Activity feed page in TUI | TUI + CLI | M |

### P3 — Power User Features

| # | Item | Where | Effort |
|---|------|-------|--------|
| 54 | Kanban board view in TUI (multi-column by status) | TUI | L |
| 55 | Git diff preview in TUI | TUI | L |
| 56 | Git push/pull from TUI | TUI | M |
| 57 | Mouse support (click tasks, scroll wheel) | TUI | M |
| 58 | Tab focus cycling between page sections | TUI | M |
| 59 | `ltf workflow list/create/trigger` automation | CLI | L |
| 60 | `ltf github status/prs/issues` deep integration | CLI | L |
| 61 | `ltf report sprint/project/time` reporting | CLI + TUI | L |
| 62 | `ltf developer profile/status` presence | CLI + TUI | M |
| 63 | Filter presets (save/load named filters) | TUI + CLI | M |
| 64 | Custom fields UI in TUI task detail | TUI + CLI | M |
| 65 | Configurable color themes (beyond grayscale) | TUI | M |
| 66 | Configurable polling intervals | TUI + CLI config | S |
| 67 | Offline caching with background sync | Both | XL |
| 68 | `ltf audit` view audit logs | CLI | M |
| 69 | GitLab integration | CLI | L |
| 70 | Slack integration | CLI | L |
| 71 | Page transition animations | TUI | S |

### Effort Summary

| Priority | Items | Total Effort |
|----------|-------|-------------|
| **P0** (Ship Blockers) | 11 | ~12 hrs |
| **P1** (Core MVP) | 29 | ~70 hrs |
| **P2** (Competitive Parity) | 13 | ~50 hrs |
| **P3** (Power User) | 18 | ~80 hrs |

**Effort Scale**: S = <2hr, M = 2-6hr, L = 6-16hr, XL = 16+hr

---

## 14. File Reference Index

Quick reference for finding implementations:

### Entry & Config

| File | Purpose |
|------|---------|
| `src/bin/ltf.ts` | CLI entry point, command registration, global flags |
| `src/lib/config.ts` | Persistent config (auth, context, preferences, daemon) |
| `src/lib/convex.ts` | Convex client, API references, auth validation |
| `src/lib/auth.ts` | OAuth flow, token refresh, browser callback server |
| `src/lib/output.ts` | Terminal formatting (colors, tables, spinners, progress) |
| `src/lib/git.ts` | Git operations (branch parsing, hook install, commits) |
| `src/lib/errors.ts` | Error handling utilities |

### Commands

| File | Command | Notes |
|------|---------|-------|
| `src/commands/auth/login.ts` | `ltf auth login` | Browser OAuth + `--token` flag |
| `src/commands/auth/logout.ts` | `ltf auth logout` | Clears config |
| `src/commands/auth/status.ts` | `ltf auth status` | Shows email, type, expiry |
| `src/commands/task/create.ts` | `ltf task create <title>` | Full options: type, priority, labels, estimate, due |
| `src/commands/task/list.ts` | `ltf task list` | Filters: status, priority, assignee, type |
| `src/commands/task/view.ts` | `ltf task view <id>` | Full detail + subtasks, comments, activity |
| `src/commands/task/update.ts` | `ltf task update <id>` | Status, priority, type, description, labels |
| `src/commands/task/done.ts` | `ltf task done <id>` | Quick mark complete |
| `src/commands/task/assign.ts` | `ltf task assign <id>` | `--to <user>` or `--to me` (BROKEN) |
| `src/commands/sprint/list.ts` | `ltf sprint list` | Filter by status |
| `src/commands/sprint/status.ts` | `ltf sprint status` | Progress bar, burndown, metrics |
| `src/commands/sprint/create.ts` | `ltf sprint create <name>` | Start/end dates, goal |
| `src/commands/sprint/add.ts` | `ltf sprint add <task>` | Add task to current/specific sprint |
| `src/commands/project/list.ts` | `ltf project list` | List workspace projects |
| `src/commands/project/select.ts` | `ltf project select [key]` | Interactive selection |
| `src/commands/project/info.ts` | `ltf project info` | Current project details |
| `src/commands/project/detect.ts` | `ltf project detect` | Auto-detect from git remote |
| `src/commands/ai/suggest.ts` | `ltf ai suggest` | Commit analysis + AI/local fallback |
| `src/commands/ai/analyze.ts` | `ltf ai analyze` | Sprint health AI analysis |
| `src/commands/ai/describe.ts` | `ltf ai describe <brief>` | Generate task details from description |
| `src/commands/git/link.ts` | `ltf git link` | Link branch/PR to task (BROKEN) |
| `src/commands/git/sync.ts` | `ltf git sync` | Sync GitHub data (NON-FUNCTIONAL) |
| `src/commands/git/hooks.ts` | `ltf git hooks install/uninstall` | Git hook management |
| `src/commands/git/status.ts` | `ltf git status` | Integration status |
| `src/commands/git/hook-handler.ts` | `ltf git hook <type>` | Internal hook handler (SILENT ERRORS) |
| `src/commands/daemon/start.ts` | `ltf daemon start` | Background watcher |
| `src/commands/daemon/stop.ts` | `ltf daemon stop` | Kill by PID |
| `src/commands/daemon/status.ts` | `ltf daemon status` | Running/stopped, PID, uptime |
| `src/commands/daemon/logs.ts` | `ltf daemon logs` | View/follow daemon logs |

### TUI Dashboard

| File | Purpose |
|------|---------|
| `src/tui/App.tsx` | Main TUI app, page routing |
| `src/tui/pages/Dashboard.tsx` | Welcome, project select, stats (768 LOC) |
| `src/tui/pages/Tasks.tsx` | Task list, filtering, keyboard nav (444 LOC) |
| `src/tui/pages/Sprint.tsx` | Sprint overview, burndown (296 LOC) |
| `src/tui/pages/Git.tsx` | Branch, commits, PRs, hooks (180 LOC) |
| `src/tui/theme.ts` | Terminal color scheme |
| `src/tui/types.ts` | Shared type definitions |
| `src/tui/hooks/useAuth.ts` | Auth state hook |
| `src/tui/hooks/useConfig.ts` | Config access hook |
| `src/tui/hooks/useConvex.ts` | Backend client hook |
| `src/tui/hooks/useGitStatus.ts` | Git status hook |
| `src/tui/hooks/useMutations.ts` | Task mutation hook |
| `src/tui/hooks/useParticles.ts` | Terminal particle effects |

### Tests

| File | Coverage |
|------|----------|
| `src/lib/__tests__/auth.test.ts` | Token validation, JWT, login, expiry (189 LOC) |
| `src/lib/__tests__/config.test.ts` | Config CRUD |
| `src/lib/__tests__/errors.test.ts` | Error handling |
| `src/lib/__tests__/git.test.ts` | Branch/commit parsing |

---

## Appendix: Backend Table Reference

53 tables in `convex/schema.ts`:

**Core**: `users`, `workspaces`, `workspaceMembers`, `workspaceInvitations`, `teams`, `teamMembers`

**Project Management**: `projects`, `projectMembers`, `projectInvitations`, `tasks`, `sprints`, `comments`, `attachments`

**Communication**: `meetings`, `chatChannels`, `chatMessages`, `chatTypingIndicators`, `chatNotificationSettings`, `standups`

**GitHub** (13): `githubOAuthStates`, `githubConnections`, `githubInstallations`, `githubRepositories`, `githubWebhookEvents`, `githubActivities`, `githubCommits`, `githubPullRequests`, `githubIssues`, `githubUserMappings`, `workspaceGitHubInstallations`, `githubTeamMappings`, `githubIssueSyncQueue`, `githubRateLimits`, `githubOperationLogs`

**GitLab** (4): `gitlabOAuthStates`, `gitlabIntegrations`, `gitlabProjects`, `gitlabMergeRequests`

**Slack** (6): `slackIntegrations`, `slackChannels`, `slackUserMappings`, `slackEvents`, `slackFiles`, `slackTaskLinks`

**AI** (7): `aiTasks`, `aiSessions`, `aiInsights`, `aiCredits`, `userAICredits`, `aiUsageLogs`, `aiPricingTiers`

**Advanced**: `filterPresets`, `customFieldDefinitions`, `customFieldValues`, `workflows`, `workflowRuns`, `videoRooms`, `whiteboards`, `whiteboardSnapshots`, `timeEntries`, `developerProfiles`, `expertiseSearchIndex`, `auditLogs`

**Comms Hub**: `commsMessages`, `commsChannels`, `commsReplies`

**External Stubs**: `discordIntegrations`, `discordChannelMappings`, `jiraIntegrations`, `jiraProjectMappings`

**Other**: `notifications`, `feedback`, `npsSurveys`, `newsletter`, `wishlist`, `activities`, `webhookEvents`
