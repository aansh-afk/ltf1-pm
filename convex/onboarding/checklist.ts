import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Status of the new-user Getting Started checklist surfaced on the dashboard.
 * Each flag represents a setup step that unlocks real product value. Demo
 * rows are intentionally ignored — the checklist's job is to nudge users
 * past the seeded tour into their own workspace.
 */
export const getChecklistStatus = query({
  args: {},
  returns: v.object({
    hasGitHub: v.boolean(),
    hasWorkspace: v.boolean(),
    hasProject: v.boolean(),
    hasConnectedRepo: v.boolean(),
    hasTeammate: v.boolean(),
    firstWorkspaceId: v.union(v.id("workspaces"), v.null()),
    firstProjectId: v.union(v.id("projects"), v.null()),
    completed: v.number(),
    total: v.number(),
    allDone: v.boolean(),
  }),
  handler: async (ctx) => {
    const zero = {
      hasGitHub: false,
      hasWorkspace: false,
      hasProject: false,
      hasConnectedRepo: false,
      hasTeammate: false,
      firstWorkspaceId: null,
      firstProjectId: null,
      completed: 0,
      total: 5,
      allDone: false,
    } as const;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return zero;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return zero;

    // GitHub: either the Clerk-side token has been validated, or a
    // githubConnections row exists for this user.
    let hasGitHub = user.githubTokenValidated === true;
    if (!hasGitHub) {
      const conn = await ctx.db
        .query("githubConnections")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      hasGitHub = conn !== null;
    }

    // First non-demo workspace the user belongs to.
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let firstWorkspaceId: Id<"workspaces"> | null = null;
    for (const m of memberships) {
      const ws = await ctx.db.get(m.workspaceId);
      if (ws && ws.isDemo !== true) {
        firstWorkspaceId = ws._id;
        break;
      }
    }
    const hasWorkspace = firstWorkspaceId !== null;

    // First non-demo project + whether any of them has a connected repo.
    let firstProjectId: Id<"projects"> | null = null;
    let hasConnectedRepo = false;
    if (firstWorkspaceId) {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", firstWorkspaceId!))
        .collect();
      for (const p of projects) {
        if (p.isDemo === true) continue;
        if (firstProjectId === null) firstProjectId = p._id;
        if (p.repository) {
          hasConnectedRepo = true;
          break;
        }
      }
    }
    const hasProject = firstProjectId !== null;

    // More than one member on any non-demo workspace the user belongs to.
    let hasTeammate = false;
    for (const m of memberships) {
      const ws = await ctx.db.get(m.workspaceId);
      if (!ws || ws.isDemo === true) continue;
      const members = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", m.workspaceId))
        .collect();
      if (members.length > 1) {
        hasTeammate = true;
        break;
      }
    }

    const flags = [hasGitHub, hasWorkspace, hasProject, hasConnectedRepo, hasTeammate];
    const completed = flags.filter(Boolean).length;

    return {
      hasGitHub,
      hasWorkspace,
      hasProject,
      hasConnectedRepo,
      hasTeammate,
      firstWorkspaceId,
      firstProjectId,
      completed,
      total: 5,
      allDone: completed === 5,
    };
  },
});
