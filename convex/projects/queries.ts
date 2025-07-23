import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../auth/permissions";

export const getWorkspaceProjects = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "project.view"
    );

    if (!hasAccess) {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.neq(q.field("status"), "archived"))
      .collect();

    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const lead = project.leadId ? await ctx.db.get(project.leadId) : null;
        
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const taskStats = {
          total: tasks.length,
          completed: tasks.filter((t) => t.status === "done").length,
          inProgress: tasks.filter((t) => t.status === "in_progress").length,
        };

        return {
          ...project,
          lead,
          taskStats,
        };
      })
    );

    return projectsWithDetails;
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
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

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      project.workspaceId,
      "project.view"
    );

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    const lead = project.leadId ? await ctx.db.get(project.leadId) : null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", project.workspaceId))
      .collect();

    const memberUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return user;
      })
    );

    return {
      ...project,
      lead,
      tasks,
      activeSprint,
      members: memberUsers.filter(Boolean),
    };
  },
});

export const getProjectsByStatus = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("completed"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "project.view"
    );

    if (!hasAccess) {
      return [];
    }

    return await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});