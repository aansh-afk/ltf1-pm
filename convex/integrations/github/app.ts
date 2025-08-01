import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalMutation } from "../../_generated/server";

// Note: GitHub App instance creation and Octokit installation
// are handled in nodeActions.ts using Convex's Node.js runtime
// This file contains only pure TypeScript functions

// Helper to get installation access token (calls Node.js action)
export async function getInstallationOctokit(installationId: number) {
  // This function will be replaced by calls to nodeActions.ts
  // from the calling code, as we can't use Node.js APIs here
  throw new Error("getInstallationOctokit must be called from a Node.js action");
}

// Store GitHub App installation
export const storeInstallation = internalMutation({
  args: {
    installationId: v.number(),
    account: v.object({
      type: v.union(v.literal("User"), v.literal("Organization")),
      login: v.string(),
      id: v.number(),
    }),
    targetType: v.union(v.literal("User"), v.literal("Organization")),
    permissions: v.any(),
    events: v.array(v.string()),
    repositorySelection: v.union(v.literal("all"), v.literal("selected")),
    repositories: v.optional(v.array(v.object({
      id: v.number(),
      nodeId: v.string(),
      name: v.string(),
      fullName: v.string(),
      private: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    // Check if installation already exists
    const existing = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (existing) {
      // Update existing installation
      await ctx.db.patch(existing._id, {
        permissions: args.permissions,
        events: args.events,
        repositorySelection: args.repositorySelection,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new installation
    const installationId = await ctx.db.insert("githubInstallations", {
      installationId: args.installationId,
      accountType: args.account.type.toLowerCase() as "user" | "organization",
      accountName: args.account.login,
      accountId: args.account.id,
      targetType: args.targetType.toLowerCase() as "user" | "organization",
      permissions: args.permissions,
      events: args.events,
      repositorySelection: args.repositorySelection,
      installedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Store repositories if provided
    if (args.repositories) {
      for (const repo of args.repositories) {
        await ctx.db.insert("githubRepositories", {
          installationId: args.installationId,
          repoId: repo.id,
          nodeId: repo.nodeId,
          owner: args.account.login,
          name: repo.name,
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: "main", // Will be updated later
          stargazersCount: 0,
          forksCount: 0,
          openIssuesCount: 0,
          topics: [],
          language: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          connectedAt: Date.now(),
        });
      }
    }

    return installationId;
  },
});

// Remove GitHub App installation
export const removeInstallation = internalMutation({
  args: {
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (installation) {
      // Mark as suspended instead of deleting
      await ctx.db.patch(installation._id, {
        suspendedAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Remove associated repositories
      const repos = await ctx.db
        .query("githubRepositories")
        .withIndex("by_installation", (q) => q.eq("installationId", args.installationId))
        .collect();

      for (const repo of repos) {
        await ctx.db.delete(repo._id);
      }
    }
  },
});

// Update installation repositories
export const updateInstallationRepositories = internalMutation({
  args: {
    installationId: v.number(),
    repositories: v.array(v.object({
      id: v.number(),
      nodeId: v.string(),
      name: v.string(),
      fullName: v.string(),
      private: v.boolean(),
      owner: v.object({
        login: v.string(),
      }),
    })),
  },
  handler: async (ctx, args) => {
    // Get current repositories
    const currentRepos = await ctx.db
      .query("githubRepositories")
      .withIndex("by_installation", (q) => q.eq("installationId", args.installationId))
      .collect();

    const currentRepoIds = new Set(currentRepos.map(r => r.repoId));
    const newRepoIds = new Set(args.repositories.map(r => r.id));

    // Remove repositories that are no longer accessible
    for (const repo of currentRepos) {
      if (!newRepoIds.has(repo.repoId)) {
        await ctx.db.delete(repo._id);
      }
    }

    // Add new repositories
    for (const repo of args.repositories) {
      if (!currentRepoIds.has(repo.id)) {
        await ctx.db.insert("githubRepositories", {
          installationId: args.installationId,
          repoId: repo.id,
          nodeId: repo.nodeId,
          owner: repo.owner.login,
          name: repo.name,
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: "main",
          stargazersCount: 0,
          forksCount: 0,
          openIssuesCount: 0,
          topics: [],
          language: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          connectedAt: Date.now(),
        });
      }
    }
  },
});
// Suspend GitHub App installation
export const suspendInstallation = internalMutation({
  args: {
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (installation) {
      await ctx.db.patch(installation._id, {
        suspendedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Unsuspend GitHub App installation
export const unsuspendInstallation = internalMutation({
  args: {
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (installation) {
      await ctx.db.patch(installation._id, {
        suspendedAt: undefined,
        updatedAt: Date.now(),
      });
    }
  },
});

// Add repositories to installation
export const addInstallationRepositories = internalMutation({
  args: {
    installationId: v.number(),
    repositories: v.array(v.object({
      id: v.number(),
      nodeId: v.string(),
      name: v.string(),
      fullName: v.string(),
      private: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (!installation) return;

    for (const repo of args.repositories) {
      const existing = await ctx.db
        .query("githubRepositories")
        .withIndex("by_repo_id", (q) => q.eq("repoId", repo.id))
        .first();

      if (!existing) {
        await ctx.db.insert("githubRepositories", {
          installationId: args.installationId,
          repoId: repo.id,
          nodeId: repo.nodeId,
          owner: repo.fullName.split('/')[0],
          name: repo.name,
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: "main",
          stargazersCount: 0,
          forksCount: 0,
          openIssuesCount: 0,
          topics: [],
          language: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          connectedAt: Date.now(),
        });
      }
    }
  },
});

// Remove repositories from installation
export const removeInstallationRepositories = internalMutation({
  args: {
    installationId: v.number(),
    repositoryIds: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    for (const repoId of args.repositoryIds) {
      const repo = await ctx.db
        .query("githubRepositories")
        .withIndex("by_repo_id", (q) => q.eq("repoId", repoId))
        .first();

      if (repo && repo.installationId === args.installationId) {
        await ctx.db.delete(repo._id);
      }
    }
  },
});
