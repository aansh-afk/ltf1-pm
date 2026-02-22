"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";

// Re-export types from resolveConfig for convenience
export type { AIProvider, AIConfig } from "./resolveConfig";

// ─── Enforcer System Prompt ────────────────────────────────────────────

const ENFORCER_PREFIX = `You are a precise AI assistant for a project management tool called LTF1.

CRITICAL RULES — violating these makes your response INVALID:
1. When JSON is requested, respond with ONLY valid JSON. No markdown fences, no explanation, no preamble.
2. Never invent data. If you lack information, say so in the appropriate field.
3. Keep responses concise and actionable.
4. Use only the exact field names and value types specified in the prompt.
5. Never include comments, ellipses, or placeholder text in JSON output.`;

// ─── Output Validation ────────────────────────────────────────────────

function validateAndCleanResponse(text: string, expectJson: boolean): string {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  // Validate JSON if expected
  if (expectJson) {
    JSON.parse(cleaned); // throws if invalid — caught by caller
  }
  return cleaned;
}

// ─── Provider Caller ────────────────────────────────────────────────────

export const generateWithProvider = internalAction({
  args: {
    provider: v.union(v.literal("cerebras"), v.literal("groq")),
    model: v.string(),
    apiKey: v.string(),
    prompt: v.string(),
    systemPrompt: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    complexity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  returns: v.object({
    text: v.string(),
    model: v.string(),
    provider: v.union(v.literal("cerebras"), v.literal("groq")),
  }),
  handler: async (ctx, args) => {
    const temp = args.temperature ?? 0.7;
    const maxTokens = args.maxTokens ?? 4096;
    const complexity = args.complexity ?? "medium";

    // Build system prompt with enforcer prefix
    const fullSystemPrompt = args.systemPrompt
      ? `${ENFORCER_PREFIX}\n\n${args.systemPrompt}`
      : ENFORCER_PREFIX;

    const messages: Array<{ role: "system" | "user"; content: string }> = [
      { role: "system", content: fullSystemPrompt },
      { role: "user", content: args.prompt },
    ];

    const OpenAI = (await import("openai")).default;

    if (args.provider === "cerebras") {
      const client = new OpenAI({
        apiKey: args.apiKey,
        baseURL: "https://api.cerebras.ai/v1",
      });

      const completion = await client.chat.completions.create({
        model: args.model,
        messages,
        temperature: temp,
        max_tokens: maxTokens,
        reasoning_effort: complexity as any,
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error("No content in Cerebras response");

      // Detect if JSON was expected and validate
      const expectJson = args.systemPrompt?.toLowerCase().includes("json") ||
        args.prompt.toLowerCase().includes("json");
      const cleaned = validateAndCleanResponse(text, expectJson);

      return {
        text: cleaned,
        model: args.model,
        provider: "cerebras" as const,
      };
    }

    if (args.provider === "groq") {
      const client = new OpenAI({
        apiKey: args.apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });

      const completion = await client.chat.completions.create({
        model: args.model,
        messages,
        temperature: temp,
        max_tokens: maxTokens,
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error("No content in Groq response");

      const expectJson = args.systemPrompt?.toLowerCase().includes("json") ||
        args.prompt.toLowerCase().includes("json");
      const cleaned = validateAndCleanResponse(text, expectJson);

      return {
        text: cleaned,
        model: args.model,
        provider: "groq" as const,
      };
    }

    throw new Error(`Unsupported provider: ${args.provider}`);
  },
});

// ─── Key Validation ─────────────────────────────────────────────────────

export const validateProviderKey = internalAction({
  args: {
    provider: v.union(v.literal("cerebras"), v.literal("groq")),
    apiKey: v.string(),
  },
  returns: v.object({
    isValid: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const OpenAI = (await import("openai")).default;

      if (args.provider === "cerebras") {
        const client = new OpenAI({
          apiKey: args.apiKey,
          baseURL: "https://api.cerebras.ai/v1",
        });
        await client.chat.completions.create({
          model: "gpt-oss-120b",
          messages: [{ role: "user", content: "Say 'ok'" }],
          max_tokens: 5,
        });
        return { isValid: true };
      }

      if (args.provider === "groq") {
        const client = new OpenAI({
          apiKey: args.apiKey,
          baseURL: "https://api.groq.com/openai/v1",
        });
        await client.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [{ role: "user", content: "Say 'ok'" }],
          max_tokens: 5,
        });
        return { isValid: true };
      }

      return { isValid: false, error: `Unsupported provider: ${args.provider}` };
    } catch (error: any) {
      return {
        isValid: false,
        error: error.message?.includes("API_KEY_INVALID") || error.message?.includes("Incorrect API key") || error.message?.includes("Invalid API Key")
          ? "Invalid API key. Please check and try again."
          : `Validation failed: ${error.message?.substring(0, 100)}`,
      };
    }
  },
});
