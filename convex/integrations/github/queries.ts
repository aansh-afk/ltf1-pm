import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";

// Get GitHub installations for a workspace
export const getWorkspaceInstallations = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check workspace membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership) throw new Error("Not a workspace member");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const installations = [];
    if (workspace.settings?.integrations?.githubInstallationId) {
      const installationId = workspace.settings.integrations.githubInstallationId;
      const installation = await ctx.db
        .query("githubInstallations")
        .withIndex("by_installation_id", (q) => 
          q.eq("installationId", installationId)
        )
        .first();

      if (installation) {
        installations.push(installation);
      }
    }

    return installations;
  },
});

// Get repositories for an installation
export const getInstallationRepositories = query({
  args: {
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify user has access to this installation
    const access = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (!access) throw new Error("Installation not found");

    const repositories = await ctx.db
      .query("githubRepositories")
      .withIndex("by_installation", (q) => q.eq("installationId", args.installationId))
      .collect();

    return repositories;
  },
});

// Get GitHub activity for a project
export const getProjectGitHubActivity = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (!project.repository?.url) {
      return [];
    }

    // Extract repository info from URL
    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    const activities = await ctx.db
      .query("githubActivities")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

// Get GitHub stats for a developer
export const getDeveloperGitHubStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile?.githubStats) {
      return null;
    }

    // Check if stats are stale (older than 24 hours)
    const isStale = Date.now() - profile.githubStats.lastSynced > 24 * 60 * 60 * 1000;

    return {
      ...profile.githubStats,
      isStale,
    };
  },
});

// Get pull requests linked to a task
export const getTaskPullRequests = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const project = await ctx.db.get(task.projectId);
    if (!project || !project.repository?.url) {
      return [];
    }

    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    // Get task key (e.g., WEB-123)
    const taskKey = `${project.key}-${task.number}`;

    const allPullRequests = await ctx.db
      .query("githubPullRequests")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .collect();
      
    const pullRequests = allPullRequests.filter(pr => 
      pr.linkedTaskKeys.includes(taskKey)
    );

    return pullRequests;
  },
});

// Get commits linked to a task
export const getTaskCommits = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const project = await ctx.db.get(task.projectId);
    if (!project || !project.repository?.url) {
      return [];
    }

    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    // Get task key (e.g., WEB-123)
    const taskKey = `${project.key}-${task.number}`;

    const allCommits = await ctx.db
      .query("githubCommits")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .collect();
      
    const commits = allCommits.filter(commit => 
      commit.linkedTaskKeys.includes(taskKey)
    );

    return commits;
  },
});

// Note: getRepositoryDetails is now in queryActions.ts

// Search repositories in an installation
export const searchRepositories = query({
  args: {
    installationId: v.number(),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const repos = await ctx.db
      .query("githubRepositories")
      .withIndex("by_installation", (q) => q.eq("installationId", args.installationId))
      .collect()
      
    // Filter in memory for case-insensitive search
    const filtered = repos.filter(repo => 
      repo.name.toLowerCase().includes(args.query.toLowerCase()) ||
      repo.fullName.toLowerCase().includes(args.query.toLowerCase())
    ).slice(0, 10);

    return filtered;
  },
});

// Internal query to get repository by ID
export const getRepositoryById = internalQuery({
  args: {
    repositoryId: v.id("githubRepositories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.repositoryId);
  },
});