import { defineTable } from "convex/server"
import { v } from "convex/values"

// User AI credits and usage tracking
export const userAICredits = defineTable({
  userId: v.string(),
  
  // Credit system
  freeCredits: v.number(), // Free monthly credits
  purchasedCredits: v.number(), // Additional purchased credits
  totalCreditsUsed: v.number(), // Lifetime usage
  monthlyCreditsUsed: v.number(), // Current month usage
  lastResetDate: v.string(), // Last monthly reset
  
  // BYOK (Bring Your Own Key)
  hasOwnKey: v.boolean(),
  encryptedApiKey: v.optional(v.string()), // Encrypted Gemini API key
  keyAddedAt: v.optional(v.string()),
  keyLastUsed: v.optional(v.string()),
  
  // Subscription status
  subscriptionTier: v.union(
    v.literal("free"),
    v.literal("pro"),
    v.literal("enterprise"),
    v.literal("max") // Max Intelligence tier with Gemini 2.5 Pro
  ),
  
  // Usage metrics
  totalRequests: v.number(),
  totalTokensUsed: v.number(),
  lastUsedAt: v.optional(v.string()),
  
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index("by_user", ["userId"])

// AI usage logs for tracking and billing
export const aiUsageLogs = defineTable({
  userId: v.string(),
  
  // Request details
  requestType: v.string(), // e.g., "task_generation", "code_review", "meeting_summary"
  model: v.string(), // e.g., "gemini-2.0-flash-exp"
  
  // Usage metrics
  promptTokens: v.number(),
  completionTokens: v.number(),
  totalTokens: v.number(),
  creditsUsed: v.number(),
  
  // Key used
  keyType: v.union(
    v.literal("platform"), // Our key
    v.literal("user"), // User's BYOK
    v.literal("free") // Free tier
  ),
  
  // Response info
  success: v.boolean(),
  error: v.optional(v.string()),
  responseTime: v.number(), // in ms
  
  timestamp: v.string(),
})
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"])

// Pricing tiers and limits
export const aiPricingTiers = defineTable({
  tier: v.string(),
  
  // Credits
  monthlyFreeCredits: v.number(),
  creditPrice: v.number(), // Price per 1000 credits
  
  // Rate limits
  requestsPerMinute: v.number(),
  requestsPerDay: v.number(),
  maxTokensPerRequest: v.number(),
  
  // Features
  features: v.array(v.string()),
  
  // BYOK
  allowsBYOK: v.boolean(),
  
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index("by_tier", ["tier"])