import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requirePermission } from "../auth/permissions";

export const createSprint = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
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

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.edit");

    const startTimestamp = new Date(args.startDate).getTime();
    const endTimestamp = new Date(args.endDate).getTime();

    if (endTimestamp <= startTimestamp) {
      throw new Error("End date must be after start date");
    }

    const now = Date.now();

    const sprintId = await ctx.db.insert("sprints", {
      projectId: args.projectId,
      name: args.name,
      goal: args.goal,
      startDate: startTimestamp,
      endDate: endTimestamp,
      status: "planning",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      action: "sprint.created",
      metadata: { name: args.name },
      createdAt: now,
    });

    return sprintId;
  },
});

export const updateSprint = mutation({
  args: {
    sprintId: v.id("sprints"),
    name: v.optional(v.string()),
    goal: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("planning"), v.literal("active"), v.literal("completed"))),
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

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.edit");

    const updates: any = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.goal !== undefined) updates.goal = args.goal;
    if (args.status !== undefined) {
      if (args.status === "active") {
        const activeSprints = await ctx.db
          .query("sprints")
          .withIndex("by_project", (q) => q.eq("projectId", sprint.projectId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
        
        if (activeSprints.length > 0 && activeSprints[0]._id !== args.sprintId) {
          throw new Error("Another sprint is already active. Complete or close it first.");
        }
      }
      updates.status = args.status;
    }

    if (args.startDate !== undefined) {
      updates.startDate = new Date(args.startDate).getTime();
    }
    if (args.endDate !== undefined) {
      updates.endDate = new Date(args.endDate).getTime();
    }

    if (updates.startDate && updates.endDate && updates.endDate <= updates.startDate) {
      throw new Error("End date must be after start date");
    }

    await ctx.db.patch(args.sprintId, updates);

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: sprint.projectId,
      action: "sprint.updated",
      metadata: { sprintId: args.sprintId, updates },
      createdAt: Date.now(),
    });

    return args.sprintId;
  },
});

export const deleteSprint = mutation({
  args: {
    sprintId: v.id("sprints"),
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

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.edit");

    // Remove sprint from all tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();

    for (const task of tasks) {
      await ctx.db.patch(task._id, { sprintId: undefined });
    }

    await ctx.db.delete(args.sprintId);

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: sprint.projectId,
      action: "sprint.deleted",
      metadata: { name: sprint.name },
      createdAt: Date.now(),
    });

    return args.sprintId;
  },
});

export const addTasksToSprint = mutation({
  args: {
    sprintId: v.id("sprints"),
    taskIds: v.array(v.id("tasks")),
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

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "task.edit");

    for (const taskId of args.taskIds) {
      const task = await ctx.db.get(taskId);
      if (task && task.projectId === sprint.projectId) {
        await ctx.db.patch(taskId, { 
          sprintId: args.sprintId,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: sprint.projectId,
      action: "sprint.tasks_added",
      metadata: { sprintId: args.sprintId, taskCount: args.taskIds.length },
      createdAt: Date.now(),
    });

    return args.taskIds.length;
  },
});

export const removeTaskFromSprint = mutation({
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

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "task.edit");

    const sprintId = task.sprintId;
    await ctx.db.patch(args.taskId, { 
      sprintId: undefined,
      updatedAt: Date.now(),
    });

    if (sprintId) {
      await ctx.db.insert("activities", {
        workspaceId: project.workspaceId,
        userId: user._id,
        entityType: "task",
        entityId: args.taskId,
        action: "task.removed_from_sprint",
        metadata: { sprintId },
        createdAt: Date.now(),
      });
    }

    return args.taskId;
  },
});