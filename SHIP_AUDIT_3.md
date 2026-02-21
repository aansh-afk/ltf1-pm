# SHIP AUDIT 3 — Post-Ship Cross-Reference Validation

**Date**: 2026-02-22
**Auditor**: Claude Opus 4.6
**Branch**: `developement`
**Scope**: Security, Data Integrity, Frontend Crashes, Feature Completeness, Pricing, Developer Profiles

---

## Severity Legend

| Tag | Meaning |
|-----|---------|
| **HIGH** | Security hole, data corruption risk, or crash in production |
| **MEDIUM** | Functional bug, broken feature toggle, wrong data displayed |
| **LOW** | Cosmetic, minor inconsistency, non-blocking |

---

## Findings

### 1. automation.ts — CRITICAL Security Issues (STILL OPEN)

**Severity: HIGH**

The automation engine remains the single largest security liability in the codebase. All issues flagged in SHIP_AUDIT.md are still present.

**1a. No workspace ACL on CRUD mutations**
- `createWorkflow` (line ~100): Only checks `ctx.auth.getUserIdentity()` — no workspace membership check. Any authenticated user can create workflows in ANY workspace.
- `updateWorkflow` (line ~180): Same — auth only, no workspace ACL.
- `deleteWorkflow` (line ~250): Same — auth only, no workspace ACL.

**1b. Public queries with ZERO auth**
- `getWorkflowsByTrigger` (line 465): Public `query` with NO authentication check at all. Any client can enumerate all workflows filtered by trigger type.
- `getWorkflowById`: Public `query` with NO auth. Returns full workflow config including action configs.

**1c. Public mutations that should be `internalMutation`**
- `createWorkflowRun` (line 378): Public mutation with NO auth. Only called from `executeWorkflow` helper — should be `internalMutation`.
- `updateWorkflowRun` (line 400): Public mutation with NO auth. Same — only called internally.
- `updateWorkflowLastExecuted` (line 557): Public mutation with NO auth. Only called from `processScheduledWorkflows`.
- `incrementWorkflowErrorCount` (line 647): Public mutation, is a complete no-op (errorCount field removed from schema). Dead code.

**1d. Field name mismatch in executeWorkflow**
- `executeWorkflow` (line 617, 635): Passes `actions: actionResults` to `updateWorkflowRun`, but the mutation expects `executionLog` field with shape `{ timestamp, action, status, message, data }`. The `actionResults` has shape `{ type, status, startedAt, completedAt, result/error }`. Data is silently dropped — workflow runs never record execution logs.

**1e. Operator precedence bug in evaluateConditions**
- `evaluateConditions` (line 748): Evaluates conditions left-to-right without respecting AND>OR precedence. `A OR B AND C` evaluates as `(A OR B) AND C` instead of `A OR (B AND C)`. Standard boolean logic expects AND to bind tighter.

---

### 2. sprints/snapshots.ts — Missing Auth on Public Queries

**Severity: HIGH**

- `getBurndownData`: Public `query` with NO authentication. Anyone with a sprint ID can read burndown data.
- `getVelocityData`: Public `query` with NO authentication. Anyone with a project ID can read velocity data.

Both are consumed by `BurndownChart.tsx` (line 23) and `VelocityChart.tsx` (line 22) which pass IDs directly from props — works fine for authenticated users but the backend has no access control.

---

### 3. projects/members.ts — Returns Wrong Role Source

**Severity: MEDIUM**

`getProjectMembers` returns `user.role` (from the `users` table: "admin" | "user") instead of the `projectMembers` junction table's role field ("lead" | "member" | "contributor" | "viewer"). This means project-level roles are never surfaced to the frontend — all project members appear as their global role.

---

### 4. WorkspaceSettingsPage — Feature Key Mismatch

**Severity: MEDIUM**

`WorkspaceSettingsPage.tsx` FeaturesTab (around line 108) uses keys:
- `enableProjects`, `enableTasks`, `enableMeetings`, `enableSprints`, `enableTimeTracking`

Schema `workspaces.settings.features` uses keys:
- `gitIntegration`, `aiFeatures`, `meetings`, `timeTracking`

Only `meetings` and `timeTracking` have any overlap. The frontend reads/writes keys (`enableProjects`, `enableTasks`, `enableSprints`) that don't exist in the schema. Feature toggles are functionally broken.

**Note**: `updateWorkspace` mutation (line 95) does accept both old and new keys in its validator (lines 108-114), so writes won't error — they just write orphan keys that nothing reads.

---

### 5. NotificationCenter.tsx — Hardcoded Colors

**Severity: LOW**

`NotificationCenter.tsx` line 194: Date group sticky header uses hardcoded `bg-[#0A0A0A]` and `border-[#2E2E35]` instead of CSS variables (`var(--theme-background)`, `var(--theme-border)`). This breaks theme support for non-dark themes.

Similarly, line 153: Unread badge uses `bg-[#EF4444]` instead of `var(--theme-error)`.

---

### 6. timeEntries.ts — getTimeEntriesByUser Leaks Cross-User Data

**Severity: MEDIUM**

