# Phase 2 - TUI Findings

Date: 2026-04-29
Scope: `apps/tui`
Source-of-truth backend contracts: `reviews/00-recon.md`, `reviews/01-backend-map.md`

## Checklist 1. Rendering correctness: flicker on resize, double-rendering, cursor position bugs, escape sequences leaking into output, ANSI color codes shown literally, broken Unicode/wide-character handling, line-wrap clipping, scrollback corruption.

Findings: A-008.

## Checklist 2. Terminal capability: assumes truecolor when terminal is 8-color, assumes UTF-8 when locale is C, assumes a TTY when stdout is piped, assumes a minimum size without checking COLUMNS/LINES.

Findings: A-001, A-002, A-008.

## Checklist 3. Input handling: key bindings conflicting with terminal defaults (Ctrl-C, Ctrl-Z, Ctrl-D, Ctrl-S/Ctrl-Q), missing escape/back path, paste-as-keystroke bugs, no bracketed paste support, mouse mode left enabled on exit.

No issues found.

## Checklist 4. Lifecycle: terminal state restoration on crash (alt-screen, raw mode, mouse mode, hidden cursor), signal handling (SIGINT, SIGTERM, SIGWINCH, SIGHUP), graceful shutdown, no zombie subprocesses.

Findings: A-003.

## Checklist 5. Concurrency: input/render races, interleaved partial writes across goroutines/tasks/threads.

No issues found.

## Checklist 6. UX: feedback on long operations, progress indicator, cancellation, useful error messages, help text, consistent key bindings, --help, --version, documented exit codes, stdout/stderr separation.

Findings: A-001, A-003, A-007, A-009.

## Checklist 7. Accessibility: color-only signaling, sighted-user assumptions, NO_COLOR support, contrast on light terminals.

Findings: A-002.

## Checklist 8. Edge cases: zero-width/one-line/tall terminal, resize mid-operation, network drop mid-stream, server unexpected shape.

Findings: A-007, A-008.

## Checklist 9. Backend contract adherence: every server call must match /home/aansh/LTF1/iceberg-L/reviews/01-backend-map.md. Mismatches are findings.

Findings: A-004, A-005, A-006, A-010.

### Finding A-001: Default command launches the interactive TUI even when stdout is not a terminal

- **Severity:** Medium
- **Surface:** TUI
- **Category:** UX | Bug
- **Location:** `apps/tui/internal/commands/root.go`:52-55; `apps/tui/internal/commands/dashboardcmd/dashboard.go`:49-51
- **Observed behavior:** The root command's default `RunE` always calls `dashboardcmd.Launch(DefaultConvexURL)`, and `Launch` always constructs `tea.NewProgram(m)` without checking whether stdin/stdout are TTYs. If `ltf1` is invoked from a script, pipe, or command substitution, it still attempts to start the alternate-screen interactive UI.
- **Expected behavior:** Interactive TUI mode should only start when attached to a usable terminal, or it should fail with a clear message telling users to run an explicit non-interactive subcommand. This follows the terminal-capability checklist item requiring no TTY assumptions.
- **Impact:** Scripts and automation can hang or receive raw terminal control behavior instead of predictable stdout. Users running `ltf1 | tee log` or invoking the binary from CI get an interactive program rather than useful command output.
- **Root cause hypothesis:** The CLI default was optimized for interactive local use and never added an `isatty` guard or non-interactive fallback.
- **Proposed fix:** Before launching Bubble Tea, check stdin and stdout terminal status. If either stream is non-interactive, return a concise error or print `--help`/recommended commands; keep `ltf1 dashboard` as the explicit interactive entry point.
- **Risk of fix:** Users who intentionally launch the TUI through unusual terminal wrappers may need an override flag; test normal terminal launch, piped stdout, redirected stdin, and `ltf1 dashboard`.
- **Estimated effort:** S

### Finding A-002: `--no-color` and `NO_COLOR` are not wired into CLI output, and TUI colors are hard-coded

