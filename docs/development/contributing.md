# Development Guide

This guide covers everything you need to know to contribute to LTF1, including setup, coding standards, and best practices.

## Development Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Git
- VS Code (recommended IDE)
- Convex CLI

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ltf1-pm.git
   cd ltf1-pm
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy example env file
   cp apps/web/.env.example apps/web/.env
   
   # Add your keys:
   # VITE_CONVEX_URL=your_convex_dev_url
   # VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: Start Convex backend
   npx convex dev
   
   # Terminal 2: Start frontend
   pnpm dev
   ```

### VS Code Setup

Recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript
- Tailwind CSS IntelliSense
- Convex (if available)

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Project Organization

### Monorepo Structure
```
/
├── apps/web/          # Main React application
├── packages/
│   ├── cli/          # CLI tool package
│   ├── types/        # Shared TypeScript types
│   └── backend/      # Shared backend utilities
├── convex/           # Backend functions
└── docs/            # Documentation
```

### Code Organization

#### Frontend (apps/web/src/)
```
src/
├── components/       # UI components
│   ├── common/      # Shared components
│   ├── features/    # Feature-specific components
│   └── layout/      # Layout components
├── hooks/           # Custom React hooks
├── pages/           # Route pages
├── providers/       # Context providers
├── styles/          # Global styles
└── utils/           # Helper functions
```

#### Backend (convex/)
```
convex/
├── _generated/      # Auto-generated types (don't edit)
├── schema.ts        # Database schema definition
├── auth/           # Authentication functions
├── tasks/          # Task-related functions
├── projects/       # Project functions
└── [feature]/      # Feature-specific functions
```

## Coding Standards

### TypeScript Guidelines

1. **Always use TypeScript** - No `.js` files
2. **Explicit types** for function parameters
3. **Avoid `any`** - Use `unknown` if type is truly unknown
4. **Use type inference** where obvious

```typescript
// Good
const createTask = async (title: string, priority: Priority): Promise<Task> => {
  // implementation
}

