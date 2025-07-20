import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

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
      notifications: v.optional(v.object({
        email: v.boolean(),
        push: v.boolean(),
        slack: v.boolean(),
      })),
      defaultWorkspaceId: v.optional(v.id("workspaces")),
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

    await ctx.db.patch(user._id, {
      preferences: {
        ...user.preferences,
        ...args.preferences,
      },
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