# LTF1 Mobile -- Screen Specifications

**Platform**: Android (React Native / Expo Router)
**Screens**: 7 MVP screens
**Auth Provider**: Clerk
**Backend**: Convex (real-time subscriptions)
**Design System**: Dark brutalist terminal

---

## Table of Contents

1. [Sign In](#1-sign-in)
2. [Sign Up](#2-sign-up)
3. [Dashboard](#3-dashboard)
4. [Projects List](#4-projects-list)
5. [Project Detail](#5-project-detail)
6. [Task Detail](#6-task-detail)
7. [Quick Capture](#7-quick-capture)

---

## Design Tokens (Mobile)

All screens share these values derived from the web design system.

| Token              | Value                          |
|--------------------|--------------------------------|
| Background Base    | `#050505`                      |
| Surface            | `#0A0A0A`                      |
| Card               | `#111111`                      |
| Text Primary       | `#F9FAFB`                      |
| Text Secondary     | `#9CA3AF`                      |
| Text Tertiary      | `#6B7280`                      |
| Accent             | `#6366F1` (indigo)             |
| Accent Hover       | `#4F46E5`                      |
| Border Standard    | `2px #2E2E35`                  |
| Border Subtle      | `1px #1F1F23`                  |
| Font Body          | Inter                          |
| Font Mono          | IBM Plex Mono                  |
| Corner Radius Card | `0px`                          |
| Corner Radius Btn  | `8px`                          |
| Semantic Green      | `#22C55E`                      |
| Semantic Red        | `#EF4444`                      |
| Semantic Amber      | `#F59E0B`                      |
| Semantic Purple     | `#8B5CF6`                      |

---

## 1. Sign In

**File**: `app/(auth)/sign-in.tsx`

### Purpose

Entry point for returning users. Renders a Clerk-managed sign-in form with email/password and OAuth providers. On successful authentication the user is redirected into the tab navigator.

### ASCII Wireframe

```
+----------------------------------+
|          status bar              |
+----------------------------------+
|                                  |
|                                  |
|         +-----------+            |
|         | LTF1 LOGO |            |
|         +-----------+            |
|                                  |
|   +----------------------------+ |
|   | Email                      | |
|   +----------------------------+ |
|                                  |
|   +----------------------------+ |
|   | Password              [eye]| |
|   +----------------------------+ |
|                                  |
|   [        SIGN IN             ] |
|                                  |
|   --------- or continue ---------+
|                                  |
|   [ Google ]      [ GitHub ]     |
|                                  |
|                                  |
|   Don't have an account?         |
|   Sign up ->                     |
|                                  |
+----------------------------------+
```

### Data Requirements

| Concern       | Detail                                     |
|---------------|--------------------------------------------|
| Auth          | Clerk `useSignIn()` hook                   |
| Query         | None                                       |
| Mutation      | None (Clerk handles auth token exchange)   |
| Post-Auth     | Convex `users` table lookup via `clerkId`; if no row exists, redirect to onboarding or auto-provision |

### User Interactions

| # | Action                        | Result                                         |
|---|-------------------------------|-------------------------------------------------|
| 1 | Type email + password         | Controlled input fields, validation on blur     |
| 2 | Tap "SIGN IN"                 | Clerk `signIn.create()`, show spinner overlay   |
| 3 | Tap Google OAuth button       | Open Clerk OAuth web flow (system browser)      |
| 4 | Tap GitHub OAuth button       | Open Clerk OAuth web flow (system browser)      |
| 5 | Tap "Sign up" link            | Navigate to `/(auth)/sign-up`                   |
| 6 | Tap eye icon on password      | Toggle password visibility                      |

### Navigation Targets

| From       | To                    | Condition              |
|------------|-----------------------|------------------------|
| Sign In    | `/(tabs)/`            | Auth success           |
| Sign In    | `/(auth)/sign-up`     | Tap "Sign up" link     |

### Edge Cases

- **Invalid credentials**: Display inline error below password field. Do not clear password.
- **OAuth cancel**: Return to sign-in form, no error shown.
- **OAuth failure**: Show toast with generic error message.
- **Network offline**: Disable submit button, show "No connection" banner at top.
- **Rate limited**: Show "Too many attempts. Try again in X seconds." message from Clerk.
- **Account exists with different provider**: Clerk returns specific error; display "Account exists. Sign in with [provider] instead."
- **Deep link return**: If user arrives via deep link after OAuth, resume auth flow.

### Loading States

- Submit button shows indeterminate spinner replacing text.
- OAuth buttons show spinner icon inside button during redirect.

---

## 2. Sign Up

**File**: `app/(auth)/sign-up.tsx`

### Purpose

Account creation screen for new users. Adds a name field on top of the sign-in form. On success, provisions a user record in the Convex `users` table and redirects to the tab navigator.

### ASCII Wireframe

```
+----------------------------------+
|          status bar              |
+----------------------------------+
|                                  |
|         +-----------+            |
|         | LTF1 LOGO |            |
|         +-----------+            |
|                                  |
|   +----------------------------+ |
|   | Full Name                  | |
|   +----------------------------+ |
|                                  |
|   +----------------------------+ |
|   | Email                      | |
|   +----------------------------+ |
|                                  |
|   +----------------------------+ |
|   | Password              [eye]| |
|   +----------------------------+ |
|                                  |
|   [       CREATE ACCOUNT       ] |
|                                  |
|   --------- or continue ---------+
|                                  |
|   [ Google ]      [ GitHub ]     |
|                                  |
|                                  |
|   Already have an account?       |
|   Sign in ->                     |
|                                  |
+----------------------------------+
```

### Data Requirements

| Concern       | Detail                                                             |
|---------------|--------------------------------------------------------------------|
| Auth          | Clerk `useSignUp()` hook                                          |
| Mutation      | Post-signup webhook or client-side call to provision `users` row   |
| User Row      | `clerkId`, `email`, `name`, `role: "user"`, `status: "active"`, `lastSeenAt`, `createdAt`, `updatedAt` |

### User Interactions

| # | Action                         | Result                                          |
|---|--------------------------------|--------------------------------------------------|
| 1 | Type name, email, password     | Controlled inputs; password strength indicator   |
| 2 | Tap "CREATE ACCOUNT"           | Clerk `signUp.create()` + email verification if enabled |
| 3 | Tap Google/GitHub OAuth        | Same OAuth flow as sign-in                       |
| 4 | Tap "Sign in" link             | Navigate to `/(auth)/sign-in`                    |

### Navigation Targets

| From       | To                    | Condition               |
|------------|-----------------------|-------------------------|
| Sign Up    | `/(tabs)/`            | Auth + provisioning ok  |
| Sign Up    | `/(auth)/sign-in`     | Tap "Sign in" link      |

### Edge Cases

- **Email already registered**: Clerk returns error; show "Email already in use. Sign in instead?" with link.
- **Weak password**: Inline error below password field (min 8 chars, Clerk policy).
- **Empty name**: Validate client-side; disable submit until name is non-empty.
- **Provisioning failure**: Auth succeeds but Convex user insert fails; retry once, then show error screen with "Try again" button.
- **Email verification pending**: If Clerk requires verification, show a "Check your email" interstitial with resend button.

### Loading States

- Same as Sign In screen.

---

## 3. Dashboard

**File**: `app/(tabs)/index.tsx`

### Purpose

Home screen after authentication. Shows a high-level overview of the user's workspaces, aggregate stats, and a chronological activity feed. Serves as the primary entry point for navigating into projects and tasks.

### ASCII Wireframe

```
+----------------------------------+
|          status bar              |
+----------------------------------+
| DASHBOARD               [avatar]|
+----------------------------------+
|                                  |
| +-------------+ +-------------+ |
| | Projects    | | Members     | |
| |     12      | |     8       | |
| +-------------+ +-------------+ |
| +-------------+ +-------------+ |
| | Tasks       | | Done        | |
| |     47      | |     23      | |
| +-------------+ +-------------+ |
|                                  |
| WORKSPACES                       |
| +------------------------------+ |
| | Acme Corp                    | |
| | 5 projects  ·  3 members    | |
| +------------------------------+ |
| +------------------------------+ |
| | Side Project                 | |
| | 2 projects  ·  1 member     | |
| +------------------------------+ |
|                                  |
| RECENT ACTIVITY                  |
| +------------------------------+ |
| | 2m   aansh  CREATED task     | |
| | 5m   bob    MOVED task       | |
| | 12m  aansh  COMPLETED task   | |
| | 1h   carol  JOINED project   | |
| +------------------------------+ |
|                                  |
|                          [+ FAB] |
+----------------------------------+
| [Dashboard] [Projects] [Profile]|
+----------------------------------+
```

### Data Requirements

| Concern       | Detail                                                                   |
|---------------|--------------------------------------------------------------------------|
| Query         | `api.dashboard.queries.getDashboardData`                                |
| Returns       | `{ workspaces: Array<{_id, name, slug, description, ownerId, memberCount, projectCount}>, recentActivities: Array<any> }` |
| Derived Stats | Sum `projectCount` across workspaces for "Projects" stat. Sum `memberCount` for "Members" stat. Task counts require a secondary query or aggregation from activities. |
| Subscription  | Real-time via Convex `useQuery()` -- dashboard auto-updates on activity |

**Stat Card Derivation**:

| Stat     | Source                                                                     |
|----------|----------------------------------------------------------------------------|
| Projects | `sum(workspaces.map(w => w.projectCount))`                                |
| Members  | `sum(workspaces.map(w => w.memberCount))`                                 |
| Tasks    | Requires `api.tasks.queries.getMyTasks` or additional aggregation query   |
| Done     | Filter tasks with `status === "done"` from the tasks query                |

### User Interactions

| # | Action                          | Result                                            |
|---|---------------------------------|----------------------------------------------------|
| 1 | Pull down                       | Refresh dashboard data (re-trigger query)          |
| 2 | Tap workspace card              | Navigate to `/(tabs)/projects?workspaceId={id}`    |
| 3 | Tap stat card (Projects)        | Navigate to `/(tabs)/projects`                     |
| 4 | Tap activity item               | Navigate to relevant entity (task, project)        |
| 5 | Tap avatar (top right)          | Navigate to `/(tabs)/profile`                      |
| 6 | Tap FAB (+)                     | Open Quick Capture modal (`/capture`)              |
| 7 | Tap bottom tab                  | Switch to corresponding tab screen                 |

### Navigation Targets

| From       | To                              | Trigger                    |
|------------|---------------------------------|----------------------------|
| Dashboard  | Projects (filtered)             | Tap workspace card         |
| Dashboard  | Projects (all)                  | Tap "Projects" stat card   |
| Dashboard  | Task Detail                     | Tap activity with task ref |
| Dashboard  | Quick Capture                   | Tap FAB                    |
| Dashboard  | Profile                         | Tap avatar                 |

### Edge Cases

- **No workspaces**: Show empty state: "Create your first workspace on the web app to get started." with illustration.
- **No activities**: Show "No recent activity" placeholder in activity section. Stats still render (may show zeros).
- **Single workspace**: Skip workspace list, show stats for that workspace directly.
- **Stale data**: Convex subscriptions handle this automatically; if connection lost, show subtle "Reconnecting..." banner.
- **Large activity list**: Cap at 10 items, show "View all" link if more exist.

### Loading State

```
+----------------------------------+
| DASHBOARD               [    ]  |
+----------------------------------+
| +------+ +------+               |
| |======| |======|   (shimmer)   |
| +------+ +------+               |
| +------+ +------+               |
| |======| |======|               |
| +------+ +------+               |
|                                  |
| ================================ |
| ================================ |
| ================================ |
+----------------------------------+
```

Skeleton shimmer on card areas and activity lines. Use `#111111` shimmer base with `#1F1F23` highlight sweep.

### Empty State

```
+----------------------------------+
| DASHBOARD               [avatar]|
+----------------------------------+
|                                  |
|                                  |
|        [illustration]            |
|                                  |
|    No workspaces yet.            |
|    Create one on the web app     |
|    to get started.               |
|                                  |
+----------------------------------+
```

---

## 4. Projects List

**File**: `app/(tabs)/projects.tsx`

### Purpose

Browsable grid of all projects the authenticated user is a member of. Supports search and status filtering. Primary navigation into individual project detail views.

### ASCII Wireframe

```
+----------------------------------+
|          status bar              |
+----------------------------------+
| PROJECTS                [avatar]|
+----------------------------------+
| +----------------------------+   |
| | [magnifier] Search...      |   |
| +----------------------------+   |
|                                  |
| [All] [Active] [Planning] [Hold] |
|                                  |
| +-------------+ +-------------+  |
| | WEB          | | API          | |
| | WEB-         | | API-         | |
| | Active       | | Active       | |
| | 12 tasks     | | 8 tasks      | |
| | [=====>   ]  | | [===>     ]  | |
| +-------------+ +-------------+  |
|                                  |
| +-------------+ +-------------+  |
| | MOBILE       | | INFRA        | |
| | MOB-         | | INF-         | |
| | Planning     | | On Hold      | |
| | 3 tasks      | | 15 tasks     | |
| | [          ] | | [========>]  | |
| +-------------+ +-------------+  |
|                                  |
| +-------------+                  |
| | DOCS         |                 |
| | DOC-         |                 |
| | Active       |                 |
| | 6 tasks      |                 |
| | [==>      ]  |                 |
| +-------------+                  |
|                                  |
+----------------------------------+
| [Dashboard] [Projects] [Profile]|
+----------------------------------+
```

### Data Requirements

| Concern       | Detail                                                                  |
|---------------|-------------------------------------------------------------------------|
| Query         | `api.projects.queries.getUserProjects`                                 |
| Args          | `{ userId?: Id<"users"> }` (optional, defaults to current user)       |
| Returns       | Array of `{ ...project, workspace, lead, userRole, joinedAt }`        |
| Enrichment    | Web app calls `getWorkspaceProjects` which includes `taskStats` (total, completed, inProgress). Mobile should use `getUserProjects` and may need a lightweight task count query per project. |
| Filter        | Client-side filter by `project.status` using chip selection            |
| Search        | Client-side filter on `project.name` and `project.key`                |

**Project Card Fields**:

| Field         | Source                          | Display                         |
|---------------|---------------------------------|---------------------------------|
| Key           | `project.key`                   | Monospace, `#9CA3AF`           |
| Name          | `project.name`                  | Inter semibold, `#F9FAFB`     |
| Status        | `project.status`                | Badge with semantic color       |
| Task Count    | Derived or from enrichment      | "N tasks"                       |
| Progress Bar  | `completed / total` ratio       | Accent fill on `#2E2E35` track |

**Status Badge Colors**:

| Status     | Background    | Text          |
|------------|---------------|---------------|
| active     | `#22C55E20`   | `#22C55E`     |
| planning   | `#6366F120`   | `#6366F1`     |
| on_hold    | `#F59E0B20`   | `#F59E0B`     |
| completed  | `#9CA3AF20`   | `#9CA3AF`     |

### User Interactions

| # | Action                          | Result                                           |
|---|---------------------------------|---------------------------------------------------|
| 1 | Type in search bar              | Filter projects by name/key (debounced 300ms)     |
| 2 | Tap status chip                 | Toggle filter; "All" clears filters               |
| 3 | Tap project card                | Navigate to `/project/{id}`                       |
| 4 | Pull down                       | Refresh project list                              |
| 5 | Long press project card         | Show context menu (future: archive, leave)        |

### Navigation Targets

| From           | To                      | Trigger              |
|----------------|-------------------------|----------------------|
| Projects List  | Project Detail          | Tap project card     |
| Projects List  | Dashboard               | Tap Dashboard tab    |
| Projects List  | Profile                 | Tap Profile tab      |

### Edge Cases

- **No projects**: Show empty state: "You are not a member of any projects. Ask your team lead to invite you."
- **All filtered out**: Show "No projects match your filters." with a "Clear filters" button.
- **Search no results**: Show "No projects found for '[query]'."
- **Offline**: Show cached data with "Offline" badge in header. Disable pull-to-refresh.
- **Many projects (50+)**: Use `FlatList` with 2-column grid layout. Virtualized rendering. No pagination needed at MVP scale.

### Loading State

2-column grid of shimmer cards (4-6 placeholders). Each card has shimmer blocks for key, name, badge, count, and progress bar.

### Empty State

```
+----------------------------------+
| PROJECTS                         |
+----------------------------------+
|                                  |
|        [illustration]            |
|                                  |
|    No projects yet.              |
|    Join a project or ask your    |
|    team lead for an invite.      |
|                                  |
+----------------------------------+
```

---

## 5. Project Detail

**File**: `app/project/[id].tsx`

### Purpose

Full view of a single project. Displays project metadata, segmented tabs for tasks (grouped by status) and project info (members, settings). Primary interface for browsing and managing tasks within a project.

### ASCII Wireframe

```
+----------------------------------+
|          status bar              |
+----------------------------------+
| [<]  WEB Platform        [...]  |
+----------------------------------+
| Active     WEB-                  |
| Building the frontend platform   |
+----------------------------------+
| [ TASKS ]          [ INFO ]      |
+==================================+
|                                  |
| BACKLOG (3)                  [-] |
| +------------------------------+ |
| | #42  Fix login redirect      | |
| | [!!!] urgent   [AV]  Apr 20 | |
| +------------------------------+ |
| | #41  Add dark mode toggle    | |
| | [!!]  high     [AV]  --     | |
| +------------------------------+ |
| | #39  Update onboarding copy  | |
| | [!]   medium   --    --     | |
| +------------------------------+ |
|                                  |
| TODO (2)                     [-] |
| +------------------------------+ |
| | #38  Implement search bar    | |
| | [!!]  high     [AV]  Apr 18 | |
| +------------------------------+ |
| | #36  Design settings page    | |
| | [!]   medium   [AV]  --     | |
| +------------------------------+ |
|                                  |
| IN PROGRESS (1)              [-] |
| +------------------------------+ |
| | #35  API rate limiting       | |
| | [!!!] urgent   [AV]  Apr 15 | |
| +------------------------------+ |
|                                  |
| IN REVIEW (0)                    |
| (empty)                          |
|                                  |
| DONE (5)                     [+] |
| (collapsed)                      |
|                                  |
|                          [+ FAB] |
+----------------------------------+
```

**INFO Tab**:

```
+==================================+
| [ TASKS ]          [ INFO ]      |
+==================================+
|                                  |
| DETAILS                          |
| Status:    Active                |
| Workflow:  Kanban                |
| Prefix:    WEB-                  |
| Visibility: Private              |
|                                  |
| REPOSITORY                       |
| github.com/org/web-platform      |
| Branch: main                     |
|                                  |
| TEAM (4)                         |
| +------------------------------+ |
| | [AV] aansh    Lead           | |
| | [AV] bob      Member         | |
| | [AV] carol    Member         | |
| | [AV] dave     Contributor    | |
| +------------------------------+ |
|                                  |
+----------------------------------+
```

### Data Requirements

| Concern       | Detail                                                                        |
|---------------|-------------------------------------------------------------------------------|
| Query (Project) | `api.projects.queries.getProject` with `{ projectId }`                     |
| Returns       | `{ ...project, lead, tasks, activeSprint, members }`                         |
| Query (Tasks) | `api.tasks.queries.getProjectTasks` with `{ projectId }` (includes assignee details, subtask counts, comment counts) |
| Mutation      | None on this screen (mutations happen on Task Detail)                        |

**Task Card Fields**:

| Field       | Source                   | Display                                    |
|-------------|--------------------------|--------------------------------------------|
| Number      | `task.number`            | IBM Plex Mono, prefixed with `#`          |
| Title       | `task.title`             | Inter medium, single line, ellipsis        |
| Priority    | `task.priority`          | Icon badge: `!!!` urgent, `!!` high, `!` medium, `.` low |
| Assignee    | `task.assignees[0]`      | Avatar circle (24px) or `--` if unassigned |
| Due Date    | `task.dueDate`           | Formatted date or `--`. Red if overdue.    |

**Priority Badge Colors**:

| Priority | Color       | Icon  |
|----------|-------------|-------|
| urgent   | `#EF4444`   | `!!!` |
| high     | `#F59E0B`   | `!!`  |
| medium   | `#6366F1`   | `!`   |
| low      | `#9CA3AF`   | `.`   |

**Status Group Order**: backlog, todo, in_progress, in_review, done, cancelled

### User Interactions

| # | Action                          | Result                                             |
|---|---------------------------------|-----------------------------------------------------|
| 1 | Tap back arrow                  | Navigate back to Projects List                      |
| 2 | Tap segment (TASKS / INFO)      | Switch tab content                                  |
| 3 | Tap status group header         | Toggle collapse/expand for that group               |
| 4 | Tap task card                   | Navigate to `/task/{taskId}`                        |
| 5 | Tap FAB (+)                     | Open Quick Capture with `projectId` pre-filled      |
| 6 | Tap overflow menu (...)         | Show options: Share invite link, Copy project key   |
| 7 | Tap repository link (INFO tab)  | Open URL in system browser                          |
| 8 | Tap team member (INFO tab)      | No action at MVP (future: view profile)             |
| 9 | Pull down                       | Refresh project and task data                       |

### Navigation Targets

| From            | To                    | Trigger               |
|-----------------|-----------------------|-----------------------|
| Project Detail  | Projects List         | Back button           |
| Project Detail  | Task Detail           | Tap task card         |
| Project Detail  | Quick Capture         | Tap FAB               |

### Edge Cases

- **No tasks in project**: Show "No tasks yet. Tap + to create the first one." in TASKS tab.
- **All tasks done**: Collapse all groups except DONE which is expanded.
- **Project not found / access denied**: Show error screen with "Project not found or you don't have access." and back button.
- **Task loading failure**: Show error inline within the TASKS tab; project header still visible.
- **Stale project (deleted while viewing)**: Convex subscription returns null; navigate back with toast "Project was deleted."
- **Many tasks (200+)**: Groups render with virtualized lists. Consider lazy-loading collapsed groups.
- **No repository configured**: Hide REPOSITORY section in INFO tab.
- **No team members**: Show "No team members" in INFO tab (should not happen since viewer is a member).

### Loading State

- Header: shimmer blocks for project name and description.
- TASKS tab: 3 shimmer groups with 2 shimmer task cards each.
- INFO tab: shimmer blocks for each detail row.

---

## 6. Task Detail

**File**: `app/task/[id].tsx`

### Purpose

Full task view and edit screen. Displays all task metadata and allows inline editing of status, priority, assignees, and other fields. Primary mutation surface for task management.

### ASCII Wireframe

```
+----------------------------------+
|          status bar              |
+----------------------------------+
| [<]  WEB-42              [...]  |
+----------------------------------+
|                                  |
| Fix login redirect after OAuth   |
|                                  |
| STATUS                           |
| [backlog] [todo] [prog] [rev]   |
| [done] [cancel]                  |
|                                  |
| PRIORITY                         |
| [urgent] [high] [medium] [low]  |
|                                  |
| TYPE                             |
| bug                              |
|                                  |
| ASSIGNEES                        |
| [AV] [AV] [+]                   |
|                                  |
| DUE DATE                         |
| Apr 20, 2026                     |
|                                  |
| LABELS                           |
| [frontend] [auth] [p0]          |
|                                  |
| DESCRIPTION                      |
| +------------------------------+ |
| | After OAuth callback, users  | |
| | are redirected to / instead  | |
| | of their intended page. The  | |
| | returnTo param is lost.      | |
| +------------------------------+ |
|                                  |
| TIME TRACKED                     |
| 2h 15m                           |
|                                  |
| ESTIMATE                         |
| 3 points  ·  4 hours            |
|                                  |
+----------------------------------+
| [  MARK DONE  ]  [  DELETE  ]   |
+----------------------------------+
```

### Data Requirements

| Concern       | Detail                                                                            |
|---------------|-----------------------------------------------------------------------------------|
| Query         | `api.tasks.queries.getTask` with `{ taskId }`                                    |
| Returns       | `{ ...task, project, assignees, reporter, subtasks, comments, attachments, activities }` |
| Mutation      | `api.tasks.mutations.updateTask` with `{ taskId, ...fields }`                    |
| Delete        | `api.tasks.mutations.deleteTask` (if exists) or archive via status change        |

**Mutation Args for `updateTask`**:

```
{
  taskId: Id<"tasks">,
  title?: string,
  description?: string,
  status?: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled",
  priority?: "urgent" | "high" | "medium" | "low",
  assigneeIds?: Id<"users">[],
  labels?: string[],
  startDate?: number,
  dueDate?: number,
  estimate?: { points?: number, hours?: number }
}
```

### User Interactions

| # | Action                          | Result                                                  |
|---|----------------------------------|----------------------------------------------------------|
| 1 | Tap back arrow                   | Navigate back to Project Detail                          |
| 2 | Tap status chip                  | Mutate `status` field immediately via `updateTask`       |
| 3 | Tap priority chip                | Mutate `priority` field immediately                      |
| 4 | Tap assignee avatar              | No action at MVP (future: view user profile)             |
| 5 | Tap [+] on assignees             | Open bottom sheet with workspace member picker           |
| 6 | Tap due date                     | Open date picker; on select, mutate `dueDate`            |
| 7 | Tap label                        | No action at MVP (future: filter by label)               |
| 8 | Tap "MARK DONE"                  | Mutate `status` to `"done"`, haptic feedback, navigate back |
| 9 | Tap "DELETE"                     | Show confirmation dialog; on confirm, delete task + navigate back |
| 10| Tap overflow (...)               | Options: Copy task link, Copy task number                |
| 11| Pull down                        | Refresh task data                                        |

### Navigation Targets

| From         | To                    | Trigger                 |
|--------------|-----------------------|-------------------------|
| Task Detail  | Project Detail        | Back button             |
| Task Detail  | Project Detail        | After "Mark Done"       |
| Task Detail  | Project Detail        | After "Delete"          |

### Edge Cases

- **Task not found**: Show error screen "Task not found" with back button.
- **Access denied**: Show error screen "You don't have access to this task."
- **Mutation failure (network)**: Show toast "Failed to update. Check your connection." Revert optimistic update.
- **Concurrent edit**: Convex handles last-write-wins. Real-time subscription shows latest state. If user is editing a field that changes underneath, show brief highlight animation on the changed field.
- **Task deleted while viewing**: Subscription returns null; navigate back with toast "Task was deleted."
- **No description**: Show "No description" in muted text.
- **No assignees**: Show "Unassigned" in muted text with [+] button.
- **No due date**: Show "No due date" in muted text; tappable to set one.
- **No estimate**: Show "No estimate" in muted text.
- **Overdue task**: Due date text in `#EF4444` with "Overdue" suffix.
- **Delete confirmation**: "Are you sure you want to delete WEB-42? This cannot be undone." with [Cancel] [Delete] buttons.

### Loading State

Full screen shimmer layout matching the wireframe structure: title block, chip rows, avatar row, text blocks.

---

## 7. Quick Capture

**File**: `app/capture.tsx` (modal)

### Purpose

Minimal-friction task creation presented as a bottom sheet modal accessible from any screen via the FAB. Optimized for speed: a title and project selection is sufficient to create a task. Keyboard auto-focuses on the title field.

### ASCII Wireframe

```
+----------------------------------+
|                                  |
|  (dimmed background)             |
|                                  |
+----------------------------------+ <-- drag handle
| ================================ |
|                                  |
| NEW TASK                         |
|                                  |
| +----------------------------+   |
| | Task title...              |   |
| +----------------------------+   |
|                                  |
| PROJECT                          |
| +----------------------------+   |
| | [v] WEB Platform           |   |
| +----------------------------+   |
|                                  |
| PRIORITY              TYPE       |
| +------------+   +------------+  |
| | [v] Medium |   | [v] Task   |  |
| +------------+   +------------+  |
|                                  |
| [        CREATE TASK           ] |
|                                  |
+----------------------------------+
|          keyboard                |
+----------------------------------+
```

### Data Requirements

| Concern       | Detail                                                                          |
|---------------|---------------------------------------------------------------------------------|
| Query         | `api.projects.queries.getUserProjects` for project picker dropdown             |
| Mutation      | `api.tasks.mutations.createTask`                                               |
| Args          | `{ projectId, title, type, priority? }`                                        |
| Defaults      | `priority: "medium"`, `type: "task"`, `labels: []`                             |

**Mutation Args for `createTask`**:

```
{
  projectId: Id<"projects">,
  title: string,
  type: "feature" | "bug" | "improvement" | "task" | "epic",
  priority?: "urgent" | "high" | "medium" | "low",
  description?: string,
  assigneeIds?: Id<"users">[],
  labels?: string[],
  startDate?: number,
  dueDate?: number,
  estimate?: { points?: number, hours?: number },
  parentTaskId?: Id<"tasks">
}
```

### User Interactions

| # | Action                          | Result                                                     |
|---|---------------------------------|-------------------------------------------------------------|
| 1 | Modal opens                     | Keyboard auto-shows, title field focused                    |
| 2 | Type task title                 | Controlled input                                            |
| 3 | Tap project selector            | Open dropdown/picker with user's projects                   |
| 4 | Tap priority selector           | Cycle through: low, medium, high, urgent                    |
| 5 | Tap type selector               | Cycle through: task, feature, bug, improvement, epic        |
| 6 | Tap "CREATE TASK"               | Validate title non-empty + project selected; call mutation  |
| 7 | Successful creation             | Haptic feedback (medium), toast "Task created", dismiss modal |
| 8 | Swipe down on drag handle       | Dismiss modal without creating                              |
| 9 | Tap dimmed background           | Dismiss modal without creating                              |

### Pre-fill Behavior

| Context                          | Pre-filled Field                    |
|----------------------------------|-------------------------------------|
| Opened from Project Detail FAB   | `projectId` set to current project |
| Opened from Dashboard FAB        | No project pre-selected            |
| User has one project only        | Auto-select that project           |

### Navigation Targets

| From           | To                    | Trigger                   |
|----------------|-----------------------|---------------------------|
| Quick Capture  | Previous screen       | Dismiss or successful create |

### Edge Cases

- **No projects available**: Show "You need to be a member of a project to create tasks. Join a project first." Disable create button.
- **Title empty on submit**: Shake animation on title field, show inline "Title is required."
- **No project selected**: Shake animation on project selector, show inline "Select a project."
- **Mutation failure**: Show toast "Failed to create task. Try again." Keep modal open with data intact.
- **Network offline**: Disable create button, show "You are offline" inline message.
- **Rapid double-tap create**: Debounce; disable button during mutation call.
- **Very long title**: Allow up to 200 characters. Show character count when > 150.
- **Keyboard covers fields**: Bottom sheet should adjust height to remain above keyboard. Priority and type selectors must be visible.

### Loading States

- Create button shows spinner during mutation.
- Project list in dropdown shows shimmer if still loading.

---

## Cross-Cutting Concerns

### Authentication Guard

All screens under `(tabs)/` and detail routes (`project/[id]`, `task/[id]`, `capture`) require an active Clerk session. If the session expires or is invalidated:

1. Intercept at the navigation level using Expo Router's `redirect` in layout.
2. Redirect to `/(auth)/sign-in`.
3. After re-auth, return to the screen the user was on.

### Offline Behavior

| Scenario              | Behavior                                                       |
|-----------------------|----------------------------------------------------------------|
| Read queries          | Show last cached data. Display "Offline" indicator in header. |
| Mutations             | Queue mutation. Show "Pending" state. Execute when online.    |
| Auth token expired    | Cannot refresh offline. Show sign-in screen on next open.     |

### Real-Time Updates

Convex subscriptions via `useQuery()` provide automatic real-time updates on all screens. No polling or manual refresh required for data freshness. Pull-to-refresh is provided as a user-confidence affordance.

### Haptic Feedback

| Event                 | Haptic Type        |
|-----------------------|--------------------|
| Task created          | Medium impact      |
| Task marked done      | Success            |
| Task deleted          | Warning            |
| Pull-to-refresh       | Light impact       |
| Error                 | Error              |

### Error States

All screens implement a consistent error boundary pattern:

```
+----------------------------------+
|                                  |
|        [error icon]              |
|                                  |
|    Something went wrong.         |
|    [error detail in muted text]  |
|                                  |
|    [  TRY AGAIN  ]              |
|                                  |
+----------------------------------+
```

### Accessibility

- All interactive elements have a minimum touch target of 48x48dp.
- Screen reader labels on all buttons, cards, and navigation elements.
- Status and priority chips include text labels (not icon-only).
- Color is never the sole indicator of state; text labels accompany all badges.
- Respect system font scale (up to 1.5x) without layout breakage.

---

## Navigation Map

```
                    +----------+
                    | Sign In  |
                    +----+-----+
                         |
              success    |    link
           +-------------+----------+
           |                        |
     +-----v------+          +-----v------+
     |  (tabs)/   |          |  Sign Up   |
     +-----+------+          +------------+
           |
     +-----+------+------+
     |             |      |
+----v-----+ +----v---+ +v--------+
| Dashboard| |Projects| | Profile |
+----+-----+ +----+---+ +---------+
     |             |
     |        +----v---------+
     |        | Project [id] |
     |        +----+---------+
     |             |
     +------+------+
            |
      +-----v------+
      | Task [id]  |
      +------------+

  (any screen with FAB)
            |
      +-----v-------+
      | Quick Capture|
      | (modal)      |
      +--------------+
```

---

## Screen Summary Table

| #  | Screen         | File                          | Type     | Auth | Data Source                                    |
|----|----------------|-------------------------------|----------|------|------------------------------------------------|
| 1  | Sign In        | `app/(auth)/sign-in.tsx`      | Screen   | No   | Clerk                                          |
| 2  | Sign Up        | `app/(auth)/sign-up.tsx`      | Screen   | No   | Clerk                                          |
| 3  | Dashboard      | `app/(tabs)/index.tsx`        | Tab      | Yes  | `api.dashboard.queries.getDashboardData`       |
| 4  | Projects List  | `app/(tabs)/projects.tsx`     | Tab      | Yes  | `api.projects.queries.getUserProjects`         |
| 5  | Project Detail | `app/project/[id].tsx`        | Stack    | Yes  | `api.projects.queries.getProject`, `api.tasks.queries.getProjectTasks` |
| 6  | Task Detail    | `app/task/[id].tsx`           | Stack    | Yes  | `api.tasks.queries.getTask`, `api.tasks.mutations.updateTask` |
| 7  | Quick Capture  | `app/capture.tsx`             | Modal    | Yes  | `api.projects.queries.getUserProjects`, `api.tasks.mutations.createTask` |
