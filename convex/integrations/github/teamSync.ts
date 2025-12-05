"use node";

import { v } from "convex/values";
import { internalAction, action } from "../../_generated/server";
import { internal, api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

// Fetch GitHub organization teams
export const fetchOrganizationTeams = action({
  args: {
    workspaceId: v.id("workspaces"),
    installationId: v.number(),
    orgName: v.string(),
  },
  returns: v.array(v.object({
    id: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.union(v.string(), v.null()),
    privacy: v.string(),
    permission: v.string(),
    membersCount: v.number(),
  })),
  handler: async (ctx, args) => {
    const token = await getInstallationToken(args.installationId);

    const response = await fetch(
      `https://api.github.com/orgs/${args.orgName}/teams?per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch teams: ${response.statusText} - ${errorText}`);
    }

    const teams = await response.json();

    return teams.map((team: any) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      description: team.description,
      privacy: team.privacy,
      permission: team.permission,
      membersCount: team.members_count || 0,
    }));
  },
});

// Fetch team members from GitHub
export const fetchTeamMembers = action({
  args: {
    installationId: v.number(),
    orgName: v.string(),
    teamSlug: v.string(),
  },
  returns: v.array(v.object({
    githubId: v.number(),
    githubUsername: v.string(),
    role: v.union(v.literal("maintainer"), v.literal("member")),
  })),
  handler: async (ctx, args) => {
    const token = await getInstallationToken(args.installationId);

    const members: Array<{
      githubId: number;
      githubUsername: string;
      role: "maintainer" | "member";
    }> = [];

    // Fetch regular members
    const membersResponse = await fetch(
      `https://api.github.com/orgs/${args.orgName}/teams/${args.teamSlug}/members?per_page=100&role=member`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (membersResponse.ok) {
      const memberData = await membersResponse.json();
      for (const member of memberData) {
        members.push({
          githubId: member.id,
          githubUsername: member.login,
          role: "member",
        });
      }
    }

    // Fetch maintainers
    const maintainersResponse = await fetch(
      `https://api.github.com/orgs/${args.orgName}/teams/${args.teamSlug}/members?per_page=100&role=maintainer`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (maintainersResponse.ok) {
      const maintainerData = await maintainersResponse.json();
      for (const maintainer of maintainerData) {
        members.push({
          githubId: maintainer.id,
          githubUsername: maintainer.login,
          role: "maintainer",
        });
      }
    }

    return members;
  },
});

// Process team sync queue - runs periodically
export const processTeamSyncQueue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get pending team sync mappings
    const pendingMappings = await ctx.runQuery(
      internal.integrations.github.teamSyncMutations.getPendingTeamSyncMappings,
      {}
    );

    for (const mapping of pendingMappings) {
      try {
        // Fetch current GitHub team members
        const githubMembers = await fetchTeamMembersInternal(
          mapping.installationId,
          mapping.githubOrgName,
          mapping.githubTeamSlug
        );

        // Sync members based on direction
        if (mapping.syncDirection === "github_to_ltf1" || mapping.syncDirection === "bidirectional") {
          await ctx.runMutation(
            internal.integrations.github.teamSyncMutations.syncTeamMembersFromGitHub,
            {
              mappingId: mapping._id,
              githubMembers,
            }
          );
        }

        // For ltf1_to_github or bidirectional, sync members TO GitHub
        if (mapping.syncDirection === "ltf1_to_github" || mapping.syncDirection === "bidirectional") {
          const ltf1Members = await ctx.runQuery(
            internal.integrations.github.teamSyncMutations.getTeamMembersForSync,
            {
              teamId: mapping.teamId,
              workspaceId: mapping.workspaceId,
            }
          );

          // Sync LTF1 members to GitHub (add members who aren't in GitHub team)
          await syncMembersToGitHub(
            mapping.installationId,
            mapping.githubOrgName,
            mapping.githubTeamSlug,
            ltf1Members,
            githubMembers
          );
        }

        // Update last sync time
        await ctx.runMutation(
          internal.integrations.github.teamSyncMutations.updateLastSyncTime,
          { mappingId: mapping._id }
        );
      } catch (error) {
        console.error(`Failed to sync team ${mapping.githubTeamSlug}:`, error);
      }
    }

    return null;
  },
});

