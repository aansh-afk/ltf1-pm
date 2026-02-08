import { query } from "../_generated/server";
import { v } from "convex/values";
import { hasPermission } from "../auth/permissions";

export const getUserWorkspaces = query({
  args: {},
  handler: async (ctx) => {
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

    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db.get(membership.workspaceId);
        if (!workspace) return null;

        // Fetch member count and project count in parallel
        const [members, projects] = await Promise.all([
          ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
            .collect(),
          ctx.db
            .query("projects")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
            .collect(),
        ]);

        return {
          ...workspace,
          role: membership.role,
          memberCount: members.length,
          projectCount: projects.filter(p => p.status !== "archived").length,
        };
      })
    );

    return workspaces.filter(Boolean);
  },
});

export const getWorkspaceById = query({
  args: { workspaceId: v.id("workspaces") },
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

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "workspace.view"
    );

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId);
        return {
          ...m,
          user: memberUser,
        };
      })
    );

    return {
      ...workspace,
      currentUserRole: member?.role,
      members: memberDetails,
    };
  },
});

export const getWorkspaceMembers = query({
  args: { workspaceId: v.id("workspaces") },
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

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "workspace.view"
    );

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const memberUser = await ctx.db.get(member.userId);
        return {
          ...member,
          user: memberUser,
        };
      })
    );

    return memberDetails;
  },
});

export const getWorkspaceStats = query({
  args: { workspaceId: v.id("workspaces") },
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

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "workspace.view"
    );

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const projectIds = projects.map((p) => p._id);

    const tasks = await Promise.all(
      projectIds.map((projectId) =>
        ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect()
      )
    ).then((results) => results.flat());

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allActivities = await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .collect();
      
    const recentActivities = allActivities.filter(a => {
      const timestamp = (a as any).timestamp;
      return timestamp && timestamp >= thirtyDaysAgo;
    });

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "active").length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === "done").length,
      inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
      totalMembers: members.length,
      upcomingMeetings: meetings.filter((m) => m.startTime > now).length,
      recentActivityCount: recentActivities.length,
    };
  },
});

export const getPendingInvitations = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(v.object({
    _id: v.id("workspaceInvitations"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member"), v.literal("viewer")),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined"), v.literal("expired")),
    createdAt: v.number(),
    invitedByName: v.string(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const invitations = await ctx.db
      .query("workspaceInvitations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const pending = invitations.filter((inv) => inv.status === "pending");

    const results = await Promise.all(
      pending.map(async (inv) => {
        const inviter = await ctx.db.get(inv.invitedBy);
        return {
          _id: inv._id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          createdAt: inv.createdAt,
          invitedByName: inviter?.name || inviter?.email || "Unknown",
        };
      })
    );

    return results;
  },
});