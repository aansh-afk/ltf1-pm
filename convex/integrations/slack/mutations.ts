import { v } from "convex/values"
import { mutation } from "../../_generated/server"

export const updateSlackEvent = mutation({
  args: {
    eventId: v.id("slackEvents"),
    processed: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      processed: args.processed,
      error: args.error,
    })
  },
})

export const disconnectChannel = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const channel = await ctx.db
      .query("slackChannels")
      .withIndex("by_channel", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("channelId", args.channelId)
      )
      .first()

    if (channel) {
      await ctx.db.patch(channel._id, {
        active: false,
        updatedAt: Date.now(),
      })
    }
  },
})

export const disconnectSlack = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Deactivate integration
    const integration = await ctx.db
      .query("slackIntegrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()

    if (integration) {
      await ctx.db.patch(integration._id, {
        active: false,
        updatedAt: Date.now(),
      })
    }

    // Deactivate all channels
    const channels = await ctx.db
      .query("slackChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    for (const channel of channels) {
      await ctx.db.patch(channel._id, {
        active: false,
        updatedAt: Date.now(),
      })
    }
  },
})

export const storeSlackFile = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    fileId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    uploadedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("slackFiles", {
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      fileUrl: args.fileUrl,
      uploadedBy: args.uploadedBy,
      createdAt: Date.now(),
    })
  },
})

export const linkTaskToSlackMessage = mutation({
  args: {
    taskId: v.id("tasks"),
    messageTs: v.string(),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("slackTaskLinks", {
      taskId: args.taskId,
      messageTs: args.messageTs,
      channelId: args.channelId,
      createdAt: Date.now(),
    })
  },
})

export const storeStandup = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    date: v.number(),
    yesterday: v.string(),
    today: v.string(),
    blockers: v.optional(v.string()),
    slackUserId: v.optional(v.string()),
    channelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Check if standup already exists for today
    const existingStandup = await ctx.db
      .query("standups")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first()

    if (existingStandup) {
      // Update existing standup
      await ctx.db.patch(existingStandup._id, {
        yesterday: args.yesterday,
        today: args.today,
        blockers: args.blockers,
        updatedAt: Date.now(),
      })
      return existingStandup._id
    } else {
      // Create new standup
      return await ctx.db.insert("standups", {
        workspaceId: args.workspaceId,
        userId: args.userId,
        date: args.date,
        yesterday: args.yesterday,
        today: args.today,
        blockers: args.blockers,
        slackUserId: args.slackUserId,
        channelId: args.channelId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})

export const updateSlackIntegrationSettings = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    settings: v.object({
      notifications: v.optional(v.object({
        taskCreated: v.boolean(),
        taskCompleted: v.boolean(),
        taskAssigned: v.boolean(),
        sprintStarted: v.boolean(),
        sprintCompleted: v.boolean(),
        meetingReminder: v.boolean(),
        dailyStandup: v.boolean(),
      })),
      defaultChannel: v.optional(v.string()),
      standupTime: v.optional(v.string()),
      standupChannel: v.optional(v.string()),
      autoCreateChannels: v.optional(v.boolean()),
      syncUsers: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const integration = await ctx.db
      .query("slackIntegrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()

    if (!integration) {
      throw new Error("Slack integration not found")
    }

    await ctx.db.patch(integration._id, {
      settings: args.settings,
      updatedAt: Date.now(),
    })
  },
})