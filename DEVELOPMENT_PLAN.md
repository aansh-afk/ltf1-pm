# LTF1 Development Plan

## Overview
LTF1 is a comprehensive multi-role project management platform with AI capabilities, designed for scalability from day one.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + DaisyUI
- **Backend**: Convex
- **Monorepo**: pnpm workspaces
- **Authentication**: Clerk (supports multi-tenancy, social logins, enterprise SSO)
- **AI**: OpenAI API
- **Integrations**: GitHub API, Google Calendar API, Google Meet API

## Development Phases

### Phase 0: Project Setup & Architecture Foundation (Week 1)

**Goal**: Establish solid architectural foundation

1. **Monorepo Setup**
   ```
   ltf1/
   ├── packages/
   │   ├── web/          # React + Vite app
   │   ├── shared/       # Shared types, utils, constants
   │   └── cli/          # CLI tool (later)
   ├── convex/          # Backend
   ├── pnpm-workspace.yaml
   └── package.json
   ```

2. **Base Configuration**
   - Setup pnpm workspaces
   - Configure TypeScript with path aliases
   - Setup ESLint, Prettier with shared config
   - Configure Vite with proper aliasing
   - Setup Convex project

3. **Design System Foundation**
   - Configure DaisyUI with custom theme
   - Create base layout components
   - Setup responsive grid system
   - Define color palette for different roles/states

### Phase 1: Core Data Model & Authentication (Week 2-3)

**Goal**: Implement multi-tenancy and role-based access from the start

1. **Convex Schema Design**
   ```typescript
   // Core entities
   export const users = defineTable({
     clerkId: v.string(),
     email: v.string(),
     name: v.string(),
     avatarUrl: v.optional(v.string()),
     settings: v.object({
       theme: v.string(),
       notifications: v.object({...}),
     }),
   }).index("by_clerk", ["clerkId"])
   
   export const workspaces = defineTable({
     name: v.string(),
     slug: v.string(), // URL-friendly identifier
     ownerId: v.id("users"),
     settings: v.object({
       features: v.object({
         aiEnabled: v.boolean(),
         githubIntegration: v.boolean(),
         googleIntegration: v.boolean(),
       }),
       limits: v.object({
         maxProjects: v.number(),
         maxMembers: v.number(),
       }),
     }),
     plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
   }).index("by_slug", ["slug"])
   
   export const workspaceMembers = defineTable({
     workspaceId: v.id("workspaces"),
     userId: v.id("users"),
     role: v.union(v.literal("admin"), v.literal("manager"), v.literal("developer"), v.literal("viewer")),
     joinedAt: v.number(),
   }).index("by_workspace", ["workspaceId"])
     .index("by_user", ["userId"])
     .index("by_workspace_user", ["workspaceId", "userId"])
   ```

2. **Authentication Setup**
   - Integrate Clerk
   - Setup webhook for user sync to Convex
   - Implement workspace switcher
   - Create auth context with workspace selection

3. **Base Permissions System**
   ```typescript
   // Reusable permission helpers
   export const permissions = {
     canManageWorkspace: (role: Role) => ["admin", "owner"].includes(role),
     canManageProjects: (role: Role) => ["admin", "manager"].includes(role),
     canEditTasks: (role: Role) => ["admin", "manager", "developer"].includes(role),
   }
   ```

### Phase 2: Basic Workspace & Project Management (Week 4-5)

**Goal**: Core workspace and project CRUD with proper isolation

1. **Extended Schema**
   ```typescript
   export const projects = defineTable({
     workspaceId: v.id("workspaces"),
     name: v.string(),
     description: v.optional(v.string()),
     status: v.union(v.literal("active"), v.literal("archived"), v.literal("completed")),
     visibility: v.union(v.literal("public"), v.literal("private")),
     leadId: v.optional(v.id("users")),
     startDate: v.optional(v.number()),
     endDate: v.optional(v.number()),
     metadata: v.object({
       color: v.string(),
       icon: v.optional(v.string()),
       tags: v.array(v.string()),
     }),
   }).index("by_workspace", ["workspaceId"])
     .index("by_lead", ["leadId"])
   
   export const projectMembers = defineTable({
     projectId: v.id("projects"),
     userId: v.id("users"),
     role: v.string(), // "lead", "member", "viewer"
   }).index("by_project", ["projectId"])
     .index("by_user", ["userId"])
   ```

