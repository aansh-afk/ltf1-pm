# Backend API Reference — Convex

Complete reference for every query, mutation, action, HTTP endpoint, and cron job in the LTF1 Convex backend.

---

## Database Schema (60+ Tables)

### Core Organizational Tables

#### `users`
| Field | Type | Notes |
|-------|------|-------|
| clerkId | `v.string()` | Clerk authentication ID |
| email | `v.string()` | User email |
| name | `v.optional(v.string())` | Display name |
| imageUrl | `v.optional(v.string())` | Avatar URL |
| role | `v.optional(v.string())` | Global role |
| status | `v.optional(v.string())` | "active" or "waitlisted" |
| onboardingCompleted | `v.optional(v.boolean())` | Onboarding flow status |
| preferences | `v.optional(v.object({...}))` | Theme, notifications, defaults, accessibility |

**Indexes**: `by_clerkId` [clerkId], `by_email` [email]

#### `workspaces`
| Field | Type | Notes |
|-------|------|-------|
| name | `v.string()` | Workspace name |
| slug | `v.string()` | URL-safe identifier |
| description | `v.optional(v.string())` | |
| ownerId | `v.id("users")` | Workspace owner |
| logoUrl | `v.optional(v.string())` | |
| settings | `v.optional(v.object({...}))` | Features, integrations, defaults |
| subscription | `v.optional(v.object({...}))` | Plan (free/pro/enterprise), status, seats |

**Indexes**: `by_slug` [slug], `by_ownerId` [ownerId]

#### `workspaceMembers`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| userId | `v.id("users")` | |
| role | `v.string()` | "owner", "admin", "member", "viewer" |
| permissions | `v.optional(v.object({...}))` | Granular permission overrides |
| joinedAt | `v.optional(v.number())` | |

**Indexes**: `by_workspaceId` [workspaceId], `by_userId` [userId], `by_workspaceId_and_userId` [workspaceId, userId]

#### `workspaceInvitations`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| email | `v.string()` | Invited email |
| role | `v.string()` | Assigned role |
| status | `v.string()` | "pending", "accepted", "declined", "expired" |
| invitedBy | `v.id("users")` | |
| expiresAt | `v.optional(v.number())` | |

**Indexes**: `by_workspaceId` [workspaceId], `by_email` [email]

#### `projects`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| name | `v.string()` | |
| key | `v.string()` | Short identifier (e.g., "PROJ") |
| description | `v.optional(v.string())` | |
| leadId | `v.optional(v.id("users"))` | Project lead |
| status | `v.optional(v.string())` | "active", "paused", "completed", "archived" |
| visibility | `v.optional(v.string())` | "public", "private" |
| repositoryId | `v.optional(v.id("githubRepositories"))` | Connected repo |
| teamIds | `v.optional(v.array(v.id("teams")))` | Assigned teams |
| settings | `v.optional(v.object({...}))` | Project-specific settings |

**Indexes**: `by_workspaceId` [workspaceId], `by_key` [key], `by_workspaceId_and_status` [workspaceId, status]

#### `projectMembers`
| Field | Type | Notes |
|-------|------|-------|
| projectId | `v.id("projects")` | |
| userId | `v.id("users")` | |
| role | `v.string()` | "lead", "member", "contributor", "viewer" |
| status | `v.optional(v.string())` | |

**Indexes**: `by_projectId` [projectId], `by_userId` [userId], `by_projectId_and_userId` [projectId, userId]

#### `projectInvitations`
| Field | Type | Notes |
|-------|------|-------|
| projectId | `v.id("projects")` | |
| invitedEmail | `v.string()` | |
| inviteCode | `v.string()` | Unique join code |
| role | `v.string()` | |
| status | `v.string()` | "pending", "accepted", "expired" |
| expiresAt | `v.number()` | |

**Indexes**: `by_projectId` [projectId], `by_inviteCode` [inviteCode]

