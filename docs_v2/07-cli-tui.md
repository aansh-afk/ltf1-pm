# CLI & TUI Reference — iceberg-pm

## Overview

The iceberg CLI (`ltf`) provides two interfaces:
1. **CLI**: Traditional command-line commands for scripting, CI/CD, and quick operations
2. **TUI**: Full-screen terminal UI for interactive project management without leaving your editor

**Package**: `@vvg-ltf1/cli` v0.1.0-beta.3
**Command**: `ltf`
**Framework**: Commander.js (CLI) + Ink/React (TUI)

---

## Installation

```bash
npm install -g @vvg-ltf1/cli
# or
pnpm add -g @vvg-ltf1/cli
```

---

## Quick Start

```bash
# Authenticate
ltf auth login

# Select workspace and project
ltf project select

# Launch interactive TUI
ltf
# or
ltf dashboard
```

---

## CLI Commands

### Authentication

| Command | Description | Flags |
|---------|-------------|-------|
| `ltf auth login` | Authenticate via browser OAuth | `--token <jwt>` for API token auth |
| `ltf auth logout` | Clear stored credentials | |
| `ltf auth status` | Show current auth state | `--json` |

**Auth Flow**:
1. Opens browser to Clerk auth page
2. Local HTTP server on port 9876 receives callback
3. CSRF state validation
4. JWT token + sessionId stored in local config
5. Silent refresh via sessionId (no re-auth needed for 7 days)

### Project Management

| Command | Description | Flags |
|---------|-------------|-------|
| `ltf project list` | List available projects | `--json` |
| `ltf project select [key]` | Select active project interactively or by key | `--json` |
| `ltf project info` | Show current project details | `--json` |
| `ltf project detect` | Auto-detect project from git remote | |

### Task Management

| Command | Description | Flags |
|---------|-------------|-------|
| `ltf task list` | List tasks in current project | `-s <status>`, `-p <priority>`, `--mine`, `--json` |
| `ltf task create <title>` | Create new task | `-d <desc>`, `-t <type>`, `-p <priority>`, `-l <labels>`, `-e <estimate>`, `--due-date`, `--assign <userId>` |
| `ltf task view <id>` | View task details | `--json` |
| `ltf task update <id>` | Update task fields | Same flags as create |
| `ltf task done <id>` | Mark task as done | |
| `ltf task assign <id>` | Assign task to user | `--user <userId>` |
| `ltf task delete <id>` | Delete task | `--force` |
| `ltf task comment <id>` | Add comment | `-m <message>` |
| `ltf task mine` | Show my assigned tasks | `--json` |

### Sprint Management

| Command | Description | Flags |
|---------|-------------|-------|
| `ltf sprint list` | List sprints | `--json` |
| `ltf sprint create <name>` | Create sprint | `--goal`, `--start-date`, `--end-date` |
| `ltf sprint status` | Show current sprint status | `--json` |
| `ltf sprint add <taskId>` | Add task to current sprint | |
| `ltf sprint remove <taskId>` | Remove task from sprint | |
| `ltf sprint backlog` | Show backlog tasks | |
| `ltf sprint close` | Close current sprint | |

### AI Commands

| Command | Description | Flags |
|---------|-------------|-------|
| `ltf ai suggest` | AI task suggestions | `--from <source>` |
| `ltf ai analyze <taskId>` | AI analysis of task | `--json` |
| `ltf ai describe <title>` | Generate task description | |

### Git Integration

| Command | Description | Flags |
|---------|-------------|-------|
| `ltf git status` | Show git + task linking status | |
| `ltf git hooks` | Install git hooks | `--uninstall` |
| `ltf git config` | Configure git integration | |
| `ltf git link <taskId>` | Link task to current branch | |
| `ltf git sync` | Sync with remote | |

### Time Tracking

| Command | Description | Flags |
|---------|-------------|-------|
| `ltf time start <taskId>` | Start timer | |
| `ltf time stop` | Stop active timer | |
| `ltf time status` | Show active timer | |
| `ltf time log` | Log manual time entry | `--duration`, `--description` |
| `ltf time report` | Show time report | `--period <week/month>`, `--json` |

### Daemon

| Command | Description | Flags |
|---------|-------------|-------|
| `ltf daemon start` | Start background watcher | `--foreground`, `--verbose` |
| `ltf daemon stop` | Stop daemon | `--force` |
| `ltf daemon status` | Show daemon PID and state | |
| `ltf daemon logs` | View daemon logs | `--follow`, `--lines <n>`, `--clear` |

### Other Commands

| Command | Description |
|---------|-------------|
| `ltf search <query>` | Global search |
| `ltf notifications` | Show notifications |
| `ltf config` | CLI configuration |
| `ltf completions` | Generate shell completions |
| `ltf release notes` | Generate release notes |
| `ltf pr create` | Create pull request |

### Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON (for scripting) |
| `--no-color` | Disable colored output |
| `--debug` | Enable debug logging |

---

## TUI Application

### Launching

