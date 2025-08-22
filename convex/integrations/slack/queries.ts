import { v } from "convex/values"
import { query } from "../../_generated/server"

export const getSlackIntegration = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.union(v.null(), v.object({
    _id: v.id("slackIntegrations"),
    workspaceId: v.id("workspaces"),
    teamId: v.string(),
    teamName: v.string(),
    botUserId: v.string(),
    incomingWebhookChannel: v.optional(v.string()),
    scopes: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const integration = await ctx.db
      .query("slackIntegrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()

    if (!integration) {
      return null
    }

    // Don't return sensitive tokens
    return {
      _id: integration._id,
      workspaceId: integration.workspaceId,
      teamId: integration.teamId,
      teamName: integration.teamName,
      botUserId: integration.botUserId,
      incomingWebhookChannel: integration.incomingWebhookChannel,
      scopes: integration.scopes,
      active: integration.active,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }
  },
})

export const getSlackChannel = query({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.string(),
  },
  returns: v.union(v.null(), v.object({
    _id: v.id("slackChannels"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    channelId: v.string(),
    channelName: v.string(),
    channelType: v.union(v.literal("project"), v.literal("general"), v.literal("alerts")),
    syncEvents: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    return await ctx.db
      .query("slackChannels")
      .withIndex("by_channel", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("channelId", args.channelId)
      )
      .first()
  },
})

export const getSlackChannels = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.array(v.object({
    _id: v.id("slackChannels"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    channelId: v.string(),
    channelName: v.string(),
    channelType: v.union(v.literal("project"), v.literal("general"), v.literal("alerts")),
    syncEvents: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    let query = ctx.db
      .query("slackChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))

    const channels = await query.collect()

    if (args.projectId) {
      return channels.filter(c => c.projectId === args.projectId)
    }

    return channels
  },
})

export const getSlackChannelsForEvent = query({
  args: {
    workspaceId: v.id("workspaces"),
    eventType: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("slackChannels"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    channelId: v.string(),
    channelName: v.string(),
    channelType: v.union(v.literal("project"), v.literal("general"), v.literal("alerts")),
    syncEvents: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("slackChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect()

    return channels.filter(channel => 
      channel.syncEvents.includes(args.eventType)
    )
  },
})

export const getSlackUserMapping = query({
  args: {
    workspaceId: v.id("workspaces"),
    slackUserId: v.string(),
  },
  returns: v.union(v.null(), v.object({
    _id: v.id("slackUserMappings"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    slackUserId: v.string(),
    slackUsername: v.string(),
    slackEmail: v.optional(v.string()),
    slackRealName: v.optional(v.string()),
    slackAvatar: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    return await ctx.db
      .query("slackUserMappings")
      .withIndex("by_slack_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("slackUserId", args.slackUserId)
      )
      .first()
  },
})

export const getSlackUserMappings = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(v.object({
    _id: v.id("slackUserMappings"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    slackUserId: v.string(),
    slackUsername: v.string(),
    slackEmail: v.optional(v.string()),
    slackRealName: v.optional(v.string()),
    slackAvatar: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    return await ctx.db
      .query("slackUserMappings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()
  },
})

export const getSlackEvent = query({
  args: {
    eventId: v.id("slackEvents"),
  },
  returns: v.union(v.null(), v.object({
    _id: v.id("slackEvents"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    eventType: v.string(),
    eventData: v.any(),
    userId: v.optional(v.string()),
    channelId: v.optional(v.string()),
    messageTs: v.optional(v.string()),
    processed: v.boolean(),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId)
  },
})

export const getRecentSlackEvents = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("slackEvents"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    eventType: v.string(),
    eventData: v.any(),
    userId: v.optional(v.string()),
    channelId: v.optional(v.string()),
    messageTs: v.optional(v.string()),
    processed: v.boolean(),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const limit = args.limit || 50

    return await ctx.db
      .query("slackEvents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(limit)
  },
})

export const getTaskBySlackMessage = query({
  args: {
    messageTs: v.string(),
    channelId: v.string(),
  },
  returns: v.union(v.null(), v.object({
    _id: v.id("slackTaskLinks"),
    _creationTime: v.number(),
    taskId: v.id("tasks"),
    messageTs: v.string(),
    channelId: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("slackTaskLinks")
      .withIndex("by_message", (q) => 
        q.eq("messageTs", args.messageTs).eq("channelId", args.channelId)
      )
      .first()
  },
})

export const getSlackFiles = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.array(v.object({
    _id: v.id("slackFiles"),
    _creationTime: v.number(),
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    fileId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    uploadedBy: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    let query = ctx.db
      .query("slackFiles")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))

    const files = await query.collect()

    if (args.projectId) {
      return files.filter(f => f.projectId === args.projectId)
    }

    return files
  },
})

export const getSlackIntegrationStatus = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.object({
    connected: v.boolean(),
    teamName: v.optional(v.string()),
    channels: v.number(),
    users: v.number(),
    lastSync: v.union(v.null(), v.number()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return {
        connected: false,
        channels: 0,
        users: 0,
        lastSync: null,
      }
    }

    const integration = await ctx.db
      .query("slackIntegrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()

    if (!integration) {
      return {
        connected: false,
        channels: 0,
        users: 0,
        lastSync: null,
      }
    }

    const channels = await ctx.db
      .query("slackChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    const users = await ctx.db
      .query("slackUserMappings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    return {
      connected: integration.active,
      teamName: integration.teamName,
      channels: channels.length,
      users: users.length,
      lastSync: integration.updatedAt,
    }
  },
})