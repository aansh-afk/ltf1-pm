import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../auth/permissions";
import { getCurrentUser, getCurrentUserOrThrow } from "../lib/auth";

export const getProjectTasks = query({
  args: { 
    projectId: v.id("projects"),
    status: v.optional(v.array(v.string())),
    assigneeId: v.optional(v.id("users")),
    labels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
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
      filteredTasks = filteredTasks.filter(task => {
        // Support both old assigneeId and new assigneeIds
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          return task.assigneeIds.includes(args.assigneeId!);
        }
        return task.assigneeId === args.assigneeId;
      });
    }

    if (args.labels && args.labels.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.labels.some(label => args.labels!.includes(label))
      );
    }

    const tasksWithDetails = await Promise.all(
      filteredTasks.map(async (task) => {
        // Get all assignees
        let assignees: any[] = [];
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          assignees = await Promise.all(
            task.assigneeIds.map(id => ctx.db.get(id))
          );
          assignees = assignees.filter(Boolean);
        } else if (task.assigneeId) {
          // Fallback to old assigneeId for backward compatibility
          const assignee = await ctx.db.get(task.assigneeId);
          if (assignee) assignees = [assignee];
        }
        
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
          assignees,
          assignee: assignees[0] || null, // Keep for backward compatibility
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
    const user = await getCurrentUserOrThrow(ctx);

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

    // Get all assignees
    let assignees: any[] = [];
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      assignees = await Promise.all(
        task.assigneeIds.map(id => ctx.db.get(id))
      );
      assignees = assignees.filter(Boolean);
    } else if (task.assigneeId) {
      // Fallback to old assigneeId for backward compatibility
      const assignee = await ctx.db.get(task.assigneeId);
      if (assignee) assignees = [assignee];
    }
    
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
      .filter((q) => q.eq(q.field("targetId"), task._id))
      .order("desc")
      .collect();

    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = activity.actorId ? await ctx.db.get(activity.actorId) : null;
        return { ...activity, user };
      })
    );

    return {
      ...task,
      project,
      assignees,
      assignee: assignees[0] || null, // Keep for backward compatibility
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
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Bound the search to projects the user can actually see. Without a
    // companion index on the multi-assignee `assigneeIds` array we cannot
    // index-scan directly, but scoping by membership keeps the worst-case
    // read set proportional to the user's own workspace footprint instead
    // of every task across every tenant.
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const allowedWorkspaceIds = new Set(memberships.map((m) => m.workspaceId));
    if (args.workspaceId) {
      // Restrict to the requested workspace, but only if the caller actually
      // belongs to it.
      if (!allowedWorkspaceIds.has(args.workspaceId)) {
        return [];
      }
      allowedWorkspaceIds.clear();
      allowedWorkspaceIds.add(args.workspaceId);
    }

    if (allowedWorkspaceIds.size === 0) {
      return [];
    }

    // Pull projects per workspace via the by_workspace index, then collect
    // their tasks via the by_project index. Both paths are indexed reads.
    const projectsPerWs = await Promise.all(
      Array.from(allowedWorkspaceIds).map((wsId) =>
        ctx.db
          .query("projects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", wsId))
          .collect(),
      ),
    );
    const projects = projectsPerWs.flat();
    if (projects.length === 0) {
      return [];
    }

    const tasksPerProject = await Promise.all(
      projects.map((p) =>
        ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", p._id))
          .collect(),
      ),
    );
    const candidateTasks = tasksPerProject.flat();

    let tasks = candidateTasks.filter((task) => {
      if (task.assigneeIds && task.assigneeIds.includes(user._id)) {
        return true;
      }
      // Backward compatibility with the deprecated single-assignee field.
      if (task.assigneeId === user._id) {
        return true;
      }
      return false;
    });

    if (args.status && args.status.length > 0) {
      tasks = tasks.filter((task) => args.status!.includes(task.status));
    }

    const projectsById = new Map(projects.map((p) => [p._id, p]));
    const reporterIds = new Set(tasks.map((t) => t.reporterId));
    const reporters = await Promise.all(
      Array.from(reporterIds).map((id) => ctx.db.get(id)),
    );
    const reportersById = new Map(
      reporters.filter(Boolean).map((r) => [r!._id, r!]),
    );

    return tasks
      .map((task) => ({
        ...task,
        project: projectsById.get(task.projectId) ?? null,
        reporter: reportersById.get(task.reporterId) ?? null,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getTaskTimeEntries = query({
  args: {
    taskId: v.id("tasks")
  },
  handler: async (ctx, { taskId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .collect()

    return timeEntries.map(entry => ({
      ...entry,
      duration: entry.duration || (entry.endTime ? entry.endTime - entry.startTime : 0)
    }))
  }
})

export const getActiveTimeEntry = query({
  args: {
    taskId: v.id("tasks")
  },
  handler: async (ctx, { taskId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const activeEntry = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first()

    return activeEntry
  }
})

export const getFilteredTasks = query({
  args: {
    projectId: v.id("projects"),
    search: v.optional(v.string()),
    status: v.optional(v.array(v.string())),
    priority: v.optional(v.array(v.string())),
    type: v.optional(v.array(v.string())),
    assigneeIds: v.optional(v.array(v.string())),
    labels: v.optional(v.array(v.string())),
    dueDateStart: v.optional(v.string()),
    dueDateEnd: v.optional(v.string()),
    createdDateStart: v.optional(v.string()),
    createdDateEnd: v.optional(v.string()),
    hasTimeTracked: v.optional(v.boolean()),
    isOverdue: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
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

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    let filteredTasks = tasks;

    // Apply search filter
    if (args.search && args.search.trim() !== '') {
      const searchTerm = args.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.number.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (args.status && args.status.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        args.status!.includes(task.status)
      );
    }

    // Apply priority filter
    if (args.priority && args.priority.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        args.priority!.includes(task.priority)
      );
    }

    // Apply type filter
    if (args.type && args.type.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        args.type!.includes(task.type)
      );
    }

    // Apply assignee filter
    if (args.assigneeIds && args.assigneeIds.length > 0) {
      filteredTasks = filteredTasks.filter(task => {
        // Check for unassigned tasks
        if (args.assigneeIds!.includes('unassigned')) {
          const hasNoAssignees = (!task.assigneeIds || task.assigneeIds.length === 0) && !task.assigneeId;
          if (hasNoAssignees) return true;
        }
        
        // Check new assigneeIds array
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          return task.assigneeIds.some(id => args.assigneeIds!.includes(id));
        }
        
        // Fallback to old assigneeId for backward compatibility
        if (task.assigneeId && args.assigneeIds!.includes(task.assigneeId)) {
          return true;
        }
        
        return false;
      });
    }

    // Apply labels filter
    if (args.labels && args.labels.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.labels && task.labels.some(label => args.labels!.includes(label))
      );
    }

    // Apply due date range filter
    if (args.dueDateStart || args.dueDateEnd) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        
        const taskDueDate = new Date(task.dueDate);
        
        if (args.dueDateStart) {
          const startDate = new Date(args.dueDateStart);
          if (taskDueDate < startDate) return false;
        }
        
        if (args.dueDateEnd) {
          const endDate = new Date(args.dueDateEnd);
          endDate.setHours(23, 59, 59, 999); // End of day
          if (taskDueDate > endDate) return false;
        }
        
        return true;
      });
    }

    // Apply created date range filter
    if (args.createdDateStart || args.createdDateEnd) {
      filteredTasks = filteredTasks.filter(task => {
        const taskCreatedDate = new Date(task.createdAt);
        
        if (args.createdDateStart) {
          const startDate = new Date(args.createdDateStart);
          if (taskCreatedDate < startDate) return false;
        }
        
        if (args.createdDateEnd) {
          const endDate = new Date(args.createdDateEnd);
          endDate.setHours(23, 59, 59, 999); // End of day
          if (taskCreatedDate > endDate) return false;
        }
        
        return true;
      });
    }

    // Apply time tracked filter
    if (args.hasTimeTracked !== undefined) {
      filteredTasks = filteredTasks.filter(task => {
        const hasTime = task.timeTracked && task.timeTracked > 0;
        return args.hasTimeTracked ? hasTime : !hasTime;
      });
    }

    // Apply overdue filter
    if (args.isOverdue !== undefined && args.isOverdue) {
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') {
          return false;
        }
        return new Date(task.dueDate) < now;
      });
    }

    const tasksWithDetails = await Promise.all(
      filteredTasks.map(async (task) => {
        // Get all assignees
        let assignees: any[] = [];
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          assignees = await Promise.all(
            task.assigneeIds.map(id => ctx.db.get(id))
          );
          assignees = assignees.filter(Boolean);
        } else if (task.assigneeId) {
          // Fallback to old assigneeId for backward compatibility
          const assignee = await ctx.db.get(task.assigneeId);
          if (assignee) assignees = [assignee];
        }
        
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
          assignees,
          assignee: assignees[0] || null, // Keep for backward compatibility
          reporter,
          subtaskCount: subtasks.length,
          commentCount: comments.length,
        };
      })
    );

    return tasksWithDetails.sort((a, b) => a.position - b.position);
  },
});

