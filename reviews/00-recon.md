# Phase 0 — Repository Reconnaissance

Date: 2026-04-29
Commit reviewed: pending final SHA capture
Workspace: `/home/aansh/LTF1/iceberg-L`

## Target Resolution

The prompt target `./tui` was corrected by the user, but there is no top-level `./tui` directory in this checkout. Actual surface directories discovered during reconnaissance:

- TUI: `apps/tui`
- Web: `apps/web`
- Mobile: `apps/mobile`
- Backend: `convex`, `packages/backend`
- Shared types: `packages/types`
- Report directory: `reviews`
- Changelog path: `CHANGELOG.md`

## Top-Level Tree

Depth 3 snapshot, excluding `.git`, `node_modules`, `dist`, `build`, `target`, and `.venv`:

```text
.
├── .agents/
├── .claude/
├── .github/
│   └── workflows/
│       ├── claude-code-review.yml
│       └── claude.yml
├── ai-system-prompts/
├── apps/
│   ├── mobile/
│   │   ├── android/
│   │   ├── app/
│   │   ├── app.json
│   │   ├── assets/
│   │   ├── babel.config.js
│   │   ├── components/
│   │   ├── eas.json
│   │   ├── global.css
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── metro.config.js
│   │   ├── package.json
│   │   ├── providers/
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   ├── tui/
│   │   ├── cmd/
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── go.mod
│   │   ├── go.sum
│   │   ├── internal/
│   │   └── npm/
│   └── web/
│       ├── .eslintrc.json
│       ├── index.html
│       ├── package.json
│       ├── postcss.config.js
│       ├── public/
│       ├── src/
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vercel.json
│       └── vite.config.ts
├── config/
├── convex/
│   ├── _generated/
│   ├── activities/
│   ├── admin/
│   ├── agent/
│   ├── ai/
│   ├── aiCredits/
│   ├── analytics/
│   ├── auth/
│   ├── billing/
│   ├── comments/
│   ├── communications/
│   ├── community/
│   ├── crons.ts
│   ├── http.ts
│   ├── integrations/
│   ├── lib/
│   ├── meetings/
│   ├── migrations/
│   ├── notifications/
│   ├── projects/
│   ├── schema.ts
│   ├── sprints/
│   ├── tasks/
│   └── workspaces/
├── docs/
├── docs_design/
├── docs_v2/
├── packages/
│   ├── backend/
│   │   ├── convex/
│   │   ├── convex.ts
│   │   ├── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/
│   │   ├── package.json
│   │   ├── src/
│   │   └── tsconfig.json
│   ├── ui/
│   └── utils/
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── package.json
├── scripts/
├── skills/
├── tsconfig.base.json
├── turbo.json
└── vercel.json
```

## Package Managers And Lockfiles

- Root package manager: `pnpm@8.12.0`, declared in `package.json`.
- Workspace file: `pnpm-workspace.yaml`, includes `apps/*` and `packages/*`.
- Lockfile: `pnpm-lock.yaml`.
- Go module: `apps/tui/go.mod`, `apps/tui/go.sum`.
- No Cargo, Go root module, Python project, Podfile, Gradle root, Bun, Yarn, npm lockfiles detected outside ignored folders.

## Frameworks By Surface

- TUI: Go 1.25.3, Cobra CLI, Bubble Tea v2, Bubbles v2, Lip Gloss v2.
- Web: Vite 5, React 18, React Router 6, Convex React, Clerk React, Tailwind CSS, Framer Motion, Zustand, BlockNote, Remotion, React Konva, React Three Fiber.
- Mobile: Expo SDK 52, React Native 0.76.9, Expo Router 4, Clerk Expo, Convex React Clerk, NativeWind, React Native Gesture Handler, Safe Area Context, FlashList.
- Backend: Convex functions under `convex/`, Clerk auth/webhooks, Polar billing webhook, GitHub/GitLab/Jira/Linear/Slack integrations, Resend/web-push/OpenAI dependencies at root.
- Shared packages: `@ltf1/types`, `@ltf1/backend`.

