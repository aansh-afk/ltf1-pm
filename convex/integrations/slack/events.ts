import { v } from "convex/values"
import { action, mutation, query } from "../../_generated/server"
import { api, internal } from "../../_generated/api"
import type { Id } from "../../_generated/dataModel"

// Store Slack workspace integration
export const storeSlackIntegration = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    accessToken: v.string(),
    teamId: v.string(),
    teamName: v.string(),
    botUserId: v.string(),
    botAccessToken: v.string(),
    incomingWebhookUrl: v.optional(v.string()),
    incomingWebhookChannel: v.optional(v.string()),
    scopes: v.array(v.string()),
  },
  returns: v.id("slackIntegrations"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Check if integration already exists
    const existing = await ctx.db
      .query("slackIntegrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()

    if (existing) {
      // Update existing integration
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        teamId: args.teamId,
        teamName: args.teamName,
        botUserId: args.botUserId,
        botAccessToken: args.botAccessToken,
        incomingWebhookUrl: args.incomingWebhookUrl,
        incomingWebhookChannel: args.incomingWebhookChannel,
        scopes: args.scopes,
        updatedAt: Date.now(),
      })
      return existing._id
    } else {
      // Create new integration
      return await ctx.db.insert("slackIntegrations", {
        workspaceId: args.workspaceId,
        accessToken: args.accessToken,
        teamId: args.teamId,
        teamName: args.teamName,
        botUserId: args.botUserId,
        botAccessToken: args.botAccessToken,
        incomingWebhookUrl: args.incomingWebhookUrl,
        incomingWebhookChannel: args.incomingWebhookChannel,
        scopes: args.scopes,
        userId: identity.subject,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})

// Store Slack channel mapping
export const mapSlackChannel = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    channelId: v.string(),
    channelName: v.string(),
    channelType: v.union(v.literal("project"), v.literal("general"), v.literal("alerts")),
    syncEvents: v.array(v.string()), // ["task_created", "task_completed", "sprint_started", etc.]
  },
  returns: v.id("slackChannels"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Check if mapping already exists
    const existing = await ctx.db
      .query("slackChannels")
      .withIndex("by_channel", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("channelId", args.channelId)
      )
      .first()

    if (existing) {
      // Update existing mapping
      await ctx.db.patch(existing._id, {
        channelName: args.channelName,
        channelType: args.channelType,
        projectId: args.projectId,
        syncEvents: args.syncEvents,
        updatedAt: Date.now(),
      })
      return existing._id
    } else {
      // Create new mapping
      return await ctx.db.insert("slackChannels", {
        workspaceId: args.workspaceId,
        projectId: args.projectId,
        channelId: args.channelId,
        channelName: args.channelName,
        channelType: args.channelType,
        syncEvents: args.syncEvents,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})

// Store Slack user mapping
export const mapSlackUser = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    slackUserId: v.string(),
    slackUsername: v.string(),
    slackEmail: v.optional(v.string()),
    slackRealName: v.optional(v.string()),
    slackAvatar: v.optional(v.string()),
  },
  returns: v.id("slackUserMappings"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Check if mapping already exists
    const existing = await ctx.db
      .query("slackUserMappings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    if (existing) {
      // Update existing mapping
      await ctx.db.patch(existing._id, {
        slackUserId: args.slackUserId,
        slackUsername: args.slackUsername,
        slackEmail: args.slackEmail,
        slackRealName: args.slackRealName,
        slackAvatar: args.slackAvatar,
        updatedAt: Date.now(),
      })
      return existing._id
    } else {
      // Create new mapping
      return await ctx.db.insert("slackUserMappings", {
        workspaceId: args.workspaceId,
        userId: args.userId,
        slackUserId: args.slackUserId,
        slackUsername: args.slackUsername,
        slackEmail: args.slackEmail,
        slackRealName: args.slackRealName,
        slackAvatar: args.slackAvatar,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})

// Log Slack event
export const logSlackEvent = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    eventType: v.string(),
    eventData: v.object({
      text: v.optional(v.string()),
      user: v.optional(v.string()),
      channel: v.optional(v.string()),
      thread_ts: v.optional(v.string()),
      reaction: v.optional(v.string()),
      item: v.optional(v.object({
        type: v.string(),
        ts: v.string(),
        channel: v.string(),
      })),
      file_id: v.optional(v.string()),
      user_id: v.optional(v.string()),
      channel_id: v.optional(v.string()),
    }),
    userId: v.optional(v.string()),
    channelId: v.optional(v.string()),
    messageTs: v.optional(v.string()),
    processed: v.boolean(),
    error: v.optional(v.string()),
  },
  returns: v.id("slackEvents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("slackEvents", {
      workspaceId: args.workspaceId,
      eventType: args.eventType,
      eventData: args.eventData,
      userId: args.userId,
      channelId: args.channelId,
      messageTs: args.messageTs,
      processed: args.processed,
      error: args.error,
      createdAt: Date.now(),
    })
  },
})

