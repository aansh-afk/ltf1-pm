# TUI V2 Vision -- ltf1-pm

## Why V2

The current TUI shipped fast and works. It has 7 pages, keyboard navigation, real-time data, and git integration. But it was built with constraints that now limit where the product can go.

### Current Limitations

**Plain Text Rendering**: Pages return `Row[]` / `Segment[]` arrays -- flat lines of colored text rendered sequentially. There are no borders, panels, or structured layout. The result looks like a word document piped to a terminal, not a modern TUI application. Every page is a vertical list of text lines.

**Grayscale Only**: The color palette is #000000 background with WHITE, LIGHT (#CCCCCC), GRAY (#888888), DIM (#555555), and DARK (#333333). No accent colors. No semantic coloring (green for success, red for error, amber for warning). The web app has a rich identity built around #6366F1 indigo -- the TUI has none of that personality.

**No Visual Structure**: Without panels, boxes, or columns, there is no visual hierarchy beyond bold text and indentation. Dashboard stats, task lists, sprint progress, and git status all render as flat text blocks separated by blank lines. Users cannot scan the screen and orient themselves the way they can in LazyGit or k9s.

**Auth Does Not Persist Reliably**: Login tokens expire and are not refreshed between sessions. Users re-authenticate frequently. The `sessionId`-based silent refresh exists but has edge cases where it fails silently.

**Missing Pages**: No Agent page (triage, suggestions), no Skills page (browse, toggle, run), no Projects page (multi-project management), no Settings page (preferences, triage mode, auto-update). These are core to the agent-first vision.

**No Agent Integration**: The TUI cannot interact with the agent layer. There is no triage flow, no skill execution, no way for developers to review and approve agent actions from the terminal. This is the gap that Linear Next exploits -- they have agents in the browser, and we have no agents in the terminal.

---

## Technology Decision: Keep TypeScript + Ink

### Alternatives Considered

**Go + Bubble Tea**: The gold standard for terminal UIs. OpenCode (AI coding assistant), LazyGit (git management), and k9s (Kubernetes management) all use it. Bubble Tea provides a mature component model, 60fps rendering, and single-binary distribution via `go build`. The ecosystem includes Lipgloss (styling), Bubbles (reusable components), and Huh (forms).

**Rust + Ratatui**: High-performance terminal rendering used by tools like gitui and bottom. Extremely fast, low memory footprint, single-binary distribution. Steep learning curve, smaller ecosystem for TUI components.

### Why We Stayed with TypeScript + Ink

| Factor | TypeScript + Ink | Go + Bubble Tea | Rust + Ratatui |
|--------|-----------------|-----------------|----------------|
| **Language match** | Same as web app | Different language | Different language |
| **Convex SDK** | Works natively | Would need HTTP wrapper | Would need HTTP wrapper |
| **Clerk auth** | Works natively (JS SDK) | Manual OAuth implementation | Manual OAuth implementation |
| **npm distribution** | Already set up | Needs new release pipeline | Needs new release pipeline |
| **Team knowledge** | Full proficiency | Learning curve | Steep learning curve |
| **Rewrite cost** | Zero (incremental) | 3-6 months full rewrite | 4-8 months full rewrite |
| **Component maturity** | Moderate (Ink 5.x) | Excellent (Bubble Tea 1.x) | Excellent (Ratatui 0.28+) |
| **Rendering perf** | Adequate (React reconciler) | Excellent (custom renderer) | Excellent (immediate mode) |

**What we gained**: No rewrite of backend integration, authentication, CLI commands, data hooks, or mutation logic. The entire `useAuth`, `useConvexQuery`, `useMutations`, `useGitStatus` hook system carries forward. Commander.js CLI commands remain untouched.

**What we sacrificed**: Slightly less performant rendering than Go or Rust (React reconciler overhead). Less mature TUI framework (Ink 5.x vs Bubble Tea 1.x). No single-binary distribution (requires Node.js runtime).

