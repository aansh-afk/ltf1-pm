"use node";

import { v } from "convex/values"
import { action } from "../_generated/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Validate an API key by making a test request
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
      const genAI = new GoogleGenerativeAI(args.apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      
      // Simple test to validate the key
      const result = await model.generateContent("Say 'test'")
      const response = await result.response
      
      if (!response) {
        return { isValid: false, error: "Invalid API key - no response" }
      }
      
      return { isValid: true }
    } catch (error: any) {
      console.error("API key validation error:", error)
      return { 
        isValid: false, 
        error: error.message?.includes("API_KEY_INVALID") 
          ? "Invalid API key. Please check and try again."
          : "Failed to validate API key. Please ensure it's correct."
      }
    }
  }
})