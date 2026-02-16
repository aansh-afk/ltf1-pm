"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";

// Re-export types from resolveConfig for convenience
export type { AIProvider, AIConfig } from "./resolveConfig";

// ─── Provider Caller ────────────────────────────────────────────────────

export const generateWithProvider = internalAction({
  args: {
    provider: v.union(v.literal("gemini"), v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
    prompt: v.string(),
    systemPrompt: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  returns: v.object({
    text: v.string(),
    model: v.string(),
    provider: v.union(v.literal("gemini"), v.literal("openai"), v.literal("anthropic")),
  }),
  handler: async (ctx, args) => {
    const temp = args.temperature ?? 0.7;
    const maxTokens = args.maxTokens ?? 4096;

    if (args.provider === "gemini") {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(args.apiKey);
      const model = genAI.getGenerativeModel({
        model: args.model,
        generationConfig: {
          temperature: temp,
          maxOutputTokens: maxTokens,
        },
      });

      const fullPrompt = args.systemPrompt
        ? `${args.systemPrompt}\n\n${args.prompt}`
        : args.prompt;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return {
        text: response.text(),
        model: args.model,
        provider: "gemini" as const,
      };
    }

    if (args.provider === "openai") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: args.apiKey });

      const messages: Array<{ role: "system" | "user"; content: string }> = [];
      if (args.systemPrompt) {
        messages.push({ role: "system", content: args.systemPrompt });
      }
      messages.push({ role: "user", content: args.prompt });

      const completion = await client.chat.completions.create({
        model: args.model,
        messages,
        temperature: temp,
        max_tokens: maxTokens,
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error("No content in OpenAI response");

      return {
        text,
        model: args.model,
        provider: "openai" as const,
      };
    }

    if (args.provider === "anthropic") {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: args.apiKey });

      const message = await client.messages.create({
        model: args.model,
        max_tokens: maxTokens,
        ...(args.systemPrompt ? { system: args.systemPrompt } : {}),
        messages: [{ role: "user", content: args.prompt }],
      });

      const block = message.content[0];
      if (block.type !== "text") throw new Error("Unexpected Anthropic response type");

      return {
        text: block.text,
        model: args.model,
        provider: "anthropic" as const,
      };
    }

    throw new Error(`Unsupported provider: ${args.provider}`);
  },
});

// ─── Key Validation ─────────────────────────────────────────────────────

export const validateProviderKey = internalAction({
  args: {
    provider: v.union(v.literal("gemini"), v.literal("openai"), v.literal("anthropic")),
    apiKey: v.string(),
  },
  returns: v.object({
    isValid: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      if (args.provider === "gemini") {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(args.apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Say 'ok'");
        await result.response;
        return { isValid: true };
      }

      if (args.provider === "openai") {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey: args.apiKey });
        await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say 'ok'" }],
          max_tokens: 5,
        });
        return { isValid: true };
      }

      if (args.provider === "anthropic") {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey: args.apiKey });
        await client.messages.create({
          model: "claude-haiku-4-20250414",
          max_tokens: 5,
          messages: [{ role: "user", content: "Say 'ok'" }],
        });
        return { isValid: true };
      }

      return { isValid: false, error: `Unsupported provider: ${args.provider}` };
    } catch (error: any) {
      return {
        isValid: false,
        error: error.message?.includes("API_KEY_INVALID") || error.message?.includes("Incorrect API key")
          ? "Invalid API key. Please check and try again."
          : `Validation failed: ${error.message?.substring(0, 100)}`,
      };
    }
  },
});