// Trigger immediate sync for a specific mapping
export const triggerTeamSync = action({
  args: {
    mappingId: v.id("githubTeamMappings"),
  },
  returns: v.object({
    success: v.boolean(),
    added: v.optional(v.number()),
    removed: v.optional(v.number()),
    unchanged: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the mapping
      const mappings = await ctx.runQuery(
        api.integrations.github.teamSyncMutations.getTeamMappings,
        { workspaceId: "placeholder" as any } // We'll fetch by ID instead
      );

      // Find our specific mapping - we need to get it from the DB
      // For now, we'll trigger the internal sync
      await ctx.runAction(
        internal.integrations.github.teamSync.syncSingleMapping,
        { mappingId: args.mappingId }
      );

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});

// Internal action to sync a single mapping
export const syncSingleMapping = internalAction({
  args: {
    mappingId: v.id("githubTeamMappings"),
  },
  returns: v.object({
    added: v.number(),
    removed: v.number(),
    unchanged: v.number(),
  }),
  handler: async (ctx, args): Promise<{ added: number; removed: number; unchanged: number }> => {
    // Get the mapping directly from DB
    const mapping = await ctx.runQuery(
      internal.integrations.github.teamSyncMutations.getMappingById,
      { mappingId: args.mappingId }
    );

    if (!mapping) {
      throw new Error("Mapping not found");
    }

    // Fetch current GitHub team members
    const githubMembers = await fetchTeamMembersInternal(
      mapping.installationId,
      mapping.githubOrgName,
      mapping.githubTeamSlug
    );

    // Sync members from GitHub
    const stats: { added: number; removed: number; unchanged: number } = await ctx.runMutation(
      internal.integrations.github.teamSyncMutations.syncTeamMembersFromGitHub,
      {
        mappingId: args.mappingId,
        githubMembers,
      }
    );

    // Update last sync time
    await ctx.runMutation(
      internal.integrations.github.teamSyncMutations.updateLastSyncTime,
      { mappingId: args.mappingId }
    );

    return stats;
  },
});

// Import GitHub team and create mapping
export const importGitHubTeam = action({
  args: {
    workspaceId: v.id("workspaces"),
    installationId: v.number(),
    orgName: v.string(),
    teamSlug: v.string(),
    teamId: v.number(),
    teamName: v.string(),
    teamDescription: v.optional(v.string()),
    syncDirection: v.union(
      v.literal("github_to_ltf1"),
      v.literal("ltf1_to_github"),
      v.literal("bidirectional")
    ),
    syncMembers: v.boolean(),
  },
  returns: v.object({
    teamId: v.id("teams"),
    mappingId: v.id("githubTeamMappings"),
  }),
  handler: async (ctx, args): Promise<{ teamId: Id<"teams">; mappingId: Id<"githubTeamMappings"> }> => {
    // Create team and mapping
    const result: { teamId: Id<"teams">; mappingId: Id<"githubTeamMappings"> } = await ctx.runMutation(
      internal.integrations.github.teamSyncMutations.createTeamFromGitHub,
      {
        workspaceId: args.workspaceId,
        installationId: args.installationId,
        githubOrgName: args.orgName,
        githubTeamSlug: args.teamSlug,
        githubTeamId: args.teamId,
        githubTeamName: args.teamName,
        githubTeamDescription: args.teamDescription,
        syncDirection: args.syncDirection,
      }
    );

    // If sync members is enabled, do initial sync
    if (args.syncMembers) {
      const githubMembers = await fetchTeamMembersInternal(
        args.installationId,
        args.orgName,
        args.teamSlug
      );

      await ctx.runMutation(
        internal.integrations.github.teamSyncMutations.syncTeamMembersFromGitHub,
        {
          mappingId: result.mappingId,
          githubMembers,
        }
      );
    }

    return result;
  },
});

// Helper functions

async function getInstallationToken(installationId: number): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials not configured");
  }

  const jwt = await generateGitHubJWT(appId, privateKey);

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get installation token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

async function generateGitHubJWT(appId: string, privateKey: string): Promise<string> {
  const jose = await import("jose");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 600,
    iss: appId,
  };

  const key = await jose.importPKCS8(privateKey, "RS256");
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(key);

  return jwt;
}

async function fetchTeamMembersInternal(
  installationId: number,
  orgName: string,
  teamSlug: string
): Promise<Array<{
  githubId: number;
  githubUsername: string;
  role: "maintainer" | "member";
}>> {
  const token = await getInstallationToken(installationId);

  const members: Array<{
    githubId: number;
    githubUsername: string;
    role: "maintainer" | "member";
  }> = [];

  // Fetch all members (includes both roles)
  const response = await fetch(
    `https://api.github.com/orgs/${orgName}/teams/${teamSlug}/members?per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch team members: ${response.statusText}`);
  }

  const memberData = await response.json();

  // Get membership details for each member to determine role
  for (const member of memberData) {
    const membershipResponse = await fetch(
      `https://api.github.com/orgs/${orgName}/teams/${teamSlug}/memberships/${member.login}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    let role: "maintainer" | "member" = "member";
    if (membershipResponse.ok) {
      const membership = await membershipResponse.json();
      role = membership.role === "maintainer" ? "maintainer" : "member";
    }

    members.push({
      githubId: member.id,
      githubUsername: member.login,
      role,
    });
  }

  return members;
}

async function syncMembersToGitHub(
  installationId: number,
  orgName: string,
  teamSlug: string,
  ltf1Members: Array<{
    userId: any;
    role: "lead" | "member";
    githubUsername?: string;
  }>,
  existingGitHubMembers: Array<{
    githubId: number;
    githubUsername: string;
    role: "maintainer" | "member";
  }>
): Promise<void> {
  const token = await getInstallationToken(installationId);

  const existingUsernames = new Set(
    existingGitHubMembers.map(m => m.githubUsername.toLowerCase())
  );

  for (const ltf1Member of ltf1Members) {
    if (!ltf1Member.githubUsername) continue;

    const username = ltf1Member.githubUsername.toLowerCase();
    if (existingUsernames.has(username)) continue;

    // Add member to GitHub team
    const role = ltf1Member.role === "lead" ? "maintainer" : "member";

    try {
      const response = await fetch(
        `https://api.github.com/orgs/${orgName}/teams/${teamSlug}/memberships/${ltf1Member.githubUsername}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) {
        console.error(
          `Failed to add ${ltf1Member.githubUsername} to team: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(`Error adding ${ltf1Member.githubUsername} to team:`, error);
    }
  }
}
