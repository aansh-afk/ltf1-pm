# SHIP AUDIT — Post-Session Feature Audit

**Date**: 2026-02-21
**Scope**: Last ~19 commits on `developement` branch
**Auditor**: Claude Opus 4.6 (automated)
**Method**: Full file reads (not diffs) + cross-reference against schema + design system

---

## 1. VERIFIED COMPLETE

These features are shipped, wired end-to-end, and match the schema + design system.

### Security Hardening
- **`convex/audit.ts`** — `createAuditLog` and `cleanupAuditLogs` both converted to `internalMutation`. Not callable from client. ACL checks added to `getAuditLogStats`, `exportAuditLogs`, `setRetentionPolicy` (workspace membership + admin role).
- **`convex/integrations/slack/queries.ts`** — `getSlackIntegration` strips both `botAccessToken` AND `accessToken` via destructuring before return. New `getSlackIntegrationInternal` (`internalQuery`) provides full tokens for server-side use only.
- **`convex/tasks/mutations.ts`** — All mutations (`createTask`, `updateTask`, `deleteTask`, `moveTask`) use `requirePermission` or `canAccessTask` for workspace-level ACL. `bulkUpdateTasks` and `bulkDeleteTasks` check permissions per-task.

### Sprint Snapshot System
- **`convex/sprints/snapshots.ts`** — `captureSprintSnapshot` (internalMutation) is idempotent — checks for existing today's snapshot before insert. `captureAllActiveSprintSnapshots` iterates all active sprints via `by_status` index. Fields match schema exactly: `sprintId`, `projectId`, `date`, `totalPoints`, `completedPoints`, `remainingPoints`, `totalTasks`, `completedTasks`, `remainingTasks`.
- **`convex/crons.ts`** — Daily sprint snapshot cron at `0 0 * * *` UTC. References `internal.sprints.snapshots.captureAllActiveSprintSnapshots`. All cron references use `internal.*` correctly.

### Burndown & Velocity Charts
- **`BurndownChart.tsx`** — Calls `api.sprints.snapshots.getBurndownData` (matches backend). Uses theme vars (`--theme-background`, `--theme-border`, `--theme-foreground`). Empty state shows "check back tomorrow" message. Recharts ComposedChart with Area + Line.
- **`VelocityChart.tsx`** — Calls `api.sprints.snapshots.getVelocityData` (matches backend). Calculates average velocity. Bar chart with reference line. Design system compliant.

### BrutalModal Fixes
- **`BrutalModal.tsx`** — z-index now `z-[100]` (was z-50, previously flagged). Portal-based rendering. Focus trap implemented (Tab + Shift+Tab cycling). ESC key closes. `aria-modal="true"`, `aria-labelledby`. Prevents body scroll. Restores focus on close.

### Notifications & Email
- **`tasks/mutations.ts`** — `createTask` sends `task_assigned` notifications + email to all assignees. `updateTask` sends `task_assigned`/`task_unassigned` notifications for assignee changes, `task_completed` email on done, `task_status_changed` email on status changes. All notifications include `workspaceId`, `actorId`, `entityId`, `entityType`.

### Dashboard & Pricing
- **`Dashboard.tsx`** — Uses combined `api.dashboard.queries.getDashboardData`. Real meetings count via `api.meetings.queries.getUserMeetings`. No hardcoded system metrics.
- **`PricingPage.tsx`** — Clean 2-tier (Open Source + Pro). "Free During Early Access" badge. PostHog tracking on CTA clicks. Design system colors used correctly. Proper Framer Motion staggered animations.

### Time Tracking
- **`tasks/mutations.ts`** — `startTimeTracking`, `pauseTimeTracking`, `stopTimeTracking` all have auth + permission checks. Schema confirmed: `timeEntries.userId` is `v.string()` (Clerk ID) — matches `identity.subject` usage. `tasks.timeTracked` is `v.optional(v.number())` at schema line 229 — confirmed exists.

