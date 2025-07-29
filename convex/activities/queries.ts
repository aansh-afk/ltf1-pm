import { query } from "../_generated/server";
import { v } from "convex/values";

// Get activities for a specific project
export const getProjectActivities = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number())
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

    // Check if user has access to the project
    const projectMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", user._id))
      .first();

    if (!projectMember) {
      throw new Error("Access denied to project");
    }

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(args.limit || 50);

    // Enrich activities with actor user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const actor = await ctx.db.get(activity.actorId);
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: actor.name,
            email: actor.email,
            avatarUrl: actor.avatarUrl
          } : null
        };
      })
    );

    return enrichedActivities;
  }
});

// Get activities for a specific workspace
export const getWorkspaceActivities = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number())
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

    // Check if user has access to the workspace
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", user._id))
      .first();

    if (!workspaceMember) {
      throw new Error("Access denied to workspace");
    }

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(args.limit || 50);

    // Enrich activities with actor user data and project names
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const actor = await ctx.db.get(activity.actorId);
        const project = activity.projectId ? await ctx.db.get(activity.projectId) : null;
        
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: actor.name,
            email: actor.email,
            avatarUrl: actor.avatarUrl
          } : null,
          project: project ? {
            _id: project._id,
            name: project.name,
            key: project.key
          } : null
        };
      })
    );

    return enrichedActivities;
  }
});

// Get activities by a specific user
export const getUserActivities = query({
  args: {
    userId: v.id("users"),
    workspaceId: v.optional(v.id("workspaces")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    let activitiesQuery = ctx.db
      .query("activities")
      .withIndex("by_actor", (q) => q.eq("actorId", args.userId))
      .order("desc");

    // If workspace filter is provided, filter by workspace
    let activities = await activitiesQuery.take(args.limit || 50);
    
    if (args.workspaceId) {
      activities = activities.filter(activity => activity.workspaceId === args.workspaceId);
    }

    // Filter activities to only include those from workspaces/projects the current user has access to
    const accessibleActivities = [];
    for (const activity of activities) {
      const workspaceMember = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_user", (q) => q.eq("workspaceId", activity.workspaceId).eq("userId", currentUser._id))
        .first();

      if (workspaceMember) {
        accessibleActivities.push(activity);
      }
    }

    // Enrich activities with actor user data and project names
    const enrichedActivities = await Promise.all(
      accessibleActivities.map(async (activity) => {
        const actor = await ctx.db.get(activity.actorId);
        const project = activity.projectId ? await ctx.db.get(activity.projectId) : null;
        
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: actor.name,
            email: actor.email,
            avatarUrl: actor.avatarUrl
          } : null,
          project: project ? {
            _id: project._id,
            name: project.name,
            key: project.key
          } : null
        };
      })
    );

    return enrichedActivities;
  }
});

// Get activities filtered by type
export const getActivitiesByType = query({
  args: {
    workspaceId: v.id("workspaces"),
    types: v.array(v.string()),
    limit: v.optional(v.number())
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

    // Check if user has access to the workspace
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", user._id))
      .first();

    if (!workspaceMember) {
      throw new Error("Access denied to workspace");
    }

    // Get all activities for the workspace
    const allActivities = await ctx.db
      .query("activities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(args.limit || 100);

    // Filter by activity types
    const filteredActivities = allActivities.filter(activity => 
      args.types.includes(activity.type)
    );

    // Enrich activities with actor user data and project names
    const enrichedActivities = await Promise.all(
      filteredActivities.slice(0, args.limit || 50).map(async (activity) => {
        const actor = await ctx.db.get(activity.actorId);
        const project = activity.projectId ? await ctx.db.get(activity.projectId) : null;
        
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: actor.name,
            email: actor.email,
            avatarUrl: actor.avatarUrl
          } : null,
          project: project ? {
            _id: project._id,
            name: project.name,
            key: project.key
          } : null
        };
      })
    );

    return enrichedActivities;
  }
});

