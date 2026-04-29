# Phase 5 - Cross-Cutting Findings

Date: 2026-04-29
Scope: Cross-cutting concerns across TUI, web, mobile, backend contracts, tooling, docs, and dependency hygiene.
Backend contract source of truth: `reviews/01-backend-map.md`.

## 1. Shared code drift: types/schemas defined per-surface diverging from backend.

### Finding D-001: Shared task types still model deprecated single-assignee fields as primary contract

- **Severity:** Medium
- **Surface:** Cross-cutting
- **Category:** Bug | DX
- **Location:** `packages/types/src/entities/index.ts`:108-131; `packages/types/src/api/index.ts`:53-79; `reviews/01-backend-map.md`:36,273
- **Observed behavior:** Shared `Task` and request types expose `assigneeId?: string` but do not expose `assigneeIds`, even though the backend contract says tasks carry `assigneeIds` and `assigneeId` is deprecated/backward-compatible only.
- **Expected behavior:** Shared types should match the backend contract by making `assigneeIds` the primary assignment field while keeping `assigneeId` only where legacy compatibility is explicitly required.
- **Impact:** Surfaces importing `@ltf1/types` are nudged toward old single-assignee behavior, which can drop multi-assignee data or produce mutations that do not represent the current backend contract.
- **Root cause hypothesis:** The shared package predates the task assignment migration and has not been regenerated or manually reconciled with Convex schema/API changes.
- **Proposed fix:** Reconcile `@ltf1/types` against `reviews/01-backend-map.md` and generated Convex types, adding `assigneeIds` to task entities and create/update request shapes. Keep `assigneeId` marked deprecated only for legacy reads/writes until migration completes.
- **Risk of fix:** Existing code typed against `assigneeId` will need updates; web, mobile, TUI typecheck/build and task assignment flows must be verified.
- **Estimated effort:** M

### Finding D-002: Mobile project detail expects project fields outside the backend contract

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** Bug
- **Location:** `apps/mobile/app/project/[id].tsx`:159-167; `reviews/01-backend-map.md`:33,123
- **Observed behavior:** Mobile reads `project.lead`, `project.methodology`, and `project.repositoryUrl` from `getProject`; the backend map describes `projects` fields such as `leadId`, `repository`, `settings`, `teamSettings`, and `metadata`, not these flattened display fields.
- **Expected behavior:** Mobile should consume the `getProject` response shape from the backend contract or use documented projected fields only.
- **Impact:** Project detail can silently omit lead/workflow/repository data or display stale information, because the UI relies on `any` casts instead of contract-backed types.
- **Root cause hypothesis:** Mobile UI was built from a convenience/view-model shape that was never codified in the backend contract.
- **Proposed fix:** Define a mobile-safe project view model in the backend contract or adjust mobile to read documented fields such as `repository.url` and settings-derived methodology.
- **Risk of fix:** Field remapping can affect project details, repository links, and team display; verify mobile project detail against real project documents.
- **Estimated effort:** S

## 2. Inconsistent UX vocabulary across surfaces.

### Finding D-003: Repo documentation describes a different CLI/TUI technology and command vocabulary than the shipped app

- **Severity:** Medium
- **Surface:** Cross-cutting
- **Category:** Docs | UX
- **Location:** `README.md`:15-19,63-71,77-93; `reviews/00-recon.md`:49-55,128-133
- **Observed behavior:** README says the CLI/TUI is `apps/cli`, built with Commander.js and Ink, and installs `@vvg-ltf1/cli` while launching `ltf`; recon shows the actual surface is `apps/tui`, implemented in Go with Cobra/Bubble Tea, and the command tree uses `ltf1`.
- **Expected behavior:** User-facing docs should consistently name the actual CLI/TUI surface, installation package, technology, and executable names.
- **Impact:** New contributors and users follow stale setup instructions, which is especially damaging for a terminal-first product where CLI naming is core UX.
- **Root cause hypothesis:** README copy was written for an earlier JS/Ink CLI and not updated after the Go TUI rewrite.
- **Proposed fix:** Update docs to describe `apps/tui`, Go/Cobra/Bubble Tea, and the correct executable/package names; remove or explicitly mark old `ltf` references if only aliases remain.
- **Risk of fix:** Low; verify README commands against the current TUI binary and package publishing workflow.
- **Estimated effort:** S

