import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/**
 * Get all project members with their developer profiles for AI context.
 */
export const getProjectTeamSkills = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      name: v.string(),
      email: v.string(),
      avatarUrl: v.optional(v.string()),
      skills: v.array(v.string()),
      technologies: v.array(
        v.object({
          name: v.string(),
          level: v.string(),
        })
      ),
      careerLevel: v.optional(v.string()),
      status: v.optional(v.string()),
      role: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Get active project members
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const activeMembers = projectMembers.filter(
      (m) => m.status === "active"
    );

    const results: Array<{
      userId: string;
      name: string;
      email: string;
      avatarUrl: string | undefined;
      skills: Array<string>;
      technologies: Array<{ name: string; level: string }>;
      careerLevel: string | undefined;
      status: string | undefined;
      role: string | undefined;
    }> = [];

    for (const member of activeMembers) {
      const user = await ctx.db.get(member.userId);
      if (!user) continue;

      // Get developer profile
      const devProfile = await ctx.db
        .query("developerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", member.userId))
        .unique();

      const skills = devProfile?.profile?.skills ?? [];
      const technologies = (devProfile?.profile?.technologies ?? []).map(
        (t) => ({ name: t.name, level: t.level })
      );
      const careerLevel = devProfile?.profile?.careerLevel;
      const status = devProfile?.status;
      const profileRole = devProfile?.profile?.role;

      results.push({
        userId: member.userId as string,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        skills,
        technologies,
        careerLevel,
        status,
        role: profileRole,
      });
    }

    return results;
  },
});

/**
 * Internal helper to fetch task details for suggestAssignees.
 */
export const getTaskDetails = internalQuery({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.union(
    v.object({
      title: v.string(),
      description: v.optional(v.string()),
      projectId: v.id("projects"),
      type: v.optional(v.string()),
      priority: v.optional(v.string()),
      labels: v.optional(v.array(v.string())),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    return {
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      type: task.type,
      priority: task.priority,
      labels: task.labels,
    };
  },
});