// Get recent team activity (last 24 hours)
export const getRecentTeamActivity = query({
  args: {
    projectId: v.id("projects"),
    hours: v.optional(v.number()) // Default to 24 hours
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

    // Check if user has access to the project
    const projectMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", user._id))
      .first();

    if (!projectMember) {
      throw new Error("Access denied to project");
    }

    const hoursBack = args.hours || 24;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .order("desc")
      .take(100);

    // Enrich activities with actor user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const actor = await ctx.db.get(activity.actorId);
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: actor.name,
            email: actor.email,
            avatarUrl: actor.avatarUrl
          } : null
        };
      })
    );

    return enrichedActivities;
  }
});

// Get activity statistics for a project
export const getProjectActivityStats = query({
  args: {
    projectId: v.id("projects"),
    days: v.optional(v.number()) // Default to 7 days
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

    // Check if user has access to the project
    const projectMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", user._id))
      .first();

    if (!projectMember) {
      throw new Error("Access denied to project");
    }

    const daysBack = args.days || 7;
    const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .collect();

    // Count activities by type
    const activityCounts: Record<string, number> = {};
    activities.forEach(activity => {
      activityCounts[activity.type] = (activityCounts[activity.type] || 0) + 1;
    });

    // Count activities by user
    const userActivityCounts: Record<string, number> = {};
    activities.forEach(activity => {
      userActivityCounts[activity.actorId] = (userActivityCounts[activity.actorId] || 0) + 1;
    });

    // Get user names for the top contributors
    const topContributors = await Promise.all(
      Object.entries(userActivityCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(async ([userId, count]) => {
          const user = await ctx.db.get(userId as any);
          return {
            userId,
            name: user?.name || user?.email || 'Unknown User',
            avatarUrl: user?.avatarUrl,
            activityCount: count
          };
        })
    );

    return {
      totalActivities: activities.length,
      activityCounts,
      topContributors,
      timeRange: {
        from: cutoffTime,
        to: Date.now(),
        days: daysBack
      }
    };
  }
});

// Get activity feed with pagination
export const getActivityFeed = query({
  args: {
    projectId: v.optional(v.id("projects")),
    workspaceId: v.optional(v.id("workspaces")),
    cursor: v.optional(v.number()), // timestamp cursor for pagination
    limit: v.optional(v.number())
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

    const limit = args.limit || 20;
    let activities = [];

    if (args.projectId) {
      // Check project access
      const projectMember = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", user._id))
        .first();

      if (!projectMember) {
        throw new Error("Access denied to project");
      }

      let query = ctx.db
        .query("activities")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc");

      if (args.cursor) {
        query = query.filter((q) => q.lt(q.field("timestamp"), args.cursor));
      }

      activities = await query.take(limit + 1); // +1 to check if there are more

    } else if (args.workspaceId) {
      // Check workspace access
      const workspaceMember = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", user._id))
        .first();

      if (!workspaceMember) {
        throw new Error("Access denied to workspace");
      }

      let query = ctx.db
        .query("activities")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .order("desc");

      if (args.cursor) {
        query = query.filter((q) => q.lt(q.field("timestamp"), args.cursor));
      }

      activities = await query.take(limit + 1); // +1 to check if there are more
    } else {
      throw new Error("Either projectId or workspaceId must be provided");
    }

    const hasMore = activities.length > limit;
    if (hasMore) {
      activities.pop(); // Remove the extra item used for hasMore check
    }

    // Enrich activities with actor user data and project names
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const actor = await ctx.db.get(activity.actorId);
        const project = activity.projectId ? await ctx.db.get(activity.projectId) : null;
        
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: actor.name,
            email: actor.email,
            avatarUrl: actor.avatarUrl
          } : null,
          project: project ? {
            _id: project._id,
            name: project.name,
            key: project.key
          } : null
        };
      })
    );

    return {
      activities: enrichedActivities,
      hasMore,
      nextCursor: activities.length > 0 ? activities[activities.length - 1].timestamp : null
    };
  }
});