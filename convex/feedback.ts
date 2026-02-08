import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitFeedback = mutation({
  args: {
    message: v.string(),
    email: v.optional(v.string()),
    page: v.string(),
  },
  returns: v.id("feedback"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let userId = undefined;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (user) {
        userId = user._id;
      }
    }

    return await ctx.db.insert("feedback", {
      userId,
      email: args.email,
      message: args.message,
      page: args.page,
      status: "new" as const,
      createdAt: Date.now(),
    });
  },
});

export const listFeedback = query({
  args: {
    status: v.optional(v.union(v.literal("new"), v.literal("reviewed"), v.literal("resolved"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("feedback"),
      _creationTime: v.number(),
      userId: v.optional(v.id("users")),
      email: v.optional(v.string()),
      message: v.string(),
      page: v.string(),
      userAgent: v.optional(v.string()),
      status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("resolved")),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("feedback")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("feedback")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});