`getTimeEntriesByUser` (line 46): Accepts an arbitrary `userId` string parameter and returns all time entries for that user. While it checks `ctx.auth.getUserIdentity()`, it does NOT verify that the authenticated user matches the requested `userId` or has manager permissions. Any authenticated user can read any other user's time entries.

Same issue with `getTimeStatsByUser` (line 454) and `getActiveTimeEntry` (line 77).

`approveTimeEntries` (line 427): Has a `// TODO: Check if user is a manager/admin` comment — no role check implemented.

---

### 7. timeEntries.ts — In-Memory Filtering Instead of Index

**Severity: LOW**

`getTimeEntriesByUser` and `getTimeStatsByUser` both collect ALL entries by user, then filter in-memory by date range. For users with many time entries, this is a performance concern. Should use a composite index `by_user_and_startTime: ["userId", "startTime"]` for efficient range queries.

Same pattern in `getTimeEntriesForApproval` line 188 — uses `.filter()` after `.collect()` instead of an index.

---

### 8. PricingPage — Verified Correct

**Severity: N/A**

PricingPage has exactly 2 tiers:
- **Open Source**: $0 free forever, up to 5 members, 100 AI credits/month
- **Pro**: $15/seat/month (free during Early Access), unlimited members, all features

Both CTAs link to `/sign-up`. No fake "Enterprise" tier. "Additional tiers and Stripe billing coming soon" footer note present. PostHog analytics tracking on CTA clicks.

---

### 9. DeveloperProfilePage — No Hardcoded Fake Numbers

**Severity: N/A**

`DeveloperProfilePage.tsx` (line 474): Uses real API calls:
- `api.developers.queries.getDeveloperProfile` for profile data
- `api.activities.queries.getActivityStats` for 30-day activity count
- `api.developers.mutations.updateStatus` for status changes
- `api.developers.mutations.syncGithubStats` for GitHub sync

Stats display (activities, technologies, contributions, experience) all come from API data with `|| 0` fallbacks. No hardcoded fake numbers.

---

### 10. MyProfilePage — No Dead CTAs

**Severity: N/A**

`MyProfilePage.tsx` (line 129): "EDIT PROFILE" button (line 218) opens `EditDeveloperProfileModal`. Profile completion banner (line 185) "COMPLETE" button also opens the modal. Both use `setShowEditModal(true)` which is properly wired.

Auto-opens modal for users without profiles (line 156-159). Profile redirect flow via sessionStorage (line 6-13) works for onboarding.

---

### 11. SettingsPage — Notification Preferences Verified

**Severity: N/A**

`SettingsPage.tsx` NotificationsTab (line 219): Exposes 8 notification type toggles:
- `task_assigned`, `task_unassigned`, `task_comment`, `task_mention`
- `sprint_started`, `sprint_completed`, `member_joined`, `workspace_invitation`

All match the notification types in the schema. Email/push toggle (lines 230-246) maps to `preferences.notifications.email` and `.push`. The `updateUserPreferences` mutation is properly called on save.

**AI Tab**: Renders `<AISettingsTab />` component (line 599). Separate component, not audited in detail.

---

### 12. Sprint Notifications — Verified Working

**Severity: N/A**

`sprints/mutations.ts` `updateSprint`:
- Sprint started (line 172): Sends `sprint_started` notification to all active project members via `internal.notifications.createNotification` + email via `internal.email.send.sendEmail`.
- Sprint completed (line 215): Sends `sprint_completed` notification to all active project members + email.

Both correctly skip the actor (the user who triggered the action).

---

### 13. Workspace Invitation Notifications — Verified Working

**Severity: N/A**

`workspaces/mutations.ts` `inviteToWorkspace` (line 287): Sends `workspace_invitation` notification via `internal.notifications.createNotification` when inviting an existing user. Email notification also sent (line 299+).

---

### 14. BurndownChart / VelocityChart — Query Shape Match

**Severity: N/A**

- `BurndownChart.tsx` expects `data[].remainingPoints` and `data[].idealRemaining` — matches `getBurndownData` return shape from `sprints/snapshots.ts`.
- `VelocityChart.tsx` expects `data[].completedPoints`, `data[].totalPoints`, `data[].completedTasks`, `data[].sprintName` — matches `getVelocityData` return shape.

Both handle empty data gracefully with informational empty states.

---

### 15. BulkActionBar — Properly Wired

**Severity: N/A**

`BulkActionBar.tsx` (line 80): Receives `selectedCount`, `selectedIds`, `onStatusChange`, `onPriorityChange`, `onDelete`, `onClearSelection` as props. Shows/hides based on `selectedCount === 0`. Status and priority dropdowns pass values to parent callbacks. Delete button calls `onDelete`.

Fixed position at bottom of screen with z-50. Uses `role="toolbar"` with proper aria-label. No dead buttons.

---

### 16. TimeReportPage — API Calls Match Backend

**Severity: N/A**

`TimeReportPage.tsx`:
- Line 127: `api.timeEntries.getTimeStatsByUser` with `{ userId: clerkUserId, startDate, endDate }` — matches backend args.
- Line 131: `api.timeEntries.getTimeEntriesByUser` with same args — matches backend.
- CSV export (line 183) generates from filtered entries client-side.
- Task breakdown from `timeStats.taskBreakdown` — matches backend return shape.