## Tooling And CI

- Build orchestrator: Turbo 1.11 pipeline: `build`, `dev`, `lint`, `typecheck`, `test`, `clean`.
- TypeScript: TS 5.3, strict configs; root has `tsconfig.base.json` but no `tsconfig.json`.
- Lint: Web has `.eslintrc.json`; mobile has a lint script but no ESLint config; backend/types have no lint scripts.
- Formatter: Prettier root script is write-only (`pnpm format`); no committed format-check script.
- Tests: `turbo test` exists at root, but no package defines `test`; no `*.test.*`/`*.spec.*` files discovered.
- TUI Go checks available by convention: `go test ./...`, `go build ./cmd/ltf1`, `go vet ./...`, `gofmt -l .`.
- CI workflows: `.github/workflows/claude-code-review.yml`, `.github/workflows/claude.yml`; both run Claude GitHub actions only, not build/lint/test/typecheck gates.

## Entry Points

- TUI binary: `apps/tui/cmd/ltf1/main.go`; invokes `commands.Execute()`.
- TUI command tree: `apps/tui/internal/commands/root.go`; default command launches dashboard TUI with `dashboardcmd.Launch`.
- Web root: `apps/web/src/main.tsx`; renders `AppWrapper` into `#root`.
- Web routing root: `apps/web/src/App.tsx`.
- Mobile root: `apps/mobile/app/_layout.tsx`; wraps Expo Router slot with GestureHandler, SafeArea, Clerk, Convex providers.
- Mobile initial route: `apps/mobile/app/index.tsx`; redirects based on Clerk auth.
- Backend schema: `convex/schema.ts`.
- Backend HTTP routes: `convex/http.ts`.
- Backend cron jobs: `convex/crons.ts`.
- Convex auth config: `convex/auth.config.ts`.
- Package backend entry: `packages/backend/index.ts` and `packages/backend/convex.ts`.

## Data Layer

- Primary data layer: Convex document database, functions in `convex/`, generated API/types in `convex/_generated`.
- Schema source of truth: `convex/schema.ts` with tables for users, workspaces, members, projects, tasks, sprints, integrations, notifications, documents, whiteboards, billing, AI usage, communications, and more.
- Migration-related files: `convex/migrations.ts`, `convex/migrations/`, and admin cleanup/migration files under `convex/admin/`.
- Background jobs: Convex cron jobs in `convex/crons.ts` for GitHub sync queues, due/overdue reminders, meeting reminders, sprint ending reminders, and daily sprint snapshots.
- External queues/caches: no standalone queue/cache service detected in Phase 0; Convex scheduled jobs and tables appear to be used for background state.

## Commands By Surface

### Root

- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Format-check: missing script; baseline used `pnpm exec prettier --check "**/*.{ts,tsx,md,json}"`
- Dev: `pnpm dev` (persistent, not run during recon)

### TUI (`apps/tui`)

- Build: `go build ./cmd/ltf1`
- Test: `go test ./...`
- Lint: no dedicated lint script; baseline used `go vet ./...`
- Typecheck: covered by `go test ./...`/`go build ./cmd/ltf1`
- Format-check: `gofmt -l .`
- Dev: missing explicit command; default run is `go run ./cmd/ltf1`

### Web (`apps/web`)

- Build: `pnpm --filter @ltf1/web build`
- Test: missing package script
- Lint: `pnpm --filter @ltf1/web lint`
- Typecheck: `pnpm --filter @ltf1/web typecheck`
- Format-check: missing package script; root Prettier check applies
- Dev: `pnpm --filter @ltf1/web dev` (persistent, not run during recon)

### Mobile (`apps/mobile`)

- Build: `pnpm --filter @ltf1/mobile build` (`eas build`; requires missing local `eas` binary/external service)
- Test: missing package script
- Lint: `pnpm --filter @ltf1/mobile lint`
- Typecheck: `pnpm --filter @ltf1/mobile typecheck`
- Format-check: missing package script; root Prettier check applies
- Dev: `pnpm --filter @ltf1/mobile dev` (persistent, not run during recon)

