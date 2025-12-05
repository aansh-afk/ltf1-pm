import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getWaitlistStats = query({
    args: {},
    returns: v.object({
        totalCount: v.number(),
        graphData: v.array(v.object({
            date: v.string(),
            count: v.number(),
        })),
    }),
    handler: async (ctx) => {
        // Count total waitlisted users using index instead of filter
        const waitlistedUsers = await ctx.db
            .query("users")
            .withIndex("by_status", (q) => q.eq("status", "waitlisted"))
            .collect();

        const totalCount = waitlistedUsers.length;

        // Group by day for the graph
        // We'll use the createdAt timestamp to group them
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        const dailyStats = new Map<string, number>();

        // Initialize last 30 days with 0
        for (let i = 0; i < 30; i++) {
            const date = new Date(now - (i * 24 * 60 * 60 * 1000));
            const dateString = date.toISOString().split('T')[0];
            dailyStats.set(dateString, 0);
        }

        waitlistedUsers.forEach(user => {
            if (user.createdAt > thirtyDaysAgo) {
                const date = new Date(user.createdAt);
                const dateString = date.toISOString().split('T')[0];
                const current = dailyStats.get(dateString) || 0;
                dailyStats.set(dateString, current + 1);
            }
        });

        // Convert to array and sort by date
        const graphData = Array.from(dailyStats.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate cumulative count for a nice growth curve
        let cumulative = 0;
        const cumulativeGraphData = graphData.map(item => {
            cumulative += item.count;
            return { ...item, count: cumulative };
        });

        return {
            totalCount,
            graphData: cumulativeGraphData
        };
    },
});

export const joinWaitlist = mutation({
    args: {
        email: v.string(),
    },
    returns: v.object({
        status: v.union(v.literal("waitlisted"), v.literal("active")),
    }),
    handler: async (ctx, args) => {
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

        // If already active, don't change status
        if (user.status === "active") {
            return { status: "active" as const };
        }

        // Update to waitlisted if not already
        if (user.status !== "waitlisted") {
            await ctx.db.patch(user._id, {
                status: "waitlisted" as const,
                waitlistPosition: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return { status: "waitlisted" as const };
    },
});
