# LTF1 Implementation Guide

## Quick Start Implementation Steps

### Step 1: Initialize Monorepo Structure

```bash
# Create project structure
mkdir -p ltf1/packages/{web,shared,cli}
cd ltf1

# Initialize pnpm workspace
pnpm init

# Create workspace configuration
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
  - 'convex'
EOF

# Setup root package.json
cat > package.json << EOF
{
  "name": "ltf1",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
EOF
```

### Step 2: Setup Shared Package

```bash
cd packages/shared

# Initialize shared types and utilities
pnpm init
pnpm add -D typescript @types/node

# Create tsconfig
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create shared types structure
mkdir -p src/{types,utils,constants}
```

### Step 3: Core Type Definitions

Create `packages/shared/src/types/index.ts`:

```typescript
// User roles and permissions
export type SystemRole = 'owner' | 'admin' | 'manager' | 'developer' | 'viewer';
export type ProjectRole = 'lead' | 'member' | 'viewer';

export interface Permission {
  resource: 'workspace' | 'project' | 'task' | 'meeting';
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  scope?: 'own' | 'assigned' | 'all';
}

// Core entities
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  language: string;
  notifications: NotificationSettings;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  features: WorkspaceFeatures;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  identifier: string;
  status: ProjectStatus;
  visibility: 'public' | 'private';
}

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
export type TaskStatus = string; // Flexible for custom workflows
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskType = 'task' | 'bug' | 'feature' | 'epic';

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    totalPages?: number;
    totalCount?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
```

### Step 4: Setup Web Application

```bash
cd ../../packages/web

# Create Vite + React + TypeScript app
pnpm create vite . --template react-ts
pnpm add -D @vitejs/plugin-react @types/react @types/react-dom

# Install core dependencies
pnpm add react react-dom react-router-dom @clerk/clerk-react convex
pnpm add daisyui @tailwindcss/typography tailwindcss postcss autoprefixer
pnpm add @tanstack/react-query zustand react-hook-form zod
pnpm add date-fns react-hot-toast framer-motion

# Link shared package
pnpm add @ltf1/shared@workspace:*
```

### Step 5: Configure Vite for Monorepo

Create `packages/web/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
});
```

### Step 6: Setup Convex Backend

```bash
cd ../../
npx convex dev --once # Initialize Convex project

# Create initial schema
cp convex-schema-blueprint.ts convex/schema.ts

# Create helper functions
mkdir -p convex/{lib,mutations,queries}
```

Create `convex/lib/permissions.ts`:

```typescript
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk", (q) => q.eq("clerkId", clerkId))
    .first();
}

export async function getUserWorkspaceRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  workspaceId: Id<"workspaces">
): Promise<string | null> {
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .first();
  
  return membership?.role ?? null;
}

export function canManageWorkspace(role: string): boolean {
  return ["owner", "admin"].includes(role);
}

export function canManageProjects(role: string): boolean {
  return ["owner", "admin", "manager"].includes(role);
}

export function canEditTasks(role: string): boolean {
  return ["owner", "admin", "manager", "developer"].includes(role);
}
```

### Step 7: Create First Convex Functions

Create `convex/queries/workspaces.ts`:

```typescript
import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../lib/permissions";

export const listUserWorkspaces = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) return [];

    // Get all workspace memberships for the user
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch workspace details for each membership
    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db.get(membership.workspaceId);
        return workspace ? {
          ...workspace,
          role: membership.role,
          joinedAt: membership.joinedAt,
        } : null;
      })
    );

    return workspaces.filter(Boolean);
  },
});

export const getWorkspace = query({
  args: { 
    clerkId: v.string(),
    workspaceSlug: v.string() 
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) return null;

    // Find workspace by slug
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.workspaceSlug))
      .first();
    
    if (!workspace) return null;

    // Check if user has access
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", workspace._id).eq("userId", user._id)
      )
      .first();

    if (!membership) return null;

    return {
      ...workspace,
      role: membership.role,
    };
  },
});
```

