import { v } from "convex/values";

// GitHub App Installation types
export const githubInstallation = v.object({
  installationId: v.number(),
  accountType: v.union(v.literal("user"), v.literal("organization")),
  accountName: v.string(),
  accountId: v.number(),
  targetType: v.union(v.literal("user"), v.literal("organization")),
  permissions: v.any(), // GitHub permissions object
  events: v.array(v.string()),
  installedAt: v.number(),
  updatedAt: v.number(),
  suspendedAt: v.optional(v.number()),
  repositorySelection: v.union(v.literal("all"), v.literal("selected")),
});

// GitHub Repository type
export const githubRepository = v.object({
  repoId: v.number(),
  nodeId: v.string(),
  owner: v.string(),
  name: v.string(),
  fullName: v.string(),
  private: v.boolean(),
  description: v.optional(v.string()),
  defaultBranch: v.string(),
  language: v.optional(v.string()),
  topics: v.array(v.string()),
  stargazersCount: v.number(),
  forksCount: v.number(),
  openIssuesCount: v.number(),
  createdAt: v.string(),
  updatedAt: v.string(),
  pushedAt: v.optional(v.string()),
});

// Webhook Event type
export const githubWebhookEvent = v.object({
  eventType: v.string(),
  deliveryId: v.string(),
  payload: v.any(),
  signature: v.string(),
  receivedAt: v.number(),
  processedAt: v.optional(v.number()),
  status: v.union(v.literal("pending"), v.literal("processed"), v.literal("failed")),
  error: v.optional(v.string()),
});

// GitHub User type
export const githubUser = v.object({
  login: v.string(),
  id: v.number(),
  nodeId: v.string(),
  avatarUrl: v.string(),
  type: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
});

// Pull Request type
export const pullRequest = v.object({
  number: v.number(),
  title: v.string(),
  state: v.union(v.literal("open"), v.literal("closed"), v.literal("merged")),
  draft: v.boolean(),
  createdAt: v.string(),
  updatedAt: v.string(),
  closedAt: v.optional(v.string()),
  mergedAt: v.optional(v.string()),
  author: githubUser,
  assignees: v.array(githubUser),
  reviewers: v.array(githubUser),
  labels: v.array(v.object({
    name: v.string(),
    color: v.string(),
  })),
  additions: v.number(),
  deletions: v.number(),
  changedFiles: v.number(),
});

// Commit type
export const commit = v.object({
  sha: v.string(),
  message: v.string(),
  author: v.object({
    name: v.string(),
    email: v.string(),
    date: v.string(),
  }),
  committer: v.object({
    name: v.string(),
    email: v.string(),
    date: v.string(),
  }),
  url: v.string(),
});

// GitHub Stats type for developer profiles
export const githubStats = v.object({
  totalCommits: v.number(),
  totalPRs: v.number(),
  totalReviews: v.number(),
  totalIssues: v.number(),
  languages: v.array(v.object({
    name: v.string(),
    percentage: v.number(),
    linesOfCode: v.number(),
  })),
  contributionCalendar: v.array(v.object({
    date: v.string(),
    contributionCount: v.number(),
    contributionLevel: v.union(
      v.literal("NONE"),
      v.literal("FIRST_QUARTILE"),
      v.literal("SECOND_QUARTILE"),
      v.literal("THIRD_QUARTILE"),
      v.literal("FOURTH_QUARTILE")
    ),
  })),
  repositories: v.array(v.object({
    name: v.string(),
    stars: v.number(),
    forks: v.number(),
    language: v.optional(v.string()),
    contributions: v.number(),
  })),
  lastUpdated: v.number(),
});