// Bad
const createTask = async (title: any, priority: any): Promise<any> => {
  // implementation
}
```

### React Best Practices

1. **Functional Components Only**
   ```typescript
   // Good
   export function TaskCard({ task }: { task: Task }) {
     return <div>{task.title}</div>
   }
   
   // Avoid class components
   ```

2. **Custom Hooks for Logic**
   ```typescript
   // Extract complex logic into hooks
   function useTaskFilters() {
     const [filters, setFilters] = useState<TaskFilters>({})
     // filtering logic
     return { filters, setFilters }
   }
   ```

3. **Component Organization**
   ```typescript
   // 1. Imports
   import { useState } from 'react'
   
   // 2. Types
   interface Props {
     task: Task
   }
   
   // 3. Component
   export function TaskCard({ task }: Props) {
     // 4. Hooks
     const [isEditing, setIsEditing] = useState(false)
     
     // 5. Handlers
     const handleEdit = () => {
       setIsEditing(true)
     }
     
     // 6. Render
     return (
       <div>
         {/* content */}
       </div>
     )
   }
   ```

### Convex Patterns

1. **Query Structure**
   ```typescript
   export const getTask = query({
     args: {
       taskId: v.id("tasks")
     },
     handler: async (ctx, args) => {
       // 1. Auth check
       const identity = await ctx.auth.getUserIdentity()
       if (!identity) throw new Error("Unauthorized")
       
       // 2. Get data
       const task = await ctx.db.get(args.taskId)
       if (!task) throw new Error("Task not found")
       
       // 3. Permission check
       const hasAccess = await checkTaskAccess(ctx, task)
       if (!hasAccess) throw new Error("Access denied")
       
       // 4. Return data
       return task
     }
   })
   ```

2. **Mutation Pattern**
   ```typescript
   export const updateTask = mutation({
     args: {
       taskId: v.id("tasks"),
       updates: v.object({
         title: v.optional(v.string()),
         status: v.optional(TaskStatusValidator)
       })
     },
     handler: async (ctx, args) => {
       // 1. Validate and authorize
       const task = await getTaskWithAuth(ctx, args.taskId)
       
       // 2. Update
       await ctx.db.patch(args.taskId, args.updates)
       
       // 3. Log activity
       await logActivity(ctx, {
         type: "task_updated",
         taskId: args.taskId,
         changes: args.updates
       })
     }
   })
   ```

### Brutalist Design Implementation

1. **Component Styling**
   ```typescript
   // Use Tailwind classes following brutalist principles
   <button className={clsx(
     "brutal-btn",                           // Base brutal styles
     "px-24px py-12px",                     // Spacing in 8px units
     "bg-primary-brutalist",                 // Brutalist colors
     "border-2 border-basalt-border",        // Always 2px borders
     "shadow-brutal hover:shadow-brutal-hover", // Brutal shadows
     "uppercase font-mono font-bold",        // Typography
     "transition-all duration-200"           // Smooth transitions
   )}>
     CLICK ME
   </button>
   ```

2. **No Rounded Corners**
   ```css
   /* Never use these */
   rounded, rounded-md, rounded-lg
   
   /* Always sharp edges */
   border-radius: 0;
   ```

3. **Color Usage**
   - Primary: `primary-brutalist` (#FFD93D)
   - Background: `event-horizon` (#0A0A0A)
   - Surface: `carbon-plate` (#1A1A1A)
   - Border: `basalt-border` (#2A2A2A)
   - Text: `cathode-white` (#F5F5F5)

## Adding New Features

### Feature Checklist

- [ ] Plan the feature architecture
- [ ] Update database schema if needed
- [ ] Create Convex functions (queries/mutations)
- [ ] Build UI components
- [ ] Add activity logging
- [ ] Update types
- [ ] Add to navigation if needed
- [ ] Write tests (when implemented)
- [ ] Update documentation

### Step-by-Step Example: Adding a Comments Feature

1. **Update Schema** (`convex/schema.ts`)
   ```typescript
   comments: defineTable({
     taskId: v.id("tasks"),
     userId: v.id("users"),
     content: v.string(),
     createdAt: v.number(),
     updatedAt: v.number(),
   })
   .index("by_task", ["taskId"])
   ```

2. **Create Backend Functions** (`convex/comments/`)
   ```typescript
   // mutations.ts
   export const createComment = mutation({
     args: {
       taskId: v.id("tasks"),
       content: v.string()
     },
     handler: async (ctx, args) => {
       // implementation
     }
   })
   ```

3. **Build UI Component** (`src/components/features/comments/`)
   ```typescript
   export function CommentList({ taskId }: { taskId: Id<"tasks"> }) {
     const comments = useQuery(api.comments.queries.getTaskComments, { taskId })
     // component implementation
   }
   ```

4. **Add Activity Logging**
   ```typescript
   await logActivity(ctx, {
     type: "comment_added",
     taskId: args.taskId,
     userId: user._id
   })
   ```

## Common Development Tasks

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item if needed
4. Update permissions/guards

### Adding a New Convex Function

1. Create file in appropriate `convex/` subdirectory
2. Define args validation
3. Implement auth checks
4. Add business logic
5. Export from `convex/_generated/api.d.ts` (auto-generated)

### Modifying the Schema

1. Update `convex/schema.ts`
2. Run `npx convex dev` to apply changes
3. Update TypeScript types if needed
4. Handle migration if breaking change

### Adding a New Component

1. Create component file in appropriate directory
2. Follow component structure guidelines
3. Use brutalist design classes
4. Export from index file

## Debugging

### Frontend Debugging

1. **Browser DevTools**
   - React Developer Tools
   - Network tab for API calls
   - Console for errors

2. **VS Code Debugging**
   ```json
   // .vscode/launch.json
   {
     "type": "chrome",
     "request": "launch",
     "name": "Debug React",
     "url": "http://localhost:3000",
     "webRoot": "${workspaceFolder}/apps/web"
   }
   ```

### Backend Debugging

1. **Convex Dashboard**
   - Function logs
   - Database explorer
   - Real-time metrics

2. **Console Logging**
   ```typescript
   console.log("Debug data:", { taskId, updates })
   ```

### Common Issues

1. **Type Errors**
   - Run `pnpm typecheck`
   - Check generated types match schema

2. **Convex Connection**
   - Verify `VITE_CONVEX_URL` is correct
   - Check `npx convex dev` is running

3. **Auth Issues**
   - Verify Clerk keys
   - Check user exists in database

## Testing (Future)

### Unit Tests
```typescript
// Example test structure
describe('TaskCard', () => {
  it('displays task title', () => {
    const task = createMockTask()
    render(<TaskCard task={task} />)
    expect(screen.getByText(task.title)).toBeInTheDocument()
  })
})
```

### Integration Tests
- Test Convex functions
- Test auth flows
- Test data mutations

## Git Workflow

### Branch Naming
- `feature/add-comments`
- `fix/task-drag-drop`
- `chore/update-deps`
- `docs/api-guide`

### Commit Messages
Follow conventional commits:
```
feat: add comment system to tasks
fix: resolve task status update race condition
docs: update API documentation
chore: upgrade dependencies
style: format code with prettier
```

### Pull Request Process
1. Create feature branch
2. Make changes following guidelines
3. Test thoroughly
4. Update documentation if needed
5. Create PR with description
6. Address review feedback
7. Merge when approved

## Performance Considerations

### Frontend Performance
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes and components
- Optimize bundle size

### Backend Performance
- Use database indexes effectively
- Paginate large queries
- Batch operations when possible
- Cache computed values

## Security Best Practices

1. **Always validate input**
2. **Check permissions in every mutation**
3. **Sanitize user content**
4. **Never expose sensitive data**
5. **Use environment variables for secrets**

## Resources

### Internal
- [Architecture Overview](../architecture/technical-overview.md)
- [API Documentation](../api/convex-functions.md)
- [Design System](../design/brutalist-components.md)

### External
- [Convex Documentation](https://docs.convex.dev)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)

## Getting Help

- Check existing documentation
- Search through codebase for examples
- Review similar features
- Ask in project discussions

Happy coding! 🚀