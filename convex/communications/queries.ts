import { query } from "../_generated/server";
import { v } from "convex/values";

const sourceValidator = v.union(
  v.literal("slack"),
  v.literal("github"),
  v.literal("discord"),
  v.literal("jira"),
  v.literal("internal")
);

/**
 * Get all comms channels for a workspace, optionally filtered by source.
 * Sorted by lastMessageAt descending (most recent activity first).
 */
export const getCommsChannels = query({
  args: {
    workspaceId: v.id("workspaces"),
    source: v.optional(sourceValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("commsChannels"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      source: sourceValidator,
      externalId: v.string(),
      name: v.string(),
      channelType: v.union(
        v.literal("channel"),
        v.literal("repository"),
        v.literal("issue"),
        v.literal("pr"),
        v.literal("direct"),
        v.literal("thread")
      ),
      parentId: v.optional(v.string()),
      parentName: v.optional(v.string()),
      active: v.boolean(),
      muted: v.boolean(),
      unreadCount: v.number(),
      lastMessageAt: v.optional(v.number()),
      replyEnabled: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    if (args.source) {
      const channels = await ctx.db
        .query("commsChannels")
        .withIndex("by_workspace_source", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("source", args.source!)
        )
        .collect();
      // Sort by lastMessageAt descending
      return channels.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
    }

    const channels = await ctx.db
      .query("commsChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    return channels.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
  },
});

/**
 * Get a unified feed of recent messages across all sources in a workspace.
 */
export const getUnifiedFeed = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
    sources: v.optional(v.array(sourceValidator)),
  },
  returns: v.array(
    v.object({
      _id: v.id("commsMessages"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      source: sourceValidator,
      sourceChannelId: v.id("commsChannels"),
      sourceMessageId: v.optional(v.string()),
      senderName: v.string(),
      senderAvatarUrl: v.optional(v.string()),
      senderUserId: v.optional(v.id("users")),
      content: v.string(),
      contentType: v.union(
        v.literal("text"),
        v.literal("markdown"),
        v.literal("code"),
        v.literal("system")
      ),
      metadata: v.optional(v.any()),
      externalCreatedAt: v.optional(v.number()),
      createdAt: v.number(),
      channelName: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const take = args.limit ?? 50;

    // If filtering by specific sources, query per source and merge
    if (args.sources && args.sources.length > 0) {
      const allMessages = [];
      for (const source of args.sources) {
        const msgs = await ctx.db
          .query("commsMessages")
          .withIndex("by_workspace_source", (q) =>
            q.eq("workspaceId", args.workspaceId).eq("source", source)
          )
          .order("desc")
          .take(take);
        allMessages.push(...msgs);
      }
      // Sort merged results by createdAt desc and take limit
      allMessages.sort((a, b) => b.createdAt - a.createdAt);
      const limited = allMessages.slice(0, take);

      // Enrich with channel names
      const result = [];
      for (const msg of limited) {
        const channel = await ctx.db.get(msg.sourceChannelId);
        result.push({ ...msg, channelName: channel?.name });
      }
      return result;
    }

    // No source filter — get all recent messages
    const messages = await ctx.db
      .query("commsMessages")
      .withIndex("by_workspace_created", (q) =>
        q.eq("workspaceId", args.workspaceId)
      )
      .order("desc")
      .take(take);

    const result = [];
    for (const msg of messages) {
      const channel = await ctx.db.get(msg.sourceChannelId);
      result.push({ ...msg, channelName: channel?.name });
    }
    return result;
  },
});

/**
 * Get messages for a specific channel.
 */
export const getChannelMessages = query({
  args: {
    channelId: v.id("commsChannels"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("commsMessages"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      source: sourceValidator,
      sourceChannelId: v.id("commsChannels"),
      sourceMessageId: v.optional(v.string()),
      senderName: v.string(),
      senderAvatarUrl: v.optional(v.string()),
      senderUserId: v.optional(v.id("users")),
      content: v.string(),
      contentType: v.union(
        v.literal("text"),
        v.literal("markdown"),
        v.literal("code"),
        v.literal("system")
      ),
      metadata: v.optional(v.any()),
      externalCreatedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const take = args.limit ?? 50;
    const messages = await ctx.db
      .query("commsMessages")
      .withIndex("by_channel", (q) => q.eq("sourceChannelId", args.channelId))
      .order("desc")
      .take(take);
    return messages;
  },
});

/**
 * Get communications statistics for a workspace.
 */
export const getCommsStats = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.object({
    totalChannels: v.number(),
    activeChannels: v.number(),
    totalUnread: v.number(),
    messagesLast24h: v.number(),
    bySource: v.array(
      v.object({
        source: v.string(),
        channelCount: v.number(),
        messageCount: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("commsChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const totalChannels = channels.length;
    const activeChannels = channels.filter((c) => c.active).length;
    const totalUnread = channels.reduce((sum, c) => sum + c.unreadCount, 0);

    // Messages in last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentMessages = await ctx.db
      .query("commsMessages")
      .withIndex("by_workspace_created", (q) =>
        q.eq("workspaceId", args.workspaceId).gte("createdAt", oneDayAgo)
      )
      .collect();

    // Per-source breakdown
    const sourceMap: Record<string, { channelCount: number; messageCount: number }> = {};
    for (const ch of channels) {
      if (!sourceMap[ch.source]) {
        sourceMap[ch.source] = { channelCount: 0, messageCount: 0 };
      }
      sourceMap[ch.source].channelCount++;
    }
    for (const msg of recentMessages) {
      if (!sourceMap[msg.source]) {
        sourceMap[msg.source] = { channelCount: 0, messageCount: 0 };
      }
      sourceMap[msg.source].messageCount++;
    }

    const bySource = Object.entries(sourceMap).map(([source, data]) => ({
      source,
      channelCount: data.channelCount,
      messageCount: data.messageCount,
    }));

    return {
      totalChannels,
      activeChannels,
      totalUnread,
      messagesLast24h: recentMessages.length,
      bySource,
    };
  },
});
