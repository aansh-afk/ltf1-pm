import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getCurrentUserOrThrow } from "./lib/auth";

export const submitNpsSurvey = mutation({
  args: {
    score: v.number(),
    reason: v.optional(v.string()),
  },
  returns: v.id("npsSurveys"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

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
    const user = await getCurrentUserOrThrow(ctx);

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
    const user = await getCurrentUser(ctx);
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