#### `teams`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| name | `v.string()` | |
| slug | `v.string()` | |
| description | `v.optional(v.string())` | |

**Indexes**: `by_workspaceId` [workspaceId]

#### `teamMembers`
| Field | Type | Notes |
|-------|------|-------|
| teamId | `v.id("teams")` | |
| userId | `v.id("users")` | |
| role | `v.string()` | "lead", "member" |

**Indexes**: `by_teamId` [teamId], `by_userId` [userId]

---

### Task Management Tables

#### `tasks`
| Field | Type | Notes |
|-------|------|-------|
| projectId | `v.id("projects")` | |
| workspaceId | `v.optional(v.id("workspaces"))` | Denormalized for workspace queries |
| number | `v.optional(v.number())` | Auto-incrementing task number |
| title | `v.string()` | |
| description | `v.optional(v.string())` | |
| status | `v.string()` | backlog, todo, in_progress, in_review, done, cancelled |
| priority | `v.optional(v.string())` | urgent, high, medium, low |
| type | `v.optional(v.string())` | feature, bug, improvement, task, epic |
| assigneeId | `v.optional(v.id("users"))` | Deprecated single assignee |
| assigneeIds | `v.optional(v.array(v.id("users")))` | Multi-assignee |
| labels | `v.optional(v.array(v.string()))` | |
| dueDate | `v.optional(v.number())` | |
| startDate | `v.optional(v.number())` | |
| completedAt | `v.optional(v.number())` | |
| estimate | `v.optional(v.number())` | Story points or hours |
| estimateType | `v.optional(v.string())` | "points" or "hours" |
| parentTaskId | `v.optional(v.id("tasks"))` | Subtask relationship |
| sprintId | `v.optional(v.id("sprints"))` | Sprint assignment |
| dependencies | `v.optional(v.array(v.id("tasks")))` | Task dependencies |
| milestone | `v.optional(v.boolean())` | Is milestone task |
| criticalPath | `v.optional(v.boolean())` | On critical path |
| progress | `v.optional(v.number())` | 0-100 |
| timeTracked | `v.optional(v.number())` | Total ms tracked |
| gitBranch | `v.optional(v.string())` | Linked branch name |
| gitCommits | `v.optional(v.array(v.string()))` | Linked commit SHAs |
| pullRequestUrl | `v.optional(v.string())` | Linked PR URL |
| githubIssueNumber | `v.optional(v.number())` | Synced GitHub issue |
| githubIssueId | `v.optional(v.number())` | GitHub issue API ID |
| syncedFromGithub | `v.optional(v.boolean())` | Created from GitHub sync |
| githubSyncEnabled | `v.optional(v.boolean())` | Bi-directional sync active |

**Indexes**: `by_projectId` [projectId], `by_projectId_and_status` [projectId, status], `by_assigneeId` [assigneeId], `by_workspaceId` [workspaceId], `by_sprintId` [sprintId], `by_parentTaskId` [parentTaskId]

**Search Index**: `search_title` (search: title, filter: projectId)

#### `sprints`
| Field | Type | Notes |
|-------|------|-------|
| projectId | `v.id("projects")` | |
| name | `v.string()` | |
| goal | `v.optional(v.string())` | Sprint goal |
| startDate | `v.number()` | |
| endDate | `v.number()` | |
| status | `v.string()` | "planning", "active", "completed" |

**Indexes**: `by_projectId` [projectId], `by_projectId_and_status` [projectId, status]

#### `sprintSnapshots`
| Field | Type | Notes |
|-------|------|-------|
| sprintId | `v.id("sprints")` | |
| date | `v.number()` | Snapshot date |
| totalTasks | `v.number()` | |
| completedTasks | `v.number()` | |
| totalPoints | `v.number()` | |
| completedPoints | `v.number()` | |
| tasksByStatus | `v.any()` | Status breakdown |

**Indexes**: `by_sprintId` [sprintId]

