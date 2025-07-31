# Convex API Documentation

This document provides a comprehensive reference for all Convex functions in the LTF1 project, including queries, mutations, and actions.

## Overview

LTF1's backend is built on Convex, providing:
- **Real-time reactive queries** that automatically update
- **ACID-compliant mutations** for data consistency
- **Type-safe API** with automatic TypeScript generation
- **Built-in authentication** with Clerk integration

## API Structure

```
convex/
├── _generated/        # Auto-generated types
├── auth/             # Authentication functions
├── users/            # User management
├── developers/       # Developer profiles
├── workspaces/       # Workspace operations
├── projects/         # Project management
├── tasks/            # Task operations
├── sprints/          # Sprint management
├── activity/         # Activity tracking
├── monitoring/       # Resource monitoring
└── schema.ts         # Database schema
```

## Authentication

### Setup
```typescript
// convex/auth/config.ts
import { authTables } from "@convex-dev/auth/server"

const schema = defineSchema({
  ...authTables,
  // your other tables
})
```

### Auth Functions

#### `auth.getUserIdentity`
Get current authenticated user
```typescript
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error("Unauthorized")

// Returns:
{
  tokenIdentifier: string,
  email: string,
  emailVerified: boolean,
  name?: string,
  pictureUrl?: string,
}
```

#### `users.getCurrentUser`
Get user record from database
```typescript
const user = await getCurrentUser(ctx)
// Returns User document or throws error
```

## User Management

### Queries

#### `users.queries.getUser`
Get a specific user by ID
```typescript
// Usage
const user = useQuery(api.users.queries.getUser, { 
  userId: "user_123" 
})

// Args
{ userId: Id<"users"> }

// Returns
{
  _id: Id<"users">,
  clerkId: string,
  email: string,
  name?: string,
  avatarUrl?: string,
  createdAt: number,
  updatedAt: number,
}
```

#### `users.queries.searchUsers`
Search users by name or email
```typescript
// Usage
const users = useQuery(api.users.queries.searchUsers, { 
  query: "john",
  workspaceId: "workspace_123" 
})

// Args
{
  query: string,
  workspaceId?: Id<"workspaces">,
  limit?: number, // default: 10
}

// Returns
User[]
```

### Mutations

#### `users.mutations.updateUser`
Update user information
```typescript
// Usage
const updateUser = useMutation(api.users.mutations.updateUser)
await updateUser({
  name: "John Doe",
  avatarUrl: "https://..."
})

// Args
{
  name?: string,
  avatarUrl?: string,
}
```

## Developer Profiles

### Queries

#### `developers.queries.getDeveloperProfile`
Get developer profile for a user
```typescript
// Usage
const profile = useQuery(api.developers.queries.getDeveloperProfile, {
  userId: "user_123"
})

// Returns
{
  _id: Id<"developerProfiles">,
  userId: Id<"users">,
  profile?: {
    role: string,
    bio: string,
    timezone: string,
    workingHours: {
      start: string, // "09:00"
      end: string,   // "17:00"
    },
    availability: "full-time" | "part-time" | "contract",
    technologies: Array<{
      name: string,
      level: "expert" | "proficient" | "learning"
    }>,
    skills: string[],
    interests: string[],
    careerGoals: string,
    workStyle: string,
  },
  status: {
    type: "active" | "busy" | "away" | "offline",
    message?: string,
    updatedAt: number,
  }
}
```

#### `developers.queries.searchDevelopers`
Search developers by skills
```typescript
// Usage
const developers = useQuery(api.developers.queries.searchDevelopers, {
  skills: ["React", "TypeScript"],
  availability: "full-time"
})

// Args
{
  skills?: string[],
  technologies?: string[],
  availability?: "full-time" | "part-time" | "contract",
  workspaceId?: Id<"workspaces">,
}
```

### Mutations

#### `developers.mutations.updateDeveloperProfile`
Update developer profile
```typescript
// Usage
const updateProfile = useMutation(api.developers.mutations.updateDeveloperProfile)
await updateProfile({
  role: "Senior Developer",
  bio: "Full-stack developer...",
  technologies: [
    { name: "React", level: "expert" },
    { name: "Node.js", level: "proficient" }
  ],
  skills: ["Frontend", "Backend"],
  timezone: "America/New_York"
})
```

#### `developers.mutations.updateStatus`
Update developer status
```typescript
// Usage
await updateStatus({
  type: "busy",
  message: "In a meeting until 3pm"
})

// Args
{
  type: "active" | "busy" | "away" | "offline",
  message?: string,
}
```

## Workspace Management

### Queries

#### `workspaces.queries.getUserWorkspaces`
Get all workspaces for current user
```typescript
// Usage
const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)

// Returns
Array<{
  _id: Id<"workspaces">,
  name: string,
  slug: string,
  ownerId: Id<"users">,
  settings: WorkspaceSettings,
  memberCount: number,
  projectCount: number,
  role: "owner" | "admin" | "member" | "viewer",
}>
```

#### `workspaces.queries.getWorkspace`
Get workspace details
```typescript
// Usage
const workspace = useQuery(api.workspaces.queries.getWorkspace, {
  workspaceId: "workspace_123"
})
```

