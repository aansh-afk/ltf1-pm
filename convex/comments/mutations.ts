import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { canAccessTask } from "../auth/permissions";

export const createComment = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const hasAccess = await canAccessTask(ctx.db, user._id, args.taskId, "task.view");
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();

    const commentId = await ctx.db.insert("comments", {
      taskId: args.taskId,
      userId: user._id,
      content: args.content,
      createdAt: now,
    });

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "task",
      entityId: args.taskId,
      action: "comment.added",
      metadata: { content: args.content },
      createdAt: now,
    });

    // Notify all assignees about the comment
    const assigneeIds = task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []);
    for (const assigneeId of assigneeIds) {
      if (assigneeId !== user._id) {
        await ctx.db.insert("notifications", {
          userId: assigneeId,
          type: "comment.added",
          title: "New Comment",
          message: `${user.name} commented on "${task.title}"`,
          data: { taskId: args.taskId, commentId },
          read: false,
          createdAt: now,
        });
      }
    }

    return commentId;
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.userId !== user._id) {
      throw new Error("You can only edit your own comments");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      editedAt: Date.now(),
    });

    return args.commentId;
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    const task = await ctx.db.get(comment.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const hasDeleteAccess = await canAccessTask(ctx.db, user._id, comment.taskId, "task.edit");
    
    if (comment.userId !== user._id && !hasDeleteAccess) {
      throw new Error("You can only delete your own comments");
    }

    await ctx.db.delete(args.commentId);

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "task",
      entityId: comment.taskId,
      action: "comment.deleted",
      metadata: {},
      createdAt: Date.now(),
    });

    return args.commentId;
  },
});