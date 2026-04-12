import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getCurrentUserOrThrow } from "../lib/auth";

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
      body: v.optional(v.string()),
      message: v.optional(v.string()),
      link: v.optional(v.string()),
      isRead: v.optional(v.boolean()),
      read: v.optional(v.boolean()),
      actorId: v.optional(v.id("users")),
      entityId: v.optional(v.string()),
      entityType: v.optional(v.string()),
      userId: v.id("users"),
      workspaceId: v.optional(v.id("workspaces")),
      data: v.optional(v.any()),
      createdAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
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
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_workspace_and_read", (q) =>
        q.eq("userId", user._id).eq("workspaceId", args.workspaceId).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    // Verify the notification belongs to this user
    if (notification.userId !== user._id)
      throw new Error("Access denied");
    await ctx.db.patch(args.notificationId, { isRead: true });
    return null;
  },
});

export const markAllAsRead = mutation({
  args: { workspaceId: v.id("workspaces") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_workspace_and_read", (q) =>
        q.eq("userId", user._id).eq("workspaceId", args.workspaceId).eq("isRead", false)
      )
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
      // Tasks
      v.literal("task_assigned"),
      v.literal("task_unassigned"),
      v.literal("task_completed"),
      v.literal("task_status_changed"),
      v.literal("task_comment"),
      v.literal("task_mention"),
      v.literal("task_comment_reply"),
      v.literal("task_due_reminder"),
      v.literal("task_overdue"),
      v.literal("task_priority_escalated"),
      v.literal("task_deleted"),
      // Sprints
      v.literal("sprint_started"),
      v.literal("sprint_completed"),
      v.literal("sprint_ending_soon"),
      // Meetings
      v.literal("meeting_scheduled"),
      v.literal("meeting_updated"),
      v.literal("meeting_cancelled"),
      v.literal("meeting_reminder"),
      v.literal("meeting_notes_shared"),
      // Workspace & Team
      v.literal("member_joined"),
      v.literal("member_role_changed"),
      v.literal("member_removed"),
      v.literal("workspace_invitation"),
      v.literal("project_added"),
      v.literal("project_removed"),
      // GitHub / PRs
      v.literal("pr_merged"),
      v.literal("pr_review_requested"),
      // AI / Agent
      v.literal("agent_triage"),
      v.literal("ai_insight_critical"),
      v.literal("ai_insight_recommendation"),
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
