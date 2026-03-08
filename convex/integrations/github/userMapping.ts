import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { getCurrentUser, getCurrentUserOrThrow } from "../../lib/auth";

// Internal mutation to create user mapping when connecting OAuth
export const createUserMappingFromOAuth = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    githubId: v.number(),
    githubUsername: v.string(),
    githubEmail: v.optional(v.string()),
  },
  returns: v.id("githubUserMappings"),
  handler: async (ctx, args) => {
    // Check if mapping already exists for this user in this workspace
    const existingByUser = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();

    if (existingByUser) {
      // Update existing mapping
      await ctx.db.patch(existingByUser._id, {
        githubId: args.githubId,
        githubUsername: args.githubUsername,
        githubEmail: args.githubEmail,
        mappingType: "oauth" as const,
        verified: true,
        updatedAt: Date.now(),
      });
      return existingByUser._id;
    }

    // Check if another user is already mapped to this GitHub ID
    const existingByGithub = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();

    if (existingByGithub && existingByGithub.userId !== args.userId) {
      // This GitHub account is already linked to another user
      throw new Error("This GitHub account is already linked to another user in this workspace");
    }

    // Create new mapping
    return await ctx.db.insert("githubUserMappings", {
      workspaceId: args.workspaceId,
      userId: args.userId,
      githubId: args.githubId,
      githubUsername: args.githubUsername,
      githubEmail: args.githubEmail,
      mappingType: "oauth" as const,
      verified: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Internal query to resolve GitHub username to LTF1 user
export const resolveGitHubUser = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    githubUsername: v.string(),
  },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      verified: v.boolean(),
      mappingType: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // First try exact username match
    const mapping = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_workspace_username", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("githubUsername", args.githubUsername)
      )
      .first();

    if (mapping) {
      return {
        userId: mapping.userId,
        verified: mapping.verified,
        mappingType: mapping.mappingType,
      };
    }

    // If no mapping found, try to find user by githubUsername field on user profile
    const users = await ctx.db
      .query("users")
      .collect();

    const matchedUser = users.find(
      (u) => u.githubUsername?.toLowerCase() === args.githubUsername.toLowerCase()
    );

    if (matchedUser) {
      return {
        userId: matchedUser._id,
        verified: false,
        mappingType: "inferred",
      };
    }

    return null;
  },
});

// Resolve GitHub user by email (for commit authors)
export const resolveGitHubUserByEmail = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
  },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      verified: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // First try mapping table with email
    const mappings = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const mappingByEmail = mappings.find(
      (m) => m.githubEmail?.toLowerCase() === args.email.toLowerCase()
    );

    if (mappingByEmail) {
      return {
        userId: mappingByEmail.userId,
        verified: mappingByEmail.verified,
      };
    }

    // Try to find user by email in users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (user) {
      return {
        userId: user._id,
        verified: false,
      };
    }

    return null;
  },
});

// Public mutation for workspace admins to manually link a GitHub user
export const manuallyLinkGitHubUser = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    githubUsername: v.string(),
  },
  returns: v.id("githubUserMappings"),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Check if current user has admin access to workspace
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", currentUser._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can manually link GitHub users");
    }

    // Check if target user is a workspace member
    const targetMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", args.userId)
      )
      .first();

    if (!targetMembership) {
      throw new Error("Target user is not a member of this workspace");
    }

    // Check if mapping already exists
    const existing = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_workspace_username", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("githubUsername", args.githubUsername)
      )
      .first();

    if (existing && existing.userId !== args.userId) {
      throw new Error("This GitHub username is already linked to another user");
    }

    // Check if user already has a mapping
    const userMapping = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();

    if (userMapping) {
      // Update existing mapping
      await ctx.db.patch(userMapping._id, {
        githubUsername: args.githubUsername,
        mappingType: "manual" as const,
        verified: false, // Manual mappings need verification
        updatedAt: Date.now(),
      });
      return userMapping._id;
    }

    // Create new mapping
    return await ctx.db.insert("githubUserMappings", {
      workspaceId: args.workspaceId,
      userId: args.userId,
      githubId: 0, // Unknown until verified
      githubUsername: args.githubUsername,
      mappingType: "manual" as const,
      verified: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Public mutation to unlink a GitHub user
export const unlinkGitHubUser = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    mappingId: v.id("githubUserMappings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    const mapping = await ctx.db.get(args.mappingId);
    if (!mapping) {
      throw new Error("Mapping not found");
    }

    // Check if user can unlink (own mapping or admin)
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", currentUser._id)
      )
      .first();

    const isAdmin = membership?.role === "owner" || membership?.role === "admin";
    const isOwnMapping = mapping.userId === currentUser._id;

    if (!isAdmin && !isOwnMapping) {
      throw new Error("Not authorized to unlink this GitHub user");
    }

    await ctx.db.delete(args.mappingId);
    return null;
  },
});

