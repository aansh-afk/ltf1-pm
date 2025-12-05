import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";

// Connect a GitHub repository to a project
export const connectRepositoryToProject = mutation({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.id("githubRepositories"),
  },
  returns: v.object({ success: v.boolean() }),
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
  returns: v.object({ scheduled: v.boolean() }),
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.repositoryId, {
      ...args.data,
      syncedAt: Date.now(),
    });
    return null;
  },
});

// Helper function to resolve GitHub user to LTF1 user
async function resolveGitHubUserInWorkspace(
  ctx: any,
  workspaceId: any,
  githubUsername: string,
  githubEmail?: string
): Promise<{ userId: any; verified: boolean } | null> {
  // First try by username
  const mapping = await ctx.db
    .query("githubUserMappings")
    .withIndex("by_workspace_username", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("githubUsername", githubUsername)
    )
    .first();

  if (mapping) {
    return { userId: mapping.userId, verified: mapping.verified };
  }

  // Try by email if provided
  if (githubEmail) {
    const mappingsByWorkspace = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();

    const emailMapping = mappingsByWorkspace.find(
      (m: any) => m.githubEmail?.toLowerCase() === githubEmail.toLowerCase()
    );

    if (emailMapping) {
      return { userId: emailMapping.userId, verified: emailMapping.verified };
    }

    // Try to match by email in users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", githubEmail.toLowerCase()))
      .first();

    if (user) {
      return { userId: user._id, verified: false };
    }
  }

  return null;
}

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
  returns: v.null(),
  handler: async (ctx, args) => {
    // Store commit
    await ctx.db.insert("githubCommits", {
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

          // Resolve GitHub user to LTF1 user for activity logging
          const resolvedUser = await resolveGitHubUserInWorkspace(
            ctx,
            project.workspaceId,
            args.commit.author.name,
            args.commit.author.email
          );

          // Log activity with resolved user
          await ctx.runMutation(internal.activities.mutations.logActivity, {
            type: "task_updated",
            projectId: project._id,
            workspaceId: project.workspaceId,
            actorId: resolvedUser?.userId || null,
            actorName: resolvedUser?.userId
              ? undefined
              : `${args.commit.author.name} (GitHub)`,
            targetType: "task",
            targetId: task._id,
            targetName: `${projectKey}-${taskNumber}`,
            description: `pushed commit ${args.commit.sha.substring(0, 7)} linked to task`,
            metadata: {
              extra: {
                commitSha: args.commit.sha,
                commitMessage: args.commit.message,
                branch: args.branch,
                githubAuthor: args.commit.author.name,
                resolvedUser: resolvedUser?.verified ? "verified" : resolvedUser?.userId ? "inferred" : "unknown",
              }
            }
          });
        }
      }
    }
    return null;
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
  returns: v.null(),
  handler: async (ctx, args) => {
    // Store or update pull request
    const existing = await ctx.db
      .query("githubPullRequests")
      .withIndex("by_repository_number", (q) =>
        q.eq("repositoryFullName", args.repositoryFullName)
          .eq("number", args.pullRequest.number)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.pullRequest,
        linkedTaskKeys: args.taskRefs,
        updatedAt: args.pullRequest.updatedAt,
      });
    } else {
      await ctx.db.insert("githubPullRequests", {
        repositoryFullName: args.repositoryFullName,
        ...args.pullRequest,
        linkedTaskKeys: args.taskRefs,
      });
    }

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
          // Determine PR status for task
          let prStatus: "open" | "merged" | "closed" = "open";
          if (args.pullRequest.mergedAt) {
            prStatus = "merged";
          } else if (args.pullRequest.state === "closed") {
            prStatus = "closed";
          }

          await ctx.db.patch(task._id, {
            git: {
              branch: task.git?.branch || "main",
              commits: task.git?.commits || [],
              pullRequestUrl: args.pullRequest.url,
              pullRequestStatus: prStatus,
            },
            updatedAt: Date.now(),
          });

          // Resolve GitHub user to LTF1 user for activity logging
          const resolvedUser = await resolveGitHubUserInWorkspace(
            ctx,
            project.workspaceId,
            args.pullRequest.author,
            undefined
          );

          // Get action description
          let actionDescription = `${args.action} pull request #${args.pullRequest.number}`;
          if (args.action === "closed" && args.pullRequest.mergedAt) {
            actionDescription = `merged pull request #${args.pullRequest.number}`;
            // Update task status to done on merge
            await ctx.db.patch(task._id, {
              status: "done",
              completedAt: Date.now(),
            });
          }

          // Log activity with resolved user
          await ctx.runMutation(internal.activities.mutations.logActivity, {
            type: args.action === "closed" && args.pullRequest.mergedAt ? "task_completed" : "task_updated",
            projectId: project._id,
            workspaceId: project.workspaceId,
            actorId: resolvedUser?.userId || null,
            actorName: resolvedUser?.userId
              ? undefined
              : `${args.pullRequest.author} (GitHub)`,
            targetType: "task",
            targetId: task._id,
            targetName: `${projectKey}-${taskNumber}`,
            description: actionDescription,
            metadata: {
              extra: {
                prNumber: args.pullRequest.number,
                prTitle: args.pullRequest.title,
                prUrl: args.pullRequest.url,
                prState: args.pullRequest.state,
                action: args.action,
                githubAuthor: args.pullRequest.author,
                resolvedUser: resolvedUser?.verified ? "verified" : resolvedUser?.userId ? "inferred" : "unknown",
              }
            }
          });
        }
      }
    }
    return null;
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("githubActivities", {
      type: args.type,
      repositoryFullName: args.repositoryFullName,
      actor: args.actor,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
    return null;
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
  returns: v.null(),
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
    return null;
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
  returns: v.null(),
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
      });
    } else {
      await ctx.db.insert("githubIssues", {
        repositoryFullName: args.repositoryFullName,
        ...args.issue,
      });
    }

    // Find projects that have this repository connected for sync
    const projects = await ctx.db
      .query("projects")
      .collect();

    const linkedProject = projects.find(
      (p) => p.repository?.url === `https://github.com/${args.repositoryFullName}`
    );

    if (!linkedProject) {
      return null; // No project linked to this repo
    }

    // Check if there's an existing task linked to this issue
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", linkedProject._id))
      .collect();

    const linkedTask = tasks.find(
      (t) => t.githubIssue?.issueNumber === args.issue.number &&
        t.githubIssue?.repositoryFullName === args.repositoryFullName
    );

    // Queue sync operations based on action
    if (args.action === "opened" && !existing) {
      // New issue - queue for task creation
      await ctx.db.insert("githubIssueSyncQueue", {
        workspaceId: linkedProject.workspaceId,
        direction: "from_github" as const,
        repositoryFullName: args.repositoryFullName,
        githubIssueNumber: args.issue.number,
        operation: "create" as const,
        status: "pending" as const,
        retryCount: 0,
        createdAt: Date.now(),
        payload: {
          issueTitle: args.issue.title,
          issueBody: args.issue.body,
          issueLabels: args.issue.labels,
          issueAuthor: args.issue.author,
        },
      });
    } else if (args.action === "edited" && linkedTask) {
      // Issue edited - queue for task update
      await ctx.db.insert("githubIssueSyncQueue", {
        workspaceId: linkedProject.workspaceId,
        direction: "from_github" as const,
        taskId: linkedTask._id,
        repositoryFullName: args.repositoryFullName,
        githubIssueNumber: args.issue.number,
        operation: "update" as const,
        status: "pending" as const,
        retryCount: 0,
        createdAt: Date.now(),
        payload: {
          issueTitle: args.issue.title,
          issueBody: args.issue.body,
          issueLabels: args.issue.labels,
          issueAuthor: args.issue.author,
        },
      });
    } else if (args.action === "closed" && linkedTask) {
      // Issue closed - queue for task close
      await ctx.db.insert("githubIssueSyncQueue", {
        workspaceId: linkedProject.workspaceId,
        direction: "from_github" as const,
        taskId: linkedTask._id,
        repositoryFullName: args.repositoryFullName,
        githubIssueNumber: args.issue.number,
        operation: "close" as const,
        status: "pending" as const,
        retryCount: 0,
        createdAt: Date.now(),
        payload: {
          issueTitle: args.issue.title,
          issueBody: args.issue.body,
          issueLabels: args.issue.labels,
          issueAuthor: args.issue.author,
        },
      });
    } else if (args.action === "reopened" && linkedTask) {
      // Issue reopened - queue for task reopen
      await ctx.db.insert("githubIssueSyncQueue", {
        workspaceId: linkedProject.workspaceId,
        direction: "from_github" as const,
        taskId: linkedTask._id,
        repositoryFullName: args.repositoryFullName,
        githubIssueNumber: args.issue.number,
        operation: "reopen" as const,
        status: "pending" as const,
        retryCount: 0,
        createdAt: Date.now(),
        payload: {
          issueTitle: args.issue.title,
          issueBody: args.issue.body,
          issueLabels: args.issue.labels,
          issueAuthor: args.issue.author,
        },
      });
    } else if (args.action === "labeled" || args.action === "unlabeled") {
      // Labels changed - treat as update if task exists
      if (linkedTask) {
        await ctx.db.insert("githubIssueSyncQueue", {
          workspaceId: linkedProject.workspaceId,
          direction: "from_github" as const,
          taskId: linkedTask._id,
          repositoryFullName: args.repositoryFullName,
          githubIssueNumber: args.issue.number,
          operation: "update" as const,
          status: "pending" as const,
          retryCount: 0,
          createdAt: Date.now(),
          payload: {
            issueTitle: args.issue.title,
            issueBody: args.issue.body,
            issueLabels: args.issue.labels,
            issueAuthor: args.issue.author,
          },
        });
      }
    }
    return null;
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
  returns: v.null(),
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
    return null;
  },
});