**Future consideration**: If v2 hits performance walls (>100ms render cycles, >200MB memory) or if single-binary distribution becomes a business requirement, Go + Bubble Tea is the v3.0 path. The architecture below is designed so the data layer (Convex queries, auth) could be extracted into an HTTP API that a Go frontend consumes.

---

## Design Language

### Color Palette

The TUI v2 adopts the web app's color system, adapted for terminal rendering.

**Backgrounds (3-tier)**:
| Layer | Hex | Usage |
|-------|-----|-------|
| Base | `#050505` | Terminal background, empty space |
| Surface | `#0A0A0A` | Panel backgrounds, content areas |
| Card | `#111111` | Active panels, selected items, modals |

**Text**:
| Level | Hex | Usage |
|-------|-----|-------|
| Primary | `#F9FAFB` | Active content, headers, selected items |
| Secondary | `#9CA3AF` | Labels, metadata, inactive items |
| Tertiary | `#6B7280` | Hints, timestamps, disabled text |

**Accent**:
| Color | Hex | Usage |
|-------|-----|-------|
| Indigo | `#6366F1` | Active page indicator, selected borders, primary actions |
| Indigo hover | `#4F46E5` | Focused interactive elements |

**Semantic**:
| Color | Hex | Usage |
|-------|-----|-------|
| Green | `#22C55E` | Success, done, connected, positive deltas |
| Red | `#EF4444` | Error, urgent, disconnected, negative deltas |
| Amber | `#F59E0B` | Warning, high priority, pending actions |
| Purple | `#8B5CF6` | Agent actions, AI-generated content |
| Cyan | `#06B6D4` | Links, references, informational highlights |

### Panel-Based Layout

V2 replaces flat `Row[]` rendering with Ink `<Box>` components using `borderStyle="round"`.

```
+---------------------------------------------------------------+
| LTF1  Dashboard   Tasks   Sprint   Agent   Git   ...   ? Help |  <- Header
+---------------------------------------------------------------+
|            |                                                   |
|  Dashboard |  Sprint: Week 12                                  |
|  > Tasks   |  +-----------------------------------------+      |
|    Sprint  |  | Progress  72%  ████████████░░░░  18/25  |      |
|    Agent   |  +-----------------------------------------+      |
|    Skills  |                                                   |
|    Git     |  My Tasks                                         |
|    Projects|  +-----------------------------------------+      |
|    Search  |  | ● PROJ-42  Fix auth token refresh   P1  |      |
|    Notifs  |  | ○ PROJ-45  Add agent triage page    P2  |      |
|    Settings|  | ◌ PROJ-48  Update CLI docs          P3  |      |
|            |  +-----------------------------------------+      |
|            |                                                   |
+---------------------------------------------------------------+
| t:Tasks  s:Sprint  a:Agent  k:Skills  g:Git  /:Search  ?:Help |  <- StatusBar
+---------------------------------------------------------------+
```

**Layout Structure**: Header (1 row) + Sidebar (left column, 12-14 chars) + Content (remaining width) + StatusBar (1 row).

### Typography

| Style | Ink Prop | Usage |
|-------|----------|-------|
| Bold | `bold` | Page titles, section headers, active nav items |
| Dim | `dimColor` | Timestamps, metadata, inactive items |
| Colored | `color={hex}` | Status indicators, priority badges, accents |
| Inverse | `inverse` | Selected items in lists, active tab |
| Underline | `underline` | Links, actionable text |

### Icons

**Status Icons** (Unicode):
| Icon | Meaning |
|------|---------|
| `●` | Active / in progress / connected |
| `○` | Todo / pending / idle |
| `◌` | Backlog / queued |
| `✓` | Done / success / approved |
| `✕` | Cancelled / error / rejected |
| `◉` | In review / needs attention |
| `⟳` | Syncing / refreshing |
| `▶` | Running / executing |