### Backend (`packages/backend`, `convex`)

- Build: missing package script
- Test: missing package script
- Lint: missing package script
- Typecheck: `pnpm --filter @ltf1/backend typecheck`; Convex also has `convex/tsconfig.json` but no root script dedicated to `convex` typecheck
- Format-check: missing package script; root Prettier check applies
- Dev: `pnpm convex:dev` at root; `packages/backend` has `dev` placeholder only

### Shared Types (`packages/types`)

- Build: missing package script
- Test: missing package script
- Lint: missing package script
- Typecheck: `pnpm --filter @ltf1/types typecheck`
- Format-check: missing package script; root Prettier check applies
- Dev: missing

## Baseline Command Results

### `pnpm typecheck`

Status: failed.

Key output:

```text
@ltf1/backend:typecheck: error TS5083: Cannot read file '/home/aansh/LTF1/iceberg-L/tsconfig.json'.
@ltf1/backend:typecheck: error TS6059: File '/home/aansh/LTF1/iceberg-L/convex/activities/schema.ts' is not under 'rootDir' '/home/aansh/LTF1/iceberg-L/packages/backend'.
Failed: @ltf1/backend#typecheck
```

### `pnpm lint`

Status: failed.

Key output:

```text
@ltf1/mobile:lint: ESLint couldn't find a configuration file.
Failed: @ltf1/mobile#lint
```

### `pnpm test`

Status: completed but no tests executed.

Key output:

```text
No tasks were executed as part of this run.
Tasks: 0 successful, 0 total
```

### `pnpm build`

Status: failed.

Key output:

```text
@ltf1/mobile:build: > eas build
@ltf1/mobile:build: sh: 1: eas: not found
Failed: @ltf1/mobile#build
```

### `pnpm --filter @ltf1/web build`

Status: passed with warnings.

Key output:

```text
Browserslist: browsers data (caniuse-lite) is 10 months old.
(!) Some chunks are larger than 500 kB after minification.
dist/assets/blocknote-*.js 1,005.20 kB | gzip: 305.93 kB
dist/assets/App-*.js       1,005.98 kB | gzip: 276.73 kB
✓ built in 1m 18s
```

### `pnpm --filter @ltf1/web typecheck`

Status: failed.

Output was large and saved by the tool at `/home/aansh/.local/share/opencode/tool-output/tool_dd9a4f68f0015oIOfcR1M2SQRL`.

Representative output:

```text
src/pages/DeveloperProfilePage.tsx: Property 'location' does not exist on type ...
src/pages/ReportsPage.tsx: Property 'getWorkspace' does not exist on type ...
src/providers/ConvexClientProvider.tsx: Property 'env' does not exist on type 'ImportMeta'.
../../convex/activities/queries.ts: File 'convex/lib/auth.ts' is not listed within the file list of project 'apps/web/tsconfig.json'.
```

### `pnpm --filter @ltf1/web lint`

Status: failed.

Output was large and saved by the tool at `/home/aansh/.local/share/opencode/tool-output/tool_dd9a5c507001Eg2POGlAUjhyV5`.

Representative output:

```text
apps/web/src/App.tsx:57:7 error 'WhiteboardPage' is assigned a value but never used
apps/web/src/components/HalftoneCanvas.tsx:2:23 error 'useTransform' is defined but never used
apps/web/src/components/admin/DataMigrationBanner.tsx:31:18 error BRUTALIST PROTOCOL VIOLATION: Tailwind rounded classes are forbidden
```

### `pnpm --filter @ltf1/mobile typecheck`

Status: passed.

### `pnpm --filter @ltf1/backend typecheck`

Status: failed.

Key output:

```text
error TS5083: Cannot read file '/home/aansh/LTF1/iceberg-L/tsconfig.json'.
error TS6059: File '/home/aansh/LTF1/iceberg-L/convex/activities/schema.ts' is not under 'rootDir' '/home/aansh/LTF1/iceberg-L/packages/backend'.
```

