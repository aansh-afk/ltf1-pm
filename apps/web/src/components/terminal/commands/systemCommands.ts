import { format } from 'date-fns'
import type { Command, CommandContext, CommandResult } from '../types'

export const systemCommands: Command[] = [
  {
    name: 'clear',
    aliases: ['cls'],
    description: 'Clear the terminal screen',
    usage: 'clear',
    execute: () => ({
      success: true,
      output: '',
      action: { type: 'clear' }
    })
  },
  
  {
    name: 'help',
    aliases: ['?', 'h', '-h', '--help'],
    description: 'Show available commands',
    usage: 'help [command]',
    examples: ['help', 'help project', 'help task'],
    execute: (args, context) => {
      if (args[0]) {
        return getCommandHelp(args[0])
      }
      return getAllCommands()
    }
  },
  
  {
    name: 'exit',
    aliases: ['quit', 'q'],
    description: 'Exit the terminal',
    usage: 'exit',
    execute: () => ({
      success: true,
      output: 'Goodbye! Terminal closed.',
      type: 'success',
      action: { type: 'exit' }
    })
  },
  
  {
    name: 'theme',
    aliases: ['color'],
    description: 'Change terminal theme',
    usage: 'theme [matrix|classic|amber|blue|brutalist]',
    examples: ['theme matrix', 'theme brutalist'],
    execute: (args) => {
      const themes = ['matrix', 'classic', 'amber', 'blue', 'brutalist']
      const theme = args[0]
      
      if (!theme || !themes.includes(theme)) {
        return {
          success: false,
          output: `Available themes: ${themes.join(', ')}`,
          type: 'error'
        }
      }
      
      return {
        success: true,
        output: `✓ Terminal theme changed to ${theme}`,
        type: 'success',
        action: { type: 'theme', value: theme }
      }
    }
  },
  
  {
    name: 'history',
    aliases: ['hist'],
    description: 'Show command history',
    usage: 'history [n]',
    execute: (args, context) => {
      const limit = args[0] ? parseInt(args[0]) : 10
      const history = context.history || []
      const recent = history.slice(-limit)
      
      if (recent.length === 0) {
        return {
          success: true,
          output: 'No command history yet',
          type: 'info'
        }
      }
      
      let output = 'COMMAND HISTORY:\n'
      output += '────────────────────────────────────────────────────────────────\n'
      recent.forEach((cmd, i) => {
        output += `  ${(history.length - recent.length + i + 1).toString().padStart(3)}  ${cmd}\n`
      })
      
      return {
        success: true,
        output,
        type: 'output'
      }
    }
  },
  
  {
    name: 'stats',
    aliases: ['status', 'info', 'dashboard'],
    description: 'Show system statistics and overview',
    usage: 'stats',
    execute: (args, context) => {
      const stats = {
        projects: context.projects?.length || 0,
        tasks: context.tasks?.length || 0,
        completedTasks: context.tasks?.filter(t => t.status === 'done').length || 0,
        activeProjects: context.projects?.filter(p => p.status === 'active').length || 0,
        workspaces: context.workspaces?.length || 0
      }
      
      const tasksByStatus = {
        backlog: context.tasks?.filter(t => t.status === 'backlog').length || 0,
        todo: context.tasks?.filter(t => t.status === 'todo').length || 0,
        inProgress: context.tasks?.filter(t => t.status === 'in_progress').length || 0,
        inReview: context.tasks?.filter(t => t.status === 'in_review').length || 0,
        done: context.tasks?.filter(t => t.status === 'done').length || 0
      }
      
      let output = '╔════════════════════════════════════════════════════════════════╗\n'
      output += '║                    SYSTEM STATISTICS                          ║\n'
      output += '╚════════════════════════════════════════════════════════════════╝\n\n'
      
      output += 'OVERVIEW:\n'
      output += '─────────────────────────────────────────────────────────────────\n'
      output += `Workspaces:      ${stats.workspaces}\n`
      output += `Projects:        ${stats.projects} total (${stats.activeProjects} active)\n`
      output += `Tasks:           ${stats.tasks} total (${stats.completedTasks} completed)\n`
      output += `Completion Rate: ${stats.tasks ? Math.round((stats.completedTasks / stats.tasks) * 100) : 0}%\n\n`
      
      output += 'TASK DISTRIBUTION:\n'
      output += '─────────────────────────────────────────────────────────────────\n'
      output += `Backlog:         ${tasksByStatus.backlog}\n`
      output += `To Do:           ${tasksByStatus.todo}\n`
      output += `In Progress:     ${tasksByStatus.inProgress}\n`
      output += `In Review:       ${tasksByStatus.inReview}\n`
      output += `Done:            ${tasksByStatus.done}\n\n`
      
      output += 'SYSTEM STATUS:\n'
      output += '─────────────────────────────────────────────────────────────────\n'
      output += `Status:          OPERATIONAL ✅\n`
      output += `User:            ${context.user?.email || 'Anonymous'}\n`
      output += `Session:         Active\n`
      output += `Time:            ${format(new Date(), 'PPpp')}\n`
      
      return {
        success: true,
        output,
        type: 'info'
      }
    }
  },
  
  {
    name: 'who',
    aliases: ['whoami', 'user'],
    description: 'Show current user information',
    usage: 'who',
    execute: (args, context) => {
      const user = context.user
      
      if (!user) {
        return {
          success: true,
          output: 'Not logged in',
          type: 'info'
        }
      }
      
      let output = '╔════════════════════════════════════════════════════════════════╗\n'
      output += '║                      USER INFORMATION                         ║\n'
      output += '╚════════════════════════════════════════════════════════════════╝\n\n'
      output += `Email:       ${user.email}\n`
      output += `Name:        ${user.name || 'Not set'}\n`
      output += `Role:        ${user.role || 'Member'}\n`
      output += `Created:     ${user.createdAt ? format(new Date(user.createdAt), 'PP') : 'Unknown'}\n`
      output += `Session:     Active\n`
      
      return {
        success: true,
        output,
        type: 'output'
      }
    }
  },
  
  {
    name: 'pwd',
    description: 'Print working directory',
    usage: 'pwd',
    execute: (args, context) => ({
      success: true,
      output: context.currentPath || '~',
      type: 'output'
    })
  },
  
  {
    name: 'date',
    aliases: ['time'],
    description: 'Show current date and time',
    usage: 'date',
    execute: () => ({
      success: true,
      output: format(new Date(), 'EEEE, MMMM do, yyyy - HH:mm:ss'),
      type: 'output'
    })
  },
  
  {
    name: 'version',
    aliases: ['ver', 'v'],
    description: 'Show terminal version',
    usage: 'version',
    execute: () => {
      let output = '╔════════════════════════════════════════════════════════════════╗\n'
      output += '║                    LTF1 COMMAND CENTER                        ║\n'
      output += '╚════════════════════════════════════════════════════════════════╝\n\n'
      output += 'Version:     2.0.0\n'
      output += 'Build:       Production\n'
      output += 'Engine:      Convex + React\n'
      output += 'Theme:       Brutalist\n'
      output += 'Status:      FULLY OPERATIONAL\n\n'
      output += '© 2024 LTF1 - The Ultimate Project Management Terminal'
      
      return {
        success: true,
        output,
        type: 'info'
      }
    }
  }
]

