import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";

/**
 * Check if a GitHub comment has already been synced to avoid duplicates.
 */
export const isCommentAlreadySynced = internalQuery({
  args: {
    githubCommentId: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check activities table for an existing synced comment with this GitHub ID.
    // We store the githubCommentId in metadata.extra.githubCommentId.
    // Since activities uses v.any() for metadata, we query by type and scan.
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_type", (q) => q.eq("type", "task_commented"))
      .order("desc")
      .take(500);

    return recentActivities.some(
      (a) => a.metadata?.extra?.githubCommentId === args.githubCommentId
    );
  },
});

/**
 * Sync a PR review comment or issue comment from GitHub to linked tasks.
 *
 * Creates an activity entry on each linked task so the comment appears
 * in the task's activity feed, marked as a GitHub-synced comment.
 */
export const syncPRCommentToTask = internalMutation({
  args: {
    repositoryFullName: v.string(),
    prNumber: v.optional(v.number()),
    issueNumber: v.optional(v.number()),
    commentBody: v.string(),
    authorLogin: v.string(),
    commentUrl: v.string(),
    githubCommentId: v.number(),
    commentType: v.union(
      v.literal("pr_review_comment"),
      v.literal("issue_comment")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Step 1: Find linked task keys from the PR or issue.
    const linkedTaskKeys: Array<string> = [];

    if (args.prNumber !== undefined) {
      const pr = await ctx.db
        .query("githubPullRequests")
        .withIndex("by_repository_number", (q) =>
          q
            .eq("repositoryFullName", args.repositoryFullName)
            .eq("number", args.prNumber as number)
        )
        .first();

      if (pr && pr.linkedTaskKeys) {
        for (const key of pr.linkedTaskKeys) {
          linkedTaskKeys.push(key);
        }
      }
    }

    if (args.issueNumber !== undefined) {
      const issue = await ctx.db
        .query("githubIssues")
        .withIndex("by_repository_number", (q) =>
          q
            .eq("repositoryFullName", args.repositoryFullName)
            .eq("number", args.issueNumber as number)
        )
        .first();

      if (issue && issue.linkedTaskId) {
        // For issues, we have a direct task link — find the task key
        const task = await ctx.db.get(issue.linkedTaskId);
        if (task) {
          const project = await ctx.db.get(task.projectId);
          if (project) {
            linkedTaskKeys.push(`${project.key}-${task.number}`);
          }
        }
      }
    }

    // Also extract task refs from the comment body itself
    const bodyRefs = extractTaskReferences(args.commentBody);
    for (const ref of bodyRefs) {
      if (!linkedTaskKeys.includes(ref)) {
        linkedTaskKeys.push(ref);
      }
    }

    if (linkedTaskKeys.length === 0) {
      // No linked tasks found — log the activity generically and return
      await ctx.runMutation(
        internal.integrations.github.mutations.logGitHubActivity,
        {
          type: args.commentType,
          repositoryFullName: args.repositoryFullName,
          actor: args.authorLogin,
          metadata: {
            prNumber: args.prNumber,
            issueNumber: args.issueNumber,
            githubCommentId: args.githubCommentId,
            commentUrl: args.commentUrl,
            body: args.commentBody.substring(0, 500),
          },
        }
      );
      return null;
    }

    // Step 2: For each linked task, create an activity entry.
    for (const taskRef of linkedTaskKeys) {
      const [projectKey, taskNumberStr] = taskRef.split("-");
      if (!projectKey || !taskNumberStr) continue;

      const taskNumber = parseInt(taskNumberStr, 10);
      if (isNaN(taskNumber)) continue;

      const project = await ctx.db
        .query("projects")
        .withIndex("by_key", (q) => q.eq("key", projectKey))
        .first();

      if (!project) continue;

      const task = await ctx.db
        .query("tasks")
        .withIndex("by_project_number", (q) =>
          q.eq("projectId", project._id).eq("number", taskNumber)
        )
        .first();

      if (!task) continue;

      // Resolve GitHub user to LTF1 user
      const resolvedUser = await resolveGitHubUserInWorkspace(
        ctx,
        project.workspaceId,
        args.authorLogin
      );

      // Truncate long comments for the description
      const truncatedBody =
        args.commentBody.length > 200
          ? args.commentBody.substring(0, 200) + "..."
          : args.commentBody;

      const commentTypeLabel =
        args.commentType === "pr_review_comment"
          ? "PR review comment"
          : "issue comment";

      // Create activity entry
      await ctx.runMutation(internal.activities.mutations.logActivity, {
        type: "task_commented" as const,
        projectId: project._id,
        workspaceId: project.workspaceId,
        actorId: resolvedUser?.userId || null,
        actorName: resolvedUser?.userId
          ? undefined
          : `${args.authorLogin} (GitHub)`,
        targetType: "task" as const,
        targetId: task._id,
        targetName: `${projectKey}-${taskNumber}`,
        description: `${commentTypeLabel} on ${args.prNumber ? `PR #${args.prNumber}` : `issue #${args.issueNumber}`}: ${truncatedBody}`,
        metadata: {
          extra: {
            githubCommentId: args.githubCommentId,
            commentUrl: args.commentUrl,
            commentBody: args.commentBody,
            commentType: args.commentType,
            prNumber: args.prNumber,
            issueNumber: args.issueNumber,
            githubAuthor: args.authorLogin,
            isGitHubSync: true,
            resolvedUser: resolvedUser?.verified
              ? "verified"
              : resolvedUser?.userId
                ? "inferred"
                : "unknown",
          },
        },
      });
    }

    // Also log to githubActivities
    await ctx.runMutation(
      internal.integrations.github.mutations.logGitHubActivity,
      {
        type: args.commentType,
        repositoryFullName: args.repositoryFullName,
        actor: args.authorLogin,
        metadata: {
          prNumber: args.prNumber,
          issueNumber: args.issueNumber,
          githubCommentId: args.githubCommentId,
          commentUrl: args.commentUrl,
          body: args.commentBody.substring(0, 500),
          linkedTaskKeys,
          synced: true,
        },
      }
    );

    return null;
  },
});

// ---- Helpers ----

/** Extract task references (e.g., "WEB-123") from text. */
function extractTaskReferences(text: string): Array<string> {
  const taskRefs: Array<string> = [];
  const regex = /\b([A-Z]{2,})-(\d+)\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    taskRefs.push(match[0]);
  }
  return taskRefs;
}

/** Resolve a GitHub username to an LTF1 user within a workspace. */
async function resolveGitHubUserInWorkspace(
  ctx: any,
  workspaceId: any,
  githubUsername: string
): Promise<{ userId: any; verified: boolean } | null> {
  const mapping = await ctx.db
    .query("githubUserMappings")
    .withIndex("by_workspace_username", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("githubUsername", githubUsername)
    )
    .first();

  if (mapping) {
    return { userId: mapping.userId, verified: mapping.verified };
  }

  return null;
}
