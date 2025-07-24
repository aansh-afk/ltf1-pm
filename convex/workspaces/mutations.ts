import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requirePermission } from "../auth/permissions";
import { internal } from "../_generated/api";

export const createWorkspace = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("workspaces"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Ensure user exists (creates if not found)
    const user: any = await ctx.runMutation(internal.auth.users.ensureUserExists, {
      clerkId: identity.subject,
      email: identity.email || "unknown@example.com", 
      name: identity.name || identity.email?.split('@')[0] || "Unknown User",
      avatarUrl: identity.pictureUrl,
    });

    if (!user) {
      throw new Error("Failed to create user");
    }

    const now = Date.now();
    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const existingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existingWorkspace) {
      throw new Error("Workspace slug already exists");
    }

    const workspaceId: any = await ctx.db.insert("workspaces", {
      name: args.name,
      slug,
      description: args.description,
      ownerId: user._id,
      settings: {
        features: {
          gitIntegration: true,
          aiFeatures: true,
          meetings: true,
          timeTracking: true,
        },
      },
      subscription: {
        plan: "free",
        seats: 5,
      },
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId: user._id,
      role: "owner",
      permissions: [],
      joinedAt: now,
    });

    await ctx.db.insert("activities", {
      workspaceId,
      userId: user._id,
      entityType: "workspace",
      entityId: workspaceId,
      action: "workspace.created",
      metadata: { name: args.name },
      createdAt: now,
    });

    return workspaceId;
  },
});

export const updateWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
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

    await requirePermission(ctx.db, user._id, args.workspaceId, "workspace.edit");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
      updates.slug = args.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (args.description !== undefined) {
      updates.description = args.description;
    }

    if (args.logoUrl !== undefined) {
      updates.logoUrl = args.logoUrl;
    }

    await ctx.db.patch(args.workspaceId, updates);

    await ctx.db.insert("activities", {
      workspaceId: args.workspaceId,
      userId: user._id,
      entityType: "workspace",
      entityId: args.workspaceId,
      action: "workspace.updated",
      metadata: updates,
      createdAt: Date.now(),
    });

    return args.workspaceId;
  },
});

export const inviteToWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
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

    await requirePermission(ctx.db, user._id, args.workspaceId, "workspace.invite");

    const invitedUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!invitedUser) {
      throw new Error("User not found. They must sign up first.");
    }

    const existingMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", invitedUser._id)
      )
      .first();

    if (existingMember) {
      throw new Error("User is already a member of this workspace");
    }

    const now = Date.now();

    await ctx.db.insert("workspaceMembers", {
      workspaceId: args.workspaceId,
      userId: invitedUser._id,
      role: args.role,
      permissions: [],
      joinedAt: now,
    });

    await ctx.db.insert("activities", {
      workspaceId: args.workspaceId,
      userId: user._id,
      entityType: "workspace",
      entityId: args.workspaceId,
      action: "member.invited",
      metadata: { email: args.email, role: args.role },
      createdAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: invitedUser._id,
      type: "workspace.invitation",
      title: "Workspace Invitation",
      message: `You've been invited to join a workspace`,
      data: { workspaceId: args.workspaceId, role: args.role },
      read: false,
      createdAt: now,
    });

    return invitedUser._id;
  },
});

export const updateMemberRole = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    await requirePermission(ctx.db, currentUser._id, args.workspaceId, "workspace.invite");

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", args.userId)
      )
      .first();

    if (!member) {
      throw new Error("Member not found");
    }

    if (member.role === "owner") {
      throw new Error("Cannot change owner role");
    }

    await ctx.db.patch(member._id, {
      role: args.role,
    });

    await ctx.db.insert("activities", {
      workspaceId: args.workspaceId,
      userId: currentUser._id,
      entityType: "workspace",
      entityId: args.workspaceId,
      action: "member.role_updated",
      metadata: { userId: args.userId, role: args.role },
      createdAt: Date.now(),
    });

    return member._id;
  },
});