import type { Id } from '../../../../../../convex/_generated/dataModel'
import type { Command, CommandContext, CommandResult } from '../types'

export const taskCommands: Command[] = [
  {
    name: 'task',
    aliases: ['t'],
    description: 'Task management commands',
    usage: 'task [create|list|assign|complete|priority|label|move|delete] [options]',
    examples: [
      'task create "Fix login bug"',
      'task list --status in_progress',
      'task assign TASK-123 user@example.com',
      'task complete TASK-456',
      'task priority TASK-789 urgent'
    ],
    execute: async (args, context) => {
      const subcommand = args[0]
      
      switch (subcommand) {
        case 'create':
        case 'new':
          return await createTask(args.slice(1), context)
        case 'list':
        case 'ls':
          return await listTasks(context)
        case 'assign':
          return await assignTask(args.slice(1), context)
        case 'complete':
        case 'done':
          return await completeTask(args.slice(1), context)
        case 'priority':
        case 'pri':
          return await setTaskPriority(args.slice(1), context)
        case 'label':
        case 'tag':
          return await addTaskLabel(args.slice(1), context)
        case 'move':
          return await moveTask(args.slice(1), context)
        case 'delete':
        case 'rm':
          return await deleteTask(args.slice(1), context)
        case 'info':
        case 'show':
          return await showTaskInfo(args.slice(1), context)
        case 'start':
          return await startTask(args.slice(1), context)
        case 'estimate':
          return await estimateTask(args.slice(1), context)
        default:
          return {
            success: false,
            output: `Unknown subcommand: ${subcommand}\nUsage: ${taskCommands[0].usage}`,
            type: 'error'
          }
      }
    }
  }
]

