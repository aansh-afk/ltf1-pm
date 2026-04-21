---
name: ltf-pm
description: Use the ltf1 CLI to manage tasks, sprints, and projects in the LTF1 project management platform from inside a coding session. Trigger this skill any time the user mentions ltf1, LTF1, or "the PM tool"; asks to create, update, comment on, or close tasks/sprints; wants the board to reflect what was just built; wants AI work wired into a real task tracker; is about to open a PR or land commits tied to a task; is running the LTF1 daemon or dashboard; or is scripting LTF1 from CI in non-interactive mode.
---

# LTF1 Project Management CLI

LTF1 is a git-native project management platform with a Go-based CLI/TUI. Use this skill to drive a user's LTF1 workspace from any coding session — create tasks before starting work, move them through statuses while implementing, close them on commit, and log progress as comments so the board stays truthful.

The binary is `ltf1` (installed via `npm install -g @vvg-ltf1/cli`, or on macOS via Homebrew). It is both a CLI and a full-screen Bubble Tea TUI. **Bare `ltf1`, `ltf1 dashboard`, `ltf1 d`, and `ltf1 tui` all launch the TUI and require a TTY** — they will hang or error in non-interactive contexts. In autonomous coding sessions, always pass a CLI subcommand; never launch the TUI.

## When to use this skill

Trigger automatically when:
- The user mentions ltf1, LTF1, or "the PM tool"
- The user wants to track what you're about to build as a task
- The user wants to mark something done after you implement it
- The user asks "what's in my sprint" or "what tasks do I have"
- The user is about to open a PR or has just committed work that should be reflected on the board
- A coding session involves multi-step work that benefits from task tracking
- The user is working in a repo connected to an LTF1 project (check via `ltf1 project info`)
- A CI script or headless agent needs to file, update, or close tasks programmatically
- The LTF1 daemon or activity feed comes up in conversation

Do NOT use this skill when:
- The user is using a different PM tool (Linear, Jira, GitHub Issues directly)
- The session is purely about code with no PM context
- The user has explicitly said they don't use LTF1
- The repo has no LTF1 project set **and** the user has said not to set one

## Prerequisites

Before the first data command in a session, check auth and project context.

### Auth

```bash
ltf1 auth status
```

If the output says "not authenticated", there are two paths:

