import { v } from "convex/values";
import { mutation, internalMutation, query } from "../../_generated/server";
import { api } from "../../_generated/api";

// Store GitHub OAuth state for CSRF protection
export const createOAuthState = mutation({
  args: {
    returnUrl: v.optional(v.string()),
  },
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
  handler: async (ctx, args) => {
    const states = await ctx.db
      .query("githubOAuthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .collect();
    
    return states;
  },
});

// Store GitHub connection after OAuth
export const storeGitHubConnection = mutation({
  args: {
    state: v.string(),
    githubId: v.number(),
    githubUsername: v.string(),
    githubEmail: v.optional(v.string()),
    accessToken: v.string(),
    scope: v.string(),
    tokenType: v.string(),
    githubProfile: v.optional(v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      company: v.optional(v.string()),
      location: v.optional(v.string()),
      blog: v.optional(v.string()),
      twitter_username: v.optional(v.string()),
      public_repos: v.number(),
      public_gists: v.number(),
      followers: v.number(),
      following: v.number(),
      created_at: v.string(),
      avatar_url: v.string(),
      html_url: v.string(),
    })),
  },
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

    return {
      success: true,
      returnUrl: oauthState.returnUrl,
      githubUsername: args.githubUsername,
    };
  },
});

// Get current GitHub connection (includes token for actions)
export const getGitHubConnection = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

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
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

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

// Disconnect GitHub
export const disconnectGitHub = mutation({
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

// Fetch user repositories
export const fetchUserRepositories = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const connection = await ctx.db
      .query("githubConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!connection) return [];

    // This would need to be an action to make external API calls
    // For now, return empty array
    return [];
  },
});