// Process Slack event
export const processSlackEvent = action({
  args: {
    eventId: v.id("slackEvents"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get the event
    const event = await ctx.runQuery(api.integrations.slack.queries.getSlackEvent, {
      eventId: args.eventId,
    })

    if (!event || event.processed) {
      return { success: false, message: "Event not found or already processed" }
    }

    // Get integration
    const integration = await ctx.runQuery(api.integrations.slack.queries.getSlackIntegration, {
      workspaceId: event.workspaceId,
    })

    if (!integration) {
      throw new Error("Slack integration not found")
    }

    // Process based on event type
    switch (event.eventType) {
      case "message":
        await processMessageEvent(ctx, event, integration)
        break
      
      case "app_mention":
        await processAppMentionEvent(ctx, event, integration)
        break
      
      case "reaction_added":
        await processReactionEvent(ctx, event, integration)
        break
      
      case "file_shared":
        await processFileSharedEvent(ctx, event, integration)
        break
      
      default:
        console.log(`Unknown event type: ${event.eventType}`)
    }

    // Mark event as processed
    await ctx.runMutation(api.integrations.slack.mutations.updateSlackEvent, {
      eventId: args.eventId,
      processed: true,
    })

    return { success: true }
  },
})

// Process message event
async function processMessageEvent(ctx: any, event: any, integration: any) {
  const { text, user, channel, thread_ts } = event.eventData

  // Check if message contains task-related keywords
  const taskKeywords = ["task", "todo", "ticket", "issue", "bug"]
  const hasTaskKeyword = taskKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )

  if (hasTaskKeyword) {
    // Extract task information from message
    const taskMatch = text.match(/create (?:task|todo|ticket|issue|bug):?\s*(.+)/i)
    
    if (taskMatch) {
      const taskTitle = taskMatch[1]
      
      // Get channel mapping to find project
      const channelMapping = await ctx.runQuery(api.integrations.slack.queries.getSlackChannel, {
        workspaceId: event.workspaceId,
        channelId: channel,
      })

      if (channelMapping && channelMapping.projectId) {
        // Create task
        await ctx.runMutation(api.tasks.mutations.createTask, {
          projectId: channelMapping.projectId,
          title: taskTitle,
          description: `Created from Slack by <@${user}>`,
          status: "todo",
          priority: "medium",
          type: "task",
        })

        // Send confirmation message
        await sendSlackMessage(integration.botAccessToken, {
          channel,
          text: `✅ Task created: "${taskTitle}"`,
          thread_ts,
        })
      }
    }
  }
}

// Process app mention event
async function processAppMentionEvent(ctx: any, event: any, integration: any) {
  const { text, user, channel, thread_ts } = event.eventData

  // Parse command from mention
  const commandMatch = text.match(/<@\w+>\s+(.+)/)
  if (!commandMatch) return

  const command = commandMatch[1].toLowerCase()

  // Handle different commands
  if (command.startsWith("help")) {
    await sendSlackMessage(integration.botAccessToken, {
      channel,
      text: "Here are the available commands:\n" +
        "• `create task <title>` - Create a new task\n" +
        "• `list tasks` - List open tasks\n" +
        "• `my tasks` - List your assigned tasks\n" +
        "• `sprint status` - Get current sprint status\n" +
        "• `help` - Show this help message",
      thread_ts,
    })
  } else if (command.startsWith("list tasks")) {
    // Get channel mapping
    const channelMapping = await ctx.runQuery(api.integrations.slack.queries.getSlackChannel, {
      workspaceId: event.workspaceId,
      channelId: channel,
    })

    if (channelMapping && channelMapping.projectId) {
      // Get open tasks
      const tasks = await ctx.runQuery(api.tasks.queries.getProjectTasks, {
        projectId: channelMapping.projectId,
      })

      const openTasks = tasks.filter((t: any) => t.status !== "done").slice(0, 10)
      
      const taskList = openTasks.map((t: any) => 
        `• [${t.priority}] ${t.title} (${t.status})`
      ).join("\n")

      await sendSlackMessage(integration.botAccessToken, {
        channel,
        text: `Open tasks:\n${taskList || "No open tasks"}`,
        thread_ts,
      })
    }
  }
}

// Process reaction event
async function processReactionEvent(ctx: any, event: any, integration: any) {
  const { reaction, user, item } = event.eventData

  // Handle task completion reaction
  if (reaction === "white_check_mark" && item.type === "message") {
    // Check if message is linked to a task
    const taskLink = await ctx.runQuery(api.integrations.slack.queries.getTaskBySlackMessage, {
      messageTs: item.ts,
      channelId: item.channel,
    })

    if (taskLink) {
      // Mark task as complete
      await ctx.runMutation(api.tasks.mutations.updateTask, {
        taskId: taskLink.taskId,
        status: "done",
      })

      // Send confirmation
      await sendSlackMessage(integration.botAccessToken, {
        channel: item.channel,
        text: "✅ Task marked as complete!",
        thread_ts: item.ts,
      })
    }
  }
}

