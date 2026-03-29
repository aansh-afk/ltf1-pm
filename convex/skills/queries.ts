import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../lib/auth";
import { hasPermission } from "../auth/permissions";
import { BUILT_IN_SKILLS } from "./builtInSkills";

/**
 * Get all skills for a workspace (custom + built-in that were seeded).
 */
export const getWorkspaceSkills = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(
    v.object({
      _id: v.id("skills"),
      _creationTime: v.number(),
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
      createdBy: v.id("users"),
      isActive: v.boolean(),
      isBuiltIn: v.optional(v.boolean()),
      isPublished: v.optional(v.boolean()),
      usageCount: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "workspace.view",
    );
    if (!hasAccess) {
      return [];
    }

    const skills = await ctx.db
      .query("skills")
      .withIndex("by_workspaceId", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();

    return skills;
  },
});

/**
 * Get a single skill by ID with auth check.
 */
export const getSkillById = query({
  args: {
    skillId: v.id("skills"),
  },
  returns: v.union(
    v.object({
      _id: v.id("skills"),
      _creationTime: v.number(),
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
      createdBy: v.id("users"),
      isActive: v.boolean(),
      isBuiltIn: v.optional(v.boolean()),
      isPublished: v.optional(v.boolean()),
      usageCount: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      return null;
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      skill.workspaceId,
      "workspace.view",
    );
    if (!hasAccess) {
      return null;
    }

    return skill;
  },
});

/**
 * Get all built-in skill templates (static data, no workspace needed).
 * Returns the constant definitions so the UI can display them before seeding.
 */
export const getBuiltInSkills = query({
  args: {},
  returns: v.array(
    v.object({
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
      isBuiltIn: v.boolean(),
      isActive: v.boolean(),
    }),
  ),
  handler: async (_ctx, _args) => {
    return BUILT_IN_SKILLS.map((skill) => ({
      name: skill.name,
      displayName: skill.displayName,
      description: skill.description,
      trigger: skill.trigger,
      conditions: skill.conditions as
        | {
            taskTypes?: string[];
            keywords?: string[];
            sources?: string[];
          }
        | undefined,
      actions: skill.actions.map((a) => ({
        type: a.type,
        config: a.config,
      })),
      isBuiltIn: skill.isBuiltIn,
      isActive: skill.isActive,
    }));
  },
});

/**
 * Get published skills for the marketplace.
 */
export const getPublishedSkills = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("skills"),
      _creationTime: v.number(),
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
      createdBy: v.id("users"),
      isActive: v.boolean(),
      isBuiltIn: v.optional(v.boolean()),
      isPublished: v.optional(v.boolean()),
      usageCount: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const maxResults = args.limit ?? 50;

    const skills = await ctx.db
      .query("skills")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .take(maxResults);

    return skills;
  },
});

/**
 * Get usage stats (usage count per skill) for a workspace.
 */
export const getSkillUsageStats = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.array(
    v.object({
      skillId: v.id("skills"),
      name: v.string(),
      displayName: v.string(),
      usageCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const hasAccess = await hasPermission(
      ctx.db,
      user._id,
      args.workspaceId,
      "workspace.view",
    );
    if (!hasAccess) {
      return [];
    }

    const skills = await ctx.db
      .query("skills")
      .withIndex("by_workspaceId", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .collect();

    return skills.map((skill) => ({
      skillId: skill._id,
      name: skill.name,
      displayName: skill.displayName,
      usageCount: skill.usageCount ?? 0,
    }));
  },
});
