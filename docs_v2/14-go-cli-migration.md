# Go CLI Migration Spec

This document specifies the migration of the TypeScript CLI (`apps/cli/`) to a Go-based CLI integrated with the existing Go TUI at `apps/tui/`.

---

## Goal

Replace the TypeScript CLI entirely with a Go-based CLI that:
1. Lives in the same `apps/tui/` directory as the Go TUI
2. Compiles to a single binary called `ltf`
3. Provides all 64 subcommands from the existing TypeScript CLI
4. Falls back to launching the TUI when invoked with no arguments
5. Reuses the existing Go API client (`internal/api/`) for Convex calls
6. Reuses the existing auth flow (`internal/api/auth.go` + `internal/tui/login.go`)
7. Distributes via the existing npm wrapper (`apps/tui/npm/`)

---

## Architecture

### Final Directory Structure

```
apps/tui/
├── go.mod
├── go.sum
├── main.go                         # Thin wrapper → cmd/ltf/main.go
├── DESIGN_SYSTEM.md
├── worldmap.txt
├── cmd/
│   └── ltf/
│       └── main.go                 # Cobra root, default = launch TUI
├── internal/
│   ├── api/                        # Existing — Convex client, auth, types
│   │   ├── auth.go
│   │   ├── client.go
│   │   ├── github.go
│   │   └── types.go
│   ├── commands/                   # NEW — All Cobra commands
│   │   ├── root.go                 # Root command, global flags
│   │   ├── helpers.go              # Shared helpers (require auth, get client)
│   │   ├── auth/                   # 3 commands
│   │   │   ├── auth.go
│   │   │   ├── login.go
│   │   │   ├── logout.go
│   │   │   └── status.go
│   │   ├── project/                # 4 commands
│   │   │   ├── project.go
│   │   │   ├── list.go
│   │   │   ├── select.go
│   │   │   ├── info.go
│   │   │   └── detect.go
│   │   ├── task/                   # 9 commands
│   │   │   ├── task.go
│   │   │   ├── list.go
│   │   │   ├── create.go
│   │   │   ├── view.go
│   │   │   ├── update.go
│   │   │   ├── done.go
│   │   │   ├── assign.go
│   │   │   ├── delete.go
│   │   │   ├── comment.go
│   │   │   └── mine.go
│   │   ├── sprint/                 # 7 commands
│   │   ├── time/                   # 5 commands
│   │   ├── git/                    # 6 commands
│   │   ├── ai/                     # 3 commands
│   │   ├── agent/                  # 3 commands
│   │   ├── skill/                  # 3 commands
│   │   ├── daemon/                 # 4 commands
│   │   ├── search/                 # 1 command
│   │   ├── notifications/          # 3 commands
│   │   ├── config/                 # 5 commands
│   │   ├── completions/            # 4 commands
│   │   ├── release/                # 1 command
│   │   ├── pr/                     # 1 command
│   │   ├── update/                 # 1 command
│   │   └── dashboard/              # 1 command (launches TUI)
│   ├── output/                     # NEW — Terminal output utilities
│   │   ├── colors.go               # ANSI color helpers
│   │   ├── status.go               # Status/priority/type formatters
│   │   ├── table.go                # Table renderer
│   │   ├── json.go                 # JSON output
│   │   ├── icons.go                # Unicode icons
│   │   └── format.go               # Formatting utilities
│   └── tui/                        # Existing TUI shell
│       ├── app.go
│       ├── login.go
│       ├── pages/...
│       ├── components/...
│       └── theme/...
└── npm/                            # NPM distribution (binary = ltf)
```

### Key Decisions

1. **Cobra over manual**: Use `github.com/spf13/cobra` for CLI parsing — battle-tested, handles flags, subcommands, help text.
2. **One package per command group**: Each command group (auth, task, sprint) is its own Go package for clean separation.
3. **Reuse existing code**: The API client (`internal/api/`) and auth (`internal/api/auth.go`) are already excellent. Don't rewrite.
4. **Default action = TUI**: Bare `ltf` launches TUI (preserves current behavior). `ltf dashboard` is an alias.
5. **Output package**: All terminal formatting goes through `internal/output/` to keep commands clean.
6. **Global flags**: `--json`, `--no-color`, `--debug` defined on root command, inherited by all subcommands.
7. **Binary name**: `ltf` (not `ltf-tui`, not `ltf1`).
8. **Replace TUI launch in main.go**: The current `apps/tui/main.go` becomes a thin entry that calls into `cmd/ltf`.

---

## Command Mapping (TypeScript → Go)