### Finding D-004: Status labels vary across surfaces despite shared backend state machines

- **Severity:** Low
- **Surface:** Cross-cutting
- **Category:** UX
- **Location:** `apps/mobile/app/project/[id].tsx`:31-38; `apps/mobile/app/task/[id].tsx`:32-39; `apps/web/src/components/features/task/TaskDetailModal.tsx`:156-197; `reviews/01-backend-map.md`:216
- **Observed behavior:** Mobile project groups render all-caps labels like `TODO` and `IN REVIEW`, mobile task chips render title case labels like `Todo` and `In Review`, and web task detail renders raw `task.status.replace('_', ' ')`, producing lowercase labels such as `in review`.
- **Expected behavior:** All surfaces should share consistent display vocabulary for backend task statuses `backlog`, `todo`, `in_progress`, `in_review`, `done`, and `cancelled`.
- **Impact:** Users moving between web, mobile, and TUI see the same state represented differently, weakening recognition and making docs/screenshots harder to align.
- **Root cause hypothesis:** Each surface defines its own status display map instead of using a shared presentation dictionary.
- **Proposed fix:** Add a shared status label map in a cross-platform package or document a design-system vocabulary, then use it across web/mobile/TUI.
- **Risk of fix:** Low; snapshot/UI tests should confirm labels in common task views.
- **Estimated effort:** S

## 3. Inconsistent error messages for same backend error.

### Finding D-005: TUI configuration errors use multiple messages for the same missing Convex URL state

- **Severity:** Low
- **Surface:** TUI
- **Category:** UX | DX
- **Location:** `apps/tui/internal/commands/taskcmd/task.go`:45; `apps/tui/internal/tui/app.go`:220; `apps/tui/internal/commands/timecmd/time.go`:82; `apps/tui/internal/commands/gitcmd/link.go`:42
- **Observed behavior:** Missing Convex URL is reported as `CONVEX_URL not configured`, `CONVEX_URL not configured. Set it in your environment or ~/.ltf1.env`, and `CONVEX_URL not set` depending on command path.
- **Expected behavior:** The same setup failure should use one actionable error message across all TUI commands.
- **Impact:** Users get inconsistent remediation instructions and support/docs cannot quote a single canonical error.
- **Root cause hypothesis:** Each command group created local auth/client helpers and hand-authored its own error text.
- **Proposed fix:** Centralize TUI auth/config loading and expose one canonical missing-url error with the supported env/config sources.
- **Risk of fix:** Low; run TUI command smoke tests for task, project, git, time, and dashboard paths.
- **Estimated effort:** S

### Finding D-006: Frontends collapse distinct backend auth/not-found failures into generic messages

- **Severity:** Medium
- **Surface:** Web | Mobile | TUI
- **Category:** UX | Bug
- **Location:** `apps/mobile/app/task/[id].tsx`:76-139; `apps/web/src/components/features/task/TaskDetailModal.tsx`:107-122,312-320; `apps/tui/internal/api/client.go`:100-130; `reviews/01-backend-map.md`:196,274
- **Observed behavior:** Mobile catches all task mutation failures and shows generic connection messages; web often shows raw `err.message` or a generic fallback; TUI returns raw `convex error: ...`. The backend contract explicitly notes auth failures vary between thrown errors, `null`, and `[]`.
- **Expected behavior:** Surfaces should normalize common backend outcomes such as unauthenticated, unauthorized, not found, validation failure, and network failure into consistent user-facing messages.
- **Impact:** Users may be told to check their connection for permission or validation errors, while TUI users see backend implementation text.
- **Root cause hypothesis:** No shared client-side error normalization layer exists across Convex React clients and the TUI HTTP client.
- **Proposed fix:** Define a small cross-surface error taxonomy and map Convex errors/null results into canonical messages per action context.
- **Risk of fix:** Medium; changing displayed errors can affect tests and support copy, so verify auth expiration, permission denial, not found, and offline paths.
- **Estimated effort:** M

