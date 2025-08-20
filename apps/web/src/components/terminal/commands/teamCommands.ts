import type { Command, CommandContext, CommandResult } from '../types'

export const teamCommands: Command[] = [
  {
    name: 'team',
    aliases: ['tm', 'members'],
    description: 'Team management commands',
    usage: 'team [invite|remove|role|list|capacity] [options]',
    examples: [
      'team invite user@example.com',
      'team role user@example.com lead',
      'team list --detailed',
      'team capacity'
    ],
    execute: async (args, context) => {
      const subcommand = args[0]
      
      switch (subcommand) {
        case 'invite':
        case 'add':
          return await inviteTeamMember(args.slice(1), context)
        case 'remove':
        case 'kick':
          return await removeTeamMember(args.slice(1), context)
        case 'role':
        case 'promote':
          return await setMemberRole(args.slice(1), context)
        case 'list':
        case 'ls':
          return listTeamMembers(context)
        case 'capacity':
          return showTeamCapacity(context)
        case 'availability':
          return showAvailability(context)
        default:
          return {
            success: false,
            output: `Unknown subcommand: ${subcommand}\nUsage: ${teamCommands[0].usage}`,
            type: 'error'
          }
      }
    }
  }
]

async function inviteTeamMember(args: string[], context: CommandContext): Promise<CommandResult> {
  const email = args[0]
  
  if (!email || !email.includes('@')) {
    return {
      success: false,
      output: 'Valid email required\nUsage: team invite <email>',
      type: 'error'
    }
  }

  const roleFlag = context.flags.find(f => f.startsWith('--role='))
  const role = roleFlag ? roleFlag.split('=')[1] : 'member'

  return {
    success: true,
    output: `✓ Invitation sent successfully\n` +
            `  Email: ${email}\n` +
            `  Role: ${role}\n` +
            `  Status: Pending\n` +
            `\n💡 The user will receive an email invitation to join the team`,
    type: 'success'
  }
}

async function removeTeamMember(args: string[], context: CommandContext): Promise<CommandResult> {
  const identifier = args[0]
  
  if (!identifier) {
    return {
      success: false,
      output: 'User identifier required\nUsage: team remove <email|user-id>',
      type: 'error'
    }
  }

  if (!context.flags.includes('--force') && !context.flags.includes('-f')) {
    return {
      success: false,
      output: `⚠️  This will remove ${identifier} from the team\n\nTo confirm, use: team remove ${identifier} --force`,
      type: 'warning'
    }
  }

  return {
    success: true,
    output: `✓ Team member removed\n  User: ${identifier}`,
    type: 'success'
  }
}

async function setMemberRole(args: string[], context: CommandContext): Promise<CommandResult> {
  const identifier = args[0]
  const role = args[1]
  
  if (!identifier || !role) {
    return {
      success: false,
      output: 'Usage: team role <email|user-id> [admin|lead|member|viewer]',
      type: 'error'
    }
  }

  const validRoles = ['admin', 'lead', 'member', 'viewer']
  if (!validRoles.includes(role)) {
    return {
      success: false,
      output: `Invalid role. Available roles: ${validRoles.join(', ')}`,
      type: 'error'
    }
  }

  return {
    success: true,
    output: `✓ Role updated successfully\n  User: ${identifier}\n  New Role: ${role}`,
    type: 'success'
  }
}

