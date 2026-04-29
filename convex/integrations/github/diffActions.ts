"use node";

import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

type TokenResult = {
  token: string;
  expiresAt: string;
  permissions: any;
  repositorySelection: string;
};

export const getPullRequestFiles = action({
  args: {
    repositoryFullName: v.string(),
    prNumber: v.number(),
  },
  returns: v.object({
    files: v.array(
      v.object({
        filename: v.string(),
        status: v.string(),
        additions: v.number(),
        deletions: v.number(),
        changes: v.number(),
        patch: v.optional(v.string()),
        previousFilename: v.optional(v.string()),
      })
    ),
    truncated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const repoQuery: any = internal.integrations.github.queries.getRepositoryByFullName;
    const repo: any = await ctx.runQuery(repoQuery, {
      fullName: args.repositoryFullName,
    });
    if (!repo) {
      throw new Error("Repository not connected");
    }

    const tokenAction: any = internal.integrations.github.nodeActions.generateInstallationToken;
    const tokenResult: TokenResult = await ctx.runAction(tokenAction, {
      appId: process.env.VITE_GITHUB_CLIENT_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
      installationId: repo.installationId,
    });

    const url = `https://api.github.com/repos/${args.repositoryFullName}/pulls/${args.prNumber}/files?per_page=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}: ${response.statusText}`);
    }

    const data: Array<any> = await response.json();

    return {
      files: data.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions ?? 0,
        deletions: f.deletions ?? 0,
        changes: f.changes ?? 0,
        patch: f.patch,
        previousFilename: f.previous_filename,
      })),
      truncated: data.length >= 100,
    };
  },
});