## 4. Inconsistent date/time/number/currency formatting.

### Finding D-007: Date and duration formatting is hand-rolled differently per surface

- **Severity:** Medium
- **Surface:** Cross-cutting
- **Category:** UX | i18n
- **Location:** `apps/tui/internal/output/format.go`:8-42,56-65; `apps/mobile/lib/utils.ts`:7-37; `apps/web/src/components/features/task/TaskDetailModal.tsx`:24,382,409,469-470; `apps/web/src/pages/ImportPage.tsx`:163-164
- **Observed behavior:** TUI formats dates as fixed `YYYY-MM-DD` and relative values like `5m ago`; mobile uses `date-fns` formats like `MMM d`; web mixes `date-fns` hard-coded formats with `new Date(...).toLocaleString()`.
- **Expected behavior:** Dates, relative times, durations, numbers, and future currency values should be formatted through a shared policy that specifies locale, timezone, and style per context.
- **Impact:** The same timestamp can appear differently across surfaces and machines, causing confusion in imports, time tracking, due dates, and audit/history views.
- **Root cause hypothesis:** Formatting utilities grew independently in TUI, mobile, and web.
- **Proposed fix:** Introduce a documented formatting contract and shared TS utilities where possible; mirror the same policy in Go for TUI.
- **Risk of fix:** Medium; time-sensitive UI snapshots and user expectations may change, so verify task detail, import history, notifications, and time reports.
- **Estimated effort:** M

## 5. i18n: hard-coded strings, missing translations, pluralization, RTL, locale-specific formatting.

### Finding D-008: No i18n layer exists despite extensive hard-coded UI strings and pluralization

- **Severity:** Medium
- **Surface:** Cross-cutting
- **Category:** i18n | UX
- **Location:** `apps/web/package.json`:13-55; `apps/mobile/package.json`:15-43; `apps/web/src/components/features/task/TaskDetailModal.tsx`:116,166-170,503-504; `apps/mobile/app/project/[id].tsx`:149-156,269; `apps/mobile/app/task/[id].tsx`:122-139,441-446
- **Observed behavior:** Web and mobile dependencies do not include an i18n framework, and UI copy/plurals are embedded directly in components, for example `action${... ? 's' : ''}`, `Task comments and collaboration features`, and mobile alert/accessibility strings.
- **Expected behavior:** If the product intends locale support, user-facing strings, pluralization, RTL layout considerations, and locale-sensitive formatting should be centralized behind translation/formatting primitives.
- **Impact:** Localization would require invasive component edits, plural rules are English-only, and accessibility labels cannot be translated consistently.
- **Root cause hypothesis:** MVP UI was authored in English without an i18n requirement or extraction process.
- **Proposed fix:** Decide whether i18n is in scope. If yes, add a translation framework/process and migrate high-traffic strings first; if not, document English-only support explicitly.
- **Risk of fix:** Large migration can touch many files and affect snapshots; start with infrastructure plus a small pilot surface.
- **Estimated effort:** L

## 6. Logging and observability: PII in logs, missing correlation IDs, error tracking missing, log level misuse.

### Finding D-009: Client analytics and console logging include user/provider identifiers without a documented redaction policy

- **Severity:** Medium
- **Surface:** Web
- **Category:** Security | DX
- **Location:** `apps/web/src/pages/GitHubCallbackPage.tsx`:61,69,86,93-97; `apps/web/src/components/onboarding/OnboardingFlow.tsx`:1572-1589; `apps/web/src/services/openRouterService.ts`:69-72,111-113,200-202,257-259
- **Observed behavior:** Web sends GitHub installation IDs, GitHub usernames, OAuth error text, onboarding intents/team size, and raw error objects to PostHog or `console.error`. No error-tracking integration, correlation ID, redaction helper, or log-level policy is visible in the audited paths.
- **Expected behavior:** Observability should minimize PII, redact provider errors/secrets, attach correlation IDs for supportable failures, and route production errors to a controlled error tracker.
- **Impact:** Sensitive operational/user metadata can leak into browser logs or analytics, while support still lacks consistent event IDs to trace cross-surface failures.
- **Root cause hypothesis:** Analytics and debugging were added feature-by-feature without a shared telemetry policy.
- **Proposed fix:** Define telemetry rules, add redaction helpers, avoid logging raw provider errors, and introduce error tracking with request/session correlation across backend and clients.
- **Risk of fix:** Medium; analytics dashboards may change and debugging detail may be reduced, so validate key onboarding/GitHub funnels.
- **Estimated effort:** M

