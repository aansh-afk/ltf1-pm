"use node";

import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { Octokit } from "@octokit/rest";

interface TokenData {
  token: string;
  expiresAt: string;
  permissions: any;
  repositorySelection: string;
}

// Get repository details from GitHub API
export const getRepositoryDetails = internalAction({
  args: {
    installationId: v.number(),
    owner: v.string(),
    repo: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      id: v.number(),
      nodeId: v.string(),
      name: v.string(),
      fullName: v.string(),
      private: v.boolean(),
      description: v.optional(v.string()),
      defaultBranch: v.string(),
      language: v.optional(v.string()),
      topics: v.array(v.string()),
      stargazersCount: v.number(),
      forksCount: v.number(),
      openIssuesCount: v.number(),
      createdAt: v.string(),
      updatedAt: v.string(),
      pushedAt: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get installation token
      const tokenData: TokenData = await ctx.runAction(internal.integrations.github.nodeActions.generateInstallationToken, {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_PRIVATE_KEY!,
        installationId: args.installationId,
      });

      const octokit: Octokit = new Octokit({
        auth: tokenData.token,
      });
      
      const { data }: any = await octokit.request("GET /repos/{owner}/{repo}", {
        owner: args.owner,
        repo: args.repo,
      });

      return {
        id: data.id,
        nodeId: data.node_id,
        name: data.name,
        fullName: data.full_name,
        private: data.private,
        description: data.description,
        defaultBranch: data.default_branch,
        language: data.language,
        topics: data.topics || [],
        stargazersCount: data.stargazers_count,
        forksCount: data.forks_count,
        openIssuesCount: data.open_issues_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        pushedAt: data.pushed_at,
      };
    } catch (error) {
      console.error("Error fetching repository details:", error);
      return null;
    }
  },
});