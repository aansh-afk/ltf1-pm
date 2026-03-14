import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { clerkWebhook } from "./clerk";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: clerkWebhook,
});

// Polar.sh webhook handler for subscription billing events
http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.text();
      const signature = request.headers.get("webhook-id");
      const timestamp = request.headers.get("webhook-timestamp");
      const webhookSignature = request.headers.get("webhook-signature");

      if (!signature || !timestamp || !webhookSignature) {
        return new Response("Missing webhook headers", { status: 400 });
      }

      // Verify webhook signature using HMAC
      const secret = process.env.POLAR_WEBHOOK_SECRET;
      if (!secret) {
        console.error("[Polar Webhook] Webhook secret not configured");
        return new Response("Server configuration error", { status: 500 });
      }

      // Polar uses standard webhooks format: base64-decode the secret (strip "whsec_" prefix)
      const secretBytes = secret.startsWith("whsec_") ? secret.slice(6) : secret;

      const isValid = await ctx.runAction(
        internal.billing.webhookVerify.verifyPolarSignature,
        { payload, webhookId: signature, timestamp, signature: webhookSignature, secret: secretBytes },
      );

      if (!isValid) {
        console.error("[Polar Webhook] Invalid signature");
        return new Response("Invalid signature", { status: 401 });
      }

      const event = JSON.parse(payload);
      const eventType = event.type;

      console.log(`[Polar Webhook] Processing event: ${eventType}`);

      switch (eventType) {
        case "subscription.created": {
          const sub = event.data;
          const workspaceId = sub.metadata?.workspaceId;
          if (!workspaceId) {
            console.error("[Polar Webhook] No workspaceId in subscription metadata");
            break;
          }
          await ctx.runMutation(internal.billing.mutations.createSubscription, {
            workspaceId,
            polarCustomerId: sub.customer_id || sub.customer?.id || "",
            polarSubscriptionId: sub.id,
            status: mapPolarStatus(sub.status),
            plan: mapPolarPlan(sub),
            seatCount: sub.metadata?.seatCount ? Number(sub.metadata.seatCount) : 999,
            billingCycle: sub.recurring_interval === "year" ? "yearly" : "monthly",
            currentPeriodStart: new Date(sub.current_period_start).getTime(),
            currentPeriodEnd: new Date(sub.current_period_end).getTime(),
          });
          break;
        }

        case "subscription.updated": {
          const sub = event.data;
          await ctx.runMutation(internal.billing.mutations.updateSubscription, {
            polarSubscriptionId: sub.id,
            status: mapPolarStatus(sub.status),
            plan: mapPolarPlan(sub),
            seatCount: sub.metadata?.seatCount ? Number(sub.metadata.seatCount) : undefined,
            billingCycle: sub.recurring_interval === "year" ? "yearly" : "monthly",
            currentPeriodStart: sub.current_period_start
              ? new Date(sub.current_period_start).getTime()
              : undefined,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end).getTime()
              : undefined,
          });
          break;
        }

        case "subscription.canceled":
        case "subscription.cancelled": {
          const sub = event.data;
          await ctx.runMutation(internal.billing.mutations.cancelSubscription, {
            polarSubscriptionId: sub.id,
          });
          break;
        }

        case "order.created": {
          // Log order for auditing - no DB action needed for now
          console.log(`[Polar Webhook] Order created: ${event.data.id}`);
          break;
        }

        default:
          console.log(`[Polar Webhook] Unhandled event type: ${eventType}`);
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[Polar Webhook] Error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

function mapPolarStatus(status: string): "active" | "trialing" | "past_due" | "cancelled" | "incomplete" {
  const statusMap: Record<string, "active" | "trialing" | "past_due" | "cancelled" | "incomplete"> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    cancelled: "cancelled",
    incomplete: "incomplete",
    incomplete_expired: "incomplete",
    unpaid: "past_due",
  };
  return statusMap[status] ?? "incomplete";
}

function mapPolarPlan(sub: any): "free" | "pro" | "enterprise" {
  // Check metadata first, then try product name matching
  if (sub.metadata?.plan) {
    const plan = sub.metadata.plan;
    if (plan === "pro" || plan === "enterprise") return plan;
  }
  // Default to pro for any paid subscription
  return "pro";
}