**Page Icons**:
| Icon | Page |
|------|------|
| `■` | Dashboard |
| `☰` | Tasks |
| `⏱` | Sprint |
| `◆` | Agent |
| `⚡` | Skills |
| `⌥` | Git |
| `📁` | Projects |
| `🔍` | Search |
| `🔔` | Notifications |
| `⚙` | Settings |
| `?` | Help |

### Mouse Support

V2 adds optional mouse support via `@zenobius/ink-mouse` (already in dependencies). Clickable elements: sidebar navigation items, tab headers, list items, buttons. Mouse does not replace keyboard -- it supplements it.

---

## Architecture

### Component Hierarchy

```
App
├── Header
│   ├── Logo ("LTF1")
│   ├── TabBar (page tabs with active indicator)
│   ├── ConnectionStatus (●/○/✕ + Convex status)
│   └── UserBadge (avatar initial + name)
├── Sidebar
│   ├── NavItem[] (11 pages with icons and shortcuts)
│   ├── ActiveIndicator (indigo bar on selected page)
│   └── CollapseToggle (minimize sidebar to icons only)
├── PageRouter
│   ├── DashboardPage
│   ├── TasksPage
│   ├── SprintPage
│   ├── AgentPage        (NEW)
│   ├── SkillsPage       (NEW)
│   ├── GitPage
│   ├── ProjectsPage     (NEW)
│   ├── SearchPage
│   ├── NotificationsPage
│   ├── SettingsPage     (NEW)
│   └── HelpPage
└── StatusBar
    ├── ShortcutHints (context-sensitive key hints)
    ├── BreadcrumbPath (Workspace > Project > Page)
    └── Clock / DataFreshness ("Updated 5s ago")
```

### Pages (11 Total)

| # | Page | Shortcut | Status | Description |
|---|------|----------|--------|-------------|
| 1 | Dashboard | `d` / `1` | Existing (redesign) | Sprint summary, my tasks, workspace stats |
| 2 | Tasks | `t` / `2` | Existing (redesign) | Task list, create, edit, filter, search |
| 3 | Sprint | `s` / `3` | Existing (redesign) | Sprint management, backlog, velocity |
| 4 | Agent | `a` / `4` | **New** | Triage queue, agent actions, suggestions |
| 5 | Skills | `k` / `5` | **New** | Browse, toggle, run workspace skills |
| 6 | Git | `g` / `6` | Existing (redesign) | Staging, commits, branch linking |
| 7 | Projects | `p` / `7` | **New** | Project selection, multi-project management |
| 8 | Search | `/` / `8` | Existing (redesign) | Global search across all entities |
| 9 | Notifications | `n` / `9` | Existing (redesign) | Notification inbox with read/unread |
| 10 | Settings | `,` / `0` | **New** | Preferences, triage mode, auto-update config |
| 11 | Help | `?` | Existing (redesign) | Keyboard reference, command help |

### Navigation

**Global shortcuts** apply everywhere. **Page shortcuts** are active only on the dashboard or when no modal/input is focused.

**Keyboard**: Single-key shortcuts for page switching (see table above). `j`/`k` or arrow keys for list navigation. `Enter` to select/confirm. `Esc` to go back. `q` or `Ctrl+C` to exit.

**Mouse**: Click sidebar items or tab headers to navigate. Click list items to select. Scroll to navigate long lists (where terminal supports it).

### State Management

React hooks, same pattern as v1 but expanded:

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state, token refresh, session persistence |
| `useConvex` | ConvexHttpClient wrapper, polling, connection status |
| `useConfig` | Local config read/write (workspace, project, preferences) |
| `useNavigation` | Page routing, history, breadcrumbs |
| `useKeyboard` | Global and page-specific key bindings |
| `useMouse` | Mouse event handling via @zenobius/ink-mouse |
| `useTheme` | Color palette and styling tokens |

### Data Layer

Polling via `ConvexHttpClient` continues in v2. Each page configures its own polling interval based on data freshness requirements:

| Page | Polling Interval | Data |
|------|-----------------|------|
| Dashboard | 10s | Sprint stats, my tasks, workspace stats |
| Tasks | 10s | Task list for current project |
| Sprint | 15s | Sprint details, task assignments |
| Agent | 5s | Triage queue, agent actions (needs freshness) |
| Skills | 30s | Skill definitions (rarely change) |
| Git | 5s | Local git status (via simple-git) |
| Projects | 30s | Project list (rarely changes) |
| Search | On demand | Search results (triggered by input) |
| Notifications | 10s | Notification count and list |
| Settings | On demand | Local config (no polling needed) |

---

## New Features

### Agent Triage Page

The core of the agent-first TUI. An inbox-zero flow for reviewing AI agent suggestions.

**Layout**:
```
Agent Triage                                        12 pending
+---------------------------------------------------+
| ◆ Triage: Categorize PROJ-89 as "bug"       [a/r] |
|   Agent confidence: 92%                             |
|   Reasoning: Stack trace in description,            |
|   error keyword match, linked to crash report       |
+---------------------------------------------------+
| ◆ Assign: PROJ-91 → @sarah (skills match)   [a/r] |
| ◆ Priority: PROJ-92 → High (blocking sprint) [a/r] |
| ◆ Sprint: Add PROJ-88 to Sprint 12          [a/r] |
+---------------------------------------------------+
```

**Keys**: `a` accept, `r` reject, `m` modify before accepting, `Enter` expand details, `j`/`k` navigate queue.

**Modes**: queue (list view), detail (expanded single suggestion), history (past decisions).

### Skills Page

Browse and execute workspace skills -- codified team workflows.

**Layout**:
```
Skills                                    8 available
+---------------------------------------------------+
| ⚡ bug-triage         Auto-categorize, assign,     |
|                        notify Slack              ON |
| ⚡ deploy-checklist    Create verification tasks OFF |
| ⚡ sprint-plan         AI sprint suggestion     ON  |
| ⚡ pr-review           Auto-review PRs          ON  |
+---------------------------------------------------+
```

**Keys**: `Enter` run skill, `Space` toggle on/off, `i` info/details, `c` create new skill.

### Projects Page

Multi-project management and git-to-project linking.

**Layout**:
```
Projects                                  Workspace: LTF1
+---------------------------------------------------+
| ● iceberg-L       Active  12 tasks   Sprint 12    |
|   iceberg-M       Idle     8 tasks   No sprint    |
|   iceberg-S       Active   4 tasks   Sprint 3     |
+---------------------------------------------------+
  Git: main branch detected → iceberg-L (auto-linked)
```

**Keys**: `Enter` switch to project, `l` link to current git repo, `u` unlink, `n` new project.

### Settings Page

Preferences and configuration without leaving the TUI.

**Sections**:
- **General**: Default view (dashboard/tasks), color theme, compact mode
- **Agent**: Triage mode (manual/auto-accept/auto-with-review), confidence threshold
- **Notifications**: Desktop notifications, notification polling interval
- **Updates**: Auto-update check on launch, update channel (stable/beta)
- **Data**: Polling intervals, cache duration
- **Auth**: Current session info, logout button

**Keys**: `Tab` switch sections, `Enter` edit value, `Space` toggle booleans, arrow keys for numeric values.

### Git Local-to-Web Linking

Automatic detection and linking of local git repositories to LTF1 projects.

**Flow**:
1. On TUI launch, detect current directory's git remote URL
2. Match remote URL against workspace project git URLs
3. If match found: auto-link with user confirmation ("Link this repo to iceberg-L? [Y/n]")
4. If no match: offer to link manually from project list
5. Store linking in local config for future sessions

**Benefit**: `ltf` automatically knows which project you are working on based on your `pwd`. No manual project selection needed.

### Auto-Update

Version checking and update prompting on TUI launch.

**Flow**:
1. On launch, compare local version against npm registry latest
2. If update available: show banner ("Update available: 0.1.0-beta.3 -> 0.1.0-beta.4")
3. User can: update now (`u`), dismiss (`Esc`), or disable checks in Settings
4. Update runs `npm install -g @vvg-ltf1/cli@latest` in background