### Command Palette
- **`CommandPalette.tsx`** — Full keyboard navigation (arrows, Enter, Escape). Focus trap with Tab/Shift+Tab cycling. Search with relevance sorting. Recent commands persisted in localStorage. Grouped by category. Portal-rendered. Proper `aria-modal`, `aria-label`.

---

## 2. PARTIAL / NEEDS FOLLOW-UP

These features work but have gaps, inconsistencies, or missing polish.

### BetaBanner Hardcoded Colors
**File**: `apps/web/src/components/common/BetaBanner.tsx`
**Issue**: Uses hardcoded hex colors (`#111111`, `#F59E0B`, `#6B7280`, `#9CA3AF`) instead of theme CSS vars. Won't adapt to theme changes.
**Fix**: Replace with `var(--theme-background-secondary)`, `var(--theme-warning)`, etc.

### VelocityChart Missing from SprintPage
**File**: `apps/web/src/pages/SprintPage.tsx`
**Issue**: SprintPage shows BurndownChart but NOT VelocityChart. TeamPage (analytics tab) shows both. Inconsistent experience.
**Fix**: Add VelocityChart to SprintPage below the burndown chart.

### TaskTable Context Menu Dead Buttons
**File**: `apps/web/src/components/features/task/TaskTable.tsx` (lines 379-405)
**Issue**: EDIT, DUPLICATE, and LOG TIME context menu buttons have empty onClick handlers — they close the menu but do nothing else.
**Fix**: Wire EDIT to open `EditTaskModal`, DUPLICATE to call a duplicate mutation, LOG TIME to open time tracking.

### Duplicate Bulk Action UIs
**File**: `TaskTable.tsx` (lines 203-219) vs `BulkActionBar.tsx`
**Issue**: TaskTable has its own inline bulk actions bar (ASSIGN, UPDATE STATUS, DELETE) that renders when tasks are selected. The separate `BulkActionBar` component also exists with dropdowns. These are two different UIs for the same purpose.
**Fix**: Remove the inline bar from TaskTable and wire the external `BulkActionBar` consistently.

### BulkActionBar Missing Statuses
**File**: `apps/web/src/components/features/task/BulkActionBar.tsx` (lines 14-19)
**Issue**: Status options only include `todo`, `in_progress`, `in_review`, `done`. Missing `backlog` and `cancelled` from the schema's 6 status values.
**Fix**: Add `{ value: 'backlog', label: 'BACKLOG' }` and `{ value: 'cancelled', label: 'CANCELLED' }`.

### UserProfileModal Stale CSS + Stub Tab
**File**: `apps/web/src/components/features/user/UserProfileModal.tsx`
**Issues**:
1. Uses old CSS classes (`text-brutal-xs`, `text-brutal-sm`, `text-brutal-md`, `primary-brutalist`, `bg-basalt-border`) that may not exist in the current theme system.
2. Activity tab is a stub: "Activity tracking coming soon..."
**Fix**: Replace old classes with theme vars. Implement activity tab or remove it.

### State During Render Anti-Pattern
**Files**: `TeamPage.tsx` (line 255-257), `SprintPage.tsx` (line 214-216)
**Issue**: Both pages call `dispatch`/`setSelectedProjectId` directly during render to auto-select first project. This triggers a React warning and can cause unnecessary re-renders.
**Fix**: Move to `useEffect` with project list as dependency.

### projects/members.ts Missing Returns Validator
**File**: `convex/projects/members.ts`
**Issue**: `getProjectMembers` query has no `returns` validator. Violates Convex guidelines that require validators on all functions.
**Fix**: Add `returns: v.array(v.object({...}))` matching the actual return shape.

### CommandPalette Full Framer Import
**File**: `apps/web/src/components/shortcuts/CommandPalette.tsx` (line 3)
**Issue**: Imports `motion` from `framer-motion` instead of `m` from `framer-motion`. Every other component in the app uses `m` via `LazyMotion` for tree-shaking. This pulls in the full framer-motion bundle.
**Fix**: Change `import { motion }` to `import { m }` and use `<m.div>` instead of `<motion.div>`.

