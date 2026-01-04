// AI Queries for LTF1
// Retrieves AI-related data from the database

import { v } from "convex/values"
import { query } from "../_generated/server"
import { api } from "../_generated/api"

// Get AI sessions for current user
export const getUserAISessions = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {})
    if (!user) return []

    const limit = args.limit || 50
    
    if (args.type) {
      return await ctx.db
        .query("aiSessions")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .order("desc")
        .take(limit)
    }
    
    return await ctx.db
      .query("aiSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit)
  },
})

// Get AI usage statistics for workspace
export const getWorkspaceAIStats = query({
  args: {
    workspaceId: v.id("workspaces"),
    timeRange: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {})
    if (!user) return null

    // Verify user has access to workspace
    const member: any = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first()
    
    if (!member) return null

    // Calculate time range
    const now = Date.now()
    let startTime = now - 24 * 60 * 60 * 1000 // Default: last 24 hours
    
    if (args.timeRange === "week") {
      startTime = now - 7 * 24 * 60 * 60 * 1000
    } else if (args.timeRange === "month") {
      startTime = now - 30 * 24 * 60 * 60 * 1000
    }

    // Get all sessions in time range
    const sessions = await ctx.db
      .query("aiSessions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect()

    // Calculate statistics
    const stats = {
      totalSessions: sessions.length,
      totalTokens: sessions.reduce((sum, s) => sum + s.tokens.total, 0),
      totalCost: sessions.reduce((sum, s) => sum + s.cost, 0),
      averageLatency: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.latency, 0) / sessions.length 
        : 0,
      cacheHitRate: sessions.length > 0
        ? sessions.filter(s => s.cached).length / sessions.length
        : 0,
      modelUsage: {
        flash: sessions.filter(s => s.model === "gemini-2.0-flash-exp" || s.model === "gemini-2.5-flash").length,
        flashLite: sessions.filter(s => s.model === "gemini-1.5-flash-8b" || s.model === "gemini-2.5-flash-lite").length,
      },
      typeBreakdown: sessions.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      userBreakdown: sessions.reduce((acc, s) => {
        acc[s.userId] = (acc[s.userId] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return stats
  },
})

// Get active AI insights
export const getActiveInsights = query({
  args: {
    targetType: v.optional(v.union(v.literal("task"), v.literal("sprint"), v.literal("project"), v.literal("team"), v.literal("user"))),
    targetId: v.optional(v.string()),
    insightType: v.optional(v.union(
      v.literal("risk"),
      v.literal("recommendation"),
      v.literal("opportunity"),
      v.literal("anomaly"),
      v.literal("prediction")
    )),
  },
  handler: async (ctx, args) => {
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {})
    if (!user) return []

    // Get user's workspace
    const member: any = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first()
    
    if (!member) return []

    // Filter out expired insights
    const now = Date.now()
    
    // Apply filters
    if (args.targetType && args.targetId) {
      const insights: any[] = await ctx.db
        .query("aiInsights")
        .withIndex("by_target", (q) => 
          q.eq("targetType", args.targetType!).eq("targetId", args.targetId!)
        )
        .filter((q) => 
          q.and(
            q.eq(q.field("workspaceId"), member.workspaceId),
            q.eq(q.field("dismissed"), false)
          )
        )
        .collect()
      
      return insights.filter((insight: any) => 
        !insight.expiresAt || insight.expiresAt > now
      )
    } else if (args.insightType) {
      const insights: any[] = await ctx.db
        .query("aiInsights")
        .withIndex("by_insight_type", (q) => q.eq("insightType", args.insightType!))
        .filter((q) => 
          q.and(
            q.eq(q.field("workspaceId"), member.workspaceId),
            q.eq(q.field("dismissed"), false)
          )
        )
        .collect()
      
      return insights.filter((insight: any) => 
        !insight.expiresAt || insight.expiresAt > now
      )
    }
    
    const insights: any[] = await ctx.db
      .query("aiInsights")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", member.workspaceId))
      .filter((q) => q.eq(q.field("dismissed"), false))
      .collect()
    
    return insights.filter((insight: any) => 
      !insight.expiresAt || insight.expiresAt > now
    )
  },
})

// Get pending AI task suggestions
export const getPendingAITasks = query({
  args: {},
  handler: async (ctx, args) => {
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {})
    if (!user) return []

    return await ctx.db
      .query("aiTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .take(10)
  },
})

// Get AI feedback summary
export const getAIFeedbackSummary = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const user: any = await ctx.runQuery(api.auth.users.getCurrentUser, {})
    if (!user) return null

    // Verify user has access to workspace
    const member: any = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first()
    
    if (!member || member.role === "viewer") return null

    // Get all sessions with feedback
    const sessions = await ctx.db
      .query("aiSessions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.neq(q.field("feedback"), undefined))
      .collect()

    if (sessions.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        helpfulPercentage: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }
    }

    const feedbackSessions = sessions.filter(s => s.feedback)
    const ratings = feedbackSessions.map(s => s.feedback!.rating)
    const helpfulCount = feedbackSessions.filter(s => s.feedback!.helpful).length

    const ratingDistribution = ratings.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return {
      totalFeedback: feedbackSessions.length,
      averageRating: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
      helpfulPercentage: (helpfulCount / feedbackSessions.length) * 100,
      ratingDistribution: {
        1: ratingDistribution[1] || 0,
        2: ratingDistribution[2] || 0,
        3: ratingDistribution[3] || 0,
        4: ratingDistribution[4] || 0,
        5: ratingDistribution[5] || 0,
      },
      recentComments: feedbackSessions
        .filter(s => s.feedback!.comment)
        .slice(-5)
        .map(s => ({
          rating: s.feedback!.rating,
          comment: s.feedback!.comment,
          type: s.type,
          createdAt: s.createdAt,
        })),
    }
  },
})