**Silent mode**: If configured in Settings, auto-update without prompting (downloads in background, applies on next launch).

### Auth Persistence Fix

Reliable token persistence between sessions.

**Changes**:
- Store refresh token alongside JWT in local config
- On launch, attempt silent refresh via `sessionId` before prompting re-auth
- If silent refresh fails, attempt refresh token exchange
- Only prompt browser OAuth as last resort
- Clear, specific error messages for each failure mode ("Session expired -- refreshing..." vs "Token invalid -- please re-authenticate")

---

## Keyboard Shortcut Reference

### Global (Available Everywhere)

| Key | Action |
|-----|--------|
| `q` / `Ctrl+C` | Exit TUI |
| `Esc` | Go back / close modal / cancel input |
| `d` / `1` | Dashboard |
| `t` / `2` | Tasks |
| `s` / `3` | Sprint |
| `a` / `4` | Agent |
| `k` / `5` | Skills |
| `g` / `6` | Git |
| `p` / `7` | Projects |
| `/` / `8` | Search |
| `n` / `9` | Notifications |
| `,` / `0` | Settings |
| `?` | Help |
| `w` | Workspace selector |
| `Tab` | Cycle focus (sidebar -> content -> statusbar) |
| `Ctrl+R` | Force refresh current page data |

### Dashboard

| Key | Action |
|-----|--------|
| `Enter` | Open selected item in detail |
| `j` / `↓` | Navigate down in my tasks list |
| `k` / `↑` | Navigate up in my tasks list |
| `r` | Refresh all dashboard data |

### Tasks

| Key | Action |
|-----|--------|
| `j` / `↓` | Move down in task list |
| `k` / `↑` | Move up in task list |
| `Enter` | View task detail |
| `c` | Create new task |
| `e` | Edit selected task |
| `d` | Delete selected task (with confirmation) |
| `m` | Move task (change status) |
| `a` | Assign task to user |
| `x` | Add comment to task |
| `f` | Cycle status filter |
| `F` | Open filter menu (multi-criteria) |
| `Space` | Toggle "My Tasks" filter |
| `[` / `]` | Previous / next page (pagination) |

### Sprint

| Key | Action |
|-----|--------|
| `c` | Create new sprint |
| `b` | View backlog |
| `Enter` | Select sprint / expand details |
| `+` | Add task to sprint |
| `-` | Remove task from sprint |
| `j` / `↓` | Navigate down |
| `k` / `↑` | Navigate up |
| `x` | Close sprint (with confirmation) |

### Agent

| Key | Action |
|-----|--------|
| `a` | Accept suggestion |
| `r` | Reject suggestion |
| `m` | Modify before accepting |
| `Enter` | Expand suggestion details |
| `j` / `↓` | Next suggestion |
| `k` / `↑` | Previous suggestion |
| `h` | View triage history |
| `Tab` | Switch between queue / history views |

### Skills

| Key | Action |
|-----|--------|
| `Enter` | Run selected skill |
| `Space` | Toggle skill on/off |
| `i` | View skill info and details |
| `c` | Create new skill |
| `j` / `↓` | Navigate down |
| `k` / `↑` | Navigate up |

### Git

| Key | Action |
|-----|--------|
| `Space` | Toggle stage/unstage file |
| `a` | Stage all files |
| `u` | Unstage all files |
| `c` | Commit (opens message input) |
| `l` | Link current branch to task |
| `r` | Refresh git status |
| `j` / `↓` | Navigate down |
| `k` / `↑` | Navigate up |
| `d` | View diff of selected file |
| `Tab` | Switch between staged/unstaged panels |

### Projects

| Key | Action |
|-----|--------|
| `Enter` | Switch to selected project |
| `l` | Link project to current git repo |
| `u` | Unlink project from git repo |
| `n` | Create new project |
| `j` / `↓` | Navigate down |
| `k` / `↑` | Navigate up |

