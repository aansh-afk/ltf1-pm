# Ship Session Audit Report

> **Generated:** 2026-02-21
> **Scope:** 20 commits from `2b988db` to `1dc6f56` (parallel ship session)
> **Auditor:** Claude Opus 4.6 — full cross-reference against Convex schema, generated API types, and frontend call sites

---

## 1. VERIFIED COMPLETE ✅

### 1.1 BrutalModal z-index fix
- **Intended:** Change `z-50` → `z-[100]` on backdrop and container
- **Implemented:** Both backdrop (line 94) and modal container (line 100) now use `z-[100]`. Affects all 15 modals that delegate to BrutalModal.
- **Caveat:** None — clean fix.

### 1.2 Modal compliance pass (6 modals migrated to BrutalModal)
- **Intended:** Rewrite 6 critical modals to use BrutalModal (portal, ESC, focus trap, ARIA)
- **Implemented:** All 6 now import and use BrutalModal:
  - `NpsSurveyModal` ✅
  - `EditDeveloperProfileModal` ✅
  - `ExpertiseSearchModal` ✅
  - `GlobalSearchModal` ✅ (keyboard nav for ArrowUp/Down/Enter is custom, ESC delegated to BrutalModal)
  - `ConnectRepositoryModal` ✅
  - `UserProfileModal` ✅
- **Caveat:** `CommandPalette` was NOT migrated to BrutalModal — it retains its own portal (`z-[9998]`/`z-[9999]`), ESC handler, focus trap, and ARIA implementation. This is likely intentional due to its top-positioned search UX, but it means it has its own z-index stack (`z-[9998]`/`z-[9999]`) separate from the BrutalModal standard (`z-[100]`).

### 1.3 Security: `createAuditLog` → `internalMutation`
- **Intended:** Prevent client-side calls to `createAuditLog`
- **Implemented:** `convex/audit.ts` line 120: `export const createAuditLog = internalMutation({...})` ✅
- **Caveat:** None — correct fix.

### 1.4 Security: Workspace ACL on `getAuditLogs`
- **Intended:** Verify the caller is a workspace member before returning audit logs
- **Implemented:** `getAuditLogs` checks `ctx.auth.getUserIdentity()`, looks up user, then queries `workspaceMembers` with `by_workspace_user` index. Throws "Access denied: not a workspace member" if not found. ✅
- **Caveat:** None — correct fix.

### 1.5 Security: Strip `botAccessToken` from Slack query
- **Intended:** Remove `botAccessToken` from client-facing `getSlackIntegration` response
- **Implemented:** Handler destructures `const { botAccessToken: _excluded, ...safeIntegration } = integration`. Return validator explicitly lists only safe fields and does NOT include `botAccessToken` or `accessToken`. ✅
- **Caveat:** See Section 2.4 for remaining `accessToken` concern.

### 1.6 Security: `projectMembers` junction table query fix
- **Intended:** Fix `getProjectMembers` to query `projectMembers` junction table instead of crashing
- **Implemented:** `convex/projects/members.ts` queries `projectMembers` table with `by_project` index, then enriches with user details. ✅
- **Caveat:** None.

### 1.7 Automation operator precedence fix
- **Intended:** Fix `runCount ?? 0 + 1` → `(runCount ?? 0) + 1`
- **Implemented:** `convex/automation.ts` line 566: `runCount: ((await ctx.db.get(args.workflowId))?.runCount ?? 0) + 1` ✅
- **Caveat:** None — correct fix. Without parens, `?? 0 + 1` evaluates as `?? 1` (addition binds tighter than `??`), so the counter would never increment from an existing value.

### 1.8 Pricing page overhaul
- **Intended:** 2 tiers (remove enterprise), $15/seat Pro, accurate features, early access messaging
- **Implemented:** Open Source ($0, 9 features) and Pro ($15/seat/month, free during early access, 10 features). PostHog tracking on CTAs. ✅
- **Caveat:** None.

### 1.9 Beta banner
- **Intended:** Dismissible amber top bar for early access
- **Implemented:** `BetaBanner.tsx` — fixed top position, localStorage persistence for dismissal, amber monospace text. Imported in `App.tsx`. ✅
- **Caveat:** None.

