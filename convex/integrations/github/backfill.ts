"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { Octokit } from "@octokit/rest";

// ── Task reference extraction ───────────────────────────────────────────────
// Matches patterns like WEB-123, API-456, etc.
function extractTaskReferences(text: string): Array<string> {
  const taskRefs: Array<string> = [];
  const regex = /\b([A-Z]{2,})-(\d+)\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    taskRefs.push(match[0]);
  }
  return taskRefs;
}

// ── Historical Backfill ─────────────────────────────────────────────────────
// Fetches existing PRs and commits from a connected GitHub repo, stores them,
// and links to tasks where possible by scanning titles/bodies for task refs.

export const backfillRepository = internalAction({
  args: {
    installationId: v.number(),
    repositoryFullName: v.string(),
    maxCommits: v.optional(v.number()), // defaults to 100
    maxPRs: v.optional(v.number()),     // defaults to 50
  },
  returns: v.object({
    commitsProcessed: v.number(),
    prsProcessed: v.number(),
    taskLinksCreated: v.number(),
  }),
  handler: async (ctx, args) => {
    const maxCommits = args.maxCommits ?? 100;
    const maxPRs = args.maxPRs ?? 50;

    // Get installation token
    const tokenData = await ctx.runAction(
      internal.integrations.github.nodeActions.generateInstallationToken,
      {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
        installationId: args.installationId,
      }
    );

    const octokit = new Octokit({ auth: tokenData.token });
    const [owner, repo] = args.repositoryFullName.split("/");

    let commitsProcessed = 0;
    let prsProcessed = 0;
    let taskLinksCreated = 0;

    // ── Backfill Commits ────────────────────────────────────────────────
    try {
      const perPage = Math.min(maxCommits, 100);
      let page = 1;
      let fetched = 0;

      while (fetched < maxCommits) {
        const { data: commits } = await octokit.request(
          "GET /repos/{owner}/{repo}/commits",
          {
            owner,
            repo,
            per_page: perPage,
            page,
          }
        );

        if (commits.length === 0) break;

        for (const commit of commits) {
          if (fetched >= maxCommits) break;

          const message = commit.commit.message;
          const taskRefs = extractTaskReferences(message);

          // Store the commit (storeCommit checks for duplicates by sha)
          await ctx.runMutation(
            internal.integrations.github.mutations.storeCommit,
            {
              repositoryFullName: args.repositoryFullName,
              commit: {
                sha: commit.sha,
                message,
                author: {
                  name: commit.commit.author?.name || "Unknown",
                  email: commit.commit.author?.email || "unknown@example.com",
                  date:
                    commit.commit.author?.date || new Date().toISOString(),
                },
                url: commit.html_url,
              },
            }
          );

          // If task references found, link commit to tasks
          if (taskRefs.length > 0) {
            await ctx.runMutation(
              internal.integrations.github.mutations.linkCommitToTasks,
              {
                repositoryFullName: args.repositoryFullName,
                commit: {
                  sha: commit.sha,
                  message,
                  author: {
                    name: commit.commit.author?.name || "Unknown",
                    email:
                      commit.commit.author?.email || "unknown@example.com",
                  },
                  timestamp:
                    commit.commit.author?.date || new Date().toISOString(),
                  url: commit.html_url,
                },
                branch: "main", // Default; push events carry real branch
                taskRefs,
              }
            );
            taskLinksCreated += taskRefs.length;
          }

          commitsProcessed++;
          fetched++;
        }

        page++;
        // Stop if we got fewer than a full page
        if (commits.length < perPage) break;
      }
    } catch (error) {
      console.error("[Backfill] Error fetching commits:", error);
    }

    // ── Backfill Pull Requests ──────────────────────────────────────────
    try {
      const perPage = Math.min(maxPRs, 100);
      let page = 1;
      let fetched = 0;

      while (fetched < maxPRs) {
        const { data: prs } = await octokit.request(
          "GET /repos/{owner}/{repo}/pulls",
          {
            owner,
            repo,
            state: "all",
            per_page: perPage,
            page,
            sort: "updated",
            direction: "desc",
          }
        );

        if (prs.length === 0) break;

        for (const pr of prs) {
          if (fetched >= maxPRs) break;

          // Extract task refs from title and body
          const titleRefs = extractTaskReferences(pr.title);
          const bodyRefs = extractTaskReferences(pr.body || "");
          const allRefs = [...new Set([...titleRefs, ...bodyRefs])];

          // Determine the appropriate action for linkPullRequestToTasks
          let action: string;
          if (pr.merged_at) {
            action = "closed"; // merged PRs come as action=closed with mergedAt set
          } else if (pr.state === "closed") {
            action = "closed";
          } else {
            action = "opened";
          }

          await ctx.runMutation(
            internal.integrations.github.mutations.linkPullRequestToTasks,
            {
              repositoryFullName: args.repositoryFullName,
              pullRequest: {
                number: pr.number,
                title: pr.title,
                state: pr.state,
                draft: pr.draft || false,
                url: pr.html_url,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                closedAt: pr.closed_at ?? undefined,
                mergedAt: pr.merged_at ?? undefined,
                author: pr.user?.login || "unknown",
              },
              taskRefs: allRefs,
              action,
            }
          );

          if (allRefs.length > 0) {
            taskLinksCreated += allRefs.length;
          }

          prsProcessed++;
          fetched++;
        }

        page++;
        if (prs.length < perPage) break;
      }
    } catch (error) {
      console.error("[Backfill] Error fetching pull requests:", error);
    }

    console.log(
      `[Backfill] Completed for ${args.repositoryFullName}: ` +
        `${commitsProcessed} commits, ${prsProcessed} PRs, ${taskLinksCreated} task links`
    );

    return {
      commitsProcessed,
      prsProcessed,
      taskLinksCreated,
    };
  },
});

// ── Trigger Backfill for a Project ──────────────────────────────────────────
// Public-facing mutation that schedules a backfill for a project's connected repo.

export const triggerProjectBackfill = internalAction({
  args: {
    projectId: v.id("projects"),
    maxCommits: v.optional(v.number()),
    maxPRs: v.optional(v.number()),
  },
  returns: v.object({
    scheduled: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get project
    const project: {
      projectId: string;
      repositoryFullName: string | null;
      installationId: number | null;
    } | null = await ctx.runQuery(
      internal.integrations.github.queries.getProjectForBackfill,
      { projectId: args.projectId }
    );

    if (!project) {
      return { scheduled: false, message: "Project not found" };
    }

    if (!project.repositoryFullName) {
      return { scheduled: false, message: "No repository connected to project" };
    }

    if (!project.installationId) {
      return {
        scheduled: false,
        message: "No GitHub installation found for workspace",
      };
    }

    // Run backfill directly (we're already in an action)
    const result: {
      commitsProcessed: number;
      prsProcessed: number;
      taskLinksCreated: number;
    } = await ctx.runAction(
      internal.integrations.github.backfill.backfillRepository,
      {
        installationId: project.installationId,
        repositoryFullName: project.repositoryFullName,
        maxCommits: args.maxCommits,
        maxPRs: args.maxPRs,
      }
    );

    return {
      scheduled: true,
      message: `Backfill complete: ${result.commitsProcessed} commits, ${result.prsProcessed} PRs, ${result.taskLinksCreated} task links`,
    };
  },
});

