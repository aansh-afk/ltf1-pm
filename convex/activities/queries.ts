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

// Get dashboard activities - fetches recent activities across all user's workspaces
export const getDashboardActivities = query({
  args: {
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

    // Get all workspaces the user is a member of
    const workspaceMemberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (workspaceMemberships.length === 0) {
      return [];
    }

    const workspaceIds = workspaceMemberships.map(m => m.workspaceId);
    const limit = args.limit || 20;
    const timeRange = args.timeRangeHours || 168; // Default to last week
    const cutoffTime = Date.now() - (timeRange * 60 * 60 * 1000);

    // Fetch activities from all workspaces
    const allActivities: any[] = [];
    for (const workspaceId of workspaceIds) {
      const activities = await ctx.db
        .query("activities")
        .filter((q) => q.eq(q.field("workspaceId"), workspaceId))
        .order("desc")
        .take(limit);
      
      allActivities.push(...activities);
    }

    // Sort by timestamp and filter
    const sortedActivities = allActivities
      .filter(activity => {
        if (!activity || typeof activity !== 'object') return false;
        const timestamp = (activity as any).timestamp;
        const type = (activity as any).type;
        
        // Filter out low-priority activities for dashboard
        const lowPriorityTypes = ['task_commented', 'task_time_started', 'task_time_stopped'];
        if (lowPriorityTypes.includes(type)) return false;
        
        return timestamp && timestamp >= cutoffTime;
      })
      .sort((a, b) => ((b as any).timestamp || 0) - ((a as any).timestamp || 0))
      .slice(0, limit);

    // Enrich activities with related data
    const enrichedActivities = await Promise.all(
      sortedActivities.map(async (activity) => {
        const actor = activity.actorId ? await ctx.db.get(activity.actorId) : null;
        const project = activity.projectId ? await ctx.db.get(activity.projectId) : null;
        const workspace = await ctx.db.get(activity.workspaceId);
        
        // Get task details if it's a task activity
        let task = null;
        if ((activity as any).targetType === 'task' && (activity as any).targetId) {
          try {
            task = await ctx.db.get((activity as any).targetId as any);
          } catch (e) {
            // Task might have been deleted
          }
        }

        // Format the activity for dashboard display
        const activityType = (activity as any).type;
        let formattedAction = '';
        let formattedTarget = '';
        let icon = '';
        let color = '';

        switch (activityType) {
          case 'task_completed':
            formattedAction = 'COMPLETED TASK';
            formattedTarget = task ? `#${(task as any).key || (activity as any).targetId}` : (activity as any).targetName || 'Unknown';
            icon = 'check';
            color = '#00FF00';
            break;
          case 'task_created':
            formattedAction = 'CREATED TASK';
            formattedTarget = task ? `#${(task as any).key || (activity as any).targetId}` : (activity as any).targetName || 'Unknown';
            icon = 'plus';
            color = '#00FFFF';
            break;
          case 'task_assigned':
            formattedAction = 'ASSIGNED TASK';
            formattedTarget = task ? `#${(task as any).key || (activity as any).targetId}` : (activity as any).targetName || 'Unknown';
            icon = 'user';
            color = '#FF00FF';
            break;
          case 'sprint_started':
            formattedAction = 'STARTED SPRINT';
            formattedTarget = (activity as any).targetName || 'Sprint';
            icon = 'play';
            color = '#FFFF00';
            break;
          case 'sprint_completed':
            formattedAction = 'COMPLETED SPRINT';
            formattedTarget = (activity as any).targetName || 'Sprint';
            icon = 'flag';
            color = '#00FF00';
            break;
          case 'pr_merged':
            formattedAction = 'MERGED PR';
            formattedTarget = `#${(activity as any).targetId || 'PR'}`;
            icon = 'git-merge';
            color = '#00FFFF';
            break;
          case 'commit_pushed':
            formattedAction = 'PUSHED COMMIT';
            formattedTarget = (activity as any).targetName || 'main';
            icon = 'git-commit';
            color = '#FFFF00';
            break;
          case 'meeting_scheduled':
            formattedAction = 'SCHEDULED MEETING';
            formattedTarget = (activity as any).targetName || 'Meeting';
            icon = 'calendar';
            color = '#FF00FF';
            break;
          case 'member_joined':
            formattedAction = 'JOINED';
            formattedTarget = workspace ? (workspace as any).name : 'Workspace';
            icon = 'user-plus';
            color = '#00FF00';
            break;
          default:
            formattedAction = activityType ? activityType.replace(/_/g, ' ').toUpperCase() : 'ACTIVITY';
            formattedTarget = (activity as any).targetName || '';
            icon = 'activity';
            color = '#FFFFFF';
        }

        // Calculate time ago
        const timestamp = (activity as any).timestamp || Date.now();
        const now = Date.now();
        const diffMs = now - timestamp;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        let timeAgo = '';
        if (diffMinutes < 1) {
          timeAgo = 'JUST NOW';
        } else if (diffMinutes < 60) {
          timeAgo = `${diffMinutes} MIN AGO`;
        } else if (diffHours < 24) {
          timeAgo = `${diffHours} HOUR${diffHours !== 1 ? 'S' : ''} AGO`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          timeAgo = `${diffDays} DAY${diffDays !== 1 ? 'S' : ''} AGO`;
        }

        return {
          ...activity,
          actor: actor ? {
            _id: actor._id,
            name: (actor as any).name || 'Unknown',
            email: (actor as any).email || 'unknown@example.com',
            avatarUrl: (actor as any).avatarUrl || null,
            initials: ((actor as any).name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          } : null,
          project: project ? {
            _id: project._id,
            name: (project as any).name || 'Unknown Project',
            key: (project as any).key || 'UNK'
          } : null,
          workspace: workspace ? {
            _id: workspace._id,
            name: (workspace as any).name || 'Unknown Workspace'
          } : null,
          formattedAction,
          formattedTarget,
          icon,
          color,
          timeAgo,
          showWorkspace: workspaceIds.length > 1 // Only show workspace if user has multiple
        };
      })
    );

    return enrichedActivities;
  }
});