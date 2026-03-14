"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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
    provider: v.union(v.literal("cerebras"), v.literal("groq")),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Resolve which provider/model/key to use
    // @ts-ignore — deep type instantiation
    const resolveRef = internal.ai.resolveConfig.resolveAIConfig;
    const config: AIConfig | null = await ctx.runQuery(resolveRef, {
      projectId: args.projectId,
      functionCategory: args.functionCategory,
      clerkUserId: identity.subject,
    });

    if (!config) {
      throw new Error(
        "No AI provider configured. Please add an API key in Settings → AI, or ask your admin to configure a project-level key."
      );
    }

    // Call the resolved provider
    try {
      const result: { text: string; model: string; provider: "cerebras" | "groq" } =
        await ctx.runAction(internal.ai.providers.generateWithProvider, {
          provider: config.provider,
          model: config.model,
          apiKey: config.apiKey,
          prompt: args.prompt,
          systemPrompt: args.systemPrompt,
          temperature: args.temperature,
          maxTokens: args.maxTokens,
          complexity: config.complexity,
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
    } catch (primaryError: any) {
      // Auto-fallback: if Cerebras fails, try Groq
      if (config.provider === "cerebras") {
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
          console.warn(`Cerebras failed (${primaryError.message}), falling back to Groq`);
          const groqModel = config.complexity === "high"
            ? "openai/gpt-oss-120b"
            : "openai/gpt-oss-20b";

          const fallbackResult: { text: string; model: string; provider: "cerebras" | "groq" } =
            await ctx.runAction(internal.ai.providers.generateWithProvider, {
              provider: "groq",
              model: groqModel,
              apiKey: groqKey,
              prompt: args.prompt,
              systemPrompt: args.systemPrompt,
              temperature: args.temperature,
              maxTokens: args.maxTokens,
              complexity: config.complexity,
            });

          // Track fallback usage
          try {
            await ctx.runMutation(internal.ai.usageLog.logUsage, {
              clerkUserId: identity.subject,
              provider: "groq",
              model: groqModel,
              keySource: "platform",
              functionCategory: args.functionCategory || "unknown",
              promptLength: args.prompt.length,
              responseLength: fallbackResult.text.length,
              success: true,
            });
          } catch {
            // Don't fail the request if logging fails
          }

          return fallbackResult;
        }
      }

      throw primaryError;
    }
  },
});