### Mutations

#### `workspaces.mutations.createWorkspace`
Create a new workspace
```typescript
// Usage
const createWorkspace = useMutation(api.workspaces.mutations.createWorkspace)
const workspaceId = await createWorkspace({
  name: "My Team",
  slug: "my-team"
})

// Args
{
  name: string,
  slug: string, // URL-friendly identifier
}
```

#### `workspaces.mutations.inviteMember`
Invite user to workspace
```typescript
// Usage
await inviteMember({
  workspaceId: "workspace_123",
  email: "john@example.com",
  role: "member"
})

// Args
{
  workspaceId: Id<"workspaces">,
  email: string,
  role: "admin" | "member" | "viewer",
}
```

## Project Management

### Queries

#### `projects.queries.getWorkspaceProjects`
Get all projects in a workspace
```typescript
// Usage
const projects = useQuery(api.projects.queries.getWorkspaceProjects, {
  workspaceId: "workspace_123"
})

// Returns
Array<{
  _id: Id<"projects">,
  workspaceId: Id<"workspaces">,
  name: string,
  key: string, // "PROJ"
  description?: string,
  workflowType: "kanban" | "scrum",
  status: "active" | "archived" | "on_hold",
  taskCount: number,
  memberCount: number,
}>
```

#### `projects.queries.getProject`
Get project details
```typescript
// Usage
const project = useQuery(api.projects.queries.getProject, {
  projectId: "project_123"
})
```

### Mutations

#### `projects.mutations.createProject`
Create a new project
```typescript
// Usage
const createProject = useMutation(api.projects.mutations.createProject)
const projectId = await createProject({
  workspaceId: "workspace_123",
  name: "Web App",
  key: "WEB",
  description: "Main web application",
  workflowType: "scrum"
})

// Args
{
  workspaceId: Id<"workspaces">,
  name: string,
  key: string, // 2-5 uppercase letters
  description?: string,
  workflowType: "kanban" | "scrum",
}
```

## Task Management

### Queries

#### `tasks.queries.getProjectTasks`
Get tasks for a project with filtering
```typescript
// Usage
const tasks = useQuery(api.tasks.queries.getProjectTasks, {
  projectId: "project_123",
  filters: {
    status: ["todo", "in_progress"],
    assignee: "user_123",
    priority: ["high", "urgent"],
    search: "authentication"
  }
})

// Args
{
  projectId: Id<"projects">,
  filters?: {
    status?: TaskStatus[],
    type?: TaskType[],
    priority?: Priority[],
    assignee?: Id<"users">,
    sprint?: Id<"sprints">,
    search?: string,
    hasBlockers?: boolean,
  },
  sortBy?: "created" | "updated" | "priority" | "number",
  sortOrder?: "asc" | "desc",
  limit?: number,
  offset?: number,
}
```

#### `tasks.queries.getTask`
Get single task with details
```typescript
// Usage
const task = useQuery(api.tasks.queries.getTask, {
  taskId: "task_123"
})

// Returns full task with related data
```

### Mutations

#### `tasks.mutations.create`
Create a new task
```typescript
// Usage
const createTask = useMutation(api.tasks.mutations.create)
const taskId = await createTask({
  projectId: "project_123",
  title: "Implement user authentication",
  type: "feature",
  priority: "high",
  description: "Add OAuth2 authentication...",
  assigneeId: "user_123",
  storyPoints: 5,
  sprintId: "sprint_123"
})

// Args
{
  projectId: Id<"projects">,
  title: string,
  type: "feature" | "bug" | "improvement" | "task" | "epic",
  priority: "low" | "medium" | "high" | "urgent",
  description?: string,
  assigneeId?: Id<"users">,
  storyPoints?: number,
  sprintId?: Id<"sprints">,
  labels?: string[],
}
```

#### `tasks.mutations.update`
Update task fields
```typescript
// Usage
const updateTask = useMutation(api.tasks.mutations.update)
await updateTask({
  taskId: "task_123",
  status: "in_progress",
  assigneeId: "user_456"
})

// Args
{
  taskId: Id<"tasks">,
  title?: string,
  description?: string,
  type?: TaskType,
  priority?: Priority,
  status?: TaskStatus,
  assigneeId?: Id<"users"> | null,
  storyPoints?: number,
  sprintId?: Id<"sprints"> | null,
}
```

#### `tasks.mutations.addComment`
Add comment to task
```typescript
// Usage
await addComment({
  taskId: "task_123",
  content: "Started working on this"
})
```

#### `tasks.mutations.logTime`
Log time on task
```typescript
// Usage
await logTime({
  taskId: "task_123",
  hours: 2.5,
  description: "Implemented login form"
})
```

## Sprint Management

### Queries

#### `sprints.queries.getProjectSprints`
Get all sprints for a project
```typescript
// Usage
const sprints = useQuery(api.sprints.queries.getProjectSprints, {
  projectId: "project_123"
})
```