// Process file shared event
async function processFileSharedEvent(ctx: any, event: any, integration: any) {
  const { file_id, user_id, channel_id } = event.eventData

  // Get file info from Slack
  const fileInfo = await getSlackFileInfo(integration.accessToken, file_id)
  
  if (fileInfo && fileInfo.ok) {
    const file = fileInfo.file
    
    // Get channel mapping
    const channelMapping = await ctx.runQuery(api.integrations.slack.queries.getSlackChannel, {
      workspaceId: event.workspaceId,
      channelId: channel_id,
    })

    if (channelMapping && channelMapping.projectId) {
      // Store file reference
      await ctx.runMutation(api.integrations.slack.mutations.storeSlackFile, {
        workspaceId: event.workspaceId,
        projectId: channelMapping.projectId,
        fileId: file.id,
        fileName: file.name,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: file.url_private,
        uploadedBy: user_id,
      })
    }
  }
}

// Send Slack message helper
async function sendSlackMessage(token: string, message: any) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  })

  return response.json()
}

// Get Slack file info helper
async function getSlackFileInfo(token: string, fileId: string) {
  const response = await fetch(`https://slack.com/api/files.info?file=${fileId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  })

  return response.json()
}

// Send notification to Slack
export const sendNotification = action({
  args: {
    workspaceId: v.id("workspaces"),
    eventType: v.string(),
    eventData: v.object({
      task: v.optional(v.object({
        title: v.string(),
        priority: v.string(),
        status: v.string(),
        timeSpent: v.optional(v.number()),
      })),
      projectName: v.optional(v.string()),
      creatorName: v.optional(v.string()),
      completedByName: v.optional(v.string()),
      sprint: v.optional(v.object({
        name: v.string(),
      })),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      taskCount: v.optional(v.number()),
      totalPoints: v.optional(v.number()),
      meeting: v.optional(v.object({
        title: v.string(),
        duration: v.number(),
      })),
      startTime: v.optional(v.string()),
      attendees: v.optional(v.array(v.string())),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get integration
    const integration = await ctx.runQuery(internal.integrations.slack.queries.getSlackIntegrationInternal, {
      workspaceId: args.workspaceId,
    })

    if (!integration || !integration.active) {
      return { success: false, message: "Slack integration not found or inactive" }
    }

    // Get channels that want this event type
    const channels = await ctx.runQuery(api.integrations.slack.queries.getSlackChannelsForEvent, {
      workspaceId: args.workspaceId,
      eventType: args.eventType,
    })

    // Send notification to each channel
    for (const channel of channels) {
      let message: any

      switch (args.eventType) {
        case "task_created":
          message = buildTaskCreatedMessage(args.eventData)
          break
        
        case "task_completed":
          message = buildTaskCompletedMessage(args.eventData)
          break
        
        case "sprint_started":
          message = buildSprintStartedMessage(args.eventData)
          break
        
        case "meeting_reminder":
          message = buildMeetingReminderMessage(args.eventData)
          break
        
        default:
          continue
      }

      if (message) {
        message.channel = channel.channelId
        await sendSlackMessage(integration.botAccessToken, message)
      }
    }

    return { success: true }
  },
})

// Message builders
function buildTaskCreatedMessage(data: any) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📝 *New Task Created*\n*${data.task.title}*`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Project:*\n${data.projectName}`,
          },
          {
            type: "mrkdwn",
            text: `*Priority:*\n${data.task.priority}`,
          },
          {
            type: "mrkdwn",
            text: `*Created by:*\n${data.creatorName}`,
          },
          {
            type: "mrkdwn",
            text: `*Status:*\n${data.task.status}`,
          },
        ],
      },
    ],
  }
}

function buildTaskCompletedMessage(data: any) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ *Task Completed*\n*${data.task.title}*`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Project:*\n${data.projectName}`,
          },
          {
            type: "mrkdwn",
            text: `*Completed by:*\n${data.completedByName}`,
          },
          {
            type: "mrkdwn",
            text: `*Time Spent:*\n${data.task.timeSpent || 0}h`,
          },
        ],
      },
    ],
  }
}

function buildSprintStartedMessage(data: any) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🚀 *Sprint Started*\n*${data.sprint.name}*`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Project:*\n${data.projectName}`,
          },
          {
            type: "mrkdwn",
            text: `*Duration:*\n${data.startDate} - ${data.endDate}`,
          },
          {
            type: "mrkdwn",
            text: `*Tasks:*\n${data.taskCount}`,
          },
          {
            type: "mrkdwn",
            text: `*Story Points:*\n${data.totalPoints}`,
          },
        ],
      },
    ],
  }
}

function buildMeetingReminderMessage(data: any) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📅 *Meeting Reminder*\n*${data.meeting.title}*`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Time:*\n${data.startTime}`,
          },
          {
            type: "mrkdwn",
            text: `*Duration:*\n${data.meeting.duration} minutes`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Attendees:*\n${data.attendees.join(", ")}`,
        },
      },
    ],
  }
}