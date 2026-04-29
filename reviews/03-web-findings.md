# Phase 3 - Web UI Findings

Date: 2026-04-29
Scope: `apps/web`
Contract source: `reviews/01-backend-map.md`

## 1. Rendering and layout: overflow, layout shift, responsive breakpoints, hard-coded pixel values that break on zoom, fixed heights clipping content, z-index stacking, modals trapping scroll incorrectly.

### Finding B-001: Notification popover can overflow narrow viewports

- **Severity:** Low
- **Surface:** Web
- **Category:** UI
- **Location:** `src/components/common/NotificationCenter.tsx`:175-178
- **Observed behavior:** The notification panel uses `w-[380px]` with no viewport-relative max width. On 320px/360px mobile widths, or desktop zoom, the fixed panel is wider than the viewport and can clip horizontally.
- **Expected behavior:** Popovers should fit within the viewport at supported responsive breakpoints and under browser zoom.
- **Impact:** Mobile and zoomed users may be unable to read or close notification content without horizontal scrolling/clipping.
- **Root cause hypothesis:** Desktop popover dimensions were hard-coded without a `max-w-[calc(100vw-...)]` fallback.
- **Proposed fix:** Make the popover width responsive, e.g. full width up to 380px with viewport padding, and smoke-test at 320px and 200% zoom.
- **Risk of fix:** Low; placement may shift and should be checked against the notification bell anchor.
- **Estimated effort:** S

### Finding B-002: Shared modal scroll lock is unsafe for overlapping modals

- **Severity:** Medium
- **Surface:** Web
- **Category:** UX | A11y
- **Location:** `src/components/ui/BrutalModal.tsx`:31-86
- **Observed behavior:** Every modal effect sets `document.body.style.overflow = "hidden"` on open and unconditionally resets it to `"unset"` on cleanup. The code does not preserve the previous overflow value and does not reference-count nested/overlapping modals.
- **Expected behavior:** Modal scroll lock should restore the previous body overflow value only after the last open modal closes.
- **Impact:** Closing one modal while another is open can re-enable background scrolling behind the remaining dialog; pages with pre-existing body overflow styling also lose it.
- **Root cause hypothesis:** Scroll locking was implemented locally in each modal instance rather than through a central lock manager.
- **Proposed fix:** Preserve the prior inline overflow value and use a shared modal-open counter, or move scroll locking to a single modal manager.
- **Risk of fix:** Medium; modal open/close flows, onboarding, task details, and nested dialogs need keyboard and scroll regression checks.
- **Estimated effort:** S

## 2. State management: stale closures, missing dependency arrays, unnecessary re-renders, uncleared intervals/listeners, async effect race conditions, optimistic rollback bugs.

### Finding B-003: ShortcutManager cannot remove its keydown listener

- **Severity:** Medium
- **Surface:** Web
- **Category:** Bug | Perf
- **Location:** `src/services/ShortcutManager.ts`:145-147,438-443
- **Observed behavior:** `setupEventListeners` registers `document.addEventListener('keydown', this.handleKeyDown.bind(this))`, but `destroy` removes `this.handleKeyDown.bind(this)`, which creates a different function reference. The original listener remains attached.
- **Expected behavior:** Global listeners must be removed with the exact same function reference that was registered.
- **Impact:** If the shortcut manager is destroyed/recreated during tests, HMR, or future provider remounts, duplicate shortcut handlers can accumulate and fire multiple times.
- **Root cause hypothesis:** The bound handler was not stored as an instance field.
- **Proposed fix:** Bind once in the constructor or store a `private handleKeyDownBound` field and use it for both add and remove.
- **Risk of fix:** Low; verify keyboard shortcuts and shortcut settings still work.
- **Estimated effort:** S

### Finding B-004: Push notification initialization can set state after unmount

