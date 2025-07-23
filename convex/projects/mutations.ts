import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requirePermission } from "../auth/permissions";

export const createProject = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    workflowType: v.optional(v.union(v.literal("kanban"), v.literal("scrum"), v.literal("hybrid"))),
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

    await requirePermission(ctx.db, user._id, args.workspaceId, "project.create");

    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.key.toUpperCase()))
      .first();

    if (existingProject) {
      throw new Error("Project key already exists");
    }

    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      key: args.key.toUpperCase(),
      description: args.description,
      leadId: args.leadId,
      status: "planning",
      visibility: "public",
      settings: {
        taskPrefix: args.key.toUpperCase(),
        workflowType: args.workflowType || "kanban",
      },
      metadata: {
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        icon: "📁",
        tags: [],
      },
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activities", {
      workspaceId: args.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: projectId,
      action: "project.created",
      metadata: { name: args.name, key: args.key },
      createdAt: now,
    });

    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    status: v.optional(v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("completed"),
      v.literal("archived")
    )),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.edit");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.leadId !== undefined) updates.leadId = args.leadId;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.projectId, updates);

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      action: "project.updated",
      metadata: updates,
      createdAt: Date.now(),
    });

    return args.projectId;
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.delete");

    await ctx.db.patch(args.projectId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      action: "project.archived",
      metadata: { name: project.name },
      createdAt: Date.now(),
    });

    return args.projectId;
  },
});