#### `comments`
| Field | Type | Notes |
|-------|------|-------|
| taskId | `v.id("tasks")` | |
| userId | `v.id("users")` | |
| content | `v.string()` | |
| editedAt | `v.optional(v.number())` | |

**Indexes**: `by_taskId` [taskId]

#### `attachments`
| Field | Type | Notes |
|-------|------|-------|
| taskId | `v.id("tasks")` | |
| userId | `v.id("users")` | Uploader |
| fileName | `v.string()` | |
| fileSize | `v.number()` | Bytes |
| mimeType | `v.string()` | |
| storageId | `v.id("_storage")` | Convex storage reference |

**Indexes**: `by_taskId` [taskId]

#### `timeEntries`
| Field | Type | Notes |
|-------|------|-------|
| taskId | `v.id("tasks")` | |
| userId | `v.id("users")` | |
| startTime | `v.number()` | |
| endTime | `v.optional(v.number())` | null = active timer |
| duration | `v.optional(v.number())` | Milliseconds |
| description | `v.optional(v.string())` | |
| billable | `v.optional(v.boolean())` | |
| approved | `v.optional(v.boolean())` | |

**Indexes**: `by_taskId` [taskId], `by_userId` [userId], `by_userId_and_taskId` [userId, taskId]

#### `activities`
| Field | Type | Notes |
|-------|------|-------|
| type | `v.string()` | task_created, task_updated, pr_merged, comment_added, etc. |
| workspaceId | `v.optional(v.id("workspaces"))` | |
| projectId | `v.optional(v.id("projects"))` | |
| taskId | `v.optional(v.id("tasks"))` | |
| actorId | `v.optional(v.id("users"))` | |
| targetType | `v.optional(v.string())` | |
| targetId | `v.optional(v.string())` | |
| description | `v.optional(v.string())` | |
| metadata | `v.optional(v.any())` | Flexible metadata |

**Indexes**: `by_workspaceId` [workspaceId], `by_projectId` [projectId], `by_taskId` [taskId]

---

### AI Tables

#### `aiSessions`
| Field | Type | Notes |
|-------|------|-------|
| userId | `v.id("users")` | |
| workspaceId | `v.optional(v.id("workspaces"))` | |
| type | `v.string()` | Generation type |
| input | `v.string()` | Prompt/input text |
| output | `v.string()` | AI response |
| model | `v.string()` | "gemini-2.5-flash", "gpt-oss-120b", etc. |
| tokens | `v.object({ input, output, total })` | Token counts |
| cost | `v.number()` | Cost in credits |
| latency | `v.number()` | Response time ms |
| cached | `v.optional(v.boolean())` | Cache hit |
| feedback | `v.optional(v.object({...}))` | helpful, rating, comment |

**Indexes**: `by_userId` [userId], `by_workspaceId` [workspaceId]

#### `aiInsights`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| targetType | `v.string()` | "task", "sprint", "project", "team", "user" |
| targetId | `v.string()` | |
| insightType | `v.string()` | "risk", "recommendation", "opportunity", "anomaly", "prediction" |
| severity | `v.string()` | "critical", "high", "medium", "low", "info" |
| title | `v.string()` | |
| description | `v.string()` | |
| recommendations | `v.optional(v.array(v.string()))` | |
| dismissed | `v.optional(v.boolean())` | |
| expiresAt | `v.optional(v.number())` | |

**Indexes**: `by_workspaceId` [workspaceId], `by_targetType_and_targetId` [targetType, targetId]

#### `aiTasks`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| projectId | `v.id("projects")` | |
| sourceType | `v.string()` | "commit", "pr", "comment", "manual" |
| sourceData | `v.any()` | Source context |
| suggestedTasks | `v.array(v.object({...}))` | Title, description, type, priority |
| status | `v.string()` | "pending", "accepted", "rejected" |