### CommandPalette Rounded Corners
**File**: `CommandPalette.tsx` (line 54, 88)
**Issue**: Uses `rounded-md` and `rounded` CSS classes. Design system specifies 0px corners for content blocks and cards.
**Fix**: Remove `rounded-md`/`rounded` classes.

### slackIntegrations Return Validator Mismatch
**File**: `convex/integrations/slack/queries.ts` (line 54)
**Issue**: `getSlackIntegrationInternal` return validator declares `accessToken: v.optional(v.string())` but the schema defines `slackIntegrations.accessToken` as `v.string()` (required). Validator is more permissive than schema.
**Fix**: Change to `accessToken: v.string()` in the return validator.

---

## 3. BROKEN / WRONG

These are bugs, security holes, or logic errors that will cause runtime failures or data integrity issues.

### CRITICAL: automation.ts — No Workspace ACL on Workflow CRUD
**File**: `convex/automation.ts`
**Impact**: Any authenticated user can create, update, or delete workflows in ANY workspace.
**Details**: `createWorkflow`, `updateWorkflow`, `deleteWorkflow` only check `ctx.auth.getUserIdentity()` (is user logged in?) but never verify workspace membership. A user from Workspace A can manipulate Workspace B's automation workflows.
**Fix**: Add workspace membership check after auth identity check. Pattern: look up user by `clerkId`, then query `workspaceMembers` to verify membership.

### CRITICAL: automation.ts — Public Mutations Should Be Internal
**File**: `convex/automation.ts`
**Impact**: `createWorkflowRun` and `updateWorkflowRun` are registered as public `mutation()` but are only called from the `executeWorkflow` server-side helper.
**Details**: Anyone can call these from the client to fabricate workflow execution records.
**Fix**: Convert both to `internalMutation`. Update `executeWorkflow` to use `internal.automation.*` references.

### HIGH: automation.ts — Queries With No Auth
**File**: `convex/automation.ts`
**Impact**: `getWorkflowById`, `getWorkflowsByTrigger`, `exportWorkflowTemplate` have zero authentication checks. Any unauthenticated user can read workflow configurations.
**Fix**: Add `ctx.auth.getUserIdentity()` check + workspace membership verification.

### HIGH: WorkspaceSettingsPage Feature Keys Don't Match Schema
**File**: `apps/web/src/pages/WorkspaceSettingsPage.tsx` (lines 109-112, 468-471)
**Schema** (`convex/schema.ts` lines 56-61): `workspace.settings.features` has keys: `gitIntegration`, `aiFeatures`, `meetings`, `timeTracking`
**Frontend** reads/writes: `enableProjects`, `enableTasks`, `enableSprints`
**Impact**: The settings page reads undefined keys (always get `undefined`, fall back to defaults) and writes keys that don't exist in the schema. Feature toggles have NO EFFECT. Convex schema validation may reject writes.
**Fix**: Either update the schema to include the frontend keys, or update the frontend to use the schema keys. Likely need to align both to a unified set.

### HIGH: projects/members.ts Returns Wrong Role
**File**: `convex/projects/members.ts`
**Impact**: Shows user's global role (admin/user from users table) instead of their project-specific role (lead/member/contributor/viewer from projectMembers table).
**Details**: The query fetches from the `users` table and returns `user.role`. It should be reading the `role` field from the `projectMembers` junction table.
**Fix**: Return `member.role` from the projectMembers record instead of `user.role`.

### MEDIUM: automation.ts — incrementWorkflowErrorCount Is a No-Op
**File**: `convex/automation.ts`
**Impact**: Function exists but does nothing useful — `errorCount` field was removed from the workflows schema but the mutation still references it.
**Fix**: Either remove the mutation entirely or re-add error tracking to the schema.

