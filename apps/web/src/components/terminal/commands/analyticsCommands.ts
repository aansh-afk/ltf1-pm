import type { Command, CommandContext, CommandResult } from '../types'

export const analyticsCommands: Command[] = [
  {
    name: 'analytics',
    aliases: ['stats', 'metrics'],
    description: 'Analytics and reporting commands',
    usage: 'analytics [sprint|velocity|burndown|performance|quality] [options]',
    examples: [
      'analytics sprint',
      'analytics velocity --last 5',
      'analytics performance',
      'analytics quality'
    ],
    execute: async (args, context) => {
      const subcommand = args[0] || 'overview'
      
      switch (subcommand) {
        case 'overview':
          return showOverview(context)
        case 'sprint':
          return showSprintAnalytics(context)
        case 'velocity':
          return showVelocityAnalytics(context)
        case 'burndown':
          return showBurndownAnalytics(context)
        case 'performance':
          return showPerformanceMetrics(context)
        case 'quality':
          return showQualityMetrics(context)
        case 'team':
          return showTeamAnalytics(context)
        default:
          return showOverview(context)
      }
    }
  }
]

function showOverview(context: CommandContext): CommandResult {
  const tasks = context.tasks || []
  const projects = context.projects || []
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                    ANALYTICS OVERVIEW                         ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'KEY METRICS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += `Total Projects:     ${projects.length}\n`
  output += `Active Projects:    ${projects.filter(p => p.status === 'active').length}\n`
  output += `Total Tasks:        ${tasks.length}\n`
  output += `Completed Tasks:    ${tasks.filter(t => t.status === 'done').length}\n`
  output += `In Progress:        ${tasks.filter(t => t.status === 'in_progress').length}\n`
  output += `Completion Rate:    ${tasks.length ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%\n\n`
  
  output += 'TASK DISTRIBUTION:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  const bugCount = tasks.filter(t => t.type === 'bug').length
  const featureCount = tasks.filter(t => t.type === 'feature').length
  const improvementCount = tasks.filter(t => t.type === 'improvement').length
  
  output += `Features:    ${'█'.repeat(Math.floor(featureCount / 2))} ${featureCount}\n`
  output += `Bugs:        ${'█'.repeat(Math.floor(bugCount / 2))} ${bugCount}\n`
  output += `Improvements: ${'█'.repeat(Math.floor(improvementCount / 2))} ${improvementCount}\n\n`
  
  output += 'PRIORITY BREAKDOWN:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += `🔴 Urgent:  ${tasks.filter(t => t.priority === 'urgent').length}\n`
  output += `🟡 High:    ${tasks.filter(t => t.priority === 'high').length}\n`
  output += `⚪ Medium:  ${tasks.filter(t => t.priority === 'medium').length}\n`
  output += `🔵 Low:     ${tasks.filter(t => t.priority === 'low').length}\n`

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showSprintAnalytics(context: CommandContext): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                    SPRINT ANALYTICS                           ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'CURRENT SPRINT (Sprint 23):\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Day:             7 of 14\n'
  output += 'Velocity:        45 points\n'
  output += 'Completed:       28 points (62%)\n'
  output += 'Remaining:       17 points\n'
  output += 'At Risk:         2 tasks\n'
  output += 'Blockers:        1\n\n'
  
  output += 'DAILY PROGRESS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Mon: ████████ 8 pts\n'
  output += 'Tue: ██████ 6 pts\n'
  output += 'Wed: ███████ 7 pts\n'
  output += 'Thu: ████ 4 pts\n'
  output += 'Fri: ███ 3 pts\n'
  output += 'Today: Planning...\n\n'
  
  output += 'SPRINT HEALTH:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Scope Stability:    ████████░░ 85%\n'
  output += 'Team Velocity:      ███████░░░ 70%\n'
  output += 'Quality:           █████████░ 90%\n'
  output += 'Predictability:    ████████░░ 80%\n'

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showVelocityAnalytics(context: CommandContext): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                   VELOCITY ANALYTICS                          ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'VELOCITY TREND (Last 8 Sprints):\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '  50 |        ╱╲    \n'
  output += '  45 |    ╱╲╱  ╲   ╱\n'
  output += '  40 | ╱╲╱      ╲╱ \n'
  output += '  35 |╱            \n'
  output += '  30 |_____________\n'
  output += '     S16 S17 S18 S19 S20 S21 S22 S23\n\n'
  
  output += 'STATISTICS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Average Velocity:   42 points/sprint\n'
  output += 'Highest:           48 points (Sprint 20)\n'
  output += 'Lowest:            35 points (Sprint 17)\n'
  output += 'Standard Dev:      ±5.2 points\n'
  output += 'Trend:             📈 Increasing\n\n'
  
  output += 'PREDICTABILITY:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Commitment Accuracy: 87%\n'
  output += 'Delivery Rate:      92%\n'
  output += 'Scope Creep:        8%\n'

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showBurndownAnalytics(context: CommandContext): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                   BURNDOWN ANALYTICS                          ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'SPRINT BURNDOWN:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '  45 |●\n'
  output += '  40 | ╲●\n'
  output += '  35 |  ╲ ●\n'
  output += '  30 |   ╲  ●\n'
  output += '  25 |    ╲   ●\n'
  output += '  20 |     ╲    ●←(You are here)\n'
  output += '  15 |      ╲\n'
  output += '  10 |       ╲\n'
  output += '   5 |        ╲\n'
  output += '   0 |_________╲___\n'
  output += '     0  2  4  6  8  10 12 14 Days\n\n'
  
  output += 'BURNDOWN METRICS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Points Remaining:   17\n'
  output += 'Ideal Remaining:    22.5\n'
  output += 'Variance:          +5.5 points ahead\n'
  output += 'Projected Finish:   Day 13 (1 day early)\n'
  output += 'Confidence:        85%\n'

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showPerformanceMetrics(context: CommandContext): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                  PERFORMANCE METRICS                          ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'CYCLE TIME:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Average:           3.2 days\n'
  output += 'Median:            2.5 days\n'
  output += 'Best:              0.5 days\n'
  output += 'Worst:             8 days\n\n'
  
  output += 'LEAD TIME BY TYPE:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '🐛 Bugs:           1.5 days avg\n'
  output += '✨ Features:       5.2 days avg\n'
  output += '🔧 Improvements:   3.8 days avg\n'
  output += '📋 Tasks:          2.1 days avg\n\n'
  
  output += 'THROUGHPUT:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'This Week:         12 items\n'
  output += 'Last Week:         15 items\n'
  output += 'Monthly Avg:       48 items\n'
  output += 'Trend:             Stable\n\n'
  
  output += 'EFFICIENCY METRICS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'First Time Pass:    ████████░░ 82%\n'
  output += 'Rework Rate:        ██░░░░░░░░ 18%\n'
  output += 'Automation:         ███████░░░ 65%\n'
  output += 'Code Review Time:   1.5 days avg\n'

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showQualityMetrics(context: CommandContext): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                    QUALITY METRICS                            ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'CODE QUALITY:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Test Coverage:      ████████░░ 84%\n'
  output += 'Code Complexity:    Low (avg 3.2)\n'
  output += 'Tech Debt Ratio:    ██░░░░░░░░ 15%\n'
  output += 'Duplication:        █░░░░░░░░░ 8%\n\n'
  
  output += 'BUG METRICS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Open Bugs:         23\n'
  output += 'Critical:          2\n'
  output += 'High Priority:     5\n'
  output += 'Bug Rate:          0.12 per story\n'
  output += 'Escape Rate:       3%\n'
  output += 'MTTR:              4.5 hours\n\n'
  
  output += 'QUALITY TRENDS:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Defect Density:    📉 Decreasing\n'
  output += 'Code Coverage:     📈 Increasing\n'
  output += 'Review Quality:    📊 Stable\n'
  output += 'Customer Issues:   📉 Decreasing\n\n'
  
  output += 'QUALITY GATES:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '✅ Unit Tests:     Passing (1,234 tests)\n'
  output += '✅ Integration:    Passing (89 tests)\n'
  output += '✅ E2E Tests:      Passing (45 scenarios)\n'
  output += '⚠️  Performance:   Warning (2 slow endpoints)\n'

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showTeamAnalytics(context: CommandContext): CommandResult {
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                     TEAM ANALYTICS                            ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'PRODUCTIVITY:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'John Doe:      ████████░░ 12 tasks/week\n'
  output += 'Jane Smith:    ██████░░░░ 9 tasks/week\n'
  output += 'Bob Wilson:    ███████░░░ 10 tasks/week\n'
  output += 'You:           █████████░ 14 tasks/week\n\n'
  
  output += 'COLLABORATION:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Code Reviews Given:    45 this month\n'
  output += 'Reviews Received:      38 this month\n'
  output += 'Pair Programming:      12 hours/week\n'
  output += 'Knowledge Sharing:     8 sessions\n\n'
  
  output += 'TEAM HEALTH:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += 'Happiness Score:    ████████░░ 8.2/10\n'
  output += 'Work-Life Balance:  ███████░░░ 7.5/10\n'
  output += 'Team Cohesion:      █████████░ 9.0/10\n'
  output += 'Growth & Learning:  ████████░░ 8.0/10\n'

  return {
    success: true,
    output,
    type: 'info'
  }
}