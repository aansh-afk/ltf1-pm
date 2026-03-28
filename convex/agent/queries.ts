import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../lib/auth";
import { hasPermission } from "../auth/permissions";

/**
 * Get the triage queue: pending triage suggestions with their associated tasks.
 * Ordered by creation time descending (newest first).
 */
export const getTriageQueue = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("triageSuggestions"),
      _creationTime: v.number(),
      taskId: v.id("tasks"),
      workspaceId: v.id("workspaces"),
      projectId: v.id("projects"),
      suggestedType: v.optional(v.string()),
      suggestedPriority: v.optional(v.string()),
      suggestedAssigneeIds: v.optional(v.array(v.id("users"))),
      suggestedLabels: v.optional(v.array(v.string())),
      suggestedSprintId: v.optional(v.id("sprints")),
      duplicateOfTaskId: v.optional(v.id("tasks")),
      confidence: v.number(),
      reasoning: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("partial"),
        v.literal("auto_applied"),
      ),
      reviewedBy: v.optional(v.id("users")),
      reviewedAt: v.optional(v.number()),
      autoApplied: v.optional(v.boolean()),
      task: v.union(
        v.object({
          _id: v.id("tasks"),
          title: v.string(),
          description: v.optional(v.string()),
          reporterName: v.optional(v.string()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "task.view",
    );
    if (!hasAccess) {
      return [];
    }

    const maxResults = args.limit ?? 50;

    // Query pending suggestions for this workspace
    const suggestions = await ctx.db
      .query("triageSuggestions")
      .withIndex("by_workspaceId_and_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "pending"),
      )
      .order("desc")
      .take(maxResults);

    // Filter by project if specified
    const filtered = args.projectId
      ? suggestions.filter((s) => s.projectId === args.projectId)
      : suggestions;

    // Join with task data
    const results = await Promise.all(
      filtered.map(async (suggestion) => {
        const task = await ctx.db.get(suggestion.taskId);
        let reporterName: string | undefined;
        if (task) {
          const reporter = await ctx.db.get(task.reporterId);
          reporterName = reporter?.name;
        }

        return {
          ...suggestion,
          task: task
            ? {
                _id: task._id,
                title: task.title,
                description: task.description,
                reporterName,
              }
            : null,
        };
      }),
    );

    return results;
  },
});

/**
 * Get the triage suggestion for a specific task (if any).
 */
export const getTriageSuggestionForTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.union(
    v.object({
      _id: v.id("triageSuggestions"),
      _creationTime: v.number(),
      taskId: v.id("tasks"),
      workspaceId: v.id("workspaces"),
      projectId: v.id("projects"),
      suggestedType: v.optional(v.string()),
      suggestedPriority: v.optional(v.string()),
      suggestedAssigneeIds: v.optional(v.array(v.id("users"))),
      suggestedLabels: v.optional(v.array(v.string())),
      suggestedSprintId: v.optional(v.id("sprints")),
      duplicateOfTaskId: v.optional(v.id("tasks")),
      confidence: v.number(),
      reasoning: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("partial"),
        v.literal("auto_applied"),
      ),
      reviewedBy: v.optional(v.id("users")),
      reviewedAt: v.optional(v.number()),
      autoApplied: v.optional(v.boolean()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Look up task to get workspace for access check
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return null;
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      return null;
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      project.workspaceId,
      "task.view",
    );
    if (!hasAccess) {
      return null;
    }

    const suggestion = await ctx.db
      .query("triageSuggestions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();

    return suggestion ?? null;
  },
});

/**
 * Get triage statistics for a workspace.
 * Includes pending count, accepted/rejected/auto-applied counts (last 30 days),
 * and acceptance rate percentage.
 */
export const getTriageStats = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.object({
    pendingCount: v.number(),
    acceptedCount: v.number(),
    rejectedCount: v.number(),
    autoAppliedCount: v.number(),
    acceptanceRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {
        pendingCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        autoAppliedCount: 0,
        acceptanceRate: 0,
      };
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "task.view",
    );
    if (!hasAccess) {
      return {
        pendingCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        autoAppliedCount: 0,
        acceptanceRate: 0,
      };
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Count pending
    const pendingSuggestions = await ctx.db
      .query("triageSuggestions")
      .withIndex("by_workspaceId_and_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "pending"),
      )
      .collect();
    const pendingCount = pendingSuggestions.length;

    // Count accepted (last 30 days)
    const acceptedSuggestions = await ctx.db
      .query("triageSuggestions")
      .withIndex("by_workspaceId_and_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "accepted"),
      )
      .collect();
    const acceptedCount = acceptedSuggestions.filter(
      (s) => s._creationTime >= thirtyDaysAgo,
    ).length;

    // Count rejected (last 30 days)
    const rejectedSuggestions = await ctx.db
      .query("triageSuggestions")
      .withIndex("by_workspaceId_and_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "rejected"),
      )
      .collect();
    const rejectedCount = rejectedSuggestions.filter(
      (s) => s._creationTime >= thirtyDaysAgo,
    ).length;

    // Count auto-applied (last 30 days)
    const autoAppliedSuggestions = await ctx.db
      .query("triageSuggestions")
      .withIndex("by_workspaceId_and_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "auto_applied"),
      )
      .collect();
    const autoAppliedCount = autoAppliedSuggestions.filter(
      (s) => s._creationTime >= thirtyDaysAgo,
    ).length;

    // Calculate acceptance rate
    const totalReviewed = acceptedCount + rejectedCount;
    const acceptanceRate =
      totalReviewed > 0
        ? Math.round((acceptedCount / totalReviewed) * 100)
        : 0;

    return {
      pendingCount,
      acceptedCount,
      rejectedCount,
      autoAppliedCount,
      acceptanceRate,
    };
  },
});

/**
 * Get the agent activity feed for a workspace.
 * Joins with tasks and skills tables for display names.
 */
export const getAgentActivityFeed = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("agentActivities"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      type: v.union(
        v.literal("triage"),
        v.literal("skill_run"),
        v.literal("auto_assign"),
        v.literal("insight"),
        v.literal("skill_auto_apply"),
      ),
      taskId: v.optional(v.id("tasks")),
      skillId: v.optional(v.id("skills")),
      description: v.string(),
      metadata: v.optional(v.any()),
      taskTitle: v.optional(v.string()),
      skillName: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "task.view",
    );
    if (!hasAccess) {
      return [];
    }

    const maxResults = args.limit ?? 20;

    const activities = await ctx.db
      .query("agentActivities")
      .withIndex("by_workspaceId", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .order("desc")
      .take(maxResults);

    // Join with tasks and skills for display names
    const results = await Promise.all(
      activities.map(async (activity) => {
        let taskTitle: string | undefined;
        let skillName: string | undefined;

        if (activity.taskId) {
          const task = await ctx.db.get(activity.taskId);
          taskTitle = task?.title;
        }

        if (activity.skillId) {
          const skill = await ctx.db.get(activity.skillId);
          skillName = skill?.displayName ?? skill?.name;
        }

        return {
          ...activity,
          taskTitle,
          skillName,
        };
      }),
    );

    return results;
  },
});

/**
 * Get the workspace's triage mode setting.
 */
export const getTriageSettings = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.object({
    triageMode: v.union(
      v.literal("auto"),
      v.literal("review"),
      v.literal("off"),
    ),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { triageMode: "off" as const };
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "workspace.view",
    );
    if (!hasAccess) {
      return { triageMode: "off" as const };
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return { triageMode: "off" as const };
    }

    return {
      triageMode: workspace.settings.triageMode ?? ("off" as const),
    };
  },
});
