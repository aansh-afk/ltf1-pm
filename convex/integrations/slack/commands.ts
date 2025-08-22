import { v } from "convex/values"
import { action, mutation } from "../../_generated/server"
import { api } from "../../_generated/api"
import type { Id } from "../../_generated/dataModel"

// Slash command handler
export const handleSlashCommand = action({
  args: {
    workspaceId: v.id("workspaces"),
    command: v.string(),
    text: v.string(),
    userId: v.string(),
    userName: v.string(),
    channelId: v.string(),
    channelName: v.string(),
    responseUrl: v.string(),
    triggerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Parse command and arguments
    const parts = args.text.trim().split(/\s+/)
    const subCommand = parts[0]?.toLowerCase() || "help"
    const commandArgs = parts.slice(1).join(" ")

    // Get user mapping
    const userMapping = await ctx.runQuery(api.integrations.slack.queries.getSlackUserMapping, {
      workspaceId: args.workspaceId,
      slackUserId: args.userId,
    })

    let response: any

    switch (subCommand) {
      case "help":
        response = await handleHelpCommand()
        break
      
      case "task":
      case "tasks":
        response = await handleTaskCommand(ctx, args, commandArgs, userMapping)
        break
      
      case "sprint":
        response = await handleSprintCommand(ctx, args, commandArgs)
        break
      
      case "project":
      case "projects":
        response = await handleProjectCommand(ctx, args, commandArgs)
        break
      
      case "standup":
        response = await handleStandupCommand(ctx, args, userMapping)
        break
      
      case "time":
        response = await handleTimeCommand(ctx, args, commandArgs, userMapping)
        break
      
      case "meeting":
        response = await handleMeetingCommand(ctx, args, commandArgs)
        break
      
      case "search":
        response = await handleSearchCommand(ctx, args, commandArgs)
        break
      
      case "connect":
        response = await handleConnectCommand(ctx, args)
        break
      
      case "disconnect":
        response = await handleDisconnectCommand(ctx, args)
        break
      
      default:
        response = {
          text: `Unknown command: ${subCommand}. Type \`/ltf1 help\` for available commands.`,
        }
    }

    // Send response to Slack
    if (args.responseUrl) {
      await sendSlackResponse(args.responseUrl, response)
    }

    return response
  },
})

// Help command
async function handleHelpCommand() {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*LTF1 Slack Commands*\n\nHere are the available commands:",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Task Management*\n" +
            "• `/ltf1 task create <title>` - Create a new task\n" +
            "• `/ltf1 task list` - List open tasks\n" +
            "• `/ltf1 task mine` - List your assigned tasks\n" +
            "• `/ltf1 task complete <id>` - Mark task as complete\n" +
            "• `/ltf1 task assign <id> @user` - Assign task to user",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Sprint Management*\n" +
            "• `/ltf1 sprint status` - Current sprint status\n" +
            "• `/ltf1 sprint tasks` - List sprint tasks\n" +
            "• `/ltf1 sprint velocity` - Sprint velocity metrics",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Time Tracking*\n" +
            "• `/ltf1 time start <task-id>` - Start time tracking\n" +
            "• `/ltf1 time stop` - Stop current timer\n" +
            "• `/ltf1 time log <hours> <task-id>` - Log time manually\n" +
            "• `/ltf1 time today` - Today's time entries",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Other Commands*\n" +
            "• `/ltf1 standup` - Submit daily standup\n" +
            "• `/ltf1 meeting schedule` - Schedule a meeting\n" +
            "• `/ltf1 search <query>` - Search tasks and projects\n" +
            "• `/ltf1 connect` - Connect this channel to a project\n" +
            "• `/ltf1 help` - Show this help message",
        },
      },
    ],
  }
}