### Step 8: Setup Authentication Flow

Create `packages/web/src/providers/AuthProvider.tsx`:

```typescript
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### Step 9: Create Base Layout Structure

Create `packages/web/src/components/layout/AppLayout.tsx`:

```typescript
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { UserMenu } from '../user/UserMenu';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user } = useUser();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'home' },
    { name: 'Projects', href: '/projects', icon: 'folder' },
    { name: 'Tasks', href: '/tasks', icon: 'check-circle' },
    { name: 'Meetings', href: '/meetings', icon: 'calendar' },
    { name: 'Team', href: '/team', icon: 'users' },
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Sidebar */}
      <div className={`drawer ${sidebarOpen ? 'drawer-open' : ''}`}>
        <input type="checkbox" className="drawer-toggle" />
        
        <div className="drawer-content flex flex-col">
          {/* Top Navigation */}
          <div className="navbar bg-base-100 border-b">
            <div className="flex-none">
              <button 
                className="btn btn-square btn-ghost"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1">
              <WorkspaceSwitcher />
            </div>
            
            <div className="flex-none">
              <UserMenu />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>

        {/* Sidebar Drawer */}
        <div className="drawer-side">
          <label className="drawer-overlay"></label>
          <aside className="bg-base-200 w-64 min-h-full">
            <div className="p-4">
              <h2 className="text-xl font-bold">LTF1</h2>
            </div>
            
            <ul className="menu p-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.href}
                    className={location.pathname === item.href ? 'active' : ''}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
```

### Step 10: Initial Project Checklist

Before proceeding with feature development:

- [ ] Monorepo structure created with pnpm workspaces
- [ ] Shared types package configured
- [ ] Vite + React + TypeScript setup complete
- [ ] TailwindCSS + DaisyUI configured
- [ ] Convex backend initialized with schema
- [ ] Clerk authentication integrated
- [ ] Base routing structure in place
- [ ] Permission system foundation created
- [ ] Environment variables configured
- [ ] Git repository initialized with .gitignore
- [ ] ESLint and Prettier configured
- [ ] TypeScript paths configured for easy imports
- [ ] Basic error boundary implemented
- [ ] Loading states and error handling patterns established

## Next Implementation Steps

1. **Complete User Sync**: Implement Clerk webhook to sync users to Convex
2. **Workspace Creation**: Build UI and mutations for workspace management
3. **Project CRUD**: Implement full project lifecycle
4. **Task System**: Start with basic task creation and kanban board
5. **Real-time Updates**: Add Convex subscriptions for live data

## Development Tips

### Performance Optimization from Start
```typescript
// Use React Query for caching
const { data: projects } = useQuery({
  queryKey: ['projects', workspaceId],
  queryFn: () => api.projects.list({ workspaceId }),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Implement virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

// Use optimistic updates
const updateTask = useMutation({
  mutationFn: api.tasks.update,
  onMutate: async (newTask) => {
    // Optimistically update UI
    await queryClient.cancelQueries(['tasks']);
    const previousTasks = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], old => 
      old.map(task => task.id === newTask.id ? newTask : task)
    );
    return { previousTasks };
  },
});
```

### Security Best Practices
```typescript
// Always validate permissions in Convex functions
export const createProject = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx, args.clerkId);
    if (!user) throw new Error("Unauthorized");
    
    const role = await getUserWorkspaceRole(ctx, user._id, args.workspaceId);
    if (!canManageProjects(role)) {
      throw new Error("Insufficient permissions");
    }
    
    // Proceed with creation...
  },
});
```

### Scalability Patterns
```typescript
// Implement pagination from the start
export const listTasks = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .paginate({ numItems: limit, cursor: args.cursor });
    
    return {
      page: tasks.page,
      continueCursor: tasks.continueCursor,
      isDone: tasks.isDone,
    };
  },
});
```

This implementation guide provides concrete steps to start building LTF1 with a solid foundation that supports all planned features.