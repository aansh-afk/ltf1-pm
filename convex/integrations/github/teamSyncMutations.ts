import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

// Get team mappings for a workspace
export const getTeamMappings = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(v.object({
    _id: v.id("githubTeamMappings"),
    workspaceId: v.id("workspaces"),
    teamId: v.id("teams"),
    installationId: v.number(),
    githubOrgName: v.string(),
    githubTeamSlug: v.string(),
    githubTeamId: v.number(),
    syncDirection: v.union(
      v.literal("github_to_ltf1"),
      v.literal("ltf1_to_github"),
      v.literal("bidirectional")
    ),
    syncMembers: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    teamName: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const mappings = await ctx.db
      .query("githubTeamMappings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Enrich with team names
    const enriched = await Promise.all(
      mappings.map(async (mapping) => {
        const team = await ctx.db.get(mapping.teamId);
        return {
          ...mapping,
          teamName: team?.name,
        };
      })
    );

    return enriched;
  },
});

// Create a new team mapping
export const createTeamMapping = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    teamId: v.id("teams"),
    installationId: v.number(),
    githubOrgName: v.string(),
    githubTeamSlug: v.string(),
    githubTeamId: v.number(),
    syncDirection: v.union(
      v.literal("github_to_ltf1"),
      v.literal("ltf1_to_github"),
      v.literal("bidirectional")
    ),
    syncMembers: v.boolean(),
  },
  returns: v.id("githubTeamMappings"),
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

    // Check workspace membership and permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can create team mappings");
    }

    // Check if mapping already exists
    const existing = await ctx.db
      .query("githubTeamMappings")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (existing) {
      throw new Error("This team is already mapped to a GitHub team");
    }

    const now = Date.now();

    return await ctx.db.insert("githubTeamMappings", {
      workspaceId: args.workspaceId,
      teamId: args.teamId,
      installationId: args.installationId,
      githubOrgName: args.githubOrgName,
      githubTeamSlug: args.githubTeamSlug,
      githubTeamId: args.githubTeamId,
      syncDirection: args.syncDirection,
      syncMembers: args.syncMembers,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update team mapping settings
export const updateTeamMapping = mutation({
  args: {
    mappingId: v.id("githubTeamMappings"),
    syncDirection: v.optional(v.union(
      v.literal("github_to_ltf1"),
      v.literal("ltf1_to_github"),
      v.literal("bidirectional")
    )),
    syncMembers: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const mapping = await ctx.db.get(args.mappingId);
    if (!mapping) {
      throw new Error("Mapping not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace membership and permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", mapping.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can update team mappings");
    }

    const updateData: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.syncDirection !== undefined) updateData.syncDirection = args.syncDirection;
    if (args.syncMembers !== undefined) updateData.syncMembers = args.syncMembers;

    await ctx.db.patch(args.mappingId, updateData);
    return null;
  },
});

// Delete team mapping
export const deleteTeamMapping = mutation({
  args: {
    mappingId: v.id("githubTeamMappings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const mapping = await ctx.db.get(args.mappingId);
    if (!mapping) {
      throw new Error("Mapping not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace membership and permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", mapping.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can delete team mappings");
    }

    await ctx.db.delete(args.mappingId);
    return null;
  },
});

// Internal query to get pending team sync items
export const getPendingTeamSyncMappings = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    // Get all mappings that have sync enabled
    const allMappings = await ctx.db.query("githubTeamMappings").collect();

    // Filter to mappings that need sync (either haven't been synced or are due for sync)
    const now = Date.now();
    const syncInterval = 60 * 60 * 1000; // 1 hour

    return allMappings.filter(mapping =>
      mapping.syncMembers &&
      (!mapping.lastSyncAt || mapping.lastSyncAt < now - syncInterval)
    );
  },
});

// Internal query to get mapping for a specific GitHub team
export const getMappingByGitHubTeam = internalQuery({
  args: {
    githubOrgName: v.string(),
    githubTeamSlug: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("githubTeamMappings")
      .withIndex("by_github_team", (q) =>
        q.eq("githubOrgName", args.githubOrgName).eq("githubTeamSlug", args.githubTeamSlug)
      )
      .first();
  },
});

// Internal mutation to update last sync time
export const updateLastSyncTime = internalMutation({
  args: {
    mappingId: v.id("githubTeamMappings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.mappingId, {
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

// Internal mutation to sync team members from GitHub
export const syncTeamMembersFromGitHub = internalMutation({
  args: {
    mappingId: v.id("githubTeamMappings"),
    githubMembers: v.array(v.object({
      githubId: v.number(),
      githubUsername: v.string(),
      role: v.union(v.literal("maintainer"), v.literal("member")),
    })),
  },
  returns: v.object({
    added: v.number(),
    removed: v.number(),
    unchanged: v.number(),
  }),
  handler: async (ctx, args) => {
    const mapping = await ctx.db.get(args.mappingId);
    if (!mapping) {
      throw new Error("Mapping not found");
    }

    // Get current team members
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", mapping.teamId))
      .collect();

    const currentUserIds = new Set(currentMembers.map(m => m.userId));
    const stats = { added: 0, removed: 0, unchanged: 0 };

    // Map GitHub members to LTF1 users
    const githubUserMappings = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", mapping.workspaceId))
      .collect();

    const githubIdToUserId = new Map<number, Id<"users">>();
    for (const userMapping of githubUserMappings) {
      githubIdToUserId.set(userMapping.githubId, userMapping.userId);
    }

    const newUserIds = new Set<string>();

    // Process GitHub members
    for (const ghMember of args.githubMembers) {
      const userId = githubIdToUserId.get(ghMember.githubId);

      if (userId) {
        newUserIds.add(userId);

        if (!currentUserIds.has(userId)) {
          // Add new member
          await ctx.db.insert("teamMembers", {
            teamId: mapping.teamId,
            userId,
            role: ghMember.role === "maintainer" ? "lead" : "member",
            joinedAt: Date.now(),
          });
          stats.added++;
        } else {
          stats.unchanged++;
        }
      }
    }

    // Remove members no longer in GitHub team (if sync is github_to_ltf1 or bidirectional)
    if (mapping.syncDirection === "github_to_ltf1" || mapping.syncDirection === "bidirectional") {
      for (const member of currentMembers) {
        if (!newUserIds.has(member.userId)) {
          await ctx.db.delete(member._id);
          stats.removed++;
        }
      }
    }

    return stats;
  },
});

// Internal query to get team members for GitHub sync
export const getTeamMembersForSync = internalQuery({
  args: {
    teamId: v.id("teams"),
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(v.object({
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member")),
    githubUsername: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get GitHub usernames for members
    const result = await Promise.all(
      members.map(async (member) => {
        const userMapping = await ctx.db
          .query("githubUserMappings")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .first();

        return {
          userId: member.userId,
          role: member.role,
          githubUsername: userMapping?.githubUsername,
        };
      })
    );

    return result;
  },
});

// Create team from GitHub team
export const createTeamFromGitHub = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    installationId: v.number(),
    githubOrgName: v.string(),
    githubTeamSlug: v.string(),
    githubTeamId: v.number(),
    githubTeamName: v.string(),
    githubTeamDescription: v.optional(v.string()),
    syncDirection: v.union(
      v.literal("github_to_ltf1"),
      v.literal("ltf1_to_github"),
      v.literal("bidirectional")
    ),
  },
  returns: v.object({
    teamId: v.id("teams"),
    mappingId: v.id("githubTeamMappings"),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if mapping already exists
    const existingMapping = await ctx.db
      .query("githubTeamMappings")
      .withIndex("by_github_team", (q) =>
        q.eq("githubOrgName", args.githubOrgName).eq("githubTeamSlug", args.githubTeamSlug)
      )
      .first();

    if (existingMapping) {
      return {
        teamId: existingMapping.teamId,
        mappingId: existingMapping._id,
      };
    }

    // Create LTF1 team
    const teamId = await ctx.db.insert("teams", {
      workspaceId: args.workspaceId,
      name: args.githubTeamName,
      slug: args.githubTeamSlug,
      description: args.githubTeamDescription,
      createdAt: now,
      updatedAt: now,
    });

    // Create mapping
    const mappingId = await ctx.db.insert("githubTeamMappings", {
      workspaceId: args.workspaceId,
      teamId,
      installationId: args.installationId,
      githubOrgName: args.githubOrgName,
      githubTeamSlug: args.githubTeamSlug,
      githubTeamId: args.githubTeamId,
      syncDirection: args.syncDirection,
      syncMembers: true,
      createdAt: now,
      updatedAt: now,
    });

    return { teamId, mappingId };
  },
});

// Get mapping by ID (internal)
export const getMappingById = internalQuery({
  args: {
    mappingId: v.id("githubTeamMappings"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.mappingId);
  },
});

// Get installation for organization
export const getInstallationForOrg = internalQuery({
  args: {
    orgName: v.string(),
  },
  returns: v.union(
    v.object({
      installationId: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_account", (q) => q.eq("accountName", args.orgName))
      .first();

    if (!installation) return null;

    return { installationId: installation.installationId };
  },
});

// Get workspace installations (for listing available orgs)
export const getWorkspaceInstallations = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(v.object({
    installationId: v.number(),
    accountLogin: v.string(),
    accountType: v.union(v.literal("user"), v.literal("organization")),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const links = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Filter to organization installations only (teams are org-specific)
    return links
      .filter(link => link.accountType === "organization")
      .map(link => ({
        installationId: link.installationId,
        accountLogin: link.accountLogin,
        accountType: link.accountType,
      }));
  },
});

// Get unmapped LTF1 teams (for mapping UI)
export const getUnmappedTeams = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(v.object({
    _id: v.id("teams"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const mappings = await ctx.db
      .query("githubTeamMappings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const mappedTeamIds = new Set(mappings.map(m => m.teamId));

    return teams
      .filter(t => !mappedTeamIds.has(t._id))
      .map(t => ({
        _id: t._id,
        name: t.name,
        slug: t.slug,
        description: t.description,
      }));
  },
});
