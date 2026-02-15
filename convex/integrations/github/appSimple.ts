import { v } from "convex/values";
import { action, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";

// Simplified GitHub App actions without JWT (for OAuth flow)
// In production, implement proper JWT signing

// Get user's installations (requires OAuth token)
export const getUserInstallations = action({
  args: {
    accessToken: v.string(),
  },
  returns: v.array(v.object({
    id: v.number(),
    account: v.object({
      login: v.string(),
      type: v.string(),
      avatarUrl: v.string(),
    }),
    repositorySelection: v.string(),
  })),
  handler: async (ctx, args) => {
    const response = await fetch("https://api.github.com/user/installations", {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list installations: ${response.statusText}`);
    }

    const data = await response.json();

    return data.installations.map((inst: any) => ({
      id: inst.id,
      account: {
        login: inst.account.login,
        type: inst.account.type,
        avatarUrl: inst.account.avatar_url,
      },
      repositorySelection: inst.repository_selection,
    }));
  },
});

// Get installation repositories (using OAuth token)
export const getInstallationRepos = action({
  args: {
    installationId: v.number(),
    accessToken: v.string(),
  },
  returns: v.array(v.object({
    id: v.number(),
    name: v.string(),
    fullName: v.string(),
    private: v.boolean(),
    description: v.union(v.string(), v.null()),
  })),
  handler: async (ctx, args) => {
    const response = await fetch(
      `https://api.github.com/user/installations/${args.installationId}/repositories`,
      {
        headers: {
          Authorization: `Bearer ${args.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list repositories: ${response.statusText}`);
    }

    const data = await response.json();

    return data.repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
    }));
  },
});