- **Severity:** Low
- **Surface:** Web
- **Category:** Bug
- **Location:** `src/hooks/usePushNotifications.ts`:15-30
- **Observed behavior:** The effect waits on `navigator.serviceWorker.ready` and `registration.pushManager.getSubscription()`, then calls `setIsSubscribed`. There is no cancellation flag for component unmount.
- **Expected behavior:** Async effects should ignore results after unmount or route change.
- **Impact:** Users navigating away while service worker readiness is pending can trigger React warnings and stale state updates.
- **Root cause hypothesis:** The effect was written as a one-shot initializer without unmount cancellation.
- **Proposed fix:** Track an `isMounted`/`cancelled` flag in the effect cleanup before calling state setters.
- **Risk of fix:** Low; verify notification permission/subscription state still appears correctly.
- **Estimated effort:** S

## 3. Forms: validation, hostile validation timing, autocomplete, label name/id linkage, submit-on-enter, double-submit, loading state, persistent error state.

### Finding B-005: Project creation form allows rapid duplicate submissions before loading state renders

- **Severity:** Low
- **Surface:** Web
- **Category:** UX | Bug
- **Location:** `src/components/features/project/CreateProjectModal.tsx`:54-89,201-209
- **Observed behavior:** `handleSubmit` sets `isCreating` through reducer dispatch and then awaits `createProject`. A fast double submit can enter `handleSubmit` twice before React re-renders the disabled submit button.
- **Expected behavior:** Mutating forms should synchronously guard against duplicate in-flight submissions.
- **Impact:** Users can create duplicate projects or see duplicate backend errors under fast double-click/Enter input.
- **Root cause hypothesis:** Loading UI state doubles as the only concurrency guard.
- **Proposed fix:** Add an immediate in-flight ref or early `if (isCreating) return` guard that cannot be bypassed before the next render.
- **Risk of fix:** Low; verify normal Enter submission and loading state still work.
- **Estimated effort:** S

## 4. Routing: back button, history pollution, deep-link state restore, query param encoding, 404 handler, route guards bypassed by direct navigation.

### Finding B-006: Auth guard does not preserve the requested deep link

- **Severity:** Medium
- **Surface:** Web
- **Category:** UX | Routing
- **Location:** `src/components/common/RequireAuth.tsx`:11-49; `src/pages/SignInPage.tsx`:119-123
- **Observed behavior:** An unauthenticated direct navigation to a protected route renders links to `/sign-in` and `/sign-up` without the original location. `SignInPage` renders Clerk `<SignIn routing="path" path="/sign-in" />` without a fallback redirect URL.
- **Expected behavior:** Route guards should preserve and restore the intended destination after successful sign-in.
- **Impact:** Users following deep links to workspace/project/task pages can land on a generic post-login route and lose context.
- **Root cause hypothesis:** The guard was implemented as an informational wall rather than a redirect with location state/query preservation.
- **Proposed fix:** Include the current location in sign-in/sign-up navigation and configure Clerk to return to it after authentication.
- **Risk of fix:** Medium; Clerk routing, OAuth redirects, and public sign-in flows need smoke testing.
- **Estimated effort:** S

### Finding B-007: Joining a project navigates to a route that does not exist

- **Severity:** Medium
- **Surface:** Web
- **Category:** Bug | Routing
- **Location:** `src/pages/JoinProjectPage.tsx`:31-38; `src/App.tsx`:251-258,279-280
- **Observed behavior:** After `joinProjectByCode` succeeds, the page calls `navigate(`/project/${result.projectId}`)`. `App.tsx` does not define `/project/:projectId`; project detail is routed as `/workspace/:workspaceId/project/:projectId`, so the user lands on the catch-all 404.
- **Expected behavior:** Successful project join should navigate to an existing project route or to `/projects` if the workspace ID is unavailable.
- **Impact:** New invitees see success and then a 404, making the invite flow appear broken.
- **Root cause hypothesis:** The route shape changed to workspace-scoped project URLs while the join flow kept the old project-only route.
- **Proposed fix:** Return or derive the workspace ID, then navigate to `/workspace/:workspaceId/project/:projectId`; otherwise navigate to `/projects` with a success toast.
- **Risk of fix:** Low to medium; verify invite acceptance for existing and newly accepted members.
- **Estimated effort:** S