// Query to get user mappings for a workspace
export const getWorkspaceUserMappings = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(
    v.object({
      _id: v.id("githubUserMappings"),
      userId: v.id("users"),
      githubUsername: v.string(),
      githubEmail: v.optional(v.string()),
      mappingType: v.string(),
      verified: v.boolean(),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      userAvatar: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Check membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", currentUser._id)
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this workspace");
    }

    const mappings = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Enrich with user data
    const result = await Promise.all(
      mappings.map(async (mapping) => {
        const user = await ctx.db.get(mapping.userId);
        return {
          _id: mapping._id,
          userId: mapping.userId,
          githubUsername: mapping.githubUsername,
          githubEmail: mapping.githubEmail,
          mappingType: mapping.mappingType,
          verified: mapping.verified,
          userName: user?.name,
          userEmail: user?.email,
          userAvatar: user?.avatarUrl,
        };
      })
    );

    return result;
  },
});

// Query to get unmapped GitHub users (from recent activity)
export const getUnmappedGitHubUsers = query({
  args: {
    workspaceId: v.id("workspaces"),
    repositoryFullName: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      githubUsername: v.string(),
      lastSeenAt: v.number(),
      activityCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    // Check membership with admin role
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", currentUser._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can view unmapped users");
    }

    // Get all mapped usernames for this workspace
    const mappings = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const mappedUsernames = new Set(mappings.map((m) => m.githubUsername.toLowerCase()));

    // Get recent GitHub activities
    let activities;
    if (args.repositoryFullName !== undefined) {
      const repoName = args.repositoryFullName;
      activities = await ctx.db
        .query("githubActivities")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoName))
        .order("desc")
        .take(500);
    } else {
      activities = await ctx.db.query("githubActivities").order("desc").take(500);
    }

    // Also check commits and PRs
    const commits = await ctx.db.query("githubCommits").order("desc").take(500);
    const prs = await ctx.db.query("githubPullRequests").order("desc").take(200);

    // Aggregate unmapped users
    const unmappedUsers = new Map<
      string,
      { lastSeenAt: number; activityCount: number }
    >();

    for (const activity of activities) {
      const username = activity.actor;
      if (!mappedUsernames.has(username.toLowerCase())) {
        const existing = unmappedUsers.get(username) || { lastSeenAt: 0, activityCount: 0 };
        unmappedUsers.set(username, {
          lastSeenAt: Math.max(existing.lastSeenAt, activity.timestamp),
          activityCount: existing.activityCount + 1,
        });
      }
    }

    for (const commit of commits) {
      const username = commit.author.name;
      if (!mappedUsernames.has(username.toLowerCase())) {
        const existing = unmappedUsers.get(username) || { lastSeenAt: 0, activityCount: 0 };
        unmappedUsers.set(username, {
          lastSeenAt: Math.max(existing.lastSeenAt, commit.createdAt),
          activityCount: existing.activityCount + 1,
        });
      }
    }

    for (const pr of prs) {
      const username = pr.author;
      if (!mappedUsernames.has(username.toLowerCase())) {
        const existing = unmappedUsers.get(username) || { lastSeenAt: 0, activityCount: 0 };
        const prTime = new Date(pr.updatedAt).getTime();
        unmappedUsers.set(username, {
          lastSeenAt: Math.max(existing.lastSeenAt, prTime),
          activityCount: existing.activityCount + 1,
        });
      }
    }

    // Convert to array and sort by activity count
    const result = Array.from(unmappedUsers.entries())
      .map(([githubUsername, data]) => ({
        githubUsername,
        lastSeenAt: data.lastSeenAt,
        activityCount: data.activityCount,
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 50);

    return result;
  },
});

// Query to get current user's GitHub mapping in a workspace
export const getMyGitHubMapping = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.union(
    v.object({
      _id: v.id("githubUserMappings"),
      githubUsername: v.string(),
      githubEmail: v.optional(v.string()),
      mappingType: v.string(),
      verified: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const mapping = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();

    if (!mapping) return null;

    return {
      _id: mapping._id,
      githubUsername: mapping.githubUsername,
      githubEmail: mapping.githubEmail,
      mappingType: mapping.mappingType,
      verified: mapping.verified,
    };
  },
});
