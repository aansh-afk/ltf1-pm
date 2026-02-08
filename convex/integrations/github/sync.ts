import { v } from "convex/values";
import { mutation, internalMutation, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";

// Note: GitHub sync actions that require Node.js APIs are in syncActions.ts

// Get users who have GitHub connections and need stats sync
export const getUsersForStatsSync = internalQuery({
  args: {},
  returns: v.array(v.object({
    userId: v.id("users"),
    githubUsername: v.string(),
    installationId: v.number(),
  })),
  handler: async (ctx) => {
    // Get all GitHub connections
    const connections = await ctx.db
      .query("githubConnections")
      .collect();

    if (connections.length === 0) return [];

    // Get any active installation to use for API auth
    const installations = await ctx.db
      .query("githubInstallations")
      .collect();

    const activeInstallation = installations.find((inst) => !inst.suspendedAt);
    if (!activeInstallation) return [];

    return connections.map((conn) => ({
      userId: conn.userId,
      githubUsername: conn.githubUsername,
      installationId: activeInstallation.installationId,
    }));
  },
});

// Trigger manual stats sync for the current user
export const triggerManualStatsSync = mutation({
  args: {},
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get their GitHub connection
    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!connection) {
      return { success: false, message: "No GitHub account connected" };
    }

    // Find an active installation for API auth
    const installations = await ctx.db
      .query("githubInstallations")
      .collect();

    const activeInstallation = installations.find((inst) => !inst.suspendedAt);
    if (!activeInstallation) {
      return { success: false, message: "No GitHub App installation found. Install the app first." };
    }

    // Schedule the sync
    await ctx.scheduler.runAfter(0, internal.integrations.github.syncActions.syncDeveloperGitHubStats, {
      userId: user._id,
      githubUsername: connection.githubUsername,
      installationId: activeInstallation.installationId,
    });

    return { success: true, message: "Stats sync started" };
  },
});

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

