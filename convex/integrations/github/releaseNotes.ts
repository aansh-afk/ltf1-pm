import { v } from "convex/values";
import { query } from "../../_generated/server";
import {
  parseConventionalCommit,
  getSectionTitle,
  getSectionKey,
} from "./commitParsing";

// ---- Shared types for release notes output ----

interface ReleaseNoteItem {
  title: string;
  prNumber: number;
  prUrl: string;
  author: string;
  scope: string | null;
  breaking: boolean;
}

interface ReleaseNoteSection {
  type: string;
  title: string;
  items: Array<ReleaseNoteItem>;
}

interface ReleaseNotesData {
  version: string;
  date: string;
  sections: Array<ReleaseNoteSection>;
  contributors: Array<string>;
  stats: {
    totalPRs: number;
    totalCommits: number;
    totalContributors: number;
  };
}

// ---- Validators matching the return shape ----

const releaseNoteItemValidator = v.object({
  title: v.string(),
  prNumber: v.number(),
  prUrl: v.string(),
  author: v.string(),
  scope: v.union(v.string(), v.null()),
  breaking: v.boolean(),
});

const releaseNoteSectionValidator = v.object({
  type: v.string(),
  title: v.string(),
  items: v.array(releaseNoteItemValidator),
});

const releaseNotesValidator = v.object({
  version: v.string(),
  date: v.string(),
  sections: v.array(releaseNoteSectionValidator),
  contributors: v.array(v.string()),
  stats: v.object({
    totalPRs: v.number(),
    totalCommits: v.number(),
    totalContributors: v.number(),
  }),
});

// ---- Helper: collect merged PRs for a project within a time range ----

async function collectMergedPRs(
  ctx: any,
  projectId: string,
  startDate?: number,
  endDate?: number
): Promise<
  Array<{
    number: number;
    title: string;
    url: string;
    author: string;
    mergedAt: string;
    linkedTaskKeys: Array<string>;
  }>
> {
  // Find the project to get its repository info
  const project = await ctx.db.get(projectId);
  if (!project || !project.repository) {
    return [];
  }

  const repoFullName = `${project.repository.owner}/${project.repository.name}`;

  // Query all PRs for this repository
  const allPRs = await ctx.db
    .query("githubPullRequests")
    .withIndex("by_repository", (q: any) =>
      q.eq("repositoryFullName", repoFullName)
    )
    .collect();

  // Filter to merged PRs within the date range
  const mergedPRs = allPRs.filter((pr: any) => {
    if (!pr.mergedAt) return false;

    const mergedTime = new Date(pr.mergedAt).getTime();

    if (startDate && mergedTime < startDate) return false;
    if (endDate && mergedTime > endDate) return false;

    return true;
  });

  return mergedPRs.map((pr: any) => ({
    number: pr.number,
    title: pr.title,
    url: pr.url,
    author: pr.author,
    mergedAt: pr.mergedAt,
    linkedTaskKeys: pr.linkedTaskKeys || [],
  }));
}

// ---- Helper: count commits in a date range for a project ----

async function countCommitsInRange(
  ctx: any,
  projectId: string,
  startDate?: number,
  endDate?: number
): Promise<number> {
  const project = await ctx.db.get(projectId);
  if (!project || !project.repository) return 0;

  const repoFullName = `${project.repository.owner}/${project.repository.name}`;

  const allCommits = await ctx.db
    .query("githubCommits")
    .withIndex("by_repository", (q: any) =>
      q.eq("repositoryFullName", repoFullName)
    )
    .collect();

  return allCommits.filter((c: any) => {
    const commitTime = new Date(c.timestamp).getTime();
    if (startDate && commitTime < startDate) return false;
    if (endDate && commitTime > endDate) return false;
    return true;
  }).length;
}

// ---- Helper: build structured release notes from merged PRs ----

