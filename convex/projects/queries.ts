import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission, hasProjectPermission } from "../auth/permissions";
import { getCurrentUser, getCurrentUserOrThrow } from "../lib/auth";

export const getWorkspaceProjects = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
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
    const user = await getCurrentUserOrThrow(ctx);

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
      .withIndex("by_project_and_status", (q) => q.eq("projectId", project._id).eq("status", "active"))
      .first();

    // Get project team members (not workspace members!)
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_and_status", (q) => q.eq("projectId", project._id).eq("status", "active"))
      .collect();

    const memberUsers = await Promise.all(
      projectMembers.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return user ? { ...user, projectRole: member.role, joinedAt: member.joinedAt } : null;
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
    const user = await getCurrentUser(ctx);
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
      .withIndex("by_workspace_and_status", (q) => q.eq("workspaceId", args.workspaceId).eq("status", args.status))
      .collect();
  },
});

// Project Team Management Queries

export const getProjectTeamMembers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const hasAccess = await hasProjectPermission(
      ctx.db,
      user._id,
      args.projectId,
      "project.team.view"
    );

    if (!hasAccess) {
      return [];
    }

    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_and_status", (q) => q.eq("projectId", args.projectId).eq("status", "active"))
      .collect();

    const membersWithDetails = await Promise.all(
      projectMembers.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user,
        };
      })
    );

    return membersWithDetails.filter(m => m.user);
  },
});

export const getProjectByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!project) {
      return null;
    }

    // Get workspace info
    const workspace = await ctx.db.get(project.workspaceId);
    
    // Get project lead info
    const lead = project.leadId ? await ctx.db.get(project.leadId) : null;

    // Get member count
    const memberCount = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_and_status", (q) => q.eq("projectId", project._id).eq("status", "active"))
      .collect();

    return {
      _id: project._id,
      name: project.name,
      description: project.description,
      key: project.key,
      visibility: project.visibility,
      workspace: workspace ? { name: workspace.name } : null,
      lead: lead ? { name: lead.name, avatarUrl: lead.avatarUrl } : null,
      memberCount: memberCount.length,
      teamSettings: project.teamSettings,
      metadata: project.metadata,
    };
  },
});

export const getUserProjects = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const targetUserId = args.userId || user._id;

    // Only allow users to see their own projects unless they have admin permissions
    if (targetUserId !== user._id) {
      // This would require additional permission checks for viewing other user's projects
      // For now, restrict to own projects
      return [];
    }

    const projectMemberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user_and_status", (q) => q.eq("userId", targetUserId).eq("status", "active"))
      .collect();

    const projectsWithDetails = await Promise.all(
      projectMemberships.map(async (membership) => {
        const project = await ctx.db.get(membership.projectId);
        if (!project) return null;

        const workspace = await ctx.db.get(project.workspaceId);
        const lead = project.leadId ? await ctx.db.get(project.leadId) : null;

        return {
          ...project,
          workspace: workspace ? { name: workspace.name } : null,
          lead,
          userRole: membership.role,
          joinedAt: membership.joinedAt,
        };
      })
    );

    return projectsWithDetails.filter(Boolean);
  },
});

export const getProjectInviteLink = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const hasAccess = await hasProjectPermission(
      ctx.db,
      user._id,
      args.projectId,
      "project.team.invite"
    );

    if (!hasAccess) {
      throw new Error("Permission denied");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return {
      inviteCode: project.inviteCode,
      projectName: project.name,
      teamSettings: project.teamSettings || {
        maxMembers: 50,
        allowSelfJoin: true,
        requireApproval: false,
        autoAssignLead: true,
      },
    };
  },
});