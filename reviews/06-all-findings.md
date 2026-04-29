# Phase 6 - All Findings

Date: 2026-04-29
Commit reviewed: `1f4d3d8471b993e23f492d87a32f235a4c7e334b`
Sources: `00-recon.md`, `01-backend-map.md`, `02-tui-findings.md`, `03-web-findings.md`, `04-mobile-findings.md`, `05-cross-cutting-findings.md`

## Normalization Notes

- TUI target is documented as `apps/tui`; this checkout has no top-level `./tui` directory.
- Backend findings from `01-backend-map.md` are canonicalized as `BE-###` in this synthesis to avoid colliding with web findings that were written as `B-###`.
- Web findings from `03-web-findings.md` are canonicalized as `W-###` in this synthesis.
- `Status: Open` means no fix has been applied in this audit session yet.
- `Status: Blocked` means the finding likely needs user/security/migration decision before live fix.
- `Status: Duplicate` means the issue is represented by another canonical finding.
- `Status: Cancelled` means validation found the reported behavior is not a bug under the current backend contract.

## Blockers And Stop Conditions

All previously-blocked items have been resolved or mitigated in code:

| ID | Resolution |
| --- | --- |
| BE-007 | Fixed by introducing AES-GCM via `convex/lib/secrets.ts`; legacy base64 rows still decode through a backwards-compatible path until rotated. Requires `SECRET_ENCRYPTION_KEY` in Convex env. |
| BE-010 | Fixed by extending `deleteWorkspace` cascade across all workspace-scoped tables and per-task children; missing optional tables degrade with a warning. |
| BE-011 | Fixed by scoping `getMyTasks`/`getTasksByUser` to membership + indexed reads, replacing `getWorkspaceStats` activity scan with a composite-index range, and rewriting `hasProjectPermission` team filter as keyed probes. |
| D-013 | Mitigated by `scripts/check-no-secrets.sh` + `docs/security/local-secrets.md`. User still needs to move the local `.env`/`.pem` files outside the repo and rotate the GitHub App key. |

## Recon And Tooling Findings

| ID | Severity | Surface | Status | Summary |
| --- | --- | --- | --- | --- |
| R-001 | High | Cross-cutting | Open | Local command coverage is incomplete across surfaces. |
| R-002 | High | Backend | Fixed | Backend typecheck is broken by invalid tsconfig hierarchy. |
| R-003 | Medium | Mobile | Fixed | Mobile lint script has no ESLint configuration. |
| R-004 | Medium | Mobile | Fixed | Mobile build uses remote `eas build` and is not locally reproducible. |
| R-005 | High | Web | Open | Web typecheck has extensive backend contract/config errors. |
| R-006 | Medium | Web | Open | Web lint fails across many files. |
| R-007 | Medium | Cross-cutting | Open | Repository-wide Prettier check fails in 613 files and lacks a check script. |
| R-008 | Low | TUI | Fixed | TUI Go formatting check fails. |
| R-009 | Medium | Web | Open | Web production build emits oversized chunks. |
| R-010 | High | Cross-cutting | Open | CI does not run build, lint, test, or typecheck gates. |

## Backend Findings

| ID | Source ID | Severity | Status | Summary |
| --- | --- | --- | --- | --- |
| BE-001 | B-001 | High | Open | Many Convex functions omit return validators. |
| BE-002 | B-002 | Blocker | Fixed | Any authenticated user can list all tasks in any workspace by ID. |
| BE-003 | B-003 | High | Fixed | Any authenticated user can query tasks for any Clerk user ID. |
| BE-004 | B-004 | High | Fixed | Pending workspace invitations leak invitee emails without workspace permission. |
| BE-005 | B-005 | High | Fixed | Public user lookup returns arbitrary user documents without authorization. |
| BE-006 | B-006 | Blocker | Fixed | AI provider key management authorizes only “authenticated”, not owner of scope/key. |
| BE-007 | B-007 | High | Fixed | User-supplied AI API keys are base64-encoded or raw, not encrypted. |
| BE-008 | B-008 | High | Fixed | Any workspace member can create billing checkout sessions. |
| BE-009 | B-009 | Medium | Open | GitHub webhook processing lacks delivery idempotency guard. |
| BE-010 | B-010 | High | Fixed | Workspace deletion leaves orphaned related records. |
| BE-011 | B-011 | Medium | Fixed | Several queries use unbounded table scans and post-filtering. |
| BE-012 | B-012 | Medium | Fixed | Public email test action logs secret material prefix and PII. |
| BE-013 | B-013 | Medium | Fixed | Public admin migration status query is exposed without auth. |