// Task command handler
async function handleTaskCommand(ctx: any, args: any, commandArgs: string, userMapping: any) {
  const taskParts = commandArgs.split(/\s+/)
  const taskAction = taskParts[0]?.toLowerCase() || "list"
  const taskArgs = taskParts.slice(1).join(" ")

  // Get channel mapping to find project
  const channelMapping = await ctx.runQuery(api.integrations.slack.queries.getSlackChannel, {
    workspaceId: args.workspaceId,
    channelId: args.channelId,
  })

  switch (taskAction) {
    case "create":
      if (!taskArgs) {
        return { text: "Please provide a task title. Usage: `/ltf1 task create <title>`" }
      }
      
      if (!channelMapping?.projectId) {
        return { text: "This channel is not connected to a project. Use `/ltf1 connect` first." }
      }

      const newTask = await ctx.runMutation(api.tasks.mutations.createTask, {
        projectId: channelMapping.projectId,
        title: taskArgs,
        description: `Created via Slack by @${args.userName}`,
        status: "todo",
        priority: "medium",
        type: "task",
      })

      return {
        text: `✅ Task created successfully!`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `✅ *Task Created*\n\n*Title:* ${taskArgs}\n*ID:* ${newTask}\n*Status:* Todo\n*Priority:* Medium`,
            },
          },
        ],
      }
    
    case "list":
      if (!channelMapping?.projectId) {
        return { text: "This channel is not connected to a project. Use `/ltf1 connect` first." }
      }

      const tasks = await ctx.runQuery(api.tasks.queries.getTasksByProject, {
        projectId: channelMapping.projectId,
      })

      const openTasks = tasks
        .filter((t: any) => t.status !== "done")
        .slice(0, 10)
        .map((t: any) => `• *[${t.priority}]* ${t.title} _(${t.status})_`)
        .join("\n")

      return {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Open Tasks*\n\n${openTasks || "No open tasks found"}`,
            },
          },
        ],
      }
    
    case "mine":
      if (!userMapping) {
        return { text: "Your Slack account is not linked to LTF1. Please link your account first." }
      }

      const myTasks = await ctx.runQuery(api.tasks.queries.getMyTasks, {
        workspaceId: args.workspaceId,
      })

      const taskList = myTasks
        .slice(0, 10)
        .map((t: any) => `• *[${t.priority}]* ${t.title} _(${t.status})_`)
        .join("\n")

      return {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Your Tasks*\n\n${taskList || "No tasks assigned to you"}`,
            },
          },
        ],
      }
    
    case "complete":
      const taskId = taskParts[1]
      if (!taskId) {
        return { text: "Please provide a task ID. Usage: `/ltf1 task complete <id>`" }
      }

      try {
        await ctx.runMutation(api.tasks.mutations.updateTask, {
          taskId: taskId as Id<"tasks">,
          status: "done",
        })
        return { text: `✅ Task ${taskId} marked as complete!` }
      } catch (error) {
        return { text: `❌ Error: Could not complete task. ${error}` }
      }
    
    default:
      return { text: `Unknown task action: ${taskAction}. Try 'create', 'list', 'mine', or 'complete'.` }
  }
}