### Search

| Key | Action |
|-----|--------|
| Any text | Type to search (auto-focus on input) |
| `Enter` | Open selected result |
| `j` / `↓` | Navigate results down |
| `k` / `↑` | Navigate results up |
| `Tab` | Cycle result type filter (all/tasks/sprints/projects) |
| `Esc` | Clear search and return |

### Notifications

| Key | Action |
|-----|--------|
| `Enter` | Open notification source |
| `r` | Mark as read |
| `R` | Mark all as read |
| `j` / `↓` | Navigate down |
| `k` / `↑` | Navigate up |

### Settings

| Key | Action |
|-----|--------|
| `Tab` | Switch between sections |
| `Enter` | Edit selected setting |
| `Space` | Toggle boolean settings |
| `←` / `→` | Adjust numeric values |
| `j` / `↓` | Navigate down |
| `k` / `↑` | Navigate up |

---

## Design Comparisons

### vs OpenCode (Go + Bubble Tea)

OpenCode is an AI coding assistant TUI -- a chat interface with file context, model selection, and diff preview. Built with Bubble Tea, custom 60fps renderer, and a polished component library.

| Aspect | OpenCode | LTF1 TUI V2 |
|--------|----------|--------------|
| **Purpose** | AI chat in terminal | Project management in terminal |
| **Architecture** | Chat-centric (input -> response -> diff) | Dashboard-centric (pages, panels, lists) |
| **AI Integration** | Direct model conversation | Agent triage and skill execution |
| **Navigation** | Minimal (chat + sidebar) | Full page routing (11 pages) |
| **Data** | Local files + model API | Remote backend (Convex) + local git |
| **Framework** | Go + Bubble Tea (custom renderer) | TypeScript + Ink (React reconciler) |
| **Performance** | 60fps custom rendering | 30fps React reconciler |

**Key insight**: OpenCode proves that developer tools in the terminal can be beautiful and fast. Our TUI should match their visual polish (panels, colors, status indicators) while serving a fundamentally different use case.

### vs LazyGit (Go + Bubble Tea)

LazyGit is the benchmark for panel-based TUI design. Five-panel layout (status, files, branches, commits, stash) with seamless keyboard navigation.

| Aspect | LazyGit | LTF1 TUI V2 |
|--------|---------|--------------|
| **Purpose** | Git management | Project management + git |
| **Layout** | 5 fixed panels, all visible | Sidebar + content page, one page at a time |
| **Data** | Local git repo only | Remote backend + local git |
| **Interaction** | Panel focus cycling | Page switching + list navigation |
| **Framework** | Go + Bubble Tea | TypeScript + Ink |

**Key insight**: LazyGit's panel cycling (Tab to move between panels) is a pattern we adopt for the Git page's staged/unstaged split and for Settings sections. Their use of color to indicate status (green = staged, red = modified) maps to our semantic color system.

### vs k9s (Go + Bubble Tea)

k9s is a dashboard-style TUI for Kubernetes management. Resource list with real-time updates, filtering, and drill-down.

| Aspect | k9s | LTF1 TUI V2 |
|--------|-----|--------------|
| **Purpose** | Kubernetes cluster management | Dev project management |
| **Layout** | Resource table with header + filter | Sidebar + content panels |
| **Data** | Kubernetes API (real-time) | Convex polling (5-30s intervals) |
| **Navigation** | Colon commands (`:pods`, `:deploy`) | Single-key shortcuts (t, s, a, g) |
| **Scale** | Hundreds of resources | Dozens of tasks/sprints |
| **Framework** | Go + Bubble Tea | TypeScript + Ink |

**Key insight**: k9s proves that dashboard-style TUIs work for operational tools. Their resource table pattern (sortable columns, status colors, drill-down on Enter) is the model for our Tasks and Sprint pages.

### Our Unique Position

No existing TUI combines project management, agent integration, and terminal-native workflows. The competitive landscape:

