import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

// Assemble context for agent decisions
export const assembleContext = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
  },
  returns: v.object({
    workspace: v.any(),
    recentTasks: v.array(v.any()),
    activeSprint: v.any(),
    teamMembers: v.array(v.any()),
    recentActivity: v.array(v.any()),
    currentTask: v.any(),
  }),
  handler: async (ctx, args) => {
    // Get workspace
    const workspace = await ctx.db.get(args.workspaceId);

    // Get team members with profiles
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const teamMembers = [];
    for (const member of members.slice(0, 20)) {
      const user = await ctx.db.get(member.userId);
      const profile = await ctx.db
        .query("developerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", member.userId))
        .first();
      if (user) {
        teamMembers.push({
          userId: member.userId,
          name: user.name,
          email: user.email,
          role: member.role,
          skills: profile?.profile?.skills || [],
          techStack: profile?.techStack || [],
          availability: profile?.availability || null,
        });
      }
    }

    // Get recent tasks (last 50 in project)
    let recentTasks: Array<Record<string, unknown>> = [];
    if (args.projectId) {
      recentTasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
        .order("desc")
        .take(50);
    }

    // Get active sprint
    let activeSprint = null;
    if (args.projectId) {
      activeSprint = await ctx.db
        .query("sprints")
        .withIndex("by_project_and_status", (q) =>
          q.eq("projectId", args.projectId!).eq("status", "active")
        )
        .first();
    }

    // Get recent activity
    const recentActivity = await ctx.db
      .query("activities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(20);

    // Get current task if specified
    let currentTask = null;
    if (args.taskId) {
      currentTask = await ctx.db.get(args.taskId);
    }

    return {
      workspace: workspace || null,
      recentTasks,
      activeSprint,
      teamMembers,
      recentActivity,
      currentTask,
    };
  },
});
