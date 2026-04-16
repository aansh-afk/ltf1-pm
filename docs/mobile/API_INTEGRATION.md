# LTF1 Mobile -- API Integration Guide

This document maps every mobile screen to its Convex API calls, documents the authentication pattern, and covers mobile-specific considerations.

---

## Authentication Pattern

All Convex functions authenticate via `ctx.auth.getUserIdentity()`. The identity is resolved to an internal user document by looking up the `clerkId` through the `users.by_clerk_id` index.

On mobile, the Clerk token is passed to Convex through `ConvexProviderWithClerk`, which wraps the app root and automatically attaches the Clerk session token to every Convex request.

```
ClerkProvider
  -> ConvexProviderWithClerk
    -> App screens (all queries/mutations authenticated)
```

If the Clerk session expires, Convex calls will fail with an authentication error. The mobile app should catch this and redirect to the sign-in screen.

---

## Screen-to-API Mapping

### Dashboard Screen

| Function | Type | Args | Returns |
|----------|------|------|---------|
| `api.dashboard.queries.getDashboardData` | query | none | `{ workspaces[], recentActivities[] }` |

Each workspace object includes `memberCount` and `projectCount` for summary display.

**Notes:**
- This is a combined query that fetches everything the dashboard needs in a single subscription.
- The `recentActivities` array is pre-sorted by creation time (descending).

---

### Projects List

| Function | Type | Args | Returns |
|----------|------|------|---------|
| `api.projects.queries.getUserProjects` | query | none | `Project[]` across all workspaces |
| `api.projects.queries.getWorkspaceProjects` | query | `{ workspaceId: Id<"workspaces"> }` | `Project[]` for a single workspace |

**Notes:**
- `getUserProjects` returns projects across all workspaces the user belongs to. Use this for the default "all projects" view.
- `getWorkspaceProjects` is used when the user filters by a specific workspace.

---

### Project Detail

| Function | Type | Args | Returns |
|----------|------|------|---------|
| `api.projects.queries.getProject` | query | `{ projectId: Id<"projects"> }` | Single project document |
| `api.tasks.queries.getProjectTasks` | query | `{ projectId: Id<"projects"> }` | All tasks for the project |
| `api.projects.queries.getProjectTeamMembers` | query | `{ projectId: Id<"projects"> }` | Team members with user details |

**Notes:**
- Three concurrent subscriptions fire when this screen mounts.
- `getProjectTasks` returns all tasks regardless of status. Filtering (by status column, assignee, label) happens client-side.
- Task list can be large for active projects. See "Payload Size" in the mobile considerations section below.

---

### Task Detail

| Function | Type | Args | Returns |
|----------|------|------|---------|
| `api.tasks.queries.getTask` | query | `{ taskId: Id<"tasks"> }` | Single task document with all fields |
| `api.tasks.mutations.updateTask` | mutation | `{ taskId: Id<"tasks">, ...fields }` | null |
| `api.tasks.mutations.moveTask` | mutation | `{ taskId: Id<"tasks">, status: string }` | null |

**Notes:**
- `updateTask` accepts a partial update. Only include the fields being changed.
- `moveTask` is specifically for status transitions (e.g., backlog to in-progress). It may trigger side effects like activity logging.
- The task query subscription keeps the detail view in sync with changes from other clients.

---

### Quick Capture

| Function | Type | Args | Returns |
|----------|------|------|---------|
| `api.tasks.mutations.createTask` | mutation | `{ projectId: Id<"projects">, title: string, type: string, priority?: string, assigneeIds?: Id<"users">[], labels?: string[], dueDate?: number }` | `Id<"tasks">` |

**Notes:**
- Status is automatically set to `"backlog"`.
- A sequential task number is generated server-side.
- `type` is required (e.g., "task", "bug", "feature").
- All other fields are optional for quick capture. Users can fill them in later from the task detail screen.

---

### Profile

| Source | Type | Returns |
|--------|------|---------|
| Clerk `useUser()` hook | client-side | User name, email, avatar URL |
| `api.workspaces.queries.getUserWorkspaces` | query | Workspaces the user belongs to |

**Notes:**
- Profile data comes from two sources: Clerk (identity) and Convex (workspace membership).
- No mutations are needed on the profile screen in v1. Profile editing is handled through Clerk's hosted UI or the web app.

---

## Mobile-Specific API Considerations

### Payload Size

Some queries return more data than is ideal for mobile network conditions:

| Query | Concern | Recommendation |
|-------|---------|----------------|
| `getProjectTasks` | Returns all tasks for a project. Projects with 100+ tasks send a large payload. | Consider a mobile-optimized variant with pagination or a task count limit (e.g., 50 most recent). |
| `getDashboardData` | Returns full workspace objects with nested data. | Acceptable for now. Monitor payload size as workspaces grow. |
| `getProjectTeamMembers` | Includes full user profiles. | Low risk. Team sizes are typically small. |

For v1, the existing queries are acceptable. If performance degrades on slow networks, introduce mobile-specific paginated queries.

### Real-Time Subscriptions

Convex subscriptions are real-time by default. There is no need for polling or manual refresh logic. When data changes on the server, all active subscriptions push updates to the client automatically.

Implications for mobile:
- Subscriptions are lightweight (differential updates, not full re-fetches).
- Subscriptions automatically pause when the app is backgrounded (handled by Convex React internals).
- On foregrounding, subscriptions reconnect and deliver any missed updates.

### Error Handling

**Network errors:** Convex handles reconnection automatically. The mobile app should display a connectivity banner when the Convex connection drops (see `useConvex().connectionState`).

**Authentication expiry:** If the Clerk session expires mid-use, Convex calls will throw an authentication error. The app should catch this at the provider level and redirect to sign-in.

**Stale data:** Between network loss and reconnection, the app may show stale cached data. This is expected behavior. The UI should indicate "offline" status so users understand the data may not be current. See `OFFLINE_CACHE.md` for the caching strategy.

**Mutation failures:** Wrap all mutation calls in try/catch. Display user-friendly error messages via toast notifications. Do not retry mutations automatically (risk of duplicate actions).

### Subscription Management

To minimize resource usage on mobile:
- Only subscribe to data for the currently visible screen.
- Unmount subscriptions when navigating away (React component unmount handles this automatically with Convex hooks).
- Avoid subscribing to large datasets on screens that are not in the foreground.
