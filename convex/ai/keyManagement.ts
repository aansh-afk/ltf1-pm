import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { getCurrentUser } from "../lib/auth";
import { hasProjectPermission } from "../auth/permissions";
import { encryptSecret, maskSecret } from "../lib/secrets";

// Authorize that the calling identity owns the requested scope.
// - "user" scope must match the caller's Clerk subject.
// - "project" scope requires at least project.edit permission.
// Returns null when unauthorized so callers can return safe empty results.
async function authorizeScope(
  ctx: any,
  scope: "user" | "project",
  scopeId: string,
): Promise<{ identitySubject: string } | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  if (scope === "user") {
    if (scopeId !== identity.subject) return null;
    return { identitySubject: identity.subject };
  }

  // scope === "project": verify caller has project.edit permission
  const user = await getCurrentUser(ctx);
  if (!user) return null;

  const allowed = await hasProjectPermission(
    ctx.db,
    user._id,
    scopeId as Id<"projects">,
    "project.edit",
  );
  if (!allowed) return null;

  return { identitySubject: identity.subject };
}

// ─── Queries ────────────────────────────────────────────────────────────

// List provider keys for a given scope (mask the actual key)
export const getProviderKeys = query({
  args: {
    scope: v.union(v.literal("user"), v.literal("project")),
    scopeId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("aiProviderKeys"),
      scope: v.union(v.literal("user"), v.literal("project")),
      scopeId: v.string(),
      provider: v.union(v.literal("cerebras"), v.literal("groq")),
      displayName: v.optional(v.string()),
      defaultModel: v.optional(v.string()),
      modelOverrides: v.optional(v.record(v.string(), v.string())),
      isActive: v.boolean(),
      lastValidatedAt: v.optional(v.number()),
      lastUsedAt: v.optional(v.number()),
      maskedKey: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const auth = await authorizeScope(ctx, args.scope, args.scopeId);
    if (!auth) return [];

    const keys = await ctx.db
      .query("aiProviderKeys")
      .withIndex("by_scope_and_id", (q) =>
        q.eq("scope", args.scope).eq("scopeId", args.scopeId)
      )
      .collect();

    return await Promise.all(
      keys.map(async (k) => ({
        _id: k._id,
        scope: k.scope,
        scopeId: k.scopeId,
        provider: k.provider,
        displayName: k.displayName,
        defaultModel: k.defaultModel,
        modelOverrides: k.modelOverrides,
        isActive: k.isActive,
        lastValidatedAt: k.lastValidatedAt,
        lastUsedAt: k.lastUsedAt,
        maskedKey: await maskSecret(k.encryptedApiKey),
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      })),
    );
  },
});

// Get user's provider keys (convenience wrapper using clerk identity)
export const getMyProviderKeys = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("aiProviderKeys"),
      scope: v.union(v.literal("user"), v.literal("project")),
      scopeId: v.string(),
      provider: v.union(v.literal("cerebras"), v.literal("groq")),
      displayName: v.optional(v.string()),
      defaultModel: v.optional(v.string()),
      modelOverrides: v.optional(v.record(v.string(), v.string())),
      isActive: v.boolean(),
      lastValidatedAt: v.optional(v.number()),
      lastUsedAt: v.optional(v.number()),
      maskedKey: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const keys = await ctx.db
      .query("aiProviderKeys")
      .withIndex("by_scope_and_id", (q) =>
        q.eq("scope", "user").eq("scopeId", identity.subject)
      )
      .collect();

    return await Promise.all(
      keys.map(async (k) => ({
        _id: k._id,
        scope: k.scope,
        scopeId: k.scopeId,
        provider: k.provider,
        displayName: k.displayName,
        defaultModel: k.defaultModel,
        modelOverrides: k.modelOverrides,
        isActive: k.isActive,
        lastValidatedAt: k.lastValidatedAt,
        lastUsedAt: k.lastUsedAt,
        maskedKey: await maskSecret(k.encryptedApiKey),
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      })),
    );
  },
});