- **PM tools** (Linear, Jira, Plane): Browser-only, no TUI
- **AI TUIs** (OpenCode, Aider): Chat-focused, no PM features
- **Git TUIs** (LazyGit, gitui): Git-only, no task/sprint management
- **Ops TUIs** (k9s, bottom): Infrastructure-focused, no PM features

LTF1 TUI V2 occupies the intersection: **agent-integrated project management that lives in the terminal**. The Agent triage page and Skills system have no equivalent in any existing TUI.

---

## Future Vision (v3.0+)

### Go + Bubble Tea Rewrite

If v2 validates the product (>30% of active users prefer TUI over web), evaluate a full Go rewrite for v3.0. Benefits: single-binary distribution (no Node.js dependency), 60fps rendering, smaller memory footprint, established TUI ecosystem. The v2 architecture is designed with a clean data/presentation separation to make this migration feasible -- the Convex queries and auth flow would be reimplemented against HTTP APIs.

### Real-Time Updates (WebSocket/SSE)

Replace polling with server-sent events or WebSocket connections for truly real-time data. The Agent triage page especially benefits -- agent suggestions should appear instantly, not on a 5-second poll. Convex supports real-time subscriptions natively; the gap is that `ConvexHttpClient` does not use them. A custom transport layer could bridge this.

### Collaborative TUI

See other users' presence in the TUI. When two developers are on the same project, show who is viewing which page, who is editing which task. Cursor presence similar to multiplayer document editors but adapted for terminal -- show user initials next to items they are viewing or editing.

### Vim Mode

Power user mode activated via `:` prefix (like k9s). Full vim-style navigation: `gg` to top, `G` to bottom, `/` for search, `dd` to delete, number prefixes for repeat. Opt-in via Settings page.

### Plugin System

Allow teams to add custom TUI pages. A plugin defines: page name, shortcut key, data hooks, and render function. Plugins are npm packages that export Ink components. Use case: a team adds a "Deployments" page that shows their CI/CD pipeline status alongside task management.

### Editor Integration

VS Code extension and Neovim plugin that embed TUI panels directly in the editor. View task list in a VS Code sidebar panel. See sprint progress in a Neovim split. The TUI components are already React (Ink) -- the VS Code webview could render them with minimal adaptation.

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Startup** | <1s to dashboard (after auth) | Time from `ltf` command to first frame rendered |
| **Auth** | <200ms for cached token validation | Time from launch to auth state resolved |
| **Page switch** | <100ms to render new page | Time from keypress to first frame of new page |
| **Data freshness** | 5-10s for active page | Polling interval for the currently visible page |
| **Render** | 30fps minimum | Smooth scrolling and animation in lists |
| **Memory baseline** | <100MB | RSS after startup with dashboard loaded |
| **Memory ceiling** | <200MB | RSS after extended use (1 hour, all pages visited) |
| **Input latency** | <50ms | Time from keypress to visual feedback |
| **Git status** | <500ms | Time to parse local git status via simple-git |

### Performance Budget by Component

| Component | Max Render Time | Notes |
|-----------|----------------|-------|
| Header | 5ms | Static, changes only on page switch |
| Sidebar | 5ms | Static, changes only on page switch |
| StatusBar | 5ms | Updates on page switch and data refresh |
| Task list (50 items) | 30ms | Most common heavy render |
| Sprint view | 20ms | Progress bars, task counts |
| Agent triage queue | 15ms | Short list, rich detail per item |
| Git status | 10ms | File list, status colors |
| Search results | 25ms | Depends on result count |

### Degradation Strategy

If performance targets are missed:
1. **First**: Profile React reconciler, identify unnecessary re-renders
2. **Second**: Memoize expensive components, virtualize long lists
3. **Third**: Reduce polling frequency for background pages
4. **Fourth**: Consider hybrid rendering (Ink for layout, direct stdout for hot paths)
5. **Last resort**: Evaluate Go + Bubble Tea rewrite for v3.0