// Store GitHub App installation
export const storeInstallation = internalMutation({
  args: {
    installationId: v.number(),
    account: v.object({
      type: v.string(),
      login: v.string(),
      id: v.number(),
    }),
    targetType: v.string(),
    permissions: v.any(),
    events: v.array(v.string()),
    repositorySelection: v.string(),
    repositories: v.optional(v.array(v.object({
      id: v.number(),
      nodeId: v.string(),
      name: v.string(),
      fullName: v.string(),
      private: v.boolean(),
    }))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("[storeInstallation] Starting for installation:", args.installationId);
    // Check if installation already exists
    const existing = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (existing) {
      // Update existing installation
      await ctx.db.patch(existing._id, {
        accountName: args.account.login,
        accountType: args.account.type.toLowerCase() as "user" | "organization",
        accountId: args.account.id,
        targetType: args.targetType.toLowerCase() as "user" | "organization",
        permissions: args.permissions,
        events: args.events,
        repositorySelection: args.repositorySelection as "all" | "selected",
        updatedAt: Date.now(),
      });
    } else {
      // Create new installation
      await ctx.db.insert("githubInstallations", {
        installationId: args.installationId,
        accountName: args.account.login,
        accountType: args.account.type.toLowerCase() as "user" | "organization",
        accountId: args.account.id,
        targetType: args.targetType.toLowerCase() as "user" | "organization",
        permissions: args.permissions,
        events: args.events,
        repositorySelection: args.repositorySelection as "all" | "selected",
        installedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Store repositories if provided
    if (args.repositories) {
      for (const repo of args.repositories) {
        const existingRepo = await ctx.db
          .query("githubRepositories")
          .withIndex("by_repo_id", (q) => q.eq("repoId", repo.id))
          .first();

        if (!existingRepo) {
          await ctx.db.insert("githubRepositories", {
            installationId: args.installationId,
            repoId: repo.id,
            nodeId: repo.nodeId,
            owner: repo.fullName.split("/")[0],
            name: repo.name,
            fullName: repo.fullName,
            private: repo.private,
            defaultBranch: "main",
            topics: [],
            stargazersCount: 0,
            forksCount: 0,
            openIssuesCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            connectedAt: Date.now(),
          });
        }
      }
    }

    // If "all repositories" is selected, trigger immediate sync to fetch all repos
    // This is necessary because GitHub webhooks only send a subset of repos
    if (args.repositorySelection === "all") {
      await ctx.scheduler.runAfter(0, internal.integrations.github.syncActions.syncInstallationRepositories, {
        installationId: args.installationId,
      });
      console.log(`Scheduled repository sync for installation ${args.installationId} (all repos selected)`);
    }

    // Auto-link installation to workspaces of users who have connected this GitHub account
    const accountLogin = args.account.login;
    const accountType = args.account.type.toLowerCase() as "user" | "organization";

    // Find GitHub connections matching this account login
    const matchingConnections = await ctx.db
      .query("githubConnections")
      .collect();

    const matchedUsers = matchingConnections.filter(
      (c) => c.githubUsername.toLowerCase() === accountLogin.toLowerCase()
    );

    // Also check users table for githubUsername field
    if (matchedUsers.length === 0) {
      const allUsers = await ctx.db.query("users").collect();
      const usersWithGithub = allUsers.filter(
        (u: any) => u.githubUsername && u.githubUsername.toLowerCase() === accountLogin.toLowerCase()
      );
      for (const user of usersWithGithub) {
        matchedUsers.push({ userId: user._id } as any);
      }
    }

    for (const connection of matchedUsers) {
      // Find all workspaces this user belongs to
      const memberships = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_user", (q) => q.eq("userId", connection.userId))
        .collect();

      for (const membership of memberships) {
        // Check if this installation is already linked to this workspace
        const existingLinks = await ctx.db
          .query("workspaceGitHubInstallations")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", membership.workspaceId))
          .collect();

        const alreadyLinked = existingLinks.some(
          (l) => l.installationId === args.installationId
        );

        if (!alreadyLinked) {
          await ctx.db.insert("workspaceGitHubInstallations", {
            workspaceId: membership.workspaceId,
            installationId: args.installationId,
            isPrimary: existingLinks.length === 0,
            accountLogin,
            accountType,
            syncSettings: {
              autoSyncIssues: false,
              bidirectionalSync: false,
              createTasksFromIssues: false,
              syncLabels: false,
            },
            addedBy: connection.userId,
            addedAt: Date.now(),
          });
          console.log(`[storeInstallation] Auto-linked installation ${args.installationId} to workspace ${membership.workspaceId}`);
        }
      }
    }

    console.log(`[storeInstallation] GitHub App installed for ${args.account.login}`);
    return null;
  },
});

// Remove GitHub App installation
export const removeInstallation = internalMutation({
  args: {
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (installation) {
      // Remove associated repositories
      const repos = await ctx.db
        .query("githubRepositories")
        .withIndex("by_installation", (q) => q.eq("installationId", args.installationId))
        .collect();

      for (const repo of repos) {
        await ctx.db.delete(repo._id);
      }

      await ctx.db.delete(installation._id);
      console.log(`GitHub App installation removed: ${args.installationId}`);
    }
  },
});

// Suspend GitHub App installation
export const suspendInstallation = internalMutation({
  args: {
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (installation) {
      await ctx.db.patch(installation._id, {
        suspendedAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`GitHub App installation suspended: ${args.installationId}`);
    }
  },
});

// Unsuspend GitHub App installation
export const unsuspendInstallation = internalMutation({
  args: {
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (installation) {
      await ctx.db.patch(installation._id, {
        suspendedAt: undefined,
        updatedAt: Date.now(),
      });
      console.log(`GitHub App installation unsuspended: ${args.installationId}`);
    }
  },
});

// Add repositories to installation
export const addInstallationRepositories = internalMutation({
  args: {
    installationId: v.number(),
    repositories: v.array(v.object({
      id: v.number(),
      nodeId: v.string(),
      name: v.string(),
      fullName: v.string(),
      private: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (installation) {
      // Store repositories in githubRepositories table
      for (const repo of args.repositories) {
        const existing = await ctx.db
          .query("githubRepositories")
          .withIndex("by_repo_id", (q) => q.eq("repoId", repo.id))
          .first();

        if (!existing) {
          await ctx.db.insert("githubRepositories", {
            installationId: args.installationId,
            repoId: repo.id,
            nodeId: repo.nodeId,
            owner: repo.fullName.split("/")[0],
            name: repo.name,
            fullName: repo.fullName,
            private: repo.private,
            defaultBranch: "main",
            topics: [],
            stargazersCount: 0,
            forksCount: 0,
            openIssuesCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            connectedAt: Date.now(),
          });
        }
      }

      await ctx.db.patch(installation._id, {
        updatedAt: Date.now(),
      });

      console.log(`Added ${args.repositories.length} repositories to installation ${args.installationId}`);
    }
  },
});

// Remove repositories from installation
export const removeInstallationRepositories = internalMutation({
  args: {
    installationId: v.number(),
    repositoryIds: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (installation) {
      // Remove repositories from githubRepositories table
      for (const repoId of args.repositoryIds) {
        const repo = await ctx.db
          .query("githubRepositories")
          .withIndex("by_repo_id", (q) => q.eq("repoId", repoId))
          .first();

        if (repo && repo.installationId === args.installationId) {
          await ctx.db.delete(repo._id);
        }
      }

      await ctx.db.patch(installation._id, {
        updatedAt: Date.now(),
      });

      console.log(`Removed ${args.repositoryIds.length} repositories from installation ${args.installationId}`);
    }
  },
});