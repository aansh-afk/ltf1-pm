
import { internalQuery } from "../_generated/server";

export const inspect = internalQuery({
    args: {},
    handler: async (ctx) => {
        const workspaces = await ctx.db.query("workspaces").collect();
        return workspaces.map(w => ({
            id: w._id,
            name: w.name,
            slug: w.slug,
            ownerId: w.ownerId,
            createdAt: w._creationTime
        }));
    },
});