## TUI Findings

| ID | Severity | Status | Summary |
| --- | --- | --- | --- |
| A-001 | Medium | Open | Default command launches interactive TUI even when stdout is not a terminal. |
| A-002 | Medium | Open | `--no-color` and `NO_COLOR` are not wired into CLI output, and TUI colors are hard-coded. |
| A-003 | Medium | Open | Browser login ignores local server startup failures and can wait five minutes on a dead callback. |
| A-004 | High | Fixed | Sprint page calls `tasks:list`, which is not in the backend contract. |
| A-005 | High | Fixed | Notification TUI and CLI use function paths outside the backend map. |
| A-006 | High | Fixed | Skill CLI calls stale/missing backend function paths and incomplete create args. |
| A-007 | Medium | Open | Several page loaders swallow network and decode errors. |
| A-008 | Low | Open | CLI table/list width calculations break for wide Unicode and very narrow terminals. |
| A-009 | Low | Open | Global `--json` flag is exposed but many commands ignore it or define local JSON flags. |
| A-010 | High | Fixed | Time tracking CLI calls nonexistent `timeEntries/queries` and `timeEntries/mutations` modules. |

## Web Findings

| ID | Source ID | Severity | Status | Summary |
| --- | --- | --- | --- | --- |
| W-001 | B-001 | Low | Open | Notification popover can overflow narrow viewports. |
| W-002 | B-002 | Medium | Open | Shared modal scroll lock is unsafe for overlapping modals. |
| W-003 | B-003 | Medium | Open | ShortcutManager cannot remove its keydown listener. |
| W-004 | B-004 | Low | Open | Push notification initialization can set state after unmount. |
| W-005 | B-005 | Low | Open | Project creation form allows rapid duplicate submissions before loading state renders. |
| W-006 | B-006 | Medium | Open | Auth guard does not preserve requested deep links. |
| W-007 | B-007 | Medium | Open | Joining a project navigates to a route that does not exist. |
| W-008 | B-008 | Medium | Open | Several query-backed pages collapse null/error states into infinite loading. |
| W-009 | B-009 | Medium | Open | Production build emits gzip chunks above the 250 KB audit threshold. |
| W-010 | B-010 | Low | Open | User images are not lazy-loaded and often lack intrinsic dimensions. |
| W-011 | B-011 | Medium | Open | Skip link and accessibility provider are defined but never mounted. |
| W-012 | B-012 | Medium | Open | Billing management opens a new tab without noopener protection. |
| W-013 | B-013 | High | Open | CLI auth places JWT/session credentials in callback URL and bypasses refresh contract. |
| W-014 | B-014 | Low | Open | Project has no browser support declaration while using newer CSS/platform APIs. |
| W-015 | B-015 | High | Open | Reports page and report builder call Convex functions outside the mapped backend contract. |
| W-016 | B-016 | High | Open | Multiple web calls use stale or invalid backend function paths/argument shapes. |

## Mobile Findings

