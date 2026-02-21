import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getNotifications = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      type: v.string(),
      title: v.string(),
      body: v.string(),
      link: v.optional(v.string()),
      isRead: v.boolean(),
      actorId: v.optional(v.id("users")),
      entityId: v.optional(v.string()),
      entityType: v.optional(v.string()),
      userId: v.id("users"),
      workspaceId: v.id("workspaces"),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_and_workspace", (q) =>
        q.eq("userId", user._id).eq("workspaceId", args.workspaceId)
      )
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getUnreadCount = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_workspace", (q) =>
        q.eq("userId", user._id).eq("workspaceId", args.workspaceId)
      )
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    // Verify the notification belongs to this user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user || notification.userId !== user._id)
      throw new Error("Access denied");
    await ctx.db.patch(args.notificationId, { isRead: true });
    return null;
  },
});

export const markAllAsRead = mutation({
  args: { workspaceId: v.id("workspaces") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_workspace", (q) =>
        q.eq("userId", user._id).eq("workspaceId", args.workspaceId)
      )
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
    return null;
  },
});

export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_comment"),
      v.literal("task_mention"),
      v.literal("sprint_started"),
      v.literal("sprint_completed"),
      v.literal("member_joined"),
      v.literal("pr_merged")
    ),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    actorId: v.optional(v.id("users")),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      workspaceId: args.workspaceId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link,
      isRead: false,
      actorId: args.actorId,
      entityId: args.entityId,
      entityType: args.entityType,
    });
    return null;
  },
});
