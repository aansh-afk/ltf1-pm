import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "../lib/auth";
import { getUserWorkspaceRole } from "../auth/permissions";

/**
 * Update the workspace's triage mode setting.
 * Requires admin or owner role in the workspace.
 */
export const updateTriageSettings = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    triageMode: v.union(
      v.literal("auto"),
      v.literal("review"),
      v.literal("off"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Verify workspace membership and admin/owner role
    const membership = await getUserWorkspaceRole(
      ctx.db,
      user._id,
      args.workspaceId,
    );
    if (!membership) {
      throw new Error("Not authorized: not a workspace member");
    }
    if (membership.role !== "admin" && membership.role !== "owner") {
      throw new Error(
        "Not authorized: only admins and owners can change triage settings",
      );
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Update workspace settings with new triageMode
    await ctx.db.patch(args.workspaceId, {
      settings: {
        ...workspace.settings,
        triageMode: args.triageMode,
      },
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("agentActivities", {
      workspaceId: args.workspaceId,
      type: "insight",
      description: `Triage mode updated to "${args.triageMode}" by ${user.name}`,
      metadata: {
        previousMode: workspace.settings.triageMode ?? "off",
        newMode: args.triageMode,
        changedBy: user._id,
      },
    });

    return null;
  },
});
