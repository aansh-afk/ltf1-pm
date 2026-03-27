# Feature Implementation Example: Tasks

This example shows how to implement the Tasks feature following our architecture.

## 1. Types Definition
```ts
// packages/types/src/models/task.ts
export interface Task {
  _id: string
  projectId: string
  workspaceId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  reporterId: string
  dueDate?: number
  tags: string[]
  aiGenerated?: boolean
  createdAt: number
  updatedAt: number
}

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface CreateTaskInput {
  title: string
  projectId: string
  description?: string
  assigneeId?: string
  priority?: TaskPriority
  dueDate?: number
  tags?: string[]
}
```

## 2. Backend Implementation
```ts
// packages/backend/convex/functions/tasks/queries.ts
import { query } from '../../_generated/server'
import { v } from 'convex/values'

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')
    
    // Check workspace access
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error('Project not found')
    
    const member = await ctx.db
      .query('workspaceMembers')
      .withIndex('by_workspace_user', q => 
        q.eq('workspaceId', project.workspaceId).eq('userId', identity.subject)
      )
      .first()
    
    if (!member) throw new Error('Access denied')
    
    return await ctx.db
      .query('tasks')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .order('desc')
      .collect()
  }
})
```

```ts
// packages/backend/convex/functions/tasks/mutations.ts
import { mutation } from '../../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    title: v.string(),
    projectId: v.id('projects'),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id('users')),
    priority: v.optional(v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical')
    )),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')
    
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error('Project not found')
    
    const taskId = await ctx.db.insert('tasks', {
      ...args,
      workspaceId: project.workspaceId,
      reporterId: identity.subject,
      status: 'todo',
      priority: args.priority || 'medium',
      tags: args.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    
    // Create notification for assignee
    if (args.assigneeId && args.assigneeId !== identity.subject) {
      await ctx.db.insert('notifications', {
        userId: args.assigneeId,
        type: 'task_assigned',
        title: 'New task assigned',
        message: `You've been assigned to: ${args.title}`,
        entityType: 'task',
        entityId: taskId,
        read: false,
        createdAt: Date.now(),
      })
    }
    
    return taskId
  }
})
```

## 3. Frontend Hook
```tsx
// apps/web/src/features/tasks/hooks/use-tasks.ts
import { useQuery, useMutation } from 'convex/react'
import { api } from '@ltf1/backend'
import { CreateTaskInput } from '@ltf1/types'
import { toast } from 'react-hot-toast'

export function useTasks(projectId: string) {
  const tasks = useQuery(api.tasks.queries.listByProject, { projectId })
  
  return {
    tasks: tasks || [],
    isLoading: tasks === undefined,
  }
}

export function useCreateTask() {
  const createTask = useMutation(api.tasks.mutations.create)
  
  return {
    createTask: async (input: CreateTaskInput) => {
      try {
        const taskId = await createTask(input)
        toast.success('Task created successfully')
        return taskId
      } catch (error) {
        toast.error('Failed to create task')
        throw error
      }
    }
  }
}
```

## 4. Feature Components
```tsx
// apps/web/src/features/tasks/components/task-list.tsx
import { Task } from '@ltf1/types'
import { TaskCard } from './task-card'
import { EmptyState } from '@/shared/components/common/empty-state'

interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
}

export function TaskList({ tasks, isLoading }: TaskListProps) {
  if (isLoading) {
    return <div className="grid gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton h-24 w-full" />
      ))}
    </div>
  }
  
  if (tasks.length === 0) {
    return <EmptyState
      title="No tasks yet"
      description="Create your first task to get started"
    />
  }
  
  return (
    <div className="grid gap-4">
      {tasks.map(task => (
        <TaskCard key={task._id} task={task} />
      ))}
    </div>
  )
}
```

```tsx
// apps/web/src/features/tasks/components/task-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateTaskInput } from '@ltf1/types'
import { Button } from '@/shared/components/ui/button'
import { useCreateTask } from '../hooks/use-tasks'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dueDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
})

