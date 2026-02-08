"use node";

import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { Octokit } from "@octokit/rest";

// Process developer stats sync for all connected users (called by cron)
export const processStatsSyncQueue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    try {
      const users = await ctx.runQuery(internal.integrations.github.sync.getUsersForStatsSync, {});

      console.log(`[Stats Sync] Processing ${users.length} users`);

      for (const user of users) {
        try {
          console.log(`[Stats Sync] Syncing stats for @${user.githubUsername}`);

          await ctx.runAction(internal.integrations.github.syncActions.syncDeveloperGitHubStats, {
            userId: user.userId,
            githubUsername: user.githubUsername,
            installationId: user.installationId,
          });

          console.log(`[Stats Sync] Completed sync for @${user.githubUsername}`);
        } catch (error) {
          console.error(`[Stats Sync] Error syncing user @${user.githubUsername}:`, error);
        }
      }

      console.log(`[Stats Sync] Finished processing all users`);
      return null;
    } catch (error) {
      console.error("[Stats Sync] Error in processStatsSyncQueue:", error);
      return null;
    }
  },
});

// Process repository sync for all active installations (called by cron)
export const processRepositorySyncQueue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    try {
      // Get all active installations
      const installations = await ctx.runQuery(internal.integrations.github.sync.getInstallationsToSync, {});

      console.log(`[Repo Sync] Processing ${installations.length} installations`);

      // Sync each installation's repositories
      for (const installation of installations) {
        try {
          console.log(`[Repo Sync] Syncing installation ${installation.installationId} (${installation.accountName})`);

          await ctx.runAction(internal.integrations.github.syncActions.syncInstallationRepositories, {
            installationId: installation.installationId,
          });

          console.log(`[Repo Sync] Completed sync for ${installation.accountName}`);
        } catch (error) {
          console.error(`[Repo Sync] Error syncing installation ${installation.installationId}:`, error);
          // Continue with other installations even if one fails
        }
      }

      console.log(`[Repo Sync] Finished processing all installations`);
      return null;
    } catch (error) {
      console.error("[Repo Sync] Error in processRepositorySyncQueue:", error);
      return null;
    }
  },
});

// Sync GitHub stats for a developer
export const syncDeveloperGitHubStats = internalAction({
  args: {
    userId: v.id("users"),
    githubUsername: v.string(),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Get installation token
      const tokenData = await ctx.runAction(internal.integrations.github.nodeActions.generateInstallationToken, {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
        installationId: args.installationId,
      });

      const octokit = new Octokit({
        auth: tokenData.token,
      });

      // Fetch user data
      const { data: userData } = await octokit.request("GET /users/{username}", {
        username: args.githubUsername,
      });

      // Fetch contribution statistics
      const contributionStats = await fetchContributionStats(octokit, args.githubUsername);

      // Fetch language statistics from user's repositories
      const languageStats = await fetchLanguageStats(octokit, args.githubUsername);

      // Update developer profile with GitHub stats
      await ctx.runMutation(internal.integrations.github.sync.updateDeveloperGitHubStats, {
        userId: args.userId,
        stats: {
          username: args.githubUsername,
          totalPRs: contributionStats.totalPRs,
          totalReviews: contributionStats.totalReviews,
          avgReviewTime: 0, // Would need to calculate from actual review data
          languages: languageStats.map(lang => ({
            name: lang.name,
            percentage: lang.percentage,
          })),
          lastSynced: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error syncing GitHub stats:", error);
    }
  },
});

// Sync all repositories for an installation
export const syncInstallationRepositories = internalAction({
  args: {
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Get installation token
      const tokenData = await ctx.runAction(internal.integrations.github.nodeActions.generateInstallationToken, {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
        installationId: args.installationId,
      });

      const octokit = new Octokit({
        auth: tokenData.token,
      });

      // Fetch all repositories accessible to the installation
      const { data: repos } = await octokit.request("GET /installation/repositories", {
        per_page: 100,
      });

      // Update repository data
      for (const repo of repos.repositories) {
        await ctx.runMutation(internal.integrations.github.sync.upsertRepository, {
          installationId: args.installationId,
          repository: {
            repoId: repo.id,
            nodeId: repo.node_id,
            owner: repo.owner.login,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            description: repo.description || undefined,
            defaultBranch: repo.default_branch,
            language: repo.language || undefined,
            topics: repo.topics || [],
            stargazersCount: repo.stargazers_count,
            forksCount: repo.forks_count,
            openIssuesCount: repo.open_issues_count,
            createdAt: repo.created_at || new Date().toISOString(),
            updatedAt: repo.updated_at || new Date().toISOString(),
            pushedAt: repo.pushed_at || undefined,
          },
        });
      }
    } catch (error) {
      console.error("Error syncing installation repositories:", error);
    }
  },
});

// Perform repository sync
export const performRepositorySync = internalAction({
  args: {
    repositoryId: v.id("githubRepositories"),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repository = await ctx.runQuery(internal.integrations.github.queries.getRepositoryById, {
      repositoryId: args.repositoryId,
    });

    if (!repository) return;

    try {
      // Get installation token
      const tokenData = await ctx.runAction(internal.integrations.github.nodeActions.generateInstallationToken, {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
        installationId: args.installationId,
      });

      const octokit = new Octokit({
        auth: tokenData.token,
      });

      // Fetch latest repository data
      const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
        owner: repository.owner,
        repo: repository.name,
      });

      // Update repository data
      await ctx.runMutation(internal.integrations.github.mutations.updateRepositoryData, {
        repositoryId: args.repositoryId,
        data: {
          description: data.description || undefined,
          defaultBranch: data.default_branch,
          language: data.language || undefined,
          topics: data.topics || [],
          stargazersCount: data.stargazers_count,
          forksCount: data.forks_count,
          openIssuesCount: data.open_issues_count,
          updatedAt: data.updated_at,
          pushedAt: data.pushed_at || undefined,
        },
      });

      // Fetch recent commits
      const { data: commits } = await octokit.request("GET /repos/{owner}/{repo}/commits", {
        owner: repository.owner,
        repo: repository.name,
        per_page: 10,
      });

      // Store commits
      for (const commit of commits) {
        await ctx.runMutation(internal.integrations.github.mutations.storeCommit, {
          repositoryFullName: repository.fullName,
          commit: {
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author?.name || "Unknown",
              email: commit.commit.author?.email || "unknown@example.com",
              date: commit.commit.author?.date || new Date().toISOString(),
            },
            url: commit.html_url,
          },
        });
      }
    } catch (error) {
      console.error("Error syncing repository:", error);
    }
  },
});

