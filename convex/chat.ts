import { v } from "convex/values"
import { mutation, query, action } from "./_generated/server"
import { api } from "./_generated/api"
import { Id } from "./_generated/dataModel"
import { getCurrentUserOrThrow } from "./lib/auth"

// Create a new chat channel
export const createChannel = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("direct"),
      v.literal("project"),
      v.literal("sprint")
    ),
    entityId: v.optional(v.string()),
    members: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    // For direct messages, ensure only 2 members
    if (args.type === "direct" && args.members) {
      if (args.members.length !== 2) {
        throw new Error("Direct messages must have exactly 2 members")
      }
      
      // Check if direct channel already exists
      const directChannels = await ctx.db
        .query("chatChannels")
        .withIndex("by_type", (q) => q.eq("type", "direct"))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .collect()
      
      const existingChannel = args.members ? directChannels.find(channel => 
        channel.members && 
        channel.members.length === 2 &&
        ((channel.members[0] === args.members![0] && channel.members[1] === args.members![1]) ||
         (channel.members[0] === args.members![1] && channel.members[1] === args.members![0]))
      ) : undefined

      if (existingChannel) {
        return existingChannel._id
      }
    }

    const channelId = await ctx.db.insert("chatChannels", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      type: args.type,
      entityId: args.entityId,
      members: args.members || [user._id],
      admins: [user._id],
      settings: {
        allowThreads: true,
        allowReactions: true,
        allowFiles: true,
        allowGuestAccess: false,
      },
      archived: false,
      pinnedMessages: [],
      lastActivityAt: Date.now(),
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Add system message for channel creation
    await ctx.db.insert("chatMessages", {
      channelId,
      senderId: user._id,
      content: `Channel "${args.name}" created`,
      type: "system",
      parentId: undefined,
      threadCount: 0,
      reactions: [],
      mentions: [],
      readBy: [],
      deleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return channelId
  },
})

// Send a message
export const sendMessage = mutation({
  args: {
    channelId: v.id("chatChannels"),
    content: v.string(),
    type: v.optional(v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("image"),
      v.literal("code"),
      v.literal("task"),
      v.literal("meeting")
    )),
    metadata: v.optional(v.object({
      fileName: v.optional(v.string()),
      fileUrl: v.optional(v.string()),
      fileSize: v.optional(v.number()),
      mimeType: v.optional(v.string()),
      codeLanguage: v.optional(v.string()),
      taskId: v.optional(v.id("tasks")),
      meetingId: v.optional(v.id("meetings")),
    })),
    parentId: v.optional(v.id("chatMessages")),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    // Check if user is member of channel
    const channel = await ctx.db.get(args.channelId)
    if (!channel || !channel.members.includes(user._id)) {
      throw new Error("Not a member of this channel")
    }

    // If this is a thread reply, increment thread count
    if (args.parentId) {
      const parentMessage = await ctx.db.get(args.parentId)
      if (parentMessage) {
        await ctx.db.patch(args.parentId, {
          threadCount: parentMessage.threadCount + 1,
        })
      }
    }

    const messageId = await ctx.db.insert("chatMessages", {
      channelId: args.channelId,
      senderId: user._id,
      content: args.content,
      type: args.type || "text",
      metadata: args.metadata,
      parentId: args.parentId,
      threadCount: 0,
      reactions: [],
      mentions: args.mentions || [],
      readBy: [{ userId: user._id, readAt: Date.now() }],
      deleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Update channel last activity
    await ctx.db.patch(args.channelId, {
      lastActivityAt: Date.now(),
    })

    // Create notifications for mentions
    if (args.mentions && args.mentions.length > 0) {
      for (const mentionedUserId of args.mentions) {
        // Check notification settings
        const settings = await ctx.db
          .query("chatNotificationSettings")
          .withIndex("by_user_channel", (q) => 
            q.eq("userId", mentionedUserId).eq("channelId", args.channelId)
          )
          .first()

        if (!settings || settings.notifyFor !== "none") {
          // Create notification (would integrate with notification system)
          console.log(`Notifying user ${mentionedUserId} of mention`)
        }
      }
    }

    return messageId
  },
})

// Edit a message
export const editMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const message = await ctx.db.get(args.messageId)
    if (!message || message.senderId !== user._id) {
      throw new Error("Cannot edit this message")
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      metadata: {
        ...message.metadata,
        editedAt: Date.now(),
        editedBy: user._id,
      },
      updatedAt: Date.now(),
    })
  },
})

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error("Message not found")
    }

    // Check if user can delete (either sender or channel admin)
    const channel = await ctx.db.get(message.channelId)
    if (!channel) {
      throw new Error("Channel not found")
    }

    if (message.senderId !== user._id && !channel.admins.includes(user._id)) {
      throw new Error("Cannot delete this message")
    }

    await ctx.db.patch(args.messageId, {
      deleted: true,
      content: "[Message deleted]",
      updatedAt: Date.now(),
    })
  },
})