- **Interactive (developer's laptop):** tell the user to run `ltf1 auth login` themselves — it opens a browser. Do not run it yourself in autonomous mode; it will block.
- **Non-interactive (CI, headless agent, container):** use `ltf1 auth login --token <jwt>` with a token supplied by the user via env var. Never echo the token into logs or terminal output.

### Project

If authenticated but no project is set, `auth status` will say so, or any `task` command will refuse with "no project selected". Recover with:

```bash
ltf1 project detect --set   # uses the current git remote
```

If detection fails, list and ask the user which to pick:

```bash
ltf1 project list --json
ltf1 project select <KEY>
```

### Config files

LTF1 reads `.env` from the current working directory and `~/.ltf1.env` for user-wide overrides. To see where the active config lives: `ltf1 config path`. To set a value: `ltf1 config set <key> <value>`.

## Common workflows

### Workflow 1: Track a feature you're about to build

The most useful pattern — capture the task ID from `--json` once, then reuse it through the session.

```bash
TASK_ID=$(ltf1 task create "Refactor auth middleware" -t improvement -p medium --json | jq -r '.taskId')
ltf1 task update "$TASK_ID" -s in_progress

# ... do the work ...
ltf1 task comment "$TASK_ID" "Extracted JWT validation into middleware/jwt.go"

ltf1 task done "$TASK_ID"
```

### Workflow 2: Pick up an existing task

```bash
ltf1 task mine                                # list tasks assigned to the current user
ltf1 task view <task-id>                      # full detail
ltf1 task update <task-id> -s in_progress

# ... implement ...
ltf1 task comment <task-id> "Implemented in src/components/ThemeToggle.tsx"
ltf1 task done <task-id>
```

### Workflow 3: Triage incoming work

```bash
ltf1 agent triage            # agent triage queue
ltf1 agent status            # agent activity feed
ltf1 agent suggest           # next-action suggestions

ltf1 skill list              # codified team workflows
ltf1 skill run <skill-id>    # run one
```

### Workflow 4: Sprint check-in

```bash
ltf1 sprint status           # active sprint progress
ltf1 sprint backlog          # untriaged work
ltf1 task list -s in_progress
```

### Workflow 5: Link git work to a task

Branches named `PROJ-123-description` auto-link to task `PROJ-123`. Otherwise:

```bash
ltf1 git link --task <task-id>    # link current branch to a task
ltf1 git status                   # git state with task context
ltf1 git hooks install            # wire commits & checkouts into task activity
```

Once `git hooks install` has been run, commits and branch checkouts update task state automatically; `ltf1 git sync` becomes mostly a no-op. **Don't double-call `task update` for status transitions the hook already performs** — if you just pushed a commit tagged `PROJ-123` on a branch named `PROJ-123-*`, the task already moved.

### Workflow 6: Open a PR tied to the current task

```bash
ltf1 pr create --title "feat(auth): refactor JWT middleware" --body "Fixes PROJ-123"
ltf1 pr create --title "..." --draft      # draft PR
```

`ltf1 pr create` shells out to the `gh` CLI, so `gh` must be installed and authenticated. The PR body is parsed for task IDs and linked automatically.

### Workflow 7: Run the agent triage queue in CI

```bash
ltf1 auth login --token "$LTF1_TOKEN"
ltf1 project detect --set
ltf1 agent triage --json      # consume as JSON
```

## Output format

Default output is for humans (tables, colors, status icons). For programmatic consumption, pass `--json` — supported on `task list`, `task view`, `task create`, `task update`, `task mine`, `task comment` (write commands echo an id), `project list`, `project info`, `sprint list`, `sprint status`, `sprint backlog`, `agent triage`, `skill list`, `time stop`, `time report`, `search`, `notifications list`, and more.

Capture IDs with `jq`:

```bash
TASK_ID=$(ltf1 task create "…" -t bug --json | jq -r '.taskId')
```

For commands where `--json` is not implemented, prefer line-oriented `grep`/`awk` parsing and treat it as fragile.

## Command reference

Every row here corresponds to a Cobra `Use:` in `apps/tui/internal/commands/**/*.go`. Flags are the real flags, including short forms.

### Auth
| Command | Purpose |
|---|---|
| `ltf1 auth login [--token <jwt>]` | Browser OAuth on a laptop; `--token` for non-interactive/CI |
| `ltf1 auth logout` | Clear stored credentials |
| `ltf1 auth status` | Check authentication and active project |

### Project (`ltf1 project`, alias `p`)
| Command | Purpose |
|---|---|
| `ltf1 project list [-w <workspace>] [--all] [--json]` | List projects in current/all workspaces |
| `ltf1 project select [KEY] [-w <workspace>]` (alias `use`) | Pick active project |
| `ltf1 project info` (alias `show`) `[--json]` | Show active project details |
| `ltf1 project detect [--set]` | Auto-detect project from git remote |

### Task (`ltf1 task`, alias `t`)
| Command | Purpose |
|---|---|
| `ltf1 task list [-s status] [-p priority] [-a assignee] [-t type] [--all] [--json]` (alias `ls`) | List tasks |
| `ltf1 task create <title> [-d desc] [-t type] [-p priority] [-l labels] [-e estimate] [--due-date YYYY-MM-DD] [--assign <userId>] [--json]` (aliases `new`, `add`) | Create task |
| `ltf1 task view <id> [--json]` (aliases `show`, `get`) | Full task detail |
| `ltf1 task update <id> [--title] [-d] [-s] [-p] [-t] [-l] [--due-date] [--clear-due-date] [--json]` (alias `edit`) | Update fields |
| `ltf1 task done <id>` (aliases `complete`, `finish`) | Mark done |
| `ltf1 task assign <id> --to me\|<userId>` / `--clear` | Assign or clear assignees |
| `ltf1 task delete <id> -f` (alias `rm`) | Delete (requires `--force`) |
| `ltf1 task comment <id> [message]` | Add comment (reads stdin if message omitted) |
| `ltf1 task mine [-s status] [--json]` (alias `my`) | Tasks assigned to current user |

- **Task types:** `feature`, `bug`, `improvement`, `task`, `epic`
- **Priorities:** `urgent`, `high`, `medium`, `low`
- **Statuses:** `backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled`

### Sprint (`ltf1 sprint`, alias `s`)
| Command | Purpose |
|---|---|
| `ltf1 sprint list [--status planning\|active\|completed] [--json]` (alias `ls`) | List sprints |
| `ltf1 sprint status [--json]` (alias `st`) | Active sprint progress |
| `ltf1 sprint create <name> [--start YYYY-MM-DD] [--end YYYY-MM-DD] [--goal]` | Create sprint |
| `ltf1 sprint add <task-id> [--sprint <id>]` | Add task to sprint (defaults to active) |
| `ltf1 sprint remove <task-id>` (alias `rm`) | Remove from sprint |
| `ltf1 sprint close [sprint-id] [--force]` | Close sprint |
| `ltf1 sprint backlog [--json]` (alias `bl`) | Untriaged tasks |

### Time (`ltf1 time`, alias `tm`)
| Command | Purpose |
|---|---|
| `ltf1 time start <task-id> [-d desc]` | Start timer |
| `ltf1 time stop [--json]` | Stop timer, log entry |
| `ltf1 time status` | Active timer |
| `ltf1 time log <task-id> -d YYYY-MM-DD` | Manual log |
| `ltf1 time report [--user] [--period week\|month] [--json]` | Time stats |

### Git (`ltf1 git`)
| Command | Purpose |
|---|---|
| `ltf1 git link [--task <id>] [--pr <url>] [--branch <name>]` | Link branch/PR to task |
| `ltf1 git status` | Git status with task context |
| `ltf1 git sync` | Sync activity (mostly redundant once hooks are installed) |
| `ltf1 git hooks <install\|uninstall\|status>` | Manage git hooks |
| `ltf1 git config` | Configure integration |

### AI (`ltf1 ai`)
| Command | Purpose |
|---|---|
| `ltf1 ai suggest` | AI suggestions for next actions |
| `ltf1 ai analyze [-s <sprint>]` | Analyze current or specified sprint |
| `ltf1 ai describe <brief> [--create]` | Expand a brief into a task description; `--create` files it |

### Agent (`ltf1 agent`)
| Command | Purpose |
|---|---|
| `ltf1 agent triage [--json]` | AI triage queue |
| `ltf1 agent suggest` | Suggestions for next actions |
| `ltf1 agent status` | Agent activity feed |

### Skill (`ltf1 skill`)
| Command | Purpose |
|---|---|
| `ltf1 skill list [--json]` (alias `ls`) | List available skills |
| `ltf1 skill run <skill-id> [args...]` | Execute a codified workflow |
| `ltf1 skill create <name> [-d desc] [--trigger manual\|auto\|both]` | Create custom skill |

### Daemon (`ltf1 daemon`)
| Command | Purpose |
|---|---|
| `ltf1 daemon start [-f] [-v]` | Start background sync daemon (`-f` foreground, `-v` verbose) |
| `ltf1 daemon stop [-f]` | Stop daemon (`-f` force kill) |
| `ltf1 daemon status` | Daemon state |
| `ltf1 daemon logs [-f] [-n <lines>] [--clear]` | Tail or clear daemon logs |

### PR (`ltf1 pr`) — requires `gh` CLI
| Command | Purpose |
|---|---|
| `ltf1 pr create [--title] [--body] [--draft]` | Create a GitHub PR tied to the current branch/task |

### Release (`ltf1 release`)
| Command | Purpose |
|---|---|
| `ltf1 release notes [--version <tag>] [--format md\|txt]` | Generate release notes from commits since version |

### Update
| Command | Purpose |
|---|---|
| `ltf1 update [--check]` | Upgrade the CLI in place; `--check` reports without upgrading |

### Completions (`ltf1 completions`)
| Command | Purpose |
|---|---|
| `ltf1 completions bash\|zsh\|fish` | Print shell completion script |
| `ltf1 completions install` | Install into the current user's shell |

### Config (`ltf1 config`, alias `cfg`)
| Command | Purpose |
|---|---|
| `ltf1 config list` (alias `ls`) | Show all config values |
| `ltf1 config get <key>` | Read one value |
| `ltf1 config set <key> <value>` | Set one value |
| `ltf1 config path` | Print the active config file path |
| `ltf1 config reset [--force]` | Reset to defaults |

### Search & Notifications
| Command | Purpose |
|---|---|
| `ltf1 search <query> [-t <type>] [--json]` | Global search across tasks/projects/sprints |
| `ltf1 notifications list [-u] [--json]` (alias `notif ls`) | List notifications; `-u` unread only |
| `ltf1 notifications read <id>` | Mark one read |
| `ltf1 notifications clear` | Clear all |

### Dashboard — **TTY only, do not invoke from agent sessions**
| Command | Purpose |
|---|---|
| `ltf1 dashboard` (aliases `d`, `tui`) | Launch the Bubble Tea TUI |

## Critical rules for autonomous coding sessions

1. **Never launch the TUI.** Bare `ltf1`, `ltf1 dashboard`, `ltf1 d`, and `ltf1 tui` all require a TTY and will hang or error. Always pass a CLI subcommand.
2. **Never run `ltf1 auth login` interactively on the user's behalf.** It opens a browser. In CI, use `ltf1 auth login --token <jwt>` with a token from env.
3. **Always `ltf1 auth status` before the first data command** in a new session.
4. **Always pass `--json` when parsing output.** Default formatting is for humans.
5. **Use `--force` only when the user explicitly asked for a destructive op** (`task delete`, `sprint close`, `config reset`). There is no undo.
6. **Don't create tasks for trivial work** (one typo fix, one lint nit). Use judgment.
7. **Match task types to the work:** bug fixes `-t bug`, new features `-t feature`, refactors `-t improvement`, general chores `-t task`, large bodies of work `-t epic`.
8. **Set priority from context:** production bugs `urgent`, user-facing regressions `high`, polish `low`, default `medium`.
9. **Comment as you progress** with `ltf1 task comment`; don't batch at the end. Activity feeds are the user's window into what you did.
10. **One task per logical unit of work**, not one per file touched.
11. **If `ltf1 git hooks install` has been run, the hook already updates task status on commits and checkouts.** Don't double-call `task update` for transitions the hook handles.

## Failure modes

- **"not authenticated"** → tell user to `ltf1 auth login` (or use `--token` in CI).
- **"no project selected"** → `ltf1 project detect --set`; fall back to `ltf1 project list --json` + ask user.
- **"CONVEX_URL not configured"** → `ltf1 config set convexUrl <url>` or export the env var.
- **TTY error (`tui error: …`, cursor escape codes dumped to stdout)** → you launched the TUI. Switch to a subcommand.
- **Stale binary / command missing** → suggest `ltf1 update` to pull the latest CLI.
- **Network errors** → LTF1 talks to Convex Cloud. Check connectivity, retry once, then report.

## Installation

If `ltf1` is not installed:

```bash
npm install -g @vvg-ltf1/cli
```

Verify:

```bash
ltf1 --version
ltf1 auth status
```
