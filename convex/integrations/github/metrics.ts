import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getCurrentUserOrThrow } from "../../lib/auth";

// ── Git Velocity Metrics ────────────────────────────────────────────────────
// Merged PRs, commits, and auto-completed tasks per time period for a workspace.

export const getGitVelocity = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodDays: v.optional(v.number()), // defaults to 30
  },
  returns: v.object({
    mergedPRs: v.number(),
    totalCommits: v.number(),
    autoCompletedTasks: v.number(),
    openPRs: v.number(),
    periodDays: v.number(),
    dailyAvgCommits: v.number(),
    dailyAvgMergedPRs: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Verify workspace membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();
    if (!membership) throw new Error("Not a workspace member");

    const periodDays = args.periodDays ?? 30;
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
    const cutoffISO = new Date(cutoff).toISOString();

    // Get all projects in workspace to find connected repos
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const repoFullNames = new Set<string>();
    for (const project of projects) {
      if (project.repository?.url) {
        const fullName = project.repository.url
          .replace("https://github.com/", "")
          .replace(".git", "");
        repoFullNames.add(fullName);
      }
    }

    let mergedPRs = 0;
    let openPRs = 0;
    let totalCommits = 0;

    for (const repoFullName of repoFullNames) {
      // Count PRs
      const prs = await ctx.db
        .query("githubPullRequests")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .collect();

      for (const pr of prs) {
        if (pr.mergedAt && pr.mergedAt >= cutoffISO) {
          mergedPRs++;
        }
        if (pr.state === "open") {
          openPRs++;
        }
      }

      // Count commits
      const commits = await ctx.db
        .query("githubCommits")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .collect();

      for (const commit of commits) {
        if (commit.createdAt >= cutoff) {
          totalCommits++;
        }
      }
    }

    // Count auto-completed tasks (tasks with status "done" and git.pullRequestStatus "merged")
    let autoCompletedTasks = 0;
    for (const project of projects) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();

      for (const task of tasks) {
        if (
          task.status === "done" &&
          task.git?.pullRequestStatus === "merged" &&
          task.completedAt &&
          task.completedAt >= cutoff
        ) {
          autoCompletedTasks++;
        }
      }
    }

    return {
      mergedPRs,
      totalCommits,
      autoCompletedTasks,
      openPRs,
      periodDays,
      dailyAvgCommits: periodDays > 0 ? Math.round((totalCommits / periodDays) * 100) / 100 : 0,
      dailyAvgMergedPRs: periodDays > 0 ? Math.round((mergedPRs / periodDays) * 100) / 100 : 0,
    };
  },
});

// ── Cycle Time ──────────────────────────────────────────────────────────────
// Average time from first commit to PR merge for a workspace/project.

export const getCycleTime = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({
    avgCycleTimeMs: v.number(),
    avgCycleTimeHours: v.number(),
    prCount: v.number(),
    fastest: v.union(v.number(), v.null()),
    slowest: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();
    if (!membership) throw new Error("Not a workspace member");

    // Determine which repos to look at
    let projects: Array<any>;
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.workspaceId !== args.workspaceId) {
        throw new Error("Project not found in workspace");
      }
      projects = [project];
    } else {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
    }

    const repoFullNames = new Set<string>();
    for (const project of projects) {
      if (project.repository?.url) {
        const fullName = project.repository.url
          .replace("https://github.com/", "")
          .replace(".git", "");
        repoFullNames.add(fullName);
      }
    }

    const cycleTimes: Array<number> = [];

    for (const repoFullName of repoFullNames) {
      // Get merged PRs
      const prs = await ctx.db
        .query("githubPullRequests")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .collect();

      for (const pr of prs) {
        if (pr.mergedAt && pr.createdAt) {
          const createdMs = new Date(pr.createdAt).getTime();
          const mergedMs = new Date(pr.mergedAt).getTime();
          if (mergedMs > createdMs) {
            cycleTimes.push(mergedMs - createdMs);
          }
        }
      }
    }

    if (cycleTimes.length === 0) {
      return {
        avgCycleTimeMs: 0,
        avgCycleTimeHours: 0,
        prCount: 0,
        fastest: null,
        slowest: null,
      };
    }

    const total = cycleTimes.reduce((sum, t) => sum + t, 0);
    const avg = total / cycleTimes.length;
    const fastest = Math.min(...cycleTimes);
    const slowest = Math.max(...cycleTimes);

    return {
      avgCycleTimeMs: Math.round(avg),
      avgCycleTimeHours: Math.round((avg / (1000 * 60 * 60)) * 10) / 10,
      prCount: cycleTimes.length,
      fastest,
      slowest,
    };
  },
});

