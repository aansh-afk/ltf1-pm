import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitNpsSurvey = mutation({
  args: {
    score: v.number(),
    reason: v.optional(v.string()),
  },
  returns: v.id("npsSurveys"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("npsSurveys", {
      userId: user._id,
      score: args.score,
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});

export const dismissNpsSurvey = mutation({
  args: {},
  returns: v.id("npsSurveys"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("npsSurveys", {
      userId: user._id,
      score: -1,
      dismissedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const hasCompletedNps = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) {
      return false;
    }

    const existing = await ctx.db
      .query("npsSurveys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return existing !== null;
  },
});