### MEDIUM: automation.ts — updateWorkflowRun Field Mismatch
**File**: `convex/automation.ts`
**Impact**: `updateWorkflowRun` passes an `actions` field but the `workflowRuns` schema uses `executionLog`. The field name doesn't match. Data may be written to the wrong field or silently dropped.
**Fix**: Align field names between the mutation args and the schema.

### LOW: TaskTable Inline Bulk Actions Are Non-Functional
**File**: `TaskTable.tsx` (lines 209-218)
**Impact**: The inline ASSIGN and UPDATE STATUS buttons in the TaskTable's own bulk bar render but have no onClick handlers — they're visual-only. The DELETE button also doesn't connect to `bulkDeleteTasks`.
**Fix**: Either remove the inline bar and use `BulkActionBar` exclusively, or wire the handlers.

---

## 4. SECURITY REVIEW

| Severity | File | Issue | Status |
|----------|------|-------|--------|
| **CRITICAL** | `automation.ts` | Workflow CRUD: zero workspace membership verification | OPEN |
| **CRITICAL** | `automation.ts` | `createWorkflowRun`/`updateWorkflowRun` public but should be internal | OPEN |
| **HIGH** | `automation.ts` | `getWorkflowById`/`getWorkflowsByTrigger`/`exportWorkflowTemplate` no auth | OPEN |
| **MEDIUM** | `sprints/snapshots.ts` | `getBurndownData`/`getVelocityData` public queries with no auth check | OPEN |
| **MEDIUM** | `audit.ts` | `getAuditLogs` collects ALL logs then filters in memory — perf risk | OPEN |
| **LOW** | `BulkActionBar.tsx` | z-50 instead of z-[100] | OPEN |
| **FIXED** | `audit.ts` | `createAuditLog` → `internalMutation` | DONE |
| **FIXED** | `audit.ts` | `cleanupAuditLogs` → `internalMutation` | DONE |
| **FIXED** | `audit.ts` | ACL on `exportAuditLogs`, `setRetentionPolicy` | DONE |
| **FIXED** | `slack/queries.ts` | Token stripping (`botAccessToken` + `accessToken`) | DONE |
| **FIXED** | `slack/queries.ts` | `getSlackIntegrationInternal` as `internalQuery` | DONE |
| **FIXED** | `BrutalModal.tsx` | z-index → z-[100] | DONE |

---

## 5. SCHEMA INTEGRITY

### Confirmed Matches
| Frontend/Backend | Schema Field | Status |
|-----------------|--------------|--------|
| `captureSprintSnapshot` insert | `sprintSnapshots` all 9 fields | MATCH |
| `getBurndownData` → BurndownChart props | `date`, `remainingPoints`, `remainingTasks`, `idealRemaining` (computed) | MATCH |
| `getVelocityData` → VelocityChart props | `sprintId`, `sprintName`, `completedPoints`, `totalPoints`, `completedTasks` | MATCH |
| `createTask` notification insert | `notifications` required fields | MATCH |
| `updateTask` patches | `tasks` field names | MATCH |
| `startTimeTracking` → `timeEntries.userId` | `v.string()` (Clerk ID) | MATCH |
| `stopTimeTracking` → `tasks.timeTracked` | `v.optional(v.number())` at line 229 | MATCH |
| `bulkUpdateTasks` fields | `tasks` schema fields | MATCH |
| Cron → `captureAllActiveSprintSnapshots` | `sprints` `by_status` index exists | MATCH |

### Confirmed Mismatches
| Location | Expected (Schema) | Actual (Code) | Impact |
|----------|-------------------|---------------|--------|
| `WorkspaceSettingsPage` feature keys | `gitIntegration`, `aiFeatures`, `meetings`, `timeTracking` | `enableProjects`, `enableTasks`, `enableSprints` | Feature toggles have NO EFFECT |
| `projects/members.ts` role source | `projectMembers.role` (lead/member/contributor/viewer) | `users.role` (admin/user) | Wrong role displayed |
| `getSlackIntegrationInternal` return validator | `accessToken: v.string()` (required) | `accessToken: v.optional(v.string())` | Validator too permissive |
| `automation.ts` `updateWorkflowRun` | `executionLog` field | `actions` field | Field name mismatch |