**Indexes**: `by_workspaceId` [workspaceId], `by_projectId` [projectId], `by_status` [status]

#### `userAICredits`
| Field | Type | Notes |
|-------|------|-------|
| userId | `v.id("users")` | |
| credits | `v.number()` | Current balance |
| monthlyAllowance | `v.number()` | Monthly limit |
| usedThisMonth | `v.number()` | Usage counter |
| lastResetAt | `v.number()` | Monthly reset timestamp |
| subscriptionTier | `v.string()` | "free", "pro", "enterprise" |
| hasCustomKey | `v.optional(v.boolean())` | BYOK active |

**Indexes**: `by_userId` [userId]

#### `aiProviderKeys`
| Field | Type | Notes |
|-------|------|-------|
| userId | `v.id("users")` | |
| provider | `v.string()` | "cerebras", "groq", "gemini" |
| encryptedApiKey | `v.string()` | Encrypted key storage |

**Indexes**: `by_userId` [userId], `by_userId_and_provider` [userId, provider]

---

### GitHub Integration Tables

#### `githubInstallations`
| Field | Type | Notes |
|-------|------|-------|
| installationId | `v.number()` | GitHub App installation ID |
| accountName | `v.string()` | GitHub org/user name |
| accountType | `v.string()` | "Organization" or "User" |
| permissions | `v.optional(v.any())` | Granted permissions |
| events | `v.optional(v.array(v.string()))` | Subscribed events |

**Indexes**: `by_installationId` [installationId]

#### `githubRepositories`
| Field | Type | Notes |
|-------|------|-------|
| installationId | `v.id("githubInstallations")` | |
| githubId | `v.number()` | GitHub repo ID |
| owner | `v.string()` | Repo owner |
| name | `v.string()` | Repo name |
| fullName | `v.string()` | "owner/name" |
| defaultBranch | `v.string()` | |
| isPrivate | `v.boolean()` | |
| language | `v.optional(v.string())` | Primary language |

**Indexes**: `by_installationId` [installationId], `by_githubId` [githubId], `by_fullName` [fullName]

#### `githubIssueSyncQueue`
| Field | Type | Notes |
|-------|------|-------|
| direction | `v.string()` | "github_to_ltf1", "ltf1_to_github" |
| status | `v.string()` | "pending", "processing", "completed", "failed" |
| repositoryId | `v.id("githubRepositories")` | |
| issueNumber | `v.optional(v.number())` | |
| taskId | `v.optional(v.id("tasks"))` | |
| payload | `v.any()` | Sync data |
| retryCount | `v.optional(v.number())` | |
| error | `v.optional(v.string())` | |

**Indexes**: `by_status` [status], `by_repositoryId` [repositoryId]

*(Additional GitHub tables: githubCommits, githubPullRequests, githubIssues, githubActivities, githubConnections, githubWebhookEvents, githubUserMappings, githubTeamMappings, workspaceGitHubInstallations, githubOAuthStates)*

---

### Meeting Tables

#### `meetings`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| projectId | `v.optional(v.id("projects"))` | |
| sprintId | `v.optional(v.id("sprints"))` | |
| title | `v.string()` | |
| description | `v.optional(v.string())` | |
| type | `v.string()` | standup, retrospective, planning, review, custom |
| organizerId | `v.id("users")` | |
| startTime | `v.number()` | |
| endTime | `v.number()` | |
| location | `v.optional(v.string())` | |
| attendees | `v.array(v.object({...}))` | userId, status (pending/accepted/declined/tentative) |
| relatedTasks | `v.optional(v.array(v.id("tasks")))` | |
| notes | `v.optional(v.string())` | |
| actionItems | `v.optional(v.array(v.object({...})))` | Description, assignee, status, taskId |
| recordings | `v.optional(v.array(v.object({...})))` | URL, duration |
| recurrence | `v.optional(v.object({...}))` | Pattern, interval, daysOfWeek, endDate |
| googleEventId | `v.optional(v.string())` | Calendar sync |
| template | `v.optional(v.string())` | |

