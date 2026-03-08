import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../lib/auth";

export const getWorkspaceFilterPresets = query({
  args: {
    workspaceId: v.id("workspaces")
  },
  handler: async (ctx, { workspaceId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const presets = await ctx.db
      .query("filterPresets")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", workspaceId).eq("userId", user._id)
      )
      .collect();

    return presets.sort((a, b) => b.updatedAt - a.updatedAt);
  }
});