import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";

// Connect a GitHub repository to a project
export const connectRepositoryToProject = mutation({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.id("githubRepositories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check project permissions
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => 
        q.eq("projectId", args.projectId).eq("userId", user._id)
      )
      .first();

    if (!member || member.role === "viewer") {
      throw new Error("Insufficient permissions");
    }

    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) throw new Error("Repository not found");

    // Update project with repository information
    await ctx.db.patch(args.projectId, {
      repository: {
        provider: "github",
        url: `https://github.com/${repository.fullName}`,
        defaultBranch: repository.defaultBranch,
      },
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "project_updated",
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "project",
      targetId: args.projectId,
      targetName: project.name,
      description: `connected GitHub repository ${repository.fullName} to project`,
      metadata: {
        extra: { 
          repositoryFullName: repository.fullName,
          repositoryId: repository._id,
        }
      }
    });

    return { success: true };
  },
});

// Sync GitHub repository data
export const syncRepository = mutation({
  args: {
    repositoryId: v.id("githubRepositories"),
  },
  handler: async (ctx, args) => {
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) throw new Error("Repository not found");

    // Schedule sync action
    await ctx.scheduler.runAfter(0, internal.integrations.github.syncActions.performRepositorySync, {
      repositoryId: args.repositoryId,
      installationId: repository.installationId,
    });

    return { scheduled: true };
  },
});

