# SHIP_AUDIT_2.md — Post-Fix Validation Report

**Date**: 2026-02-21
**Scope**: Fix session following SHIP_AUDIT.md findings + new features
**Status**: ALL BUILDS PASSING — Convex deployed, frontend built zero errors

---

## 1. Security Fixes (3 HIGH — all resolved)

### 1a. bulkDeleteTasks authorization bypass — FIXED (commit e53d208)
- **File**: `convex/tasks/mutations.ts`
- **Fix**: Added Clerk identity lookup, user fetch via `by_clerk_id` index, and `requirePermission(ctx.db, user._id, project.workspaceId, "task.delete")` per-task inside the delete loop
- **Note**: `bulkUpdateTasks` was already patched in a prior session

### 1b. Audit module ACL gaps — FIXED (commit 7fd5ab6)
- **File**: `convex/audit.ts`
- **Fix**: `setRetentionPolicy` — added workspace membership check + admin/owner role guard
- **Fix**: `cleanupAuditLogs` — changed from public `mutation` to `internalMutation` (no public access)
- **Note**: `getAuditLogStats` and `exportAuditLogs` were already patched in a prior session

### 1c. Slack token defense-in-depth — FIXED (commit c7335f5)
- **File**: `convex/integrations/slack/queries.ts`
- **Fix**: `getSlackIntegration` now destructures out both `botAccessToken` and `accessToken` before returning
- **Additional fix (this session)**: Added `getSlackIntegrationInternal` internalQuery for server-side Slack event processing, updated `events.ts` to use it

---

## 2. Data Bug Fixes (2 — all resolved)

### 2a. handleDuplicateTask wrong arg name — ALREADY FIXED
- **File**: `apps/web/src/pages/ProjectManagementPage.tsx:2906`
- **Status**: Already reads `assigneeIds: task.assigneeIds ?? []` (fixed in prior session)

### 2b. WorkspaceSettingsPage stale member derivation — FIXED (commit bea9f9c)
- **File**: `apps/web/src/pages/WorkspaceSettingsPage.tsx`
- **Fix**: Replaced `workspace?.members?.find(m => m.userId === currentUser?._id)?.role` with `workspace?.currentUserRole` (backend-computed field)

---

## 3. Notification System (NEW — 3 commits)

### Backend (commit d6db6f9)
- **File**: `convex/notifications.ts` — 5 functions:
  - `getNotifications` (query) — paginated by workspace + user
  - `getUnreadCount` (query) — unread badge count
  - `markAsRead` (mutation) — single notification
  - `markAllAsRead` (mutation) — all in workspace
  - `createNotification` (internalMutation) — server-side creation
- **Schema**: `notifications` table with type union: `task_assigned | task_unassigned | task_comment | task_mention | sprint_started | sprint_completed | member_joined | workspace_invitation | pr_merged`
- Indexes: `by_user`, `by_user_and_workspace`, `by_user_and_read`

### Frontend (commits de8d77c, d9d0199)
- `NotificationCenter.tsx` — notification list panel with mark-read, brutalist design
- `NotificationBell.tsx` — bell icon with unread count badge, wired into `DashboardLayout.tsx`

### Integration fixes (this session, uncommitted)
- Updated 5 existing notification insert sites (tasks, comments, workspaces) from old field format (`message`/`read`/`data`/`createdAt`) to new format (`body`/`isRead`/`actorId`/`entityId`/`entityType`)
- Fixed notification type literals: `task.assigned` → `task_assigned`, `comment.added` → `task_comment`, etc.

---

## 4. Time Tracking UI (NEW — 3 commits)

### Components
- `TimeTracker.tsx` (commit 6b365f6) — inline start/pause/stop timer widget, restores active session on mount
- `TaskTimePanel.tsx` (commit 129793e) — time entry history panel with TimeTracker + session list

### Page
- `TimeReportPage.tsx` (commit 046be84) — full workspace time report with date range filters, summary cards, task breakdown table, session log
- **Route**: Wired as `/time-report` in App.tsx (this session)

---

## 5. Additional Fixes (this session, post-agent)

### video.ts audit call fix
- Changed `api.audit.createAuditLog` → `internal.audit.createAuditLog` (3 call sites)
- `createAuditLog` is an `internalMutation`, so public API reference was invalid

### Slack events token access fix
- Added `getSlackIntegrationInternal` internalQuery that returns full integration including `botAccessToken`
- Updated `sendSlackNotification` in events.ts to use internal query instead of token-stripped public query

---

## 6. Pre-Existing Features Verified (no action needed)

| Feature | Status | Notes |
|---------|--------|-------|
| GanttView | Already exists | 651-line SVG implementation in ProjectManagementPage |
| CalendarView | Already exists | Month/week/agenda views in ProjectManagementPage |
| Slack accessToken exclusion | Already fixed | Line 36 in queries.ts |
| bulkUpdateTasks auth | Already fixed | Has requirePermission + union validators |

---

## 7. Build Validation

| Check | Result |
|-------|--------|
| `npx convex dev --once` | PASS — schema validated, functions deployed |
| Schema index migration | Deleted `by_user_read`, added `by_user_and_read` + `by_user_and_workspace` |
| `pnpm build` (apps/web) | PASS — zero errors, built in 14.29s |
| TimeReportPage route | Wired at `/time-report` |

---

## 8. Commits Shipped (this fix session)

| Hash | Type | Description |
|------|------|-------------|
| e53d208 | fix | bulkDeleteTasks missing workspace authorization |
| c7335f5 | fix | Slack accessToken defense-in-depth |
| 7fd5ab6 | fix | Audit module ACL hardening |
| bea9f9c | refactor | WorkspaceSettingsPage use backend-computed role |
| d6db6f9 | feat | Notifications backend — schema + queries/mutations |
| de8d77c | feat | NotificationCenter component |
| d9d0199 | feat | NotificationBell with unread count badge |
| 6b365f6 | feat | TimeTracker component |
| 129793e | feat | TaskTimePanel — time entry history |
| 046be84 | feat | TimeReportPage — full time tracking report |

---

## 9. Remaining Items for Next Session

- [ ] Wire NotificationCenter to receive real-time notifications from task/comment/workspace mutations (currently inserts directly, could use `createNotification` internal mutation for consistency)
- [ ] Add notification preferences UI to user settings
- [ ] TimeTracker backend validation (ensure `startTimeEntry`/`stopTimeEntry` mutations exist and match frontend expectations)
- [ ] E2E test coverage for bulk operations + notification flow
- [ ] Consider migrating old notification records to new schema format (backfill `workspaceId`, `body`, `isRead`)
