---
name: ltf-pm
description: Use the ltf CLI to manage tasks, sprints, and projects in the LTF1 project management platform from inside a coding session. Trigger this skill any time the user mentions ltf, LTF1, project management commands, creating or updating tasks/sprints, marking tasks done, viewing the active sprint, or wanting to log work as you complete it. Also trigger when the user asks to wire AI work into a real task tracker, when they push code that should update tickets, or when they want their PM board to reflect what just got built.
---

# LTF1 Project Management CLI

LTF1 is a git-native project management platform with a Go-based CLI/TUI. Use this skill to interact with the user's LTF1 workspace from any coding session — create tasks before you start work, move them through statuses as you implement, mark them done when you commit.

The binary is `ltf` (installed via `npm install -g @vvg-ltf1/cli`). It is both a CLI (subcommands) and a TUI (bare `ltf` launches a full-screen interface) — for autonomous coding sessions, **always use the CLI subcommands, never bare `ltf`** because the TUI requires a TTY and will hang or error in non-interactive contexts.

## When to Use This Skill

Trigger automatically when:
- The user mentions ltf, LTF1, or "the PM tool"
- The user wants to track what you're about to build as a task
- The user wants to mark something done after you implement it
- The user asks "what's in my sprint" or "what tasks do I have"
- A coding session involves multi-step work that benefits from task tracking
- The user is working in a repo connected to an LTF1 project (check via `ltf project info`)

Do NOT trigger when:
- The user is using a different PM tool (Linear, Jira, GitHub Issues directly)
- The session is purely about code with no PM context
- The user has explicitly said they don't use LTF1

## Prerequisites

Before any ltf command runs, verify the user is set up:

```bash
ltf auth status
```

If the output says "not authenticated":
- Tell the user to run `ltf auth login` themselves (it opens a browser, requires user interaction)
- Do NOT try to run login on their behalf in autonomous mode
- Pause and wait for them to authenticate

If authenticated but no project selected, the output will say "no project selected. Run: ltf project select". In that case run:

```bash
ltf project detect --set
```

If detection fails, fall back to:

```bash
ltf project list --json
```

Then ask the user which project to use, and run `ltf project select <KEY>`.

## Common Workflows

### Workflow 1: Track a feature you're about to build

```bash
# Check current state
ltf sprint status

# Create a task for the work
ltf task create "Add dark mode toggle" -t feature -p medium -d "Add a toggle in settings that switches between dark/light themes"

# The CLI returns the task ID. Save it.
# Move it into progress as you start
ltf task update <task-id> -s in_progress

# When done, mark it
ltf task done <task-id>
```

### Workflow 2: Pick up an existing task

```bash
# List your assigned tasks
ltf task mine

# Pick one, view details
ltf task view <task-id>

# Mark it in-progress
ltf task update <task-id> -s in_progress

# Implement the code...

# Add a comment about what you did
ltf task comment <task-id> "Implemented in src/components/ThemeToggle.tsx"

# Mark done
ltf task done <task-id>
```

### Workflow 3: Triage incoming work

```bash
# See what's in the agent triage queue
ltf agent triage

# View activity feed
ltf agent status

# Run a skill (codified team workflow)
ltf skill list
ltf skill run bug-triage --task <task-id>
```

### Workflow 4: Sprint check-in

```bash
ltf sprint status            # current sprint progress
ltf sprint backlog           # untriaged work
ltf task list -s in_progress # what's actively in flight
```

### Workflow 5: Link git work to a task

If the user is working on a branch that follows the `PROJ-123-description` convention, ltf auto-detects the task. Otherwise:

```bash
ltf git link --task <task-id>    # link current branch to a task
ltf git status                    # see git + task context
```

## Output Format

