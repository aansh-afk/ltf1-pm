import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Helper function to get user info for activity logging
async function getUser(ctx: any, clerkId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
}

// Core activity logging mutation
export const logActivity = mutation({
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
    projectId: v.id("projects"),
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

// Task-specific activity loggers
export const logTaskActivity = mutation({
  args: {
    type: v.union(
      v.literal("task_created"),
      v.literal("task_completed"), 
      v.literal("task_status_changed"),
      v.literal("task_assigned"),
      v.literal("task_priority_changed"),
      v.literal("task_time_started"),
      v.literal("task_time_stopped"),
      v.literal("task_commented"),
      v.literal("task_blocked"),
      v.literal("task_unblocked")
    ),
    taskId: v.id("tasks"),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUser(ctx, identity.subject);
    
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Generate description based on activity type
    let description = "";
    switch (args.type) {
      case "task_created":
        description = `created task "${task.title}"`;
        break;
      case "task_completed":
        description = `completed task "${task.title}"`;
        break;
      case "task_status_changed":
        description = `changed status of "${task.title}" from ${args.metadata?.oldValue || 'unknown'} to ${args.metadata?.newValue || 'unknown'}`;
        break;
      case "task_assigned":
        description = `assigned "${task.title}" to ${args.metadata?.assignedToName || 'someone'}`;
        break;
      case "task_priority_changed":
        description = `changed priority of "${task.title}" from ${args.metadata?.oldPriority || 'unknown'} to ${args.metadata?.newPriority || 'unknown'}`;
        break;
      case "task_time_started":
        description = `started working on "${task.title}"`;
        break;
      case "task_time_stopped":
        description = `stopped working on "${task.title}"`;
        break;
      case "task_commented":
        description = `commented on "${task.title}"`;
        break;
      case "task_blocked":
        description = `blocked task "${task.title}"`;
        break;
      case "task_unblocked":
        description = `unblocked task "${task.title}"`;
        break;
    }

    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      projectId: task.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "task",
      targetId: args.taskId,
      targetName: task.title,
      description: description,
      metadata: args.metadata,
      timestamp: Date.now()
    });

    return activityId;
  }
});

// Team-specific activity loggers
export const logTeamActivity = mutation({
  args: {
    type: v.union(
      v.literal("member_joined"),
      v.literal("member_removed"),
      v.literal("member_role_changed")
    ),
    projectId: v.id("projects"),
    targetUserId: v.id("users"),
    targetUserName: v.string(),
    metadata: v.optional(v.object({
      oldValue: v.optional(v.string()),
      newValue: v.optional(v.string()),
      extra: v.optional(v.any())
    }))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUser(ctx, identity.subject);
    
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Generate description based on activity type
    let description = "";
    switch (args.type) {
      case "member_joined":
        description = `${args.targetUserName} joined the project`;
        break;
      case "member_removed":
        description = `removed ${args.targetUserName} from the project`;
        break;
      case "member_role_changed":
        description = `changed ${args.targetUserName}'s role from ${args.metadata?.oldValue || 'unknown'} to ${args.metadata?.newValue || 'unknown'}`;
        break;
    }

    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "user",
      targetId: args.targetUserId,
      targetName: args.targetUserName,
      description: description,
      metadata: args.metadata,
      timestamp: Date.now()
    });

    return activityId;
  }
});

// Project-specific activity loggers
export const logProjectActivity = mutation({
  args: {
    type: v.union(
      v.literal("project_created"),
      v.literal("project_updated"),
      v.literal("sprint_created"),
      v.literal("sprint_started"),
      v.literal("sprint_completed")
    ),
    projectId: v.id("projects"),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    metadata: v.optional(v.object({
      oldValue: v.optional(v.string()),
      newValue: v.optional(v.string()),
      extra: v.optional(v.any())
    }))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUser(ctx, identity.subject);
    
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Generate description based on activity type
    let description = "";
    let targetType: "project" | "sprint" = "project";
    
    switch (args.type) {
      case "project_created":
        description = `created project "${project.name}"`;
        break;
      case "project_updated":
        description = `updated project "${project.name}"`;
        break;
      case "sprint_created":
        description = `created sprint "${args.targetName || 'Unnamed Sprint'}"`;
        targetType = "sprint";
        break;
      case "sprint_started":
        description = `started sprint "${args.targetName || 'Unnamed Sprint'}"`;
        targetType = "sprint";
        break;
      case "sprint_completed":
        description = `completed sprint "${args.targetName || 'Unnamed Sprint'}"`;
        targetType = "sprint";
        break;
    }

    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: targetType,
      targetId: args.targetId || args.projectId,
      targetName: args.targetName || project.name,
      description: description,
      metadata: args.metadata,
      timestamp: Date.now()
    });

    return activityId;
  }
});

// Meeting-specific activity loggers
export const logMeetingActivity = mutation({
  args: {
    type: v.union(
      v.literal("meeting_scheduled"),
      v.literal("meeting_completed"),
      v.literal("meeting_cancelled")
    ),
    projectId: v.optional(v.id("projects")),
    workspaceId: v.id("workspaces"),
    meetingId: v.id("meetings"),
    meetingTitle: v.string(),
    metadata: v.optional(v.object({
      extra: v.optional(v.any())
    }))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUser(ctx, identity.subject);

    // Generate description based on activity type
    let description = "";
    switch (args.type) {
      case "meeting_scheduled":
        description = `scheduled meeting "${args.meetingTitle}"`;
        break;
      case "meeting_completed":
        description = `completed meeting "${args.meetingTitle}"`;
        break;
      case "meeting_cancelled":
        description = `cancelled meeting "${args.meetingTitle}"`;
        break;
    }

    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      projectId: args.projectId,
      workspaceId: args.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "meeting",
      targetId: args.meetingId,
      targetName: args.meetingTitle,
      description: description,
      metadata: args.metadata,
      timestamp: Date.now()
    });

    return activityId;
  }
});

// Convenience mutations for common activities
export const logTaskCreated = mutation({
  args: {
    taskId: v.id("tasks")
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation("activities/mutations:logTaskActivity", {
      type: "task_created",
      taskId: args.taskId
    });
  }
});

export const logTaskCompleted = mutation({
  args: {
    taskId: v.id("tasks")
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation("activities/mutations:logTaskActivity", {
      type: "task_completed",
      taskId: args.taskId
    });
  }
});

export const logTaskStatusChanged = mutation({
  args: {
    taskId: v.id("tasks"),
    oldStatus: v.string(),
    newStatus: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation("activities/mutations:logTaskActivity", {
      type: "task_status_changed",
      taskId: args.taskId,
      metadata: {
        oldValue: args.oldStatus,
        newValue: args.newStatus
      }
    });
  }
});

export const logTaskAssigned = mutation({
  args: {
    taskId: v.id("tasks"),
    assignedToId: v.id("users"),
    assignedToName: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation("activities/mutations:logTaskActivity", {
      type: "task_assigned",
      taskId: args.taskId,
      metadata: {
        assignedTo: args.assignedToId,
        assignedToName: args.assignedToName
      }
    });
  }
});

export const logMemberJoined = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    userName: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation("activities/mutations:logTeamActivity", {
      type: "member_joined",
      projectId: args.projectId,
      targetUserId: args.userId,
      targetUserName: args.userName
    });
  }
});