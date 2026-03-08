import { defineTable } from "convex/server";
import { v } from "convex/values";

// Activity types that can be tracked
export const activityTypes = [
  // Task activities
  "task_created",
  "task_updated",
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

  // Code activities (GitHub integration)
  "commit_pushed",
  "pr_opened",
  "pr_merged",
  "pr_reviewed",
  "pr_closed",
  "issue_opened",
  "issue_closed"
] as const;

export type ActivityType = typeof activityTypes[number];

// NOTE: This schema definition is kept in sync with convex/schema.ts activities table.
// The canonical schema is in convex/schema.ts — update both if changing fields.
export const activityTable = defineTable({
  type: v.string(), // One of activityTypes above, kept as v.string() for forward-compatibility
  workspaceId: v.id("workspaces"),
  projectId: v.optional(v.id("projects")),

  // Actor (who performed the action) — optional for webhook-originated activities
  actorId: v.optional(v.id("users")),
  actorName: v.optional(v.string()),

  // Target (what was acted upon)
  targetType: v.optional(v.string()), // "task", "project", "sprint", "meeting", "user", "comment", "github"
  targetId: v.optional(v.string()), // Polymorphic reference — may be any table's ID
  targetName: v.optional(v.string()), // Display name of target

  // Activity metadata
  description: v.optional(v.string()), // Human readable description
  metadata: v.optional(v.any()), // Truly dynamic: oldValue, newValue, assignedTo, timeSpent, extra, etc.

  // Timestamps
  timestamp: v.optional(v.number()),
})
.index("by_type", ["type", "timestamp"])
.index("by_project", ["projectId", "timestamp"])
.index("by_workspace", ["workspaceId", "timestamp"])
.index("by_actor", ["actorId", "timestamp"]);
