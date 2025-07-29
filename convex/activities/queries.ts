import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

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
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .order("desc")
      .take(args.limit || 50);

    // Enrich activities with actor user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const actor = activity.actorId ? await ctx.db.get(activity.actorId) : null;
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: (actor as any).name || 'Unknown',
            email: (actor as any).email || 'unknown@example.com',
            avatarUrl: (actor as any).avatarUrl || null
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
    limit: v.optional(v.number()),
    timeRangeHours: v.optional(v.number()),
    types: v.optional(v.array(v.string()))
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

    // Check if user is a member of the workspace
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", user._id))
      .first();

    if (!workspaceMember) {
      throw new Error("Access denied to workspace");
    }

    let activities = await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .order("desc")
      .take(args.limit || 50);

    // Filter activities to only include those with proper structure
    activities = activities.filter(activity => 
      activity && typeof activity === 'object' && (activity as any).type
    );

    // Apply time range filter if specified
    if (args.timeRangeHours) {
      const now = Date.now();
      const cutoffTime = now - (args.timeRangeHours * 60 * 60 * 1000);
      activities = activities.filter(activity => {
        const timestamp = (activity as any).timestamp;
        return timestamp && timestamp >= cutoffTime;
      });
    }

    // Filter by activity types if specified
    if (args.types && args.types.length > 0) {
      activities = activities.filter(activity => 
        args.types!.includes((activity as any).type)
      );
    }

    // Enrich activities with actor user data and project names
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const actor = activity.actorId ? await ctx.db.get(activity.actorId) : null;
        const project = activity.projectId ? await ctx.db.get(activity.projectId) : null;
        
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: (actor as any).name || 'Unknown',
            email: (actor as any).email || 'unknown@example.com',
            avatarUrl: (actor as any).avatarUrl || null
          } : null,
          project: project ? {
            _id: project._id,
            name: (project as any).name || 'Unknown Project',
            key: (project as any).key || 'UNK'
          } : null
        };
      })
    );

    return enrichedActivities;
  }
});

// Get recent team activity for a project (main function for TeamActivityFeed)
export const getRecentTeamActivity = query({
  args: {
    projectId: v.id("projects"),
    types: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    timeRangeHours: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Check project access
    const projectMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", user._id))
      .first(); 

    if (!projectMember) {
      return [];
    }

    // Get activities for the project
    let activities = await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .order("desc")
      .take(args.limit || 100);

    // Filter activities to only include those with proper structure
    activities = activities.filter(activity => 
      activity && typeof activity === 'object' && (activity as any).type
    );

    // Apply time range filter if specified
    if (args.timeRangeHours) {
      const now = Date.now();
      const cutoffTime = now - (args.timeRangeHours * 60 * 60 * 1000);
      activities = activities.filter(activity => {
        const timestamp = (activity as any).timestamp;
        return timestamp && timestamp >= cutoffTime;
      });
    }
    
    // Filter by activity types if specified
    if (args.types && args.types.length > 0) {
      activities = activities.filter(activity => 
        args.types!.includes((activity as any).type)
      );
    }

    // Enrich with user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const actor = activity.actorId ? await ctx.db.get(activity.actorId) : null;
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: (actor as any).name || 'Unknown',
            email: (actor as any).email || 'unknown@example.com',
            avatarUrl: (actor as any).avatarUrl || null
          } : null
        };
      })
    );

    return enrichedActivities;
  }
});

// Get activity statistics for analytics
export const getActivityStats = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    timeRange: v.optional(v.union(v.literal("24h"), v.literal("7d"), v.literal("30d")))
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

    // Check workspace access
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", user._id))
      .first();

    if (!workspaceMember) {
      throw new Error("Access denied");
    }

    // Calculate time range
    const now = Date.now();
    const timeRanges = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000
    };
    const range = timeRanges[args.timeRange || "7d"];
    const startTime = now - range;

    // Get activities
    let query = ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId));

    if (args.projectId) {
      query = query.filter((q) => q.eq(q.field("projectId"), args.projectId));
    }

    const activities = await query.collect();

    // Filter by time and proper structure
    const filteredActivities = activities.filter(activity => {
      if (!activity || typeof activity !== 'object') return false;
      const timestamp = (activity as any).timestamp;
      return timestamp && timestamp >= startTime;
    });

    // Calculate statistics
    const activityCounts: Record<string, number> = {};
    const userActivityCounts: Record<string, number> = {};
    
    for (const activity of filteredActivities) {
      const activityType = (activity as any).type;
      if (activityType) {
        activityCounts[activityType] = (activityCounts[activityType] || 0) + 1;
      }
      if (activity.actorId) {
        userActivityCounts[activity.actorId] = (userActivityCounts[activity.actorId] || 0) + 1;
      }
    }

    return {
      totalActivities: filteredActivities.length,
      activityCounts,
      userActivityCounts,
      timeRange: args.timeRange || "7d"
    };
  }
});

// Get team activity dashboard data
export const getTeamActivityDashboard = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects"))
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

    // Check workspace access
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", user._id))
      .first();

    if (!workspaceMember) {
      throw new Error("Access denied");
    }

    // Get recent activities
    let query = ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .order("desc")
      .take(20);

    const activities = await query;

    // Filter and enrich activities
    const validActivities = activities.filter(activity => 
      activity && typeof activity === 'object' && (activity as any).type
    );

    const enrichedActivities = await Promise.all(
      validActivities.map(async (activity) => {
        const actor = activity.actorId ? await ctx.db.get(activity.actorId) : null;
        const project = activity.projectId ? await ctx.db.get(activity.projectId) : null;
        
        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: (actor as any).name || 'Unknown',
            email: (actor as any).email || 'unknown@example.com',
            avatarUrl: (actor as any).avatarUrl || null
          } : null,
          project: project ? {
            _id: project._id,
            name: (project as any).name || 'Unknown Project',
            key: (project as any).key || 'UNK'
          } : null
        };
      })
    );

    return enrichedActivities;
  }
});