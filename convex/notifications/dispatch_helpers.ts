import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

// Get user preferences for notification dispatch (internal only)
export const getUserPreferences = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      email: user.email,
      preferences: user.preferences,
    };
  },
});
