import { v } from "convex/values";
import { internalQuery, internalMutation } from "../_generated/server";

// Get all push subscriptions for a user (called from Node action)
export const getUserSubscriptions = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return subs.map((s) => ({
      endpoint: s.endpoint,
      keys: s.keys,
    }));
  },
});

// Remove stale/expired push subscriptions
export const removeStaleSubscriptions = internalMutation({
  args: {
    endpoints: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const endpoint of args.endpoints) {
      const sub = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
        .first();
      if (sub) {
        await ctx.db.delete(sub._id);
      }
    }
    return null;
  },
});
