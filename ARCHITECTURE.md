# Iceberg Architecture Guide

## Core Principles

### 1. Feature-First Organization
```
✅ features/tasks/components/task-card.tsx
✅ features/tasks/hooks/use-tasks.ts
❌ components/tasks/task-card.tsx
❌ hooks/tasks/use-tasks.ts
```

### 2. Colocation
Keep related code together:
- Components with their tests
- Features with their hooks
- API functions with their types

### 3. Dependency Flow
```
apps/web → packages/ui → packages/types
apps/cli → packages/types
         ↘ packages/backend
```

## Key Patterns

### Component Structure
```tsx
// features/tasks/components/task-card.tsx
import { Card } from '@/shared/components/ui/card'
import { type Task } from '@iceberg/types'
import { useTask } from '../hooks/use-task'

export function TaskCard({ taskId }: { taskId: string }) {
  const task = useTask(taskId)
  // Component logic
}
```

### Hook Pattern
```ts
// features/tasks/hooks/use-tasks.ts
import { useQuery } from 'convex/react'
import { api } from '@iceberg/backend'

export function useTasks(projectId: string) {
  return useQuery(api.tasks.queries.listByProject, { projectId })
}
```

### Convex Function Organization
```ts
// packages/backend/convex/functions/tasks/queries.ts
import { query } from '../_generated/server'
import { v } from 'convex/values'

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    // Query implementation
  }
})
```

## Feature Development Flow

### Adding a New Feature
1. Create feature directory: `apps/web/src/features/new-feature/`
2. Add components, hooks, and pages
3. Define types in `packages/types`
4. Implement backend in `packages/backend/convex/functions/new-feature/`
5. Add CLI commands if needed

### Shared Component Creation
1. Start in feature directory
2. If used by 2+ features, move to `shared/components`
3. If used by 2+ apps, move to `packages/ui`

## State Management

### Local State
- Component state: useState/useReducer
- Feature state: Zustand stores in feature directory

### Server State
- Convex for real-time data
- React Query for REST APIs
- No client-side caching of server data

## Testing Strategy

### Unit Tests
```
component.tsx
component.test.tsx
```

### Integration Tests
```
packages/backend/__tests__/
apps/web/__tests__/
```

### E2E Tests
```
tests/e2e/
```

## Performance Guidelines

### Code Splitting
- Route-based splitting by default
- Feature-based for large features
- Lazy load heavy integrations

### Bundle Optimization
```ts
// Lazy load heavy features
const AITaskGenerator = lazy(() => import('./features/tasks/components/ai-generator'))
```

## Security Patterns

### Authentication
- All auth logic in `features/auth`
- Use Convex auth helpers
- Session validation on every request

### Permissions
- Check at Convex function level
- Use `packages/backend/convex/lib/permissions.ts`
- Never trust client-side checks

## Integration Patterns

### External Services
```
packages/backend/convex/integrations/
├── github/
│   ├── client.ts      # API client
│   ├── webhooks.ts    # Webhook handlers
│   └── sync.ts        # Sync logic
```

### Event-Driven Architecture
- Use Convex scheduled functions for async work
- Emit events for cross-feature communication
- Keep features decoupled

## Mobile-First Development

### Responsive Components
```tsx
// Use mobile-first breakpoints
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Touch Optimization
- Minimum 44px touch targets
- Swipe gestures for common actions
- Optimize for one-handed use

## Dark Theme Implementation

### CSS Variables
```css
/* styles/themes/dark.css */
:root[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --text-primary: #ffffff;
}
```

### Component Usage
```tsx
// Always use CSS variables
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
```

## Deployment Architecture

### Web App
- Vercel/Netlify for static hosting
- Environment-based API endpoints
- CDN for static assets

### CLI
- NPM registry publication
- Auto-update mechanism
- Local config storage

### Backend
- Convex handles deployment
- Automatic scaling
- WebSocket connections for real-time

## Monitoring & Observability

### Error Tracking
- Sentry integration in all apps
- Structured error logging
- User context preservation

### Performance Monitoring
- Web Vitals tracking
- API response times
- Real-time connection health

## Development Workflow

### Branch Strategy
```
main
├── dev
├── feature/task-ai-generation
├── fix/notification-delay
└── chore/update-deps
```

### Code Review Checklist
- [ ] Types added to @iceberg/types
- [ ] Tests written and passing
- [ ] Mobile responsive
- [ ] Dark theme compatible
- [ ] Permissions checked
- [ ] Performance impact assessed

## Common Pitfalls to Avoid

1. **Circular Dependencies**: Use dependency injection
2. **Over-abstraction**: Start simple, refactor when needed
3. **Client-side data duplication**: Trust Convex as source of truth
4. **Tight coupling**: Features should be independent
5. **Security assumptions**: Always validate on backend