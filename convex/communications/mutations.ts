import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

const sourceValidator = v.union(
  v.literal("slack"),
  v.literal("github"),
  v.literal("discord"),
  v.literal("jira"),
  v.literal("internal")
);

/**
 * Internal mutation called by webhook handlers to normalize and store
 * incoming messages from any integration source.
 */
export const ingestExternalMessage = internalMutation({
  args: {
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
  },
  returns: v.id("commsMessages"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Insert the normalized message
    const messageId = await ctx.db.insert("commsMessages", {
      workspaceId: args.workspaceId,
      source: args.source,
      sourceChannelId: args.sourceChannelId,
      sourceMessageId: args.sourceMessageId,
      senderName: args.senderName,
      senderAvatarUrl: args.senderAvatarUrl,
      senderUserId: args.senderUserId,
      content: args.content,
      contentType: args.contentType,
      metadata: args.metadata,
      externalCreatedAt: args.externalCreatedAt,
      createdAt: now,
    });

    // Update channel's lastMessageAt and increment unread count
    const channel = await ctx.db.get(args.sourceChannelId);
    if (channel) {
      await ctx.db.patch(args.sourceChannelId, {
        lastMessageAt: now,
        unreadCount: channel.unreadCount + 1,
        updatedAt: now,
      });
    }

    return messageId;
  },
});

/**
 * Internal mutation to register or update a commsChannel entry when
 * an integration connects or discovers a new channel.
 */
export const registerCommsChannel = internalMutation({
  args: {
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
    replyEnabled: v.optional(v.boolean()),
  },
  returns: v.id("commsChannels"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if channel already exists
    const existing = await ctx.db
      .query("commsChannels")
      .withIndex("by_workspace_external", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("source", args.source)
          .eq("externalId", args.externalId)
      )
      .unique();

    if (existing) {
      // Update existing channel
      await ctx.db.patch(existing._id, {
        name: args.name,
        parentId: args.parentId,
        parentName: args.parentName,
        active: true,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new channel
    return await ctx.db.insert("commsChannels", {
      workspaceId: args.workspaceId,
      source: args.source,
      externalId: args.externalId,
      name: args.name,
      channelType: args.channelType,
      parentId: args.parentId,
      parentName: args.parentName,
      active: true,
      muted: false,
      unreadCount: 0,
      replyEnabled: args.replyEnabled ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Mark a channel as read (reset unread count).
 */
export const markChannelRead = mutation({
  args: {
    channelId: v.id("commsChannels"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    await ctx.db.patch(args.channelId, {
      unreadCount: 0,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Update per-channel settings (mute, etc.).
 */
export const updateChannelSettings = mutation({
  args: {
    channelId: v.id("commsChannels"),
    muted: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.muted !== undefined) updates.muted = args.muted;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.channelId, updates);
    return null;
  },
});
