import { v } from "convex/values"
import { query } from "../../_generated/server"

export const verifyOAuthState = query({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if state exists and is not expired
    const oauthState = await ctx.db
      .query("gitlabOAuthStates")
      .filter((q) => 
        q.and(
          q.eq(q.field("state"), args.state),
          q.gt(q.field("expiresAt"), Date.now())
        )
      )
      .first()
    
    return !!oauthState
  },
})

export const getGitLabIntegration = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }
    
    const integration = await ctx.db
      .query("gitlabIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()
    
    if (!integration) {
      return null
    }
    
    // Don't return sensitive data
    return {
      id: integration._id,
      gitlabUsername: integration.gitlabUsername,
      gitlabEmail: integration.gitlabEmail,
      gitlabName: integration.gitlabName,
      gitlabAvatarUrl: integration.gitlabAvatarUrl,
      createdAt: integration.createdAt,
      isExpired: integration.expiresAt < Date.now(),
    }
  },
})

export const getProjectGitLabConnection = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }
    
    const connection = await ctx.db
      .query("gitlabProjects")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first()
    
    return connection
  },
})

export const getGitLabProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }
    
    const integration = await ctx.db
      .query("gitlabIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()
    
    if (!integration || integration.expiresAt < Date.now()) {
      return []
    }
    
    // This would normally fetch from GitLab API
    // For now, return projects stored in database
    const projects = await ctx.db
      .query("gitlabProjects")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
    
    return projects
  },
})

export const getGitLabIssues = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }
    
    // Get tasks that are linked to GitLab issues
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.neq(q.field("gitlabIssueId"), undefined))
      .collect()
    
    return tasks
  },
})

export const getGitLabMergeRequests = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }
    
    const mergeRequests = await ctx.db
      .query("gitlabMergeRequests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(20)
    
    return mergeRequests
  },
})

export const getGitLabActivity = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }
    
    const limit = args.limit || 10
    
    // Get recent merge requests
    const mergeRequests = await ctx.db
      .query("gitlabMergeRequests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(limit)
    
    // Get recent issues (tasks)
    const issues = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.neq(q.field("gitlabIssueId"), undefined))
      .order("desc")
      .take(limit)
    
    // Combine and sort by date
    const activity = [
      ...mergeRequests.map(mr => ({
        type: "merge_request" as const,
        id: mr._id,
        title: mr.title,
        state: mr.state,
        createdAt: mr.createdAt,
        updatedAt: mr.updatedAt,
        webUrl: mr.webUrl,
      })),
      ...issues.map(issue => ({
        type: "issue" as const,
        id: issue._id,
        title: issue.title,
        state: issue.status,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        webUrl: issue.gitlabIssueUrl,
      })),
    ].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit)
    
    return activity
  },
})