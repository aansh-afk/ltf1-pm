import { DatabaseReader } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Pro-only features that require an active Pro or Enterprise subscription.
 */
const PRO_FEATURES = new Set([
  "custom_webhooks",
  "sso",
  "audit_logs",
  "ai_unlimited",
  "tech_debt_surfacing",
  "sprint_suggestions",
  "byok",
  "cycle_time_metrics",
  "custom_reports",
  "private_teams",
  "guest_accounts",
  "priority_support",
  "unlimited_members",
]);

/**
 * Free plan limits.
 */
export const FREE_PLAN_LIMITS = {
  maxMembers: 5,
  aiCreditsPerMonth: 100,
} as const;

/**
 * Returns the current plan for a workspace by checking the subscriptions table
 * first, then falling back to the workspace.subscription.plan field.
 */
export async function getWorkspacePlan(
  db: DatabaseReader,
  workspaceId: Id<"workspaces">,
): Promise<"free" | "pro" | "enterprise"> {
  const subscription = await db
    .query("subscriptions")
    .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
    .first();

  if (
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing")
  ) {
    return subscription.plan;
  }

  // Fallback to workspace embedded subscription field
  const workspace = await db.get(workspaceId);
  if (!workspace) {
    return "free";
  }
  return workspace.subscription.plan;
}

/**
 * Throws an error if the workspace does not have Pro or Enterprise plan.
 */
export async function requirePro(
  db: DatabaseReader,
  workspaceId: Id<"workspaces">,
): Promise<void> {
  const plan = await getWorkspacePlan(db, workspaceId);
  if (plan === "free") {
    throw new Error(
      "This feature requires a Pro or Enterprise plan. Please upgrade your subscription.",
    );
  }
}

/**
 * Check if a workspace has access to a specific feature.
 */
export async function checkFeatureAccess(
  db: DatabaseReader,
  workspaceId: Id<"workspaces">,
  feature: string,
): Promise<boolean> {
  if (!PRO_FEATURES.has(feature)) {
    // Feature is available on all plans
    return true;
  }
  const plan = await getWorkspacePlan(db, workspaceId);
  return plan === "pro" || plan === "enterprise";
}

/**
 * Returns seat count info for a workspace.
 */
export async function getWorkspaceSeatInfo(
  db: DatabaseReader,
  workspaceId: Id<"workspaces">,
): Promise<{
  plan: "free" | "pro" | "enterprise";
  seatsUsed: number;
  seatsAvailable: number;
  canAddMore: boolean;
}> {
  const plan = await getWorkspacePlan(db, workspaceId);
  const members = await db
    .query("workspaceMembers")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();
  const seatsUsed = members.length;

  if (plan === "free") {
    return {
      plan,
      seatsUsed,
      seatsAvailable: FREE_PLAN_LIMITS.maxMembers,
      canAddMore: seatsUsed < FREE_PLAN_LIMITS.maxMembers,
    };
  }

  // Pro/Enterprise: check subscription seat count
  const subscription = await db
    .query("subscriptions")
    .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
    .first();

  const seatLimit = subscription?.seatCount ?? 999;
  return {
    plan,
    seatsUsed,
    seatsAvailable: seatLimit,
    canAddMore: seatsUsed < seatLimit,
  };
}