### `pnpm --filter @ltf1/types typecheck`

Status: passed.

### `go test ./...` in `apps/tui`

Status: passed, but every package reports `[no test files]`.

### `go build ./cmd/ltf1` in `apps/tui`

Status: passed.

### `go vet ./...` in `apps/tui`

Status: passed.

### `gofmt -l .` in `apps/tui`

Status: failed formatting check.

Output:

```text
internal/commands/daemoncmd/daemon.go
internal/commands/root.go
internal/commands/timecmd/log.go
internal/output/colors.go
internal/tui/app.go
internal/tui/components/modal.go
internal/tui/pages/agent.go
internal/tui/pages/git.go
internal/tui/pages/tasks.go
```

### `pnpm exec prettier --check "**/*.{ts,tsx,md,json}"`

Status: failed.

Key output:

```text
Code style issues found in 613 files. Run Prettier with --write to fix.
```

## Recon Findings

### Finding R-001: Local command coverage is incomplete across surfaces

- **Severity:** High
- **Surface:** Cross-cutting
- **Category:** Tests | DX
- **Location:** `package.json`:6-16; `apps/web/package.json`:6-12; `apps/mobile/package.json`:6-14; `packages/backend/package.json`:20-24; `packages/types/package.json`:8-10; `apps/tui/go.mod`:1-9
- **Observed behavior:** Required build/test/lint/typecheck/format-check/dev commands are missing on multiple surfaces. `pnpm test` executes zero tasks because no package defines `test`. Web and mobile lack test scripts. Backend lacks build/lint/test/format-check scripts. Types lacks build/lint/test/format-check/dev scripts. TUI has no package-level script wrapper and no explicit dev command.
- **Expected behavior:** Every surface should expose reliable local commands for build, test, lint, typecheck, format-check, and dev, with root orchestration invoking them consistently.
- **Impact:** CI and local verification cannot prove correctness. Fixing one surface risks regressions in another, and the audit's required test-before-fix workflow currently has no harness for most code.
- **Root cause hypothesis:** Tooling grew organically per surface without a repo-wide command contract.
- **Proposed fix:** Add missing scripts or documented make/task wrappers per surface, introduce test runners where absent, and wire them through Turbo. Avoid remote-only commands for local build verification.
- **Risk of fix:** Script additions can expose latent failures; all affected pipelines must be run after changes.
- **Estimated effort:** M

### Finding R-002: Backend typecheck is broken by an invalid tsconfig hierarchy

- **Severity:** High
- **Surface:** Backend
- **Category:** Bug | DX
- **Location:** `packages/backend/tsconfig.json`:2-17
- **Observed behavior:** `pnpm --filter @ltf1/backend typecheck` fails with `TS5083` because it extends missing `../../tsconfig.json`, then `TS6059` because it includes `../../convex/**/*.ts` while `rootDir` is `./`.
- **Expected behavior:** Backend typecheck should resolve a committed base config and include only files under a compatible root, or Convex should be typechecked by its own project config.
- **Impact:** The monorepo `pnpm typecheck` is red before any code changes, blocking reliable verification.
- **Root cause hypothesis:** Root config was renamed or intended to be `tsconfig.base.json`, while backend package also attempts to own root Convex source files.
- **Proposed fix:** Point backend to the existing base config and separate Convex typechecking from package backend, or widen `rootDir` only if the package intentionally owns root Convex files.
- **Risk of fix:** May expose additional backend/Convex type errors once config resolution is fixed; run root and backend typecheck after changes.
- **Estimated effort:** S

