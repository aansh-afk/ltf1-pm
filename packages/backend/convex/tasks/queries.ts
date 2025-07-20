import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../auth/permissions";

export const getProjectTasks = query({
  args: { 
    projectId: v.id("projects"),
    status: v.optional(v.array(v.string())),
    assigneeId: v.optional(v.id("users")),
    labels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      project.workspaceId,
      "task.view"
    );

    if (!hasAccess) {
      return [];
    }

    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    const tasks = await tasksQuery.collect();

    let filteredTasks = tasks;

    if (args.status && args.status.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        args.status!.includes(task.status)
      );
    }

    if (args.assigneeId) {
      filteredTasks = filteredTasks.filter(task => 
        task.assigneeId === args.assigneeId
      );
    }

    if (args.labels && args.labels.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.labels.some(label => args.labels!.includes(label))
      );
    }

    const tasksWithDetails = await Promise.all(
      filteredTasks.map(async (task) => {
        const assignee = task.assigneeId ? await ctx.db.get(task.assigneeId) : null;
        const reporter = await ctx.db.get(task.reporterId);

        const subtasks = await ctx.db
          .query("tasks")
          .withIndex("by_parent", (q) => q.eq("parentTaskId", task._id))
          .collect();

        const comments = await ctx.db
          .query("comments")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect();

        return {
          ...task,
          assignee,
          reporter,
          subtaskCount: subtasks.length,
          commentCount: comments.length,
        };
      })
    );

    return tasksWithDetails.sort((a, b) => a.position - b.position);
  },
});

export const getTask = query({
  args: { taskId: v.id("tasks") },
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

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      project.workspaceId,
      "task.view"
    );

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    const assignee = task.assigneeId ? await ctx.db.get(task.assigneeId) : null;
    const reporter = await ctx.db.get(task.reporterId);

    const subtasks = await ctx.db
      .query("tasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", task._id))
      .collect();

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return { ...comment, user };
      })
    );

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .collect();

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", "task").eq("entityId", task._id)
      )
      .collect();

    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return { ...activity, user };
      })
    );

    return {
      ...task,
      project,
      assignee,
      reporter,
      subtasks,
      comments: commentsWithUsers,
      attachments,
      activities: activitiesWithUsers,
    };
  },
});

export const getMyTasks = query({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    status: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
      .collect();

    if (args.status && args.status.length > 0) {
      tasks = tasks.filter(task => args.status!.includes(task.status));
    }

    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const project = await ctx.db.get(task.projectId);
        if (!project) return null;

        if (args.workspaceId && project.workspaceId !== args.workspaceId) {
          return null;
        }

        const hasAccess = await hasPermission(
          ctx.db,
          user._id,
          project.workspaceId,
          "task.view"
        );

        if (!hasAccess) return null;

        const reporter = await ctx.db.get(task.reporterId);

        return {
          ...task,
          project,
          reporter,
        };
      })
    );

    return tasksWithDetails
      .filter(Boolean)
      .sort((a, b) => b!.updatedAt - a!.updatedAt);
  },
});