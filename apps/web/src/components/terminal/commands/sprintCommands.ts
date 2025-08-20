import type { Command, CommandContext, CommandResult } from '../types'

export const sprintCommands: Command[] = [
  {
    name: 'sprint',
    aliases: ['sp'],
    description: 'Sprint and iteration management',
    usage: 'sprint [create|start|end|current|plan|burndown] [options]',
    examples: [
      'sprint create "Sprint 23"',
      'sprint start SPRINT-1',
      'sprint end --review',
      'sprint current',
      'sprint burndown'
    ],
    execute: async (args, context) => {
      const subcommand = args[0]
      
      switch (subcommand) {
        case 'create':
          return await createSprint(args.slice(1), context)
        case 'start':
          return await startSprint(args.slice(1), context)
        case 'end':
        case 'complete':
          return await endSprint(args.slice(1), context)
        case 'current':
        case 'active':
          return showCurrentSprint(context)
        case 'plan':
          return planSprint(args.slice(1), context)
        case 'burndown':
        case 'chart':
          return showBurndown(context)
        case 'velocity':
          return showVelocity(context)
        case 'retrospective':
        case 'retro':
          return showRetrospective(args.slice(1), context)
        default:
          return {
            success: false,
            output: `Unknown subcommand: ${subcommand}\nUsage: ${sprintCommands[0].usage}`,
            type: 'error'
          }
      }
    }
  }
]

