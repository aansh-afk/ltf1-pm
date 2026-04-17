import { mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  canAccessTask,
  requirePermission,
} from "../auth/permissions";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  taskAssigned,
  taskUnassigned,
  taskCompleted,
  taskStatusChanged,
} from "../email/templates";
// Centralized dispatch handles in-app + email + push routing
import { getCurrentUserOrThrow } from "../lib/auth";
import {
  taskStatusValidator,
  taskPriorityValidator,
  taskTypeValidator,
} from "../lib/validators";

export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    type: taskTypeValidator,
    priority: v.optional(taskPriorityValidator),
    assigneeIds: v.optional(v.array(v.id("users"))),
    labels: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    estimate: v.optional(
      v.object({
        points: v.optional(v.number()),
        hours: v.optional(v.number()),
      }),
    ),
    parentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(
      ctx.db,
      user._id,
      project.workspaceId,
      "task.create",
    );

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const maxNumber = tasks.reduce(
      (max, task) => Math.max(max, task.number),
      0,
    );
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

    // Log task creation activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "task_created",
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "task",
      targetId: taskId,
      targetName: args.title,
      description: `created task "${args.title}"`,
      metadata: undefined,
    });

    // Schedule agent triage
    await ctx.scheduler.runAfter(0, internal.agent.triage.triageTask, {
      taskId,
      workspaceId: project.workspaceId,
      projectId: args.projectId,
    });

    // Schedule auto-trigger skills matching (bug-triage etc.)
    await ctx.scheduler.runAfter(
      0,
      internal.skills.execution.checkAutoSkills,
      { taskId, workspaceId: project.workspaceId },
    );

    // Send notifications to all assignees via centralized dispatch
    if (args.assigneeIds && args.assigneeIds.length > 0) {
      const taskKey = `${(project as any).settings?.taskPrefix || project.key}-${maxNumber + 1}`;
      for (const assigneeId of args.assigneeIds) {
        if (assigneeId !== user._id) {
          await ctx.scheduler.runAfter(
            0,
            internal.notifications.dispatch.dispatch,
            {
              recipientUserId: assigneeId,
              workspaceId: project.workspaceId,
              type: "task_assigned",
              title: "New Task Assigned",
              body: `You've been assigned to "${args.title}"`,
              link: `/projects/${(project as any).key}/tasks/${taskKey}`,
              actorId: user._id,
              entityId: taskId,
              entityType: "task",
              emailData: {
                assignerName: user.name || user.email,
                taskTitle: args.title,
                projectName: project.name,
                taskKey,
                priority: args.priority || "medium",
                workspaceSlug: "",
                projectKey: (project as any).key || "",
              },
            },
          );
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
    status: v.optional(taskStatusValidator),
    priority: v.optional(taskPriorityValidator),
    assigneeIds: v.optional(v.array(v.id("users"))),
    labels: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    estimate: v.optional(
      v.object({
        points: v.optional(v.number()),
        hours: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasAccess = await canAccessTask(
      ctx.db,
      user._id,
      args.taskId,
      "task.edit",
    );
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

      const added = newAssigneeIds.filter(
        (id) => !previousAssigneeIds.includes(id),
      );
      const removed = previousAssigneeIds.filter(
        (id) => !newAssigneeIds.includes(id),
      );

      if (added.length > 0 || removed.length > 0) {
        activityMetadata.assigneesChanged = {
          added: added.length,
          removed: removed.length,
          total: newAssigneeIds.length,
        };
      }
    }

    // Log specific activity based on what was changed
    if (args.status !== undefined && task.status !== args.status) {
      await ctx.runMutation(internal.activities.mutations.logActivity, {
        type: "task_status_changed",
        projectId: task.projectId,
        workspaceId: project.workspaceId,
        actorId: user._id,
        actorName: user.name || user.email,
        targetType: "task",
        targetId: args.taskId,
        targetName: task.title,
        description: `changed status of "${task.title}" from ${task.status} to ${args.status}`,
        metadata: {
          oldValue: task.status,
          newValue: args.status,
        },
      });

      if (args.status === "done") {
        await ctx.runMutation(internal.activities.mutations.logActivity, {
          type: "task_completed",
          projectId: task.projectId,
          workspaceId: project.workspaceId,
          actorId: user._id,
          actorName: user.name || user.email,
          targetType: "task",
          targetId: args.taskId,
          targetName: task.title,
          description: `completed task "${task.title}"`,
          metadata: undefined,
        });

        // Notify all assignees about completion via dispatch
        const completionAssignees = args.assigneeIds || task.assigneeIds || [];
        const taskKey = `${(project as any).settings?.taskPrefix || (project as any).key}-${task.number}`;
        for (const aid of completionAssignees) {
          if (aid !== user._id) {
            await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
              recipientUserId: aid,
              workspaceId: project.workspaceId,
              type: "task_assigned",
              title: "Task Completed",
              body: `"${task.title}" has been completed`,
              link: `/projects/${(project as any).key}/tasks/${taskKey}`,
              actorId: user._id,
              entityId: args.taskId,
              entityType: "task",
              emailData: {
                completedByName: user.name || user.email,
                taskTitle: task.title,
                taskKey,
                projectName: project.name,
              },
            });
          }
        }
      }

      // Notify assignees about status change (skip if going to "done" — handled above)
      if (args.status !== "done") {
        const statusAssignees = task.assigneeIds || [];
        const taskKey2 = `${(project as any).settings?.taskPrefix || (project as any).key}-${task.number}`;
        for (const aid of statusAssignees) {
          if (aid !== user._id) {
            await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
              recipientUserId: aid,
              workspaceId: project.workspaceId,
              type: "task_assigned",
              title: "Task Status Changed",
              body: `"${task.title}" moved from ${task.status} to ${args.status}`,
              link: `/projects/${(project as any).key}/tasks/${taskKey2}`,
              actorId: user._id,
              entityId: args.taskId,
              entityType: "task",
              emailData: {
                changedByName: user.name || user.email,
                taskTitle: task.title,
                taskKey: taskKey2,
                oldStatus: task.status,
                newStatus: args.status!,
              },
            });
          }
        }
      }
    }

    if (args.assigneeIds !== undefined) {
      const previousAssigneeIds = task.assigneeIds || [];
      const newAssigneeIds = args.assigneeIds || [];

      const added = newAssigneeIds.filter(
        (id) => !previousAssigneeIds.includes(id),
      );

      // Log assignments for newly assigned users
      for (const assigneeId of added) {
        const assignee = await ctx.db.get(assigneeId);
        if (assignee) {
          await ctx.runMutation(internal.activities.mutations.logActivity, {
            type: "task_assigned",
            projectId: task.projectId,
            workspaceId: project.workspaceId,
            actorId: user._id,
            actorName: user.name || user.email,
            targetType: "task",
            targetId: args.taskId,
            targetName: task.title,
            description: `assigned "${task.title}" to ${assignee.name || assignee.email}`,
            metadata: {
              assignedTo: assigneeId,
              assignedToName: assignee.name || assignee.email,
            },
          });
        }
      }
    }

    // Send notifications via centralized dispatch
    if (args.assigneeIds !== undefined) {
      const previousAssignees = new Set(task.assigneeIds || []);
      const newAssignees = new Set(args.assigneeIds);
      const tkKey = `${(project as any).settings?.taskPrefix || (project as any).key}-${task.number}`;

      // Notify newly assigned users
      for (const assigneeId of newAssignees) {
        if (!previousAssignees.has(assigneeId) && assigneeId !== user._id) {
          await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
            recipientUserId: assigneeId,
            workspaceId: project.workspaceId,
            type: "task_assigned",
            title: "Task Assigned",
            body: `You've been assigned to "${task.title}"`,
            link: `/projects/${(project as any).key}/tasks/${tkKey}`,
            actorId: user._id,
            entityId: args.taskId,
            entityType: "task",
            emailData: {
              assignerName: user.name || user.email,
              taskTitle: task.title,
              projectName: project.name,
              taskKey: tkKey,
              priority: task.priority,
              workspaceSlug: "",
              projectKey: (project as any).key || "",
            },
          });
        }
      }

      // Notify unassigned users
      for (const assigneeId of previousAssignees) {
        if (!newAssignees.has(assigneeId) && assigneeId !== user._id) {
          await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
            recipientUserId: assigneeId,
            workspaceId: project.workspaceId,
            type: "task_unassigned",
            title: "Task Unassigned",
            body: `You've been unassigned from "${task.title}"`,
            link: `/projects/${(project as any).key}/tasks/${tkKey}`,
            actorId: user._id,
            entityId: args.taskId,
            entityType: "task",
            emailData: {
              taskTitle: task.title,
              taskKey: tkKey,
              removedByName: user.name || user.email,
            },
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
    const user = await getCurrentUserOrThrow(ctx);

    const hasAccess = await canAccessTask(
      ctx.db,
      user._id,
      args.taskId,
      "task.delete",
    );
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

    // Note: Task deletion activities could be logged here if needed
    // For now, we focus on core team activities (create, update, assign, complete)

    return args.taskId;
  },
});

