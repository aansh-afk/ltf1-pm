import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../auth/permissions";
import { getCurrentUserOrThrow } from "../lib/auth";

export const getProjectSprints = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const canView = await hasPermission(ctx.db, user._id, project.workspaceId, "project.view");
    if (!canView) {
      throw new Error("You don't have permission to view this project");
    }

    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    // Get task counts for each sprint
    const sprintsWithStats = await Promise.all(
      sprints.map(async (sprint) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .collect();

        const taskStats = {
          total: tasks.length,
          todo: tasks.filter(t => t.status === "todo" || t.status === "backlog").length,
          inProgress: tasks.filter(t => t.status === "in_progress").length,
          inReview: tasks.filter(t => t.status === "in_review").length,
          done: tasks.filter(t => t.status === "done").length,
        };

        const totalPoints = tasks.reduce((sum, task) => sum + (task.estimate?.points || 0), 0);
        const completedPoints = tasks
          .filter(t => t.status === "done")
          .reduce((sum, task) => sum + (task.estimate?.points || 0), 0);

        return {
          ...sprint,
          taskStats,
          totalPoints,
          completedPoints,
          progress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
        };
      })
    );

    return sprintsWithStats;
  },
});

export const getCurrentSprint = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const canView = await hasPermission(ctx.db, user._id, project.workspaceId, "project.view");
    if (!canView) {
      throw new Error("You don't have permission to view this project");
    }

    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_project_and_status", (q) => q.eq("projectId", args.projectId).eq("status", "active"))
      .first();

    if (!activeSprint) {
      return null;
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", activeSprint._id))
      .collect();

    // Get assignee information
    const tasksWithAssignees = await Promise.all(
      tasks.map(async (task) => {
        let assigneeNames: string[] = [];
        // Get all assignees
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          const assignees = await Promise.all(
            task.assigneeIds.map(id => ctx.db.get(id))
          );
          assigneeNames = assignees
            .filter(Boolean)
            .map(a => a!.name);
        } else if (task.assigneeId) {
          // Fallback to old assigneeId for backward compatibility
          const assignee = await ctx.db.get(task.assigneeId);
          if (assignee) assigneeNames = [assignee.name];
        }
        return {
          ...task,
          key: `${project.key}-${task.number}`,
          assigneeNames,
          assigneeName: assigneeNames[0] || null, // Keep for backward compatibility
        };
      })
    );

    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "todo" || t.status === "backlog").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      inReview: tasks.filter(t => t.status === "in_review").length,
      done: tasks.filter(t => t.status === "done").length,
    };

    const totalPoints = tasks.reduce((sum, task) => sum + (task.estimate?.points || 0), 0);
    const completedPoints = tasks
      .filter(t => t.status === "done")
      .reduce((sum, task) => sum + (task.estimate?.points || 0), 0);

    const now = Date.now();
    const sprintDuration = activeSprint.endDate - activeSprint.startDate;
    const elapsed = now - activeSprint.startDate;
    const daysRemaining = Math.max(0, Math.ceil((activeSprint.endDate - now) / (1000 * 60 * 60 * 24)));
    const percentComplete = Math.min(100, Math.round((elapsed / sprintDuration) * 100));

    return {
      ...activeSprint,
      tasks: tasksWithAssignees,
      taskStats,
      totalPoints,
      completedPoints,
      progress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
      daysRemaining,
      percentComplete,
    };
  },
});

export const getSprintById = query({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const canView = await hasPermission(ctx.db, user._id, project.workspaceId, "project.view");
    if (!canView) {
      throw new Error("You don't have permission to view this sprint");
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();

    const tasksWithAssignees = await Promise.all(
      tasks.map(async (task) => {
        let assigneeNames: string[] = [];
        // Get all assignees
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          const assignees = await Promise.all(
            task.assigneeIds.map(id => ctx.db.get(id))
          );
          assigneeNames = assignees
            .filter(Boolean)
            .map(a => a!.name);
        } else if (task.assigneeId) {
          // Fallback to old assigneeId for backward compatibility
          const assignee = await ctx.db.get(task.assigneeId);
          if (assignee) assigneeNames = [assignee.name];
        }
        return {
          ...task,
          key: `${project.key}-${task.number}`,
          assigneeNames,
          assigneeName: assigneeNames[0] || null, // Keep for backward compatibility
        };
      })
    );

    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "todo" || t.status === "backlog").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      inReview: tasks.filter(t => t.status === "in_review").length,
      done: tasks.filter(t => t.status === "done").length,
    };

    const totalPoints = tasks.reduce((sum, task) => sum + (task.estimate?.points || 0), 0);
    const completedPoints = tasks
      .filter(t => t.status === "done")
      .reduce((sum, task) => sum + (task.estimate?.points || 0), 0);

    return {
      ...sprint,
      project,
      tasks: tasksWithAssignees,
      taskStats,
      totalPoints,
      completedPoints,
      progress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
    };
  },
});

export const getBacklogTasks = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const canView = await hasPermission(ctx.db, user._id, project.workspaceId, "project.view");
    if (!canView) {
      throw new Error("You don't have permission to view this project");
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("sprintId"), undefined))
      .collect();

    const tasksWithAssignees = await Promise.all(
      tasks.map(async (task) => {
        let assigneeNames: string[] = [];
        // Get all assignees
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          const assignees = await Promise.all(
            task.assigneeIds.map(id => ctx.db.get(id))
          );
          assigneeNames = assignees
            .filter(Boolean)
            .map(a => a!.name);
        } else if (task.assigneeId) {
          // Fallback to old assigneeId for backward compatibility
          const assignee = await ctx.db.get(task.assigneeId);
          if (assignee) assigneeNames = [assignee.name];
        }
        return {
          ...task,
          key: `${project.key}-${task.number}`,
          assigneeNames,
          assigneeName: assigneeNames[0] || null, // Keep for backward compatibility
        };
      })
    );

    return tasksWithAssignees.sort((a, b) => b.createdAt - a.createdAt);
  },
});