#### `sprints.queries.getActiveSprint`
Get current active sprint
```typescript
// Usage
const activeSprint = useQuery(api.sprints.queries.getActiveSprint, {
  projectId: "project_123"
})
```

#### `sprints.queries.getSprintMetrics`
Get sprint burndown and metrics
```typescript
// Usage
const metrics = useQuery(api.sprints.queries.getSprintMetrics, {
  sprintId: "sprint_123"
})

// Returns
{
  totalPoints: number,
  completedPoints: number,
  remainingPoints: number,
  burndown: Array<{
    date: string,
    remaining: number,
    ideal: number,
  }>,
  velocity: number,
  tasksCompleted: number,
  tasksRemaining: number,
}
```

### Mutations

#### `sprints.mutations.create`
Create a new sprint
```typescript
// Usage
const createSprint = useMutation(api.sprints.mutations.create)
const sprintId = await createSprint({
  projectId: "project_123",
  name: "Sprint 2024-W01",
  startDate: "2024-01-01",
  endDate: "2024-01-14",
  goal: "Complete authentication feature"
})
```

#### `sprints.mutations.start`
Start a sprint
```typescript
// Usage
await startSprint({
  sprintId: "sprint_123"
})
```

## Activity Tracking

### Queries

#### `activity.queries.getActivities`
Get activity feed with filtering
```typescript
// Usage
const activities = useQuery(api.activity.queries.getActivities, {
  workspaceId: "workspace_123",
  filters: {
    types: ["task_created", "task_completed"],
    userId: "user_123",
    projectId: "project_123",
    since: Date.now() - 86400000 // Last 24 hours
  }
})

// Returns
Array<{
  _id: Id<"activities">,
  type: ActivityType,
  userId: Id<"users">,
  timestamp: number,
  metadata: Record<string, any>,
}>
```

### Mutations

#### `activity.mutations.logActivity`
Log a custom activity
```typescript
// Usage
await logActivity({
  type: "custom_event",
  metadata: {
    action: "exported_report",
    format: "pdf"
  }
})
```

## Resource Monitoring

### Queries

#### `monitoring.queries.getPerformanceMetrics`
Get browser performance metrics
```typescript
// Usage
const metrics = useQuery(api.monitoring.queries.getPerformanceMetrics, {
  userId: "user_123"
})

// Returns
{
  cpu: number, // 0-100
  memory: number, // MB
  network: {
    latency: number, // ms
    bandwidth: number, // Mbps
  },
  status: "good" | "warning" | "critical",
}
```

## Common Patterns

### Error Handling
```typescript
// All mutations should handle errors
try {
  await mutation(args)
} catch (error) {
  if (error instanceof ConvexError) {
    // Handle known errors
    toast.error(error.message)
  } else {
    // Handle unexpected errors
    console.error("Unexpected error:", error)
    toast.error("Something went wrong")
  }
}
```

### Permission Checking
```typescript
// Check permissions in mutations
export const updateTask = mutation({
  handler: async (ctx, args) => {
    // Get current user
    const user = await getCurrentUser(ctx)
    
    // Check project access
    const hasAccess = await checkProjectAccess(ctx, args.projectId, user._id)
    if (!hasAccess) throw new Error("Access denied")
    
    // Perform update
    await ctx.db.patch(args.taskId, args.updates)
  }
})
```

### Optimistic Updates
```typescript
// Client-side optimistic updates
const updateTask = useMutation(api.tasks.mutations.update)
  .withOptimisticUpdate((store, args) => {
    // Update local cache immediately
    const currentTask = store.getQuery(api.tasks.queries.getTask, { 
      taskId: args.taskId 
    })
    if (currentTask) {
      store.setQuery(
        api.tasks.queries.getTask,
        { taskId: args.taskId },
        { ...currentTask, ...args.updates }
      )
    }
  })
```

### Pagination
```typescript
// Implement pagination for large datasets
const tasks = useQuery(api.tasks.queries.getProjectTasks, {
  projectId,
  limit: 20,
  offset: page * 20
})
```

## Type Definitions

### Core Types
```typescript
// Task types
type TaskType = "feature" | "bug" | "improvement" | "task" | "epic"
type Priority = "low" | "medium" | "high" | "urgent"
type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "cancelled"

// User roles
type WorkspaceRole = "owner" | "admin" | "member" | "viewer"
type ProjectRole = "lead" | "developer" | "reviewer" | "observer"

// Workflow types
type WorkflowType = "kanban" | "scrum"
```

### Schema Types
All database types are automatically generated in `convex/_generated/dataModel.d.ts` based on your schema definition.

## Best Practices

1. **Always check authentication** in mutations
2. **Validate permissions** before data access
3. **Use indexes** for efficient queries
4. **Implement optimistic updates** for better UX
5. **Handle errors gracefully** with user-friendly messages
6. **Log activities** for audit trails
7. **Use transactions** for multi-table updates
8. **Paginate large datasets** to improve performance

## Related Documentation

- [Getting Started](../guides/getting-started.md) - Setup instructions
- [Development Guide](../development/contributing.md) - Contributing to API
- [Architecture Overview](../architecture/technical-overview.md) - System design