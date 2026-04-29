"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const createCheckoutSession = action({
  args: {
    workspaceId: v.id("workspaces"),
    plan: v.union(v.literal("pro"), v.literal("enterprise")),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
  },
  returns: v.object({
    checkoutUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Billing management is restricted to workspace owner/admin.
    const canManage: boolean = await ctx.runQuery(
      internal.billing.queries.callerCanManageBilling,
      { workspaceId: args.workspaceId },
    );
    if (!canManage) {
      throw new Error(
        "Only workspace owners and admins can manage billing.",
      );
    }

    // Build Polar checkout URL
    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!polarAccessToken) {
      throw new Error("Polar.sh is not configured. Please contact support.");
    }

    // Map plan + billing cycle to Polar product/price ID
    const priceId = getPolarPriceId(args.plan, args.billingCycle);
    if (!priceId) {
      throw new Error(`No Polar price configured for ${args.plan} ${args.billingCycle}`);
    }

    // Create checkout via Polar API
    const response = await fetch("https://api.polar.sh/v1/checkouts/custom/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${polarAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_price_id: priceId,
        success_url: `${process.env.SITE_URL || "https://ltf1.dev"}/workspace/${args.workspaceId}/settings?tab=billing&checkout=success`,
        metadata: {
          workspaceId: args.workspaceId,
          plan: args.plan,
          billingCycle: args.billingCycle,
        },
        customer_email: identity.email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Polar] Checkout creation failed:", errorText);
      throw new Error("Failed to create checkout session. Please try again.");
    }

    const checkout = await response.json();

    return { checkoutUrl: checkout.url };
  },
});

function getPolarPriceId(
  plan: "pro" | "enterprise",
  billingCycle: "monthly" | "yearly",
): string | null {
  // These should be set as environment variables in your Convex deployment
  const priceMap: Record<string, string | undefined> = {
    "pro_monthly": process.env.POLAR_PRO_MONTHLY_PRICE_ID,
    "pro_yearly": process.env.POLAR_PRO_YEARLY_PRICE_ID,
    "enterprise_monthly": process.env.POLAR_ENTERPRISE_MONTHLY_PRICE_ID,
    "enterprise_yearly": process.env.POLAR_ENTERPRISE_YEARLY_PRICE_ID,
  };

  return priceMap[`${plan}_${billingCycle}`] ?? null;
}
