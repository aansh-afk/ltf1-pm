"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import type { AIConfig } from "./resolveConfig";

// Single public entry point for all AI calls
export const generate = action({
  args: {
    prompt: v.string(),
    systemPrompt: v.optional(v.string()),
    projectId: v.optional(v.string()),
    functionCategory: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  returns: v.object({
    text: v.string(),
    model: v.string(),
    provider: v.union(v.literal("gemini"), v.literal("openai"), v.literal("anthropic")),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Resolve which provider/model/key to use
    const config: AIConfig | null = await ctx.runQuery(
      internal.ai.resolveConfig.resolveAIConfig,
      {
        projectId: args.projectId,
        functionCategory: args.functionCategory,
        clerkUserId: identity.subject,
      }
    );

    if (!config) {
      throw new Error(
        "No AI provider configured. Please add an API key in Settings → AI, or ask your admin to configure a project-level key."
      );
    }

    // Call the resolved provider
    const result: { text: string; model: string; provider: "gemini" | "openai" | "anthropic" } =
      await ctx.runAction(internal.ai.providers.generateWithProvider, {
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKey,
        prompt: args.prompt,
        systemPrompt: args.systemPrompt,
        temperature: args.temperature,
        maxTokens: args.maxTokens,
      });

    // Track usage (fire and forget, don't block response)
    try {
      await ctx.runMutation(internal.ai.usageLog.logUsage, {
        clerkUserId: identity.subject,
        provider: result.provider,
        model: result.model,
        keySource: config.keySource,
        functionCategory: args.functionCategory || "unknown",
        promptLength: args.prompt.length,
        responseLength: result.text.length,
        success: true,
      });
    } catch {
      // Don't fail the request if logging fails
    }

    return result;
  },
});
