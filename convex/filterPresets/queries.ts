import { query } from "../_generated/server";
import { v } from "convex/values";

export const getWorkspaceFilterPresets = query({
  args: {
    workspaceId: v.id("workspaces")
  },
  handler: async (ctx, { workspaceId }) => {
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

    const presets = await ctx.db
      .query("filterPresets")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", workspaceId).eq("userId", user._id)
      )
      .collect();

    return presets.sort((a, b) => b.updatedAt - a.updatedAt);
  }
});