```bash
ltf              # Default: launches TUI
ltf dashboard    # Explicit TUI launch
ltf -d           # Short flag
```

### Architecture

```
Terminal (alternate screen buffer)
    │
    ▼
Ink React Runtime
    │
    ▼
App.tsx (Shell)
├── Global keyboard input handler
├── Authentication state machine
├── Page router (state-based)
└── Resize detection
    │
    ▼
Pages (return Row[] arrays)
├── Dashboard.tsx   (768 lines)
├── Tasks.tsx       (1,355 lines)
├── Sprint.tsx      (835 lines)
├── Git.tsx         (500 lines)
├── Search.tsx      (182 lines)
├── Notifications.tsx (103 lines)
└── Help.tsx        (139 lines)
```

### Rendering System

The TUI uses segment-based row rendering instead of nested JSX components:

```typescript
type Segment = { text: string; color: string }
type Row = { segments: Segment[]; bgColor?: string }

// Each page returns Row[]
// Render helpers:
row(text, color)           // Single-segment row
segRow(segments)           // Multi-segment row
blank(width)               // Empty row
pageHeader(title, time, w) // Consistent header
pageFooter(width)          // Navigation hints
section(label, width)      // Section divider
```

This approach eliminates React component overhead and maps directly to terminal character grids.

### Navigation

#### Global Keys
| Key | Action |
|-----|--------|
| `q` / `Ctrl+C` | Exit TUI |
| `ESC` / `b` | Go back |

#### Dashboard Keys
| Key | Action |
|-----|--------|
| `t` / `1` | Tasks page |
| `s` / `2` | Sprint page |
| `g` / `3` | Git page |
| `/` / `5` | Search page |
| `n` / `6` | Notifications page |
| `?` / `7` | Help page |
| `w` | Workspace selector |
| `p` | Project selector |
| `↑` / `↓` | Navigate menu |
| `Enter` | Select |

#### Tasks Page Keys
| Key | Action |
|-----|--------|
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `Enter` | Select / confirm |
| `c` | Create task |
| `e` | Edit task |
| `d` | Delete task |
| `m` | Move task (change status) |
| `a` | Assign task |
| `x` | Add comment |
| `f` | Filter tasks |
| `ESC` | Back / cancel |

#### Sprint Page Keys
| Key | Action |
|-----|--------|
| `c` | Create sprint |
| `b` | View backlog |
| `Enter` | Select sprint / add task |
| `↑` / `↓` | Navigate |

#### Git Page Keys
| Key | Action |
|-----|--------|
| `Space` | Toggle stage/unstage |
| `a` | Stage all |
| `c` | Commit |
| `l` | Link task |

### Pages

#### Dashboard
**States**: Unauthenticated → Login → Workspace Selector → Project Selector → Dashboard

**Normal Dashboard Shows**:
- Header: Workspace > Project breadcrumb + connection status (● Ready)
- Active sprint summary with progress bar
- My tasks (5 most recent assigned)
- Workspace stats (projects, members, task distribution)
- Particle field animation background

**Connection Status Indicators**:
- `●` Connected (Ready)
- `○` Connecting
- Error / Offline states

**Loading Animation**: Sine-wave animated bar during data fetch

#### Tasks
**Modes**: list, create, edit, move, delete_confirm, assign, comment, search, detail

**Features**:
- Status filtering (All, Active, Review, To Do, Backlog, Done)
- Sort by status order (in_progress → in_review → todo → backlog → done → cancelled)
- "My Tasks" toggle
- 4-step creation wizard (title → type → priority → description)
- Full inline editing
- Real-time status icons (●○◌◉✓✕)

#### Sprint
**Modes**: overview, tasks, create, close_confirm, add_task, backlog

**Features**:
- Sprint list with progress stats
- 4-step creation (name → goal → start date → end date)
- Backlog management
- Task assignment to sprint
- Velocity tracking
- Sprint closure confirmation

#### Git
**Modes**: status, commit, link

**Features**:
- Staged vs unstaged file list
- File status labels: A (added), D (deleted), M (modified), R (renamed), ? (untracked)
- Individual file staging/unstaging
- Commit with message
- Auto-link commits to tasks via branch name parsing (PROJ-123)
- Polls git status every 5 seconds

#### Search
- Global keyword search
- Real-time filtering
- Results from tasks, projects, sprints

#### Notifications
- Notification list with read/unread status
- Task updates, sprint changes, assignments
- Mark as read

#### Help
- Quick reference for all keybindings
- Command descriptions organized by page

---

## Theme System (Terminal)

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| `BG` | `#000000` | Terminal background |
| `WHITE` | `#FFFFFF` | Primary text, active items |
| `LIGHT` | `#CCCCCC` | Secondary text, highlights |
| `GRAY` | `#888888` | Muted text, inactive items |
| `DIM` | `#555555` | Very muted, borders |
| `DARK` | `#333333` | Dividers, separators |

### Status Colors

