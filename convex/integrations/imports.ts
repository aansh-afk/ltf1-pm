import { v } from "convex/values";
import { query, internalMutation } from "../_generated/server";
import { getCurrentUserOrThrow } from "../lib/auth";

const sourceValidator = v.union(v.literal("linear"), v.literal("jira"));
const statusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);

const progressValidator = v.object({
  projectsCreated: v.number(),
  tasksCreated: v.number(),
  tasksUpdated: v.number(),
  tasksSkipped: v.number(),
  sprintsCreated: v.number(),
  total: v.number(),
  currentStep: v.string(),
});

const importDocValidator = v.object({
  _id: v.id("imports"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  source: sourceValidator,
  status: statusValidator,
  triggeredBy: v.id("users"),
  params: v.object({
    externalScopeId: v.string(),
    externalScopeName: v.string(),
    jiraHost: v.optional(v.string()),
    targetProjectId: v.optional(v.id("projects")),
  }),
  progress: progressValidator,
  error: v.optional(v.string()),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
});

export const getImport = query({
  args: { importId: v.id("imports") },
  returns: v.union(importDocValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const doc = await ctx.db.get(args.importId);
    if (!doc) return null;
    // Only the triggerer can poll their own import job
    if (doc.triggeredBy !== user._id) return null;
    return doc;
  },
});

export const listImports = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(importDocValidator),
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("imports")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(20);
  },
});

export const createImportJob = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    source: sourceValidator,
    triggeredBy: v.id("users"),
    params: v.object({
      externalScopeId: v.string(),
      externalScopeName: v.string(),
      jiraHost: v.optional(v.string()),
      targetProjectId: v.optional(v.id("projects")),
    }),
  },
  returns: v.id("imports"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("imports", {
      workspaceId: args.workspaceId,
      source: args.source,
      status: "pending",
      triggeredBy: args.triggeredBy,
      params: args.params,
      progress: {
        projectsCreated: 0,
        tasksCreated: 0,
        tasksUpdated: 0,
        tasksSkipped: 0,
        sprintsCreated: 0,
        total: 0,
        currentStep: "Queued",
      },
      startedAt: Date.now(),
    });
  },
});

export const updateImportProgress = internalMutation({
  args: {
    importId: v.id("imports"),
    status: v.optional(statusValidator),
    progress: v.optional(progressValidator),
    error: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};
    if (args.status !== undefined) patch.status = args.status;
    if (args.progress !== undefined) patch.progress = args.progress;
    if (args.error !== undefined) patch.error = args.error;
    if (args.completedAt !== undefined) patch.completedAt = args.completedAt;
    await ctx.db.patch(args.importId, patch);
    return null;
  },
});
