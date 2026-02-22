"use node";

import { v } from "convex/values"
import { action } from "../_generated/server"

// Validate an API key by making a test request (legacy — uses Cerebras now)
export const validateApiKey = action({
  args: {
    apiKey: v.string()
  },
  returns: v.object({
    isValid: v.boolean(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    try {
      const OpenAI = (await import("openai")).default
      const client = new OpenAI({
        apiKey: args.apiKey,
        baseURL: "https://api.cerebras.ai/v1",
      })

      await client.chat.completions.create({
        model: "gpt-oss-120b",
        messages: [{ role: "user", content: "Say 'test'" }],
        max_tokens: 5,
      })

      return { isValid: true }
    } catch (error: any) {
      console.error("API key validation error:", error)
      return {
        isValid: false,
        error: error.message?.includes("API_KEY_INVALID") || error.message?.includes("Invalid API Key")
          ? "Invalid API key. Please check and try again."
          : "Failed to validate API key. Please ensure it's correct."
      }
    }
  }
})
