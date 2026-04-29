# Phase 7 - Final Report And Fix Tracker

Date: 2026-04-29
Commit reviewed: `1f4d3d8471b993e23f492d87a32f235a4c7e334b`
Current status: audit and synthesis complete; baseline + backend security + TUI contract drift fixes landed; remaining open work is in web typecheck/lint, additional cross-surface contract drift, and deferred blockers.

## Scope Confirmation

- TUI: `apps/tui` in this checkout. The user corrected the intended target from `./pui` to `./tui`, but there is no top-level `./tui` directory.
- Web: `apps/web`
- Mobile: `apps/mobile`
- Backend: `convex`, `packages/backend`
- Reports: `reviews`
- Changelog: `CHANGELOG.md` was created at the repo root during this audit; all fixed findings reference their finding IDs there.

## Phase Status

| Phase | Report | Status |
| --- | --- | --- |
| 0. Reconnaissance | `reviews/00-recon.md` | Complete |
| 1. Backend map | `reviews/01-backend-map.md` | Complete |
| 2. TUI audit | `reviews/02-tui-findings.md` | Complete, validation deltas applied |
| 3. Web audit | `reviews/03-web-findings.md` | Complete |
| 4. Mobile audit | `reviews/04-mobile-findings.md` | Complete, validation delta applied |
| 5. Cross-cutting audit | `reviews/05-cross-cutting-findings.md` | Complete, validation delta applied |
| 6. Synthesis | `reviews/06-all-findings.md` | Complete |
| 7. Live fixes | this tracker | In progress |

## Baseline Verification

| Command | Status | Notes |
| --- | --- | --- |
| `pnpm typecheck` | Failed | R-002 fixed the `@ltf1/backend` config issue; root typecheck is still expected to fail on remaining web/backend contract findings until they are fixed. |
| `pnpm lint` | Failed | R-003 fixed the `@ltf1/mobile` lint config; root lint is still expected to fail on remaining web lint findings. |
| `pnpm test` | No-op | Turbo executed zero package test tasks. |
| `pnpm build` | Passed with warnings | R-004 fixed the mobile build blocker. Web build still emits oversized chunk warnings tracked by R-009/W-009. |
| `go test ./...` in `apps/tui` | Passed | All packages reported `[no test files]`. |
| `gofmt -l .` in `apps/tui` | Passed | R-008 fixed all previously listed files. |

## Finding Summary

- Open blocker findings: none.
- Previously-blocked findings now resolved: BE-007 (AES-GCM secrets helper), BE-010 (cascade extension), BE-011 (indexed reads + membership scoping), D-013 (pre-commit guard + docs; user still needs to rotate/move local files).
- Duplicate findings in synthesis: D-012, D-016, D-017, D-018, D-020.
- Cancelled finding after validation: D-019.
- Canonical finding index: `reviews/06-all-findings.md`.

## Fix Strategy

1. Start with verification-baseline fixes so later atomic fixes can be proven: R-002, R-003, R-004, R-008.
2. Then fix high-risk backend authorization issues: BE-002, BE-003, BE-004, BE-005, BE-006, BE-008, BE-012, BE-013.
3. Then fix cross-surface runtime contract drift: A-004, A-005, A-006, A-010, W-013, W-015, W-016, C-005, C-015.
4. Defer blocked migration/incident items until the user confirms the desired handling.

## Live Fix Log

| Finding | Status | Verification |
| --- | --- | --- |
| R-002 | Fixed | `pnpm --filter @ltf1/backend typecheck` passes. Full root pipeline remains red on unrelated open findings. |
| R-003 | Fixed | `pnpm --filter @ltf1/mobile lint` passes. Full root lint remains red on unrelated web lint findings. |
| R-004 | Fixed | `pnpm --filter @ltf1/mobile build` passes with local Android Expo export. |
| R-008 | Fixed | `gofmt -l .`, `go test ./...`, `go build ./cmd/ltf1`, and `go vet ./...` pass in `apps/tui`. |
| BE-002 | Fixed | `getTasksByWorkspace` now requires `task.view`. `pnpm --filter @ltf1/backend typecheck` passes. |
| BE-003 | Fixed | `getTasksByUser` rejects cross-user lookups. Backend typecheck passes. |
| BE-004 | Fixed | `getPendingInvitations` requires `workspace.invite`. Backend typecheck passes. |
| BE-005 | Fixed | `getUserById` returns a public-safe projection only when authenticated. Backend typecheck passes. |
| BE-006 | Fixed | AI key scope authorization derives user scope from identity, requires `project.edit` for project scope, and verifies key ownership. Backend typecheck passes. |
| BE-008 | Fixed | Billing checkout gated on owner/admin via `internal.billing.queries.callerCanManageBilling`. Backend typecheck passes. |
| BE-012 | Fixed | `sendTestEmail` and internal `sendEmail` logging no longer expose secrets or recipient addresses. Backend typecheck passes. |
| BE-013 | Fixed | `checkMigrationStatus` requires admin role; non-admins receive the no-op shape. Backend typecheck passes. |
| A-004 | Fixed | TUI sprint page calls `tasks/queries:getProjectTasks`. `go vet`/`go build`/`go test` pass. |
| A-005 | Fixed | TUI notifications page + CLI use `notificationQueries:*`. `go vet`/`go build`/`go test` pass. |
| A-006 | Fixed | TUI skill CLI uses `skills/queries:getWorkspaceSkills`, `skills/execution:executeSkill`, and a complete `createSkill` payload. |
| A-010 | Fixed | TUI time CLI calls the single-file `timeEntries:*` paths. |
| BE-007 | Fixed | AES-GCM via `convex/lib/secrets.ts` with versioned `v2:` prefix; legacy base64 rows decode via the same helper. Requires `SECRET_ENCRYPTION_KEY` env. |
| BE-010 | Fixed | `deleteWorkspace` cascades projects → (tasks → comments/attachments/timeEntries) → sprints → projectMembers/Invitations, then sweeps every workspace-scoped table by index with graceful skip for missing tables. |
| BE-011 | Fixed | `getMyTasks` and `getTasksByUser` scoped to caller's workspaces with indexed reads; `getWorkspaceStats` uses `(workspaceId, timestamp)` range; `hasProjectPermission` uses keyed `by_team_user` probes. |
| D-013 | Mitigated | `scripts/check-no-secrets.sh` pre-commit guard plus `docs/security/local-secrets.md` rotation guide. User must move local secret files and rotate the GitHub App key. |
| D-019 | Cancelled | Backend validator already accepts both `workspaceId` and `projectId` for `getTriageQueue`. |