- **Severity:** Medium
- **Surface:** TUI
- **Category:** A11y | UX
- **Location:** `apps/tui/internal/commands/root.go`:69-71; `apps/tui/internal/output/colors.go`:32-45; `apps/tui/internal/tui/theme/colors.go`:5-44
- **Observed behavior:** The root command defines `--no-color`, and `output.SetNoColor` checks `NO_COLOR`, but no caller invokes `output.SetNoColor(commands.IsNoColor())`. As a result, command output continues to emit ANSI color sequences even when `--no-color` is passed or `NO_COLOR` is set. The interactive theme also uses fixed hex colors throughout `theme/colors.go` without an explicit no-color or low-color path.
- **Expected behavior:** `--no-color` and `NO_COLOR` should suppress decorative ANSI color in command output and provide an accessible TUI palette mode. The checklist explicitly requires `NO_COLOR` support and avoiding terminal color assumptions.
- **Impact:** Users with screen readers, monochrome/low-color terminals, log collectors, or terminals with light backgrounds can get unreadable or noisy output. The advertised `--no-color` flag currently does not deliver its promised behavior.
- **Root cause hypothesis:** The color-disabling utility was added after the root flag but never connected during command initialization, and the TUI theme does not centralize terminal capability/accessibility policy.
- **Proposed fix:** Call `output.SetNoColor(flagNoColor)` before command execution and make TUI theme construction respect `NO_COLOR`/color profile capability. Preserve semantic text labels/icons so status is not color-only.
- **Risk of fix:** Snapshot-like CLI output expectations may change; test colored default output, `--no-color`, `NO_COLOR=1`, JSON output, and at least one TUI launch on dark and light terminals.
- **Estimated effort:** S

### Finding A-003: Browser login ignores local server startup failures and can wait five minutes on a dead callback

- **Severity:** Medium
- **Surface:** TUI
- **Category:** UX | Bug
- **Location:** `apps/tui/internal/tui/login.go`:210-258; `apps/tui/internal/commands/auth/login.go`:70-101
- **Observed behavior:** Both browser-login flows start a localhost callback server in a goroutine and ignore the return value from `ListenAndServe`. In the TUI flow, `go server.ListenAndServe()` is called and the program immediately opens the browser, then waits up to five minutes for `resultCh`. In the CLI flow, the browser opens before `ListenAndServe` starts at lines 93-95, and that server error is still ignored. If port `9876` is already in use or binding is denied, there is no immediate error and the user waits for a timeout.
- **Expected behavior:** Startup failure should be reported immediately, and shutdown should distinguish expected `http.ErrServerClosed` from real listener errors. Long operations should provide actionable feedback and cancellation.
- **Impact:** Users on machines with port conflicts, locked-down localhost policies, or stale callback processes see an authentication flow that appears to hang. This is common enough for developer machines because fixed localhost auth ports collide easily.
- **Root cause hypothesis:** The auth flow treats the server goroutine as fire-and-forget and only models successful callback or timeout outcomes.
- **Proposed fix:** Create the listener before opening the browser, return bind errors synchronously, and route unexpected server errors into the same result channel. Include a short message naming the failed port and suggesting retry or override.
- **Risk of fix:** The auth flow timing changes slightly; test successful browser login, invalid CSRF state, port already in use, browser-open failure, and timeout cancellation.
- **Estimated effort:** S

### Finding A-004: Sprint page calls a task function that is not in the backend contract

- **Severity:** High
- **Surface:** TUI
- **Category:** Bug
- **Location:** `apps/tui/internal/tui/pages/sprint.go`:46-57
- **Observed behavior:** The sprint page fetches the active sprint with `sprints/queries:getCurrentSprint`, then calls `p.client.Query("tasks:list", nil)` for tasks. `reviews/01-backend-map.md` lists task queries as `tasks.queries`: `getProjectTasks`, `getTask`, `getMyTasks`, `getTaskTimeEntries`, `getActiveTimeEntry`, `getFilteredTasks`, `getWorkspaceLabels`, `getTasksByUser`, and `getTasksByWorkspace`; it does not define `tasks:list`.
- **Expected behavior:** Every server call must match `reviews/01-backend-map.md`. To populate sprint tasks, the TUI should call a listed task query such as `tasks/queries:getProjectTasks` with the selected `projectId`, or `sprints/queries:getBacklogTasks` where appropriate.
- **Impact:** The sprint page cannot reliably show sprint task contents. Because the error is ignored, users may see an active sprint with empty columns even when tasks exist.
- **Root cause hypothesis:** The page retained an older or placeholder function path after the backend moved task listing under `tasks/queries:getProjectTasks`.
- **Proposed fix:** Replace the invalid function path with a contract-listed query and pass the required arguments. Surface query errors instead of silently dropping them.
- **Risk of fix:** Sprint task filtering may reveal tasks that were previously hidden by the failed call; test active sprint with tasks in `backlog`, `todo`, `in_progress`, `in_review`, `done`, and `cancelled` statuses.
- **Estimated effort:** S