---

## Pre-Existing Features Verified

| Feature | Status | Evidence |
|---------|--------|----------|
| Notification system (backend) | **Working** | `createNotification` is `internalMutation`, called from task/sprint/workspace mutations |
| Notification center (frontend) | **Working** | `NotificationCenter.tsx` wired to `api.notifications.*` queries/mutations |
| Comment notifications | **Working** | `comments/mutations.ts` line 71 calls `createNotification` for assignees |
| Task assignment notifications | **Working** | `tasks/mutations.ts` sends `task_assigned`/`task_unassigned` notifications |
| Sprint notifications | **Working** | `sprints/mutations.ts` sends `sprint_started`/`sprint_completed` to project members |
| Workspace invitation notifications | **Working** | `workspaces/mutations.ts` line 287 sends `workspace_invitation` notification |
| Notification preferences (UI) | **Working** | `SettingsPage.tsx` NotificationsTab with 8 type toggles + email/push |
| Time tracking (backend) | **Working** | `convex/timeEntries.ts` — startTimer, stopTimer, createManualEntry, approve |
| Time report (frontend) | **Working** | `TimeReportPage.tsx` — date range, billable filter, CSV export, task breakdown |
| Burndown chart | **Working** | `BurndownChart.tsx` + `sprints/snapshots.ts` `getBurndownData` |
| Velocity chart | **Working** | `VelocityChart.tsx` + `sprints/snapshots.ts` `getVelocityData` |
| Bulk actions bar | **Working** | `BulkActionBar.tsx` — status, priority, delete with proper callbacks |
| Pricing page (2 tiers) | **Working** | Open Source ($0) + Pro ($15, free in EA). No fake Enterprise tier |
| Developer profile (no fake data) | **Working** | All stats from real API calls with `|| 0` fallbacks |
| My profile (no dead CTAs) | **Working** | Edit/Complete buttons open `EditDeveloperProfileModal` |
| Audit log ACL | **Working** | `getAuditLogs` checks auth + workspace membership |
| Slack token stripping | **Working** | `getSlackIntegration` strips both `botAccessToken` and `accessToken` |
| Bulk task auth | **Working** | `bulkUpdateTasks`/`bulkDeleteTasks` check `requirePermission` per-task |
| Dashboard (no fake data) | **Working** | Uses `getDashboardData` query, stats computed from real workspace data |

---

## Build Status

| Build | Result | Time |
|-------|--------|------|
| `pnpm build` (frontend) | **PASS** | 7.32s |
| `npx convex dev --once` (backend) | **PASS** | 13.8s |

---

## Remaining Items (Prioritized)

### HIGH Priority — Must Fix Before Ship

1. **automation.ts — Add workspace ACL to all CRUD mutations** (`createWorkflow`, `updateWorkflow`, `deleteWorkflow`). Verify `workspaceId` membership for the authenticated user.

2. **automation.ts — Convert internal-only mutations to `internalMutation`**: `createWorkflowRun`, `updateWorkflowRun`, `updateWorkflowLastExecuted`. Remove dead `incrementWorkflowErrorCount`.

3. **automation.ts — Add auth to public queries**: `getWorkflowsByTrigger`, `getWorkflowById`. Add `ctx.auth.getUserIdentity()` + workspace membership check.

4. **sprints/snapshots.ts — Add auth to `getBurndownData` and `getVelocityData`**. At minimum verify `ctx.auth.getUserIdentity()`.

5. **timeEntries.ts — Fix cross-user data leakage**: `getTimeEntriesByUser`, `getTimeStatsByUser`, `getActiveTimeEntry` should verify `identity.subject === args.userId` or check manager role. `approveTimeEntries` needs manager/admin role check (currently has TODO comment).

### MEDIUM Priority — Should Fix

6. **automation.ts — Fix `executeWorkflow` field name mismatch**: Change `actions: actionResults` to `executionLog` with correct shape `{ timestamp, action, status, message, data }`.

7. **automation.ts — Fix operator precedence in `evaluateConditions`**: AND should bind tighter than OR. Implement proper precedence grouping or document left-to-right evaluation as intentional.

8. **WorkspaceSettingsPage — Fix feature key mismatch**: Align FeaturesTab keys with schema keys (`gitIntegration`, `aiFeatures`, `meetings`, `timeTracking`) OR update schema to include the `enable*` keys.

9. **projects/members.ts — Return `projectMembers.role`** instead of `user.role` so project-level roles (lead/member/contributor/viewer) are surfaced correctly.

### LOW Priority — Nice to Have

10. **NotificationCenter.tsx — Replace hardcoded colors** (`#0A0A0A`, `#2E2E35`, `#EF4444`) with CSS variables for theme support.

11. **timeEntries.ts — Add composite index** `by_user_and_startTime: ["userId", "startTime"]` for efficient date-range queries instead of in-memory filtering.

12. **audit.ts — `getAuditLogs`** uses `.collect()` then filters in memory. For large audit tables, add index-based filtering.
