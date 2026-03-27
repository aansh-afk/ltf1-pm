# LTF1 Technical Architecture

This document provides a comprehensive overview of LTF1's technical architecture, design decisions, and implementation details.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Routes    │  │  Components  │  │     Hooks       │   │
│  │  (Router)   │  │  (Brutalist) │  │   (Business)    │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │ Convex Client
┌─────────────────────────────┴───────────────────────────────┐
│                      Convex Backend                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Queries   │  │  Mutations   │  │    Actions      │   │
│  │ (Real-time) │  │  (Updates)   │  │  (Side-effects) │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│                      Database Schema                         │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    External Services                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │    Clerk    │  │    Vercel    │  │     GitHub      │   │
│  │   (Auth)    │  │  (Hosting)   │  │  (Future API)   │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18**: UI library with concurrent features
- **TypeScript**: Type safety and better DX
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first styling (brutalist design)
- **React Router v6**: Client-side routing
- **Framer Motion**: Animations (minimal use)
- **React Icons**: Consistent iconography

### Backend
- **Convex**: Real-time backend platform
  - Reactive queries
  - ACID transactions
  - Automatic scaling
  - Built-in auth integration

### Authentication
- **Clerk**: Modern auth solution
  - Social logins
  - Email/password
  - MFA support
  - Session management

### Infrastructure
- **Vercel**: Frontend hosting
- **Convex Cloud**: Backend hosting
- **GitHub**: Version control
- **pnpm**: Package management

## Project Structure

```
LTF1-L/
├── apps/
│   └── web/                    # React frontend application
│       ├── src/
│       │   ├── components/     # UI components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── pages/          # Route pages
│       │   ├── providers/      # Context providers
│       │   ├── styles/         # Global styles
│       │   └── utils/          # Helper functions
│       └── public/            # Static assets
├── convex/                    # Backend functions
│   ├── _generated/           # Auto-generated types
│   ├── schema.ts            # Database schema
│   ├── auth/                # Authentication logic
│   ├── tasks/               # Task management
│   ├── projects/            # Project management
│   ├── workspaces/          # Workspace logic
│   └── developers/          # Profile system
├── packages/
│   ├── cli/                 # CLI tool
│   ├── types/               # Shared TypeScript types
│   └── backend/             # Shared backend utilities
└── docs/                    # Documentation
```

## Data Model

### Core Entities

```typescript
// Workspace - Top level organization
interface Workspace {
  name: string
  slug: string
  ownerId: Id<"users">
  settings: WorkspaceSettings
  subscription: SubscriptionPlan
}

// Project - Container for tasks
interface Project {
  workspaceId: Id<"workspaces">
  name: string
  key: string // e.g., "PROJ"
  description?: string
  workflowType: "kanban" | "scrum"
  status: "active" | "archived" | "on_hold"
}

// Task - Unit of work
interface Task {
  projectId: Id<"projects">
  number: number // Sequential per project
  title: string
  description?: string
  type: TaskType
  priority: Priority
  status: TaskStatus
  assigneeId?: Id<"users">
  storyPoints?: number
}

// User - System user
interface User {
  clerkId: string // External auth ID
  email: string
  name?: string
  avatarUrl?: string
  preferences?: UserPreferences
}

// Developer Profile - Extended user info
interface DeveloperProfile {
  userId: Id<"users">
  profile?: {
    role: string
    bio: string
    technologies: Technology[]
    skills: string[]
    // ... more fields
  }
  status: DeveloperStatus
}
```

### Relationships

1. **One-to-Many**:
   - Workspace → Projects
   - Project → Tasks
   - User → Developer Profile (1:1)

2. **Many-to-Many**:
   - Users ↔ Workspaces (via WorkspaceMembers)
   - Users ↔ Projects (via ProjectMembers)
   - Tasks ↔ Labels
   - Tasks ↔ Blockers

## Real-time Architecture

### Convex Reactive Queries

```typescript
// Component subscribes to query
const tasks = useQuery(api.tasks.queries.getProjectTasks, { 
  projectId 
})

// Any mutation automatically updates all subscribers
await ctx.db.patch(taskId, { status: "done" })
// All clients see update immediately
```

### Optimistic Updates
For better UX, mutations show immediate feedback:

```typescript
const updateTask = useMutation(api.tasks.update)
  .withOptimisticUpdate((store, args) => {
    // Update local state immediately
    store.setQuery(api.tasks.get, { id: args.id }, {
      ...currentTask,
      ...args.updates
    })
  })
```

### WebSocket Connection
- Persistent connection for real-time updates
- Automatic reconnection on disconnect
- Offline queue for mutations
- Conflict resolution built-in

## Security Model

### Authentication Flow
```
User → Clerk Auth → JWT Token → Convex → Validated Identity
```

### Authorization Layers

