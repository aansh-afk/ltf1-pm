import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { canAccessTask } from "../auth/permissions";
import { internal } from "../_generated/api";
import { commentAdded } from "../email/templates";
import { getCurrentUserOrThrow } from "../lib/auth";

export const createComment = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

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

    // Log comment added activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "task_commented",
      projectId: task.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "task",
      targetId: args.taskId,
      targetName: task.title,
      description: `commented on "${task.title}"`,
      metadata: {
        extra: { content: args.content }
      }
    });

    // Notify all assignees and reporter about the comment via dispatch
    const assigneeIds = task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []);
    const taskKey = `${project.settings?.taskPrefix || project.key}-${task.number}`;
    const notifySet = new Set<string>();

    for (const assigneeId of assigneeIds) {
      if (assigneeId !== user._id) {
        notifySet.add(assigneeId);
      }
    }
    // Also notify reporter if different from commenter
    if (task.reporterId !== user._id) {
      notifySet.add(task.reporterId);
    }

    for (const recipientId of notifySet) {
      await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
        recipientUserId: recipientId as any,
        workspaceId: project.workspaceId,
        type: "task_comment",
        title: "New Comment",
        body: `${user.name} commented on "${task.title}"`,
        link: `/projects/${project.key}/tasks/${taskKey}`,
        actorId: user._id,
        entityId: args.taskId,
        entityType: "task",
        emailData: {
          commenterName: user.name || user.email,
          taskTitle: task.title,
          taskKey,
          commentPreview: args.content,
        },
      });
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
    const user = await getCurrentUserOrThrow(ctx);

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
    const user = await getCurrentUserOrThrow(ctx);

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

    // Log comment deleted activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "task_commented",
      projectId: task.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "task",
      targetId: comment.taskId,
      targetName: task.title,
      description: `deleted a comment on "${task.title}"`,
      metadata: undefined
    });

    return args.commentId;
  },
});