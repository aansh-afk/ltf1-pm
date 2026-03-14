import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const planValidator = v.union(
  v.literal("free"),
  v.literal("pro"),
  v.literal("enterprise"),
);

const statusValidator = v.union(
  v.literal("active"),
  v.literal("trialing"),
  v.literal("past_due"),
  v.literal("cancelled"),
  v.literal("incomplete"),
);

const billingCycleValidator = v.union(
  v.literal("monthly"),
  v.literal("yearly"),
);

export const createSubscription = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    status: statusValidator,
    plan: planValidator,
    seatCount: v.number(),
    billingCycle: billingCycleValidator,
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  returns: v.id("subscriptions"),
  handler: async (ctx, args) => {
    // Check if subscription already exists for this workspace
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (existing) {
      // Update existing subscription instead of creating duplicate
      await ctx.db.patch(existing._id, {
        polarCustomerId: args.polarCustomerId,
        polarSubscriptionId: args.polarSubscriptionId,
        status: args.status,
        plan: args.plan,
        seatCount: args.seatCount,
        billingCycle: args.billingCycle,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelledAt: undefined,
      });

      // Update workspace plan
      const workspace = await ctx.db.get(args.workspaceId);
      if (workspace) {
        await ctx.db.patch(args.workspaceId, {
          subscription: {
            ...workspace.subscription,
            plan: args.plan,
            seats: args.seatCount,
            validUntil: args.currentPeriodEnd,
          },
          updatedAt: Date.now(),
        });
      }

      return existing._id;
    }

    const subscriptionId = await ctx.db.insert("subscriptions", {
      workspaceId: args.workspaceId,
      polarCustomerId: args.polarCustomerId,
      polarSubscriptionId: args.polarSubscriptionId,
      status: args.status,
      plan: args.plan,
      seatCount: args.seatCount,
      billingCycle: args.billingCycle,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
    });

    // Update workspace plan
    const workspace = await ctx.db.get(args.workspaceId);
    if (workspace) {
      await ctx.db.patch(args.workspaceId, {
        subscription: {
          ...workspace.subscription,
          plan: args.plan,
          seats: args.seatCount,
          validUntil: args.currentPeriodEnd,
        },
        updatedAt: Date.now(),
      });
    }

    return subscriptionId;
  },
});

export const updateSubscription = internalMutation({
  args: {
    polarSubscriptionId: v.string(),
    status: v.optional(statusValidator),
    plan: v.optional(planValidator),
    seatCount: v.optional(v.number()),
    billingCycle: v.optional(billingCycleValidator),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", args.polarSubscriptionId),
      )
      .first();

    if (!subscription) {
      console.error(
        `[Polar Webhook] Subscription not found: ${args.polarSubscriptionId}`,
      );
      return null;
    }

    const updates: Record<string, unknown> = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.plan !== undefined) updates.plan = args.plan;
    if (args.seatCount !== undefined) updates.seatCount = args.seatCount;
    if (args.billingCycle !== undefined) updates.billingCycle = args.billingCycle;
    if (args.currentPeriodStart !== undefined)
      updates.currentPeriodStart = args.currentPeriodStart;
    if (args.currentPeriodEnd !== undefined)
      updates.currentPeriodEnd = args.currentPeriodEnd;

    await ctx.db.patch(subscription._id, updates);

    // Sync plan to workspace
    const newPlan = args.plan ?? subscription.plan;
    const newSeats = args.seatCount ?? subscription.seatCount;
    const newPeriodEnd = args.currentPeriodEnd ?? subscription.currentPeriodEnd;

    const workspace = await ctx.db.get(subscription.workspaceId);
    if (workspace) {
      await ctx.db.patch(subscription.workspaceId, {
        subscription: {
          ...workspace.subscription,
          plan: newPlan,
          seats: newSeats,
          validUntil: newPeriodEnd,
        },
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const cancelSubscription = internalMutation({
  args: {
    polarSubscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", args.polarSubscriptionId),
      )
      .first();

    if (!subscription) {
      console.error(
        `[Polar Webhook] Subscription not found for cancel: ${args.polarSubscriptionId}`,
      );
      return null;
    }

    await ctx.db.patch(subscription._id, {
      status: "cancelled",
      cancelledAt: Date.now(),
    });

    // Downgrade workspace to free
    const workspace = await ctx.db.get(subscription.workspaceId);
    if (workspace) {
      await ctx.db.patch(subscription.workspaceId, {
        subscription: {
          plan: "free",
          seats: 5,
          validUntil: subscription.currentPeriodEnd,
        },
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});
