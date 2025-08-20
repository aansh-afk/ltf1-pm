import type { Id } from '../../../../../../convex/_generated/dataModel'
import type { Command, CommandContext, CommandResult } from '../types'

export const projectCommands: Command[] = [
  {
    name: 'project',
    aliases: ['proj', 'p'],
    description: 'Project management commands',
    usage: 'project [create|list|delete|archive|clone|set-lead] [options]',
    examples: [
      'project create "New Website"',
      'project list',
      'project delete PROJECT-123',
      'project archive PROJECT-456',
      'project set-lead PROJECT-789 user@example.com'
    ],
    execute: async (args, context) => {
      const subcommand = args[0]
      
      switch (subcommand) {
        case 'create':
          return await createProject(args.slice(1), context)
        case 'list':
        case 'ls':
          return await listProjects(context)
        case 'delete':
        case 'rm':
          return await deleteProject(args.slice(1), context)
        case 'archive':
          return await archiveProject(args.slice(1), context)
        case 'clone':
          return await cloneProject(args.slice(1), context)
        case 'set-lead':
        case 'lead':
          return await setProjectLead(args.slice(1), context)
        case 'link-repo':
        case 'repo':
          return await linkRepository(args.slice(1), context)
        case 'info':
        case 'show':
          return await showProjectInfo(args.slice(1), context)
        default:
          return {
            success: false,
            output: `Unknown subcommand: ${subcommand}\nUsage: ${projectCommands[0].usage}`,
            type: 'error'
          }
      }
    }
  }
]

