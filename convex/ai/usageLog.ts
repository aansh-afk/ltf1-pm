import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Normalize model names: strip "openai/" prefix used by Groq
function normalizeModelName(
  model: string,
): "gemini-2.5-flash" | "gemini-2.5-flash-lite" | "gpt-oss-120b" | "gpt-oss-20b" {
  const stripped = model.replace(/^openai\//, "");
  const validModels = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gpt-oss-120b",
    "gpt-oss-20b",
  ] as const;
  const match = validModels.find((m) => stripped === m || stripped.includes(m));
  return match ?? "gpt-oss-20b";
}

// Bridge mutation: writes to aiSessions so analytics queries work.
// Fixes BUG-004 (table mismatch) and BUG-005 (wrong workspace).
export const logAISession = internalMutation({
  args: {
    clerkUserId: v.string(),
    provider: v.string(),
    model: v.string(),
    functionCategory: v.string(),
    prompt: v.string(),
    responseText: v.string(),
    projectId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Look up internal user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();
    if (!user) return null;

    // Resolve workspace: prefer projectId lookup (BUG-005 fix)
    let workspaceId: Id<"workspaces"> | null = null;

    if (args.projectId) {
      try {
        const project = await ctx.db.get(args.projectId as Id<"projects">);
        if (project) {
          workspaceId = project.workspaceId;
        }
      } catch {
        // projectId might be invalid — fall through
      }
    }

    // Fallback: find the most recently joined workspace
    if (!workspaceId) {
      const member = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .first();
      if (member) {
        workspaceId = member.workspaceId;
      }
    }

    if (!workspaceId) return null;

    // Estimate tokens
    const promptTokens = Math.ceil(args.prompt.length / 4);
    const completionTokens = Math.ceil(args.responseText.length / 4);

    await ctx.db.insert("aiSessions", {
      userId: user._id,
      workspaceId,
      type: args.functionCategory,
      input: args.prompt.substring(0, 10000),
      output: args.responseText.substring(0, 10000),
      model: normalizeModelName(args.model),
      tokens: {
        input: promptTokens,
        output: completionTokens,
        total: promptTokens + completionTokens,
      },
      cost: 0,
      latency: 0,
      cached: false,
      createdAt: Date.now(),
    });

    return null;
  },
});

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