### Finding A-005: Notification TUI and CLI use function paths outside the backend map

- **Severity:** High
- **Surface:** TUI
- **Category:** Bug
- **Location:** `apps/tui/internal/tui/pages/notifications.go`:42-59; `apps/tui/internal/commands/notificationscmd/notifications.go`:52-118
- **Observed behavior:** The notifications page calls `notifications:getNotifications` and `notifications:markAsRead`. The notifications CLI calls `notifications/queries:getNotifications`, `notifications/mutations:markAsRead`, and `notifications/mutations:markAllAsRead`. `reviews/01-backend-map.md` lists this API as `notificationQueries`: `getNotifications`, `getUnreadCount`, `markAsRead`, and `markAllAsRead`.
- **Expected behavior:** TUI notification calls should use the backend-map function location and function names exactly, with arguments matching that contract.
- **Impact:** Notification list/read/clear flows can fail at runtime with Convex path errors, leaving users unable to inspect or mark notifications from the TUI/CLI.
- **Root cause hypothesis:** The client code uses guessed module names from a later or alternate folder layout instead of the documented backend contract.
- **Proposed fix:** Align all notification calls to the backend map and add a small contract test or compile-time generated path helper for TUI HTTP calls.
- **Risk of fix:** If the backend map exposes legacy naming, all affected notification commands need a coordinated smoke test against the deployed backend.
- **Estimated effort:** S

### Finding A-006: Skill CLI calls drift from the backend-map skill contract

- **Severity:** High
- **Surface:** TUI
- **Category:** Bug
- **Location:** `apps/tui/internal/commands/skillcmd/skill.go`:49-127
- **Observed behavior:** The CLI calls `skills/queries:getUserSkills`, `skills/mutations:runSkill`, and `skills/mutations:createSkill` with an incomplete create payload. The backend exposes `getWorkspaceSkills` from `convex/skills/queries.ts`, `createSkill`/`toggleSkill` from `convex/skills/mutations.ts`, and `executeSkill` from `convex/skills/execution.ts`; it does not expose `getUserSkills` or `runSkill`, and `createSkill` requires `displayName` and `actions` in addition to the provided fields.
- **Expected behavior:** Every TUI skill CLI call should use the backend-map skill names and exact validator shapes. Running a skill should call the documented `executeSkill`, not an unlisted `runSkill`.
- **Impact:** Skill listing, creation, and execution can fail at runtime. Users may believe no skills are configured or that execution is broken even when the backend is healthy.
- **Root cause hypothesis:** The TUI implemented skill paths from an assumed folder split and older function names rather than the current backend contract.
- **Proposed fix:** Replace unlisted function names/paths with `skills:<function>` calls per the backend map and update response parsing to the documented shapes.
- **Risk of fix:** Existing deployed backends might differ from the map; validate against the current generated/deployed backend once the documented contract is confirmed.
- **Estimated effort:** S

### Finding A-010: Time tracking CLI calls use nonexistent `timeEntries/queries` and `timeEntries/mutations` modules

- **Severity:** High
- **Surface:** TUI
- **Category:** Bug | Backend contract adherence
- **Location:** `apps/tui/internal/commands/timecmd/log.go`:35; `apps/tui/internal/commands/timecmd/report.go`:31; `apps/tui/internal/commands/timecmd/stop.go`:26
- **Observed behavior:** Time tracking commands call `timeEntries/mutations:createManualEntry` and `timeEntries/queries:getTimeStatsByUser`. The backend file is `convex/timeEntries.ts`, so the public function paths are under `timeEntries:<function>`, not `timeEntries/queries` or `timeEntries/mutations`.
- **Expected behavior:** TUI time commands should call the documented `timeEntries` public functions with arguments matching their validators.
- **Impact:** `ltf1 time log`, `ltf1 time report`, and the server-side part of `ltf1 time stop` can fail at runtime even when auth and local timer state are valid.
- **Root cause hypothesis:** Time tracking code assumed the backend used a `queries`/`mutations` folder split, while the implemented backend keeps all time-entry functions in a single `timeEntries.ts` module.
- **Proposed fix:** Replace the function paths with `timeEntries:createManualEntry` and `timeEntries:getTimeStatsByUser`, then verify argument names against the backend validators.
- **Risk of fix:** Medium; time-entry validators may also require date/time argument normalization beyond the path fix.
- **Estimated effort:** S

### Finding A-007: Several page loaders swallow network and decode errors, rendering empty or stale states