export const getWorkspaceLabels = query({
  args: {
    workspaceId: v.id("workspaces")
  },
  handler: async (ctx, { workspaceId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      workspaceId,
      "task.view"
    );

    if (!hasAccess) {
      return [];
    }

    // Get all projects in workspace
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    // Get all tasks from these projects
    const allTasks = await Promise.all(
      projects.map(project =>
        ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect()
      )
    );

    // Extract unique labels
    const labelSet = new Set<string>();
    allTasks.flat().forEach(task => {
      if (task.labels) {
        task.labels.forEach(label => labelSet.add(label));
      }
    });

    return Array.from(labelSet).sort();
  }
})

export const getTasksByUser = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Restrict to self-only. Cross-user task enumeration must go through a
    // workspace/project-scoped API with proper permission checks.
    if (args.userId !== identity.subject) {
      return [];
    }

    // Find user by clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      return [];
    }

    // Scope to the caller's workspaces and use indexed task queries instead
    // of a full table scan.
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (memberships.length === 0) {
      return [];
    }

    const projectsPerWs = await Promise.all(
      memberships.map((m) =>
        ctx.db
          .query("projects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", m.workspaceId))
          .collect(),
      ),
    );
    const projects = projectsPerWs.flat();
    if (projects.length === 0) {
      return [];
    }

    const tasksPerProject = await Promise.all(
      projects.map((p) =>
        ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", p._id))
          .collect(),
      ),
    );
    const candidateTasks = tasksPerProject.flat();

    return candidateTasks.filter((task) => {
      if (task.assigneeIds && task.assigneeIds.includes(user._id)) {
        return true;
      }
      if (task.assigneeId === user._id) {
        return true;
      }
      if (task.reporterId === user._id) {
        return true;
      }
      return false;
    });
  },
})

export const getTasksByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Require workspace membership with task view permission. Without this
    // check, any authenticated user could enumerate task data for any
    // workspace ID they obtain or guess.
    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "task.view"
    );
    if (!hasAccess) {
      return [];
    }

    // Get all projects in the workspace
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Get all tasks for these projects
    const allTasks = await Promise.all(
      projects.map(project =>
        ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect()
      )
    );

    return allTasks.flat();
  },
})