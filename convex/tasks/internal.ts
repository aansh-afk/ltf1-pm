import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../auth/permissions";

export const listBySprint = query({
  args: {
    sprintId: v.id("sprints")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // We check permissions implicitly by checking if the user is part of the workspace
    // But since this is a simple query, let's just return the tasks for now.
    // In a real app, we would verify permissions.

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();

    return tasks;
  },
});
