import { v } from "convex/values"
import { mutation } from "../../_generated/server"

export const storeOAuthState = mutation({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }
    
    // Store OAuth state with expiry (5 minutes)
    await ctx.db.insert("gitlabOAuthStates", {
      state: args.state,
      userId: identity.subject,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    })
  },
})

export const storeAccessToken = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresIn: v.number(),
    scope: v.optional(v.string()),
    userId: v.number(),
    username: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }
    
    // Check if user already has GitLab integration
    const existing = await ctx.db
      .query("gitlabIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()
    
    if (existing) {
      // Update existing integration
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: Date.now() + args.expiresIn * 1000,
        scope: args.scope,
        gitlabUserId: args.userId,
        gitlabUsername: args.username,
        gitlabEmail: args.email,
        gitlabName: args.name,
        gitlabAvatarUrl: args.avatarUrl,
        updatedAt: Date.now(),
      })
    } else {
      // Create new integration
      await ctx.db.insert("gitlabIntegrations", {
        userId: identity.subject,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: Date.now() + args.expiresIn * 1000,
        scope: args.scope,
        gitlabUserId: args.userId,
        gitlabUsername: args.username,
        gitlabEmail: args.email,
        gitlabName: args.name,
        gitlabAvatarUrl: args.avatarUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})

export const disconnectGitLab = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity || identity.subject !== args.userId) {
      throw new Error("Unauthorized")
    }
    
    // Find and delete GitLab integration
    const integration = await ctx.db
      .query("gitlabIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()
    
    if (integration) {
      await ctx.db.delete(integration._id)
      
      // Also remove any GitLab project connections
      const projects = await ctx.db
        .query("gitlabProjects")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect()
      
      for (const project of projects) {
        await ctx.db.delete(project._id)
      }
    }
  },
})

export const connectProjectToGitLab = mutation({
  args: {
    projectId: v.id("projects"),
    gitlabProjectId: v.number(),
    gitlabProjectPath: v.string(),
    gitlabProjectUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }
    
    // Check if user has GitLab integration
    const integration = await ctx.db
      .query("gitlabIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()
    
    if (!integration) {
      throw new Error("GitLab not connected")
    }
    
    // Check if project already connected
    const existing = await ctx.db
      .query("gitlabProjects")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first()
    
    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        gitlabProjectId: args.gitlabProjectId,
        gitlabProjectPath: args.gitlabProjectPath,
        gitlabProjectUrl: args.gitlabProjectUrl,
        updatedAt: Date.now(),
      })
    } else {
      // Create new connection
      await ctx.db.insert("gitlabProjects", {
        userId: identity.subject,
        projectId: args.projectId,
        gitlabProjectId: args.gitlabProjectId,
        gitlabProjectPath: args.gitlabProjectPath,
        gitlabProjectUrl: args.gitlabProjectUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
    
    // Update project with GitLab info
    await ctx.db.patch(args.projectId, {
      repository: {
        provider: "gitlab",
        url: args.gitlabProjectUrl,
        defaultBranch: "main", // Will be updated by sync
      },
    })
  },
})

export const syncGitLabIssues = mutation({
  args: {
    projectId: v.id("projects"),
    issues: v.array(v.object({
      id: v.number(),
      iid: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      state: v.string(),
      labels: v.array(v.string()),
      assignees: v.array(v.object({
        id: v.number(),
        username: v.string(),
        name: v.string(),
        avatar_url: v.string(),
      })),
      author: v.object({
        id: v.number(),
        username: v.string(),
        name: v.string(),
        avatar_url: v.string(),
      }),
      created_at: v.string(),
      updated_at: v.string(),
      due_date: v.optional(v.string()),
      web_url: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }
    
    // Get the internal user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    // Process each issue
    for (const issue of args.issues) {
      // Check if task already exists for this issue
      const existingTask = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .filter((q) => q.eq(q.field("gitlabIssueId"), issue.id))
        .first()
      
      if (existingTask) {
        // Update existing task
        await ctx.db.patch(existingTask._id, {
          title: issue.title,
          description: issue.description,
          status: issue.state === "opened" ? "in_progress" : "done",
          labels: issue.labels,
          dueDate: issue.due_date ? new Date(issue.due_date).getTime() : undefined,
          updatedAt: Date.now(),
        })
      } else {
        // Create new task from issue
        await ctx.db.insert("tasks", {
          projectId: args.projectId,
          number: issue.iid,
          title: issue.title,
          description: issue.description,
          status: issue.state === "opened" ? "todo" : "done",
          priority: "medium",
          type: "task",
          labels: issue.labels,
          reporterId: user._id,
          assigneeIds: [], // Would need to map GitLab users to system users
          dueDate: issue.due_date ? new Date(issue.due_date).getTime() : undefined,
          gitlabIssueId: issue.id,
          gitlabIssueUrl: issue.web_url,
          position: 0,
          createdAt: new Date(issue.created_at).getTime(),
          updatedAt: new Date(issue.updated_at).getTime(),
        })
      }
    }
  },
})

export const syncGitLabMergeRequests = mutation({
  args: {
    projectId: v.id("projects"),
    mergeRequests: v.array(v.object({
      id: v.number(),
      iid: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      state: v.string(),
      source_branch: v.string(),
      target_branch: v.string(),
      author: v.object({
        id: v.number(),
        username: v.string(),
        name: v.string(),
        avatar_url: v.string(),
      }),
      assignees: v.array(v.object({
        id: v.number(),
        username: v.string(),
        name: v.string(),
        avatar_url: v.string(),
      })),
      labels: v.array(v.string()),
      created_at: v.string(),
      updated_at: v.string(),
      merged_at: v.optional(v.string()),
      closed_at: v.optional(v.string()),
      web_url: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }
    
    // Store merge requests
    for (const mr of args.mergeRequests) {
      // Check if MR already exists
      const existing = await ctx.db
        .query("gitlabMergeRequests")
        .withIndex("by_project_and_mr", (q) => 
          q.eq("projectId", args.projectId).eq("gitlabMrId", mr.id)
        )
        .first()
      
      if (existing) {
        // Update existing MR
        await ctx.db.patch(existing._id, {
          title: mr.title,
          description: mr.description,
          state: mr.state,
          sourceBranch: mr.source_branch,
          targetBranch: mr.target_branch,
          labels: mr.labels,
          mergedAt: mr.merged_at ? new Date(mr.merged_at).getTime() : undefined,
          closedAt: mr.closed_at ? new Date(mr.closed_at).getTime() : undefined,
          updatedAt: Date.now(),
        })
      } else {
        // Create new MR record
        await ctx.db.insert("gitlabMergeRequests", {
          projectId: args.projectId,
          gitlabMrId: mr.id,
          gitlabMrIid: mr.iid,
          title: mr.title,
          description: mr.description,
          state: mr.state,
          sourceBranch: mr.source_branch,
          targetBranch: mr.target_branch,
          authorId: mr.author.id,
          authorUsername: mr.author.username,
          labels: mr.labels,
          webUrl: mr.web_url,
          mergedAt: mr.merged_at ? new Date(mr.merged_at).getTime() : undefined,
          closedAt: mr.closed_at ? new Date(mr.closed_at).getTime() : undefined,
          createdAt: new Date(mr.created_at).getTime(),
          updatedAt: new Date(mr.updated_at).getTime(),
        })
      }
    }
  },
})