| Status | Color | Icon |
|--------|-------|------|
| backlog | DIM | ◌ |
| todo | GRAY | ○ |
| in_progress | WHITE | ● |
| in_review | LIGHT | ◉ |
| done | DIM | ✓ |
| cancelled | DARK | ✕ |

### Priority Colors

| Priority | Color |
|----------|-------|
| urgent | WHITE |
| high | WHITE |
| medium | LIGHT |
| low | GRAY |

---

## Data Hooks

### useAuth
- Reads auth state from local config
- Polls every 5s when token expiring (within 5 min)
- Polls every 30s normally
- Tracks: isAuthenticated, token, userId, email, expired, needsRefresh, sessionId

### useConvexQuery
- Polling wrapper around ConvexHttpClient
- Configurable interval (default 10s)
- Automatic retry on failure
- Connection status tracking (connected/connecting/disconnected/error)
- Token expiry detection → auto-logout on 401

### useMutations
- createTask, updateTask, deleteTask, moveTask
- createComment
- createSprint, updateSprint, addTasksToSprint
- assignTask, linkTaskToBranch

### useGitStatus
- Polls git status every 5s when active
- Staged files, unstaged files, current branch

### useNotifications
- Polls notification count
- Mark as read mutations

### useTimeTracking
- Active timer state
- Start/stop/pause mutations

---

## Configuration

### Storage Location
- macOS: `~/Library/Application Support/ltf/`
- Linux: `~/.config/ltf/`

### Config Structure

```json
{
  "auth": {
    "token": "<jwt>",
    "tokenType": "clerk",
    "userId": "<id>",
    "email": "<email>",
    "expiresAt": 1234567890,
    "sessionId": "<clerk-session-id>"
  },
  "project": {
    "workspaceId": "<id>",
    "workspaceName": "My Workspace",
    "projectId": "<id>",
    "projectKey": "PROJ",
    "projectName": "My Project"
  },
  "preferences": {
    "defaultFormat": "table",
    "colorOutput": true,
    "autoSync": true
  },
  "server": {
    "webUrl": "https://ltf1.dev",
    "convexUrl": "https://tangible-butterfly-366.convex.cloud"
  },
  "daemon": {
    "enabled": false,
    "pid": null,
    "logFile": null
  },
  "gitHooks": {
    "installed": false,
    "installedAt": null
  }
}
```

### Web URL Resolution Priority
1. User config (`ltf config set-web-url`)
2. `LTF_WEB_URL` or `WEB_APP_URL` env var
3. `http://localhost:3000` if `NODE_ENV=development`
4. Monorepo marker detection
5. Default: `https://ltf1.dev`

---

## Output Utilities

### Formatters
| Function | Description |
|----------|-------------|
| `spinner(text)` | Animated loading spinner |
| `success(msg)` | Green success message |
| `error(msg, details?)` | Red error with optional details |
| `warning(msg)` | Yellow warning |
| `info(msg)` | Blue info message |
| `table(data, columns)` | ASCII formatted table |
| `keyValue(pairs)` | Key-value display |
| `box(content, title)` | Bordered box |
| `progressBar(current, total)` | Progress bar with percentage |
| `miniChart(values)` | Sparkline chart (▁▂▃▄▅▆▇█) |
| `json(data)` | JSON output for scripting |
| `list(items)` | Bullet list |
| `formatStatus(status)` | Colored status badge |
| `formatPriority(priority)` | Colored priority badge |
| `formatType(type)` | Colored type badge |

---

## Git Integration

### Branch Name Parsing
Automatically extracts task keys from branch names:
- `feature/PROJ-123-add-login` → `PROJ-123`
- `fix/PROJ-456` → `PROJ-456`
- `PROJ-789-bug-fix` → `PROJ-789`

### Commit Message Parsing
Extracts task keys from commit messages:
- `PROJ-123 fix login bug` → `PROJ-123`
- `feat: implement auth (PROJ-456)` → `PROJ-456`

### Git Hooks
When installed (`ltf git hooks`):
- **post-commit**: Auto-links commit to task via branch name
- **post-checkout**: Updates active task context
- **pre-push**: Optional task status validation

---

## Future: Agent Commands (Planned)

### `ltf agent` (Phase 1)
| Command | Description |
|---------|-------------|
| `ltf agent triage` | Show triage queue, accept/reject AI suggestions |
| `ltf agent suggest` | Agent analyzes current state, suggests next actions |
| `ltf agent status` | Show agent activity summary |
| `ltf agent create <description>` | Natural language task creation via agent |

### `ltf skill` (Phase 1)
| Command | Description |
|---------|-------------|
| `ltf skill list` | List available skills |
| `ltf skill run <name>` | Execute a skill |
| `ltf skill create` | Interactive skill creation |
| `ltf skill info <name>` | Show skill details |

### Agent TUI Page (Phase 1)
New page accessible via `a` from dashboard:
- Triage queue with accept/modify/reject
- Recent agent actions log
- Agent configuration
- Keyboard-driven inbox-zero flow