2. **Core Features**
   - Workspace creation/switching
   - Project CRUD with permissions
   - Project member management
   - Basic dashboard with project cards

### Phase 3: Task Management System (Week 6-8)

**Goal**: Flexible task system supporting different workflows

1. **Task Schema**
   ```typescript
   export const tasks = defineTable({
     projectId: v.id("projects"),
     parentId: v.optional(v.id("tasks")), // For subtasks
     title: v.string(),
     description: v.optional(v.string()),
     status: v.string(), // Flexible for custom workflows
     priority: v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low")),
     assigneeId: v.optional(v.id("users")),
     reporterId: v.id("users"),
     dueDate: v.optional(v.number()),
     estimatedHours: v.optional(v.number()),
     actualHours: v.optional(v.number()),
     tags: v.array(v.string()),
     customFields: v.optional(v.any()), // For extensibility
   }).index("by_project", ["projectId"])
     .index("by_assignee", ["assigneeId"])
     .index("by_parent", ["parentId"])
   
   export const taskComments = defineTable({
     taskId: v.id("tasks"),
     userId: v.id("users"),
     content: v.string(),
     createdAt: v.number(),
     mentions: v.array(v.id("users")),
   }).index("by_task", ["taskId"])
   
   export const taskActivity = defineTable({
     taskId: v.id("tasks"),
     userId: v.id("users"),
     action: v.string(), // "created", "updated", "commented", etc.
     changes: v.optional(v.any()),
     timestamp: v.number(),
   }).index("by_task", ["taskId"])
   ```

2. **Features**
   - Task CRUD with rich editor
   - Drag-and-drop kanban board
   - List/grid views
   - Filtering and search
   - Bulk operations
   - Activity tracking

### Phase 4: Team & Permissions (Week 9-10)

**Goal**: Sophisticated role and permission management

1. **Enhanced Permission System**
   - Custom roles per workspace
   - Project-level permissions
   - Feature flags per workspace/plan
   - Audit logging for sensitive actions

2. **Team Features**
   - Member invitation system
   - Role management UI
   - Team directory
   - User profiles with activity

### Phase 5: Meeting Management (Week 11-12)

**Goal**: Integrated meeting system with task linkage

1. **Meeting Schema**
   ```typescript
   export const meetings = defineTable({
     workspaceId: v.id("workspaces"),
     projectId: v.optional(v.id("projects")),
     title: v.string(),
     description: v.optional(v.string()),
     startTime: v.number(),
     endTime: v.number(),
     organizerId: v.id("users"),
     meetingUrl: v.optional(v.string()),
     recurrence: v.optional(v.object({...})),
     status: v.string(), // "scheduled", "in-progress", "completed", "cancelled"
   }).index("by_workspace", ["workspaceId"])
     .index("by_project", ["projectId"])
   
   export const meetingParticipants = defineTable({
     meetingId: v.id("meetings"),
     userId: v.id("users"),
     status: v.string(), // "invited", "accepted", "declined", "tentative"
   })
   
   export const meetingNotes = defineTable({
     meetingId: v.id("meetings"),
     content: v.string(),
     actionItems: v.array(v.object({
       description: v.string(),
       assigneeId: v.optional(v.id("users")),
       dueDate: v.optional(v.number()),
       taskId: v.optional(v.id("tasks")), // Link to created task
     })),
   })
   ```

2. **Features**
   - Meeting scheduling with conflict detection
   - Meeting templates
   - Automated task creation from action items
   - Meeting history and notes

### Phase 6: External Integrations (Week 13-15)

**Goal**: Seamless external service integration