### Auth (3 commands)

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf auth login` | `internal/commands/auth/login.go` | Reuses `internal/tui/login.go` OAuth flow |
| `ltf auth logout` | `internal/commands/auth/logout.go` | Clears `AuthConfig` via `api.SaveAuthConfig` |
| `ltf auth status` | `internal/commands/auth/status.go` | Reads `api.LoadAuthConfig` |

### Project (4 commands)

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf project list` | `internal/commands/project/list.go` | `workspaces/queries:getUserWorkspaces`, `projects/queries:getWorkspaceProjects` |
| `ltf project select` | `internal/commands/project/select.go` | Same + `api.SaveContext` |
| `ltf project info` | `internal/commands/project/info.go` | `projects/queries:getProject` |
| `ltf project detect` | `internal/commands/project/detect.go` | Git remote parsing + project search |

### Task (9 commands)

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf task list` | `internal/commands/task/list.go` | `tasks/queries:getProjectTasks` |
| `ltf task create` | `internal/commands/task/create.go` | `tasks/mutations:createTask` |
| `ltf task view` | `internal/commands/task/view.go` | `tasks/queries:getTask` |
| `ltf task update` | `internal/commands/task/update.go` | `tasks/mutations:updateTask` |
| `ltf task done` | `internal/commands/task/done.go` | `tasks/mutations:updateTask` (status=done) |
| `ltf task assign` | `internal/commands/task/assign.go` | `tasks/mutations:updateTask` |
| `ltf task delete` | `internal/commands/task/delete.go` | `tasks/mutations:deleteTask` |
| `ltf task comment` | `internal/commands/task/comment.go` | `comments/mutations:createComment` |
| `ltf task mine` | `internal/commands/task/mine.go` | `tasks/queries:getMyTasks` |

### Sprint (7 commands)

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf sprint list` | `internal/commands/sprint/list.go` | `sprints/queries:getProjectSprints` |
| `ltf sprint status` | `internal/commands/sprint/status.go` | `sprints/queries:getCurrentSprint` |
| `ltf sprint create` | `internal/commands/sprint/create.go` | `sprints/mutations:createSprint` |
| `ltf sprint add` | `internal/commands/sprint/add.go` | `sprints/mutations:addTasksToSprint` |
| `ltf sprint close` | `internal/commands/sprint/close.go` | `sprints/mutations:updateSprint` |
| `ltf sprint remove` | `internal/commands/sprint/remove.go` | `sprints/mutations:removeTaskFromSprint` |
| `ltf sprint backlog` | `internal/commands/sprint/backlog.go` | `sprints/queries:getBacklogTasks` |

### Time (5 commands)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf time start` | `internal/commands/time/start.go` | Local timer in config |
| `ltf time stop` | `internal/commands/time/stop.go` | Computes elapsed, optionally submits |
| `ltf time status` | `internal/commands/time/status.go` | Shows running timer |
| `ltf time log` | `internal/commands/time/log.go` | `timeEntries/mutations:createManualEntry` |
| `ltf time report` | `internal/commands/time/report.go` | `timeEntries/queries:getTimeStatsByUser` |

### Git (6 commands)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf git link` | `internal/commands/git/link.go` | Parse branch, link to task |
| `ltf git sync` | `internal/commands/git/sync.go` | Sync git activity |
| `ltf git hooks` | `internal/commands/git/hooks.go` | Install/uninstall hooks |
| `ltf git status` | `internal/commands/git/status.go` | Show git + task status |
| `ltf git config` | `internal/commands/git/config.go` | Git integration settings |
| `ltf git hook-handler` | `internal/commands/git/hookhandler.go` | Internal hook callback |

### AI (3 commands)

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf ai suggest` | `internal/commands/ai/suggest.go` | `ai/actions:suggestTasks` |
| `ltf ai analyze` | `internal/commands/ai/analyze.go` | `ai/actions:analyzeTask` |
| `ltf ai describe` | `internal/commands/ai/describe.go` | `ai/actions:generateDescription` |

### Agent (3 commands) — NEW

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf agent triage` | `internal/commands/agent/triage.go` | `agent/queries:getTriageQueue` |
| `ltf agent suggest` | `internal/commands/agent/suggest.go` | `agent/actions:suggestNextActions` |
| `ltf agent status` | `internal/commands/agent/status.go` | `agent/queries:getAgentActivityFeed` |

### Skill (3 commands) — NEW

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf skill list` | `internal/commands/skill/list.go` | `skills/queries:getUserSkills` |
| `ltf skill run` | `internal/commands/skill/run.go` | `skills/mutations:runSkill` |
| `ltf skill create` | `internal/commands/skill/create.go` | `skills/mutations:createSkill` |

### Daemon (4 commands)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf daemon start` | `internal/commands/daemon/start.go` | Fork background process |
| `ltf daemon stop` | `internal/commands/daemon/stop.go` | Kill PID from config |
| `ltf daemon status` | `internal/commands/daemon/status.go` | Check PID alive |
| `ltf daemon logs` | `internal/commands/daemon/logs.go` | Tail log file |