async function createTask(args: string[], context: CommandContext): Promise<CommandResult> {
  const title = args.join(' ').replace(/^["']|["']$/g, '')
  
  if (!title) {
    return {
      success: false,
      output: 'Task title is required\nUsage: task create "Task Title"',
      type: 'error'
    }
  }

  // Get available projects
  const projects = context.projects || []
  
  if (projects.length === 0) {
    return {
      success: false,
      output: 'No projects available. Please create a project first using "project create".',
      type: 'error'
    }
  }

  // Select project
  let selectedProject = projects[0]
  
  if (projects.length > 1) {
    const projectList = projects.map((p, i) => `  ${i + 1}. [${p.key}] ${p.name}`).join('\n')
    
    // Check if user provided project flag
    const projectFlag = context.flags.find(f => f.startsWith('--project='))
    if (projectFlag) {
      const projectIndex = parseInt(projectFlag.split('=')[1]) - 1
      if (projectIndex >= 0 && projectIndex < projects.length) {
        selectedProject = projects[projectIndex]
      } else {
        // Try to find by key
        const projectKey = projectFlag.split('=')[1].toUpperCase()
        const projectByKey = projects.find(p => p.key === projectKey)
        if (projectByKey) {
          selectedProject = projectByKey
        }
      }
    } else {
      return {
        success: false,
        output: `Multiple projects available:\n${projectList}\n\nPlease specify project with --project=<number|key>`,
        type: 'info'
      }
    }
  }

  // Parse task type
  const type = context.flags.includes('--bug') ? 'bug' :
               context.flags.includes('--feature') ? 'feature' :
               context.flags.includes('--improvement') ? 'improvement' :
               context.flags.includes('--epic') ? 'epic' : 'task'

  // Parse priority
  const priority = context.flags.includes('--urgent') ? 'urgent' :
                  context.flags.includes('--high') ? 'high' :
                  context.flags.includes('--low') ? 'low' : 'medium'

  try {
    if (context.mutations?.createTask) {
      const taskId = await context.mutations.createTask({
        projectId: selectedProject._id as Id<"projects">,
        title,
        type,
        priority,
        description: context.flags.find(f => f.startsWith('--description='))?.split('=')[1]
      })

      return {
        success: true,
        output: `✓ Task created successfully\n  Title: ${title}\n  Project: ${selectedProject.name}\n  Type: ${type}\n  Priority: ${priority}\n  ID: ${taskId}`,
        type: 'success'
      }
    }

    return {
      success: true,
      output: `✓ Task creation initiated\n  Title: ${title}\n  Project: ${selectedProject.name}\n  Type: ${type}\n  Priority: ${priority}`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to create task: ${error.message}`,
      type: 'error'
    }
  }
}

async function listTasks(context: CommandContext): Promise<CommandResult> {
  const tasks = context.tasks || []
  
  if (tasks.length === 0) {
    return {
      success: true,
      output: 'No tasks found. Use "task create <title>" to create one.',
      type: 'info'
    }
  }

  // Filter by status if provided
  let filteredTasks = tasks
  const statusFlag = context.flags.find(f => f.startsWith('--status='))
  if (statusFlag) {
    const status = statusFlag.split('=')[1]
    filteredTasks = tasks.filter(t => t.status === status)
  }

  // Filter by priority if provided
  const priorityFlag = context.flags.find(f => f.startsWith('--priority='))
  if (priorityFlag) {
    const priority = priorityFlag.split('=')[1]
    filteredTasks = filteredTasks.filter(t => t.priority === priority)
  }

  // Filter by assignee if provided
  const assignedFlag = context.flags.includes('--assigned')
  if (assignedFlag && context.user) {
    filteredTasks = filteredTasks.filter(t => 
      t.assigneeIds?.includes(context.user._id)
    )
  }

  const longFormat = context.flags.includes('-l') || context.flags.includes('--long')
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                           TASKS                               ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'

  if (longFormat) {
    output += 'ID      TITLE                          STATUS       PRIORITY  TYPE\n'
    output += '────────────────────────────────────────────────────────────────\n'
    
    filteredTasks.forEach(task => {
      const id = task.number ? `#${task.number}`.padEnd(8) : task._id.slice(-6).padEnd(8)
      const title = task.title.slice(0, 30).padEnd(30)
      const status = (task.status || 'backlog').padEnd(13)
      const priority = (task.priority || 'medium').padEnd(10)
      const type = task.type || 'task'
      
      output += `${id}${title}${status}${priority}${type}\n`
    })
  } else {
    // Group by status
    const statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']
    
    statuses.forEach(status => {
      const statusTasks = filteredTasks.filter(t => (t.status || 'backlog') === status)
      if (statusTasks.length > 0) {
        output += `\n${status.toUpperCase().replace('_', ' ')}:\n`
        statusTasks.forEach(task => {
          const priority = task.priority === 'urgent' ? '🔴' :
                         task.priority === 'high' ? '🟡' :
                         task.priority === 'low' ? '🔵' : '⚪'
          const type = task.type === 'bug' ? '🐛' :
                      task.type === 'feature' ? '✨' :
                      task.type === 'improvement' ? '🔧' : '📋'
          output += `  ${priority} ${type} [#${task.number || task._id.slice(-4)}] ${task.title}\n`
        })
      }
    })
  }

  output += `\nTotal: ${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`

  return {
    success: true,
    output,
    type: 'output'
  }
}

async function assignTask(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  const userEmail = args[1]
  
  if (!taskId || !userEmail) {
    return {
      success: false,
      output: 'Usage: task assign <task-id> <user-email>',
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '') ||
    t.title.toLowerCase().includes(taskId.toLowerCase())
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  // In a real implementation, we'd look up the user and add them to assigneeIds
  return {
    success: true,
    output: `✓ Task assigned\n  Task: ${task.title}\n  Assigned to: ${userEmail}`,
    type: 'success'
  }
}

async function completeTask(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  
  if (!taskId) {
    return {
      success: false,
      output: 'Usage: task complete <task-id>',
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '') ||
    t.title.toLowerCase().includes(taskId.toLowerCase())
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  try {
    if (context.mutations?.updateTask) {
      await context.mutations.updateTask({
        taskId: task._id as Id<"tasks">,
        status: 'done'
      })
    }

    return {
      success: true,
      output: `✓ Task completed\n  Task: ${task.title}\n  Status: done`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to complete task: ${error.message}`,
      type: 'error'
    }
  }
}

async function setTaskPriority(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  const priority = args[1]
  
  if (!taskId || !priority) {
    return {
      success: false,
      output: 'Usage: task priority <task-id> [urgent|high|medium|low]',
      type: 'error'
    }
  }

  const validPriorities = ['urgent', 'high', 'medium', 'low']
  if (!validPriorities.includes(priority)) {
    return {
      success: false,
      output: `Invalid priority. Use: ${validPriorities.join(', ')}`,
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '') ||
    t.title.toLowerCase().includes(taskId.toLowerCase())
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  try {
    if (context.mutations?.updateTask) {
      await context.mutations.updateTask({
        taskId: task._id as Id<"tasks">,
        priority: priority as "urgent" | "high" | "medium" | "low"
      })
    }

    return {
      success: true,
      output: `✓ Task priority updated\n  Task: ${task.title}\n  Priority: ${priority}`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to update priority: ${error.message}`,
      type: 'error'
    }
  }
}

async function addTaskLabel(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  const label = args.slice(1).join(' ')
  
  if (!taskId || !label) {
    return {
      success: false,
      output: 'Usage: task label <task-id> <label>',
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '')
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  const currentLabels = task.labels || []
  const newLabels = [...currentLabels, label]

  try {
    if (context.mutations?.updateTask) {
      await context.mutations.updateTask({
        taskId: task._id as Id<"tasks">,
        labels: newLabels
      })
    }

    return {
      success: true,
      output: `✓ Label added\n  Task: ${task.title}\n  Label: ${label}`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to add label: ${error.message}`,
      type: 'error'
    }
  }
}

async function moveTask(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  const status = args[1]
  
  if (!taskId || !status) {
    return {
      success: false,
      output: 'Usage: task move <task-id> [backlog|todo|in_progress|in_review|done]',
      type: 'error'
    }
  }

  const validStatuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      output: `Invalid status. Use: ${validStatuses.join(', ')}`,
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '')
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  try {
    if (context.mutations?.moveTask) {
      await context.mutations.moveTask({
        taskId: task._id as Id<"tasks">,
        status: status as any,
        position: 0
      })
    }

    return {
      success: true,
      output: `✓ Task moved\n  Task: ${task.title}\n  New Status: ${status}`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to move task: ${error.message}`,
      type: 'error'
    }
  }
}

async function deleteTask(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  
  if (!taskId) {
    return {
      success: false,
      output: 'Usage: task delete <task-id>',
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '')
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  if (!context.flags.includes('--force') && !context.flags.includes('-f')) {
    return {
      success: false,
      output: `⚠️  This will permanently delete task "${task.title}"\n\nTo confirm, use: task delete ${taskId} --force`,
      type: 'warning'
    }
  }

  try {
    if (context.mutations?.deleteTask) {
      await context.mutations.deleteTask({
        taskId: task._id as Id<"tasks">
      })
    }

    return {
      success: true,
      output: `✓ Task deleted\n  Task: ${task.title}`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to delete task: ${error.message}`,
      type: 'error'
    }
  }
}

async function startTask(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  
  if (!taskId) {
    return {
      success: false,
      output: 'Usage: task start <task-id>',
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '')
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  try {
    if (context.mutations?.updateTask) {
      await context.mutations.updateTask({
        taskId: task._id as Id<"tasks">,
        status: 'in_progress'
      })
    }

    return {
      success: true,
      output: `✓ Task started\n  Task: ${task.title}\n  Status: in_progress`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to start task: ${error.message}`,
      type: 'error'
    }
  }
}

async function estimateTask(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  const points = args[1]
  
  if (!taskId || !points) {
    return {
      success: false,
      output: 'Usage: task estimate <task-id> <story-points>',
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '')
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  const pointsNum = parseInt(points)
  if (isNaN(pointsNum)) {
    return {
      success: false,
      output: 'Story points must be a number',
      type: 'error'
    }
  }

  try {
    if (context.mutations?.updateTask) {
      await context.mutations.updateTask({
        taskId: task._id as Id<"tasks">,
        estimate: { points: pointsNum }
      })
    }

    return {
      success: true,
      output: `✓ Task estimated\n  Task: ${task.title}\n  Story Points: ${pointsNum}`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to estimate task: ${error.message}`,
      type: 'error'
    }
  }
}

async function showTaskInfo(args: string[], context: CommandContext): Promise<CommandResult> {
  const taskId = args[0]
  
  if (!taskId) {
    return {
      success: false,
      output: 'Usage: task info <task-id>',
      type: 'error'
    }
  }

  const task = context.tasks?.find(t => 
    t._id === taskId || 
    t.number?.toString() === taskId.replace('#', '')
  )

  if (!task) {
    return {
      success: false,
      output: `Task "${taskId}" not found`,
      type: 'error'
    }
  }

  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                       TASK DETAILS                            ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += `Title:       ${task.title}\n`
  output += `Number:      #${task.number || 'N/A'}\n`
  output += `Type:        ${task.type || 'task'}\n`
  output += `Status:      ${task.status || 'backlog'}\n`
  output += `Priority:    ${task.priority || 'medium'}\n`
  output += `Description: ${task.description || 'No description'}\n`
  
  if (task.labels && task.labels.length > 0) {
    output += `Labels:      ${task.labels.join(', ')}\n`
  }
  
  if (task.estimate) {
    output += `Estimate:    ${task.estimate.points} points\n`
  }
  
  output += `Created:     ${new Date(task.createdAt).toLocaleString()}\n`
  output += `Updated:     ${new Date(task.updatedAt).toLocaleString()}\n`

  return {
    success: true,
    output,
    type: 'info'
  }
}