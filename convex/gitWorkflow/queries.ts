import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ─── Default Preset Definitions ─────────────────────────────────────────

const AGILE_STATUS_MAPPINGS = {
  branchCreated: "in_progress" as string | undefined,
  commitPushed: undefined,
  prOpened: "in_review" as string | undefined,
  prMerged: "done" as string | undefined,
  prClosed: undefined,
  prApproved: undefined,
  prReviewRequested: undefined,
};

const KANBAN_STATUS_MAPPINGS = {
  branchCreated: "in_progress" as string | undefined,
  commitPushed: undefined,
  prOpened: "in_review" as string | undefined,
  prMerged: "done" as string | undefined,
  prClosed: undefined,
  prApproved: undefined,
  prReviewRequested: undefined,
};

const AGILE_CONVENTIONAL_COMMITS = {
  enabled: true,
  typeMappings: {
    feat: "feature",
    fix: "bug",
    chore: "chore",
    refactor: "improvement",
    test: "test",
    docs: "documentation",
  } as Record<string, string> | undefined,
};

const KANBAN_CONVENTIONAL_COMMITS = {
  enabled: false,
  typeMappings: undefined as Record<string, string> | undefined,
};

const AGILE_BRANCH_PATTERN =
  "(feature|fix|hotfix|chore|refactor)/[A-Z]+-\\d+.*";

export const AGILE_DEFAULTS = {
  preset: "agile" as const,
  statusMappings: AGILE_STATUS_MAPPINGS,
  conventionalCommits: AGILE_CONVENTIONAL_COMMITS,
  branchPattern: AGILE_BRANCH_PATTERN,
  autoCompleteSprint: true,
};

export const KANBAN_DEFAULTS = {
  preset: "kanban" as const,
  statusMappings: KANBAN_STATUS_MAPPINGS,
  conventionalCommits: KANBAN_CONVENTIONAL_COMMITS,
  branchPattern: undefined as string | undefined,
  autoCompleteSprint: false,
};

// ─── Public Queries ─────────────────────────────────────────────────────

/**
 * Get the git workflow config for a project.
 * Returns the stored config, or agile defaults if none exists.
 */
export const getGitWorkflowConfig = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.object({
    projectId: v.id("projects"),
    preset: v.union(
      v.literal("agile"),
      v.literal("kanban"),
      v.literal("custom"),
    ),
    statusMappings: v.object({
      branchCreated: v.optional(v.string()),
      commitPushed: v.optional(v.string()),
      prOpened: v.optional(v.string()),
      prMerged: v.optional(v.string()),
      prClosed: v.optional(v.string()),
      prApproved: v.optional(v.string()),
      prReviewRequested: v.optional(v.string()),
    }),
    conventionalCommits: v.object({
      enabled: v.boolean(),
      typeMappings: v.optional(v.record(v.string(), v.string())),
    }),
    branchPattern: v.optional(v.string()),
    autoCompleteSprint: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("gitWorkflowConfigs")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .first();

    if (config) {
      return {
        projectId: config.projectId,
        preset: config.preset,
        statusMappings: config.statusMappings,
        conventionalCommits: config.conventionalCommits,
        branchPattern: config.branchPattern,
        autoCompleteSprint: config.autoCompleteSprint,
      };
    }

    // Return agile defaults when no config exists
    return {
      projectId: args.projectId,
      ...AGILE_DEFAULTS,
    };
  },
});

// ─── Internal Queries ───────────────────────────────────────────────────

/**
 * Get the effective status mapping for a specific git event on a project.
 * Used by webhook handlers to determine which task status to transition to.
 * Returns the mapped status string or null if no mapping is defined.
 */
export const getEffectiveStatusMapping = internalQuery({
  args: {
    projectId: v.id("projects"),
    gitEvent: v.union(
      v.literal("branchCreated"),
      v.literal("commitPushed"),
      v.literal("prOpened"),
      v.literal("prMerged"),
      v.literal("prClosed"),
      v.literal("prApproved"),
      v.literal("prReviewRequested"),
    ),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("gitWorkflowConfigs")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .first();

    if (config) {
      const mapping = config.statusMappings[args.gitEvent];
      return mapping ?? null;
    }

    // Fall back to agile defaults
    const defaultMapping = AGILE_DEFAULTS.statusMappings[args.gitEvent];
    return defaultMapping ?? null;
  },
});

/**
 * Get the autoCompleteSprint setting for a project.
 * Used after task auto-completion to determine if the sprint should be checked.
 */
export const getAutoCompleteSprintSetting = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("gitWorkflowConfigs")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .first();

    if (config) {
      return config.autoCompleteSprint;
    }

    // Agile defaults: autoCompleteSprint is true
    return AGILE_DEFAULTS.autoCompleteSprint;
  },
});
