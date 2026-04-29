import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { decryptSecret } from "../lib/secrets";

// Types shared with other AI files
export type AIProvider = "cerebras" | "groq";

export type AIConfig = {
  provider: AIProvider;
  model: string;
  apiKey: string;
  keySource: "project" | "user" | "platform";
  complexity: "low" | "medium" | "high";
};

// Complexity classification by function category
const COMPLEXITY_MAP: Record<string, "low" | "medium" | "high"> = {
  task_generation: "low",
  standup_summary: "low",
  code_review: "high",
  documentation: "high",
  sprint_analysis: "high",
  insights: "high",
  default: "medium",
};

// Default models per provider — Cerebras always uses gpt-oss-120b,
// Groq splits by complexity (20b for simple/moderate, 120b for complex)
const DEFAULT_MODELS: Record<string, Record<string, string>> = {
  cerebras: {
    default: "gpt-oss-120b",
  },
  groq: {
    simple: "openai/gpt-oss-20b",
    moderate: "openai/gpt-oss-20b",
    complex: "openai/gpt-oss-120b",
    default: "openai/gpt-oss-20b",
  },
};

function getGroqModel(complexity: "low" | "medium" | "high"): string {
  if (complexity === "high") return "openai/gpt-oss-120b";
  return "openai/gpt-oss-20b";
}

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
      provider: v.union(v.literal("cerebras"), v.literal("groq")),
      model: v.string(),
      apiKey: v.string(),
      keySource: v.union(v.literal("project"), v.literal("user"), v.literal("platform")),
      complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    })
  ),
  handler: async (ctx, args) => {
    const category = args.functionCategory || "default";
    const complexity = COMPLEXITY_MAP[category] || COMPLEXITY_MAP.default;

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
              apiKey: await decryptSecret(projectKey.encryptedApiKey),
              keySource: "project" as const,
              complexity,
            };
          }

          // Check for model override in the key itself
          const modelOverride = projectKey.modelOverrides?.[category];
          const provider = projectKey.provider;
          const model =
            modelOverride ||
            projectKey.defaultModel ||
            (provider === "groq" ? getGroqModel(complexity) : DEFAULT_MODELS[provider]?.default) ||
            "gpt-oss-120b";

          return {
            provider,
            model,
            apiKey: await decryptSecret(projectKey.encryptedApiKey),
            keySource: "project" as const,
            complexity,
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
        const provider = activeKey.provider;
        const modelOverride = activeKey.modelOverrides?.[category];
        const model =
          modelOverride ||
          activeKey.defaultModel ||
          (provider === "groq" ? getGroqModel(complexity) : DEFAULT_MODELS[provider]?.default) ||
          "gpt-oss-120b";

        return {
          provider,
          model,
          apiKey: await decryptSecret(activeKey.encryptedApiKey),
          keySource: "user" as const,
          complexity,
        };
      }
    }

    // 3. Fall back to platform env var (Cerebras primary, Groq secondary)
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    if (cerebrasKey) {
      return {
        provider: "cerebras" as const,
        model: "gpt-oss-120b",
        apiKey: cerebrasKey,
        keySource: "platform" as const,
        complexity,
      };
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      return {
        provider: "groq" as const,
        model: getGroqModel(complexity),
        apiKey: groqKey,
        keySource: "platform" as const,
        complexity,
      };
    }

    return null;
  },
});
