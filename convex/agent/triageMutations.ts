import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { getCurrentUserOrThrow } from "../lib/auth";

// ─── Internal Mutations ──────────────────────────────────────────────────

export const applyTriageSuggestion = internalMutation({
  args: {
    taskId: v.id("tasks"),
    suggestedType: v.optional(v.string()),
    suggestedPriority: v.optional(v.string()),
    suggestedAssigneeIds: v.optional(v.array(v.id("users"))),
    suggestedLabels: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.suggestedType) {
      updates.type = args.suggestedType;
    }
    if (args.suggestedPriority) {
      updates.priority = args.suggestedPriority;
    }
    if (args.suggestedAssigneeIds && args.suggestedAssigneeIds.length > 0) {
      updates.assigneeIds = args.suggestedAssigneeIds;
    }
    if (args.suggestedLabels && args.suggestedLabels.length > 0) {
      // Merge with existing labels
      const existing = new Set(task.labels || []);
      for (const l of args.suggestedLabels) {
        existing.add(l);
      }
      updates.labels = Array.from(existing);
    }

    await ctx.db.patch(args.taskId, updates);
    return null;
  },
});

export const createTriageSuggestionRecord = internalMutation({
  args: {
    taskId: v.id("tasks"),
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    suggestedType: v.optional(v.string()),
    suggestedPriority: v.optional(v.string()),
    suggestedAssigneeIds: v.optional(v.array(v.id("users"))),
    suggestedLabels: v.optional(v.array(v.string())),
    duplicateOfTaskId: v.optional(v.id("tasks")),
    confidence: v.number(),
    reasoning: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("partial"), v.literal("auto_applied")),
    autoApplied: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("triageSuggestions", {
      taskId: args.taskId,
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      suggestedType: args.suggestedType,
      suggestedPriority: args.suggestedPriority,
      suggestedAssigneeIds: args.suggestedAssigneeIds,
      suggestedLabels: args.suggestedLabels,
      duplicateOfTaskId: args.duplicateOfTaskId,
      confidence: args.confidence,
      reasoning: args.reasoning,
      status: args.status,
      autoApplied: args.autoApplied,
    });
    return null;
  },
});

export const logAgentActivity = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    type: v.union(v.literal("triage"), v.literal("skill_run"), v.literal("auto_assign"), v.literal("insight"), v.literal("skill_auto_apply")),
    taskId: v.optional(v.id("tasks")),
    skillId: v.optional(v.id("skills")),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("agentActivities", {
      workspaceId: args.workspaceId,
      type: args.type,
      taskId: args.taskId,
      skillId: args.skillId,
      description: args.description,
      metadata: args.metadata,
    });
    return null;
  },
});

// ─── Public Mutations (auth-gated) ───────────────────────────────────────

export const acceptTriageSuggestion = mutation({
  args: {
    suggestionId: v.id("triageSuggestions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    if (suggestion.status !== "pending") throw new Error("Suggestion is not pending");

    // Verify workspace membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", suggestion.workspaceId).eq("userId", user._id)
      )
      .first();
    if (!membership) throw new Error("Not a member of this workspace");

    // Apply the suggestion to the task
    const task = await ctx.db.get(suggestion.taskId);
    if (!task) throw new Error("Task not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (suggestion.suggestedType) updates.type = suggestion.suggestedType;
    if (suggestion.suggestedPriority) updates.priority = suggestion.suggestedPriority;
    if (suggestion.suggestedAssigneeIds && suggestion.suggestedAssigneeIds.length > 0) {
      updates.assigneeIds = suggestion.suggestedAssigneeIds;
    }
    if (suggestion.suggestedLabels && suggestion.suggestedLabels.length > 0) {
      const existing = new Set(task.labels || []);
      for (const l of suggestion.suggestedLabels) existing.add(l);
      updates.labels = Array.from(existing);
    }

    await ctx.db.patch(suggestion.taskId, updates);

    // Update suggestion status
    await ctx.db.patch(args.suggestionId, {
      status: "accepted" as const,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("agentActivities", {
      workspaceId: suggestion.workspaceId,
      type: "triage",
      taskId: suggestion.taskId,
      description: `Triage suggestion accepted by ${user.name || user.email}`,
      metadata: { action: "accepted", reviewedBy: user._id },
    });

    return null;
  },
});

export const rejectTriageSuggestion = mutation({
  args: {
    suggestionId: v.id("triageSuggestions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    if (suggestion.status !== "pending") throw new Error("Suggestion is not pending");

    // Verify workspace membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", suggestion.workspaceId).eq("userId", user._id)
      )
      .first();
    if (!membership) throw new Error("Not a member of this workspace");

    // Update suggestion status
    await ctx.db.patch(args.suggestionId, {
      status: "rejected" as const,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("agentActivities", {
      workspaceId: suggestion.workspaceId,
      type: "triage",
      taskId: suggestion.taskId,
      description: `Triage suggestion rejected by ${user.name || user.email}`,
      metadata: { action: "rejected", reviewedBy: user._id },
    });

    return null;
  },
});

export const modifyAndAcceptTriageSuggestion = mutation({
  args: {
    suggestionId: v.id("triageSuggestions"),
    type: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigneeIds: v.optional(v.array(v.id("users"))),
    labels: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    if (suggestion.status !== "pending") throw new Error("Suggestion is not pending");

    // Verify workspace membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", suggestion.workspaceId).eq("userId", user._id)
      )
      .first();
    if (!membership) throw new Error("Not a member of this workspace");

    // Apply modified fields to the task
    const task = await ctx.db.get(suggestion.taskId);
    if (!task) throw new Error("Task not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    // Use provided overrides, falling back to suggestion values
    const finalType = args.type || suggestion.suggestedType;
    const finalPriority = args.priority || suggestion.suggestedPriority;
    const finalAssigneeIds = args.assigneeIds || suggestion.suggestedAssigneeIds;
    const finalLabels = args.labels || suggestion.suggestedLabels;

    if (finalType) updates.type = finalType;
    if (finalPriority) updates.priority = finalPriority;
    if (finalAssigneeIds && finalAssigneeIds.length > 0) {
      updates.assigneeIds = finalAssigneeIds;
    }
    if (finalLabels && finalLabels.length > 0) {
      const existing = new Set(task.labels || []);
      for (const l of finalLabels) existing.add(l);
      updates.labels = Array.from(existing);
    }

    await ctx.db.patch(suggestion.taskId, updates);

    // Update suggestion status
    await ctx.db.patch(args.suggestionId, {
      status: "partial" as const,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("agentActivities", {
      workspaceId: suggestion.workspaceId,
      type: "triage",
      taskId: suggestion.taskId,
      description: `Triage suggestion modified and accepted by ${user.name || user.email}`,
      metadata: {
        action: "partial",
        reviewedBy: user._id,
        modifications: {
          type: args.type,
          priority: args.priority,
          assigneeIds: args.assigneeIds,
          labels: args.labels,
        },
      },
    });

    return null;
  },
});