// Update repository data
export const updateRepositoryData = internalMutation({
  args: {
    repositoryId: v.id("githubRepositories"),
    data: v.object({
      description: v.optional(v.string()),
      defaultBranch: v.string(),
      language: v.optional(v.string()),
      topics: v.array(v.string()),
      stargazersCount: v.number(),
      forksCount: v.number(),
      openIssuesCount: v.number(),
      updatedAt: v.string(),
      pushedAt: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.repositoryId, {
      ...args.data,
      syncedAt: Date.now(),
    });
  },
});

// Link commit to tasks
export const linkCommitToTasks = internalMutation({
  args: {
    repositoryFullName: v.string(),
    commit: v.object({
      sha: v.string(),
      message: v.string(),
      author: v.object({
        name: v.string(),
        email: v.string(),
      }),
      timestamp: v.string(),
      url: v.string(),
    }),
    branch: v.string(),
    taskRefs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Store commit
    const commitId = await ctx.db.insert("githubCommits", {
      repositoryFullName: args.repositoryFullName,
      sha: args.commit.sha,
      message: args.commit.message,
      author: args.commit.author,
      timestamp: args.commit.timestamp,
      url: args.commit.url,
      branch: args.branch,
      linkedTaskKeys: args.taskRefs,
      createdAt: Date.now(),
    });

    // Find and update tasks
    for (const taskRef of args.taskRefs) {
      const [projectKey, taskNumber] = taskRef.split("-");
      
      const project = await ctx.db
        .query("projects")
        .withIndex("by_key", (q) => q.eq("key", projectKey))
        .first();

      if (project) {
        const task = await ctx.db
          .query("tasks")
          .withIndex("by_project_number", (q) => 
            q.eq("projectId", project._id).eq("number", parseInt(taskNumber))
          )
          .first();

        if (task) {
          const currentCommits = task.git?.commits || [];
          if (!currentCommits.includes(args.commit.sha)) {
            await ctx.db.patch(task._id, {
              git: {
                ...task.git,
                branch: args.branch,
                commits: [...currentCommits, args.commit.sha],
              },
              updatedAt: Date.now(),
            });
          }

          // Note: We can't get actorId in webhook context, would need to map GitHub user to LTF1 user
          // For now, skipping activity logging until we implement user mapping
        }
      }
    }
  },
});

// Link pull request to tasks
export const linkPullRequestToTasks = internalMutation({
  args: {
    repositoryFullName: v.string(),
    pullRequest: v.object({
      number: v.number(),
      title: v.string(),
      state: v.string(),
      draft: v.boolean(),
      url: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
      closedAt: v.optional(v.string()),
      mergedAt: v.optional(v.string()),
      author: v.string(),
    }),
    taskRefs: v.array(v.string()),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    // Store or update pull request
    const existing = await ctx.db
      .query("githubPullRequests")
      .withIndex("by_repository_number", (q) => 
        q.eq("repositoryFullName", args.repositoryFullName)
         .eq("number", args.pullRequest.number)
      )
      .first();

    const pullRequestId = existing
      ? await ctx.db.patch(existing._id, {
          ...args.pullRequest,
          linkedTaskKeys: args.taskRefs,
          updatedAt: args.pullRequest.updatedAt,
        })
      : await ctx.db.insert("githubPullRequests", {
          repositoryFullName: args.repositoryFullName,
          ...args.pullRequest,
          linkedTaskKeys: args.taskRefs,
        });

    // Update tasks
    for (const taskRef of args.taskRefs) {
      const [projectKey, taskNumber] = taskRef.split("-");
      
      const project = await ctx.db
        .query("projects")
        .withIndex("by_key", (q) => q.eq("key", projectKey))
        .first();

      if (project) {
        const task = await ctx.db
          .query("tasks")
          .withIndex("by_project_number", (q) => 
            q.eq("projectId", project._id).eq("number", parseInt(taskNumber))
          )
          .first();

        if (task) {
          await ctx.db.patch(task._id, {
            git: {
              branch: task.git?.branch || "main",
              commits: task.git?.commits || [],
              pullRequestUrl: args.pullRequest.url,
              pullRequestStatus: args.pullRequest.state as "open" | "merged" | "closed",
            },
            updatedAt: Date.now(),
          });

          // Update task status based on PR action
          if (args.action === "closed" && args.pullRequest.mergedAt) {
            await ctx.db.patch(task._id, {
              status: "done",
              completedAt: Date.now(),
            });
          }
        }
      }
    }
  },
});

// Log GitHub activity
export const logGitHubActivity = internalMutation({
  args: {
    type: v.string(),
    repositoryFullName: v.string(),
    actor: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("githubActivities", {
      type: args.type,
      repositoryFullName: args.repositoryFullName,
      actor: args.actor,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

// Store commit
export const storeCommit = internalMutation({
  args: {
    repositoryFullName: v.string(),
    commit: v.object({
      sha: v.string(),
      message: v.string(),
      author: v.object({
        name: v.string(),
        email: v.string(),
        date: v.string(),
      }),
      url: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Check if commit already exists
    const existing = await ctx.db
      .query("githubCommits")
      .withIndex("by_sha", (q) => q.eq("sha", args.commit.sha))
      .first();

    if (!existing) {
      await ctx.db.insert("githubCommits", {
        repositoryFullName: args.repositoryFullName,
        sha: args.commit.sha,
        message: args.commit.message,
        author: args.commit.author,
        timestamp: args.commit.author.date,
        url: args.commit.url,
        branch: "main", // Will be updated by push events
        linkedTaskKeys: [],
        createdAt: Date.now(),
      });
    }
  },
});
// Sync GitHub issue to LTF1
export const syncGitHubIssue = internalMutation({
  args: {
    repositoryFullName: v.string(),
    issue: v.object({
      number: v.number(),
      title: v.string(),
      body: v.optional(v.string()),
      state: v.string(),
      labels: v.array(v.string()),
      assignees: v.array(v.string()),
      createdAt: v.string(),
      updatedAt: v.string(),
      closedAt: v.optional(v.string()),
      author: v.string(),
    }),
    action: v.string(),
    taskRefs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Store or update issue
    const existing = await ctx.db
      .query("githubIssues")
      .withIndex("by_repository_number", (q) => 
        q.eq("repositoryFullName", args.repositoryFullName)
         .eq("number", args.issue.number)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.issue,
        updatedAt: args.issue.updatedAt,
      });
    } else {
      await ctx.db.insert("githubIssues", {
        repositoryFullName: args.repositoryFullName,
        ...args.issue,
      });
    }

    // Optionally create task if configured
    if (args.action === "opened" && !existing) {
      // This could be expanded to auto-create tasks from issues
      // For now, just log the activity
    }
  },
});

// Add GitHub comment
export const addGitHubComment = internalMutation({
  args: {
    repositoryFullName: v.string(),
    issueNumber: v.number(),
    comment: v.object({
      id: v.number(),
      body: v.string(),
      author: v.string(),
      createdAt: v.string(),
      updatedAt: v.optional(v.string()),
    }),
    taskRefs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Log the comment activity
    await ctx.runMutation(internal.integrations.github.mutations.logGitHubActivity, {
      type: "issue_comment",
      repositoryFullName: args.repositoryFullName,
      actor: args.comment.author,
      metadata: {
        issueNumber: args.issueNumber,
        commentId: args.comment.id,
        body: args.comment.body,
        taskRefs: args.taskRefs,
      },
    });
  },
});
