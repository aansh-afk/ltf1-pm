import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Core activity logging mutation - internal function
export const logActivity = internalMutation({
  args: {
    type: v.union(
      // Task activities
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("task_status_changed"),
      v.literal("task_assigned"),
      v.literal("task_priority_changed"),
      v.literal("task_time_started"),
      v.literal("task_time_stopped"),
      v.literal("task_commented"),
      v.literal("task_blocked"),
      v.literal("task_unblocked"),

      // Team activities
      v.literal("member_joined"),
      v.literal("member_removed"),
      v.literal("member_role_changed"),

      // Project activities
      v.literal("project_created"),
      v.literal("project_updated"),
      v.literal("sprint_created"),
      v.literal("sprint_started"),
      v.literal("sprint_completed"),

      // Meeting activities
      v.literal("meeting_scheduled"),
      v.literal("meeting_completed"),
      v.literal("meeting_cancelled"),

      // Code activities (GitHub integration)
      v.literal("commit_pushed"),
      v.literal("pr_opened"),
      v.literal("pr_merged"),
      v.literal("pr_reviewed"),
      v.literal("pr_closed"),
      v.literal("issue_opened"),
      v.literal("issue_closed")
    ),
    projectId: v.optional(v.id("projects")),
    workspaceId: v.id("workspaces"),
    // actorId is now optional for webhook-originated activities where user may not be resolved
    actorId: v.optional(v.union(v.id("users"), v.null())),
    // actorName can be used when actorId is not available (e.g., "John Doe (GitHub)")
    actorName: v.optional(v.string()),
    targetType: v.union(
      v.literal("task"),
      v.literal("project"),
      v.literal("sprint"),
      v.literal("meeting"),
      v.literal("user"),
      v.literal("comment"),
      v.literal("github")
    ),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    description: v.string(),
    metadata: v.optional(v.object({
      oldValue: v.optional(v.string()),
      newValue: v.optional(v.string()),
      assignedTo: v.optional(v.id("users")),
      assignedToName: v.optional(v.string()),
      timeSpent: v.optional(v.number()),
      oldPriority: v.optional(v.string()),
      newPriority: v.optional(v.string()),
      extra: v.optional(v.any())
    }))
  },
  returns: v.id("activities"),
  handler: async (ctx, args) => {
    // Resolve actorName if actorId is provided but actorName is not
    let actorName = args.actorName;
    if (args.actorId && !actorName) {
      const actor = await ctx.db.get(args.actorId);
      actorName = actor?.name || actor?.email || "Unknown User";
    }

    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      projectId: args.projectId,
      workspaceId: args.workspaceId,
      actorId: args.actorId || undefined,
      actorName: actorName || "Unknown",
      targetType: args.targetType,
      targetId: args.targetId,
      targetName: args.targetName,
      description: args.description,
      metadata: args.metadata,
      timestamp: Date.now()
    });

    return activityId;
  }
});