// CLI token refresh endpoint — mints a fresh Convex JWT from a Clerk session
http.route({
  path: "/api/cli-refresh",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const sessionId = body?.sessionId;

      if (!sessionId || typeof sessionId !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing sessionId" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const result = await ctx.runAction(internal.cliRefresh.refreshToken, {
        sessionId,
      });

      if ("error" in result) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ token: result.token }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("CLI refresh error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }),
});

// GitHub webhook handler
http.route({
  path: "/api/github/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      console.log("[Webhook] Received GitHub webhook");

      // Get webhook payload
      const payload = await request.text();
      const signature = request.headers.get("x-hub-signature-256");
      const event = request.headers.get("x-github-event");

      console.log("[Webhook] Event type:", event);

      if (!signature || !event) {
        console.log("[Webhook] Missing headers - signature:", !!signature, "event:", !!event);
        return new Response("Missing required headers", { status: 400 });
      }

      // Verify webhook signature
      const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
      if (!secret) {
        console.error("[Webhook] GitHub webhook secret not configured");
        return new Response("Server configuration error", { status: 500 });
      }

      console.log("[Webhook] Verifying signature...");

      const isValid = await ctx.runAction(internal.integrations.github.nodeActions.verifyWebhookSignature, {
        payload,
        signature,
        secret,
      });

      if (!isValid) {
        console.log("[Webhook] Invalid signature");
        return new Response("Invalid signature", { status: 401 });
      }

      console.log("[Webhook] Signature valid, parsing payload...");

      // Parse payload
      const data = JSON.parse(payload);

      console.log("[Webhook] Handling event:", event);

      // Handle different webhook events
      switch (event) {
        case "installation":
          console.log("[Webhook] Processing installation event, action:", data.action);
          await handleInstallationEvent(ctx, data);
          console.log("[Webhook] Installation event processed successfully");
          break;

        case "installation_repositories":
          await handleInstallationRepositoriesEvent(ctx, data);
          break;

        case "push":
          await handlePushEvent(ctx, data);
          break;

        case "pull_request":
          await handlePullRequestEvent(ctx, data);
          break;

        case "issues":
          await handleIssuesEvent(ctx, data);
          break;

        case "issue_comment":
          await handleIssueCommentEvent(ctx, data);
          break;

        case "pull_request_review_comment":
          await handlePullRequestReviewCommentEvent(ctx, data);
          break;

        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error handling GitHub webhook:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

// Handler functions for different webhook events

async function handleInstallationEvent(ctx: any, data: any) {
  const { action, installation, repositories } = data;

  switch (action) {
    case "created":
      // Store new installation
      await ctx.runMutation(internal.integrations.github.appSimple.storeInstallation, {
        installationId: installation.id,
        account: {
          type: installation.account.type,
          login: installation.account.login,
          id: installation.account.id,
        },
        targetType: installation.target_type,
        permissions: installation.permissions,
        events: installation.events,
        repositorySelection: installation.repository_selection,
        repositories: repositories?.map((repo: any) => ({
          id: repo.id,
          nodeId: repo.node_id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
        })),
      });
      break;

    case "deleted":
      await ctx.runMutation(internal.integrations.github.appSimple.removeInstallation, {
        installationId: installation.id,
      });
      break;

    case "suspend":
      await ctx.runMutation(internal.integrations.github.appSimple.suspendInstallation, {
        installationId: installation.id,
      });
      break;

    case "unsuspend":
      await ctx.runMutation(internal.integrations.github.appSimple.unsuspendInstallation, {
        installationId: installation.id,
      });
      break;
  }
}

async function handleInstallationRepositoriesEvent(ctx: any, data: any) {
  const { action, installation, repositories_added, repositories_removed } = data;

  if (action === "added" && repositories_added) {
    await ctx.runMutation(internal.integrations.github.appSimple.addInstallationRepositories, {
      installationId: installation.id,
      repositories: repositories_added.map((repo: any) => ({
        id: repo.id,
        nodeId: repo.node_id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
      })),
    });
  }

  if (action === "removed" && repositories_removed) {
    await ctx.runMutation(internal.integrations.github.appSimple.removeInstallationRepositories, {
      installationId: installation.id,
      repositoryIds: repositories_removed.map((repo: any) => repo.id),
    });
  }
}

async function handlePushEvent(ctx: any, data: any) {
  const { repository, commits, ref, pusher } = data;

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
          author: {
            name: commit.author.name,
            email: commit.author.email,
          },
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
      message: `Pushed ${commits.length} commit${commits.length !== 1 ? 's' : ''} to ${branch}`,
    },
  });
}

