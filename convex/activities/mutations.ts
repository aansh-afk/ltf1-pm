import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Core activity logging mutation - internal function
export const logActivity = internalMutation({
  args: {
    type: v.union(
      // Task activities
      v.literal("task_created"),
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
      
      // Code activities (for future GitHub integration)
      v.literal("commit_pushed"),
      v.literal("pr_opened"),
      v.literal("pr_merged"),
      v.literal("pr_reviewed")
    ),
    projectId: v.optional(v.id("projects")),
    workspaceId: v.id("workspaces"),
    actorId: v.id("users"),
    actorName: v.string(),
    targetType: v.union(
      v.literal("task"),
      v.literal("project"), 
      v.literal("sprint"),
      v.literal("meeting"),
      v.literal("user"),
      v.literal("comment")
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
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("activities", {
      ...args,
      timestamp: Date.now()
    });
    
    return activityId;
  }
});