| ID | Severity | Status | Summary |
| --- | --- | --- | --- |
| C-001 | High | Open | Capture modal ignores safe area and keyboard avoidance. |
| C-002 | Medium | Open | Large text and small screens can clip or hide auth forms. |
| C-003 | Low | Open | App is hard-locked to portrait and dark UI style. |
| C-004 | Medium | Open | No push notification or badge lifecycle handling exists. |
| C-005 | Medium | Open | Invalid or stale deep links can call Convex with unchecked IDs. |
| C-006 | Medium | Open | Task detail performs navigation as a render side effect. |
| C-007 | Low | Open | Navigable cards and FABs are not debounced against rapid double taps. |
| C-008 | Medium | Open | Auth inputs omit autofill and autocorrect hints. |
| C-009 | Medium | Open | Offline cache is only applied to profile workspaces. |
| C-010 | Low | Open | Pull-to-refresh does not actually refetch or reconnect data. |
| C-011 | Medium | Open | Project task list renders all tasks inside a ScrollView. |
| C-012 | Low | Open | Network status polling scales with mounted screens. |
| C-013 | Medium | Open | Custom select bottom sheet lacks modal accessibility semantics. |
| C-014 | Low | Open | Swipe actions have no accessible action alternative on task cards. |
| C-015 | Medium | Open | Required public environment variables are force-unwrapped at module load. |
| C-016 | Low | Open | External repository links are opened without validation or error handling. |
| C-017 | Low | Open | Mobile renders non-contract project status `paused`. |
| C-018 | Medium | Open | Mobile task assignee rendering relies on non-contract populated `assignees`. |
| C-019 | Medium | Open | Dashboard and project cards display hard-coded zero task counts. |

## Cross-Cutting Findings

| ID | Severity | Status | Summary |
| --- | --- | --- | --- |
| D-001 | Medium | Open | Shared task types still model deprecated single-assignee fields as primary contract. |
| D-002 | Medium | Open | Mobile project detail expects project fields outside backend contract. |
| D-003 | Medium | Open | README describes a different CLI/TUI technology and command vocabulary than shipped app. |
| D-004 | Low | Open | Status labels vary across surfaces despite shared backend state machines. |
| D-005 | Low | Open | TUI configuration errors use multiple messages for the same missing Convex URL state. |
| D-006 | Medium | Open | Frontends collapse distinct backend auth/not-found failures into generic messages. |
| D-007 | Medium | Open | Date and duration formatting is hand-rolled differently per surface. |
| D-008 | Medium | Open | No i18n layer exists despite extensive hard-coded strings and pluralization. |
| D-009 | Medium | Open | Client analytics and console logging include identifiers without a redaction policy. |
| D-010 | High | Open | Browser service performs AI provider calls with a Vite-exposed key. |
| D-011 | Medium | Open | Core dependencies drift across root, web, and mobile packages. |
| D-012 | Low | Duplicate | Security audit is not a reliable gate; covered by D-014/R-010. |
| D-013 | High | Mitigated | Pre-commit guard + secrets handling docs added; local files still need rotation/move. |
| D-014 | High | Open | CI does not gate any surface with build/lint/typecheck/test/audit/coverage. |
| D-015 | Medium | Open | README setup omits mobile and backend-required environment variables. |
| D-016 | High | Duplicate | TUI skill contract drift; covered by A-006. |
| D-017 | High | Duplicate | TUI sprint `tasks:list` drift; covered by A-004. |
| D-018 | High | Duplicate | TUI notification path drift; covered by A-005. |
| D-019 | Medium | Cancelled | Backend validator accepts both `workspaceId` and `projectId` for `getTriageQueue`. |
| D-020 | Medium | Duplicate | Web `getOrCreateCurrentUser` drift; covered by W-016. |
| D-021 | High | Open | Production access gate is client-side only and exposes its default access code. |

## Recommended Fix Order

1. Restore verification baseline enough to make later fixes provable: R-002, R-003, R-004, R-008. **Done.**
2. Fix backend security blockers/highs with narrow tests: BE-002, BE-003, BE-004, BE-005, BE-006, BE-008, BE-012, BE-013. **Done.**
3. Fix runtime contract drift that breaks user flows: A-004, A-005, A-006, A-010 (**Done**); remaining: W-013, W-015, W-016, C-005, C-015.
4. Fix cross-cutting exposed client secrets/access control: D-010, D-021; keep D-013 blocked for key movement/rotation.
5. Address UX, accessibility, performance, docs, and CI hardening after command baselines are green.