**Indexes**: `by_workspaceId` [workspaceId], `by_projectId` [projectId], `by_organizerId` [organizerId]

---

### Other Tables

#### `documents`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| projectId | `v.optional(v.id("projects"))` | |
| title | `v.string()` | |
| content | `v.optional(v.any())` | BlockNote JSON |
| createdBy | `v.id("users")` | |
| parentId | `v.optional(v.id("documents"))` | Nested pages |
| icon | `v.optional(v.string())` | Page icon |
| collaborators | `v.optional(v.array(v.id("users")))` | |
| sharing | `v.optional(v.object({...}))` | Visibility settings |

#### `notifications`
| Field | Type | Notes |
|-------|------|-------|
| userId | `v.id("users")` | |
| workspaceId | `v.optional(v.id("workspaces"))` | |
| type | `v.string()` | task_assigned, task_comment, sprint_completed, etc. |
| title | `v.string()` | |
| message | `v.optional(v.string())` | |
| link | `v.optional(v.string())` | |
| isRead | `v.boolean()` | |
| actorId | `v.optional(v.id("users"))` | |

**Indexes**: `by_userId` [userId], `by_userId_and_isRead` [userId, isRead]

#### `customFields`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| name | `v.string()` | |
| type | `v.string()` | text, number, select, date, boolean |
| options | `v.optional(v.array(v.string()))` | For select type |
| required | `v.optional(v.boolean())` | |

#### `filterPresets`
| Field | Type | Notes |
|-------|------|-------|
| workspaceId | `v.id("workspaces")` | |
| userId | `v.id("users")` | |
| name | `v.string()` | |
| filters | `v.any()` | Serialized filter state |

#### `developerProfiles`
| Field | Type | Notes |
|-------|------|-------|
| userId | `v.id("users")` | |
| skills | `v.optional(v.array(v.string()))` | |
| techStack | `v.optional(v.array(v.object({...})))` | Technology, proficiency, years |
| availability | `v.optional(v.object({...}))` | Status, for projects/reviews/pairing |
| githubStats | `v.optional(v.object({...}))` | PRs, reviews, languages, contributions |
| workHours | `v.optional(v.object({...}))` | Start, end, timezone |
| timezone | `v.optional(v.string())` | |
| reviewPreferences | `v.optional(v.object({...}))` | Max reviews, preferred types |

---

## API Reference by Module

### Tasks Module (`convex/tasks/`)

#### Queries

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `getProjectTasks` | projectId, status[]?, assigneeId?, labels? | Task[] | Required | Primary task list with filters |
| `getTask` | taskId | Task with comments, attachments, activities | Required | Full task detail |
| `getMyTasks` | workspaceId?, status[]? | Task[] | Required | Current user's assignments |
| `getFilteredTasks` | projectId, search?, status[]?, priority[]?, type[]?, assigneeIds[]?, labels[]?, dueDateStart?, dueDateEnd?, hasTimeTracked?, isOverdue? | Task[] | Required | Advanced filtering with 12 params |
| `getTasksByUser` | userId | Task[] | Required | Tasks for specific user |
| `getTasksByWorkspace` | workspaceId | Task[] | Required | All workspace tasks |
| `getTaskTimeEntries` | taskId | TimeEntry[] | Required | Time entries for task |
| `getActiveTimeEntry` | taskId | TimeEntry? | Required | Active timer |
| `getWorkspaceLabels` | workspaceId | string[] | Required | Aggregated labels |

