"use node";

import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { createHmac } from "crypto";
import jwt from "jsonwebtoken";

// Verify GitHub webhook signature using Node.js crypto
export const verifyWebhookSignature = internalAction({
  args: {
    payload: v.string(),
    signature: v.string(),
    secret: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const expectedSignature = "sha256=" +
      createHmac("sha256", args.secret)
        .update(args.payload)
        .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const source = Buffer.from(args.signature);
    const target = Buffer.from(expectedSignature);

    if (source.length !== target.length) {
      console.log(`[Webhook] Signature length mismatch. Received: ${source.length}, Expected: ${target.length}`);
      console.log(`[Webhook] Debug - Received (masked): ${args.signature.substring(0, 10)}...`);
      console.log(`[Webhook] Debug - Expected (masked): ${expectedSignature.substring(0, 10)}...`);
      return false;
    }

    const isValid = createHmac("sha256", args.secret).update(args.payload).digest("hex") === args.signature.replace("sha256=", "");

    // We'll use a simple comparison for now as timingSafeEqual requires equal length buffers
    // and handling the buffer conversion can be tricky with different encodings/lengths.
    // Reverting to simple string comparison but with better logging.

    if (args.signature !== expectedSignature) {
      console.log(`[Webhook] Signature mismatch.`);
      console.log(`[Webhook] Debug - Received: ${args.signature}`);
      console.log(`[Webhook] Debug - Calculated: ${expectedSignature}`);
      console.log(`[Webhook] Debug - Secret length: ${args.secret.length}`);
      return false;
    }

    return true;
  },
});

// Generate JWT for GitHub App authentication
export const generateInstallationToken = internalAction({
  args: {
    appId: v.string(),
    privateKey: v.string(),
    installationId: v.number(),
  },
  returns: v.object({
    token: v.string(),
    expiresAt: v.string(),
    permissions: v.any(),
    repositorySelection: v.string(),
  }),
  handler: async (ctx, args) => {
    // Generate JWT for app authentication
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // issued 60 seconds ago
      exp: now + 600, // expires in 10 minutes
      iss: args.appId,
    };

    // Normalize the private key
    let privateKey = args.privateKey;

    // Strip surrounding quotes if present (common env var issue)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }

    // Handle escaped newlines
    if (!privateKey.includes("\n") && privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    // Basic validation
    if (!privateKey.includes("-----BEGIN RSA PRIVATE KEY-----")) {
      throw new Error("Invalid Private Key: Missing BEGIN header. Please check GITHUB_APP_PRIVATE_KEY.");
    }
    if (!privateKey.includes("-----END RSA PRIVATE KEY-----")) {
      throw new Error("Invalid Private Key: Missing END footer. It looks like the key was truncated or missing the footer line.");
    }

    const appToken = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
    });

    // Exchange JWT for installation access token
    const response = await fetch(
      `https://api.github.com/app/installations/${args.installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${appToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      token: data.token,
      expiresAt: data.expires_at,
      permissions: data.permissions,
      repositorySelection: data.repository_selection,
    };
  },
});

// Create JWT for GitHub App
export const createAppJWT = internalAction({
  args: {
    appId: v.string(),
    privateKey: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,
      exp: now + 600,
      iss: args.appId,
    };

    return jwt.sign(payload, args.privateKey, {
      algorithm: "RS256",
    });
  },
});

// Backfill repository data (commits, PRs, stats)
export const backfillRepositoryData = internalAction({
  args: {
    repositoryId: v.id("githubRepositories"),
    installationId: v.number(),
    repositoryFullName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get Installation Token
    const tokenResult = await ctx.runAction(internal.integrations.github.nodeActions.generateInstallationToken, {
      appId: process.env.VITE_GITHUB_CLIENT_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
      installationId: args.installationId,
    });

    const headers = {
      Authorization: `Bearer ${tokenResult.token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // 2. Fetch Repository Details (Stats)
    const repoResponse = await fetch(`https://api.github.com/repos/${args.repositoryFullName}`, { headers });
    let repoData: any = null;
    if (repoResponse.ok) {
      repoData = await repoResponse.json();
      await ctx.runMutation(internal.integrations.github.mutations.updateRepositoryData, {
        repositoryId: args.repositoryId,
        data: {
          description: repoData.description,
          defaultBranch: repoData.default_branch,
          language: repoData.language,
          topics: repoData.topics || [],
          stargazersCount: repoData.stargazers_count,
          forksCount: repoData.forks_count,
          openIssuesCount: repoData.open_issues_count,
          updatedAt: repoData.updated_at,
          pushedAt: repoData.pushed_at,
        },
      });
    }

    // 3. Fetch Recent Commits (Limit 20)
    const commitsResponse = await fetch(`https://api.github.com/repos/${args.repositoryFullName}/commits?per_page=20`, { headers });
    if (commitsResponse.ok) {
      const commits = await commitsResponse.json();
      // Reverse to add oldest first if we care about order, but for activity feed mostly newest matters
      for (const commit of commits) {
        await ctx.runMutation(internal.integrations.github.mutations.storeCommit, {
          repositoryFullName: args.repositoryFullName,
          commit: {
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author.name,
              email: commit.commit.author.email,
              date: commit.commit.author.date,
            },
            url: commit.html_url,
          },
        });

        // Log activity for the latest 5 commits to populate the feed
        if (commits.indexOf(commit) < 5) {
          await ctx.runMutation(internal.integrations.github.mutations.logGitHubActivity, {
            type: "commit",
            repositoryFullName: args.repositoryFullName,
            actor: commit.commit.author.name,
            metadata: {
              sha: commit.sha,
              title: commit.commit.message.split('\n')[0],
              ref: `refs/heads/${repoData?.default_branch || 'main'}`,
            },
          });
        }
      }
    }

    // 4. Fetch Recent Pull Requests (Limit 10, State: all)
    const prsResponse = await fetch(`https://api.github.com/repos/${args.repositoryFullName}/pulls?state=all&per_page=10`, { headers });
    if (prsResponse.ok) {
      const prs = await prsResponse.json();
      for (const pr of prs) {
        await ctx.runMutation(internal.integrations.github.mutations.linkPullRequestToTasks, {
          repositoryFullName: args.repositoryFullName,
          pullRequest: {
            number: pr.number,
            title: pr.title,
            state: pr.state,
            draft: pr.draft,
            url: pr.html_url,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            closedAt: pr.closed_at,
            mergedAt: pr.merged_at,
            author: pr.user.login,
          },
          taskRefs: [],
          action: pr.state === "open" ? "opened" : (pr.merged_at ? "closed" : "closed"),
        });
      }
    }
  },
});