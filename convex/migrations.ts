import { internalMutation } from "./_generated/server";

export const migrateExistingUsersToActive = internalMutation({
    args: {},
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
