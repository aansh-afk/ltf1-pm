import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// Internal mutation to log AI usage (must NOT be in a "use node" file)
export const logUsage = internalMutation({
  args: {
    clerkUserId: v.string(),
    provider: v.string(),
    model: v.string(),
    keySource: v.string(),
    functionCategory: v.string(),
    promptLength: v.number(),
    responseLength: v.number(),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const estimatedPromptTokens = Math.ceil(args.promptLength / 4);
    const estimatedCompletionTokens = Math.ceil(args.responseLength / 4);

    await ctx.db.insert("aiUsageLogs", {
      userId: args.clerkUserId,
      requestType: args.functionCategory,
      model: args.model,
      promptTokens: estimatedPromptTokens,
      completionTokens: estimatedCompletionTokens,
      totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
      creditsUsed: args.keySource === "user" || args.keySource === "project" ? 0 : 1,
      keyType: args.keySource === "platform" ? ("platform" as const) : ("user" as const),
      success: args.success,
      error: args.error,
      responseTime: 0,
      timestamp: new Date().toISOString(),
    });

    return null;
  },
});