For programmatic consumption (when you're parsing the output), always use `--json`:

```bash
ltf task list --json
ltf project list --json
ltf sprint status --json
```

For displaying to the user, use the default formatted output (tables with status icons and colors).

## Command Reference

### Auth (3)
| Command | Purpose |
|---------|---------|
| `ltf auth login` | Browser OAuth — user must run this themselves |
| `ltf auth logout` | Clear stored credentials |
| `ltf auth status` | Check authentication state |

### Project (4)
| Command | Purpose |
|---------|---------|
| `ltf project list [--all] [--json]` | List projects in current/all workspaces |
| `ltf project select [KEY]` | Pick active project |
| `ltf project info` | Show active project details |
| `ltf project detect [--set]` | Auto-detect from git remote |

### Task (9)
| Command | Purpose |
|---------|---------|
| `ltf task list [-s status] [-p priority] [--all] [--json]` | List tasks |
| `ltf task create <title> [-d desc] [-t type] [-p priority] [-l labels] [-e estimate]` | Create task |
| `ltf task view <id>` | Full task detail |
| `ltf task update <id> [--title] [-d] [-s] [-p] [-t]` | Update fields |
| `ltf task done <id>` | Mark done |
| `ltf task assign <id> --to me\|<userId>` | Assign |
| `ltf task delete <id> --force` | Delete (requires --force) |
| `ltf task comment <id> "message"` | Add comment |
| `ltf task mine` | Tasks assigned to current user |

Task types: `feature`, `bug`, `improvement`, `task`, `epic`
Priorities: `urgent`, `high`, `medium`, `low`
Statuses: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled`

### Sprint (7)
| Command | Purpose |
|---------|---------|
| `ltf sprint list [--status]` | List sprints |
| `ltf sprint status` | Active sprint progress |
| `ltf sprint create <name> [--start] [--end] [--goal]` | Create sprint |
| `ltf sprint add <task-id> [--sprint id]` | Add task to sprint |
| `ltf sprint remove <task-id>` | Remove from sprint |
| `ltf sprint close [sprint-id] --force` | Close sprint |
| `ltf sprint backlog` | Untriaged tasks |

### Agent (3)
| Command | Purpose |
|---------|---------|
| `ltf agent triage` | View AI triage queue |
| `ltf agent suggest` | Agent suggestions for next actions |
| `ltf agent status` | Agent activity feed |

### Skill (3)
| Command | Purpose |
|---------|---------|
| `ltf skill list` | List available skills |
| `ltf skill run <skill-id> [args]` | Execute a codified workflow |
| `ltf skill create <name> [-d] [--trigger]` | Create custom skill |

### Git (6)
| Command | Purpose |
|---------|---------|
| `ltf git link [--task] [--pr] [--branch]` | Link branch/PR to task |
| `ltf git status` | Git status with task context |
| `ltf git sync` | Sync activity |
| `ltf git hooks install\|uninstall\|status` | Manage git hooks |
| `ltf git config` | Configure integration |

### Time (5)
| Command | Purpose |
|---------|---------|
| `ltf time start <task-id> [-d desc]` | Start timer |
| `ltf time stop` | Stop timer, log entry |
| `ltf time status` | Active timer |
| `ltf time log <task-id> -H hours -M minutes` | Manual log |
| `ltf time report [--user] [--period week\|month]` | Time stats |

### Other Commands
- `ltf ai suggest \| analyze \| describe`: AI-powered task helpers
- `ltf search <query>`: Global search across tasks/projects/sprints
- `ltf notifications list \| read \| clear`: Notification management
- `ltf config list \| get \| set \| path \| reset`: CLI configuration
- `ltf release notes [--version]`: Generate release notes from commits
- `ltf pr create [--title] [--body]`: Create GitHub PR (requires gh CLI)

## Critical Rules for Autonomous Coding Sessions

1. **Never run bare `ltf`** — it launches the TUI which needs a TTY. Always pass a subcommand.
2. **Never run `ltf auth login`** — it opens a browser and requires user interaction. Tell the user to run it.
3. **Always verify auth + project context before commands** — use `ltf auth status` first if unsure.
4. **Use `--json` when parsing output** — text output is for humans, JSON is for programs.
5. **Use `--force` for destructive ops only when explicitly requested** — `ltf task delete` requires `--force` and there's no undo.
6. **Don't create tasks for trivial work** — if the user asks you to fix one typo, don't make a task. Use judgment.
7. **Match task types correctly** — bug fixes get `-t bug`, new features get `-t feature`, etc.
8. **Set priority based on context** — production bugs are `urgent`, polish is `low`, default to `medium`.
9. **Comment as you progress** — use `ltf task comment` to leave a paper trail of what you actually did.
10. **One task per logical unit of work** — not one per file changed.

## Pattern: Wrap a coding session in a task

The most useful pattern is wrapping each chunk of work in an LTF1 task so the user's board reflects what you're actually doing:

```bash
# Before starting
TASK_ID=$(ltf task create "Refactor auth middleware" -t improvement -p medium --json | jq -r '.taskId')
ltf task update $TASK_ID -s in_progress

# Do the work...

# Update progress
ltf task comment $TASK_ID "Extracted JWT validation into separate module"

# Finish
ltf task done $TASK_ID
```

This gives the user (and their team) live visibility into what the AI is building, and the work is automatically tied to git commits because ltf parses task IDs from branch names and commit messages.

## Failure Modes

- **"not authenticated"**: User needs to `ltf auth login`. Don't try to recover automatically.
- **"no project selected"**: Run `ltf project detect --set` or ask user to `ltf project select`.
- **"CONVEX_URL not configured"**: Environment is misconfigured. User needs to set `CONVEX_URL` env var or run `ltf config set convexUrl <url>`.
- **Network errors**: ltf hits Convex Cloud. Check connectivity, retry once, then report.
- **TTY error**: You ran `ltf` with no args. Add a subcommand.

## Installation

If `ltf` is not installed:

```bash
npm install -g @vvg-ltf1/cli
```

Then verify:

```bash
ltf --version    # or
ltf auth status
```
