import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";

// Store push event
export const storePushEvent = internalMutation({
  args: {
    repository: v.string(),
    ref: v.string(),
    commits: v.array(v.object({
      id: v.string(),
      message: v.string(),
      author: v.string(),
      timestamp: v.string(),
      url: v.string(),
    })),
    pusher: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Store in webhookEvents table
    await ctx.db.insert("webhookEvents", {
      type: "push",
      repository: args.repository,
      data: args,
      createdAt: args.createdAt,
    });

    // Extract branch name
    const branch = args.ref.replace("refs/heads/", "");
    
    // Log activity
    console.log(`Push to ${args.repository}/${branch}: ${args.commits.length} commits by ${args.pusher}`);
  },
});

// Store pull request event
export const storePullRequestEvent = internalMutation({
  args: {
    repository: v.string(),
    action: v.string(),
    pullRequest: v.object({
      id: v.number(),
      number: v.number(),
      title: v.string(),
      state: v.string(),
      user: v.string(),
      htmlUrl: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "pull_request",
      repository: args.repository,
      data: args,
      createdAt: Date.now(),
    });

    console.log(`PR ${args.action} in ${args.repository}: #${args.pullRequest.number} - ${args.pullRequest.title}`);
  },
});

// Store issue event
export const storeIssueEvent = internalMutation({
  args: {
    repository: v.string(),
    action: v.string(),
    issue: v.object({
      id: v.number(),
      number: v.number(),
      title: v.string(),
      state: v.string(),
      user: v.string(),
      htmlUrl: v.string(),
      labels: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "issue",
      repository: args.repository,
      data: args,
      createdAt: Date.now(),
    });

    console.log(`Issue ${args.action} in ${args.repository}: #${args.issue.number} - ${args.issue.title}`);
  },
});

// Store comment event
export const storeCommentEvent = internalMutation({
  args: {
    repository: v.string(),
    action: v.string(),
    issueNumber: v.number(),
    comment: v.object({
      id: v.number(),
      body: v.string(),
      user: v.string(),
      htmlUrl: v.string(),
      createdAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "issue_comment",
      repository: args.repository,
      data: args,
      createdAt: Date.now(),
    });

    console.log(`Comment ${args.action} on issue #${args.issueNumber} in ${args.repository}`);
  },
});

// Store review event
export const storeReviewEvent = internalMutation({
  args: {
    repository: v.string(),
    action: v.string(),
    pullRequestNumber: v.number(),
    review: v.object({
      id: v.number(),
      state: v.string(),
      user: v.string(),
      body: v.optional(v.string()),
      htmlUrl: v.string(),
      submittedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "pull_request_review",
      repository: args.repository,
      data: args,
      createdAt: Date.now(),
    });

    console.log(`PR review ${args.review.state} on #${args.pullRequestNumber} in ${args.repository} by ${args.review.user}`);
  },
});

// Store repository event
export const storeRepositoryEvent = internalMutation({
  args: {
    action: v.string(),
    repository: v.object({
      id: v.number(),
      name: v.string(),
      fullName: v.string(),
      private: v.boolean(),
      description: v.optional(v.string()),
      htmlUrl: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "repository",
      repository: args.repository.fullName,
      data: args,
      createdAt: Date.now(),
    });

    console.log(`Repository ${args.action}: ${args.repository.fullName}`);
  },
});

// Store star event
export const storeStarEvent = internalMutation({
  args: {
    action: v.string(),
    repository: v.string(),
    user: v.string(),
    starredAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "star",
      repository: args.repository,
      data: args,
      createdAt: Date.now(),
    });

    const action = args.action === "created" ? "starred" : "unstarred";
    console.log(`${args.user} ${action} ${args.repository}`);
  },
});

// Store fork event
export const storeForkEvent = internalMutation({
  args: {
    repository: v.string(),
    forkee: v.object({
      id: v.number(),
      name: v.string(),
      fullName: v.string(),
      owner: v.string(),
      htmlUrl: v.string(),
    }),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "fork",
      repository: args.repository,
      data: args,
      createdAt: args.createdAt,
    });

    console.log(`${args.forkee.owner} forked ${args.repository} as ${args.forkee.fullName}`);
  },
});

// Store workflow event
export const storeWorkflowEvent = internalMutation({
  args: {
    repository: v.string(),
    action: v.string(),
    workflow: v.object({
      id: v.number(),
      name: v.string(),
      status: v.string(),
      conclusion: v.union(v.string(), v.null()),
      htmlUrl: v.string(),
      runNumber: v.number(),
      runStartedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "workflow_run",
      repository: args.repository,
      data: args,
      createdAt: Date.now(),
    });

    const status = args.workflow.conclusion || args.workflow.status;
    console.log(`Workflow "${args.workflow.name}" ${status} in ${args.repository} (run #${args.workflow.runNumber})`);
  },
});

// Store release event
export const storeReleaseEvent = internalMutation({
  args: {
    repository: v.string(),
    action: v.string(),
    release: v.object({
      id: v.number(),
      tagName: v.string(),
      name: v.optional(v.string()),
      body: v.optional(v.string()),
      draft: v.boolean(),
      prerelease: v.boolean(),
      htmlUrl: v.string(),
      publishedAt: v.union(v.number(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "release",
      repository: args.repository,
      data: args,
      createdAt: Date.now(),
    });

    console.log(`Release ${args.action}: ${args.release.tagName} in ${args.repository}`);
  },
});

// Store installation event
export const storeInstallationEvent = internalMutation({
  args: {
    action: v.string(),
    installation: v.object({
      id: v.number(),
      account: v.string(),
      accountType: v.string(),
      repositorySelection: v.string(),
      createdAt: v.number(),
    }),
    repositories: v.array(v.object({
      id: v.number(),
      name: v.string(),
      fullName: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      type: "installation",
      repository: args.installation.account,
      data: args,
      createdAt: Date.now(),
    });

    // Store installation info
    if (args.action === "created") {
      await ctx.db.insert("githubInstallations", {
        installationId: args.installation.id,
        accountName: args.installation.account,
        accountType: args.installation.accountType as "user" | "organization",
        accountId: 0, // This would need to come from the webhook payload
        targetType: args.installation.accountType as "user" | "organization",
        permissions: {},
        events: [],
        repositorySelection: args.installation.repositorySelection as "all" | "selected",
        installedAt: args.installation.createdAt,
        updatedAt: Date.now(),
      });
    } else if (args.action === "deleted") {
      // Remove installation
      const installation = await ctx.db
        .query("githubInstallations")
        .withIndex("by_installation_id", (q) => q.eq("installationId", args.installation.id))
        .first();
      
      if (installation) {
        await ctx.db.delete(installation._id);
      }
    }

    console.log(`GitHub App ${args.action} for ${args.installation.account} (${args.repositories.length} repositories)`);
  },
});