// ── Contributor Stats ───────────────────────────────────────────────────────
// Per-developer commit, PR, and review counts.

export const getContributorStats = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodDays: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      author: v.string(),
      commits: v.number(),
      prsOpened: v.number(),
      prsMerged: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();
    if (!membership) throw new Error("Not a workspace member");

    const periodDays = args.periodDays ?? 30;
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
    const cutoffISO = new Date(cutoff).toISOString();

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const repoFullNames = new Set<string>();
    for (const project of projects) {
      if (project.repository?.url) {
        const fullName = project.repository.url
          .replace("https://github.com/", "")
          .replace(".git", "");
        repoFullNames.add(fullName);
      }
    }

    // Aggregate stats per author
    const stats: Record<string, { commits: number; prsOpened: number; prsMerged: number }> = {};

    const ensureAuthor = (author: string) => {
      if (!stats[author]) {
        stats[author] = { commits: 0, prsOpened: 0, prsMerged: 0 };
      }
    };

    for (const repoFullName of repoFullNames) {
      // Commits
      const commits = await ctx.db
        .query("githubCommits")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .collect();

      for (const commit of commits) {
        if (commit.createdAt >= cutoff) {
          const authorName = commit.author.name;
          ensureAuthor(authorName);
          stats[authorName].commits++;
        }
      }

      // PRs
      const prs = await ctx.db
        .query("githubPullRequests")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .collect();

      for (const pr of prs) {
        const prAuthor = pr.author;
        if (pr.createdAt >= cutoffISO) {
          ensureAuthor(prAuthor);
          stats[prAuthor].prsOpened++;
        }
        if (pr.mergedAt && pr.mergedAt >= cutoffISO) {
          ensureAuthor(prAuthor);
          stats[prAuthor].prsMerged++;
        }
      }
    }

    // Convert to sorted array (most active first)
    const result = Object.entries(stats)
      .map(([author, data]) => ({
        author,
        commits: data.commits,
        prsOpened: data.prsOpened,
        prsMerged: data.prsMerged,
      }))
      .sort((a, b) => (b.commits + b.prsMerged) - (a.commits + a.prsMerged));

    return result;
  },
});

// ── Sprint Git Metrics ──────────────────────────────────────────────────────
// Git activity during a specific sprint.

export const getSprintGitMetrics = query({
  args: {
    sprintId: v.id("sprints"),
  },
  returns: v.object({
    sprintName: v.string(),
    totalCommits: v.number(),
    totalPRsMerged: v.number(),
    totalPRsOpened: v.number(),
    tasksAutoCompleted: v.number(),
    tasksDone: v.number(),
    totalTasks: v.number(),
    contributors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error("Sprint not found");

    const project = await ctx.db.get(sprint.projectId);
    if (!project) throw new Error("Project not found");

    // Verify access
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .first();
    if (!membership) throw new Error("Not a workspace member");

    const sprintStartISO = new Date(sprint.startDate).toISOString();
    const sprintEndISO = new Date(sprint.endDate).toISOString();

    // Get repo for project
    let totalCommits = 0;
    let totalPRsMerged = 0;
    let totalPRsOpened = 0;
    const contributorSet = new Set<string>();

    if (project.repository?.url) {
      const repoFullName = project.repository.url
        .replace("https://github.com/", "")
        .replace(".git", "");

      // Commits during sprint window
      const commits = await ctx.db
        .query("githubCommits")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .collect();

      for (const commit of commits) {
        if (commit.createdAt >= sprint.startDate && commit.createdAt <= sprint.endDate) {
          totalCommits++;
          contributorSet.add(commit.author.name);
        }
      }

      // PRs during sprint window
      const prs = await ctx.db
        .query("githubPullRequests")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .collect();

      for (const pr of prs) {
        if (pr.createdAt >= sprintStartISO && pr.createdAt <= sprintEndISO) {
          totalPRsOpened++;
          contributorSet.add(pr.author);
        }
        if (pr.mergedAt && pr.mergedAt >= sprintStartISO && pr.mergedAt <= sprintEndISO) {
          totalPRsMerged++;
          contributorSet.add(pr.author);
        }
      }
    }

    // Get sprint tasks
    const sprintTasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();

    const tasksDone = sprintTasks.filter((t) => t.status === "done").length;
    const tasksAutoCompleted = sprintTasks.filter(
      (t) => t.status === "done" && t.git?.pullRequestStatus === "merged"
    ).length;

    return {
      sprintName: sprint.name,
      totalCommits,
      totalPRsMerged,
      totalPRsOpened,
      tasksAutoCompleted,
      tasksDone,
      totalTasks: sprintTasks.length,
      contributors: Array.from(contributorSet),
    };
  },
});