// Get project AI settings
export const getProjectAISettings = query({
  args: { projectId: v.id("projects") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("projectAISettings"),
      projectId: v.id("projects"),
      activeKeyId: v.optional(v.id("aiProviderKeys")),
      functionModelMap: v.optional(
        v.record(
          v.string(),
          v.object({
            provider: v.union(v.literal("cerebras"), v.literal("groq")),
            model: v.string(),
          })
        )
      ),
      aiEnabled: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db
      .query("projectAISettings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (!settings) return null;

    return {
      _id: settings._id,
      projectId: settings.projectId,
      activeKeyId: settings.activeKeyId,
      functionModelMap: settings.functionModelMap,
      aiEnabled: settings.aiEnabled,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────

// Save a new provider key (validate first, then encrypt and store)
export const saveProviderKey = action({
  args: {
    scope: v.union(v.literal("user"), v.literal("project")),
    scopeId: v.string(),
    provider: v.union(v.literal("cerebras"), v.literal("groq")),
    apiKey: v.string(),
    displayName: v.optional(v.string()),
    defaultModel: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    keyId: v.optional(v.id("aiProviderKeys")),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Authorize scope before any provider validation or storage. Actions
    // cannot run hasProjectPermission directly, so we delegate to an
    // internal query that performs the same scope check.
    const authorized: boolean = await ctx.runQuery(
      internal.ai.keyManagement.canManageScope,
      { scope: args.scope, scopeId: args.scopeId },
    );
    if (!authorized) {
      return { success: false, error: "Not authorized for this scope" };
    }

    // Validate the key first
    const validation: { isValid: boolean; error?: string } = await ctx.runAction(
      internal.ai.providers.validateProviderKey,
      {
        provider: args.provider,
        apiKey: args.apiKey,
      }
    );

    if (!validation.isValid) {
      return { success: false, error: validation.error || "Invalid API key" };
    }

    // Encrypt with AES-GCM and store. Old rows persist as legacy `btoa`
    // payloads and are decoded transparently by decryptSecret().
    const encryptedApiKey = await encryptSecret(args.apiKey);
    const keyId: any = await ctx.runMutation(internal.ai.keyManagement.insertProviderKey, {
      scope: args.scope,
      scopeId: args.scopeId,
      provider: args.provider,
      encryptedApiKey,
      displayName: args.displayName,
      defaultModel: args.defaultModel,
    });

    return { success: true, keyId };
  },
});

import { internalMutation, internalQuery } from "../_generated/server";

// Internal scope-authorization query usable from actions.
export const canManageScope = internalQuery({
  args: {
    scope: v.union(v.literal("user"), v.literal("project")),
    scopeId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const auth = await authorizeScope(ctx, args.scope, args.scopeId);
    return auth !== null;
  },
});

// Internal mutation to insert a provider key
export const insertProviderKey = internalMutation({
  args: {
    scope: v.union(v.literal("user"), v.literal("project")),
    scopeId: v.string(),
    provider: v.union(v.literal("cerebras"), v.literal("groq")),
    encryptedApiKey: v.string(),
    displayName: v.optional(v.string()),
    defaultModel: v.optional(v.string()),
  },
  returns: v.id("aiProviderKeys"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Deactivate existing keys for the same scope+provider
    const existingKeys = await ctx.db
      .query("aiProviderKeys")
      .withIndex("by_scope_id_and_provider", (q) =>
        q.eq("scopeId", args.scopeId).eq("provider", args.provider)
      )
      .collect();

    for (const key of existingKeys) {
      if (key.scope === args.scope) {
        await ctx.db.patch(key._id, { isActive: false, updatedAt: now });
      }
    }

    // Insert new key
    return await ctx.db.insert("aiProviderKeys", {
      scope: args.scope,
      scopeId: args.scopeId,
      provider: args.provider,
      encryptedApiKey: args.encryptedApiKey,
      displayName: args.displayName,
      defaultModel: args.defaultModel,
      isActive: true,
      lastValidatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Remove a provider key
export const removeProviderKey = mutation({
  args: { keyId: v.id("aiProviderKeys") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("Key not found");

    // Verify ownership: caller must own the user/project scope this key
    // belongs to.
    const auth = await authorizeScope(ctx, key.scope, key.scopeId);
    if (!auth) throw new Error("Not authorized");

    await ctx.db.delete(args.keyId);

    // Also unset activeKeyId from any project settings pointing to this key
    const projectSettings = await ctx.db
      .query("projectAISettings")
      .collect();

    for (const ps of projectSettings) {
      if (ps.activeKeyId === args.keyId) {
        await ctx.db.patch(ps._id, {
          activeKeyId: undefined,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Update a provider key's settings
export const updateProviderKey = mutation({
  args: {
    keyId: v.id("aiProviderKeys"),
    displayName: v.optional(v.string()),
    defaultModel: v.optional(v.string()),
    modelOverrides: v.optional(v.record(v.string(), v.string())),
    isActive: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("Key not found");

    // Verify ownership: caller must own the user/project scope this key
    // belongs to.
    const auth = await authorizeScope(ctx, key.scope, key.scopeId);
    if (!auth) throw new Error("Not authorized");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.defaultModel !== undefined) updates.defaultModel = args.defaultModel;
    if (args.modelOverrides !== undefined) updates.modelOverrides = args.modelOverrides;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.keyId, updates);

    return { success: true };
  },
});

// Update project AI settings
export const updateProjectAISettings = mutation({
  args: {
    projectId: v.id("projects"),
    aiEnabled: v.optional(v.boolean()),
    activeKeyId: v.optional(v.id("aiProviderKeys")),
    functionModelMap: v.optional(
      v.record(
        v.string(),
        v.object({
          provider: v.union(v.literal("cerebras"), v.literal("groq")),
          model: v.string(),
        })
      )
    ),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Project AI settings require project.edit permission, just like other
    // project-scoped key operations.
    const auth = await authorizeScope(ctx, "project", args.projectId);
    if (!auth) throw new Error("Not authorized");

    const now = Date.now();

    const existing = await ctx.db
      .query("projectAISettings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (existing) {
      const updates: Record<string, any> = { updatedAt: now };
      if (args.aiEnabled !== undefined) updates.aiEnabled = args.aiEnabled;
      if (args.activeKeyId !== undefined) updates.activeKeyId = args.activeKeyId;
      if (args.functionModelMap !== undefined) updates.functionModelMap = args.functionModelMap;

      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("projectAISettings", {
        projectId: args.projectId,
        aiEnabled: args.aiEnabled ?? true,
        activeKeyId: args.activeKeyId,
        functionModelMap: args.functionModelMap,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