// Helper functions

async function fetchContributionStats(octokit: Octokit, username: string) {
  try {
    // Fetch pull requests
    const { data: prs } = await octokit.request("GET /search/issues", {
      q: `author:${username} type:pr`,
      per_page: 1,
    });

    // Fetch issues
    const { data: issues } = await octokit.request("GET /search/issues", {
      q: `author:${username} type:issue`,
      per_page: 1,
    });

    // Fetch reviews (as reviewer)
    const { data: reviews } = await octokit.request("GET /search/issues", {
      q: `reviewed-by:${username} type:pr`,
      per_page: 1,
    });

    return {
      totalCommits: 0, // Would need GraphQL API
      totalPRs: prs.total_count,
      totalReviews: reviews.total_count,
      totalIssues: issues.total_count,
      calendar: [], // Would need GraphQL API
    };
  } catch (error) {
    console.error("Error fetching contribution stats:", error);
    return {
      totalCommits: 0,
      totalPRs: 0,
      totalReviews: 0,
      totalIssues: 0,
      calendar: [],
    };
  }
}

async function fetchLanguageStats(octokit: Octokit, username: string) {
  try {
    // Fetch user's repositories
    const { data: repos } = await octokit.request("GET /users/{username}/repos", {
      username,
      type: "owner",
      per_page: 100,
      sort: "updated",
    });

    const languageCounts: Record<string, number> = {};
    let totalBytes = 0;

    // Fetch language data for each repository
    for (const repo of repos) {
      try {
        const { data: languages } = await octokit.request("GET /repos/{owner}/{repo}/languages", {
          owner: repo.owner.login,
          repo: repo.name,
        });

        for (const [language, bytes] of Object.entries(languages)) {
          languageCounts[language] = (languageCounts[language] || 0) + (bytes as number);
          totalBytes += bytes as number;
        }
      } catch (error) {
        // Skip repositories we can't access
      }
    }

    // Convert to percentage-based array
    const languageStats = Object.entries(languageCounts)
      .map(([name, bytes]) => ({
        name,
        percentage: Math.round((bytes / totalBytes) * 100),
        linesOfCode: Math.round(bytes / 25), // Rough estimate: 25 bytes per line
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10); // Top 10 languages

    return languageStats;
  } catch (error) {
    console.error("Error fetching language stats:", error);
    return [];
  }
}