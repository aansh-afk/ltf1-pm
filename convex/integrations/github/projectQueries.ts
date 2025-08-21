import { v } from "convex/values";
import { query } from "../../_generated/server";

// Get recent GitHub activity for a project (commits, PRs, issues)
export const getProjectRecentActivity = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (!project.repository?.url) {
      return {
        commits: [],
        pullRequests: [],
        issues: [],
        combined: []
      };
    }

    // Extract repository info from URL
    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    const limit = args.limit || 20;

    // Fetch recent commits
    const commits = await ctx.db
      .query("githubCommits")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .order("desc")
      .take(limit);

    // Fetch recent pull requests
    const pullRequests = await ctx.db
      .query("githubPullRequests")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .order("desc")
      .take(limit);

    // Fetch recent issues
    const issues = await ctx.db
      .query("githubIssues")
      .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
      .order("desc")
      .take(limit);

    // Combine and sort all activities by timestamp
    const combined = [
      ...commits.map(commit => ({
        type: 'commit' as const,
        timestamp: new Date(commit.timestamp).getTime(),
        data: commit
      })),
      ...pullRequests.map(pr => ({
        type: 'pull_request' as const,
        timestamp: new Date(pr.updatedAt || pr.createdAt).getTime(),
        data: pr
      })),
      ...issues.map(issue => ({
        type: 'issue' as const,
        timestamp: new Date(issue.updatedAt || issue.createdAt).getTime(),
        data: issue
      }))
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return {
      commits,
      pullRequests,
      issues,
      combined
    };
  },
});

// Get repository statistics for a project
export const getProjectRepoStats = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (!project.repository?.url) {
      return null;
    }

    const repoFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    // Get counts
    const [totalCommits, openPRs, closedPRs, openIssues, closedIssues] = await Promise.all([
      ctx.db
        .query("githubCommits")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .collect()
        .then(commits => commits.length),
      
      ctx.db
        .query("githubPullRequests")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .filter(q => q.eq(q.field("state"), "open"))
        .collect()
        .then(prs => prs.length),
      
      ctx.db
        .query("githubPullRequests")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .filter(q => q.or(
          q.eq(q.field("state"), "closed"),
          q.eq(q.field("state"), "merged")
        ))
        .collect()
        .then(prs => prs.length),
      
      ctx.db
        .query("githubIssues")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .filter(q => q.eq(q.field("state"), "open"))
        .collect()
        .then(issues => issues.length),
      
      ctx.db
        .query("githubIssues")
        .withIndex("by_repository", (q) => q.eq("repositoryFullName", repoFullName))
        .filter(q => q.eq(q.field("state"), "closed"))
        .collect()
        .then(issues => issues.length),
    ]);

    return {
      totalCommits,
      openPullRequests: openPRs,
      closedPullRequests: closedPRs,
      openIssues,
      closedIssues,
      totalPullRequests: openPRs + closedPRs,
      totalIssues: openIssues + closedIssues,
    };
  },
});