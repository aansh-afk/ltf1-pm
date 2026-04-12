import { v } from "convex/values";
import { mutation, internalQuery, internalMutation } from "../_generated/server";
import { getCurrentUserOrThrow } from "../lib/auth";

// ─── Public mutations for subscription management ────────────────────

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    userAgent: v.optional(v.string()),
  },
  returns: v.id("pushSubscriptions"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if this endpoint is already registered
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        keys: args.keys,
        userAgent: args.userAgent,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      keys: args.keys,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });
  },
});

export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (sub && sub.userId === user._id) {
      await ctx.db.delete(sub._id);
    }

    return null;
  },
});

// ─── Internal queries/mutations for push action ──────────────────────

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