## 5. Network: loading, error, empty, retry, offline, request cancellation, credentials in URL, CSRF on mutating requests.

### Finding B-008: Several query-backed pages collapse null/error states into infinite loading

- **Severity:** Medium
- **Surface:** Web
- **Category:** UX | Bug
- **Location:** `src/pages/ReportsPage.tsx`:15-42; `src/pages/WorkspaceSettingsPage.tsx`:889-899
- **Observed behavior:** `ReportsPage` renders a spinner whenever `!workspace`, and `WorkspaceSettingsPage` renders a spinner whenever `!workspace || !currentUser`. The backend map states public functions may return `null`, `[]`, or throw inconsistently when unauthenticated/unauthorized.
- **Expected behavior:** Web screens should distinguish initial loading (`undefined`) from missing/unauthorized data (`null`) and render actionable error/empty states.
- **Impact:** Unauthorized, deleted, or invalid resources can leave users stuck on a spinner indefinitely instead of showing not found, sign-in, or permission guidance.
- **Root cause hypothesis:** Convex `undefined` loading semantics were treated as equivalent to all falsy query results.
- **Proposed fix:** Check `=== undefined` for loading, handle `null`/empty separately, and use error boundaries or query error states for thrown authorization failures.
- **Risk of fix:** Medium; route-level empty/error states must be checked for workspaces, reports, projects, and auth transitions.
- **Estimated effort:** M

## 6. Performance: flag chunks >250KB gzip, images lazy-loaded, width/height on images, list virtualization, expensive computations, main thread blocking. Use build output in recon as evidence where helpful.

### Finding B-009: Production build emits gzip chunks above the 250KB audit threshold

- **Severity:** Medium
- **Surface:** Web
- **Category:** Perf
- **Location:** `vite.config.ts`:27-40; `reviews/00-recon.md`:272-284
- **Observed behavior:** Recon build output reports `blocknote` at 305.93 kB gzip and `App` at 276.73 kB gzip, above the required 250 kB gzip threshold.
- **Expected behavior:** Heavy editor/runtime and route-specific code should be split so critical route chunks stay below the threshold where feasible.
- **Impact:** Users pay higher download/parse/compile cost, especially on slow networks and mobile CPUs.
- **Root cause hypothesis:** `App.tsx` eagerly imports many public pages and manual chunks group large libraries broadly.
- **Proposed fix:** Lazy-load heavier public pages/components, isolate editor/document dependencies to the pages that need them, and inspect bundle composition after changes.
- **Risk of fix:** Medium; lazy route loading needs loading/error boundary checks and web build verification.
- **Estimated effort:** M

### Finding B-010: User images are not lazy-loaded and often lack intrinsic dimensions

- **Severity:** Low
- **Surface:** Web
- **Category:** Perf | UI
- **Location:** `src/components/ui/BrutalAvatar.tsx`:41-50; `src/components/features/workspace/MemberManagement.tsx`:181-186; `src/components/features/video/VideoRooms.tsx`:455-460
- **Observed behavior:** Avatar/user images render with CSS sizing but no `loading="lazy"`, `decoding="async"`, or intrinsic `width`/`height` attributes.
- **Expected behavior:** Non-critical images should be lazy/async decoded and reserve stable layout dimensions.
- **Impact:** Large member lists, video-room grids, and avatar-heavy screens can load images eagerly and incur layout/paint work.
- **Root cause hypothesis:** Image tags were added inline instead of using a shared optimized avatar/image component.
- **Proposed fix:** Centralize avatar/image rendering with lazy loading, async decoding, and explicit dimensions appropriate to each size token.
- **Risk of fix:** Low; verify above-the-fold avatars still appear promptly where needed.
- **Estimated effort:** S

## 7. Accessibility WCAG 2.2 AA: alt text, semantic markup, focus management on route change, focus traps, skip-to-content, contrast, keyboard navigation, screen-reader-only text, ARIA misuse, tabindex > 0, prefers-reduced-motion.

### Finding B-011: Skip link and accessibility provider are defined but never mounted