// Add reaction to message
export const addReaction = mutation({
  args: {
    messageId: v.id("chatMessages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error("Message not found")
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.userId === user._id && r.emoji === args.emoji
    )

    if (existingReaction) {
      // Remove reaction
      await ctx.db.patch(args.messageId, {
        reactions: message.reactions.filter(
          r => !(r.userId === user._id && r.emoji === args.emoji)
        ),
      })
    } else {
      // Add reaction
      await ctx.db.patch(args.messageId, {
        reactions: [...message.reactions, {
          emoji: args.emoji,
          userId: user._id,
          createdAt: Date.now(),
        }],
      })
    }
  },
})

// Mark messages as read
export const markAsRead = mutation({
  args: {
    channelId: v.id("chatChannels"),
    messageIds: v.array(v.id("chatMessages")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    for (const messageId of args.messageIds) {
      const message = await ctx.db.get(messageId)
      if (message && !message.readBy.some(r => r.userId === user._id)) {
        await ctx.db.patch(messageId, {
          readBy: [...message.readBy, {
            userId: user._id,
            readAt: Date.now(),
          }],
        })
      }
    }
  },
})

// Update typing indicator
export const updateTypingIndicator = mutation({
  args: {
    channelId: v.id("chatChannels"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const indicator = await ctx.db
      .query("chatTypingIndicators")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("channelId"), args.channelId))
      .first()

    if (args.isTyping) {
      if (indicator) {
        await ctx.db.patch(indicator._id, {
          lastTypingAt: Date.now(),
        })
      } else {
        await ctx.db.insert("chatTypingIndicators", {
          channelId: args.channelId,
          userId: user._id,
          lastTypingAt: Date.now(),
        })
      }
    } else if (indicator) {
      await ctx.db.delete(indicator._id)
    }
  },
})

// Get channels for workspace
export const getChannels = query({
  args: {
    workspaceId: v.id("workspaces"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    let channels = await ctx.db
      .query("chatChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    // Filter to channels user is member of
    channels = channels.filter(c => c.members.includes(user._id))

    // Filter archived if requested
    if (!args.includeArchived) {
      channels = channels.filter(c => !c.archived)
    }

    // Sort by last activity
    channels.sort((a, b) => b.lastActivityAt - a.lastActivityAt)

    return channels
  },
})

// Get messages for channel
export const getMessages = query({
  args: {
    channelId: v.id("chatChannels"),
    limit: v.optional(v.number()),
    before: v.optional(v.number()),
    parentId: v.optional(v.id("chatMessages")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    // Check if user is member of channel
    const channel = await ctx.db.get(args.channelId)
    if (!channel || !channel.members.includes(user._id)) {
      throw new Error("Not a member of this channel")
    }

    let query = ctx.db
      .query("chatMessages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))

    // Filter by parent for threads
    if (args.parentId !== undefined) {
      query = query.filter((q) => q.eq(q.field("parentId"), args.parentId))
    } else {
      query = query.filter((q) => q.eq(q.field("parentId"), undefined))
    }

    // Filter by time if before is specified
    if (args.before) {
      query = query.filter((q) => q.lt(q.field("createdAt"), args.before!))
    }

    const messages = await query
      .order("desc")
      .take(args.limit || 50)

    // Reverse to get chronological order
    messages.reverse()

    // Fetch sender information
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId)
        return {
          ...message,
          sender: sender ? {
            _id: sender._id,
            name: sender.name,
            avatarUrl: sender.avatarUrl,
          } : null,
        }
      })
    )

    return messagesWithSenders
  },
})

// Get typing indicators for channel
export const getTypingIndicators = query({
  args: {
    channelId: v.id("chatChannels"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const indicators = await ctx.db
      .query("chatTypingIndicators")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.gt(q.field("lastTypingAt"), now - 3000)) // Only show if typed in last 3 seconds
      .collect()

    // Fetch user information
    const indicatorsWithUsers = await Promise.all(
      indicators.map(async (indicator) => {
        const user = await ctx.db.get(indicator.userId)
        return {
          ...indicator,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatarUrl: user.avatarUrl,
          } : null,
        }
      })
    )

    return indicatorsWithUsers.filter(i => i.user)
  },
})

