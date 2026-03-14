import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { AGILE_DEFAULTS, KANBAN_DEFAULTS } from "./queries";

// ─── Public Mutations ───────────────────────────────────────────────────

/**
 * Upsert git workflow config for a project.
 * Creates with defaults if none exists; patches existing if found.
 */
export const upsertGitWorkflowConfig = mutation({
  args: {
    projectId: v.id("projects"),
    preset: v.optional(
      v.union(
        v.literal("agile"),
        v.literal("kanban"),
        v.literal("custom"),
      ),
    ),
    statusMappings: v.optional(
      v.object({
        branchCreated: v.optional(v.string()),
        commitPushed: v.optional(v.string()),
        prOpened: v.optional(v.string()),
        prMerged: v.optional(v.string()),
        prClosed: v.optional(v.string()),
        prApproved: v.optional(v.string()),
        prReviewRequested: v.optional(v.string()),
      }),
    ),
    conventionalCommits: v.optional(
      v.object({
        enabled: v.boolean(),
        typeMappings: v.optional(v.record(v.string(), v.string())),
      }),
    ),
    branchPattern: v.optional(v.string()),
    autoCompleteSprint: v.optional(v.boolean()),
  },
  returns: v.id("gitWorkflowConfigs"),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const existing = await ctx.db
      .query("gitWorkflowConfigs")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .first();

    if (existing) {
      // Patch existing config — only update provided fields
      const updates: Record<string, unknown> = {};

      if (args.preset !== undefined) {
        updates.preset = args.preset;
      }
      if (args.statusMappings !== undefined) {
        updates.statusMappings = args.statusMappings;
      }
      if (args.conventionalCommits !== undefined) {
        updates.conventionalCommits = args.conventionalCommits;
      }
      if (args.branchPattern !== undefined) {
        updates.branchPattern = args.branchPattern;
      }
      if (args.autoCompleteSprint !== undefined) {
        updates.autoCompleteSprint = args.autoCompleteSprint;
      }

      // If individual fields are changed but preset is not explicitly set, mark as custom
      if (
        args.preset === undefined &&
        (args.statusMappings !== undefined ||
          args.conventionalCommits !== undefined ||
          args.branchPattern !== undefined ||
          args.autoCompleteSprint !== undefined)
      ) {
        updates.preset = "custom";
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new config with defaults merged with provided values
    const defaults = AGILE_DEFAULTS;
    const configId = await ctx.db.insert("gitWorkflowConfigs", {
      projectId: args.projectId,
      preset: args.preset ?? defaults.preset,
      statusMappings: args.statusMappings ?? defaults.statusMappings,
      conventionalCommits:
        args.conventionalCommits ?? defaults.conventionalCommits,
      branchPattern: args.branchPattern ?? defaults.branchPattern,
      autoCompleteSprint:
        args.autoCompleteSprint ?? defaults.autoCompleteSprint,
    });

    return configId;
  },
});

/**
 * Reset git workflow config to a preset (agile or kanban defaults).
 */
export const resetToPreset = mutation({
  args: {
    projectId: v.id("projects"),
    preset: v.union(v.literal("agile"), v.literal("kanban")),
  },
  returns: v.id("gitWorkflowConfigs"),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const defaults = args.preset === "agile" ? AGILE_DEFAULTS : KANBAN_DEFAULTS;

    const existing = await ctx.db
      .query("gitWorkflowConfigs")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        preset: defaults.preset,
        statusMappings: defaults.statusMappings,
        conventionalCommits: defaults.conventionalCommits,
        branchPattern: defaults.branchPattern,
        autoCompleteSprint: defaults.autoCompleteSprint,
      });
      return existing._id;
    }

    // Create new config with preset defaults
    const configId = await ctx.db.insert("gitWorkflowConfigs", {
      projectId: args.projectId,
      preset: defaults.preset,
      statusMappings: defaults.statusMappings,
      conventionalCommits: defaults.conventionalCommits,
      branchPattern: defaults.branchPattern,
      autoCompleteSprint: defaults.autoCompleteSprint,
    });

    return configId;
  },
});

// ─── Internal Mutations ─────────────────────────────────────────────────

/**
 * Auto-complete a sprint if all tasks are in a completion status (done/cancelled).
 * Called after a task is auto-completed via PR merge.
 */
export const checkAndAutoCompleteSprint = internalMutation({
  args: {
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.sprintId) {
      return null;
    }

    const sprint = await ctx.db.get(task.sprintId);
    if (!sprint || sprint.status !== "active") {
      return null;
    }

    // Query all tasks in this sprint
    const sprintTasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", task.sprintId!))
      .collect();

    if (sprintTasks.length === 0) {
      return null;
    }

    // Check if ALL tasks are in a completion status (done or cancelled)
    const allComplete = sprintTasks.every(
      (t) => t.status === "done" || t.status === "cancelled",
    );

    if (!allComplete) {
      return null;
    }

    // Auto-complete the sprint
    await ctx.db.patch(sprint._id, {
      status: "completed",
      updatedAt: Date.now(),
    });

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Log the auto-completion as an activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "sprint_completed",
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: null,
      actorName: "Git Workflow Engine",
      targetType: "sprint",
      targetId: sprint._id,
      targetName: sprint.name,
      description: `auto-completed sprint "${sprint.name}" — all tasks resolved via git workflow`,
      metadata: {
        extra: {
          autoCompleted: true,
          totalTasks: sprintTasks.length,
          doneTasks: sprintTasks.filter((t) => t.status === "done").length,
          cancelledTasks: sprintTasks.filter((t) => t.status === "cancelled")
            .length,
        },
      },
    });

    console.log(
      `[Sprint Auto-Complete] Sprint "${sprint.name}" auto-completed — all ${sprintTasks.length} tasks in completion status`,
    );

    return null;
  },
});
