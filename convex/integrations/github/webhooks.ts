import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { internalMutation, internalAction, internalQuery } from "../../_generated/server";

// Store webhook event for processing
export const storeWebhookEvent = internalMutation({
  args: {
    eventType: v.string(),
    deliveryId: v.string(),
    payload: v.any(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("githubWebhookEvents", {
      eventType: args.eventType,
      deliveryId: args.deliveryId,
      payload: args.payload,
      signature: args.signature,
      receivedAt: Date.now(),
      status: "pending",
    });

    // Schedule processing
    await ctx.scheduler.runAfter(0, internal.integrations.github.webhooks.processWebhookEvent, {
      eventId,
    });

    return eventId;
  },
});

// Process webhook event
export const processWebhookEvent = internalAction({
  args: {
    eventId: v.id("githubWebhookEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.runQuery(internal.integrations.github.webhooks.getWebhookEvent, {
      eventId: args.eventId,
    });

    if (!event || event.status !== "pending") {
      return;
    }

    try {
      switch (event.eventType) {
        case "installation":
          await handleInstallationEvent(ctx, event.payload);
          break;
        case "installation_repositories":
          await handleInstallationRepositoriesEvent(ctx, event.payload);
          break;
        case "push":
          await handlePushEvent(ctx, event.payload);
          break;
        case "pull_request":
          await handlePullRequestEvent(ctx, event.payload);
          break;
        case "pull_request_review":
          await handlePullRequestReviewEvent(ctx, event.payload);
          break;
        case "issues":
          await handleIssuesEvent(ctx, event.payload);
          break;
        case "issue_comment":
          await handleIssueCommentEvent(ctx, event.payload);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.eventType}`);
      }

      // Mark as processed
      await ctx.runMutation(internal.integrations.github.webhooks.updateWebhookEventStatus, {
        eventId: args.eventId,
        status: "processed",
      });
    } catch (error) {
      console.error(`Error processing webhook event: ${error}`);
      await ctx.runMutation(internal.integrations.github.webhooks.updateWebhookEventStatus, {
        eventId: args.eventId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
});

// Get webhook event
export const getWebhookEvent = internalQuery({
  args: {
    eventId: v.id("githubWebhookEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

// Update webhook event status
export const updateWebhookEventStatus = internalMutation({
  args: {
    eventId: v.id("githubWebhookEvents"),
    status: v.union(v.literal("pending"), v.literal("processed"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      status: args.status,
      processedAt: Date.now(),
      error: args.error,
    });
  },
});

// Handle installation events
async function handleInstallationEvent(ctx: any, payload: any) {
  const { action, installation, repositories } = payload;

  switch (action) {
    case "created":
      await ctx.runMutation(internal.integrations.github.app.storeInstallation, {
        installationId: installation.id,
        account: installation.account,
        targetType: installation.target_type,
        permissions: installation.permissions,
        events: installation.events,
        repositorySelection: installation.repository_selection,
        repositories: repositories,
      });
      break;
    case "deleted":
      await ctx.runMutation(internal.integrations.github.app.removeInstallation, {
        installationId: installation.id,
      });
      break;
    case "suspend":
      await ctx.runMutation(internal.integrations.github.app.suspendInstallation, {
        installationId: installation.id,
      });
      break;
    case "unsuspend":
      await ctx.runMutation(internal.integrations.github.app.unsuspendInstallation, {
        installationId: installation.id,
      });
      break;
  }
}

// Handle installation repositories events
async function handleInstallationRepositoriesEvent(ctx: any, payload: any) {
  const { action, installation, repositories_added, repositories_removed } = payload;

  if (action === "added" && repositories_added) {
    await ctx.runMutation(internal.integrations.github.app.addInstallationRepositories, {
      installationId: installation.id,
      repositories: repositories_added,
    });
  }

  if (action === "removed" && repositories_removed) {
    await ctx.runMutation(internal.integrations.github.app.removeInstallationRepositories, {
      installationId: installation.id,
      repositoryIds: repositories_removed.map((r: any) => r.id),
    });
  }
}

// Handle push events
async function handlePushEvent(ctx: any, payload: any) {
  const { repository, commits, ref, pusher } = payload;
  
  // Extract branch name from ref (refs/heads/branch-name)
  const branch = ref.replace("refs/heads/", "");

  // Process each commit
  for (const commit of commits) {
    // Extract task references from commit message
    const taskRefs = extractTaskReferences(commit.message);
    
    if (taskRefs.length > 0) {
      await ctx.runMutation(internal.integrations.github.mutations.linkCommitToTasks, {
        repositoryFullName: repository.full_name,
        commit: {
          sha: commit.id,
          message: commit.message,
          author: commit.author,
          timestamp: commit.timestamp,
          url: commit.url,
        },
        branch,
        taskRefs,
      });
    }
  }

  // Log activity
  await ctx.runMutation(internal.integrations.github.mutations.logGitHubActivity, {
    type: "push",
    repositoryFullName: repository.full_name,
    actor: pusher.name,
    metadata: {
      branch,
      commitCount: commits.length,
      commits: commits.map((c: any) => ({
        sha: c.id,
        message: c.message,
        author: c.author.name,
      })),
    },
  });
}

// Handle pull request events
async function handlePullRequestEvent(ctx: any, payload: any) {
  const { action, pull_request, repository } = payload;

  // Extract task references from PR title and body
  const taskRefs = [
    ...extractTaskReferences(pull_request.title),
    ...extractTaskReferences(pull_request.body || ""),
  ];

  if (taskRefs.length > 0) {
    await ctx.runMutation(internal.integrations.github.mutations.linkPullRequestToTasks, {
      repositoryFullName: repository.full_name,
      pullRequest: {
        number: pull_request.number,
        title: pull_request.title,
        state: pull_request.state,
        draft: pull_request.draft,
        url: pull_request.html_url,
        createdAt: pull_request.created_at,
        updatedAt: pull_request.updated_at,
        closedAt: pull_request.closed_at,
        mergedAt: pull_request.merged_at,
        author: pull_request.user.login,
      },
      taskRefs,
      action,
    });
  }

  // Log activity
  await ctx.runMutation(internal.integrations.github.mutations.logGitHubActivity, {
    type: "pull_request",
    repositoryFullName: repository.full_name,
    actor: pull_request.user.login,
    metadata: {
      action,
      number: pull_request.number,
      title: pull_request.title,
      state: pull_request.state,
    },
  });
}

// Handle pull request review events
async function handlePullRequestReviewEvent(ctx: any, payload: any) {
  const { action, review, pull_request, repository } = payload;

  await ctx.runMutation(internal.integrations.github.mutations.logGitHubActivity, {
    type: "pull_request_review",
    repositoryFullName: repository.full_name,
    actor: review.user.login,
    metadata: {
      action,
      pullRequestNumber: pull_request.number,
      reviewState: review.state,
      reviewBody: review.body,
    },
  });
}

// Handle issues events
async function handleIssuesEvent(ctx: any, payload: any) {
  const { action, issue, repository } = payload;

  // Extract task references from issue title and body
  const taskRefs = [
    ...extractTaskReferences(issue.title),
    ...extractTaskReferences(issue.body || ""),
  ];

  if (taskRefs.length > 0 || action === "opened") {
    await ctx.runMutation(internal.integrations.github.mutations.syncGitHubIssue, {
      repositoryFullName: repository.full_name,
      issue: {
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        labels: issue.labels.map((l: any) => l.name),
        assignees: issue.assignees.map((a: any) => a.login),
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
        author: issue.user.login,
      },
      action,
      taskRefs,
    });
  }
}

// Handle issue comment events
async function handleIssueCommentEvent(ctx: any, payload: any) {
  const { action, issue, comment, repository } = payload;

  // Extract task references from comment
  const taskRefs = extractTaskReferences(comment.body);

  if (taskRefs.length > 0) {
    await ctx.runMutation(internal.integrations.github.mutations.addGitHubComment, {
      repositoryFullName: repository.full_name,
      issueNumber: issue.number,
      comment: {
        id: comment.id,
        body: comment.body,
        author: comment.user.login,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      },
      taskRefs,
    });
  }
}

// Extract task references from text (e.g., WEB-123, PROJ-456)
function extractTaskReferences(text: string): string[] {
  const pattern = /\b([A-Z]{2,})-(\d+)\b/g;
  const matches = text.match(pattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}