async function createSprint(args: string[], context: CommandContext): Promise<CommandResult> {
  const name = args.join(' ').replace(/^["']|["']$/g, '')
  
  if (!name) {
    return {
      success: false,
      output: 'Sprint name is required\nUsage: sprint create "Sprint Name"',
      type: 'error'
    }
  }

  // Get duration from flags or use default
  const durationFlag = context.flags.find(f => f.startsWith('--duration='))
  const duration = durationFlag ? parseInt(durationFlag.split('=')[1]) : 14

  // Get project if specified
  const projectFlag = context.flags.find(f => f.startsWith('--project='))
  let project = null
  
  if (projectFlag && context.projects) {
    const projectId = projectFlag.split('=')[1]
    project = context.projects.find(p => 
      p._id === projectId || p.key === projectId.toUpperCase()
    )
  }

  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000)

  return {
    success: true,
    output: `✓ Sprint created successfully\n` +
            `  Name: ${name}\n` +
            `  Duration: ${duration} days\n` +
            `  Start: ${startDate.toLocaleDateString()}\n` +
            `  End: ${endDate.toLocaleDateString()}\n` +
            (project ? `  Project: ${project.name}\n` : '') +
            `\n💡 Use "sprint start ${name}" to activate this sprint`,
    type: 'success'
  }
}

async function startSprint(args: string[], context: CommandContext): Promise<CommandResult> {
  const sprintId = args[0]
  
  if (!sprintId) {
    return {
      success: false,
      output: 'Sprint ID or name required\nUsage: sprint start <sprint-id>',
      type: 'error'
    }
  }

  return {
    success: true,
    output: `✓ Sprint started\n` +
            `  Sprint: ${sprintId}\n` +
            `  Status: Active\n` +
            `  Team notified: Yes\n` +
            `\n💡 Use "sprint burndown" to track progress`,
    type: 'success'
  }
}

async function endSprint(args: string[], context: CommandContext): Promise<CommandResult> {
  const sprintId = args[0] || 'current'
  
  const includeReview = context.flags.includes('--review')
  const autoRollover = context.flags.includes('--rollover')

  const completedTasks = context.tasks?.filter(t => t.status === 'done').length || 0
  const incompleteTasks = context.tasks?.filter(t => t.status !== 'done' && t.status !== 'cancelled').length || 0

  let output = `✓ Sprint completed\n` +
               `  Sprint: ${sprintId}\n` +
               `  Completed Tasks: ${completedTasks}\n` +
               `  Incomplete Tasks: ${incompleteTasks}\n`

  if (autoRollover && incompleteTasks > 0) {
    output += `  Rolled Over: ${incompleteTasks} tasks to next sprint\n`
  }

  if (includeReview) {
    output += `\n📊 SPRINT REVIEW:\n` +
             `  Velocity: ${completedTasks * 3} points\n` +
             `  Completion Rate: ${Math.round((completedTasks / (completedTasks + incompleteTasks)) * 100)}%\n` +
             `  Team Performance: Good\n`
  }

  output += `\n💡 Use "sprint retrospective" to conduct team review`

  return {
    success: true,
    output,
    type: 'success'
  }
}

function showCurrentSprint(context: CommandContext): CommandResult {
  // Simulate current sprint data
  const sprint = {
    name: 'Sprint 23',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    totalPoints: 45,
    completedPoints: 28,
    tasks: context.tasks?.slice(0, 10) || []
  }

  const daysRemaining = Math.ceil((sprint.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  const progress = Math.round((sprint.completedPoints / sprint.totalPoints) * 100)

  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                      CURRENT SPRINT                           ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += `Sprint:         ${sprint.name}\n`
  output += `Start Date:     ${sprint.startDate.toLocaleDateString()}\n`
  output += `End Date:       ${sprint.endDate.toLocaleDateString()}\n`
  output += `Days Remaining: ${daysRemaining}\n\n`
  
  output += 'PROGRESS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += `Points:         ${sprint.completedPoints}/${sprint.totalPoints} completed\n`
  output += `Progress:       ${'█'.repeat(Math.floor(progress / 5))}${'░'.repeat(20 - Math.floor(progress / 5))} ${progress}%\n`
  output += `Tasks:          ${sprint.tasks.filter(t => t.status === 'done').length}/${sprint.tasks.length} completed\n\n`
  
  output += 'TOP TASKS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  sprint.tasks.slice(0, 5).forEach(task => {
    const status = task.status === 'done' ? '✅' :
                  task.status === 'in_progress' ? '🔄' : '⏳'
    output += `  ${status} ${task.title}\n`
  })

  return {
    success: true,
    output,
    type: 'info'
  }
}

function planSprint(args: string[], context: CommandContext): CommandResult {
  const capacity = 40 // Team capacity in story points
  const availableTasks = context.tasks?.filter(t => 
    t.status === 'backlog' || t.status === 'todo'
  ) || []

  // Sort by priority
  const prioritizedTasks = availableTasks.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return (priorityOrder[a.priority || 'medium'] || 2) - (priorityOrder[b.priority || 'medium'] || 2)
  })

  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                     SPRINT PLANNING                           ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += `Team Capacity:   ${capacity} story points\n`
  output += `Available Tasks: ${availableTasks.length}\n\n`
  
  output += 'RECOMMENDED SPRINT BACKLOG:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  
  let totalPoints = 0
  let taskCount = 0
  
  prioritizedTasks.forEach(task => {
    const points = task.estimate?.points || 3
    if (totalPoints + points <= capacity) {
      totalPoints += points
      taskCount++
      const priority = task.priority === 'urgent' ? '🔴' :
                      task.priority === 'high' ? '🟡' : '⚪'
      output += `  ${priority} [${points}pts] ${task.title}\n`
    }
  })
  
  output += `\nTotal: ${taskCount} tasks, ${totalPoints} points\n`
  output += `Capacity Utilization: ${Math.round((totalPoints / capacity) * 100)}%\n\n`
  
  output += '💡 RECOMMENDATIONS:\n'
  output += '  • Leave 10-20% buffer for unplanned work\n'
  output += '  • Include mix of features and bug fixes\n'
  output += '  • Consider team availability and holidays'

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showBurndown(context: CommandContext): CommandResult {
  // Simulate burndown data
  const totalPoints = 45
  const daysInSprint = 14
  const currentDay = 7
  const idealBurnRate = totalPoints / daysInSprint
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                    SPRINT BURNDOWN CHART                      ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += '  Points\n'
  output += '   45 |●\n'
  output += '   40 | ╲\n'
  output += '   35 |  ●╲\n'
  output += '   30 |   ╲●\n'
  output += '   25 |    ╲ ●╲\n'
  output += '   20 |     ╲  ●\n'
  output += '   15 |      ╲   ●\n'
  output += '   10 |       ╲    ●\n'
  output += '    5 |        ╲\n'
  output += '    0 |_________╲_______\n'
  output += '      0   3   6   9   12  14 Days\n\n'
  
  output += 'LEGEND:\n'
  output += '  ╲ Ideal Burndown\n'
  output += '  ● Actual Progress\n\n'
  
  output += 'STATISTICS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += `Sprint Day:      ${currentDay}/${daysInSprint}\n`
  output += `Points Remaining: 17\n`
  output += `Ideal Remaining:  ${Math.round(totalPoints - (idealBurnRate * currentDay))}\n`
  output += `Status:          ${17 > Math.round(totalPoints - (idealBurnRate * currentDay)) ? '⚠️ Behind Schedule' : '✅ On Track'}\n`

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showVelocity(context: CommandContext): CommandResult {
  // Simulate velocity data for last 5 sprints
  const velocityData = [
    { sprint: 'Sprint 19', completed: 38 },
    { sprint: 'Sprint 20', completed: 42 },
    { sprint: 'Sprint 21', completed: 35 },
    { sprint: 'Sprint 22', completed: 45 },
    { sprint: 'Sprint 23', completed: 40 }
  ]
  
  const average = Math.round(velocityData.reduce((sum, v) => sum + v.completed, 0) / velocityData.length)
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                      TEAM VELOCITY                            ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'LAST 5 SPRINTS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  
  velocityData.forEach(v => {
    const bar = '█'.repeat(Math.floor(v.completed / 2))
    output += `  ${v.sprint.padEnd(12)} ${bar} ${v.completed} pts\n`
  })
  
  output += '\nSTATISTICS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += `Average Velocity: ${average} points/sprint\n`
  output += `Trend:           Stable\n`
  output += `Predictability:  85%\n\n`
  
  output += '💡 INSIGHTS:\n'
  output += '  • Team velocity is consistent\n'
  output += '  • Consider increasing capacity\n'
  output += '  • Good predictability for planning'

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showRetrospective(args: string[], context: CommandContext): CommandResult {
  const sprintId = args[0] || 'Sprint 23'
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                   SPRINT RETROSPECTIVE                        ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  output += `Sprint: ${sprintId}\n\n`
  
  output += '😊 WHAT WENT WELL:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '  • Completed all critical features on time\n'
  output += '  • Good collaboration between teams\n'
  output += '  • Improved test coverage to 85%\n'
  output += '  • Quick bug resolution turnaround\n\n'
  
  output += '😟 WHAT COULD BE IMPROVED:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '  • Code review process took longer than expected\n'
  output += '  • Some requirements were unclear\n'
  output += '  • Testing environment had downtime\n\n'
  
  output += '💡 ACTION ITEMS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '  1. Implement automated code review checks\n'
  output += '  2. Schedule requirements review sessions\n'
  output += '  3. Set up redundant test environments\n'
  output += '  4. Create sprint planning checklist\n\n'
  
  output += 'TEAM HEALTH CHECK:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '  Morale:        ████████░░ 8/10\n'
  output += '  Collaboration: █████████░ 9/10\n'
  output += '  Productivity:  ███████░░░ 7/10\n'
  output += '  Quality:       ████████░░ 8/10'

  return {
    success: true,
    output,
    type: 'info'
  }
}