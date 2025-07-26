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
    assigneeIds: v.optional(v.array(v.id("users"))),
    labels: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
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
      assigneeIds: args.assigneeIds || [],
      assigneeId: undefined, // Deprecated field
      reporterId: user._id,
      labels: args.labels || [],
      startDate: args.startDate,
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

    // Send notifications to all assignees
    if (args.assigneeIds && args.assigneeIds.length > 0) {
      for (const assigneeId of args.assigneeIds) {
        if (assigneeId !== user._id) {
          await ctx.db.insert("notifications", {
            userId: assigneeId,
            type: "task.assigned",
            title: "New Task Assigned",
            message: `You've been assigned to "${args.title}"`,
            data: { taskId, projectId: args.projectId },
            read: false,
            createdAt: now,
          });
        }
      }
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
    assigneeIds: v.optional(v.array(v.id("users"))),
    labels: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
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
    if (args.assigneeIds !== undefined) {
      updates.assigneeIds = args.assigneeIds;
      updates.assigneeId = undefined; // Clear deprecated field
    }
    if (args.labels !== undefined) updates.labels = args.labels;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.estimate !== undefined) updates.estimate = args.estimate;

    await ctx.db.patch(args.taskId, updates);

    // Create more detailed activity metadata
    const activityMetadata: any = { ...updates };
    
    // Track assignee changes specifically
    if (args.assigneeIds !== undefined) {
      const previousAssigneeIds = task.assigneeIds || [];
      const newAssigneeIds = args.assigneeIds || [];
      
      const added = newAssigneeIds.filter(id => !previousAssigneeIds.includes(id));
      const removed = previousAssigneeIds.filter(id => !newAssigneeIds.includes(id));
      
      if (added.length > 0 || removed.length > 0) {
        activityMetadata.assigneesChanged = {
          added: added.length,
          removed: removed.length,
          total: newAssigneeIds.length
        };
      }
    }
    
    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "task",
      entityId: args.taskId,
      action: "task.updated",
      metadata: activityMetadata,
      createdAt: Date.now(),
    });

    // Send notifications to newly assigned users
    if (args.assigneeIds !== undefined) {
      const previousAssignees = new Set(task.assigneeIds || []);
      const newAssignees = new Set(args.assigneeIds);
      
      // Find users who are newly assigned
      for (const assigneeId of newAssignees) {
        if (!previousAssignees.has(assigneeId) && assigneeId !== user._id) {
          await ctx.db.insert("notifications", {
            userId: assigneeId,
            type: "task.assigned",
            title: "Task Assigned",
            message: `You've been assigned to "${task.title}"`,
            data: { taskId: args.taskId, projectId: task.projectId },
            read: false,
            createdAt: Date.now(),
          });
        }
      }
      
      // Optionally notify users who were unassigned
      for (const assigneeId of previousAssignees) {
        if (!newAssignees.has(assigneeId) && assigneeId !== user._id) {
          await ctx.db.insert("notifications", {
            userId: assigneeId,
            type: "task.unassigned",
            title: "Task Unassigned",
            message: `You've been unassigned from "${task.title}"`,
            data: { taskId: args.taskId, projectId: task.projectId },
            read: false,
            createdAt: Date.now(),
          });
        }
      }
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

export const startTimeTracking = mutation({
  args: {
    taskId: v.id("tasks")
  },
  handler: async (ctx, { taskId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const task = await ctx.db.get(taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    const hasAccess = await canAccessTask(ctx.db, user._id, taskId, "task.edit");
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Check if there's already an active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first()

    if (activeSession) {
      throw new Error("Time tracking already active for this task")
    }

    // Create new time entry
    const timeEntryId = await ctx.db.insert("timeEntries", {
      taskId,
      userId: identity.subject,
      startTime: Date.now(),
      description: `Working on: ${task.title}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    // Update task status to in-progress if not already
    if (task.status !== "in_progress") {
      await ctx.db.patch(taskId, {
        status: "in_progress",
        updatedAt: Date.now()
      })
    }

    return timeEntryId
  }
})

export const pauseTimeTracking = mutation({
  args: {
    taskId: v.id("tasks"),
    duration: v.number()
  },
  handler: async (ctx, { taskId, duration }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const hasAccess = await canAccessTask(ctx.db, user._id, taskId, "task.edit");
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Find active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first()

    if (!activeSession) {
      throw new Error("No active time tracking session found")
    }

    // Update the session with end time and duration
    await ctx.db.patch(activeSession._id, {
      endTime: Date.now(),
      duration: Math.max(duration, Date.now() - activeSession.startTime),
      updatedAt: Date.now()
    })

    return activeSession._id
  }
})

export const stopTimeTracking = mutation({
  args: {
    taskId: v.id("tasks"),
    duration: v.number()
  },
  handler: async (ctx, { taskId, duration }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const hasAccess = await canAccessTask(ctx.db, user._id, taskId, "task.edit");
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Find active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first()

    if (!activeSession) {
      throw new Error("No active time tracking session found")
    }

    // Calculate final duration
    const finalDuration = Math.max(duration, Date.now() - activeSession.startTime)

    // Update the session with end time and duration
    await ctx.db.patch(activeSession._id, {
      endTime: Date.now(),
      duration: finalDuration,
      updatedAt: Date.now()
    })

    // Update task's total time tracked
    const task = await ctx.db.get(taskId)
    if (task) {
      const currentTimeTracked = task.timeTracked || 0
      await ctx.db.patch(taskId, {
        timeTracked: currentTimeTracked + finalDuration,
        updatedAt: Date.now()
      })
    }

    return {
      timeEntryId: activeSession._id,
      totalDuration: finalDuration
    }
  }
});