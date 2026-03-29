import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a user by their Clerk ID. Used by skill execution actions.
 */
export const getUserByClerkId = internalQuery({
  args: {
    clerkId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

/**
 * Get all active auto/both-trigger skills for a workspace.
 * Used by checkAutoSkills to find matching skills.
 */
export const getActiveAutoSkills = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_workspaceId", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();

    // Filter to active skills with auto or both trigger
    return skills.filter(
      (s) => s.isActive && (s.trigger === "auto" || s.trigger === "both"),
    );
  },
});

/**
 * Get minimal task data needed for condition matching.
 */
export const getTaskForMatching = internalQuery({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return null;
    }

    return {
      _id: task._id,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      labels: task.labels,
      projectId: task.projectId,
    };
  },
});
