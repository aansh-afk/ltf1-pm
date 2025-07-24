import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createFilterPreset = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    filters: v.any()
  },
  handler: async (ctx, { workspaceId, name, filters }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    const presetId = await ctx.db.insert("filterPresets", {
      workspaceId,
      userId: user._id,
      name: name.trim(),
      filters,
      createdAt: now,
      updatedAt: now
    });

    return presetId;
  }
});

export const updateFilterPreset = mutation({
  args: {
    presetId: v.id("filterPresets"),
    name: v.optional(v.string()),
    filters: v.optional(v.any())
  },
  handler: async (ctx, { presetId, name, filters }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const preset = await ctx.db.get(presetId);
    if (!preset) {
      throw new Error("Preset not found");
    }

    if (preset.userId !== user._id) {
      throw new Error("Access denied");
    }

    const updates: any = {
      updatedAt: Date.now()
    };

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (filters !== undefined) {
      updates.filters = filters;
    }

    await ctx.db.patch(presetId, updates);
  }
});

export const deleteFilterPreset = mutation({
  args: {
    presetId: v.id("filterPresets")
  },
  handler: async (ctx, { presetId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const preset = await ctx.db.get(presetId);
    if (!preset) {
      throw new Error("Preset not found");
    }

    if (preset.userId !== user._id) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(presetId);
  }
});