import { defineTable } from "convex/server";
import { v } from "convex/values";

// Activity types that can be tracked
export const activityTypes = [
  // Task activities
  "task_created",
  "task_completed", 
  "task_status_changed",
  "task_assigned",
  "task_priority_changed",
  "task_time_started",
  "task_time_stopped",
  "task_commented",
  "task_blocked",
  "task_unblocked",
  
  // Team activities
  "member_joined",
  "member_removed",
  "member_role_changed",
  
  // Project activities  
  "project_created",
  "project_updated",
  "sprint_created",
  "sprint_started",
  "sprint_completed",
  
  // Meeting activities
  "meeting_scheduled",
  "meeting_completed",
  "meeting_cancelled",
  
  // Code activities (for future GitHub integration)
  "commit_pushed",
  "pr_opened",
  "pr_merged",
  "pr_reviewed"
] as const;

export type ActivityType = typeof activityTypes[number];

export const activityTable = defineTable({
  // Core activity fields
  type: v.union(...activityTypes.map(type => v.literal(type))),
  projectId: v.id("projects"),
  workspaceId: v.id("workspaces"),
  
  // Actor (who performed the action)
  actorId: v.id("users"),
  actorName: v.string(),
  
  // Target (what was acted upon)
  targetType: v.union(
    v.literal("task"),
    v.literal("project"), 
    v.literal("sprint"),
    v.literal("meeting"),
    v.literal("user"),
    v.literal("comment")
  ),
  targetId: v.optional(v.string()), // ID of the target entity
  targetName: v.optional(v.string()), // Display name of target
  
  // Activity metadata
  description: v.string(), // Human readable description
  metadata: v.optional(v.object({
    // For status changes
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    
    // For assignments
    assignedTo: v.optional(v.id("users")),
    assignedToName: v.optional(v.string()),
    
    // For time tracking
    timeSpent: v.optional(v.number()),
    
    // For priority changes
    oldPriority: v.optional(v.string()),
    newPriority: v.optional(v.string()),
    
    // For any additional context
    extra: v.optional(v.any())
  })),
  
  // Timestamps
  timestamp: v.number(),
})
.index("by_project", ["projectId", "timestamp"])
.index("by_workspace", ["workspaceId", "timestamp"])  
.index("by_actor", ["actorId", "timestamp"])
.index("by_target", ["targetType", "targetId", "timestamp"])
.index("by_type", ["type", "timestamp"]);