interface TaskFormProps {
  projectId: string
  onSuccess?: () => void
}

export function TaskForm({ projectId, onSuccess }: TaskFormProps) {
  const { createTask } = useCreateTask()
  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId,
      priority: 'medium',
      tags: [],
    }
  })
  
  const onSubmit = async (data: CreateTaskInput) => {
    await createTask(data)
    form.reset()
    onSuccess?.()
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <input
        {...form.register('title')}
        placeholder="Task title"
        className="input input-bordered w-full"
      />
      
      <textarea
        {...form.register('description')}
        placeholder="Description (optional)"
        className="textarea textarea-bordered w-full"
        rows={3}
      />
      
      <select
        {...form.register('priority')}
        className="select select-bordered w-full"
      >
        <option value="low">Low Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="high">High Priority</option>
        <option value="critical">Critical Priority</option>
      </select>
      
      <Button
        type="submit"
        loading={form.formState.isSubmitting}
        className="w-full"
      >
        Create Task
      </Button>
    </form>
  )
}
```

## 5. Feature Page
```tsx
// apps/web/src/features/tasks/pages/tasks-dashboard.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTasks } from '../hooks/use-tasks'
import { TaskList } from '../components/task-list'
import { TaskForm } from '../components/task-form'
import { TaskFilters } from '../components/task-filters'
import { Modal } from '@/shared/components/ui/modal'
import { Button } from '@/shared/components/ui/button'

export function TasksDashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const { tasks, isLoading } = useTasks(projectId!)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
  })
  
  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (filters.assignee !== 'all' && task.assigneeId !== filters.assignee) return false
    return true
  })
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Task
        </Button>
      </div>
      
      <TaskFilters filters={filters} onChange={setFilters} />
      
      <div className="mt-6">
        <TaskList tasks={filteredTasks} isLoading={isLoading} />
      </div>
      
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
      >
        <TaskForm
          projectId={projectId!}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}
```

## 6. CLI Implementation
```ts
// apps/cli/src/commands/task/create.ts
import { Command } from 'commander'
import { apiClient } from '../../lib/api-client'
import { prompt } from '../../utils/prompts'
import { validateAuth } from '../../lib/auth-manager'

export const createTaskCommand = new Command('create')
  .description('Create a new task')
  .option('-p, --project <id>', 'Project ID')
  .option('-t, --title <title>', 'Task title')
  .option('--priority <priority>', 'Task priority (low|medium|high|critical)')
  .action(async (options) => {
    await validateAuth()
    
    const projectId = options.project || await prompt.select('Select project', await getProjects())
    const title = options.title || await prompt.input('Task title')
    const priority = options.priority || await prompt.select('Priority', [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' },
    ])
    
    const task = await apiClient.tasks.create({
      projectId,
      title,
      priority,
    })
    
    console.log(`✅ Task created: ${task._id}`)
  })
```

## 7. Testing
```tsx
// apps/web/src/features/tasks/components/__tests__/task-list.test.tsx
import { render, screen } from '@testing-library/react'
import { TaskList } from '../task-list'
import { mockTasks } from '@/tests/mocks/tasks'

describe('TaskList', () => {
  it('renders loading state', () => {
    render(<TaskList tasks={[]} isLoading={true} />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })
  
  it('renders empty state', () => {
    render(<TaskList tasks={[]} isLoading={false} />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })
  
  it('renders task list', () => {
    render(<TaskList tasks={mockTasks} isLoading={false} />)
    expect(screen.getByText(mockTasks[0].title)).toBeInTheDocument()
  })
})
```

This example demonstrates:
- Type-first development with shared types
- Backend implementation with proper authorization
- Frontend hooks for data fetching and mutations
- Component composition and separation of concerns
- Feature-based organization
- CLI integration
- Testing approach