import { v } from "convex/values"
import { query } from "../_generated/server"

// Get user's AI credits and settings
export const getUserAICredits = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      hasSetup: v.boolean(),
      freeCredits: v.number(),
      purchasedCredits: v.number(),
      creditsRemaining: v.number(),
      monthlyCreditsUsed: v.number(),
      hasOwnKey: v.boolean(),
      subscriptionTier: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
      totalRequests: v.number(),
      hasApiKey: v.optional(v.boolean())
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    
    const userId = identity.subject
    
    const userCredits = await ctx.db
      .query("userAICredits")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first()
    
    if (!userCredits) {
      return {
        hasSetup: false,
        freeCredits: 0,
        purchasedCredits: 0,
        creditsRemaining: 0,
        monthlyCreditsUsed: 0,
        hasOwnKey: false,
        subscriptionTier: 'free' as const,
        totalRequests: 0
      }
    }
    
    // Don't send the encrypted API key to the client
    const { encryptedApiKey, ...safeCredits } = userCredits
    
    return {
      ...safeCredits,
      hasSetup: true,
      creditsRemaining: userCredits.freeCredits + userCredits.purchasedCredits - userCredits.monthlyCreditsUsed,
      hasApiKey: !!encryptedApiKey
    }
  }
})

// Get user's AI usage history
export const getUserAIUsage = query({
  args: {
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("aiUsageLogs"),
    _creationTime: v.number(),
    userId: v.string(),
    requestType: v.string(),
    model: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    creditsUsed: v.number(),
    keyType: v.union(v.literal("platform"), v.literal("user"), v.literal("free")),
    success: v.boolean(),
    error: v.optional(v.string()),
    responseTime: v.number(),
    timestamp: v.string()
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    
    const userId = identity.subject
    const limit = args.limit || 50
    
    const usage = await ctx.db
      .query("aiUsageLogs")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .take(limit)
    
    return usage
  }
})

// Get AI usage stats for current month
export const getMonthlyUsageStats = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      totalRequests: v.number(),
      successfulRequests: v.number(),
      failedRequests: v.number(),
      totalTokensUsed: v.number(),
      totalCreditsUsed: v.number(),
      averageResponseTime: v.number(),
      requestsByType: v.record(v.string(), v.number()),
      keyTypeBreakdown: v.object({
        platform: v.number(),
        user: v.number(),
        free: v.number()
      })
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    
    const userId = identity.subject
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const logs = await ctx.db
      .query("aiUsageLogs")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.gte(q.field("timestamp"), startOfMonth.toISOString()))
      .collect()
    
    const stats = {
      totalRequests: logs.length,
      successfulRequests: logs.filter(l => l.success).length,
      failedRequests: logs.filter(l => !l.success).length,
      totalTokensUsed: logs.reduce((sum, l) => sum + l.totalTokens, 0),
      totalCreditsUsed: logs.reduce((sum, l) => sum + l.creditsUsed, 0),
      averageResponseTime: logs.length > 0 
        ? logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length 
        : 0,
      requestsByType: {} as Record<string, number>,
      keyTypeBreakdown: {
        platform: logs.filter(l => l.keyType === 'platform').length,
        user: logs.filter(l => l.keyType === 'user').length,
        free: logs.filter(l => l.keyType === 'free').length
      }
    }
    
    // Count requests by type
    logs.forEach(log => {
      stats.requestsByType[log.requestType] = (stats.requestsByType[log.requestType] || 0) + 1
    })
    
    return stats
  }
})

// Check if user can make an AI request
export const canMakeAIRequest = query({
  args: {
    estimatedCredits: v.number()
  },
  returns: v.object({
    canMakeRequest: v.boolean(),
    reason: v.optional(v.string()),
    creditsRemaining: v.optional(v.number()),
    usingOwnKey: v.optional(v.boolean()),
    usingPlatformKey: v.optional(v.boolean())
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { canMakeRequest: false, reason: "Not authenticated" }
    
    const userId = identity.subject
    
    const userCredits = await ctx.db
      .query("userAICredits")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first()
    
    if (!userCredits) {
      return { 
        canMakeRequest: false, 
        reason: "AI features not set up. Please configure in Settings."
      }
    }
    
    // If user has their own key, always allow
    if (userCredits.hasOwnKey) {
      return { canMakeRequest: true, usingOwnKey: true }
    }
    
    // Check if user has enough credits
    const creditsRemaining = userCredits.freeCredits + userCredits.purchasedCredits - userCredits.monthlyCreditsUsed
    
    if (creditsRemaining < args.estimatedCredits) {
      return { 
        canMakeRequest: false, 
        reason: `Insufficient credits. You need ${args.estimatedCredits} credits but only have ${creditsRemaining} remaining.`,
        creditsRemaining
      }
    }
    
    // Check rate limits for free tier
    if (userCredits.subscriptionTier === 'free') {
      // Get requests in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const recentRequests = await ctx.db
        .query("aiUsageLogs")
        .withIndex("by_user", q => q.eq("userId", userId))
        .filter(q => q.gte(q.field("timestamp"), oneHourAgo))
        .collect()
      
      if (recentRequests.length >= 10) {
        return { 
          canMakeRequest: false, 
          reason: "Rate limit exceeded. Free tier is limited to 10 requests per hour."
        }
      }
    }
    
    return { 
      canMakeRequest: true, 
      creditsRemaining,
      usingPlatformKey: true
    }
  }
})

// Get pricing tier information
export const getPricingTiers = query({
  args: {},
  returns: v.array(v.object({
    tier: v.string(),
    monthlyFreeCredits: v.number(),
    creditPrice: v.number(),
    requestsPerMinute: v.number(),
    requestsPerDay: v.number(),
    maxTokensPerRequest: v.number(),
    features: v.array(v.string()),
    allowsBYOK: v.boolean()
  })),
  handler: async (ctx) => {
    const tiers = await ctx.db.query("aiPricingTiers").collect()
    
    if (tiers.length === 0) {
      // Return default tiers if not in database
      return [
        {
          tier: 'free',
          monthlyFreeCredits: 100,
          creditPrice: 0,
          requestsPerMinute: 10,
          requestsPerDay: 100,
          maxTokensPerRequest: 2000,
          features: [
            '100 free credits/month',
            'Basic AI features',
            'Rate limited',
            'Community support'
          ],
          allowsBYOK: true
        },
        {
          tier: 'pro',
          monthlyFreeCredits: 10000,
          creditPrice: 0.01, // $0.01 per credit
          requestsPerMinute: 100,
          requestsPerDay: 5000,
          maxTokensPerRequest: 8000,
          features: [
            '10,000 credits/month',
            'All AI features',
            'Priority processing',
            'Email support',
            'Advanced models'
          ],
          allowsBYOK: true
        },
        {
          tier: 'enterprise',
          monthlyFreeCredits: 50000,
          creditPrice: 0.008, // $0.008 per credit
          requestsPerMinute: 1000,
          requestsPerDay: -1, // unlimited
          maxTokensPerRequest: 32000,
          features: [
            '50,000+ credits/month',
            'Custom AI models',
            'Dedicated support',
            'SLA guarantee',
            'Custom integrations'
          ],
          allowsBYOK: true
        }
      ]
    }
    
    return tiers
  }
})