---

## 6. WHAT'S STILL MISSING

### Test Coverage
**ZERO test coverage across the entire codebase.** No unit tests, no integration tests, no E2E tests. This was flagged in the previous AUDIT_REPORT.md and remains unchanged.

### Missing Routes
- No `/workspace/:workspaceId/settings` route. `WorkspaceSettingsPage` exists but is rendered as a child component of `WorkspaceManagementPage`, not independently routable.

### Missing Features
- **UserProfileModal** activity tab is a stub ("Activity tracking coming soon...")
- **TaskTable** EDIT and DUPLICATE context menu actions are no-ops (empty handlers)
- **moveTask** mutation doesn't log activity (inconsistent with `updateTask` which logs all changes)
- No confirmation dialog before bulk delete (immediate execution without user confirmation)
- `getAuditLogs` does full table scan then memory-filters — no dedicated index for filtered queries

### Design System Gaps
- **BetaBanner**: Hardcoded hex colors (should use CSS vars)
- **PricingPage**: All hardcoded hex colors (matching spec values but not using vars — won't adapt to future themes)
- **BulkActionBar**: Hardcoded `#111111`, `#6366F1`, `#EF4444` instead of theme vars
- **TaskTable**: Hardcoded colors throughout instead of theme vars
- **CommandPalette**: Uses `rounded-md` (should be 0px per design system)

---

## 7. NEXT SHIP PRIORITIES

### P0 — Security (fix before any other ship)
1. **`automation.ts` workspace ACL** — Add `workspaceMembers` lookup to `createWorkflow`, `updateWorkflow`, `deleteWorkflow`. Add auth checks to `getWorkflowById`, `getWorkflowsByTrigger`, `exportWorkflowTemplate`.
2. **`automation.ts` convert to internal** — Change `createWorkflowRun` and `updateWorkflowRun` to `internalMutation`.
3. **`sprints/snapshots.ts` auth checks** — Add `ctx.auth.getUserIdentity()` to `getBurndownData` and `getVelocityData`.

### P1 — Data Integrity (fix before next demo)
4. **WorkspaceSettingsPage feature keys** — Align frontend keys with schema (`gitIntegration`/`aiFeatures`/`meetings`/`timeTracking`) or update schema to match frontend. Current state: feature toggles are broken.
5. **projects/members.ts role source** — Read role from `projectMembers` table, not `users` table.
6. **automation.ts field mismatch** — Fix `updateWorkflowRun` to use `executionLog` instead of `actions`. Remove dead `incrementWorkflowErrorCount`.

### P2 — UX Completeness (fix before next sprint)
7. **Wire TaskTable context menu** — EDIT, DUPLICATE, LOG TIME actions.
8. **Consolidate bulk action UIs** — Remove inline bar from TaskTable, wire BulkActionBar exclusively.
9. **Add missing statuses to BulkActionBar** — `backlog` and `cancelled`.
10. **Add VelocityChart to SprintPage** — Parity with TeamPage analytics tab.
11. **Fix state-during-render** — TeamPage + SprintPage project auto-selection.

### P3 — Polish (fix when time allows)
12. **Replace hardcoded colors** — BetaBanner, BulkActionBar, TaskTable → theme CSS vars.
13. **CommandPalette** — Switch `motion` → `m` import, remove `rounded-md`.
14. **UserProfileModal** — Replace old CSS classes, implement or remove activity tab.
15. **projects/members.ts** — Add `returns` validator.
16. **slackIntegrations return validator** — Fix `accessToken` from optional to required.

### P4 — Testing (ongoing)
17. **Begin test coverage** — Start with task mutations (highest risk), sprint snapshots (data integrity), and auth/permissions (security-critical). Target: 80% coverage on `convex/tasks/mutations.ts` and `convex/auth/permissions.ts`.

---

*Generated by automated audit. All findings based on actual file reads, not diffs.*
