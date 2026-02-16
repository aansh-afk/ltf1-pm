import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Types shared with other AI files
export type AIProvider = "gemini" | "openai" | "anthropic";

export type AIConfig = {
  provider: AIProvider;
  model: string;
  apiKey: string;
  keySource: "project" | "user" | "platform";
};

// Default models per provider per function category
const DEFAULT_MODELS: Record<string, Record<string, string>> = {
  gemini: {
    task_generation: "gemini-2.5-flash",
    code_review: "gemini-2.5-flash",
    documentation: "gemini-2.5-flash",
    sprint_analysis: "gemini-2.5-flash",
    insights: "gemini-2.5-flash",
    standup_summary: "gemini-2.5-flash-lite",
    default: "gemini-2.5-flash",
  },
  openai: {
    task_generation: "gpt-4o-mini",
    code_review: "gpt-4o",
    documentation: "gpt-4o",
    sprint_analysis: "gpt-4o",
    insights: "gpt-4o",
    standup_summary: "gpt-4o-mini",
    default: "gpt-4o",
  },
  anthropic: {
    task_generation: "claude-haiku-4-20250414",
    code_review: "claude-sonnet-4-20250514",
    documentation: "claude-sonnet-4-20250514",
    sprint_analysis: "claude-sonnet-4-20250514",
    insights: "claude-sonnet-4-20250514",
    standup_summary: "claude-haiku-4-20250414",
    default: "claude-sonnet-4-20250514",
  },
};

// Resolve AI config: project key → user key → legacy key → platform env
export const resolveAIConfig = internalQuery({
  args: {
    projectId: v.optional(v.string()),
    functionCategory: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      provider: v.union(v.literal("gemini"), v.literal("openai"), v.literal("anthropic")),
      model: v.string(),
      apiKey: v.string(),
      keySource: v.union(v.literal("project"), v.literal("user"), v.literal("platform")),
    })
  ),
  handler: async (ctx, args) => {
    const category = args.functionCategory || "default";

    // 1. Check project-level settings if projectId provided
    if (args.projectId) {
      const projectSettings = await ctx.db
        .query("projectAISettings")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId as Id<"projects">))
        .first();

      if (projectSettings?.aiEnabled && projectSettings.activeKeyId) {
        const projectKey = await ctx.db.get(projectSettings.activeKeyId);
        if (projectKey?.isActive) {
          // Check for function-level model override in projectAISettings
          const functionOverride = projectSettings.functionModelMap?.[category];
          if (functionOverride) {
            return {
              provider: functionOverride.provider,
              model: functionOverride.model,
              apiKey: atob(projectKey.encryptedApiKey),
              keySource: "project" as const,
            };
          }

          // Check for model override in the key itself
          const modelOverride = projectKey.modelOverrides?.[category];
          const model =
            modelOverride ||
            projectKey.defaultModel ||
            DEFAULT_MODELS[projectKey.provider]?.[category] ||
            DEFAULT_MODELS[projectKey.provider]?.default ||
            "gemini-2.5-flash";

          return {
            provider: projectKey.provider,
            model,
            apiKey: atob(projectKey.encryptedApiKey),
            keySource: "project" as const,
          };
        }
      }
    }

    // 2. Check user-level keys (new aiProviderKeys table)
    if (args.clerkUserId) {
      const userKeys = await ctx.db
        .query("aiProviderKeys")
        .withIndex("by_scope_and_id", (q) =>
          q.eq("scope", "user").eq("scopeId", args.clerkUserId as string)
        )
        .collect();

      const activeKey = userKeys.find((k) => k.isActive);
      if (activeKey) {
        const modelOverride = activeKey.modelOverrides?.[category];
        const model =
          modelOverride ||
          activeKey.defaultModel ||
          DEFAULT_MODELS[activeKey.provider]?.[category] ||
          DEFAULT_MODELS[activeKey.provider]?.default ||
          "gemini-2.5-flash";

        return {
          provider: activeKey.provider,
          model,
          apiKey: atob(activeKey.encryptedApiKey),
          keySource: "user" as const,
        };
      }

      // Also check legacy aiCredits table for backward compat
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId as string))
        .first();

      if (user) {
        const legacyCredits = await ctx.db
          .query("aiCredits")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        if (legacyCredits?.apiKey) {
          return {
            provider: "gemini" as const,
            model: DEFAULT_MODELS.gemini[category] || "gemini-2.5-flash",
            apiKey: legacyCredits.apiKey,
            keySource: "user" as const,
          };
        }
      }
    }

    // 3. Fall back to platform env var
    const platformKey = process.env.GEMINI_API_KEY;
    if (platformKey) {
      return {
        provider: "gemini" as const,
        model: DEFAULT_MODELS.gemini[category] || "gemini-2.5-flash",
        apiKey: platformKey,
        keySource: "platform" as const,
      };
    }

    return null;
  },
});
