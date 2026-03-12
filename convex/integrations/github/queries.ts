import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../../lib/auth";

// Get GitHub installations for a workspace (supports multi-installation)
export const getWorkspaceInstallations = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

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

    const installationsResult: Array<any> = [];
    const seenInstallationIds = new Set<number>();

    // 1. Get installations from junction table (new multi-installation support)
    const junctionLinks = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const link of junctionLinks) {
      if (!seenInstallationIds.has(link.installationId)) {
        const installation = await ctx.db
          .query("githubInstallations")
          .withIndex("by_installation_id", (q) =>
            q.eq("installationId", link.installationId)
          )
          .first();

        if (installation) {
          seenInstallationIds.add(link.installationId);
          installationsResult.push({
            ...installation,
            linkedAt: link.addedAt,
            linkedById: link.addedBy,
            isPrimary: link.isPrimary,
            nickname: link.nickname,
            syncSettings: link.syncSettings,
          });
        }
      }
    }

    // 2. Backward compatibility: also check legacy single installation field
    if (workspace.settings?.integrations?.githubInstallationId) {
      const legacyInstallationId = workspace.settings.integrations.githubInstallationId;
      if (!seenInstallationIds.has(legacyInstallationId)) {
        const installation = await ctx.db
          .query("githubInstallations")
          .withIndex("by_installation_id", (q) =>
            q.eq("installationId", legacyInstallationId)
          )
          .first();

        if (installation) {
          seenInstallationIds.add(legacyInstallationId);
          installationsResult.push({
            ...installation,
            linkedAt: installation.installedAt,
            isPrimary: installationsResult.length === 0, // Primary if first
          });
        }
      }
    }

    return installationsResult;
  },
});

// Get repositories for an installation
export const getInstallationRepositories = query({
  args: {
    installationId: v.number(),
  },
  returns: v.array(v.any()),
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
  returns: v.array(v.any()),
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

// Get full repository details for a project
export const getProjectRepository = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project?.repository?.url) return null;

    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    const repository = await ctx.db
      .query("githubRepositories")
      .withIndex("by_full_name", (q) => q.eq("fullName", repoFullName))
      .first();

    return repository;
  },
});

// Get GitHub stats for a developer
export const getDeveloperGitHubStats = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(v.any(), v.null()),
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
  returns: v.array(v.any()),
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
  returns: v.array(v.any()),
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

// Get commits for a project
export const getProjectCommits = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (!project.repository?.url) {
      return [];
    }

    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    const commits = await ctx.db
      .query("githubCommits")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .order("desc")
      .take(200);

    return commits;
  },
});

// Get pull requests for a project
export const getProjectPullRequests = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (!project.repository?.url) {
      return [];
    }

    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    const pullRequests = await ctx.db
      .query("githubPullRequests")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .order("desc")
      .take(200);

    return pullRequests;
  },
});

// Get issues for a project
export const getProjectIssues = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (!project.repository?.url) {
      return [];
    }

    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    const issues = await ctx.db
      .query("githubIssues")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .order("desc")
      .take(200);

    return issues;
  },
});

// Note: getRepositoryDetails is now in queryActions.ts

// Search repositories in an installation
export const searchRepositories = query({
  args: {
    installationId: v.number(),
    query: v.string(),
  },
  returns: v.array(v.any()),
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
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.repositoryId);
  },
});

// Debug query to check database state
export const debugGitHubState = query({
  args: {},
  returns: v.object({
    installationsCount: v.number(),
    repositoriesCount: v.number(),
    installations: v.array(v.any()),
    repositories: v.array(v.any()),
  }),
  handler: async (ctx) => {
    const installations = await ctx.db.query("githubInstallations").collect();
    const repositories = await ctx.db.query("githubRepositories").take(20);

    return {
      installationsCount: installations.length,
      repositoriesCount: (await ctx.db.query("githubRepositories").collect()).length,
      installations: installations.map(i => ({
        id: i._id,
        installationId: i.installationId,
        accountName: i.accountName,
        repositorySelection: i.repositorySelection,
        installedAt: i.installedAt,
      })),
      repositories: repositories.map(r => ({
        id: r._id,
        name: r.name,
        fullName: r.fullName,
        installationId: r.installationId,
      })),
    };
  },
});