export const moveTask = mutation({
  args: {
    taskId: v.id("tasks"),
    status: taskStatusValidator,
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasAccess = await canAccessTask(
      ctx.db,
      user._id,
      args.taskId,
      "task.edit",
    );
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
    taskId: v.id("tasks"),
  },
  handler: async (ctx, { taskId }) => {
    const user = await getCurrentUserOrThrow(ctx);

    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const hasAccess = await canAccessTask(
      ctx.db,
      user._id,
      taskId,
      "task.edit",
    );
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Check if there's already an active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) =>
        q.eq("taskId", taskId).eq("userId", user.clerkId),
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first();

    if (activeSession) {
      throw new Error("Time tracking already active for this task");
    }

    // Create new time entry
    const timeEntryId = await ctx.db.insert("timeEntries", {
      taskId,
      userId: user.clerkId,
      startTime: Date.now(),
      description: `Working on: ${task.title}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update task status to in-progress if not already
    if (task.status !== "in_progress") {
      await ctx.db.patch(taskId, {
        status: "in_progress",
        updatedAt: Date.now(),
      });
    }

    return timeEntryId;
  },
});

export const pauseTimeTracking = mutation({
  args: {
    taskId: v.id("tasks"),
    duration: v.number(),
  },
  handler: async (ctx, { taskId, duration }) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasAccess = await canAccessTask(
      ctx.db,
      user._id,
      taskId,
      "task.edit",
    );
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Find active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) =>
        q.eq("taskId", taskId).eq("userId", user.clerkId),
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first();

    if (!activeSession) {
      throw new Error("No active time tracking session found");
    }

    // Update the session with end time and duration
    await ctx.db.patch(activeSession._id, {
      endTime: Date.now(),
      duration: Math.max(duration, Date.now() - activeSession.startTime),
      updatedAt: Date.now(),
    });

    return activeSession._id;
  },
});

export const stopTimeTracking = mutation({
  args: {
    taskId: v.id("tasks"),
    duration: v.number(),
  },
  handler: async (ctx, { taskId, duration }) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasAccess = await canAccessTask(
      ctx.db,
      user._id,
      taskId,
      "task.edit",
    );
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Find active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) =>
        q.eq("taskId", taskId).eq("userId", user.clerkId),
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first();

    if (!activeSession) {
      throw new Error("No active time tracking session found");
    }

    // Calculate final duration
    const finalDuration = Math.max(
      duration,
      Date.now() - activeSession.startTime,
    );

    // Update the session with end time and duration
    await ctx.db.patch(activeSession._id, {
      endTime: Date.now(),
      duration: finalDuration,
      updatedAt: Date.now(),
    });

    // Update task's total time tracked
    const task = await ctx.db.get(taskId);
    if (task) {
      const currentTimeTracked = task.timeTracked || 0;
      await ctx.db.patch(taskId, {
        timeTracked: currentTimeTracked + finalDuration,
        updatedAt: Date.now(),
      });
    }

    return {
      timeEntryId: activeSession._id,
      totalDuration: finalDuration,
    };
  },
});

export const bulkUpdateTasks = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
    updates: v.object({
      status: v.optional(taskStatusValidator),
      priority: v.optional(taskPriorityValidator),
      assigneeIds: v.optional(v.array(v.id("users"))),
      labels: v.optional(v.array(v.string())),
      sprintId: v.optional(v.id("sprints")),
    }),
    autoRebalance: v.optional(
      v.object({
        projectId: v.id("projects"),
        overloadedThreshold: v.optional(v.number()),
        targetLoad: v.optional(v.number()),
      }),
    ),
  },
  returns: v.object({ updatedCount: v.number() }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Optional: server-side automatic workload rebalance
    if (args.autoRebalance) {
      const project = await ctx.db.get(args.autoRebalance.projectId);
      if (!project) throw new Error("Project not found");

      await requirePermission(
        ctx.db,
        user._id,
        project.workspaceId,
        "task.edit",
      );

      const projectMembers = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) =>
          q.eq("projectId", args.autoRebalance!.projectId),
        )
        .collect();

      const assignableMemberIds = projectMembers
        .filter(
          (member) => member.status === "active" && member.role !== "viewer",
        )
        .map((member) => member.userId);

      if (assignableMemberIds.length < 2) {
        return { updatedCount: 0 };
      }

      const memberIdByKey: Record<string, Id<"users">> = {};
      for (const memberId of assignableMemberIds) {
        memberIdByKey[String(memberId)] = memberId;
      }
      const memberIdSet = new Set(Object.keys(memberIdByKey));

      const projectTasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) =>
          q.eq("projectId", args.autoRebalance!.projectId),
        )
        .collect();

      const movableTasks = projectTasks.filter((task) => {
        if (task.status === "done" || task.status === "cancelled") {
          return false;
        }
        const assignees = task.assigneeIds || [];
        if (assignees.length !== 1) {
          return false;
        }
        return memberIdSet.has(String(assignees[0]));
      });

      if (movableTasks.length === 0) {
        return { updatedCount: 0 };
      }

      const loadByMember: Record<string, number> = {};
      for (const memberId of assignableMemberIds) {
        loadByMember[String(memberId)] = 0;
      }

      for (const task of movableTasks) {
        const ownerId = task.assigneeIds?.[0];
        if (
          ownerId !== undefined &&
          loadByMember[String(ownerId)] !== undefined
        ) {
          loadByMember[String(ownerId)] += 1;
        }
      }

      const targetLoad =
        args.autoRebalance.targetLoad ??
        Math.max(
          1,
          Math.ceil(movableTasks.length / assignableMemberIds.length),
        );
      const overloadCutoff = Math.max(
        targetLoad,
        args.autoRebalance.overloadedThreshold ?? targetLoad,
      );

      const statusRank: Record<string, number> = {
        backlog: 0,
        todo: 1,
        in_progress: 2,
        in_review: 3,
      };
      const priorityRank: Record<string, number> = {
        low: 0,
        medium: 1,
        high: 2,
        urgent: 3,
      };

      const tasksByOwner: Record<
        string,
        Array<(typeof movableTasks)[number]>
      > = {};
      for (const task of movableTasks) {
        const ownerId = task.assigneeIds?.[0];
        if (!ownerId) continue;
        const key = String(ownerId);
        if (!tasksByOwner[key]) {
          tasksByOwner[key] = [];
        }
        tasksByOwner[key].push(task);
      }

      for (const ownerId of Object.keys(tasksByOwner)) {
        tasksByOwner[ownerId].sort((a, b) => {
          const statusDiff =
            (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
          if (statusDiff !== 0) return statusDiff;

          const priorityDiff =
            (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
          if (priorityDiff !== 0) return priorityDiff;

          return (a.updatedAt || 0) - (b.updatedAt || 0);
        });
      }

      let updatedCount = 0;
      const movedTaskIds = new Set<string>();
      const maxMoves = movableTasks.length;

      for (let i = 0; i < maxMoves; i++) {
        const sourceMemberId = assignableMemberIds
          .map((id) => String(id))
          .sort((a, b) => loadByMember[b] - loadByMember[a])
          .find((id) => loadByMember[id] > overloadCutoff);

        const targetMemberId = assignableMemberIds
          .map((id) => String(id))
          .sort((a, b) => loadByMember[a] - loadByMember[b])
          .find((id) => loadByMember[id] < targetLoad);

        if (!sourceMemberId || !targetMemberId) {
          break;
        }

        const sourceTasks = tasksByOwner[sourceMemberId] || [];
        const taskToMove = sourceTasks.find(
          (task) => !movedTaskIds.has(String(task._id)),
        );

        if (!taskToMove) {
          break;
        }

        const targetAssigneeId = memberIdByKey[targetMemberId];
        if (!targetAssigneeId) {
          continue;
        }

        await ctx.db.patch(taskToMove._id, {
          assigneeIds: [targetAssigneeId],
          assigneeId: undefined,
          updatedAt: Date.now(),
        });

        movedTaskIds.add(String(taskToMove._id));
        loadByMember[sourceMemberId] -= 1;
        loadByMember[targetMemberId] += 1;
        updatedCount += 1;
      }

      return { updatedCount };
    }

    // Filter out undefined fields from updates
    const cleanUpdates: Record<string, unknown> = {};
    if (args.updates.status !== undefined)
      cleanUpdates.status = args.updates.status;
    if (args.updates.priority !== undefined)
      cleanUpdates.priority = args.updates.priority;
    if (args.updates.assigneeIds !== undefined)
      cleanUpdates.assigneeIds = args.updates.assigneeIds;
    if (args.updates.labels !== undefined)
      cleanUpdates.labels = args.updates.labels;
    if (args.updates.sprintId !== undefined)
      cleanUpdates.sprintId = args.updates.sprintId;

    let updatedCount = 0;
    for (const taskId of args.taskIds) {
      const task = await ctx.db.get(taskId);
      if (!task) continue;
      const project = await ctx.db.get(task.projectId);
      if (!project) continue;
      await requirePermission(
        ctx.db,
        user._id,
        project.workspaceId,
        "task.edit",
      );
      await ctx.db.patch(taskId, cleanUpdates);
      updatedCount++;
    }

    return { updatedCount };
  },
});

export const bulkDeleteTasks = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
  },
  returns: v.object({ deletedCount: v.number() }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    let deletedCount = 0;
    for (const taskId of args.taskIds) {
      const task = await ctx.db.get(taskId);
      if (!task) continue;
      const project = await ctx.db.get(task.projectId);
      if (!project) continue;
      await requirePermission(
        ctx.db,
        user._id,
        project.workspaceId,
        "task.delete",
      );
      await ctx.db.delete(taskId);
      deletedCount++;
    }

    return { deletedCount };
  },
});