function buildReleaseNotes(
  mergedPRs: Array<{
    number: number;
    title: string;
    url: string;
    author: string;
    mergedAt: string;
  }>,
  totalCommits: number,
  version: string,
  date: string
): ReleaseNotesData {
  // Group PRs by conventional commit type
  const sectionMap: Record<string, Array<ReleaseNoteItem>> = {};
  const contributorSet = new Set<string>();

  for (const pr of mergedPRs) {
    const parsed = parseConventionalCommit(pr.title);
    const sectionKey = parsed.type ? getSectionKey(parsed.type) : "other";
    const sectionTitle = parsed.type
      ? getSectionTitle(parsed.type)
      : "Other Changes";

    if (!sectionMap[sectionKey]) {
      sectionMap[sectionKey] = [];
    }

    sectionMap[sectionKey].push({
      title: parsed.description || pr.title,
      prNumber: pr.number,
      prUrl: pr.url,
      author: pr.author,
      scope: parsed.scope,
      breaking: parsed.breaking,
    });

    contributorSet.add(pr.author);
  }

  // Build ordered sections: features first, then fixes, then performance, then other
  const sectionOrder = ["features", "fixes", "performance", "other"];
  const sectionTitleMap: Record<string, string> = {
    features: "New Features",
    fixes: "Bug Fixes",
    performance: "Performance Improvements",
    other: "Other Changes",
  };

  const sections: Array<ReleaseNoteSection> = [];
  for (const key of sectionOrder) {
    const items = sectionMap[key];
    if (items && items.length > 0) {
      sections.push({
        type: key,
        title: sectionTitleMap[key] || "Other Changes",
        items,
      });
    }
  }

  const contributors = Array.from(contributorSet).sort();

  return {
    version,
    date,
    sections,
    contributors,
    stats: {
      totalPRs: mergedPRs.length,
      totalCommits,
      totalContributors: contributors.length,
    },
  };
}

// ---- Helper: convert structured release notes to markdown ----

function releaseNotesToMarkdown(data: ReleaseNotesData): string {
  const lines: Array<string> = [];

  lines.push(`# ${data.version}`);
  lines.push(`> Released on ${data.date}`);
  lines.push("");

  for (const section of data.sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    for (const item of section.items) {
      const scopeTag = item.scope ? `**${item.scope}:** ` : "";
      const breakingTag = item.breaking ? " **BREAKING**" : "";
      lines.push(
        `- ${scopeTag}${item.title}${breakingTag} ([#${item.prNumber}](${item.prUrl})) — @${item.author}`
      );
    }
    lines.push("");
  }

  if (data.contributors.length > 0) {
    lines.push("## Contributors");
    lines.push("");
    lines.push(data.contributors.map((c) => `@${c}`).join(", "));
    lines.push("");
  }

  lines.push("---");
  lines.push(
    `${data.stats.totalPRs} pull requests merged | ${data.stats.totalCommits} commits | ${data.stats.totalContributors} contributors`
  );

  return lines.join("\n");
}

// ========================================
// Public queries
// ========================================

/**
 * Generate structured release notes from merged PRs.
 *
 * Accepts a sprint (uses its date range) or explicit startDate/endDate.
 * Groups PRs by conventional commit type parsed from PR titles.
 */
export const generateReleaseNotes = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: releaseNotesValidator,
  handler: async (ctx, args) => {
    // Resolve date range from sprint if provided
    let startDate = args.startDate;
    let endDate = args.endDate;
    let versionLabel = "Unreleased";

    if (args.sprintId) {
      const sprint = await ctx.db.get(args.sprintId);
      if (sprint) {
        startDate = startDate ?? sprint.startDate;
        endDate = endDate ?? sprint.endDate;
        versionLabel = sprint.name;
      }
    }

    // Collect merged PRs
    const mergedPRs = await collectMergedPRs(
      ctx,
      args.projectId,
      startDate,
      endDate
    );

    // Count commits in range
    const totalCommits = await countCommitsInRange(
      ctx,
      args.projectId,
      startDate,
      endDate
    );

    // Format date
    const dateStr = endDate
      ? new Date(endDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    return buildReleaseNotes(mergedPRs, totalCommits, versionLabel, dateStr);
  },
});

/**
 * Generate release notes as a formatted markdown string.
 *
 * Same logic as generateReleaseNotes but returns a copy/pasteable markdown string.
 */
export const getReleaseNotesMarkdown = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Resolve date range from sprint if provided
    let startDate = args.startDate;
    let endDate = args.endDate;
    let versionLabel = "Unreleased";

    if (args.sprintId) {
      const sprint = await ctx.db.get(args.sprintId);
      if (sprint) {
        startDate = startDate ?? sprint.startDate;
        endDate = endDate ?? sprint.endDate;
        versionLabel = sprint.name;
      }
    }

    // Collect merged PRs
    const mergedPRs = await collectMergedPRs(
      ctx,
      args.projectId,
      startDate,
      endDate
    );

    // Count commits in range
    const totalCommits = await countCommitsInRange(
      ctx,
      args.projectId,
      startDate,
      endDate
    );

    // Format date
    const dateStr = endDate
      ? new Date(endDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const data = buildReleaseNotes(
      mergedPRs,
      totalCommits,
      versionLabel,
      dateStr
    );

    return releaseNotesToMarkdown(data);
  },
});
