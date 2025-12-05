import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";

// Note: GitHub sync actions that require Node.js APIs are in syncActions.ts

// Get all active installations that need repository sync
export const getInstallationsToSync = internalQuery({
  args: {},
  returns: v.array(v.object({
    installationId: v.number(),
    accountName: v.string(),
    repositorySelection: v.string(),
  })),
  handler: async (ctx) => {
    const installations = await ctx.db
      .query("githubInstallations")
      .collect();

    // Only return non-suspended installations
    return installations
      .filter((inst) => !inst.suspendedAt)
      .map((inst) => ({
        installationId: inst.installationId,
        accountName: inst.accountName,
        repositorySelection: inst.repositorySelection,
      }));
  },
});

// Update developer GitHub stats
export const updateDeveloperGitHubStats = internalMutation({
  args: {
    userId: v.id("users"),
    stats: v.object({
      username: v.optional(v.string()),
      totalPRs: v.number(),
      totalReviews: v.number(),
      avgReviewTime: v.number(),
      languages: v.array(v.object({
        name: v.string(),
        percentage: v.number(),
      })),
      lastSynced: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        githubStats: args.stats,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

// Note: syncInstallationRepositories is now in syncActions.ts

// Upsert repository data
export const upsertRepository = internalMutation({
  args: {
    installationId: v.number(),
    repository: v.object({
      repoId: v.number(),
      nodeId: v.string(),
      owner: v.string(),
      name: v.string(),
      fullName: v.string(),
      private: v.boolean(),
      description: v.optional(v.string()),
      defaultBranch: v.string(),
      language: v.optional(v.string()),
      topics: v.array(v.string()),
      stargazersCount: v.number(),
      forksCount: v.number(),
      openIssuesCount: v.number(),
      createdAt: v.string(),
      updatedAt: v.string(),
      pushedAt: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("githubRepositories")
      .withIndex("by_repo_id", (q) => q.eq("repoId", args.repository.repoId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.repository,
        syncedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("githubRepositories", {
        installationId: args.installationId,
        ...args.repository,
        connectedAt: Date.now(),
        syncedAt: Date.now(),
      });
    }
    return null;
  },
});

// Note: Helper functions moved to syncActions.ts