1. **GitHub Integration**
   ```typescript
   export const githubConnections = defineTable({
     workspaceId: v.id("workspaces"),
     installationId: v.string(),
     repositories: v.array(v.object({
       id: v.string(),
       name: v.string(),
       fullName: v.string(),
     })),
   })
   
   export const githubIssueLinks = defineTable({
     taskId: v.id("tasks"),
     issueNumber: v.number(),
     repository: v.string(),
     syncEnabled: v.boolean(),
   })
   ```
   
   - GitHub App setup
   - Webhook handlers for issues/PRs
   - Two-way sync for issues
   - PR status in task view

2. **Google Calendar Integration**
   - OAuth flow
   - Calendar sync for meetings
   - Meet link generation
   - Availability checking

### Phase 7: AI Features (Week 16-17)

**Goal**: AI-powered productivity enhancements

1. **AI Schema**
   ```typescript
   export const aiGenerations = defineTable({
     userId: v.id("users"),
     type: v.string(), // "task", "description", "comment"
     prompt: v.string(),
     result: v.string(),
     metadata: v.any(),
     tokens: v.number(),
   })
   ```

2. **Features**
   - Task description generation
   - Smart task breakdown
   - Meeting summary generation
   - Sprint planning assistance
   - Natural language task creation

### Phase 8: CLI Development (Week 18-19)

**Goal**: Developer-friendly CLI for common operations

1. **CLI Architecture**
   - Separate package in monorepo
   - Shared types with web app
   - Direct Convex API usage
   - Authentication via device flow

2. **Core Commands**
   ```bash
   ltf1 workspace list
   ltf1 project create "New Project"
   ltf1 task add "Fix login bug" --project webapp --assign @john
   ltf1 task list --filter "assignee:me status:open"
   ltf1 meeting schedule "Sprint Planning" --time "tomorrow 2pm"
   ```

### Phase 9: Advanced Features & Polish (Week 20+)

**Goal**: Enterprise features and refinement

1. **Advanced Features**
   - Custom workflows per project
   - Advanced reporting/analytics
   - Time tracking integration
   - Resource planning
   - Budget tracking
   - API for third-party integrations

2. **Performance & Polish**
   - Optimistic updates everywhere
   - Offline support with sync
   - Real-time collaboration
   - Advanced search with filters
   - Keyboard shortcuts
   - Mobile responsive design

## Key Architectural Decisions

### 1. Multi-tenancy Strategy
- Workspace-based isolation
- Shared-nothing architecture
- Row-level security in Convex

### 2. Real-time Updates
- Convex subscriptions for live data
- Optimistic updates for better UX
- Conflict resolution for concurrent edits

### 3. Scalability Considerations
- Pagination from day one
- Indexed queries for all common access patterns
- Lazy loading for large datasets
- Background jobs for heavy operations

### 4. API Design for CLI
- Same Convex functions for web and CLI
- Consistent response formats
- Rate limiting per workspace

### 5. Extensibility
- Custom fields on tasks
- Webhook system for integrations
- Plugin architecture preparation

## MVP Definition (End of Phase 4)
- Multi-workspace support
- Project and task management
- Team collaboration with roles
- Basic permissions
- Real-time updates

## Development Best Practices

1. **Testing Strategy**
   - Unit tests for Convex functions
   - Integration tests for workflows
   - E2E tests for critical paths

2. **Documentation**
   - API documentation from start
   - User guides per role
   - Developer documentation for CLI

3. **Security**
   - Input validation on all mutations
   - Permission checks in every query
   - Audit logging for sensitive operations
   - Rate limiting

4. **Performance**
   - Query performance monitoring
   - Bundle size optimization
   - Lazy loading routes
   - Image optimization

## Risk Mitigation

1. **Technical Risks**
   - Start with proven patterns
   - Build PoC for complex integrations
   - Have fallback plans for external APIs

2. **Scope Risks**
   - Clear MVP definition
   - Feature flags for gradual rollout
   - User feedback loops early

3. **Performance Risks**
   - Load testing from Phase 3
   - Query optimization ongoing
   - Caching strategy defined early

This plan provides a solid foundation that supports all planned features while maintaining flexibility for future growth.