### Finding D-010: Public web service performs AI provider calls from the browser with a Vite-exposed key

- **Severity:** High
- **Surface:** Web
- **Category:** Security | Bug
- **Location:** `apps/web/src/services/openRouterService.ts`:26-64,244-260; `reviews/01-backend-map.md`:155-164,230-243
- **Observed behavior:** `OpenRouterService` reads `import.meta.env.VITE_OPENROUTER_API_KEY`, sends it as a browser `Authorization` header, and calls OpenRouter directly for task/PR/velocity/release-note features.
- **Expected behavior:** AI provider access should go through backend actions/key-management described in the backend contract, so provider secrets are server-side and authorization/usage tracking can be enforced.
- **Impact:** Any shipped `VITE_OPENROUTER_API_KEY` is exposed to every browser user, bypassing backend usage controls, audit logs, and BYOK scoping.
- **Root cause hypothesis:** A frontend prototype service was left wired as a production service instead of being migrated to Convex actions.
- **Proposed fix:** Remove browser-side provider secrets and route these calls through authenticated backend AI actions with usage tracking and safe error handling.
- **Risk of fix:** Medium; AI feature latency/error behavior changes and existing frontend call sites need backend-compatible response shapes.
- **Estimated effort:** M

### Finding D-021: Production access gate is client-side only and exposes its default access code

- **Severity:** High
- **Surface:** Web | Cross-cutting
- **Category:** Security | Bug
- **Location:** `apps/web/src/components/common/ProductionAccessGate.tsx`:10-13,31-33; `.env.example`:44-48
- **Observed behavior:** The production access gate reads `VITE_ACCESS_CODE` in the browser bundle, falls back to a hard-coded default code, and stores the unlocked state in `sessionStorage`. The example env file documents the default code value.
- **Expected behavior:** Any production access control boundary should be enforced server-side or at the edge. Client-side gates can be cosmetic only and must not be documented or treated as protection for non-public production content.
- **Impact:** Users can read or bypass the access code from the client bundle/devtools and set `ltf1_access_unlocked` manually, so the gate does not protect private launches, previews, or staged production data.
- **Root cause hypothesis:** An early-access UX gate was implemented as a frontend affordance and then configured with secret-like Vite environment variables.
- **Proposed fix:** Move access enforcement to hosted middleware/edge/server auth or remove security language around the gate and treat it as cosmetic. Remove the hard-coded fallback access code.
- **Risk of fix:** Medium; real server-side gating can affect preview/prod routing and needs deployment configuration verification.
- **Estimated effort:** S

## 7. Dependency hygiene: duplicate dependencies with different versions, deprecated/unmaintained packages, known CVEs.

### Finding D-011: Core dependencies drift across root, web, and mobile packages

- **Severity:** Medium
- **Surface:** Cross-cutting
- **Category:** DX | Security
- **Location:** `package.json`:29-42; `apps/web/package.json`:29,39-40,63; `apps/mobile/package.json`:22,36-37
- **Observed behavior:** Convex is declared as `^1.13.0` at root, `^1.25.4` in web, and `^1.17.0` in mobile. React is `^18.2.0` in web while mobile pins `18.3.1`. Web uses ESLint `^8.56.0`, an old major with known ecosystem maintenance pressure by 2026.
- **Expected behavior:** Shared runtime libraries, especially Convex client/generator packages, should be version-aligned or explicitly pinned with a compatibility rationale.
- **Impact:** Generated API/client behavior can differ by surface, dependency resolution becomes harder to reason about, and security/bugfix uptake is inconsistent.
- **Root cause hypothesis:** Surface packages were updated independently without a monorepo dependency policy.
- **Proposed fix:** Establish a version alignment policy for Convex, React-family packages where applicable, and lint tooling; use workspace catalog/overrides if needed.
- **Risk of fix:** Medium; dependency upgrades can surface type/build/runtime differences, so run root install, web/mobile typecheck/build, and TUI unaffected checks.
- **Estimated effort:** M

