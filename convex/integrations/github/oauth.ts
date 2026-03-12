import { v } from "convex/values";
import { mutation, internalMutation, internalQuery, query } from "../../_generated/server";
import { api, internal } from "../../_generated/api";
import { getCurrentUser, getCurrentUserOrThrow } from "../../lib/auth";

// Store GitHub OAuth state for CSRF protection
export const createOAuthState = mutation({
  args: {
    returnUrl: v.optional(v.string()),
  },
  returns: v.object({ state: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const state = Math.random().toString(36).substring(2, 15);

    await ctx.db.insert("githubOAuthStates", {
      state,
      clerkId: identity.subject,
      returnUrl: args.returnUrl || "/profile",
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    return { state };
  },
});

// Get OAuth state for verification
export const getOAuthState = query({
  args: {
    state: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const states = await ctx.db
      .query("githubOAuthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .collect();

    return states;
  },
});

// Store GitHub connection after OAuth
// Updated to allow null values from GitHub API
export const storeGitHubConnection = mutation({
  args: {
    state: v.string(),
    githubId: v.number(),
    githubUsername: v.string(),
    githubEmail: v.optional(v.union(v.string(), v.null())),
    accessToken: v.string(),
    scope: v.string(),
    tokenType: v.string(),
    githubProfile: v.optional(v.object({
      name: v.optional(v.union(v.string(), v.null())),
      bio: v.optional(v.union(v.string(), v.null())),
      company: v.optional(v.union(v.string(), v.null())),
      location: v.optional(v.union(v.string(), v.null())),
      blog: v.optional(v.union(v.string(), v.null())),
      twitter_username: v.optional(v.union(v.string(), v.null())),
      public_repos: v.number(),
      public_gists: v.number(),
      followers: v.number(),
      following: v.number(),
      created_at: v.string(),
      avatar_url: v.string(),
      html_url: v.string(),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    returnUrl: v.optional(v.string()),
    githubUsername: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify state
    const oauthState = await ctx.db
      .query("githubOAuthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .first();

    if (!oauthState) {
      throw new Error("Invalid OAuth state");
    }

    if (oauthState.expiresAt < Date.now()) {
      throw new Error("OAuth state expired");
    }

    // Delete used state
    await ctx.db.delete(oauthState._id);

    // Get the user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", oauthState.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Store GitHub connection
    const existingConnection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingConnection) {
      await ctx.db.patch(existingConnection._id, {
        githubId: args.githubId,
        githubUsername: args.githubUsername,
        accessToken: args.accessToken,
        scope: args.scope,
        tokenType: args.tokenType,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("githubConnections", {
        userId: user._id,
        githubId: args.githubId,
        githubUsername: args.githubUsername,
        accessToken: args.accessToken,
        scope: args.scope,
        tokenType: args.tokenType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update user profile
    await ctx.db.patch(user._id, {
      githubUsername: args.githubUsername,
      githubTokenValidated: true,
      updatedAt: Date.now(),
    });

    // Update developer profile if exists
    const profile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (profile && args.githubProfile) {
      await ctx.db.patch(profile._id, {
        profile: {
          ...profile.profile,
          githubUsername: args.githubUsername,
        },
        githubStats: {
          username: args.githubUsername,
          totalPRs: 0, // Will be populated later via sync
          totalReviews: 0, // Will be populated later via sync
          avgReviewTime: 0, // Will be populated later via sync
          languages: [], // Will be populated later via sync
          lastSynced: Date.now(),
        },
        updatedAt: Date.now(),
      });
    }

    // Create/update GitHub user mappings for all workspaces the user belongs to
    const workspaceMemberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const membership of workspaceMemberships) {
      // Check if mapping already exists
      const existingMapping = await ctx.db
        .query("githubUserMappings")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("workspaceId"), membership.workspaceId))
        .first();

      if (existingMapping) {
        // Update existing mapping
        await ctx.db.patch(existingMapping._id, {
          githubId: args.githubId,
          githubUsername: args.githubUsername,
          githubEmail: args.githubEmail || undefined,
          mappingType: "oauth" as const,
          verified: true,
          updatedAt: Date.now(),
        });
      } else {
        // Create new mapping
        await ctx.db.insert("githubUserMappings", {
          workspaceId: membership.workspaceId,
          userId: user._id,
          githubId: args.githubId,
          githubUsername: args.githubUsername,
          githubEmail: args.githubEmail || undefined,
          mappingType: "oauth" as const,
          verified: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Auto-link any existing GitHub App installations matching this user's account
    const allInstallations = await ctx.db
      .query("githubInstallations")
      .collect();

    const matchingInstallations = allInstallations.filter(
      (inst) => inst.accountName.toLowerCase() === args.githubUsername.toLowerCase() && !inst.suspendedAt
    );

    for (const installation of matchingInstallations) {
      for (const membership of workspaceMemberships) {
        const existingLinks = await ctx.db
          .query("workspaceGitHubInstallations")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", membership.workspaceId))
          .collect();

        const alreadyLinked = existingLinks.some(
          (l) => l.installationId === installation.installationId
        );

        if (!alreadyLinked) {
          await ctx.db.insert("workspaceGitHubInstallations", {
            workspaceId: membership.workspaceId,
            installationId: installation.installationId,
            isPrimary: existingLinks.length === 0,
            accountLogin: installation.accountName,
            accountType: installation.accountType,
            syncSettings: {
              autoSyncIssues: false,
              bidirectionalSync: false,
              createTasksFromIssues: false,
              syncLabels: false,
            },
            addedBy: user._id,
            addedAt: Date.now(),
          });
          console.log(`[OAuth] Auto-linked installation ${installation.installationId} to workspace ${membership.workspaceId}`);
        }
      }
    }

    // Schedule stats sync if an installation is available
    const activeInstallation = allInstallations.find((inst) => !inst.suspendedAt);
    if (activeInstallation) {
      await ctx.scheduler.runAfter(0, internal.integrations.github.syncActions.syncDeveloperGitHubStats, {
        userId: user._id,
        githubUsername: args.githubUsername,
        installationId: activeInstallation.installationId,
      });
    }

    return {
      success: true,
      returnUrl: oauthState.returnUrl,
      githubUsername: args.githubUsername,
    };
  },
});

// Get current GitHub connection (includes token for actions)
export const getGitHubConnection = query({
  args: {},
  returns: v.union(v.any(), v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!connection) return null;

    // Return full connection for actions, but be careful with the token
    return connection;
  },
});

// Get GitHub connection info (safe for client)
export const getGitHubConnectionInfo = query({
  args: {},
  returns: v.union(
    v.object({
      githubUsername: v.string(),
      githubId: v.number(),
      scope: v.string(),
      connectedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!connection) return null;

    // Don't expose the access token to the client
    return {
      githubUsername: connection.githubUsername,
      githubId: connection.githubId,
      scope: connection.scope,
      connectedAt: connection.createdAt,
    };
  },
});

// Internal query to get GitHub connection by clerkId (for use from actions where auth propagation may fail)
export const getGitHubConnectionByClerkId = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return null;

    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return connection;
  },
});

// Disconnect GitHub
export const disconnectGitHub = mutation({
  args: {},
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Delete GitHub connection
    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }

    // Update user
    await ctx.db.patch(user._id, {
      githubUsername: undefined,
      githubTokenValidated: false,
      updatedAt: Date.now(),
    });

    // Update developer profile if exists
    const profile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        profile: {
          ...profile.profile,
          githubUsername: undefined,
        },
        githubStats: undefined,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// NOTE: fetchUserRepositories was removed - use fetchAvailableRepositories action instead
// Queries cannot make external API calls, so repository fetching must be done via actions