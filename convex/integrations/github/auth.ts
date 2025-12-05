import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";

// Note: Webhook signature verification and JWT generation
// are handled in nodeActions.ts using Node.js runtime

// Verify installation access for a user
export const verifyInstallationAccess = query({
  args: {
    installationId: v.number(),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    reason: v.optional(v.string()),
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { hasAccess: false, reason: "Not authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { hasAccess: false, reason: "User not found" };
    }

    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (!installation) {
      return { hasAccess: false, reason: "Installation not found" };
    }

    // Check if user has access to any workspace with this installation
    const workspaces = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const membership of workspaces) {
      const workspace = await ctx.db.get(membership.workspaceId);
      if (workspace?.settings?.integrations?.githubInstallationId === args.installationId) {
        return { hasAccess: true, workspaceId: workspace._id };
      }
    }

    // Check if any projects have repositories from this installation
    const repos = await ctx.db
      .query("githubRepositories")
      .withIndex("by_installation", (q) => q.eq("installationId", args.installationId))
      .collect();

    for (const repo of repos) {
      const projects = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("repository.url"), `https://github.com/${repo.fullName}`))
        .collect();

      for (const project of projects) {
        const member = await ctx.db
          .query("projectMembers")
          .withIndex("by_project_user", (q) => 
            q.eq("projectId", project._id).eq("userId", user._id)
          )
          .first();

        if (member) {
          return { hasAccess: true, projectId: project._id };
        }
      }
    }

    return { hasAccess: false, reason: "No access to installation" };
  },
});

// Link GitHub account to user
export const linkGitHubAccount = mutation({
  args: {
    githubUsername: v.string(),
    accessToken: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
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

    // Update user's GitHub information
    await ctx.db.patch(user._id, {
      githubUsername: args.githubUsername,
      githubTokenValidated: !!args.accessToken,
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
          githubUsername: args.githubUsername,
        },
        githubStats: profile.githubStats ? {
          ...profile.githubStats,
          username: args.githubUsername,
          lastSynced: Date.now(),
        } : undefined,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get available GitHub installations for a user
export const getUserInstallations = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    // Get all workspaces the user is a member of
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const installations = [];
    for (const membership of memberships) {
      const workspace = await ctx.db.get(membership.workspaceId);
      if (workspace?.settings?.integrations?.githubInstallationId) {
        const installationId = workspace.settings.integrations.githubInstallationId;
        const installation = await ctx.db
          .query("githubInstallations")
          .withIndex("by_installation_id", (q) => 
            q.eq("installationId", installationId)
          )
          .first();

        if (installation && !installation.suspendedAt) {
          installations.push({
            ...installation,
            workspaceId: workspace._id,
            workspaceName: workspace.name,
          });
        }
      }
    }

    return installations;
  },
});