### Finding R-003: Mobile lint script cannot run because ESLint has no configuration

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** DX | Tests
- **Location:** `apps/mobile/package.json`:10
- **Observed behavior:** `pnpm --filter @ltf1/mobile lint` fails immediately: `ESLint couldn't find a configuration file`.
- **Expected behavior:** The mobile lint script should use a committed ESLint config compatible with Expo/React Native/TypeScript.
- **Impact:** Mobile lint coverage is non-functional and root `pnpm lint` fails before web lint can complete.
- **Root cause hypothesis:** Lint script was added without committing `.eslintrc`/flat config for the mobile package.
- **Proposed fix:** Add a minimal ESLint config or remove/replace the lint script with the chosen project lint tool, then resolve surfaced lint issues.
- **Risk of fix:** New config may reveal many existing issues; run mobile lint and root lint.
- **Estimated effort:** S

### Finding R-004: Mobile build is not locally reproducible

- **Severity:** Medium
- **Surface:** Mobile
- **Category:** DX
- **Location:** `apps/mobile/package.json`:9
- **Observed behavior:** `pnpm build` fails because `@ltf1/mobile` runs `eas build`, but `eas` is not installed locally. The command is also a remote service build, not a deterministic local verification step.
- **Expected behavior:** Root `pnpm build` should use a local non-interactive command, while remote release builds should be separate.
- **Impact:** Root build is red and developers cannot verify the monorepo without installing external CLI/service credentials.
- **Root cause hypothesis:** Release build command was wired into the local build pipeline.
- **Proposed fix:** Split mobile build scripts into local validation and remote EAS release build, then point Turbo `build` at the local command.
- **Risk of fix:** Requires agreement on mobile local build semantics; run root build and mobile build after change.
- **Estimated effort:** S

### Finding R-005: Web TypeScript typecheck has extensive contract and config errors

- **Severity:** High
- **Surface:** Web
- **Category:** Bug | DX
- **Location:** `apps/web/src/pages/DeveloperProfilePage.tsx`:586-703; `apps/web/src/pages/ReportsPage.tsx`:16-21; `apps/web/src/providers/ConvexClientProvider.tsx`:1-14; `apps/web/tsconfig.json`:24; additional locations in saved output
- **Observed behavior:** `pnpm --filter @ltf1/web typecheck` fails with many errors: frontend code accesses fields/functions not present in generated Convex API types, `import.meta.env` is not typed, and `apps/web/tsconfig.json` imports Convex files outside its include list.
- **Expected behavior:** Web should typecheck cleanly against the generated backend contract and its own environment declarations.
- **Impact:** Type safety is not enforceable; broken backend/frontend contracts can ship undetected.
- **Root cause hypothesis:** Generated Convex types and frontend assumptions drifted, while TS project boundaries are misconfigured.
- **Proposed fix:** Fix project references/env typings and reconcile each web call/site with the generated Convex API contract.
- **Risk of fix:** Contract fixes may affect runtime behavior; add focused tests for fixed flows and run web typecheck/build.
- **Estimated effort:** L

### Finding R-006: Web lint is failing across many files

- **Severity:** Medium
- **Surface:** Web
- **Category:** DX
- **Location:** `apps/web/.eslintrc.json`:1-35; representative failures in `apps/web/src/App.tsx`:57, `apps/web/src/components/HalftoneCanvas.tsx`:2, `apps/web/src/components/admin/DataMigrationBanner.tsx`:31
- **Observed behavior:** `pnpm --filter @ltf1/web lint` fails with unused imports/variables, no-useless-escape, many `no-explicit-any` warnings promoted by `--max-warnings 0`, and custom brutalist-design rounded-class violations.
- **Expected behavior:** Web lint should pass cleanly or rules should match current design-system policy.
- **Impact:** Root lint is red after mobile lint is fixed; style and dead-code issues accumulate unchecked.
- **Root cause hypothesis:** Lint rules were tightened after large UI additions, or generated/experimental UI was not kept compliant.
- **Proposed fix:** Resolve unused code, type `any` hotspots as practical, and either comply with or revise design-system lint rules.
- **Risk of fix:** Removing unused values may reveal incomplete features; run lint/typecheck/build.
- **Estimated effort:** L

### Finding R-007: Repository-wide Prettier check fails in 613 files