#### Mutations

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `createTask` | projectId, title, description?, type, priority?, assigneeIds[]?, labels?, startDate?, dueDate?, estimate?, parentTaskId? | taskId | Required | Creates task with auto-number |
| `updateTask` | taskId, title?, description?, status?, priority?, type?, assigneeIds?, labels?, dueDate?, startDate?, estimate? | null | Required | Partial update |
| `deleteTask` | taskId | null | Required | Permanent delete |
| `moveTask` | taskId, projectId?, status?, position? | null | Required | Move/reorder |
| `bulkUpdateTasks` | taskIds, updates | null | Required | Batch status/priority changes |
| `bulkDeleteTasks` | taskIds | null | Required | Batch delete (auth check) |
| `startTimeTracking` | taskId | null | Required | Start timer |
| `pauseTimeTracking` | taskId | null | Required | Pause timer |
| `stopTimeTracking` | taskId | null | Required | Stop and save |

### Sprints Module (`convex/sprints/`)

#### Queries

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `getProjectSprints` | projectId | Sprint[] with task stats, points | Required | All sprints |
| `getCurrentSprint` | projectId | Sprint with progress metrics | Required | Active sprint |
| `getSprintById` | sprintId | Sprint | Required | Individual sprint |
| `getBacklogTasks` | projectId | Task[] | Required | Tasks not in any sprint |

#### Mutations

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `createSprint` | projectId, name, goal?, startDate, endDate | sprintId | Required | |
| `updateSprint` | sprintId, name?, goal?, status?, startDate?, endDate? | null | Required | |
| `deleteSprint` | sprintId | null | Required | |
| `addTasksToSprint` | sprintId, taskIds | null | Required | Batch add |
| `removeTaskFromSprint` | taskId | null | Required | Clear sprintId |

### Projects Module (`convex/projects/`)

#### Queries

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `getWorkspaceProjects` | workspaceId | Project[] with task stats | Required | |
| `getProject` | projectId | Project with members, sprint | Required | |
| `getProjectsByStatus` | workspaceId, status | Project[] | Required | |
| `getProjectTeamMembers` | projectId | User[] | Required | |
| `getProjectByInviteCode` | inviteCode | Project | Public | For join flow |
| `getProjectInviteLink` | projectId | { inviteCode, url } | Required | |

#### Mutations

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `createProject` | workspaceId, name, key, description?, teamIds? | projectId | Required | |
| `updateProject` | projectId, name?, description?, status?, settings? | null | Required | |
| `deleteProject` | projectId | null | Required | Owner/admin only |
| `connectRepository` | projectId, repositoryId | null | Required | |
| `addProjectMember` | projectId, userId, role | null | Required | |
| `removeProjectMember` | projectId, userId | null | Required | |
| `joinProjectByCode` | inviteCode | null | Required | |
| `generateProjectInviteCode` | projectId | inviteCode | Required | |

### Workspaces Module (`convex/workspaces/`)

#### Queries

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `getUserWorkspaces` | none | Workspace[] with membership info | Required | |
| `getWorkspaceById` | workspaceId | Workspace with members, stats | Required | |
| `getWorkspaceMembers` | workspaceId | Member[] with user details | Required | |
| `getWorkspaceStats` | workspaceId | { projects, tasks, members, sprints } | Required | |
| `getPendingInvitations` | workspaceId | Invitation[] | Required | Admin+ |

#### Mutations

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `createWorkspace` | name, slug, description? | workspaceId | Required | |
| `updateWorkspace` | workspaceId, name?, slug?, description?, logoUrl?, settings? | null | Required | Admin+ |
| `inviteToWorkspace` | workspaceId, email, role | null | Required | Admin+ |
| `updateMemberRole` | workspaceId, userId, role | null | Required | Admin+ |
| `removeMember` | workspaceId, userId | null | Required | Admin+ |
| `deleteWorkspace` | workspaceId | null | Required | Owner only |

### AI Module (`convex/ai/`)