function getAllCommands(): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                  LTF1 COMMAND CENTER v2.0                     ║\n'
  output += '║                    AVAILABLE COMMANDS                         ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  const categories = {
    'PROJECT MANAGEMENT': [
      { cmd: 'project', desc: 'Create, list, and manage projects' },
      { cmd: 'task', desc: 'Create, assign, and track tasks' },
      { cmd: 'sprint', desc: 'Manage sprints and iterations' }
    ],
    'COLLABORATION': [
      { cmd: 'team', desc: 'Manage team members and roles' },
      { cmd: 'meeting', desc: 'Schedule and manage meetings' },
      { cmd: 'review', desc: 'Code review management' }
    ],
    'DEVELOPMENT': [
      { cmd: 'git', desc: 'Git integration and repository management' },
      { cmd: 'deploy', desc: 'Deployment and release management' },
      { cmd: 'test', desc: 'Test execution and reporting' }
    ],
    'AI ASSISTANCE': [
      { cmd: 'ai', desc: 'AI-powered suggestions and analysis' },
      { cmd: 'analyze', desc: 'Data analysis and insights' },
      { cmd: 'predict', desc: 'Delivery predictions and forecasting' }
    ],
    'NAVIGATION': [
      { cmd: 'cd', desc: 'Navigate to different sections' },
      { cmd: 'ls', desc: 'List items in current context' },
      { cmd: 'find', desc: 'Search projects, tasks, and more' }
    ],
    'SYSTEM': [
      { cmd: 'help', desc: 'Show this help message' },
      { cmd: 'stats', desc: 'Show system statistics' },
      { cmd: 'clear', desc: 'Clear terminal screen' },
      { cmd: 'exit', desc: 'Exit the terminal' }
    ]
  }
  
  for (const [category, commands] of Object.entries(categories)) {
    output += `${category}:\n`
    output += '─────────────────────────────────────────────────────────────────\n'
    commands.forEach(({ cmd, desc }) => {
      output += `  ${cmd.padEnd(15)} ${desc}\n`
    })
    output += '\n'
  }
  
  output += 'USAGE TIPS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '  • Type "help <command>" for detailed command information\n'
  output += '  • Use TAB for command completion\n'
  output += '  • Use ↑↓ arrows for command history\n'
  output += '  • Commands support flags like --force, --long, etc.\n'
  output += '  • Most commands have shorter aliases (e.g., "p" for "project")\n\n'
  
  output += '💡 Quick Start:\n'
  output += '  1. "project create MyProject" - Create a new project\n'
  output += '  2. "task create \'Fix bug\'" - Create a new task\n'
  output += '  3. "ai estimate \'Build feature\'" - Get AI estimation\n'
  output += '  4. "stats" - View your dashboard statistics'
  
  return {
    success: true,
    output,
    type: 'info'
  }
}