- **Severity:** Medium
- **Surface:** TUI
- **Category:** UX | Bug
- **Location:** `apps/tui/internal/tui/pages/dashboard.go`:46-68; `apps/tui/internal/tui/pages/sprint.go`:42-59; `apps/tui/internal/tui/pages/tasks.go`:72-82; `apps/tui/internal/tui/pages/notifications.go`:42-50; `apps/tui/internal/tui/pages/skills.go`:41-49
- **Observed behavior:** Dashboard and sprint loaders ignore individual query errors and ignored `json.Unmarshal` failures. Tasks, notifications, and skills pages also ignore JSON decode errors after successful HTTP calls. The resulting messages often contain zero-value slices and no error, so the UI exits loading state and renders empty panels.
- **Expected behavior:** Network drops, server errors, and unexpected response shapes should produce visible errors or retry affordances. The edge-case checklist explicitly calls out network drops and server unexpected shapes.
- **Impact:** Users see misleading empty dashboards, empty skill/notification lists, or empty sprint boards instead of knowing that a backend call failed or returned an incompatible shape. This makes backend contract drift harder to diagnose.
- **Root cause hypothesis:** Async fetch commands were written as best-effort aggregations and never propagated partial failures into the page state.
- **Proposed fix:** Check every query and decode error, store the error in the page message/state, and render a concise error with retry instructions. For dashboard aggregation, show partial data only when explicitly marked partial.
- **Risk of fix:** More errors become user-visible; test loading success, unauthorized, network timeout, invalid JSON/value shape, and partial dashboard failures.
- **Estimated effort:** M

### Finding A-008: CLI table/list width calculations break for wide Unicode and very narrow terminals

- **Severity:** Low
- **Surface:** TUI
- **Category:** UI | A11y
- **Location:** `apps/tui/internal/output/table.go`:40-129; `apps/tui/internal/tui/components/listitem.go`:35-47; `apps/tui/internal/tui/components/input.go`:35-42
- **Observed behavior:** `visibleLen` counts runes after stripping ANSI sequences, not terminal cell width, so CJK, emoji, and combining marks are padded incorrectly. `RenderListItem` compares `lipgloss.Width(title)` to `maxTitle`, but truncates by rune count, so wide titles can still exceed the target width. `InputModel.SetWidth` enforces a minimum inner width of 10 even when the containing terminal area is smaller.
- **Expected behavior:** Rendering code should use terminal-cell width consistently and should degrade within zero-width/one-line/narrow terminals without forcing content beyond the available area.
- **Impact:** Users with non-ASCII task titles, project names, or notification text can see ragged tables, clipped rows, or wrapping that corrupts the intended layout. Very narrow terminals can force horizontal overflow.
- **Root cause hypothesis:** Some paths use `lipgloss.Width`, while older table and truncation helpers use simpler rune counting and minimum widths.
- **Proposed fix:** Centralize ANSI-aware cell width and truncation using Lip Gloss/Reflow helpers, and allow tiny widths to render a minimal fallback instead of enforcing normal desktop dimensions.
- **Risk of fix:** Text alignment changes across CLI output; test ASCII, CJK, emoji, combining marks, ANSI-colored statuses, and terminals narrower than 20 columns.
- **Estimated effort:** M

### Finding A-009: Global `--json` flag is exposed but many commands ignore it or define separate local JSON flags

- **Severity:** Low
- **Surface:** TUI
- **Category:** UX | DX
- **Location:** `apps/tui/internal/commands/root.go`:37-40,98-105; `apps/tui/internal/commands/skillcmd/skill.go`:38-75; `apps/tui/internal/commands/notificationscmd/notifications.go`:38-83
- **Observed behavior:** The root command defines persistent `--json` and exposes `commands.IsJSON()`, but subcommands such as `skill list` and `notifications list` define separate local `jsonOut` flags instead. Other commands print text directly without consulting the global flag.
- **Expected behavior:** A persistent global `--json` flag should be honored consistently by subcommands that produce machine-readable data, or it should not be advertised as global.
- **Impact:** Automation cannot rely on one JSON contract across commands. Users can pass `ltf1 --json skill list` and still depend on per-command behavior rather than a consistent output policy.
- **Root cause hypothesis:** JSON output was added incrementally per command after the root persistent flag was introduced.
- **Proposed fix:** Route all command output through a shared output mode and remove duplicate local JSON flags, or scope JSON flags only to commands that implement them.
- **Risk of fix:** CLI output behavior changes; test global and command-local flag placement for list/view/report commands.
- **Estimated effort:** S