### Finding D-012: Security audit is not currently a reliable gate

- **Severity:** Low
- **Surface:** Cross-cutting
- **Category:** Security | DX
- **Location:** `package.json`:6-16; `.github/workflows/claude.yml`:13-49; `.github/workflows/claude-code-review.yml`:13-56
- **Observed behavior:** There is no package script or CI step for dependency auditing. A non-mutating `pnpm audit --audit-level moderate` attempt during this review timed out after 120 seconds, so current known-CVE status could not be established from the repo workflow.
- **Expected behavior:** Dependency audit should be a repeatable, non-mutating local/CI command with known timeout/cache behavior and documented exceptions.
- **Impact:** Known vulnerable packages may remain unnoticed, and reviewers cannot distinguish a clean dependency tree from an un-auditable one.
- **Root cause hypothesis:** Build/lint/typecheck/test gates were never added to CI, so audit gating was also omitted.
- **Proposed fix:** Add a dedicated audit command and CI job with sensible timeout, caching, and documented allowlist process.
- **Risk of fix:** Low to medium; initial audit may fail due latent advisories and require triage.
- **Estimated effort:** S

### Finding D-013: Secret-looking local key and env files are present inside the repo workspace

- **Severity:** High
- **Surface:** Cross-cutting
- **Category:** Security
- **Location:** `.gitignore`:19,33-37; `.env`:1; `apps/mobile/.env`:1; `ltf1-integration.2025-12-06.private-key.pem`:1; `temp_key.pem`:1; `temp_key_new.pem`:1
- **Observed behavior:** The workspace contains `.env`, `apps/mobile/.env`, and multiple `.pem` private-key-looking files. `git ls-files` did not show them as tracked, and `.gitignore` ignores env/PEM patterns, but they still reside in the repository directory.
- **Expected behavior:** Secrets and private keys should not live under the repo root, even if ignored; local secret storage should use external secure locations or documented `.env` templates only.
- **Impact:** Keys can be accidentally added with force-add, copied into artifacts, included in ad hoc zips, exposed to local tooling, or leaked through AI/editor integrations.
- **Root cause hypothesis:** Integration/private keys were generated or staged in the project root during setup and never moved to a safer location.
- **Proposed fix:** Move local secrets outside the repo workspace, rotate any keys that may have been exposed, and document safe secret paths/handling.
- **Risk of fix:** Medium; moving keys can break local integration setup until env paths are updated.
- **Estimated effort:** S

## 8. Build and CI: flaky/slow tests, missing coverage, missing CI per surface, secrets in CI logs, Docker root/high-CVE images.

### Finding D-014: CI does not gate any surface with build, lint, typecheck, test, audit, or coverage

- **Severity:** High
- **Surface:** Cross-cutting
- **Category:** Tests | DX
- **Location:** `.github/workflows/claude.yml`:13-49; `.github/workflows/claude-code-review.yml`:13-56; `turbo.json`:4-18; `reviews/00-recon.md`:136-145,224-372
- **Observed behavior:** The only workflows run Claude actions. Recon shows root `pnpm test` executes zero tasks, root typecheck/build/lint are red, web typecheck/lint fail, mobile lint/build fail, and TUI has no test files despite `go test ./...` passing.
- **Expected behavior:** PRs should be gated by deterministic per-surface build, lint, typecheck, test, format-check, audit, and eventually coverage jobs.
- **Impact:** Cross-surface contract drift, dependency issues, and compile failures can merge without automated detection.
- **Root cause hypothesis:** AI review automation was added before conventional CI and local command baselines were made green.
- **Proposed fix:** First fix local command baselines, then add CI jobs for web, mobile, TUI, backend/Convex, shared packages, dependency audit, and coverage reporting.
- **Risk of fix:** High initially because CI will expose current failures; rollout may need staged enforcement.
- **Estimated effort:** M

