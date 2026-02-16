import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requirePermission } from "../auth/permissions";
import { internal } from "../_generated/api";
import { sprintStarted, sprintCompleted } from "../email/templates";

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

    // Log sprint creation activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "sprint_created",
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "sprint",
      targetId: sprintId,
      targetName: args.name,
      description: `created sprint "${args.name}"`,
      metadata: {
        extra: { name: args.name }
      }
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

    // Log sprint update activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "sprint_created", // Using sprint_created as closest match, could add sprint_updated later
      projectId: sprint.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "sprint",
      targetId: args.sprintId,
      targetName: sprint.name,
      description: `updated sprint "${sprint.name}"`,
      metadata: {
        extra: { sprintId: args.sprintId, updates }
      }
    });

    // Send sprint started emails to project members
    if (args.status === "active" && sprint.status !== "active") {
      const projectMembers = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", sprint.projectId))
        .collect();

      const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      for (const pm of projectMembers) {
        if (pm.userId !== user._id && pm.status === "active") {
          const memberUser = await ctx.db.get(pm.userId);
          if (memberUser && memberUser.preferences?.notifications?.email !== false) {
            const emailContent = sprintStarted({
              sprintName: args.name || sprint.name,
              projectName: project.name,
              startDate: formatDate(updates.startDate || sprint.startDate),
              endDate: formatDate(updates.endDate || sprint.endDate),
              goal: args.goal || sprint.goal,
              startedByName: user.name || user.email,
            });
            await ctx.scheduler.runAfter(0, internal.email.send.sendEmail, {
              to: memberUser.email,
              subject: emailContent.subject,
              html: emailContent.html,
            });
          }
        }
      }
    }

    // Send sprint completed emails to project members
    if (args.status === "completed" && sprint.status !== "completed") {
      const projectMembers = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", sprint.projectId))
        .collect();

      for (const pm of projectMembers) {
        if (pm.userId !== user._id && pm.status === "active") {
          const memberUser = await ctx.db.get(pm.userId);
          if (memberUser && memberUser.preferences?.notifications?.email !== false) {
            const emailContent = sprintCompleted({
              sprintName: sprint.name,
              projectName: project.name,
              completedByName: user.name || user.email,
            });
            await ctx.scheduler.runAfter(0, internal.email.send.sendEmail, {
              to: memberUser.email,
              subject: emailContent.subject,
              html: emailContent.html,
            });
          }
        }
      }
    }

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

    // Log sprint deletion activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "sprint_completed", // Using sprint_completed as closest match
      projectId: sprint.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "sprint",
      targetId: args.sprintId,
      targetName: sprint.name,
      description: `deleted sprint "${sprint.name}"`,
      metadata: {
        extra: { name: sprint.name, action: "deleted" }
      }
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

    // Log tasks added to sprint activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "sprint_created", // Using sprint_created as closest match
      projectId: sprint.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "sprint",
      targetId: args.sprintId,
      targetName: sprint.name,
      description: `added ${args.taskIds.length} tasks to sprint "${sprint.name}"`,
      metadata: {
        extra: { sprintId: args.sprintId, taskCount: args.taskIds.length }
      }
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
      // Log task removed from sprint activity
      await ctx.runMutation(internal.activities.mutations.logActivity, {
        type: "task_status_changed",
        projectId: task.projectId,
        workspaceId: project.workspaceId,
        actorId: user._id,
        actorName: user.name || user.email,
        targetType: "task",
        targetId: args.taskId,
        targetName: task.title,
        description: `removed task "${task.title}" from sprint`,
        metadata: {
          extra: { sprintId }
        }
      });
    }

    return args.taskId;
  },
});