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
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    settings: v.optional(v.object({
      features: v.optional(v.object({
        gitIntegration: v.optional(v.boolean()),
        aiFeatures: v.optional(v.boolean()),
        meetings: v.optional(v.boolean()),
        timeTracking: v.optional(v.boolean()),
        enableProjects: v.optional(v.boolean()),
        enableTasks: v.optional(v.boolean()),
        enableMeetings: v.optional(v.boolean()),
        enableSprints: v.optional(v.boolean()),
        enableTimeTracking: v.optional(v.boolean()),
        enableGitHub: v.optional(v.boolean()),
        enableCalendar: v.optional(v.boolean()),
      })),
      integrations: v.optional(v.object({
        github: v.optional(v.object({
          enabled: v.boolean(),
          accessToken: v.optional(v.string()),
          repositories: v.optional(v.array(v.string())),
        })),
        googleCalendar: v.optional(v.object({
          enabled: v.boolean(),
          calendarId: v.optional(v.string()),
          accessToken: v.optional(v.string()),
        })),
        slack: v.optional(v.object({
          enabled: v.boolean(),
          webhookUrl: v.optional(v.string()),
          channel: v.optional(v.string()),
        })),
      })),
    })),
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
      if (!args.slug) {
        updates.slug = args.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }
    }

    if (args.slug !== undefined) {
      updates.slug = args.slug;
    }

    if (args.description !== undefined) {
      updates.description = args.description;
    }

    if (args.logoUrl !== undefined) {
      updates.logoUrl = args.logoUrl;
    }

    if (args.settings !== undefined) {
      const workspace = await ctx.db.get(args.workspaceId);
      if (workspace) {
        updates.settings = {
          ...workspace.settings,
          ...args.settings,
          features: {
            ...workspace.settings?.features,
            ...args.settings.features,
          },
          integrations: {
            ...workspace.settings?.integrations,
            ...args.settings.integrations,
          },
        };
      }
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

export const deleteWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
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

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Only owner can delete workspace
    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!member || member.role !== "owner") {
      throw new Error("Only workspace owner can delete the workspace");
    }

    // Delete all related data
    // Delete all projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    
    for (const project of projects) {
      // Delete all tasks in project
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      
      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }
      
      await ctx.db.delete(project._id);
    }

    // Delete all workspace members
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Delete all meetings
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    
    for (const meeting of meetings) {
      await ctx.db.delete(meeting._id);
    }

    // Finally, delete the workspace
    await ctx.db.delete(args.workspaceId);

    return args.workspaceId;
  },
});

export const removeMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
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
      throw new Error("Cannot remove workspace owner");
    }

    await ctx.db.delete(member._id);

    await ctx.db.insert("activities", {
      workspaceId: args.workspaceId,
      userId: currentUser._id,
      entityType: "workspace",
      entityId: args.workspaceId,
      action: "member.removed",
      metadata: { userId: args.userId },
      createdAt: Date.now(),
    });

    return member._id;
  },
});