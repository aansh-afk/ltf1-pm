import { format } from 'date-fns'
import type { Command, CommandContext, CommandResult } from '../types'

export const navigationCommands: Command[] = [
  {
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
  },

  {
    name: 'ls',
    aliases: ['list', 'dir'],
    description: 'List items in current context',
    usage: 'ls [flags]',
    examples: ['ls', 'ls -l', 'ls projects', 'ls --all'],
    execute: (args, context) => {
      const showAll = context.flags.includes('-a') || context.flags.includes('--all')
      const longFormat = context.flags.includes('-l') || context.flags.includes('--long')
      const target = args[0]
      
      let output = ''
      
      // Determine what to list based on current path or target
      if (!target && (context.currentPath === '~' || context.currentPath === '~/dashboard')) {
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
      } else if (target === 'projects' || context.currentPath === '~/projects') {
        // List projects
        if (!context.projects || context.projects.length === 0) {
          output = 'No projects found. Use "project create <name>" to create one.'
        } else {
          if (longFormat) {
            output = context.projects.map(p => 
              `-rw-r--r--  1 user user  ${Math.floor(Math.random() * 9999).toString().padStart(4)} ${format(new Date(p._creationTime || Date.now()), 'MMM dd HH:mm')} ${p.name}`
            ).join('\n')
          } else {
            output = context.projects.map(p => `[${p.key}] ${p.name}`).join('  ')
          }
        }
      } else if (target === 'tasks' || context.currentPath === '~/tasks') {
        // List tasks
        if (!context.tasks || context.tasks.length === 0) {
          output = 'No tasks found. Use "task create <name>" to create one.'
        } else {
          if (longFormat) {
            output = context.tasks.map(t => {
              const status = t.status || 'todo'
              const priority = t.priority || 'medium'
              return `-rw-r--r--  1 user user  ${status.padEnd(12)} ${priority.padEnd(8)} ${t.title}`
            }).join('\n')
          } else {
            output = context.tasks.map(t => `[#${t.number || t._id.slice(-4)}] ${t.title}`).join('\n')
          }
        }
      } else {
        output = 'Contents of ' + (target || context.currentPath)
      }

      return {
        success: true,
        output,
        type: 'output'
      }
    }
  },

  {
    name: 'find',
    aliases: ['search'],
    description: 'Search for projects, tasks, or other items',
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

      const typeFlag = context.flags.find(f => f.startsWith('--type='))
      const searchType = typeFlag ? typeFlag.split('=')[1] : 'all'

      const results = []
      
      // Search projects
      if (searchType === 'all' || searchType === 'project') {
        const matchingProjects = context.projects?.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.description?.toLowerCase().includes(query) ||
          p.key?.toLowerCase().includes(query)
        ) || []
        
        if (matchingProjects.length > 0) {
          results.push('╔══ PROJECTS ══════════════════════════════════════════════════╗')
          matchingProjects.forEach(p => {
            results.push(`  [${p.key}] ${p.name} - ${p.status || 'active'}`)
          })
        }
      }

      // Search tasks
      if (searchType === 'all' || searchType === 'task') {
        const matchingTasks = context.tasks?.filter(t => 
          t.title.toLowerCase().includes(query) || 
          t.description?.toLowerCase().includes(query)
        ) || []
        
        if (matchingTasks.length > 0) {
          if (results.length > 0) results.push('')
          results.push('╔══ TASKS ═════════════════════════════════════════════════════╗')
          matchingTasks.forEach(t => {
            const priority = t.priority === 'urgent' ? '🔴' :
                           t.priority === 'high' ? '🟡' : '⚪'
            results.push(`  ${priority} [#${t.number || t._id.slice(-4)}] ${t.title} - ${t.status || 'backlog'}`)
          })
        }
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
  },

  {
    name: 'grep',
    description: 'Search within content',
    usage: 'grep "pattern" [file|context]',
    examples: ['grep "bug" tasks', 'grep "TODO"'],
    execute: (args, context) => {
      const pattern = args[0]
      const target = args[1] || 'all'
      
      if (!pattern) {
        return {
          success: false,
          output: 'Usage: grep "pattern" [target]',
          type: 'error'
        }
      }

      const results = []
      const regex = new RegExp(pattern, 'i')

      if (target === 'tasks' || target === 'all') {
        const matches = context.tasks?.filter(t => 
          regex.test(t.title) || regex.test(t.description || '')
        ) || []
        
        matches.forEach(task => {
          results.push(`tasks/${task._id}: ${task.title}`)
        })
      }

      if (target === 'projects' || target === 'all') {
        const matches = context.projects?.filter(p => 
          regex.test(p.name) || regex.test(p.description || '')
        ) || []
        
        matches.forEach(project => {
          results.push(`projects/${project._id}: ${project.name}`)
        })
      }

      if (results.length === 0) {
        return {
          success: true,
          output: `No matches found for pattern "${pattern}"`,
          type: 'info'
        }
      }

      return {
        success: true,
        output: results.join('\n'),
        type: 'output'
      }
    }
  },

  {
    name: 'open',
    aliases: ['goto', 'nav'],
    description: 'Open specific item by ID',
    usage: 'open <item-id>',
    examples: ['open PROJ-123', 'open TASK-456'],
    execute: (args, context) => {
      const itemId = args[0]
      
      if (!itemId) {
        return {
          success: false,
          output: 'Usage: open <item-id>',
          type: 'error'
        }
      }

      // Try to find as project
      const project = context.projects?.find(p => 
        p._id === itemId || p.key === itemId.toUpperCase()
      )
      
      if (project) {
        context.navigate(`/projects/${project._id}`)
        return {
          success: true,
          output: `Opening project: ${project.name}`,
          type: 'success'
        }
      }

      // Try to find as task
      const task = context.tasks?.find(t => 
        t._id === itemId || 
        t.number?.toString() === itemId.replace('#', '')
      )
      
      if (task) {
        // Navigate to task detail view
        return {
          success: true,
          output: `Opening task: ${task.title}`,
          type: 'success'
        }
      }

      return {
        success: false,
        output: `Item "${itemId}" not found`,
        type: 'error'
      }
    }
  }
]