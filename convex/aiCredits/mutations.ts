import { v } from "convex/values"
import { mutation } from "../_generated/server"

// Simple encryption for API keys (in production, use proper encryption)
const encryptApiKey = (key: string): string => {
  // In production, use proper encryption like AES
  return Buffer.from(key).toString('base64')
}

const decryptApiKey = (encrypted: string): string => {
  return Buffer.from(encrypted, 'base64').toString()
}

// Setup initial AI credits for a user
export const setupUserAI = mutation({
  args: {
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    setupType: v.union(v.literal("free_credits"), v.literal("byok"), v.literal("pro_upgrade"))
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    const userId = identity.subject
    
    // Check if user already has credits setup
    const existing = await ctx.db
      .query("userAICredits")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first()
    
    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        subscriptionTier: args.tier,
        freeCredits: args.tier === 'free' ? 100 : args.tier === 'pro' ? 10000 : 50000,
        monthlyCreditsUsed: 0,
        lastResetDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } else {
      // Create new record
      await ctx.db.insert("userAICredits", {
        userId,
        freeCredits: args.tier === 'free' ? 100 : args.tier === 'pro' ? 10000 : 50000,
        purchasedCredits: 0,
        totalCreditsUsed: 0,
        monthlyCreditsUsed: 0,
        lastResetDate: new Date().toISOString(),
        hasOwnKey: false,
        subscriptionTier: args.tier,
        totalRequests: 0,
        totalTokensUsed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    return { success: true }
  }
})

// Save user's API key after validation
export const saveApiKey = mutation({
  args: {
    apiKey: v.string()
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    const userId = identity.subject
    
    // Encrypt and save the API key
    const encryptedKey = encryptApiKey(args.apiKey)
    
    // Get or create user credits record
    const existing = await ctx.db
      .query("userAICredits")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first()
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        hasOwnKey: true,
        encryptedApiKey: encryptedKey,
        keyAddedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } else {
      await ctx.db.insert("userAICredits", {
        userId,
        freeCredits: 0,
        purchasedCredits: 0,
        totalCreditsUsed: 0,
        monthlyCreditsUsed: 0,
        lastResetDate: new Date().toISOString(),
        hasOwnKey: true,
        encryptedApiKey: encryptedKey,
        keyAddedAt: new Date().toISOString(),
        subscriptionTier: "free",
        totalRequests: 0,
        totalTokensUsed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    return { success: true }
  }
})

// Remove user's API key
export const removeApiKey = mutation({
  args: {},
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    const userId = identity.subject
    
    const userCredits = await ctx.db
      .query("userAICredits")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first()
    
    if (!userCredits) {
      throw new Error("No AI credits record found")
    }
    
    await ctx.db.patch(userCredits._id, {
      hasOwnKey: false,
      encryptedApiKey: undefined,
      keyAddedAt: undefined,
      updatedAt: new Date().toISOString()
    })
    
    return { success: true }
  }
})

// Track AI usage
export const trackAIUsage = mutation({
  args: {
    requestType: v.string(),
    model: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    creditsUsed: v.number(),
    keyType: v.union(v.literal("platform"), v.literal("user"), v.literal("free")),
    success: v.boolean(),
    error: v.optional(v.string()),
    responseTime: v.number()
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    const userId = identity.subject
    
    // Log the usage
    await ctx.db.insert("aiUsageLogs", {
      userId,
      ...args,
      timestamp: new Date().toISOString()
    })
    
    // Update user credits if not using own key
    if (args.keyType !== "user" && args.success) {
      const userCredits = await ctx.db
        .query("userAICredits")
        .withIndex("by_user", q => q.eq("userId", userId))
        .first()
      
      if (userCredits) {
        await ctx.db.patch(userCredits._id, {
          totalCreditsUsed: userCredits.totalCreditsUsed + args.creditsUsed,
          monthlyCreditsUsed: userCredits.monthlyCreditsUsed + args.creditsUsed,
          totalRequests: userCredits.totalRequests + 1,
          totalTokensUsed: userCredits.totalTokensUsed + args.totalTokens,
          lastUsedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }
    
    return { success: true }
  }
})

// Reset monthly credits (called by a cron job)
export const resetMonthlyCredits = mutation({
  args: {},
  returns: v.object({ 
    success: v.boolean(), 
    usersReset: v.number() 
  }),
  handler: async (ctx) => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    
    // Get all users whose credits need resetting
    const usersToReset = await ctx.db
      .query("userAICredits")
      .filter(q => 
        q.lt(q.field("lastResetDate"), lastMonth.toISOString())
      )
      .collect()
    
    // Reset credits for each user
    for (const user of usersToReset) {
      const newCredits = 
        user.subscriptionTier === 'free' ? 100 :
        user.subscriptionTier === 'pro' ? 10000 :
        50000
      
      await ctx.db.patch(user._id, {
        freeCredits: newCredits,
        monthlyCreditsUsed: 0,
        lastResetDate: now.toISOString(),
        updatedAt: now.toISOString()
      })
    }
    
    return { 
      success: true, 
      usersReset: usersToReset.length 
    }
  }
})