#### Queries

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `getUserAISessions` | limit?, type? | AISession[] | Required | Session history |
| `getWorkspaceAIStats` | workspaceId, timeRange? | { totalSessions, tokens, cost, byModel } | Required | Usage analytics |
| `getActiveInsights` | targetType?, targetId?, insightType? | AIInsight[] | Required | |
| `getPendingAITasks` | none | AITask[] | Required | Pending suggestions |
| `getAIFeedbackSummary` | none | { helpful%, avgRating } | Required | |
| `getUserAICredits` | none | Credits info | Required | Balance, usage |
| `canMakeAIRequest` | estimatedCredits | { allowed, reason } | Required | Rate limit check |
| `getPricingTiers` | none | Tier[] | Public | |

#### Mutations

| Function | Args | Returns | Auth | Notes |
|----------|------|---------|------|-------|
| `trackAISession` | type, input, output, model, tokens, cost, latency, cached | sessionId | Required | Log interaction |
| `addAIFeedback` | sessionId, helpful, rating, comment? | null | Required | |
| `createAIInsight` | targetType, targetId, insightType, severity, title, description, recommendations[], dedupeKey?, expiresAt? | insightId | Internal | |
| `dismissAIInsight` | insightId | null | Required | |
| `createAITaskSuggestion` | sourceType, sourceData, suggestedTasks[] | suggestionId | Internal | |
| `updateAITaskStatus` | suggestionId, status | null | Required | Accept/reject |
| `setupUserAI` | subscriptionTier | null | Required | Initialize credits |
| `saveApiKey` | encryptedApiKey, provider | null | Required | BYOK |
| `trackAIUsage` | requestType, model, tokens, cost, keyType, success?, error? | null | Internal | |

### Search Module (`convex/search/`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `globalSearch` | Query | query, filters?, limit? | { tasks, projects, sprints, users } | Multi-entity search |
| `quickSearch` | Query | query, limit? | Mixed results | Command palette |
| `searchSuggestions` | Query | query, limit? | Suggestion[] | Autocomplete |

### Dashboard Module (`convex/dashboard/`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `getDashboardData` | Query | none | { workspaces[], recentActivities[] } | Combined dashboard |

### Notifications Module (`convex/notifications/`)

| Function | Type | Args | Returns | Notes |
|----------|------|------|---------|-------|
| `getNotifications` | Query | workspaceId?, limit? | Notification[] | |
| `getUnreadCount` | Query | workspaceId? | number | |
| `markAsRead` | Mutation | notificationId | null | |
| `markAllAsRead` | Mutation | workspaceId | null | |

---

## HTTP Endpoints

| Path | Method | Handler | Purpose |
|------|--------|---------|---------|
| `/clerk-webhook` | POST | Clerk webhook processing | User creation/update sync |
| `/webhooks/polar` | POST | Polar.sh webhook | Subscription lifecycle events |
| `/api/cli-refresh` | POST | CLI token refresh | Silent JWT refresh for CLI sessions |

---

## Cron Jobs

| Name | Schedule | Function | Purpose |
|------|----------|----------|---------|
| `process-github-issue-sync-queue` | Every 1 min | `internal.github.issueSync.processSyncQueue` | Bi-directional issue sync |
| `process-github-team-sync` | Every 1 hr | `internal.github.teamSync.syncAllTeams` | Org team membership sync |
| `process-github-repository-sync` | Every 15 min | `internal.github.syncActions.syncRepositories` | Repository metadata sync |
| `process-github-stats-sync` | Every 30 min | `internal.github.syncActions.syncDeveloperStats` | Developer GitHub stats |
| `process-due-date-reminders` | Every 6 hr | `internal.notifications.reminders.sendDueDateReminders` | Email reminders |
| `process-overdue-alerts` | Every 12 hr | `internal.notifications.reminders.sendOverdueAlerts` | Overdue email alerts |
| `process-meeting-reminders` | Every 15 min | `internal.meetings.reminders.sendMeetingReminders` | Meeting email reminders |
| `daily sprint snapshot` | 0 0 * * * | `internal.sprints.snapshots.captureAllSnapshots` | Burndown data capture |