function listTeamMembers(context: CommandContext): CommandResult {
  // Simulate team data
  const teamMembers = [
    { name: 'John Doe', email: 'john@example.com', role: 'lead', status: 'active', capacity: 40 },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'member', status: 'active', capacity: 35 },
    { name: 'Bob Wilson', email: 'bob@example.com', role: 'member', status: 'active', capacity: 30 },
    { name: 'Alice Brown', email: 'alice@example.com', role: 'member', status: 'away', capacity: 0 },
    { name: context.user?.name || 'You', email: context.user?.email || 'you@example.com', role: 'admin', status: 'active', capacity: 40 }
  ]

  const detailed = context.flags.includes('--detailed') || context.flags.includes('-d')
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                       TEAM MEMBERS                            ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  if (detailed) {
    output += 'NAME                EMAIL                     ROLE      STATUS    CAPACITY\n'
    output += '─────────────────────────────────────────────────────────────────────────\n'
    
    teamMembers.forEach(member => {
      const statusIcon = member.status === 'active' ? '🟢' : 
                        member.status === 'away' ? '🟡' : '🔴'
      output += `${member.name.padEnd(20)}${member.email.padEnd(26)}${member.role.padEnd(10)}${statusIcon} ${member.status.padEnd(8)}${member.capacity}h/w\n`
    })
  } else {
    teamMembers.forEach(member => {
      const roleIcon = member.role === 'admin' ? '👑' :
                      member.role === 'lead' ? '⭐' : '👤'
      const statusIcon = member.status === 'active' ? '●' : '○'
      output += `  ${statusIcon} ${roleIcon} ${member.name} (${member.email}) - ${member.role}\n`
    })
  }
  
  output += `\nTotal: ${teamMembers.length} members (${teamMembers.filter(m => m.status === 'active').length} active)`

  return {
    success: true,
    output,
    type: 'output'
  }
}

function showTeamCapacity(context: CommandContext): CommandResult {
  const capacityData = {
    total: 145,
    allocated: 120,
    available: 25,
    members: [
      { name: 'John Doe', allocated: 35, capacity: 40 },
      { name: 'Jane Smith', allocated: 30, capacity: 35 },
      { name: 'Bob Wilson', allocated: 25, capacity: 30 },
      { name: 'You', allocated: 30, capacity: 40 }
    ]
  }
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                      TEAM CAPACITY                            ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += 'SPRINT CAPACITY:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += `Total Capacity:    ${capacityData.total} hours\n`
  output += `Allocated:         ${capacityData.allocated} hours\n`
  output += `Available:         ${capacityData.available} hours\n`
  output += `Utilization:       ${Math.round((capacityData.allocated / capacityData.total) * 100)}%\n\n`
  
  output += 'INDIVIDUAL ALLOCATION:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  
  capacityData.members.forEach(member => {
    const utilization = Math.round((member.allocated / member.capacity) * 100)
    const bar = '█'.repeat(Math.floor(utilization / 5)) + '░'.repeat(20 - Math.floor(utilization / 5))
    output += `${member.name.padEnd(15)} ${bar} ${utilization}% (${member.allocated}/${member.capacity}h)\n`
  })
  
  output += '\n💡 RECOMMENDATIONS:\n'
  output += '  • Team is at healthy capacity (83% utilization)\n'
  output += '  • Reserve remaining hours for unplanned work\n'
  output += '  • Consider load balancing if needed'

  return {
    success: true,
    output,
    type: 'info'
  }
}

function showAvailability(context: CommandContext): CommandResult {
  const schedule = {
    monday: ['John', 'Jane', 'Bob', 'You'],
    tuesday: ['John', 'Jane', 'Bob', 'You'],
    wednesday: ['John', 'Jane', 'You'],
    thursday: ['John', 'Jane', 'Bob', 'You'],
    friday: ['Jane', 'Bob', 'You']
  }
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                    TEAM AVAILABILITY                          ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  output += 'THIS WEEK:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  
  Object.entries(schedule).forEach(([day, members]) => {
    const availability = `${members.length}/4 available`
    output += `${day.toUpperCase().padEnd(12)} ${availability.padEnd(15)} ${members.join(', ')}\n`
  })
  
  output += '\nUPCOMING TIME OFF:\n'
  output += '─────────────────────────────────────────────────────────────────\n'
  output += '  • Bob Wilson - Next Wednesday (Doctor appointment)\n'
  output += '  • John Doe - Next Friday-Monday (Vacation)\n'
  
  output += '\n💡 PLANNING NOTES:\n'
  output += '  • Wednesday has reduced capacity\n'
  output += '  • Plan critical work for Monday-Tuesday\n'
  output += '  • Friday has lowest availability'

  return {
    success: true,
    output,
    type: 'info'
  }
}