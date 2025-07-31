# Core Concepts

Understanding LTF1's core concepts is essential for effective use and development. This guide explains the fundamental building blocks of the system.

## Organizational Hierarchy

LTF1 follows a three-tier organizational structure:

```
Workspace
  └── Projects
       └── Tasks
```

### Workspaces

A **Workspace** represents an organization or team. It's the highest level container that:
- Contains multiple projects
- Has its own members with roles
- Manages billing and subscriptions
- Controls global settings

**Key Properties:**
- Unique name and slug
- Member limit based on subscription
- Owner who has full control
- Invite-only access

### Projects

A **Project** is a container for related work within a workspace:
- Has a unique key (e.g., "PROJ", "WEB", "API")
- Contains tasks, sprints, and team members
- Can have different workflow types (Kanban, Scrum)
- Tracks its own metrics and progress

**Key Properties:**
- Project key for task numbering (e.g., PROJ-123)
- Workflow type (affects available features)
- Team members (subset of workspace members)
- Status (active, archived, on_hold)

### Tasks

A **Task** represents a unit of work:
- Belongs to exactly one project
- Has a unique number within the project
- Can be assigned to team members
- Tracks time and progress

**Task Properties:**
- Type: feature, bug, improvement, task, epic
- Priority: low, medium, high, urgent
- Status: backlog, todo, in_progress, review, done, cancelled
- Story points for estimation
- Time tracking capabilities

## User Roles and Permissions

### Workspace Roles

1. **Owner**
   - Full control over workspace
   - Can delete workspace
   - Manage billing
   - All admin permissions

2. **Admin**
   - Manage workspace members
   - Create/delete projects
   - Access all projects
   - Configure workspace settings

3. **Member**
   - Create projects (if allowed)
   - Join projects they're invited to
   - Basic workspace access

4. **Viewer**
   - Read-only access
   - Cannot create or modify content
   - Useful for stakeholders

### Project Roles

Projects can have custom team configurations:
- **Project Lead**: Full control over project
- **Developer**: Can work on tasks
- **Reviewer**: Can review and approve work
- **Observer**: Read-only project access

## Task Workflow

Tasks follow a defined lifecycle:

```
backlog → todo → in_progress → review → done
                      ↓
                  cancelled
```

### Status Definitions

- **Backlog**: Not yet planned for work
- **Todo**: Ready to be worked on
- **In Progress**: Currently being worked on
- **Review**: Completed, awaiting review
- **Done**: Completed and approved
- **Cancelled**: No longer needed

### Task Transitions

- Tasks should move sequentially through statuses
- Time tracking starts when moved to "in_progress"
- Blockers can be added at any status
- Comments and activity tracked automatically

## Sprint Management

Sprints are time-boxed iterations for Scrum projects:

### Sprint Lifecycle
1. **Planning**: Select tasks for the sprint
2. **Active**: Sprint in progress
3. **Review**: Sprint completed, retrospective time
4. **Closed**: Historical record

### Sprint Metrics
- **Velocity**: Story points completed
- **Burndown**: Progress over time
- **Scope Changes**: Tasks added/removed

## Team Collaboration Features

### Developer Profiles
Every user has a developer profile containing:
- Skills and expertise levels
- Working hours and timezone
- Current status (active, busy, away)
- Contribution statistics

### Real-time Activity Tracking
All actions are tracked in real-time:
- Task creation and updates
- Team member changes
- Sprint events
- Comments and reviews

### Presence and Status
- **Online/Offline indicators**
- **Current activity display**
- **AFK (Away From Keyboard) detection**
- **Custom status messages**

## Data Model

### Reactive Queries
LTF1 uses Convex for real-time data:
- All queries are reactive by default
- Changes propagate instantly to all clients
- Optimistic updates for better UX
- Offline support with sync

### Permissions Model
Permissions are checked at multiple levels:
1. **Database level**: Convex functions verify access
2. **API level**: Mutations check user permissions
3. **UI level**: Components hide/show based on role

Example permission check:
```typescript
// Can user edit this task?
const canEdit = 
  user.isAdmin || 
  task.assigneeId === user.id ||
  projectMember.role === 'lead'
```

## Key Design Decisions

### Why Brutalist Design?
- **High contrast** for better readability
- **No ambiguity** in UI elements
- **Performance** over aesthetics
- **Accessibility** through simplicity

### Why Convex?
- **Real-time by default**
- **Type-safe queries**
- **Built-in authentication**
- **Automatic scaling**

### Why Monorepo?
- **Shared types** between packages
- **Consistent tooling**
- **Easier refactoring**
- **Single deployment**

## Common Patterns

### Creating Entities
1. User initiates action (button click)
2. Optimistic update shows immediately
3. Mutation runs on server
4. Real data replaces optimistic update
5. Activity logged automatically

### Querying Data
1. Use reactive queries for live data
2. Apply client-side filtering for performance
3. Implement pagination for large datasets
4. Cache computed values

### Error Handling
1. Show user-friendly error messages
2. Log technical details to console
3. Provide recovery actions
4. Maintain data consistency

## Best Practices

### For Developers
- Always check permissions before mutations
- Use optimistic updates for better UX
- Log activities for audit trail
- Handle edge cases gracefully

### For Users
- Complete your developer profile
- Use meaningful task titles
- Update task status promptly
- Participate in sprint planning

## Next Steps

Now that you understand the core concepts:
1. Review the [Task Management Guide](./task-management.md)
2. Learn about [Developer Profiles](./developer-profiles.md)
3. Explore [Team Activity Tracking](./team-activity.md)
4. Understand the [API Documentation](../api/convex-functions.md)