### 1.10 Dashboard real data
- **Intended:** Remove hardcoded system metrics, add real meetings count
- **Implemented:** Dashboard shows 4 real stats (workspaces, projects, team members, meetings) via `getDashboardData` and `getUserMeetings` queries. Both queries verified in backend. ✅
- **Caveat:** None.

### 1.11 Sprint snapshots schema + backend
- **Intended:** `sprintSnapshots` table, `captureSprintSnapshot`, `captureAllActiveSprintSnapshots`, burndown/velocity queries, daily cron
- **Implemented:**
  - Schema: 9 fields (`sprintId`, `projectId`, `date`, `totalPoints`, `completedPoints`, `remainingPoints`, `totalTasks`, `completedTasks`, `remainingTasks`) with 3 indexes (`by_sprint`, `by_sprint_and_date`, `by_project`) ✅
  - `captureSprintSnapshot`: Writes all 9 fields, idempotent (skips if today's snapshot exists), uses `by_sprint_and_date` index ✅
  - `captureAllActiveSprintSnapshots`: Uses `sprints.by_status` index to find active sprints ✅
  - `getBurndownData` / `getVelocityData`: Return shapes verified against chart components ✅
  - `crons.ts`: Daily midnight UTC cron added ✅
- **Caveat:** Story points fallback to 1 per task when no estimate exists — this is reasonable but should be documented for users.

### 1.12 BurndownChart + VelocityChart components
- **Intended:** Recharts area chart (burndown) and bar chart (velocity)
- **Implemented:** Both components call correct Convex queries, consume the exact return shape. BurndownChart shows remaining points vs. ideal line. VelocityChart shows completed vs. total with average velocity reference line. ✅
- **Caveat:** None — return shapes verified field-by-field.

### 1.13 TeamPage analytics tab
- **Intended:** Add burndown + velocity charts to TeamPage analytics tab
- **Implemented:** Analytics tab renders `BurndownChart` (current sprint) and `VelocityChart` (project-wide). ✅
- **Caveat:** None.

### 1.14 SprintPage burndown chart
- **Intended:** Add burndown chart to sprint detail page
- **Implemented:** SprintPage renders `BurndownChart` for the current active sprint. ✅
- **Caveat:** None.

### 1.15 TaskTable multi-select
- **Intended:** Checkboxes with select-all and row highlight
- **Implemented:** Checkbox column, select-all in header, selected row highlight styling. Props `selectedIds`, `onSelectionChange`, `onSelectAll` wired. ✅
- **Caveat:** None.

### 1.16 BulkActionBar component
- **Intended:** Fixed bottom bar for multi-task operations (status, priority, delete)
- **Implemented:** Displays selected count, status dropdown, priority dropdown, delete button, clear button. ✅
- **Caveat:** See Section 3.2 and 3.3 for security and validation issues in the backend mutations.

### 1.17 ProjectManagementPage bulk ops wiring
- **Intended:** Wire BulkActionBar with multi-select state, Cmd+A shortcut
- **Implemented:** `selectedTaskIds` state, `handleBulkUpdate` / `handleBulkDelete` / `handleSelectAll` handlers, Cmd+A keyboard shortcut. ✅
- **Caveat:** See Section 3.1 for `handleDuplicateTask` bug.

---

## 2. PARTIAL / NEEDS FOLLOW-UP ⚠️

### 2.1 WorkspaceSettingsPage: `memberRole` derivation is redundant
- **What shipped:** `workspace?.members?.find(m => m.userId === currentUser?._id)?.role`
- **What the backend provides:** `getWorkspaceById` already returns `currentUserRole: member?.role` as a top-level field (line 114 of `convex/workspaces/queries.ts`)
- **Impact:** The current code works because `getWorkspaceById` does embed a `members` array. But the frontend is re-deriving what the backend already computed. Should use `workspace.currentUserRole` instead.
- **Risk:** Low — functional but wasteful. If `getWorkspaceById` is ever optimized to stop embedding `members`, the settings page breaks silently (all admin actions disabled).

### 2.2 CommandPalette z-index island
- **What shipped:** CommandPalette uses `z-[9998]`/`z-[9999]` while every other modal uses `z-[100]`
- **Impact:** CommandPalette will always stack above all modals, which is probably fine for a command palette. But if a modal opens while CommandPalette is open, the z-index relationship is inconsistent with the design system's `z-[100]` standard.
- **Recommendation:** Consider `z-[100]` with a higher sub-value, or document the exception.

### 2.3 `bulkUpdateTasks` loose validators
- **What shipped:** `status: v.optional(v.string())` and `priority: v.optional(v.string())`
- **What the schema enforces:** `status: v.union(v.literal("backlog"), ...)` and `priority: v.union(v.literal("urgent"), ...)`
- **Impact:** The mutation's arg validator accepts ANY string for status/priority. However, Convex's schema validation at write time will reject invalid values. So this won't corrupt data, but it will throw an opaque schema error instead of a clear arg validation error. The user would see "Document failed validation" instead of "Invalid status value".
- **Fix:** Use the same union validators as the schema.

### 2.4 Slack `accessToken` not explicitly excluded
- **What shipped:** `botAccessToken` is destructured out, but `accessToken` is left in the spread
- **Why it's OK for now:** The return validator explicitly lists only safe fields, and Convex strips unlisted fields from the return value at runtime
- **Risk:** If someone loosens the return validator (e.g., changes to `v.any()` during debugging), `accessToken` would leak to the client. Defense-in-depth says explicitly exclude it in the handler.

### 2.5 `bulkUpdateTasks` — `sprintId: null` will fail at schema level
- **What shipped:** `sprintId: v.optional(v.union(v.id("sprints"), v.null()))` in the mutation args
- **What the schema says:** `sprintId: v.optional(v.id("sprints"))` — accepts `undefined` (absent) or a sprint ID, NOT `null`
- **Impact:** If a user tries to bulk-remove sprint assignment (passing `sprintId: null`), `ctx.db.patch(taskId, { sprintId: null })` will throw a schema validation error. The current BulkActionBar UI doesn't expose sprintId controls, so this is not user-reachable yet — but it's a latent bug.
- **Fix:** Either change the schema to `v.optional(v.union(v.id("sprints"), v.null()))`, or convert `null` to `undefined` in the handler before patching (use `delete cleanUpdates.sprintId` when null).

### 2.6 `exportAuditLogs` has a TODO but no ACL
- **What shipped:** Line 413: `// TODO: Check if user has permission to export audit logs`
- **Impact:** Any authenticated user can export full audit log history for any workspace by passing an arbitrary `workspaceId`. See Security section.

### 2.7 `ProjectManagementPage` uses `task.assigneeId` (deprecated field) in multiple places
- **Where:** Lines 1302, 2194, 2906
- **Impact:** The task schema has BOTH `assigneeId` (deprecated, singular) and `assigneeIds` (current, array). The page checks both in filter and stats calculations, which is correct for backward compatibility. But `handleDuplicateTask` (line 2906) passes only `assigneeId` — see Section 3.1.

---

## 3. BROKEN / WRONG ❌

### 3.1 `handleDuplicateTask` passes wrong arg name to `createTask`
- **File:** `apps/web/src/pages/ProjectManagementPage.tsx` line 2906
- **Bug:** Passes `assigneeId: task.assigneeId` (singular) to the `createTask` mutation
- **Backend expects:** `assigneeIds: v.optional(v.array(v.id("users")))` (plural, array)
- **Behavior:** Convex silently strips `assigneeId` because it's not in the args validator. The duplicated task will ALWAYS have no assignees, regardless of the original task.
- **Fix:** Change to `assigneeIds: task.assigneeIds`

### 3.2 `bulkUpdateTasks` has NO workspace/project authorization
- **File:** `convex/tasks/mutations.ts` lines 702-723
- **Bug:** The handler only checks `ctx.auth.getUserIdentity()` — verifies the user is logged in, but never verifies they have access to the tasks' project or workspace
- **Attack:** Any authenticated user can bulk-update ANY tasks across ANY workspace by passing known task IDs. Could change status, priority, labels, assignees, or sprint assignment on tasks they don't own.
- **Severity:** HIGH — authorization bypass
- **Compare:** `createTask` (line 44) calls `requirePermission(ctx.db, user._id, project.workspaceId, "task.create")`; `updateTask` also checks permissions. The bulk mutations skip this entirely.

### 3.3 `bulkDeleteTasks` has NO workspace/project authorization
- **File:** `convex/tasks/mutations.ts` lines 731-744
- **Bug:** Same as 3.2 — only checks authentication, not authorization
- **Attack:** Any authenticated user can bulk-delete ANY tasks across ANY workspace
- **Severity:** HIGH — authorization bypass + data destruction

### 3.4 `cleanupAuditLogs` is a public mutation with no authorization
- **File:** `convex/audit.ts` lines 504-545
- **Bug:** Registered as `mutation` (public), checks only that workspace exists. Does NOT verify the caller is authenticated, let alone an admin.
- **Attack:** Any client (even unauthenticated via direct API call) could trigger deletion of audit logs for any workspace
- **Severity:** HIGH — audit log destruction without authorization

### 3.5 `setRetentionPolicy` is a public mutation with no admin check
- **File:** `convex/audit.ts` lines 466-500
- **Bug:** Registered as `mutation` (public). Checks authentication but not workspace membership or admin role. Line 478: `// TODO: Check if user is admin`
- **Attack:** Any authenticated user can change the retention policy of any workspace
- **Severity:** MEDIUM — configuration tampering

### 3.6 `getAuditLogStats` has no workspace membership check
- **File:** `convex/audit.ts` lines 287-392
- **Bug:** Public query that checks authentication but does NOT verify workspace membership
- **Attack:** Any authenticated user can read audit statistics (event counts, top users, recent events) for any workspace
- **Severity:** MEDIUM — information disclosure of audit activity

---

## 4. SECURITY REVIEW

### 4.1 `createAuditLog` → `internalMutation` ✅ FIXED
- Correctly prevents client-side audit log injection
- No remaining attack surface

### 4.2 `getAuditLogs` workspace ACL ✅ FIXED
- Correctly checks workspace membership via `workspaceMembers` junction table
- No remaining attack surface on this specific endpoint

### 4.3 Slack `botAccessToken` removal ✅ FIXED (with caveat)
- `botAccessToken` explicitly excluded from handler response
- Return validator strips all unlisted fields including `accessToken`
- **Remaining surface:** `accessToken` not explicitly excluded in handler code — relies solely on return validator. Best practice: add `const { botAccessToken: _bot, accessToken: _access, ...safeIntegration } = integration`

### 4.4 `projectMembers` junction table fix ✅ FIXED
- Correctly queries `projectMembers` table instead of crashing

### 4.5 Automation operator precedence ✅ FIXED
- Parenthesized correctly, no remaining issue

### 4.6 REMAINING ATTACK SURFACE — Audit module
| Endpoint | Type | Auth Check | Workspace ACL | Admin Check | Status |
|----------|------|------------|---------------|-------------|--------|
| `createAuditLog` | internalMutation | N/A | N/A | N/A | ✅ Fixed |
| `getAuditLogs` | query | ✅ | ✅ | ❌ | ✅ Fixed (view-level) |
| `getAuditLogStats` | query | ✅ | ❌ | ❌ | ❌ VULNERABLE |
| `exportAuditLogs` | query | ✅ | ❌ | ❌ | ❌ VULNERABLE |
| `setRetentionPolicy` | mutation | ✅ | ❌ | ❌ | ❌ VULNERABLE |
| `cleanupAuditLogs` | mutation | ❌ | ❌ | ❌ | ❌ VULNERABLE |

### 4.7 REMAINING ATTACK SURFACE — Bulk task operations
| Endpoint | Type | Auth Check | Project/Workspace ACL | Status |
|----------|------|------------|----------------------|--------|
| `bulkUpdateTasks` | mutation | ✅ | ❌ | ❌ VULNERABLE |
| `bulkDeleteTasks` | mutation | ✅ | ❌ | ❌ VULNERABLE |

---

## 5. SCHEMA INTEGRITY

### 5.1 `sprintSnapshots` table ✅ FULLY ALIGNED

| Field | Schema Validator | `captureSprintSnapshot` writes | `getBurndownData` reads | `getVelocityData` reads |
|-------|-----------------|-------------------------------|------------------------|------------------------|
| `sprintId` | `v.id("sprints")` | ✅ | ✅ (index query) | ✅ (index query) |
| `projectId` | `v.id("projects")` | ✅ | — | — |
| `date` | `v.number()` | ✅ | ✅ | — |
| `totalPoints` | `v.number()` | ✅ | — | ✅ |
| `completedPoints` | `v.number()` | ✅ | — | ✅ |
| `remainingPoints` | `v.number()` | ✅ | ✅ | — |
| `totalTasks` | `v.number()` | ✅ | — | — |
| `completedTasks` | `v.number()` | ✅ | ✅ | ✅ |
| `remainingTasks` | `v.number()` | ✅ | ✅ | — |

**Indexes verified:**
- `by_sprint` → used by `getBurndownData` and `getVelocityData` ✅
- `by_sprint_and_date` → used by `captureSprintSnapshot` for idempotency check ✅
- `by_project` → defined but not currently used (future analytics) ✅

### 5.2 `bulkUpdateTasks` vs `tasks` schema

| Mutation `updates` field | Mutation validator | Schema field | Schema validator | Match? |
|--------------------------|-------------------|-------------|-----------------|--------|
| `status` | `v.optional(v.string())` | `status` | `v.union(v.literal("backlog"), v.literal("todo"), v.literal("in_progress"), v.literal("in_review"), v.literal("done"), v.literal("cancelled"))` | ⚠️ LOOSE — mutation accepts any string |
| `priority` | `v.optional(v.string())` | `priority` | `v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"))` | ⚠️ LOOSE — mutation accepts any string |
| `assigneeIds` | `v.optional(v.array(v.id("users")))` | `assigneeIds` | `v.optional(v.array(v.id("users")))` | ✅ Exact |
| `labels` | `v.optional(v.array(v.string()))` | `labels` | `v.array(v.string())` | ✅ Compatible |
| `sprintId` | `v.optional(v.union(v.id("sprints"), v.null()))` | `sprintId` | `v.optional(v.id("sprints"))` | ❌ `null` not accepted by schema |

### 5.3 `sprints` table indexes ✅
- `by_project` on `["projectId"]` — used by sprint queries
- `by_status` on `["status"]` — used by `captureAllActiveSprintSnapshots`
- `search_name` search index — used by sprint search

---

## 6. WHAT'S STILL MISSING (from MVP/competitive analysis)

Based on `AUDIT_REPORT.md` and `docs_design/`:

### Zero test coverage
- **0 test files**, 0 unit tests, 0 integration tests, 0 E2E tests
- The audit report flagged this as the #1 infrastructure gap
- No test framework configured (no vitest.config, no playwright.config)

### Remaining modal issues (from audit report Tier 3-5)
- `ConnectRepositoryModal`: The `handleConnectRepo` undefined bug was reportedly fixed (the function now exists), but the `title="UNKNOWN"` issue should be verified
- `CreateProjectModal`, `AddTeamMemberModal`: Still have hardcoded colors (not CSS vars)
- `AISetupModal`: Border radius non-compliance

### Features referenced in schema but minimal/no UI
- **Whiteboard** (`whiteboardElements` table) — schema exists, no evidence of functional UI
- **Video rooms** (`videoRooms` table) — schema exists, likely placeholder
- **Custom fields** (`customFieldDefinitions`, `customFieldValues` tables) — schema exists, no UI found
- **Workflow automation** (`workflows` table + `convex/automation.ts`) — backend exists but no user-facing automation builder
- **Time tracking** — mutations exist (`startTimeTracking`, `pauseTimeTracking`, `stopTimeTracking`) but no dedicated time tracking UI/dashboard
- **GitLab integration** — 4 schema tables exist, minimal implementation
- **Discord integration** — 2 schema tables exist, minimal implementation
- **Jira import** — 2 schema tables exist, no implementation beyond schema

### Missing competitive features (vs Linear, Jira, Shortcut)
- **Notifications center** — no in-app notification UI (only email sending exists)
- **Real-time collaboration** — no presence indicators, live cursors, or collaborative editing
- **Keyboard shortcuts** — CommandPalette exists but no global shortcuts for common actions (create task, search, etc.) beyond Cmd+A in project view
- **Gantt chart** — referenced in ProjectManagementPage view tabs but likely a placeholder
- **Calendar view** — referenced in view tabs but likely a placeholder
- **Filters/saved views** — no persistent filter/view saving
- **Webhooks management UI** — webhook triggers defined in automation but no management page
- **Billing/payments** — PricingPage exists but no actual Stripe/payment integration

---

## 7. NEXT SHIP PRIORITIES

Ranked by severity (security first), user impact, and competitive gap:

### P0 — SECURITY (ship immediately)

1. **Add authorization to `bulkUpdateTasks` and `bulkDeleteTasks`**
   Any authenticated user can modify/delete any task across workspaces. Add `requirePermission()` calls matching `createTask`/`updateTask` patterns. Look up each task's project, then verify workspace access.

2. **Fix audit module endpoints: `getAuditLogStats`, `exportAuditLogs`, `setRetentionPolicy`, `cleanupAuditLogs`**
   Add workspace membership checks to queries, add admin role checks to mutations. Consider making `cleanupAuditLogs` and `setRetentionPolicy` internal mutations triggered by admin UI with proper authorization.

3. **Explicitly exclude `accessToken` from Slack query handler**
   One-line fix: `const { botAccessToken: _bot, accessToken: _access, ...safeIntegration } = integration`

### P1 — BUGS (ship this week)

4. **Fix `handleDuplicateTask` assignee arg**
   Change `assigneeId: task.assigneeId` → `assigneeIds: task.assigneeIds` in ProjectManagementPage line 2906.

5. **Fix `bulkUpdateTasks` validators**
   Replace `v.optional(v.string())` with proper union validators for `status` and `priority`. Fix `sprintId` null handling (convert null to field deletion in handler).

### P2 — INFRASTRUCTURE (ship this sprint)

6. **Set up test framework**
   Configure Vitest + React Testing Library for unit/component tests. Start with tests for security-critical mutations (`bulkUpdateTasks`, `bulkDeleteTasks`, audit endpoints).

7. **Add in-app notifications**
   Users currently get no feedback when assigned tasks, mentioned in comments, or when sprints change. This is the biggest UX gap vs. competitors.

### P3 — FEATURES (next sprint)

8. **Time tracking UI**
   Backend is done (start/pause/stop mutations exist). Need a time tracking panel in task detail view and a time report dashboard.

9. **Workflow automation builder**
   Backend engine exists (`convex/automation.ts` with triggers, conditions, actions). Need a visual workflow builder UI.

10. **Gantt + Calendar views**
    Both are referenced as view tabs in ProjectManagementPage but need actual implementations. Critical for enterprise adoption.

---

## Appendix: Files Changed in This Ship Session

```
convex/audit.ts                                    — security fix (createAuditLog → internalMutation, ACL on getAuditLogs)
convex/automation.ts                               — operator precedence fix
convex/integrations/slack/queries.ts               — strip botAccessToken
convex/projects/members.ts                         — junction table query fix
convex/tasks/mutations.ts                          — bulkUpdateTasks + bulkDeleteTasks
convex/sprints/snapshots.ts                        — NEW: snapshot capture + burndown/velocity queries
convex/schema.ts                                   — sprintSnapshots table added
convex/crons.ts                                    — daily snapshot cron added
apps/web/src/App.tsx                               — BetaBanner import
apps/web/src/components/common/BetaBanner.tsx      — NEW: dismissible beta banner
apps/web/src/components/ui/BrutalModal.tsx         — z-[100] fix
apps/web/src/components/features/sprint/BurndownChart.tsx   — NEW
apps/web/src/components/features/sprint/VelocityChart.tsx   — NEW
apps/web/src/components/features/task/BulkActionBar.tsx     — NEW
apps/web/src/components/features/task/TaskTable.tsx         — multi-select checkboxes
apps/web/src/components/features/user/UserProfileModal.tsx  — BrutalModal migration
apps/web/src/components/features/nps/NpsSurveyModal.tsx     — BrutalModal migration
apps/web/src/components/features/profile/EditDeveloperProfileModal.tsx  — BrutalModal migration
apps/web/src/components/features/profile/ExpertiseSearchModal.tsx       — BrutalModal migration
apps/web/src/components/features/search/GlobalSearchModal.tsx           — BrutalModal migration
apps/web/src/components/features/github/ConnectRepositoryModal.tsx      — BrutalModal migration
apps/web/src/components/shortcuts/CommandPalette.tsx                     — theme vars (NOT migrated to BrutalModal)
apps/web/src/pages/Dashboard.tsx                   — real data stats
apps/web/src/pages/PricingPage.tsx                 — 2-tier overhaul
apps/web/src/pages/TeamPage.tsx                    — analytics tab
apps/web/src/pages/SprintPage.tsx                  — burndown chart
apps/web/src/pages/ProjectManagementPage.tsx       — bulk ops wiring
apps/web/src/pages/WorkspaceSettingsPage.tsx       — crash fix
apps/web/src/pages/ComingSoonPage.tsx              — minor updates
apps/web/src/pages/DesignReferencePage.tsx         — minor updates
```
