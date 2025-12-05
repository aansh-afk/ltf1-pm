"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

// Process sync queue - picks up pending items and processes them
export const processSyncQueue = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get pending items from queue
    const pendingItems = await ctx.runQuery(internal.integrations.github.issueSyncMutations.getPendingQueueItems, {});

    for (const item of pendingItems) {
      try {
        // Mark as processing
        await ctx.runMutation(internal.integrations.github.issueSyncMutations.updateQueueItemStatus, {
          itemId: item._id,
          status: "processing",
        });

        // Process based on direction
        if (item.direction === "from_github") {
          await processGitHubToTask(ctx, item);
        } else {
          await processTaskToGitHub(ctx, item);
        }

        // Mark as completed
        await ctx.runMutation(internal.integrations.github.issueSyncMutations.updateQueueItemStatus, {
          itemId: item._id,
          status: "completed",
          processedAt: Date.now(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Mark as failed with error
        await ctx.runMutation(internal.integrations.github.issueSyncMutations.updateQueueItemStatus, {
          itemId: item._id,
          status: item.retryCount >= 3 ? "failed" : "pending",
          lastError: errorMessage,
          retryCount: item.retryCount + 1,
          scheduledFor: item.retryCount < 3 ? Date.now() + (60000 * Math.pow(2, item.retryCount)) : undefined,
        });
      }
    }
    return null;
  },
});

// Helper function to process GitHub issue to LTF1 task
async function processGitHubToTask(ctx: any, item: any) {
  const payload = item.payload;

  if (item.operation === "create") {
    // Create a new task from GitHub issue
    await ctx.runMutation(internal.integrations.github.issueSyncMutations.createTaskFromIssue, {
      workspaceId: item.workspaceId,
      repositoryFullName: item.repositoryFullName,
      issueNumber: item.githubIssueNumber!,
      issueTitle: payload.issueTitle,
      issueBody: payload.issueBody,
      issueLabels: payload.issueLabels,
      issueAuthor: payload.issueAuthor,
    });
  } else if (item.operation === "update" && item.taskId) {
    await ctx.runMutation(internal.integrations.github.issueSyncMutations.updateTaskFromIssue, {
      taskId: item.taskId,
      issueTitle: payload.issueTitle,
      issueBody: payload.issueBody,
      issueLabels: payload.issueLabels,
    });
  } else if (item.operation === "close" && item.taskId) {
    await ctx.runMutation(internal.integrations.github.issueSyncMutations.closeTaskFromIssue, {
      taskId: item.taskId,
    });
  } else if (item.operation === "reopen" && item.taskId) {
    await ctx.runMutation(internal.integrations.github.issueSyncMutations.reopenTaskFromIssue, {
      taskId: item.taskId,
    });
  }
}

// Helper function to process LTF1 task to GitHub issue
async function processTaskToGitHub(ctx: any, item: any) {
  // Get the installation token for API calls
  const installation = await ctx.runQuery(internal.integrations.github.issueSyncMutations.getInstallationForRepo, {
    repositoryFullName: item.repositoryFullName,
  });

  if (!installation) {
    throw new Error(`No installation found for repository ${item.repositoryFullName}`);
  }

  const payload = item.payload;
  const [owner, repo] = item.repositoryFullName.split("/");

  if (item.operation === "create") {
    // Create GitHub issue from task
    const issueData = await createGitHubIssue(
      installation.installationId,
      owner,
      repo,
      payload.title,
      payload.description,
      payload.labels
    );

    // Update task with GitHub issue info
    if (issueData && item.taskId) {
      await ctx.runMutation(internal.integrations.github.issueSyncMutations.linkTaskToIssue, {
        taskId: item.taskId,
        repositoryFullName: item.repositoryFullName,
        issueNumber: issueData.number,
        issueUrl: issueData.html_url,
      });
    }
  } else if (item.operation === "update" && item.githubIssueNumber) {
    await updateGitHubIssue(
      installation.installationId,
      owner,
      repo,
      item.githubIssueNumber,
      payload.title,
      payload.description,
      payload.labels
    );
  } else if (item.operation === "close" && item.githubIssueNumber) {
    await closeGitHubIssue(
      installation.installationId,
      owner,
      repo,
      item.githubIssueNumber
    );
  } else if (item.operation === "reopen" && item.githubIssueNumber) {
    await reopenGitHubIssue(
      installation.installationId,
      owner,
      repo,
      item.githubIssueNumber
    );
  }
}

// GitHub API helper functions
async function getInstallationToken(installationId: number): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials not configured");
  }

  // Generate JWT for GitHub App authentication
  const jwt = await generateGitHubJWT(appId, privateKey);

  // Get installation access token
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
  // Use jose library for JWT generation (available in Node runtime)
  const jose = await import("jose");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // Issued 60 seconds ago
    exp: now + 600, // Expires in 10 minutes
    iss: appId,
  };

  const key = await jose.importPKCS8(privateKey, "RS256");
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(key);

  return jwt;
}

async function createGitHubIssue(
  installationId: number,
  owner: string,
  repo: string,
  title: string,
  body?: string,
  labels?: string[]
): Promise<{ number: number; html_url: string }> {
  const token = await getInstallationToken(installationId);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title,
        body: body || "",
        labels: labels || [],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create GitHub issue: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

async function updateGitHubIssue(
  installationId: number,
  owner: string,
  repo: string,
  issueNumber: number,
  title?: string,
  body?: string,
  labels?: string[]
): Promise<void> {
  const token = await getInstallationToken(installationId);

  const updatePayload: Record<string, any> = {};
  if (title) updatePayload.title = title;
  if (body !== undefined) updatePayload.body = body;
  if (labels) updatePayload.labels = labels;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update GitHub issue: ${response.statusText} - ${errorText}`);
  }
}

async function closeGitHubIssue(
  installationId: number,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<void> {
  const token = await getInstallationToken(installationId);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ state: "closed" }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to close GitHub issue: ${response.statusText}`);
  }
}

async function reopenGitHubIssue(
  installationId: number,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<void> {
  const token = await getInstallationToken(installationId);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ state: "open" }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to reopen GitHub issue: ${response.statusText}`);
  }
}