// Sprint command handler
async function handleSprintCommand(ctx: any, args: any, commandArgs: string) {
  const sprintAction = commandArgs.split(/\s+/)[0]?.toLowerCase() || "status"

  // Get channel mapping
  const channelMapping = await ctx.runQuery(api.integrations.slack.queries.getSlackChannel, {
    workspaceId: args.workspaceId,
    channelId: args.channelId,
  })

  if (!channelMapping?.projectId) {
    return { text: "This channel is not connected to a project. Use `/ltf1 connect` first." }
  }

  switch (sprintAction) {
    case "status":
      const activeSprint = await ctx.runQuery(api.sprints.getActiveSprint, {
        projectId: channelMapping.projectId,
      })

      if (!activeSprint) {
        return { text: "No active sprint found for this project." }
      }

      const sprintTasks = await ctx.runQuery(api.tasks.queries.getTasksBySprint, {
        sprintId: activeSprint._id,
      })

      const completedTasks = sprintTasks.filter((t: any) => t.status === "done").length
      const totalTasks = sprintTasks.length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Sprint Status: ${activeSprint.name}*\n\n` +
                `*Progress:* ${completedTasks}/${totalTasks} tasks (${progress}%)\n` +
                `*Start Date:* ${new Date(activeSprint.startDate).toLocaleDateString()}\n` +
                `*End Date:* ${new Date(activeSprint.endDate).toLocaleDateString()}\n` +
                `*Status:* ${activeSprint.status}`,
            },
          },
        ],
      }
    
    case "tasks":
      const sprint = await ctx.runQuery(api.sprints.getActiveSprint, {
        projectId: channelMapping.projectId,
      })

      if (!sprint) {
        return { text: "No active sprint found." }
      }

      const tasks = await ctx.runQuery(api.tasks.queries.getTasksBySprint, {
        sprintId: sprint._id,
      })

      const tasksByStatus = {
        todo: tasks.filter((t: any) => t.status === "todo"),
        in_progress: tasks.filter((t: any) => t.status === "in_progress"),
        done: tasks.filter((t: any) => t.status === "done"),
      }

      return {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Sprint Tasks: ${sprint.name}*`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*To Do (${tasksByStatus.todo.length})*\n` +
                tasksByStatus.todo.slice(0, 5).map((t: any) => `• ${t.title}`).join("\n"),
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*In Progress (${tasksByStatus.in_progress.length})*\n` +
                tasksByStatus.in_progress.slice(0, 5).map((t: any) => `• ${t.title}`).join("\n"),
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Done (${tasksByStatus.done.length})*\n` +
                tasksByStatus.done.slice(0, 5).map((t: any) => `• ${t.title}`).join("\n"),
            },
          },
        ],
      }
    
    default:
      return { text: `Unknown sprint action: ${sprintAction}. Try 'status' or 'tasks'.` }
  }
}

// Project command handler
async function handleProjectCommand(ctx: any, args: any, commandArgs: string) {
  const projects = await ctx.runQuery(api.projects.getProjects, {
    workspaceId: args.workspaceId,
  })

  const projectList = projects
    .slice(0, 10)
    .map((p: any) => `• *${p.name}* (${p.key}) - ${p.status}`)
    .join("\n")

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Projects in Workspace*\n\n${projectList || "No projects found"}`,
        },
      },
    ],
  }
}

// Standup command handler
async function handleStandupCommand(ctx: any, args: any, userMapping: any) {
  if (!userMapping) {
    return { text: "Your Slack account is not linked to LTF1. Please link your account first." }
  }

  // Create interactive standup form
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Daily Standup*\n\nPlease submit your standup update:",
        },
      },
      {
        type: "input",
        block_id: "yesterday_block",
        label: {
          type: "plain_text",
          text: "What did you accomplish yesterday?",
        },
        element: {
          type: "plain_text_input",
          action_id: "yesterday_input",
          multiline: true,
        },
      },
      {
        type: "input",
        block_id: "today_block",
        label: {
          type: "plain_text",
          text: "What will you work on today?",
        },
        element: {
          type: "plain_text_input",
          action_id: "today_input",
          multiline: true,
        },
      },
      {
        type: "input",
        block_id: "blockers_block",
        label: {
          type: "plain_text",
          text: "Any blockers or concerns?",
        },
        element: {
          type: "plain_text_input",
          action_id: "blockers_input",
          multiline: true,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Submit Standup",
            },
            action_id: "submit_standup",
            style: "primary",
          },
        ],
      },
    ],
  }
}

