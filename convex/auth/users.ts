import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const createOrUpdateUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Internal mutation - no auth check needed as it's called by webhook
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        lastSeenAt: now,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        role: "user",
        preferences: {
          notifications: {
            email: true,
            push: true,
            slack: false,
          },
        },
        lastSeenAt: now,
        status: "waitlisted",
        waitlistPosition: now, // Use timestamp as simple position for now
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Try to find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Return null if user doesn't exist - they'll be created by webhook or mutation
    return user;
  },
});

export const ensureUserExists = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    status: v.optional(v.union(v.literal("waitlisted"), v.literal("active"))),
    waitlistPosition: v.optional(v.number()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      hasCompletedOnboarding: v.optional(v.boolean()),
      notifications: v.optional(v.object({
        email: v.boolean(),
        push: v.boolean(),
        slack: v.boolean(),
      })),
      defaultWorkspaceId: v.optional(v.id("workspaces")),
      accessibility: v.optional(v.object({
        fontScale: v.optional(v.number()),
        lineHeight: v.optional(v.number()),
        letterSpacing: v.optional(v.string()),
        reducedMotion: v.optional(v.boolean()),
        highContrast: v.optional(v.boolean()),
        focusWidth: v.optional(v.number()),
      })),
      defaults: v.optional(v.object({
        projectView: v.optional(v.string()),
        taskPriority: v.optional(v.string()),
        taskType: v.optional(v.string()),
        autoAssignSelf: v.optional(v.boolean()),
      })),
    })),
    githubUsername: v.optional(v.string()),
    githubTokenValidated: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    lastSeenAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    // First try to find existing user
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      // Create user if they don't exist
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        role: "user",
        preferences: {
          notifications: {
            email: true,
            push: true,
            slack: false,
          },
        },
        lastSeenAt: now,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      user = await ctx.db.get(userId);

      // Auto-accept any pending workspace invitations for this email
      if (user) {
        const pendingInvites = await ctx.db
          .query("workspaceInvitations")
          .withIndex("by_email", (q) => q.eq("email", args.email))
          .collect();

        for (const invite of pendingInvites) {
          if (invite.status === "pending" && invite.expiresAt > now) {
            await ctx.db.insert("workspaceMembers", {
              workspaceId: invite.workspaceId,
              userId: user._id,
              role: invite.role,
              permissions: [],
              joinedAt: now,
            });
            await ctx.db.patch(invite._id, { status: "accepted" });
          }
        }
      }
    }

    if (!user) {
      throw new Error("Failed to create or retrieve user");
    }

    return user;
  },
});

export const createCurrentUser = mutation({
  args: {},
  returns: v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    status: v.optional(v.union(v.literal("waitlisted"), v.literal("active"))),
    waitlistPosition: v.optional(v.number()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      hasCompletedOnboarding: v.optional(v.boolean()),
      notifications: v.optional(v.object({
        email: v.boolean(),
        push: v.boolean(),
        slack: v.boolean(),
      })),
      defaultWorkspaceId: v.optional(v.id("workspaces")),
      accessibility: v.optional(v.object({
        fontScale: v.optional(v.number()),
        lineHeight: v.optional(v.number()),
        letterSpacing: v.optional(v.string()),
        reducedMotion: v.optional(v.boolean()),
        highContrast: v.optional(v.boolean()),
        focusWidth: v.optional(v.number()),
      })),
      defaults: v.optional(v.object({
        projectView: v.optional(v.string()),
        taskPriority: v.optional(v.string()),
        taskType: v.optional(v.string()),
        autoAssignSelf: v.optional(v.boolean()),
      })),
    })),
    githubUsername: v.optional(v.string()),
    githubTokenValidated: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    lastSeenAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Use the internal mutation to ensure user exists
    const user: any = await ctx.runMutation(internal.auth.users.ensureUserExists, {
      clerkId: identity.subject,
      email: identity.email || "unknown@example.com",
      name: identity.name || identity.email?.split('@')[0] || "Unknown User",
      avatarUrl: identity.pictureUrl,
    });

    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  },
});

export const updateLastSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        lastSeenAt: Date.now(),
      });
    }

    return user;
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateUserPreferences = mutation({
  args: {
    preferences: v.object({
      theme: v.optional(v.string()),
      hasCompletedOnboarding: v.optional(v.boolean()),
      notifications: v.optional(v.object({
        email: v.optional(v.boolean()),
        push: v.optional(v.boolean()),
        slack: v.optional(v.boolean()),
      })),
      defaultWorkspaceId: v.optional(v.id("workspaces")),
      accessibility: v.optional(v.object({
        fontScale: v.optional(v.number()),
        lineHeight: v.optional(v.number()),
        letterSpacing: v.optional(v.string()),
        reducedMotion: v.optional(v.boolean()),
        highContrast: v.optional(v.boolean()),
        focusWidth: v.optional(v.number()),
      })),
      defaults: v.optional(v.object({
        projectView: v.optional(v.string()),
        taskPriority: v.optional(v.string()),
        taskType: v.optional(v.string()),
        autoAssignSelf: v.optional(v.boolean()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Build the merged notifications object with defaults
    const notifications = args.preferences.notifications ? {
      email: args.preferences.notifications.email ?? user.preferences?.notifications?.email ?? true,
      push: args.preferences.notifications.push ?? user.preferences?.notifications?.push ?? true,
      slack: args.preferences.notifications.slack ?? user.preferences?.notifications?.slack ?? false,
    } : user.preferences?.notifications;

    // Build the preferences object, excluding defaultWorkspaceId if it's undefined
    const updatedPreferences: any = {
      ...user.preferences,
      theme: args.preferences.theme !== undefined ? args.preferences.theme : user.preferences?.theme,
      hasCompletedOnboarding: args.preferences.hasCompletedOnboarding !== undefined
        ? args.preferences.hasCompletedOnboarding
        : user.preferences?.hasCompletedOnboarding,
      notifications: notifications || {
        email: true,
        push: true,
        slack: false,
      },
      accessibility: {
        ...user.preferences?.accessibility,
        ...args.preferences.accessibility,
      },
      defaults: {
        ...user.preferences?.defaults,
        ...args.preferences.defaults,
      },
    };

    // Only include defaultWorkspaceId if it's provided and not undefined
    if (args.preferences.defaultWorkspaceId !== undefined) {
      updatedPreferences.defaultWorkspaceId = args.preferences.defaultWorkspaceId;
    } else if (user.preferences?.defaultWorkspaceId) {
      // Keep existing value if not provided in update
      updatedPreferences.defaultWorkspaceId = user.preferences.defaultWorkspaceId;
    }

    await ctx.db.patch(user._id, {
      preferences: updatedPreferences,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const makeUserAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can make other users admins");
    }

    await ctx.db.patch(args.userId, {
      role: "admin",
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});

export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.githubUsername !== undefined) updates.githubUsername = args.githubUsername;

    await ctx.db.patch(user._id, updates);

    return user._id;
  },
});

export const validateGitHubToken = mutation({
  args: {
    isValid: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      githubTokenValidated: args.isValid,
      updatedAt: Date.now(),
    });

    return args.isValid;
  },
});