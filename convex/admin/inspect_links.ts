
import { internalMutation, internalQuery } from "../_generated/server";

export const inspect = internalQuery({
    args: {},
    handler: async (ctx) => {
        const installations = await ctx.db.query("githubInstallations").collect();
        const links = await ctx.db.query("workspaceGitHubInstallations").collect();

        return {
            installations,
            links,
        };
    },
});