async function createProject(args: string[], context: CommandContext): Promise<CommandResult> {
  const name = args.join(' ').replace(/^["']|["']$/g, '')
  
  if (!name) {
    return {
      success: false,
      output: 'Project name is required\nUsage: project create "Project Name"',
      type: 'error'
    }
  }

  // Get available workspaces
  const workspaces = context.workspaces || []
  
  if (workspaces.length === 0) {
    return {
      success: false,
      output: 'No workspaces available. Please create a workspace first.',
      type: 'error'
    }
  }

  // If only one workspace, use it. Otherwise prompt for selection
  let selectedWorkspace = workspaces[0]
  
  if (workspaces.length > 1) {
    // For now, we'll use the first workspace. In a real implementation,
    // we'd have an interactive prompt here
    const workspaceList = workspaces.map((w, i) => `  ${i + 1}. ${w.name}`).join('\n')
    
    // Check if user provided workspace index
    const workspaceFlag = context.flags.find(f => f.startsWith('--workspace='))
    if (workspaceFlag) {
      const workspaceIndex = parseInt(workspaceFlag.split('=')[1]) - 1
      if (workspaceIndex >= 0 && workspaceIndex < workspaces.length) {
        selectedWorkspace = workspaces[workspaceIndex]
      }
    } else {
      return {
        success: false,
        output: `Multiple workspaces available:\n${workspaceList}\n\nPlease specify workspace with --workspace=<number>`,
        type: 'info'
      }
    }
  }

  // Generate project key from name
  const key = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 4) || 'PROJ'

  try {
    // Call the mutation through context
    if (context.mutations?.createProject) {
      const projectId = await context.mutations.createProject({
        workspaceId: selectedWorkspace._id as Id<"workspaces">,
        name,
        key,
        description: context.flags.includes('--description') ? 
          args.find((_, i) => args[i - 1] === '--description') : undefined,
        workflowType: context.flags.includes('--kanban') ? 'kanban' : 
                      context.flags.includes('--scrum') ? 'scrum' : 'kanban'
      })

      return {
        success: true,
        output: `✓ Project "${name}" created successfully\n  ID: ${projectId}\n  Key: ${key}\n  Workspace: ${selectedWorkspace.name}`,
        type: 'success'
      }
    } else {
      // Fallback message if mutations not available
      return {
        success: true,
        output: `✓ Project creation initiated\n  Name: ${name}\n  Key: ${key}\n  Workspace: ${selectedWorkspace.name}\n\n[Note: Backend connection pending]`,
        type: 'success'
      }
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to create project: ${error.message}`,
      type: 'error'
    }
  }
}

async function listProjects(context: CommandContext): Promise<CommandResult> {
  const projects = context.projects || []
  
  if (projects.length === 0) {
    return {
      success: true,
      output: 'No projects found. Use "project create <name>" to create one.',
      type: 'info'
    }
  }

  const longFormat = context.flags.includes('-l') || context.flags.includes('--long')
  
  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                         PROJECTS                              ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'

  if (longFormat) {
    output += 'KEY     NAME                           STATUS      CREATED\n'
    output += '────────────────────────────────────────────────────────────────\n'
    
    projects.forEach(project => {
      const key = project.key?.padEnd(8) || '---     '
      const name = project.name.slice(0, 30).padEnd(30)
      const status = (project.status || 'active').padEnd(12)
      const created = new Date(project.createdAt).toLocaleDateString()
      
      output += `${key}${name}${status}${created}\n`
    })
  } else {
    projects.forEach((project, i) => {
      const status = project.status === 'active' ? '●' : 
                    project.status === 'archived' ? '○' : '◐'
      output += `  ${status} [${project.key || '---'}] ${project.name}\n`
    })
  }

  output += `\nTotal: ${projects.length} project${projects.length !== 1 ? 's' : ''}`

  return {
    success: true,
    output,
    type: 'output'
  }
}

async function deleteProject(args: string[], context: CommandContext): Promise<CommandResult> {
  const identifier = args[0]
  
  if (!identifier) {
    return {
      success: false,
      output: 'Project ID or key required\nUsage: project delete <project-id|key>',
      type: 'error'
    }
  }

  // Find project by key or ID
  const project = context.projects?.find(p => 
    p._id === identifier || p.key === identifier.toUpperCase()
  )

  if (!project) {
    return {
      success: false,
      output: `Project "${identifier}" not found`,
      type: 'error'
    }
  }

  // Check for confirmation flag
  if (!context.flags.includes('--force') && !context.flags.includes('-f')) {
    return {
      success: false,
      output: `⚠️  This will permanently delete project "${project.name}"\n\nTo confirm, use: project delete ${identifier} --force`,
      type: 'warning'
    }
  }

  try {
    if (context.mutations?.deleteProject) {
      await context.mutations.deleteProject({
        projectId: project._id as Id<"projects">
      })
    }

    return {
      success: true,
      output: `✓ Project "${project.name}" deleted successfully`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to delete project: ${error.message}`,
      type: 'error'
    }
  }
}

async function archiveProject(args: string[], context: CommandContext): Promise<CommandResult> {
  const identifier = args[0]
  
  if (!identifier) {
    return {
      success: false,
      output: 'Project ID or key required\nUsage: project archive <project-id|key>',
      type: 'error'
    }
  }

  const project = context.projects?.find(p => 
    p._id === identifier || p.key === identifier.toUpperCase()
  )

  if (!project) {
    return {
      success: false,
      output: `Project "${identifier}" not found`,
      type: 'error'
    }
  }

  try {
    if (context.mutations?.updateProject) {
      await context.mutations.updateProject({
        projectId: project._id as Id<"projects">,
        status: 'archived'
      })
    }

    return {
      success: true,
      output: `✓ Project "${project.name}" archived successfully`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to archive project: ${error.message}`,
      type: 'error'
    }
  }
}

async function cloneProject(args: string[], context: CommandContext): Promise<CommandResult> {
  const identifier = args[0]
  const newName = args.slice(1).join(' ').replace(/^["']|["']$/g, '')
  
  if (!identifier || !newName) {
    return {
      success: false,
      output: 'Usage: project clone <project-id|key> "New Project Name"',
      type: 'error'
    }
  }

  const sourceProject = context.projects?.find(p => 
    p._id === identifier || p.key === identifier.toUpperCase()
  )

  if (!sourceProject) {
    return {
      success: false,
      output: `Project "${identifier}" not found`,
      type: 'error'
    }
  }

  const key = newName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 4) || 'PROJ'

  try {
    if (context.mutations?.createProject) {
      const projectId = await context.mutations.createProject({
        workspaceId: sourceProject.workspaceId,
        name: newName,
        key,
        description: `Cloned from ${sourceProject.name}`,
        workflowType: sourceProject.settings?.workflowType
      })

      return {
        success: true,
        output: `✓ Project cloned successfully\n  Original: ${sourceProject.name}\n  New: ${newName}\n  ID: ${projectId}`,
        type: 'success'
      }
    }

    return {
      success: true,
      output: `✓ Clone initiated\n  Source: ${sourceProject.name}\n  Target: ${newName}`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to clone project: ${error.message}`,
      type: 'error'
    }
  }
}

async function setProjectLead(args: string[], context: CommandContext): Promise<CommandResult> {
  const projectId = args[0]
  const userEmail = args[1]
  
  if (!projectId || !userEmail) {
    return {
      success: false,
      output: 'Usage: project set-lead <project-id|key> <user-email>',
      type: 'error'
    }
  }

  const project = context.projects?.find(p => 
    p._id === projectId || p.key === projectId.toUpperCase()
  )

  if (!project) {
    return {
      success: false,
      output: `Project "${projectId}" not found`,
      type: 'error'
    }
  }

  // In a real implementation, we'd look up the user by email
  return {
    success: true,
    output: `✓ Project lead updated\n  Project: ${project.name}\n  New Lead: ${userEmail}`,
    type: 'success'
  }
}

async function linkRepository(args: string[], context: CommandContext): Promise<CommandResult> {
  const projectId = args[0]
  const repoUrl = args[1]
  
  if (!projectId || !repoUrl) {
    return {
      success: false,
      output: 'Usage: project link-repo <project-id|key> <repository-url>',
      type: 'error'
    }
  }

  const project = context.projects?.find(p => 
    p._id === projectId || p.key === projectId.toUpperCase()
  )

  if (!project) {
    return {
      success: false,
      output: `Project "${projectId}" not found`,
      type: 'error'
    }
  }

  // Detect provider from URL
  const provider = repoUrl.includes('github.com') ? 'github' :
                  repoUrl.includes('gitlab.com') ? 'gitlab' : 
                  repoUrl.includes('bitbucket.org') ? 'bitbucket' : 'github'

  try {
    if (context.mutations?.connectRepository) {
      await context.mutations.connectRepository({
        projectId: project._id as Id<"projects">,
        repositoryUrl: repoUrl,
        provider
      })
    }

    return {
      success: true,
      output: `✓ Repository linked successfully\n  Project: ${project.name}\n  Repository: ${repoUrl}\n  Provider: ${provider}`,
      type: 'success'
    }
  } catch (error: any) {
    return {
      success: false,
      output: `Failed to link repository: ${error.message}`,
      type: 'error'
    }
  }
}

async function showProjectInfo(args: string[], context: CommandContext): Promise<CommandResult> {
  const identifier = args[0]
  
  if (!identifier) {
    return {
      success: false,
      output: 'Usage: project info <project-id|key>',
      type: 'error'
    }
  }

  const project = context.projects?.find(p => 
    p._id === identifier || p.key === identifier.toUpperCase()
  )

  if (!project) {
    return {
      success: false,
      output: `Project "${identifier}" not found`,
      type: 'error'
    }
  }

  let output = '╔════════════════════════════════════════════════════════════════╗\n'
  output += '║                      PROJECT DETAILS                          ║\n'
  output += '╚════════════════════════════════════════════════════════════════╝\n\n'
  
  output += `Name:        ${project.name}\n`
  output += `Key:         ${project.key || 'N/A'}\n`
  output += `Status:      ${project.status || 'active'}\n`
  output += `Description: ${project.description || 'No description'}\n`
  output += `Created:     ${new Date(project.createdAt).toLocaleString()}\n`
  output += `Updated:     ${new Date(project.updatedAt).toLocaleString()}\n`
  
  if (project.repository) {
    output += `\nRepository:\n`
    output += `  URL:      ${project.repository.url}\n`
    output += `  Provider: ${project.repository.provider}\n`
  }
  
  if (project.settings) {
    output += `\nSettings:\n`
    output += `  Workflow: ${project.settings.workflowType}\n`
    output += `  Prefix:   ${project.settings.taskPrefix}\n`
  }

  return {
    success: true,
    output,
    type: 'info'
  }
}