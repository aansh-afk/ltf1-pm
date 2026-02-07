import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Combined dashboard query that fetches workspaces with counts and recent activities
 * in a single reactive query, replacing multiple separate client-side queries.
 */
export const getDashboardData = query({
  args: {},
  returns: v.object({
    workspaces: v.array(
      v.object({
        _id: v.id("workspaces"),
        _creationTime: v.number(),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        ownerId: v.id("users"),
        memberCount: v.number(),
        projectCount: v.number(),
      })
    ),
    recentActivities: v.array(v.any()),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { workspaces: [], recentActivities: [] };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return { workspaces: [], recentActivities: [] };
    }

    // Get workspace memberships for this user
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (memberships.length === 0) {
      return { workspaces: [], recentActivities: [] };
    }

    // Fetch workspaces and their counts in parallel
    const workspacesWithCounts = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db.get(membership.workspaceId);
        if (!workspace) return null;

        const [members, projects] = await Promise.all([
          ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace", (q) =>
              q.eq("workspaceId", workspace._id)
            )
            .collect(),
          ctx.db
            .query("projects")
            .withIndex("by_workspace", (q) =>
              q.eq("workspaceId", workspace._id)
            )
            .collect(),
        ]);

        return {
          _id: workspace._id,
          _creationTime: workspace._creationTime,
          name: workspace.name,
          slug: workspace.slug,
          description: workspace.description,
          ownerId: workspace.ownerId,
          memberCount: members.length,
          projectCount: projects.filter((p) => p.status !== "archived").length,
        };
      })
    );

    // Get recent activities across all user workspaces (activities table uses v.any() schema)
    const workspaceIds = memberships.map((m) => m.workspaceId);
    const allActivities: Array<any> = [];

    for (const workspaceId of workspaceIds) {
      const activities = await ctx.db
        .query("activities")
        .filter((q) => q.eq(q.field("workspaceId"), workspaceId))
        .order("desc")
        .take(10);
      allActivities.push(...activities);
    }

    // Sort by timestamp descending and take top 10
    const recentActivities = allActivities
      .filter(
        (a) => a && typeof a === "object" && (a as any).type
      )
      .sort(
        (a, b) => ((b as any).timestamp || 0) - ((a as any).timestamp || 0)
      )
      .slice(0, 10);

    return {
      workspaces: workspacesWithCounts.filter(
        (w): w is NonNullable<typeof w> => w !== null
      ),
      recentActivities,
    };
  },
});