function getCommandHelp(commandName: string): CommandResult {
  // This would look up the command in the registry
  // For now, return a generic help message
  
  const helpTexts: Record<string, string> = {
    project: `PROJECT COMMAND
==============
Manage projects in your workspace.

USAGE:
  project [subcommand] [options]

SUBCOMMANDS:
  create <name>        Create a new project
  list                 List all projects
  delete <id>          Delete a project
  archive <id>         Archive a project
  clone <id> <name>    Clone an existing project
  set-lead <id> <user> Set project lead
  link-repo <id> <url> Link Git repository

FLAGS:
  --force, -f          Skip confirmation prompts
  --long, -l           Show detailed information
  --workspace=<n>      Select workspace by number

EXAMPLES:
  project create "New Website"
  project list --long
  project delete PROJ-123 --force`,
  
    task: `TASK COMMAND
===========
Manage tasks within projects.

USAGE:
  task [subcommand] [options]

SUBCOMMANDS:
  create <title>       Create a new task
  list                 List tasks
  assign <id> <user>   Assign task to user
  complete <id>        Mark task as complete
  priority <id> <p>    Set task priority
  label <id> <label>   Add label to task
  move <id> <status>   Change task status

FLAGS:
  --project=<id>       Specify project
  --status=<status>    Filter by status
  --priority=<p>       Set priority (urgent|high|medium|low)
  --bug, --feature     Set task type

EXAMPLES:
  task create "Fix login bug" --project=1 --bug --urgent
  task list --status=in_progress
  task complete TASK-456`,
  
    ai: `AI COMMAND
==========
AI-powered assistance and automation.

USAGE:
  ai [subcommand] [options]

SUBCOMMANDS:
  suggest-reviewer <id>    Suggest code reviewers
  estimate <description>   Estimate task complexity
  generate <type> <id>     Generate content (description|test|acceptance)
  optimize <area>          Suggest workflow optimizations
  analyze <target>         Analyze data and metrics
  prioritize              AI-powered task prioritization
  bottleneck              Find process bottlenecks
  predict <project>       Predict delivery dates

EXAMPLES:
  ai estimate "Implement user authentication"
  ai suggest-reviewer TASK-123
  ai generate description TASK-456
  ai analyze sprint`
  }
  
  const help = helpTexts[commandName.toLowerCase()]
  
  if (help) {
    return {
      success: true,
      output: help,
      type: 'info'
    }
  }
  
  return {
    success: false,
    output: `No help available for command: ${commandName}\nType "help" to see all commands.`,
    type: 'error'
  }
}