- **Severity:** Medium
- **Surface:** Cross-cutting
- **Category:** DX
- **Location:** `package.json`:10 and 613 files reported by Prettier
- **Observed behavior:** Root format check used during recon reports `Code style issues found in 613 files`. The committed `format` script is write-only and there is no `format-check` script.
- **Expected behavior:** A non-mutating formatting check should pass and be available in CI/local verification.
- **Impact:** Formatting churn obscures code review diffs and makes atomic fixes harder.
- **Root cause hypothesis:** Formatter was not enforced in CI and many files predate current Prettier settings.
- **Proposed fix:** Add `format-check`, run a one-time formatting commit, then enforce in CI.
- **Risk of fix:** One-time formatting touches many files; should be isolated from functional fixes.
- **Estimated effort:** M

### Finding R-008: TUI Go formatting check fails

- **Severity:** Low
- **Surface:** TUI
- **Category:** DX
- **Location:** `apps/tui/internal/commands/daemoncmd/daemon.go`; `apps/tui/internal/commands/root.go`; `apps/tui/internal/commands/timecmd/log.go`; `apps/tui/internal/output/colors.go`; `apps/tui/internal/tui/app.go`; `apps/tui/internal/tui/components/modal.go`; `apps/tui/internal/tui/pages/agent.go`; `apps/tui/internal/tui/pages/git.go`; `apps/tui/internal/tui/pages/tasks.go`
- **Observed behavior:** `gofmt -l .` prints nine files.
- **Expected behavior:** `gofmt -l .` should print nothing.
- **Impact:** Go formatting drift makes diffs noisier and can hide semantic changes.
- **Root cause hypothesis:** Go files were edited without running `gofmt`.
- **Proposed fix:** Run `gofmt` on the listed files in an isolated formatting fix.
- **Risk of fix:** Formatting-only; run `go test ./...`, `go build ./cmd/ltf1`, `go vet ./...`.
- **Estimated effort:** S

### Finding R-009: Web production build emits oversized chunks

- **Severity:** Medium
- **Surface:** Web
- **Category:** Perf
- **Location:** `apps/web/vite.config.ts`:27-40
- **Observed behavior:** Web build succeeds but emits Rollup warnings for chunks larger than 500 kB after minification, including `blocknote` around 305.93 kB gzip and `App` around 276.73 kB gzip.
- **Expected behavior:** Route/editor-heavy code should be split so initial and route chunks stay under the audit threshold of 250 kB gzip where feasible.
- **Impact:** Users pay unnecessary network/parse cost, especially on mobile/slow devices.
- **Root cause hypothesis:** Manual chunks group heavy editor/runtime code broadly and `App.tsx` eagerly imports many public pages/components.
- **Proposed fix:** Audit bundle composition, defer heavy editor/language chunks, and split route-specific dependencies.
- **Risk of fix:** Lazy-loading changes can affect route loading/error boundaries; run web build and smoke core routes.
- **Estimated effort:** M

### Finding R-010: CI does not run build, lint, test, or typecheck gates

- **Severity:** High
- **Surface:** Cross-cutting
- **Category:** Tests | DX
- **Location:** `.github/workflows/claude-code-review.yml`:13-56; `.github/workflows/claude.yml`:13-49
- **Observed behavior:** The only detected workflows run Claude actions. No workflow installs dependencies and runs build/lint/typecheck/test.
- **Expected behavior:** CI should gate pull requests with the same local pipeline required by this audit.
- **Impact:** Broken build/typecheck/lint/test state can merge unnoticed.
- **Root cause hypothesis:** Automation was configured for AI review before conventional CI was added.
- **Proposed fix:** Add a CI workflow with pnpm setup/cache, Go setup, and surface-specific build/lint/typecheck/test commands once local commands are green.
- **Risk of fix:** CI will initially fail until baseline command findings are fixed; introduce after or alongside command cleanup.
- **Estimated effort:** M

## Notes

- Running `go build ./cmd/ltf1` and web TypeScript commands modified the tracked generated file `apps/web/tsconfig.tsbuildinfo`. This is a build artifact side effect and should be cleaned before final completion without touching unrelated user changes.