async function handlePullRequestEvent(ctx: any, data: any) {
  const { action, pull_request, repository } = data;

  // Extract task references from PR title and body
  const taskRefs = [
    ...extractTaskReferences(pull_request.title),
    ...extractTaskReferences(pull_request.body || ""),
  ];

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
    taskRefs: [...new Set(taskRefs)], // Remove duplicates
    action,
  });

  // Log activity
  await ctx.runMutation(internal.integrations.github.mutations.logGitHubActivity, {
    type: `pr_${action}`,
    repositoryFullName: repository.full_name,
    actor: pull_request.user.login,
    metadata: {
      prNumber: pull_request.number,
      prTitle: pull_request.title,
      taskRefs,
    },
  });
}

async function handleIssuesEvent(ctx: any, data: any) {
  const { action, issue, repository } = data;

  // Extract task references from issue title and body
  const taskRefs = [
    ...extractTaskReferences(issue.title),
    ...extractTaskReferences(issue.body || ""),
  ];

  await ctx.runMutation(internal.integrations.github.mutations.syncGitHubIssue, {
    repositoryFullName: repository.full_name,
    issue: {
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels.map((label: any) => label.name),
      assignees: issue.assignees.map((assignee: any) => assignee.login),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      author: issue.user.login,
    },
    action,
    taskRefs: [...new Set(taskRefs)],
  });
}

async function handleIssueCommentEvent(ctx: any, data: any) {
  const { action, issue, comment, repository } = data;

  if (action === "created") {
    // Extract task references from comment body
    const taskRefs = extractTaskReferences(comment.body);

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

    // Also sync comment to linked tasks via commentSync
    // Determine if this is on a PR (issues with pull_request key) or a plain issue
    const isPR = !!issue.pull_request;
    await ctx.runMutation(internal.integrations.github.commentSync.syncPRCommentToTask, {
      repositoryFullName: repository.full_name,
      prNumber: isPR ? issue.number : undefined,
      issueNumber: issue.number,
      commentBody: comment.body,
      authorLogin: comment.user.login,
      commentUrl: comment.html_url,
      githubCommentId: comment.id,
      commentType: "issue_comment",
    });
  }
}

async function handlePullRequestReviewCommentEvent(ctx: any, data: any) {
  const { action, pull_request, comment, repository } = data;

  if (action === "created") {
    // Sync PR review comment to linked tasks
    await ctx.runMutation(internal.integrations.github.commentSync.syncPRCommentToTask, {
      repositoryFullName: repository.full_name,
      prNumber: pull_request.number,
      issueNumber: undefined,
      commentBody: comment.body,
      authorLogin: comment.user.login,
      commentUrl: comment.html_url,
      githubCommentId: comment.id,
      commentType: "pr_review_comment",
    });

    // Log GitHub activity
    await ctx.runMutation(internal.integrations.github.mutations.logGitHubActivity, {
      type: "pr_review_comment",
      repositoryFullName: repository.full_name,
      actor: comment.user.login,
      metadata: {
        prNumber: pull_request.number,
        prTitle: pull_request.title,
        commentId: comment.id,
        body: comment.body.substring(0, 500),
      },
    });
  }
}

// Helper function to extract task references from text
function extractTaskReferences(text: string): string[] {
  const taskRefs: string[] = [];
  const regex = /\b([A-Z]{2,})-(\d+)\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    taskRefs.push(match[0]);
  }

  return taskRefs;
}

export default http;