// Search messages
export const searchMessages = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
    channelId: v.optional(v.id("chatChannels")),
    senderId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    // Get user's channels
    const userChannels = await ctx.db
      .query("chatChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("members"), [user._id]))
      .collect()

    const userChannelIds = userChannels.map(c => c._id)

    // Search messages
    let results = await ctx.db
      .query("chatMessages")
      .withSearchIndex("search_content", (q) => 
        q.search("content", args.query)
      )
      .take(args.limit || 100)

    // Filter by user's channels and other criteria
    results = results.filter(msg => {
      if (!userChannelIds.includes(msg.channelId)) return false
      if (args.channelId && msg.channelId !== args.channelId) return false
      if (args.senderId && msg.senderId !== args.senderId) return false
      return !msg.deleted
    })

    // Fetch additional information
    const enrichedResults = await Promise.all(
      results.map(async (message) => {
        const [sender, channel] = await Promise.all([
          ctx.db.get(message.senderId),
          ctx.db.get(message.channelId),
        ])
        
        return {
          ...message,
          sender: sender ? {
            _id: sender._id,
            name: sender.name,
            avatarUrl: sender.avatarUrl,
          } : null,
          channel: channel ? {
            _id: channel._id,
            name: channel.name,
            type: channel.type,
          } : null,
        }
      })
    )

    return enrichedResults
  },
})

// Join channel
export const joinChannel = mutation({
  args: {
    channelId: v.id("chatChannels"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const channel = await ctx.db.get(args.channelId)
    if (!channel) {
      throw new Error("Channel not found")
    }

    // Check if channel is public or user is invited
    if (channel.type === "private" && !channel.members.includes(user._id)) {
      throw new Error("Cannot join private channel without invitation")
    }

    if (!channel.members.includes(user._id)) {
      await ctx.db.patch(args.channelId, {
        members: [...channel.members, user._id],
        updatedAt: Date.now(),
      })

      // Add system message
      await ctx.db.insert("chatMessages", {
        channelId: args.channelId,
        senderId: user._id,
        content: `${user.name} joined the channel`,
        type: "system",
        parentId: undefined,
        threadCount: 0,
        reactions: [],
        mentions: [],
        readBy: [],
        deleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})

// Leave channel
export const leaveChannel = mutation({
  args: {
    channelId: v.id("chatChannels"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const channel = await ctx.db.get(args.channelId)
    if (!channel) {
      throw new Error("Channel not found")
    }

    if (channel.members.includes(user._id)) {
      await ctx.db.patch(args.channelId, {
        members: channel.members.filter(id => id !== user._id),
        admins: channel.admins.filter(id => id !== user._id),
        updatedAt: Date.now(),
      })

      // Add system message
      await ctx.db.insert("chatMessages", {
        channelId: args.channelId,
        senderId: user._id,
        content: `${user.name} left the channel`,
        type: "system",
        parentId: undefined,
        threadCount: 0,
        reactions: [],
        mentions: [],
        readBy: [],
        deleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})

// Update notification settings
export const updateNotificationSettings = mutation({
  args: {
    channelId: v.id("chatChannels"),
    muted: v.optional(v.boolean()),
    muteUntil: v.optional(v.number()),
    notifyFor: v.optional(v.union(
      v.literal("all"),
      v.literal("mentions"),
      v.literal("none")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const settings = await ctx.db
      .query("chatNotificationSettings")
      .withIndex("by_user_channel", (q) => 
        q.eq("userId", user._id).eq("channelId", args.channelId)
      )
      .first()

    if (settings) {
      await ctx.db.patch(settings._id, {
        muted: args.muted ?? settings.muted,
        muteUntil: args.muteUntil ?? settings.muteUntil,
        notifyFor: args.notifyFor ?? settings.notifyFor,
      })
    } else {
      await ctx.db.insert("chatNotificationSettings", {
        userId: user._id,
        channelId: args.channelId,
        muted: args.muted ?? false,
        muteUntil: args.muteUntil,
        notifyFor: args.notifyFor ?? "all",
      })
    }
  },
})

// Pin/unpin message
export const togglePinMessage = mutation({
  args: {
    channelId: v.id("chatChannels"),
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const channel = await ctx.db.get(args.channelId)
    if (!channel) {
      throw new Error("Channel not found")
    }

    // Check if user is admin
    if (!channel.admins.includes(user._id)) {
      throw new Error("Only admins can pin messages")
    }

    const isPinned = channel.pinnedMessages.includes(args.messageId)
    
    if (isPinned) {
      await ctx.db.patch(args.channelId, {
        pinnedMessages: channel.pinnedMessages.filter(id => id !== args.messageId),
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.patch(args.channelId, {
        pinnedMessages: [...channel.pinnedMessages, args.messageId],
        updatedAt: Date.now(),
      })
    }
  },
})

// Get unread counts
export const getUnreadCounts = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const channels = await ctx.db
      .query("chatChannels")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("members"), [user._id]))
      .collect()

    const unreadCounts: Record<string, number> = {}

    for (const channel of channels) {
      const unreadMessages = await ctx.db
        .query("chatMessages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .filter((q) => 
          q.and(
            q.neq(q.field("senderId"), user._id),
            q.eq(q.field("deleted"), false)
          )
        )
        .collect()

      const unreadCount = unreadMessages.filter(msg => 
        !msg.readBy.some(r => r.userId === user._id)
      ).length

      if (unreadCount > 0) {
        unreadCounts[channel._id] = unreadCount
      }
    }

    return unreadCounts
  },
})