- **Severity:** Medium
- **Surface:** Web
- **Category:** A11y
- **Location:** `src/contexts/AccessibilityContext.tsx`:203-219; `src/App.tsx`:318-335
- **Observed behavior:** `AccessibilityProvider` renders a skip link to `#main-content`, but `App.tsx` never mounts `AccessibilityProvider`. The grep results show no `id="main-content"` target in routed content.
- **Expected behavior:** Keyboard users should have a functioning skip-to-content link and a valid target on every app shell.
- **Impact:** Keyboard and screen-reader users must tab through repeated navigation on every route, and the defined skip link is dead code.
- **Root cause hypothesis:** Accessibility infrastructure was created but not wired into the app wrapper/layout.
- **Proposed fix:** Mount `AccessibilityProvider` at the app root and add `id="main-content"` to the primary `<main>` in dashboard/public layouts.
- **Risk of fix:** Low to medium; verify no provider hooks throw and skip focus lands correctly after route changes.
- **Estimated effort:** S

## 8. Security: dangerouslySetInnerHTML/innerHTML with untrusted input, target=_blank rel, secrets in client bundle, JWT in localStorage, CSP, mixed content.

### Finding B-012: Billing management opens a new tab without noopener protection

- **Severity:** Medium
- **Surface:** Web
- **Category:** Security
- **Location:** `src/pages/WorkspaceSettingsPage.tsx`:587-592
- **Observed behavior:** The billing tab calls `window.open("https://polar.sh/settings/subscriptions", "_blank")` without `noopener`/`noreferrer` or nulling `opener`.
- **Expected behavior:** New tabs opened to external sites should not receive a live `window.opener` reference.
- **Impact:** If the external destination or redirect chain is compromised, it can perform reverse-tabnabbing against the LTF1 window.
- **Root cause hypothesis:** A button used `window.open` directly rather than a hardened external-link helper.
- **Proposed fix:** Use an anchor with `target="_blank" rel="noopener noreferrer"`, or pass `noopener,noreferrer` features to `window.open` and null `opener` defensively.
- **Risk of fix:** Low; verify the Polar settings link still opens as intended.
- **Estimated effort:** S

### Finding B-013: CLI auth places JWT/session credentials in callback URL and bypasses the mapped backend refresh contract

- **Severity:** High
- **Surface:** Web
- **Category:** Security | Backend contract adherence
- **Location:** `src/pages/CLIAuthPage.tsx`:1-10,86-120; `reviews/01-backend-map.md`:86-93
- **Observed behavior:** The CLI auth page obtains a Clerk Convex JWT, then appends `token`, `state`, `userId`, `email`, and `sessionId` as query parameters to the callback URL before assigning `window.location.href`. The backend map says `/api/cli-refresh` accepts `{ sessionId }` in a POST body and returns `{ token }`.
- **Expected behavior:** Credentials should not be placed in URLs; the web/CLI flow should adhere to the mapped `/api/cli-refresh` contract or use a short-lived one-time code exchange.
- **Impact:** JWTs, session IDs, and email addresses can leak through browser history, local callback server logs, referrers, screenshots, and diagnostics.
- **Root cause hypothesis:** The web page implemented an older direct-token callback flow while the backend now exposes a safer POST refresh endpoint.
- **Proposed fix:** Change the browser callback to pass only non-secret state or a session reference, and let the CLI POST `{ sessionId }` to `/api/cli-refresh` to mint the Convex token.
- **Risk of fix:** Medium; CLI authentication flow and local callback compatibility need end-to-end testing.
- **Estimated effort:** M

## 9. Cross-browser: unsupported features without declared browser baseline. If project lacks browser support declaration, log it.

### Finding B-014: Project has no browser support declaration while using newer CSS/platform APIs