## 9. Documentation: README/setup/env/contributing docs stale or incomplete.

### Finding D-015: README setup omits mobile and backend-required environment variables

- **Severity:** Medium
- **Surface:** Cross-cutting
- **Category:** Docs | DX
- **Location:** `README.md`:32-61; `.env.example`:1-48; `apps/mobile/lib/convex.ts`:3-5; `apps/mobile/app/_layout.tsx`:11-21; `reviews/01-backend-map.md`:68-104,271-272
- **Observed behavior:** README quick start lists only `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, and `VITE_CLERK_PUBLISHABLE_KEY`. Mobile code requires `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`; backend HTTP routes require secrets such as `CLERK_WEBHOOK_SECRET`, `POLAR_WEBHOOK_SECRET`, `GITHUB_WEBHOOK_SECRET`, and `CLERK_SECRET_KEY` per the backend map.
- **Expected behavior:** Setup docs should distinguish minimal web dev env, mobile env, TUI env, and backend/webhook/integration env requirements.
- **Impact:** Developers can complete README setup and still hit runtime crashes or disabled backend integrations on mobile, TUI, webhooks, billing, and GitHub flows.
- **Root cause hypothesis:** README quick start was not updated as mobile, billing, and integration surfaces were added.
- **Proposed fix:** Split environment documentation by surface and mark optional integrations clearly, with `.env.example` kept in sync.
- **Risk of fix:** Low; verify docs against actual env reads and backend map.
- **Estimated effort:** S

## 10. Backend contract cross-surface adherence: compare TUI Go structs, web/mobile Convex usage, and shared package types against `/home/aansh/LTF1/iceberg-L/reviews/01-backend-map.md`.

### Finding D-016: TUI skill commands call backend functions that are absent from the contract

- **Severity:** High
- **Surface:** TUI
- **Category:** Bug
- **Location:** `apps/tui/internal/commands/skillcmd/skill.go`:49-51,88-96; `reviews/01-backend-map.md`:166
- **Observed behavior:** TUI calls `skills/queries:getUserSkills` and `skills/mutations:runSkill`. The backend contract lists skill functions such as `getWorkspaceSkills`, `getSkillById`, `getBuiltInSkills`, `getPublishedSkills`, `createSkill`, `updateSkill`, `deleteSkill`, `toggleSkill`, `installSkill`, and `executeSkill`, but not `getUserSkills` or `runSkill`.
- **Expected behavior:** TUI should call only public functions present in the backend contract, likely `skills/queries:getWorkspaceSkills` for listing and the documented execute path for running skills.
- **Impact:** `ltf1 skill list` and `ltf1 skill run` can fail at runtime even when auth and workspace context are valid.
- **Root cause hypothesis:** TUI commands were written against an earlier or guessed skill API and were not updated after backend function names changed.
- **Proposed fix:** Update TUI skill command function paths and arguments to the backend contract, and add command smoke tests that fail on missing Convex function paths.
- **Risk of fix:** Medium; execute-skill may be an action rather than mutation and require task context, so CLI UX may need adjustment.
- **Estimated effort:** S

### Finding D-017: TUI sprint page calls nonexistent `tasks:list` instead of scoped task queries

- **Severity:** High
- **Surface:** TUI
- **Category:** Bug
- **Location:** `apps/tui/internal/tui/pages/sprint.go`:42-57; `reviews/01-backend-map.md`:130-136
- **Observed behavior:** The TUI sprint page fetches current sprint via `sprints/queries:getCurrentSprint`, then calls `tasks:list` with no args to populate tasks. The backend contract exposes task queries such as `getProjectTasks`, `getTask`, `getMyTasks`, `getFilteredTasks`, and `getTasksByWorkspace`, not `tasks:list`.
- **Expected behavior:** Sprint view should use documented scoped task APIs, such as `tasks/queries:getProjectTasks` with `projectId` or `sprints/queries:getBacklogTasks` where appropriate.
- **Impact:** Sprint page task data can fail to load entirely or accidentally rely on an obsolete/unscoped endpoint if one exists outside the documented contract.
- **Root cause hypothesis:** Legacy TUI code retained a placeholder task list path after backend routing moved to `tasks/queries`.
- **Proposed fix:** Replace `tasks:list` with the contract-backed query and filter/group tasks by sprint status as needed.
- **Risk of fix:** Low to medium; sprint page UI grouping must be verified with active sprint and backlog data.
- **Estimated effort:** S

### Finding D-018: TUI notification paths do not match the backend contract and are inconsistent within TUI

- **Severity:** High
- **Surface:** TUI
- **Category:** Bug
- **Location:** `apps/tui/internal/tui/pages/notifications.go`:42-58; `apps/tui/internal/commands/notificationscmd/notifications.go`:52-57,96-117; `reviews/01-backend-map.md`:140-142
- **Observed behavior:** The TUI page calls `notifications:getNotifications` and `notifications:markAsRead`, while the TUI command calls `notifications/queries:getNotifications` and `notifications/mutations:markAsRead`. The backend contract lists notification functions under `notificationQueries` (`getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`) plus separate push/config helpers.
- **Expected behavior:** All TUI notification code should use the contract-backed public function paths consistently.
- **Impact:** Notification center and notification commands can fail independently, making unread state unreliable in the terminal surface.
- **Root cause hypothesis:** Notification functions were moved/renamed and only some TUI call sites were partially updated.
- **Proposed fix:** Align TUI paths to the documented `notificationQueries` functions and verify list/read/mark-all behavior.
- **Risk of fix:** Medium; argument names and workspace scoping must match actual validators.
- **Estimated effort:** S

### Finding D-019: TUI agent triage sends inconsistent argument scopes for the same backend function

- **Severity:** Medium
- **Surface:** TUI
- **Category:** Bug
- **Location:** `apps/tui/internal/commands/agent/agent.go`:47-52; `apps/tui/internal/tui/pages/agent.go`:48-58; `convex/agent/queries.ts`:10-68
- **Status:** **Cancelled — not a bug.** Validation against `convex/agent/queries.ts` confirms `getTriageQueue` accepts both `workspaceId: v.optional(v.id("workspaces"))` and `projectId: v.optional(v.id("projects"))`. When only `projectId` is supplied the backend derives the workspace from the project record (lines 58-65). Both TUI call sites — the CLI `ltf1 agent triage` (project-scoped) and the dashboard agent page (workspace-scoped) — therefore exercise the documented contract.
- **Follow-up:** None for this finding. The backend map (`reviews/01-backend-map.md`) already documents both arg shapes via the validator; no client change required.
- **Estimated effort:** S

### Finding D-020: Web references a Convex function name not present in the backend contract

- **Severity:** Medium
- **Surface:** Web
- **Category:** Bug
- **Location:** `apps/web/src/pages/WorkspaceSettingsPage.tsx`:891-894; `reviews/01-backend-map.md`:111-114
- **Observed behavior:** Web calls `api.auth.users.getOrCreateCurrentUser`, but the backend contract lists `getCurrentUser`, `createCurrentUser`, `updateLastSeen`, `getUserById`, `updateUserPreferences`, `makeUserAdmin`, `updateUserProfile`, and `validateGitHubToken`. It does not list `getOrCreateCurrentUser`.
- **Expected behavior:** Web should call only documented public functions or the backend map should be updated if `getOrCreateCurrentUser` is intentionally public.
- **Impact:** Workspace settings can fail typecheck/runtime if the generated API lacks this function, contributing to the web contract failures noted in recon.
- **Root cause hypothesis:** A frontend call site was added against a renamed helper or generated type drift was ignored.
- **Proposed fix:** Reconcile the call with the backend contract, using `getCurrentUser`/`createCurrentUser` flow or documenting the actual function if present.
- **Risk of fix:** Low; verify workspace settings load for authenticated users.
- **Estimated effort:** S
