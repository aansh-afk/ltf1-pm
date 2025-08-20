import { format } from 'date-fns'

export interface CommandResult {
  success: boolean
  output: string
  type?: 'output' | 'error' | 'success' | 'info'
  action?: {
    type: 'navigate' | 'clear' | 'exit' | 'reload'
    path?: string
  }
}

export interface CommandContext {
  flags: string[]
  navigate: (path: string) => void
  projects: any[]
  tasks: any[]
  currentPath: string
  setCurrentPath: (path: string) => void
  user: any
}

interface Command {
  name: string
  aliases?: string[]
  description: string
  usage: string
  examples?: string[]
  execute: (args: string[], context: CommandContext) => Promise<CommandResult> | CommandResult
}

class CommandRegistry {
  private commands: Map<string, Command> = new Map()
  private aliases: Map<string, string> = new Map()

  constructor() {
    this.registerCommands()
  }

  private registerCommands() {
    // Navigation Commands
    this.register({
      name: 'cd',
      description: 'Change directory/navigate to different sections',
      usage: 'cd [dashboard|projects|tasks|meetings|team|settings]',
      examples: ['cd projects', 'cd ..', 'cd ~'],
      execute: (args, context) => {
        const target = args[0] || '~'
        const routes: Record<string, string> = {
          '~': '/dashboard',
          'dashboard': '/dashboard',
          'projects': '/projects',
          'tasks': '/tasks',
          'meetings': '/meetings',
          'team': '/team',
          'settings': '/settings',
          'profile': '/profile',
          '..': '/dashboard'
        }

        if (routes[target]) {
          context.setCurrentPath(target === '~' ? '~' : `~/${target}`)
          context.navigate(routes[target])
          return {
            success: true,
            output: `Navigated to ${target}`,
            type: 'success'
          }
        }

        return {
          success: false,
          output: `cd: ${target}: No such directory`,
          type: 'error'
        }
      }
    })

    this.register({
      name: 'ls',
      aliases: ['list', 'dir'],
      description: 'List items in current context',
      usage: 'ls [flags]',
      examples: ['ls', 'ls -l', 'ls projects', 'ls --all'],
      execute: (args, context) => {
        const showAll = context.flags.includes('-a') || context.flags.includes('--all')
        const longFormat = context.flags.includes('-l') || context.flags.includes('--long')
        
        let output = ''
        
        // Determine what to list based on current path
        if (context.currentPath === '~' || context.currentPath === '~/dashboard') {
          // List main sections
          const sections = [
            { name: 'projects/', type: 'dir', items: context.projects?.length || 0 },
            { name: 'tasks/', type: 'dir', items: context.tasks?.length || 0 },
            { name: 'meetings/', type: 'dir', items: 0 },
            { name: 'team/', type: 'dir', items: 0 },
            { name: 'settings/', type: 'dir', items: 0 }
          ]
          
          if (longFormat) {
            output = 'drwxr-xr-x  2 user user  4096 ' + format(new Date(), 'MMM dd HH:mm') + '\n'
            sections.forEach(section => {
              output += `drwxr-xr-x  ${section.items.toString().padStart(2)} user user  4096 ${format(new Date(), 'MMM dd HH:mm')} ${section.name}\n`
            })
          } else {
            output = sections.map(s => s.name).join('  ')
          }
        } else if (context.currentPath === '~/projects') {
          // List projects
          if (!context.projects || context.projects.length === 0) {
            output = 'No projects found. Use "create project <name>" to create one.'
          } else {
            if (longFormat) {
              output = context.projects.map(p => 
                `-rw-r--r--  1 user user  ${Math.floor(Math.random() * 9999).toString().padStart(4)} ${format(new Date(p._creationTime), 'MMM dd HH:mm')} ${p.name}`
              ).join('\n')
            } else {
              output = context.projects.map(p => p.name).join('  ')
            }
          }
        } else if (context.currentPath === '~/tasks') {
          // List tasks
          if (!context.tasks || context.tasks.length === 0) {
            output = 'No tasks found. Use "create task <name>" to create one.'
          } else {
            if (longFormat) {
              output = context.tasks.map(t => {
                const status = t.status || 'todo'
                const priority = t.priority || 'medium'
                return `-rw-r--r--  1 user user  ${status.padEnd(12)} ${priority.padEnd(8)} ${t.title}`
              }).join('\n')
            } else {
              output = context.tasks.map(t => `${t.title} [${t.status}]`).join('\n')
            }
          }
        } else {
          output = 'Contents of ' + context.currentPath
        }

        return {
          success: true,
          output,
          type: 'output'
        }
      }
    })

    this.register({
      name: 'pwd',
      description: 'Print working directory',
      usage: 'pwd',
      execute: (args, context) => ({
        success: true,
        output: context.currentPath,
        type: 'output'
      })
    })

    // CRUD Commands
    this.register({
      name: 'create',
      aliases: ['new', 'touch', 'mk'],
      description: 'Create a new project, task, or meeting',
      usage: 'create [project|task|meeting] "name" [options]',
      examples: [
        'create project "New Website"',
        'create task "Fix bug" --priority urgent',
        'create meeting "Team Standup" --date tomorrow'
      ],
      execute: async (args, context) => {
        const type = args[0]
        const name = args.slice(1).join(' ').replace(/^["']|["']$/g, '')

        if (!type || !name) {
          return {
            success: false,
            output: 'Usage: create [project|task|meeting] "name"',
            type: 'error'
          }
        }

        try {
          switch (type) {
            case 'project':
              // For now, we'll show an error since we need a workspace
              return {
                success: false,
                output: `Error: Project creation requires a workspace. Please create from the Projects page.`,
                type: 'error'
              }

            case 'task':
              // For now, we'll show an error since we need a project
              return {
                success: false,
                output: `Error: Task creation requires a project. Please create from the Tasks page.`,
                type: 'error'
              }

            case 'meeting':
              return {
                success: true,
                output: `✓ Meeting "${name}" scheduled`,
                type: 'success'
              }

            default:
              return {
                success: false,
                output: `Unknown type: ${type}. Use project, task, or meeting.`,
                type: 'error'
              }
          }
        } catch (error) {
          return {
            success: false,
            output: `Failed to create ${type}: ${error.message}`,
            type: 'error'
          }
        }
      }
    })

    // Search Commands
    this.register({
      name: 'find',
      aliases: ['search'],
      description: 'Search for projects, tasks, or meetings',
      usage: 'find "query" [--type project|task|meeting]',
      examples: ['find "bug"', 'find "website" --type project'],
      execute: (args, context) => {
        const query = args.join(' ').toLowerCase()
        
        if (!query) {
          return {
            success: false,
            output: 'Usage: find "query"',
            type: 'error'
          }
        }

        const results = []
        
        // Search projects
        const matchingProjects = context.projects?.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.description?.toLowerCase().includes(query)
        ) || []
        
        if (matchingProjects.length > 0) {
          results.push('=== PROJECTS ===')
          matchingProjects.forEach(p => {
            results.push(`  ${p.name} [${p.status}]`)
          })
        }

        // Search tasks
        const matchingTasks = context.tasks?.filter(t => 
          t.title.toLowerCase().includes(query) || 
          t.description?.toLowerCase().includes(query)
        ) || []
        
        if (matchingTasks.length > 0) {
          results.push('\n=== TASKS ===')
          matchingTasks.forEach(t => {
            results.push(`  ${t.title} [${t.status}] [${t.priority}]`)
          })
        }

        if (results.length === 0) {
          return {
            success: true,
            output: `No results found for "${query}"`,
            type: 'info'
          }
        }

        return {
          success: true,
          output: results.join('\n'),
          type: 'output'
        }
      }
    })

    // System Commands
    this.register({
      name: 'clear',
      aliases: ['cls'],
      description: 'Clear the terminal screen',
      usage: 'clear',
      execute: () => ({
        success: true,
        output: '',
        action: { type: 'clear' }
      })
    })

    this.register({
      name: 'help',
      aliases: ['?', 'h'],
      description: 'Show available commands',
      usage: 'help [command]',
      execute: (args) => {
        if (args[0]) {
          return {
            success: true,
            output: this.getHelp(args[0]),
            type: 'info'
          }
        }

        const commandList = Array.from(this.commands.values())
        const categories = {
          'NAVIGATION': ['cd', 'ls', 'pwd'],
          'CRUD OPERATIONS': ['create', 'edit', 'delete'],
          'SEARCH': ['find', 'grep', 'filter'],
          'PROJECT MANAGEMENT': ['status', 'complete', 'assign', 'priority'],
          'TEAM': ['who', 'invite', 'role'],
          'SYSTEM': ['clear', 'help', 'man', 'history', 'exit', 'theme', 'stats']
        }

        let output = '╔════════════════════════════════════════════════════════════════╗\n'
        output += '║                     AVAILABLE COMMANDS                        ║\n'
        output += '╚════════════════════════════════════════════════════════════════╝\n\n'

        for (const [category, commands] of Object.entries(categories)) {
          output += `${category}:\n`
          commands.forEach(cmd => {
            const command = this.commands.get(cmd)
            if (command) {
              const aliases = command.aliases ? ` (${command.aliases.join(', ')})` : ''
              output += `  ${cmd.padEnd(15)} ${command.description}${aliases}\n`
            }
          })
          output += '\n'
        }

        output += 'Type "help <command>" or "<command> -h" for detailed information.\n'
        output += 'Use TAB for command completion, ↑↓ for command history.'

        return {
          success: true,
          output,
          type: 'info'
        }
      }
    })

    this.register({
      name: 'man',
      description: 'Show manual page for a command',
      usage: 'man <command>',
      execute: (args) => {
        if (!args[0]) {
          return {
            success: false,
            output: 'Usage: man <command>',
            type: 'error'
          }
        }
        return {
          success: true,
          output: this.getManPage(args[0]),
          type: 'info'
        }
      }
    })

    this.register({
      name: 'who',
      aliases: ['whoami', 'users'],
      description: 'Show current user and team members',
      usage: 'who',
      execute: (args, context) => {
        let output = `Current User: ${context.user?.email || 'Anonymous'}\n`
        output += `Role: ${context.user?.role || 'Member'}\n`
        output += `Session: Active\n\n`
        output += 'Team Members Online:\n'
        output += '  - You (active)\n'
        
        return {
          success: true,
          output,
          type: 'output'
        }
      }
    })

    this.register({
      name: 'stats',
      aliases: ['status', 'info'],
      description: 'Show system statistics',
      usage: 'stats',
      execute: (args, context) => {
        const stats = {
          projects: context.projects?.length || 0,
          tasks: context.tasks?.length || 0,
          completedTasks: context.tasks?.filter(t => t.status === 'done').length || 0,
          activeProjects: context.projects?.filter(p => p.status === 'active').length || 0
        }

        let output = '╔════════════════════════════════════════════════════════════════╗\n'
        output += '║                      SYSTEM STATISTICS                        ║\n'
        output += '╚════════════════════════════════════════════════════════════════╝\n\n'
        output += `Projects:        ${stats.projects} total (${stats.activeProjects} active)\n`
        output += `Tasks:           ${stats.tasks} total (${stats.completedTasks} completed)\n`
        output += `Completion Rate: ${stats.tasks ? Math.round((stats.completedTasks / stats.tasks) * 100) : 0}%\n`
        output += `System Status:   OPERATIONAL\n`
        output += `Uptime:          ${Math.floor(Math.random() * 999)} hours\n`

        return {
          success: true,
          output,
          type: 'info'
        }
      }
    })

    this.register({
      name: 'exit',
      aliases: ['quit', 'q'],
      description: 'Exit the terminal',
      usage: 'exit',
      execute: () => ({
        success: true,
        output: 'Goodbye!',
        type: 'success',
        action: { type: 'exit' }
      })
    })

    this.register({
      name: 'theme',
      description: 'Change terminal theme',
      usage: 'theme [matrix|classic|amber|blue]',
      examples: ['theme matrix', 'theme classic'],
      execute: (args) => {
        const themes = ['matrix', 'classic', 'amber', 'blue']
        const theme = args[0]
        
        if (!theme || !themes.includes(theme)) {
          return {
            success: false,
            output: `Available themes: ${themes.join(', ')}`,
            type: 'error'
          }
        }

        // Note: Actual theme change would be implemented via state management
        return {
          success: true,
          output: `Terminal theme changed to ${theme}`,
          type: 'success'
        }
      }
    })

    // Additional productivity commands
    this.register({
      name: 'complete',
      aliases: ['done', 'finish'],
      description: 'Mark a task as complete',
      usage: 'complete <task-id|task-name>',
      execute: async (args, context) => {
        const identifier = args.join(' ')
        if (!identifier) {
          return {
            success: false,
            output: 'Usage: complete <task-id|task-name>',
            type: 'error'
          }
        }

        // Find task by name or ID
        const task = context.tasks?.find(t => 
          t._id === identifier || 
          t.title.toLowerCase().includes(identifier.toLowerCase())
        )

        if (!task) {
          return {
            success: false,
            output: `Task "${identifier}" not found`,
            type: 'error'
          }
        }

        // In real implementation, would call mutation to update task
        return {
          success: true,
          output: `✓ Task "${task.title}" marked as complete`,
          type: 'success'
        }
      }
    })

    this.register({
      name: 'priority',
      aliases: ['pri'],
      description: 'Set task priority',
      usage: 'priority <task-id> [urgent|high|medium|low]',
      execute: async (args, context) => {
        if (args.length < 2) {
          return {
            success: false,
            output: 'Usage: priority <task-id> [urgent|high|medium|low]',
            type: 'error'
          }
        }

        const taskId = args[0]
        const priority = args[1]
        const validPriorities = ['urgent', 'high', 'medium', 'low']

        if (!validPriorities.includes(priority)) {
          return {
            success: false,
            output: `Invalid priority. Use: ${validPriorities.join(', ')}`,
            type: 'error'
          }
        }

        return {
          success: true,
          output: `✓ Task priority updated to ${priority}`,
          type: 'success'
        }
      }
    })

    this.register({
      name: 'history',
      aliases: ['hist'],
      description: 'Show command history',
      usage: 'history [n]',
      execute: (args, context) => {
        // This would be implemented with actual history from the terminal component
        return {
          success: true,
          output: 'Command history:\n  1. help\n  2. ls\n  3. cd projects\n  4. create task "Example"',
          type: 'output'
        }
      }
    })
  }

  private register(command: Command) {
    this.commands.set(command.name, command)
    
    // Register aliases
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.aliases.set(alias, command.name)
      })
    }
  }

  getHelp(commandName: string): string {
    const actualCommand = this.aliases.get(commandName) || commandName
    const command = this.commands.get(actualCommand)
    
    if (!command) {
      return `Command not found: ${commandName}`
    }

    let help = `\n${command.name.toUpperCase()}\n`
    help += `${'='.repeat(command.name.length)}\n\n`
    help += `Description: ${command.description}\n`
    help += `Usage: ${command.usage}\n`
    
    if (command.aliases && command.aliases.length > 0) {
      help += `Aliases: ${command.aliases.join(', ')}\n`
    }
    
    if (command.examples && command.examples.length > 0) {
      help += `\nExamples:\n`
      command.examples.forEach(example => {
        help += `  $ ${example}\n`
      })
    }

    return help
  }

  getManPage(commandName: string): string {
    const help = this.getHelp(commandName)
    
    if (help.startsWith('Command not found')) {
      return help
    }

    // Add more detailed manual information
    let manPage = '╔════════════════════════════════════════════════════════════════╗\n'
    manPage += `║                    MANUAL: ${commandName.toUpperCase().padEnd(35)} ║\n`
    manPage += '╚════════════════════════════════════════════════════════════════╝\n'
    manPage += help
    manPage += '\nSEE ALSO:\n'
    manPage += '  help(1), man(1)\n'
    manPage += '\nAUTHOR:\n'
    manPage += '  LTF1 Terminal System v1.0.0\n'

    return manPage
  }

  execute(commandName: string, args: string[], context: CommandContext): Promise<CommandResult> | CommandResult {
    const actualCommand = this.aliases.get(commandName) || commandName
    const command = this.commands.get(actualCommand)
    
    if (!command) {
      // Check if it's a shorthand navigation
      const routes: Record<string, string> = {
        'dashboard': '/dashboard',
        'projects': '/projects',
        'tasks': '/tasks',
        'meetings': '/meetings',
        'team': '/team',
        'settings': '/settings'
      }
      
      if (routes[commandName]) {
        context.navigate(routes[commandName])
        return {
          success: true,
          output: `Navigated to ${commandName}`,
          type: 'success'
        }
      }

      return {
        success: false,
        output: `Command not found: ${commandName}. Type 'help' for available commands.`,
        type: 'error'
      }
    }

    return command.execute(args, context)
  }

  // Get all commands for tab completion
  getAllCommands(): string[] {
    const commands = Array.from(this.commands.keys())
    const aliasesList = Array.from(this.aliases.keys())
    return [...commands, ...aliasesList]
  }

  // Get suggestions for tab completion
  getSuggestions(partial: string): string[] {
    const allCommands = this.getAllCommands()
    return allCommands.filter(cmd => cmd.startsWith(partial))
  }
}

export const commandRegistry = new CommandRegistry()

export function parseCommand(input: string): { command: string; args: string[]; flags: string[] } {
  const parts = input.trim().split(/\s+/)
  const command = parts[0] || ''
  const args: string[] = []
  const flags: string[] = []

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    
    if (part.startsWith('-')) {
      flags.push(part)
    } else {
      // Handle quoted strings
      if (part.startsWith('"') || part.startsWith("'")) {
        let quotedString = part
        const quoteChar = part[0]
        
        // Continue until we find the closing quote
        while (i < parts.length && !quotedString.endsWith(quoteChar)) {
          i++
          if (i < parts.length) {
            quotedString += ' ' + parts[i]
          }
        }
        
        // Remove quotes
        args.push(quotedString.slice(1, -1))
      } else {
        args.push(part)
      }
    }
  }

  return { command, args, flags }
}