- **Severity:** Low
- **Surface:** Web
- **Category:** DX | Cross-browser
- **Location:** `package.json`:1-71; `src/styles/globals.css`:241; `src/components/features/task/CreateTaskModal.tsx`:207,248; `src/services/ShortcutManager.ts`:31-34
- **Observed behavior:** No `browserslist` or equivalent support baseline is declared for the web package. The code uses newer features such as CSS `color-mix()` and deprecated/quirky `navigator.platform` detection.
- **Expected behavior:** The project should declare supported browsers and either transpile/polyfill/fallback unsupported APIs or intentionally require a modern baseline.
- **Impact:** Older Safari/Chromium variants can render badges/chips incorrectly or mis-detect keyboard modifier labels without the team noticing.
- **Root cause hypothesis:** Vite defaults were accepted without defining a product browser support policy.
- **Proposed fix:** Add a browser support declaration and audit CSS/API usage against it, adding fallbacks for `color-mix()` and replacing `navigator.platform` with a supported detection strategy.
- **Risk of fix:** Low to medium; CSS visual regressions should be checked across supported browsers.
- **Estimated effort:** S

## 10. Backend contract adherence: every Convex/backend call must match /home/aansh/LTF1/iceberg-L/reviews/01-backend-map.md. Mismatches are findings.

### Finding B-015: Reports page and report builder call Convex functions outside the mapped backend contract

- **Severity:** High
- **Surface:** Web
- **Category:** Bug | Backend contract adherence
- **Location:** `src/pages/ReportsPage.tsx`:15-23; `src/components/features/reports/ReportBuilder.tsx`:61-64; `reviews/01-backend-map.md`:115-136,178-183
- **Observed behavior:** `ReportsPage` calls `api.workspaces.getWorkspace` and `api.projects.getProject`. `ReportBuilder` typecheck output shows calls to `api.tasks.queries.getTasksByProject`, `api.sprints.queries.getSprintsByProject`, `api.projects.queries.getProjects`, and `api.users`, none of which are listed in the backend map. The mapped contracts are `workspaces.queries.getWorkspaceById`, `projects.queries.getProject`, `tasks.queries.getProjectTasks`, and `sprints.queries.getProjectSprints`.
- **Expected behavior:** Web Convex calls must match the backend map exactly.
- **Impact:** The reports surface cannot typecheck and may fail at runtime when the generated API lacks these paths.
- **Root cause hypothesis:** Reports were built against assumed or legacy API names instead of generated Convex references.
- **Proposed fix:** Reconcile the reports surface to the mapped query names and response shapes, or add backend functions only if they are intentionally part of the public contract.
- **Risk of fix:** Medium; reports data loading, export, and widget rendering need regression coverage.
- **Estimated effort:** M

### Finding B-016: Multiple web calls use stale or invalid backend function paths/argument shapes

- **Severity:** High
- **Surface:** Web
- **Category:** Bug | Backend contract adherence
- **Location:** `src/pages/WorkspaceSettingsPage.tsx`:889-895; `src/components/admin/DataMigrationBanner.tsx`:1-40; `src/components/features/slack/SlackIntegration.tsx`:665-671; `src/components/features/task/TaskDetailModal.tsx`:360-364; `reviews/00-recon.md`:286-314
- **Observed behavior:** Web typecheck output shows backend API drift: `api.auth.users.getOrCreateCurrentUser` is used but the backend map lists `getCurrentUser` and `createCurrentUser`; `api.workspaces.mutations.clearOldActivities` is used but not mapped; Slack UI calls `connectChannel`, `updateChannelSettings`, and `api.integrations.slack.actions` paths that are not mapped; `TaskDetailModal` sends deprecated `assigneeId` to `updateTask` even though the mapped task contract prefers `assigneeIds`.
- **Expected behavior:** Every Convex call and argument should match `reviews/01-backend-map.md`, including task assignment preference for `assigneeIds`.
- **Impact:** These screens are compile-broken against generated API types and can ship runtime failures if typechecking is bypassed.
- **Root cause hypothesis:** UI work proceeded from inferred/legacy backend names while generated Convex types and the backend contract evolved.
- **Proposed fix:** Audit all `api.*` references against the backend map and generated API, replace stale names with mapped functions, and update assignment payloads to `assigneeIds`.
- **Risk of fix:** High; many feature surfaces are affected and need web typecheck plus smoke tests for settings, Slack, tasks, reports, and migrations.
- **Estimated effort:** L
