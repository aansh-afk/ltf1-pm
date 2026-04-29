import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getCurrentUserOrThrow } from "../lib/auth";
import { getWorkspacePlan, getWorkspaceSeatInfo } from "./featureGates";

export const getSubscriptionStatus = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.union(
    v.object({
      plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
      status: v.union(
        v.literal("active"),
        v.literal("trialing"),
        v.literal("past_due"),
        v.literal("cancelled"),
        v.literal("incomplete"),
        v.literal("none"),
      ),
      seatsUsed: v.number(),
      seatsAvailable: v.number(),
      canAddMore: v.boolean(),
      billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
      currentPeriodEnd: v.optional(v.number()),
      cancelledAt: v.optional(v.number()),
      polarCustomerId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Verify user is a member of this workspace
    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id),
      )
      .first();

    if (!member) {
      return null;
    }

    const seatInfo = await getWorkspaceSeatInfo(ctx.db, args.workspaceId);

    // Check for active subscription record
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (subscription) {
      return {
        plan: seatInfo.plan,
        status: subscription.status,
        seatsUsed: seatInfo.seatsUsed,
        seatsAvailable: seatInfo.seatsAvailable,
        canAddMore: seatInfo.canAddMore,
        billingCycle: subscription.billingCycle,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        polarCustomerId: subscription.polarCustomerId,
      };
    }

    return {
      plan: seatInfo.plan,
      status: "none" as const,
      seatsUsed: seatInfo.seatsUsed,
      seatsAvailable: seatInfo.seatsAvailable,
      canAddMore: seatInfo.canAddMore,
    };
  },
});

export const canAddMembers = query({
  args: {
    workspaceId: v.id("workspaces"),
    count: v.number(),
  },
  returns: v.object({
    allowed: v.boolean(),
    reason: v.optional(v.string()),
    seatsUsed: v.number(),
    seatsAvailable: v.number(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  }),
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const seatInfo = await getWorkspaceSeatInfo(ctx.db, args.workspaceId);

    if (seatInfo.seatsUsed + args.count > seatInfo.seatsAvailable) {
      const reason =
        seatInfo.plan === "free"
          ? `Free plan allows up to ${seatInfo.seatsAvailable} members. You currently have ${seatInfo.seatsUsed}. Upgrade to Pro for unlimited members.`
          : `Your subscription allows ${seatInfo.seatsAvailable} seats. You currently have ${seatInfo.seatsUsed}. Please add more seats to your subscription.`;

      return {
        allowed: false,
        reason,
        seatsUsed: seatInfo.seatsUsed,
        seatsAvailable: seatInfo.seatsAvailable,
        plan: seatInfo.plan,
      };
    }

    return {
      allowed: true,
      seatsUsed: seatInfo.seatsUsed,
      seatsAvailable: seatInfo.seatsAvailable,
      plan: seatInfo.plan,
    };
  },
});

// Internal helper: returns whether the caller can manage billing for the
// given workspace. Only owners and admins are allowed.
export const callerCanManageBilling = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id),
      )
      .first();

    if (!member) return false;
    return member.role === "owner" || member.role === "admin";
  },
});
