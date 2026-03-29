import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "../lib/auth";
import { requirePermission } from "../auth/permissions";
import { BUILT_IN_SKILLS } from "./builtInSkills";

/**
 * Create a custom skill in a workspace.
 */
export const createSkill = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    trigger: v.union(
      v.literal("manual"),
      v.literal("auto"),
      v.literal("both"),
    ),
    conditions: v.optional(
      v.object({
        taskTypes: v.optional(v.array(v.string())),
        keywords: v.optional(v.array(v.string())),
        sources: v.optional(v.array(v.string())),
      }),
    ),
    actions: v.array(
      v.object({
        type: v.string(),
        config: v.any(),
      }),
    ),
  },
  returns: v.id("skills"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await requirePermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "workspace.edit",
    );

    // Check for duplicate name within workspace
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_workspaceId_and_name", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("name", args.name),
      )
      .first();

    if (existing) {
      throw new Error(`A skill with the name "${args.name}" already exists`);
    }

    const skillId = await ctx.db.insert("skills", {
      workspaceId: args.workspaceId,
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      trigger: args.trigger,
      conditions: args.conditions,
      actions: args.actions,
      createdBy: user._id,
      isActive: true,
      isBuiltIn: false,
      isPublished: false,
      usageCount: 0,
    });

    return skillId;
  },
});

/**
 * Update an existing skill. Cannot update built-in skill name.
 */
export const updateSkill = mutation({
  args: {
    skillId: v.id("skills"),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    trigger: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("auto"),
        v.literal("both"),
      ),
    ),
    conditions: v.optional(
      v.object({
        taskTypes: v.optional(v.array(v.string())),
        keywords: v.optional(v.array(v.string())),
        sources: v.optional(v.array(v.string())),
      }),
    ),
    actions: v.optional(
      v.array(
        v.object({
          type: v.string(),
          config: v.any(),
        }),
      ),
    ),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("skills"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    await requirePermission(
      ctx.db,
      user._id,
      skill.workspaceId,
      "workspace.edit",
    );

    const updates: Record<string, unknown> = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.description !== undefined) updates.description = args.description;
    if (args.trigger !== undefined) updates.trigger = args.trigger;
    if (args.conditions !== undefined) updates.conditions = args.conditions;
    if (args.actions !== undefined) updates.actions = args.actions;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.skillId, updates);

    return args.skillId;
  },
});

/**
 * Delete a custom skill. Cannot delete built-in skills.
 */
export const deleteSkill = mutation({
  args: {
    skillId: v.id("skills"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    await requirePermission(
      ctx.db,
      user._id,
      skill.workspaceId,
      "workspace.edit",
    );

    if (skill.isBuiltIn) {
      throw new Error("Cannot delete built-in skills. Disable them instead.");
    }

    await ctx.db.delete(args.skillId);

    return null;
  },
});

/**
 * Toggle a skill's isActive state.
 */
export const toggleSkill = mutation({
  args: {
    skillId: v.id("skills"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    await requirePermission(
      ctx.db,
      user._id,
      skill.workspaceId,
      "workspace.edit",
    );

    const newState = !skill.isActive;
    await ctx.db.patch(args.skillId, { isActive: newState });

    return newState;
  },
});

/**
 * Publish a skill to the marketplace.
 */
export const publishSkill = mutation({
  args: {
    skillId: v.id("skills"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    await requirePermission(
      ctx.db,
      user._id,
      skill.workspaceId,
      "workspace.edit",
    );

    await ctx.db.patch(args.skillId, { isPublished: true });

    return null;
  },
});

/**
 * Unpublish a skill from the marketplace.
 */
export const unpublishSkill = mutation({
  args: {
    skillId: v.id("skills"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    await requirePermission(
      ctx.db,
      user._id,
      skill.workspaceId,
      "workspace.edit",
    );

    await ctx.db.patch(args.skillId, { isPublished: false });

    return null;
  },
});

/**
 * Install a published skill into a workspace (copy it).
 */
export const installSkill = mutation({
  args: {
    sourceSkillId: v.id("skills"),
    workspaceId: v.id("workspaces"),
  },
  returns: v.id("skills"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await requirePermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "workspace.edit",
    );

    const sourceSkill = await ctx.db.get(args.sourceSkillId);
    if (!sourceSkill) {
      throw new Error("Source skill not found");
    }

    if (!sourceSkill.isPublished) {
      throw new Error("Can only install published skills");
    }

    // Check for duplicate name in target workspace
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_workspaceId_and_name", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("name", sourceSkill.name),
      )
      .first();

    const skillName = existing
      ? `${sourceSkill.name}-copy-${Date.now()}`
      : sourceSkill.name;

    const skillId = await ctx.db.insert("skills", {
      workspaceId: args.workspaceId,
      name: skillName,
      displayName: sourceSkill.displayName,
      description: sourceSkill.description,
      trigger: sourceSkill.trigger,
      conditions: sourceSkill.conditions,
      actions: sourceSkill.actions,
      createdBy: user._id,
      isActive: true,
      isBuiltIn: false,
      isPublished: false,
      usageCount: 0,
    });

    return skillId;
  },
});

/**
 * Seed built-in skills into a workspace. Called when a workspace is created.
 * Internal mutation -- not exposed publicly.
 */
export const seedBuiltInSkills = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    createdBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const template of BUILT_IN_SKILLS) {
      // Skip if already seeded
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_workspaceId_and_name", (q) =>
          q
            .eq("workspaceId", args.workspaceId)
            .eq("name", template.name),
        )
        .first();

      if (existing) {
        continue;
      }

      await ctx.db.insert("skills", {
        workspaceId: args.workspaceId,
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        trigger: template.trigger,
        conditions: template.conditions as
          | {
              taskTypes?: string[];
              keywords?: string[];
              sources?: string[];
            }
          | undefined,
        actions: template.actions.map((a) => ({
          type: a.type,
          config: a.config,
        })),
        createdBy: args.createdBy,
        isActive: template.isActive,
        isBuiltIn: template.isBuiltIn,
        isPublished: false,
        usageCount: 0,
      });
    }

    return null;
  },
});
