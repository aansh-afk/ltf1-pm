import { v } from "convex/values";
import { mutation, query, internalMutation } from "../../_generated/server";

// Link a GitHub installation to a workspace (multi-installation support)
export const linkInstallationToWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    installationId: v.number(),
    isPrimary: v.optional(v.boolean()),
  },
  returns: v.id("workspaceGitHubInstallations"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace membership and permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can link GitHub installations");
    }

    // Verify the installation exists
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", args.installationId))
      .first();

    if (!installation) {
      throw new Error("GitHub installation not found");
    }

    // Get all workspace links and check if already linked
    const existingLinks = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const existingLink = existingLinks.find((l) => l.installationId === args.installationId);
    if (existingLink) {
      throw new Error("Installation already linked to this workspace");
    }

    // If this is marked as primary, unset other primary installations
    if (args.isPrimary) {
      for (const link of existingLinks) {
        if (link.isPrimary) {
          await ctx.db.patch(link._id, { isPrimary: false });
        }
      }
    }

    const isFirstInstallation = existingLinks.length === 0;

    // Create the link with proper schema fields
    const linkId = await ctx.db.insert("workspaceGitHubInstallations", {
      workspaceId: args.workspaceId,
      installationId: args.installationId,
      isPrimary: args.isPrimary ?? isFirstInstallation,
      accountLogin: installation.accountName,
      accountType: installation.accountType,
      syncSettings: {
        autoSyncIssues: false,
        bidirectionalSync: false,
        createTasksFromIssues: false,
        syncLabels: false,
      },
      addedBy: user._id,
      addedAt: Date.now(),
    });

    return linkId;
  },
});

// Unlink a GitHub installation from a workspace
export const unlinkInstallationFromWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace membership and permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can unlink GitHub installations");
    }

    // Find the link using by_workspace index and filter
    const allLinks = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const link = allLinks.find((l) => l.installationId === args.installationId);

    if (link) {
      const wasPrimary = link.isPrimary;
      await ctx.db.delete(link._id);

      // If the deleted link was primary, set another as primary
      if (wasPrimary) {
        const remainingLinks = allLinks.filter((l) => l._id !== link._id);
        if (remainingLinks.length > 0) {
          await ctx.db.patch(remainingLinks[0]._id, { isPrimary: true });
        }
      }
    }

    return null;
  },
});

// Set primary installation for a workspace
export const setPrimaryInstallation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace membership and permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can set primary installation");
    }

    // Get all workspace installations
    const links = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    let found = false;
    for (const link of links) {
      if (link.installationId === args.installationId) {
        await ctx.db.patch(link._id, { isPrimary: true });
        found = true;
      } else if (link.isPrimary) {
        await ctx.db.patch(link._id, { isPrimary: false });
      }
    }

    if (!found) {
      throw new Error("Installation not linked to this workspace");
    }

    return null;
  },
});

// Get available installations for linking (not yet linked to workspace)
export const getAvailableInstallations = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership) {
      throw new Error("Not a workspace member");
    }

    // Get all installations
    const allInstallations = await ctx.db
      .query("githubInstallations")
      .collect();

    // Get already linked installations
    const linkedInstallations = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const linkedIds = new Set(linkedInstallations.map((l) => l.installationId));

    // Return installations not yet linked
    return allInstallations.filter((i) => !linkedIds.has(i.installationId));
  },
});

// Internal mutation to auto-link installation when webhook is received
export const autoLinkInstallation = internalMutation({
  args: {
    installationId: v.number(),
    accountLogin: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Try to find workspaces that might want this installation
    // For now, don't auto-link - require manual linking for security
    // Enterprise users typically want explicit control over which
    // installations are linked to which workspaces

    console.log(`Auto-link check for installation ${args.installationId} (${args.accountLogin})`);
    return null;
  },
});

// Migrate legacy single installation to junction table
export const migrateLegacyInstallation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace membership and permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can migrate installations");
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Check if there's a legacy installation to migrate
    if (!workspace.settings?.integrations?.githubInstallationId) {
      return null; // Nothing to migrate
    }

    const legacyInstallationId = workspace.settings.integrations.githubInstallationId;

    // Check if already in junction table using by_workspace index and filter
    const existingLinks = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const existingLink = existingLinks.find((l) => l.installationId === legacyInstallationId);
    if (existingLink) {
      return null; // Already migrated
    }

    // Verify the installation exists
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", legacyInstallationId))
      .first();

    if (!installation) {
      return null; // Installation doesn't exist
    }

    // Create the link with proper schema fields
    await ctx.db.insert("workspaceGitHubInstallations", {
      workspaceId: args.workspaceId,
      installationId: legacyInstallationId,
      isPrimary: true,
      accountLogin: installation.accountName,
      accountType: installation.accountType,
      syncSettings: {
        autoSyncIssues: false,
        bidirectionalSync: false,
        createTasksFromIssues: false,
        syncLabels: false,
      },
      addedBy: user._id,
      addedAt: installation.installedAt || Date.now(),
    });

    console.log(`Migrated legacy installation ${legacyInstallationId} for workspace ${args.workspaceId}`);
    return null;
  },
});

// Update sync settings for an installation link
export const updateSyncSettings = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    installationId: v.number(),
    syncSettings: v.object({
      autoSyncIssues: v.boolean(),
      bidirectionalSync: v.boolean(),
      createTasksFromIssues: v.boolean(),
      syncLabels: v.boolean(),
      defaultProjectId: v.optional(v.id("projects")),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check workspace membership and permissions
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only workspace admins can update sync settings");
    }

    // Find the link
    const allLinks = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const link = allLinks.find((l) => l.installationId === args.installationId);

    if (!link) {
      throw new Error("Installation not linked to this workspace");
    }

    await ctx.db.patch(link._id, {
      syncSettings: args.syncSettings,
    });

    return null;
  },
});
