import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { canAccessTask, getTaskProject, requirePermission } from "../auth/permissions";

export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("feature"), v.literal("bug"), v.literal("improvement"), v.literal("task"), v.literal("epic")),
    priority: v.optional(v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"))),
    assigneeId: v.optional(v.id("users")),
    labels: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    estimate: v.optional(v.object({
      points: v.optional(v.number()),
      hours: v.optional(v.number()),
    })),
    parentTaskId: v.optional(v.id("tasks")),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "task.create");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const maxNumber = tasks.reduce((max, task) => Math.max(max, task.number), 0);
    const now = Date.now();

    const taskId = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      parentTaskId: args.parentTaskId,
      number: maxNumber + 1,
      title: args.title,
      description: args.description,
      status: "backlog",
      priority: args.priority || "medium",
      type: args.type,
      assigneeId: args.assigneeId,
      reporterId: user._id,
      labels: args.labels || [],
      dueDate: args.dueDate,
      estimate: args.estimate,
      position: tasks.length,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "task",
      entityId: taskId,
      action: "task.created",
      metadata: { 
        title: args.title, 
        projectKey: project.key,
        taskNumber: maxNumber + 1,
      },
      createdAt: now,
    });

    if (args.assigneeId && args.assigneeId !== user._id) {
      await ctx.db.insert("notifications", {
        userId: args.assigneeId,
        type: "task.assigned",
        title: "New Task Assigned",
        message: `You've been assigned to "${args.title}"`,
        data: { taskId, projectId: args.projectId },
        read: false,
        createdAt: now,
      });
    }

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done"),
      v.literal("cancelled")
    )),
    priority: v.optional(v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low"))),
    assigneeId: v.optional(v.id("users")),
    labels: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    estimate: v.optional(v.object({
      points: v.optional(v.number()),
      hours: v.optional(v.number()),
    })),
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

    const hasAccess = await canAccessTask(ctx.db, user._id, args.taskId, "task.edit");
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

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "done") {
        updates.completedAt = Date.now();
      }
    }
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.assigneeId !== undefined) updates.assigneeId = args.assigneeId;
    if (args.labels !== undefined) updates.labels = args.labels;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.estimate !== undefined) updates.estimate = args.estimate;

    await ctx.db.patch(args.taskId, updates);

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "task",
      entityId: args.taskId,
      action: "task.updated",
      metadata: updates,
      createdAt: Date.now(),
    });

    if (args.assigneeId && args.assigneeId !== task.assigneeId && args.assigneeId !== user._id) {
      await ctx.db.insert("notifications", {
        userId: args.assigneeId,
        type: "task.assigned",
        title: "Task Assigned",
        message: `You've been assigned to "${task.title}"`,
        data: { taskId: args.taskId, projectId: task.projectId },
        read: false,
        createdAt: Date.now(),
      });
    }

    return args.taskId;
  },
});

export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
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

    const hasAccess = await canAccessTask(ctx.db, user._id, args.taskId, "task.delete");
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

    await ctx.db.delete(args.taskId);

    const subtasks = await ctx.db
      .query("tasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskId))
      .collect();

    for (const subtask of subtasks) {
      await ctx.db.patch(subtask._id, { parentTaskId: undefined });
    }

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "task",
      entityId: args.taskId,
      action: "task.deleted",
      metadata: { title: task.title },
      createdAt: Date.now(),
    });

    return args.taskId;
  },
});

export const moveTask = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    position: v.number(),
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

    const hasAccess = await canAccessTask(ctx.db, user._id, args.taskId, "task.edit");
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    const updates: any = {
      status: args.status,
      position: args.position,
      updatedAt: Date.now(),
    };

    if (args.status === "done") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.taskId, updates);

    return args.taskId;
  },
});