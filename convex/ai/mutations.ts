// AI Mutations for LTF1
// Handles all AI-related database operations

import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { getCurrentUser } from "../auth/users"

// Track AI session (store AI interaction for analytics)
export const trackAISession = mutation({
  args: {
    type: v.string(),
    input: v.string(),
    output: v.string(),
    model: v.union(v.literal("gemini-2.5-flash"), v.literal("gemini-2.5-flash-lite")),
    tokens: v.object({
      input: v.number(),
      output: v.number(),
      total: v.number(),
    }),
    cost: v.number(),
    latency: v.number(),
    cached: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error("Not authenticated")

    // Get user's active workspace
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first()
    
    if (!workspaceMember) {
      throw new Error("No workspace found")
    }

    return await ctx.db.insert("aiSessions", {
      userId: user._id,
      workspaceId: workspaceMember.workspaceId,
      type: args.type,
      input: args.input,
      output: args.output,
      model: args.model,
      tokens: args.tokens,
      cost: args.cost,
      latency: args.latency,
      cached: args.cached,
      createdAt: Date.now(),
    })
  },
})

// Add feedback to AI session
export const addAIFeedback = mutation({
  args: {
    sessionId: v.id("aiSessions"),
    helpful: v.boolean(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error("Not authenticated")

    const session = await ctx.db.get(args.sessionId)
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found or unauthorized")
    }

    await ctx.db.patch(args.sessionId, {
      feedback: {
        helpful: args.helpful,
        rating: args.rating,
        comment: args.comment,
      },
    })
  },
})

// Create AI insight
export const createAIInsight = mutation({
  args: {
    targetType: v.union(v.literal("task"), v.literal("sprint"), v.literal("project"), v.literal("team"), v.literal("user")),
    targetId: v.string(),
    insightType: v.union(
      v.literal("risk"),
      v.literal("recommendation"),
      v.literal("opportunity"),
      v.literal("anomaly"),
      v.literal("prediction")
    ),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    title: v.string(),
    description: v.string(),
    recommendations: v.array(v.string()),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error("Not authenticated")

    // Get user's active workspace
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first()
    
    if (!workspaceMember) {
      throw new Error("No workspace found")
    }

    return await ctx.db.insert("aiInsights", {
      workspaceId: workspaceMember.workspaceId,
      targetType: args.targetType,
      targetId: args.targetId,
      insightType: args.insightType,
      severity: args.severity,
      title: args.title,
      description: args.description,
      recommendations: args.recommendations,
      metadata: args.metadata,
      dismissed: false,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    })
  },
})

// Dismiss AI insight
export const dismissAIInsight = mutation({
  args: {
    insightId: v.id("aiInsights"),
    actionTaken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error("Not authenticated")

    const insight = await ctx.db.get(args.insightId)
    if (!insight) {
      throw new Error("Insight not found")
    }

    // Verify user has access to this workspace
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", insight.workspaceId).eq("userId", user._id)
      )
      .first()
    
    if (!workspaceMember) {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(args.insightId, {
      dismissed: true,
      actionTaken: args.actionTaken,
    })
  },
})

// Create AI task suggestion
export const createAITaskSuggestion = mutation({
  args: {
    sourceType: v.union(v.literal("commit"), v.literal("pr"), v.literal("comment"), v.literal("manual")),
    sourceData: v.any(),
    suggestedTasks: v.array(v.object({
      title: v.string(),
      description: v.string(),
      type: v.string(),
      priority: v.string(),
      estimate: v.optional(v.number()),
      confidence: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error("Not authenticated")

    // Get user's active workspace
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first()
    
    if (!workspaceMember) {
      throw new Error("No workspace found")
    }

    return await ctx.db.insert("aiTasks", {
      workspaceId: workspaceMember.workspaceId,
      userId: user._id,
      sourceType: args.sourceType,
      sourceData: args.sourceData,
      suggestedTasks: args.suggestedTasks,
      status: "pending",
      createdAt: Date.now(),
    })
  },
})

// Accept or reject AI task suggestion
export const updateAITaskStatus = mutation({
  args: {
    taskId: v.id("aiTasks"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new Error("Not authenticated")

    const aiTask = await ctx.db.get(args.taskId)
    if (!aiTask || aiTask.userId !== user._id) {
      throw new Error("Task not found or unauthorized")
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      processedAt: Date.now(),
    })
  },
})