import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateExistingUsersToActive = internalMutation({
    args: {},
    returns: v.object({
        updatedCount: v.number(),
        totalUsers: v.number(),
    }),
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        let updatedCount = 0;

        for (const user of users) {
            if (!user.status) {
                await ctx.db.patch(user._id, {
                    status: "active",
                });
                updatedCount++;
            }
        }

        return { updatedCount, totalUsers: users.length };
    },
});
