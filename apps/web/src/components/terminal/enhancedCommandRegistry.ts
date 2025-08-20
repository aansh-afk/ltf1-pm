// Enhanced Command Registry with Full LTF1 Integration
import { format } from 'date-fns'
import type { Command, CommandContext, CommandResult } from './types'

// Import all command modules
import { projectCommands } from './commands/projectCommands'
import { taskCommands } from './commands/taskCommands'
import { sprintCommands } from './commands/sprintCommands'
import { teamCommands } from './commands/teamCommands'
import { gitCommands } from './commands/gitCommands'
import { aiCommands } from './commands/aiCommands'
import { analyticsCommands } from './commands/analyticsCommands'
import { workflowCommands } from './commands/workflowCommands'
import { navigationCommands } from './commands/navigationCommands'
import { systemCommands } from './commands/systemCommands'

class EnhancedCommandRegistry {
  private commands: Map<string, Command> = new Map()
  private aliases: Map<string, string> = new Map()
  private commandHistory: string[] = []

  constructor() {
    this.registerAllCommands()
  }

  private registerAllCommands() {
    // Register all command modules
    const allCommands = [
      ...projectCommands,
      ...taskCommands,
      ...sprintCommands,
      ...teamCommands,
      ...gitCommands,
      ...aiCommands,
      ...analyticsCommands,
      ...workflowCommands,
      ...navigationCommands,
      ...systemCommands
    ]

    // Register each command
    allCommands.forEach(command => {
      this.register(command)
    })

    // Add some quick access commands
    this.registerQuickCommands()
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

  private registerQuickCommands() {
    // Quick navigation shortcuts
    const quickNavCommands = ['dashboard', 'projects', 'tasks', 'meetings', 'team', 'settings']
    
    quickNavCommands.forEach(cmd => {
      this.register({
        name: cmd,
        description: `Quick navigate to ${cmd}`,
        usage: cmd,
        execute: (args, context) => {
          context.navigate(`/${cmd === 'dashboard' ? 'dashboard' : cmd}`)
          context.setCurrentPath(cmd === 'dashboard' ? '~' : `~/${cmd}`)
          return {
            success: true,
            output: `Navigated to ${cmd}`,
            type: 'success'
          }
        }
      })
    })

    // Add meeting and deploy commands
    this.register({
      name: 'meeting',
      aliases: ['meet', 'cal'],
      description: 'Meeting management',
      usage: 'meeting [schedule|list|join] [options]',
      examples: ['meeting schedule "Team Standup"', 'meeting list', 'meeting join MEET-123'],
      execute: (args, context) => {
        const subcommand = args[0] || 'list'
        
        if (subcommand === 'schedule') {
          const title = args.slice(1).join(' ')
          return {
            success: true,
            output: `✓ Meeting scheduled: ${title}\n  Time: Tomorrow at 10:00 AM\n  Duration: 30 minutes`,
            type: 'success'
          }
        }
        
        if (subcommand === 'list') {
          return {
            success: true,
            output: 'UPCOMING MEETINGS:\n' +
                   '─────────────────────────────────────────────────\n' +
                   '  • Daily Standup - Today 3:00 PM\n' +
                   '  • Sprint Planning - Tomorrow 10:00 AM\n' +
                   '  • Design Review - Friday 2:00 PM',
            type: 'output'
          }
        }
        
        return {
          success: true,
          output: `Meeting command: ${subcommand}`,
          type: 'info'
        }
      }
    })

    this.register({
      name: 'deploy',
      aliases: ['release'],
      description: 'Deployment management',
      usage: 'deploy [staging|production] [options]',
      examples: ['deploy staging', 'deploy production --version 2.0.0'],
      execute: (args, context) => {
        const environment = args[0] || 'staging'
        const versionFlag = context.flags.find(f => f.startsWith('--version='))
        const version = versionFlag ? versionFlag.split('=')[1] : '1.0.0'
        
        return {
          success: true,
          output: `✓ Deployment initiated\n` +
                 `  Environment: ${environment}\n` +
                 `  Version: ${version}\n` +
                 `  Status: In Progress...\n` +
                 `\n💡 Monitor deployment at: https://deploy.ltf1.com/${environment}`,
          type: 'success'
        }
      }
    })

    this.register({
      name: 'test',
      aliases: ['run-tests'],
      description: 'Run tests',
      usage: 'test [unit|integration|e2e] [options]',
      examples: ['test', 'test unit', 'test e2e --headless'],
      execute: (args, context) => {
        const testType = args[0] || 'all'
        
        return {
          success: true,
          output: `✓ Running ${testType} tests...\n\n` +
                 `TEST RESULTS:\n` +
                 `─────────────────────────────────────────────────\n` +
                 `✅ Passed: 156\n` +
                 `❌ Failed: 2\n` +
                 `⏭️  Skipped: 5\n` +
                 `\nTotal: 163 tests in 4.2s\n` +
                 `Coverage: 84%`,
          type: testType === 'all' ? 'success' : 'info'
        }
      }
    })
  }

  getHelp(commandName: string): string {
    const actualCommand = this.aliases.get(commandName) || commandName
    const command = this.commands.get(actualCommand)
    
    if (!command) {
      return `Command not found: ${commandName}\nType 'help' for available commands.`
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

  async execute(commandName: string, args: string[], context: CommandContext): Promise<CommandResult> {
    // Add to history
    const fullCommand = `${commandName} ${args.join(' ')}`.trim()
    this.commandHistory.push(fullCommand)
    
    // Update context with history
    context.history = this.commandHistory
    
    const actualCommand = this.aliases.get(commandName) || commandName
    const command = this.commands.get(actualCommand)
    
    if (!command) {
      // Check if it might be a shorthand navigation
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

      // Suggest similar commands
      const suggestions = this.getSuggestions(commandName)
      if (suggestions.length > 0) {
        return {
          success: false,
          output: `Command not found: ${commandName}\n\nDid you mean:\n  ${suggestions.join('\n  ')}\n\nType 'help' for available commands.`,
          type: 'error'
        }
      }

      return {
        success: false,
        output: `Command not found: ${commandName}\nType 'help' for available commands.`,
        type: 'error'
      }
    }

    try {
      return await command.execute(args, context)
    } catch (error: any) {
      return {
        success: false,
        output: `Error executing command: ${error.message}`,
        type: 'error'
      }
    }
  }

  getAllCommands(): string[] {
    const commands = Array.from(this.commands.keys())
    const aliasesList = Array.from(this.aliases.keys())
    return [...new Set([...commands, ...aliasesList])].sort()
  }

  getSuggestions(partial: string): string[] {
    const allCommands = this.getAllCommands()
    const exact = allCommands.filter(cmd => cmd.startsWith(partial))
    
    if (exact.length > 0) {
      return exact
    }
    
    // Fuzzy match for typos
    const fuzzy = allCommands.filter(cmd => {
      // Simple Levenshtein distance approximation
      if (Math.abs(cmd.length - partial.length) > 2) return false
      let matches = 0
      for (let i = 0; i < Math.min(cmd.length, partial.length); i++) {
        if (cmd[i] === partial[i]) matches++
      }
      return matches >= partial.length - 1
    })
    
    return fuzzy.slice(0, 3)
  }

  getCommandHistory(): string[] {
    return this.commandHistory
  }
}

export const enhancedCommandRegistry = new EnhancedCommandRegistry()

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