### Search (1 command)

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf search <query>` | `internal/commands/search/search.go` | `search:globalSearch` |

### Notifications (3 commands)

| TS Command | Go Package | Convex Calls |
|-----------|------------|--------------|
| `ltf notifications list` | `internal/commands/notifications/list.go` | `notifications/queries:getNotifications` |
| `ltf notifications read` | `internal/commands/notifications/read.go` | `notifications/mutations:markAsRead` |
| `ltf notifications clear` | `internal/commands/notifications/clear.go` | `notifications/mutations:markAllAsRead` |

### Config (5 commands)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf config list` | `internal/commands/config/list.go` | Print full config JSON |
| `ltf config get <key>` | `internal/commands/config/get.go` | Dot notation access |
| `ltf config set <key> <value>` | `internal/commands/config/set.go` | Dot notation set |
| `ltf config path` | `internal/commands/config/path.go` | `api.GetConfigPath()` |
| `ltf config reset` | `internal/commands/config/reset.go` | Delete config file |

### Completions (4 commands)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf completions bash` | Built into Cobra | `cobra.GenBashCompletion` |
| `ltf completions zsh` | Built into Cobra | `cobra.GenZshCompletion` |
| `ltf completions fish` | Built into Cobra | `cobra.GenFishCompletion` |
| `ltf completions install` | Custom helper | Detect shell + install |

### Release (1 command)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf release notes` | `internal/commands/release/notes.go` | GitHub commit history |

### PR (1 command)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf pr create` | `internal/commands/pr/create.go` | GitHub API + task linking |

### Update (1 command)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf update` | `internal/commands/update/update.go` | Check npm version, prompt |

### Dashboard (1 command)

| TS Command | Go Package | Notes |
|-----------|------------|-------|
| `ltf dashboard` | `internal/commands/dashboard/dashboard.go` | Launch existing TUI |
| `ltf` (no args) | Default action in root | Same as `ltf dashboard` |

**Total: 64 subcommands across 18 groups**

---

## Migration Phases

### Phase 1: Foundation
1. Add `github.com/spf13/cobra` to go.mod
2. Create `cmd/ltf/main.go` with Cobra root
3. Create `internal/commands/root.go` with global flags
4. Create `internal/commands/helpers.go` with auth helpers
5. Create `internal/output/` package
6. Update root `main.go` to call `cmd/ltf` Execute

### Phase 2: Build All Commands
7. Implement all 18 command groups in parallel
8. Each group gets its own package and parent command file

### Phase 3: Compile and Fix
9. Run `go build ./...`
10. Fix import errors, unused vars, type mismatches
11. Verify all commands resolve and help text works

### Phase 4: Cleanup
12. Delete `apps/cli/` entirely
13. Update root `package.json` to remove cli workspace
14. Update `pnpm-workspace.yaml`
15. Update README references

### Phase 5: Logo Replacement
16. Replace LTF1 ASCII in Go TUI login screen

### Phase 6: Build & Test
17. `cd apps/tui && go build -o ltf .`
18. Test bare `ltf` (launches TUI)
19. Test `ltf auth status`, `ltf task list --help`, etc.
20. Test help output

### Phase 7: Commit & Push
21. Single commit with the full migration
22. Push to `developement` branch

---

## Testing Strategy

For each command, verify:
1. `ltf <group> --help` shows help text
2. `ltf <group> <subcommand> --help` shows subcommand help
3. Commands that require auth fail gracefully without auth
4. Commands that require project context fail gracefully without context
5. `--json` flag outputs valid JSON
6. Bare `ltf` still launches the TUI

---

## Risks

1. **Convex API mismatches**: Some TypeScript functions may have signatures different from what I expect. Mitigation: read each TS command file, match args exactly.
2. **Daemon process forking**: Forking on Windows is different from Unix. Mitigation: use `os/exec` with platform-specific handling.
3. **Git operations**: Need a Go git library. Use `github.com/go-git/go-git/v5` or shell out to `git` binary.
4. **Time zone handling**: Date parsing across platforms. Use `time.Parse` with explicit formats.
5. **Cobra learning curve**: Standard library, well-documented, low risk.

---

## Success Criteria

- [ ] All 64 commands compile and execute
- [ ] `ltf --help` lists all 18 command groups
- [ ] Bare `ltf` launches TUI (preserved behavior)
- [ ] `apps/cli/` is deleted
- [ ] Root `package.json` no longer references `apps/cli`
- [ ] Cross-platform builds work (linux, darwin, windows)
- [ ] Single commit on `developement` branch