// Time command handler
async function handleTimeCommand(ctx: any, args: any, commandArgs: string, userMapping: any) {
  if (!userMapping) {
    return { text: "Your Slack account is not linked to LTF1. Please link your account first." }
  }

  const timeParts = commandArgs.split(/\s+/)
  const timeAction = timeParts[0]?.toLowerCase() || "today"

  switch (timeAction) {
    case "start":
      const taskId = timeParts[1]
      if (!taskId) {
        return { text: "Please provide a task ID. Usage: `/ltf1 time start <task-id>`" }
      }

      try {
        await ctx.runMutation(api.timeEntries.startTimer, {
          taskId: taskId as Id<"tasks">,
          description: `Started via Slack`,
        })
        return { text: `⏱️ Timer started for task ${taskId}` }
      } catch (error) {
        return { text: `❌ Error: ${error}` }
      }
    
    case "stop":
      const activeEntry = await ctx.runQuery(api.timeEntries.getActiveTimeEntry, {
        userId: userMapping.userId,
      })

      if (!activeEntry) {
        return { text: "No active timer found." }
      }

      await ctx.runMutation(api.timeEntries.stopTimer, {
        timeEntryId: activeEntry._id,
      })

      const duration = ((Date.now() - activeEntry.startTime) / 3600000).toFixed(2)
      return { text: `⏹️ Timer stopped. Duration: ${duration} hours` }
    
    case "today":
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const entries = await ctx.runQuery(api.timeEntries.getTimeEntriesByUser, {
        userId: userMapping.userId,
        startDate: todayStart.getTime(),
      })

      const totalTime = entries.reduce((sum: number, e: any) => 
        sum + (e.duration || 0), 0
      ) / 3600000

      const entryList = entries
        .slice(0, 5)
        .map((e: any) => {
          const duration = ((e.duration || 0) / 3600000).toFixed(2)
          return `• Task ${e.taskId}: ${duration}h`
        })
        .join("\n")

      return {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Today's Time Entries*\n\n` +
                `*Total Time:* ${totalTime.toFixed(2)} hours\n\n` +
                `*Entries:*\n${entryList || "No time entries today"}`,
            },
          },
        ],
      }
    
    default:
      return { text: `Unknown time action: ${timeAction}. Try 'start', 'stop', or 'today'.` }
  }
}

// Meeting command handler
async function handleMeetingCommand(ctx: any, args: any, commandArgs: string) {
  return {
    text: "Meeting scheduling coming soon! For now, please use the web interface.",
  }
}

// Search command handler
async function handleSearchCommand(ctx: any, args: any, commandArgs: string) {
  if (!commandArgs) {
    return { text: "Please provide a search query. Usage: `/ltf1 search <query>`" }
  }

  const results = await ctx.runQuery(api.search.globalSearch, {
    query: commandArgs,
    filters: {
      workspace: args.workspaceId,
    },
  })

  const resultList = results
    .slice(0, 5)
    .map((r: any) => `• *[${r.type}]* ${r.title} - _${r.score.toFixed(0)}% match_`)
    .join("\n")

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Search Results for "${commandArgs}"*\n\n${resultList || "No results found"}`,
        },
      },
    ],
  }
}

// Connect channel command
async function handleConnectCommand(ctx: any, args: any) {
  // This would show an interactive project selector
  return {
    text: "To connect this channel to a project, please use the web interface and go to Project Settings > Integrations > Slack.",
  }
}

// Disconnect channel command
async function handleDisconnectCommand(ctx: any, args: any) {
  const channelMapping = await ctx.runQuery(api.integrations.slack.queries.getSlackChannel, {
    workspaceId: args.workspaceId,
    channelId: args.channelId,
  })

  if (!channelMapping) {
    return { text: "This channel is not connected to any project." }
  }

  await ctx.runMutation(api.integrations.slack.mutations.disconnectChannel, {
    workspaceId: args.workspaceId,
    channelId: args.channelId,
  })

  return { text: "✅ Channel disconnected from project." }
}

// Send response to Slack
async function sendSlackResponse(responseUrl: string, response: any) {
  await fetch(responseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  })
}