1. **Workspace Level**
   ```typescript
   const canAccessWorkspace = async (ctx, workspaceId) => {
     const user = await getCurrentUser(ctx)
     const member = await ctx.db.query("workspaceMembers")
       .withIndex("by_workspace_user", q => 
         q.eq("workspaceId", workspaceId)
          .eq("userId", user._id)
       ).first()
     return !!member
   }
   ```

2. **Project Level**
   - Inherits workspace permissions
   - Additional project-specific roles

3. **Task Level**
   - Project members can view
   - Assignee/Lead can edit
   - Admin can delete

### Data Validation
- Convex schema enforcement
- Runtime type checking
- Input sanitization
- XSS prevention in React

## Performance Optimizations

### Frontend
1. **Code Splitting**
   - Route-based splitting
   - Lazy loading components
   - Dynamic imports

2. **Caching Strategy**
   - Convex query caching
   - Browser cache headers
   - Service worker (planned)

3. **Rendering Optimizations**
   - React.memo for pure components
   - useMemo for expensive computations
   - Virtual scrolling for long lists

### Backend
1. **Database Indexes**
   ```typescript
   // Efficient queries with indexes
   .withIndex("by_project_status", q => 
     q.eq("projectId", projectId)
      .eq("status", status)
   )
   ```

2. **Query Optimization**
   - Pagination for large datasets
   - Selective field returns
   - Aggregation at database level

3. **Real-time Efficiency**
   - Delta updates only
   - Subscription management
   - Connection pooling

## Brutalist Design System

### Design Principles
1. **Raw Aesthetics**: No rounded corners, harsh contrasts
2. **Monospace Typography**: Technical, terminal-like feel
3. **High Contrast**: Black (#0A0A0A) and Yellow (#FFD93D)
4. **Brutal Shadows**: Sharp, offset shadows for depth
5. **Uppercase Headers**: Strong, commanding presence

### Component Architecture
```typescript
// Brutal button component
<button className={clsx(
  "brutal-btn",
  "px-24px py-12px",
  "bg-primary-brutalist text-event-horizon",
  "border-2 border-basalt-border",
  "shadow-brutal hover:shadow-brutal-hover",
  "transition-all duration-200"
)}>
  CLICK ME
</button>
```

### Color System
```css
--primary-brutalist: #FFD93D;      /* Yellow */
--event-horizon: #0A0A0A;          /* Near black */
--carbon-plate: #1A1A1A;           /* Dark gray */
--basalt-border: #2A2A2A;          /* Border gray */
--cathode-white: #F5F5F5;          /* Off white */
```

## Development Patterns

### Component Structure
```typescript
// Feature-based organization
components/
├── features/
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   └── TaskFilters.tsx
│   └── projects/
│       ├── ProjectCard.tsx
│       └── ProjectList.tsx
└── common/
    ├── Button.tsx
    └── Modal.tsx
```

### State Management
- **Local State**: useState for component state
- **Global State**: Convex queries for shared data
- **Form State**: Controlled components
- **URL State**: Query params for filters

### Error Handling
```typescript
try {
  await mutation(args)
} catch (error) {
  if (error instanceof ConvexError) {
    toast.error(error.message)
  } else {
    console.error("Unexpected error:", error)
    toast.error("Something went wrong")
  }
}
```

## Testing Strategy

### Unit Tests (Planned)
- Vitest for component testing
- Testing Library for React
- Mock Convex client

### Integration Tests
- API endpoint testing
- Database transaction tests
- Auth flow verification

### E2E Tests (Future)
- Playwright for browser automation
- Critical user journeys
- Cross-browser testing

## Deployment Pipeline

### Development
```bash
# Local development
pnpm install
pnpm dev         # Starts all services
```

### Staging
- Preview deployments on Vercel
- Convex dev environment
- Feature branch testing

### Production
```bash
# Production deployment
pnpm build       # Build all packages
pnpm deploy      # Deploy to Vercel/Convex
```

## Monitoring and Observability

### Frontend Monitoring
- Browser console errors
- Performance metrics (Web Vitals)
- User session replay (planned)

### Backend Monitoring
- Convex dashboard metrics
- Function execution times
- Error tracking

### Real-time Metrics
- WebSocket connection status
- Active user count
- Database query performance

## Future Architecture Plans

### Scalability
- Horizontal scaling via Convex
- CDN for static assets
- Database sharding (if needed)

### Features
- Offline support with sync
- Mobile app (React Native)
- Plugin system
- API for integrations

### Technical Debt
- Increase test coverage
- Performance profiling
- Accessibility audit
- Security audit

## Related Documentation

- [Getting Started](../guides/getting-started.md) - Setup instructions
- [Core Concepts](../guides/core-concepts.md) - System concepts
- [API Documentation](../api/convex-functions.md) - API reference
- [Development Guide](../development/contributing.md) - Contribution guide