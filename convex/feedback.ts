import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";
import { feedbackStatusValidator } from "./lib/validators";

export const submitFeedback = mutation({
  args: {
    message: v.string(),
    email: v.optional(v.string()),
    page: v.string(),
  },
  returns: v.id("feedback"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const userId = user?._id;


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
    status: v.optional(feedbackStatusValidator),
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
      status: feedbackStatusValidator,
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
