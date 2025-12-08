
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const link = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Get the latest GitHub installation
        const installation = await ctx.db.query("githubInstallations").order("desc").first();
        if (!installation) {
            return { status: "error", message: "No GitHub installations found" };
        }
        console.log("Using installation:", installation.installationId);

        // 2. Get ALL workspaces
        const workspaces = await ctx.db.query("workspaces").collect();
        if (workspaces.length === 0) {
            return { status: "error", message: "No workspaces found" };
        }
        console.log(`Found ${workspaces.length} workspaces. Linking to all...`);

        const results = [];

        // 3. Link to EACH workspace
        for (const workspace of workspaces) {
            // Find a valid user for "addedBy"
            const user = await ctx.db.get(workspace.ownerId);
            const userId = user ? user._id : (await ctx.db.query("users").first())!._id;

            // Check existing link
            const existingLink = await ctx.db
                .query("workspaceGitHubInstallations")
                .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
                .filter((q) => q.eq(q.field("installationId"), installation.installationId))
                .first();

            if (existingLink) {
                console.log(`- Workspace "${workspace.name}" (${workspace._id}): Already linked.`);
                results.push({ workspace: workspace.name, status: "already_linked" });
                continue;
            }

            // Create link
            await ctx.db.insert("workspaceGitHubInstallations", {
                workspaceId: workspace._id,
                installationId: installation.installationId,
                isPrimary: true,
                accountLogin: installation.accountName,
                accountType: installation.accountType,
                addedBy: userId,
                addedAt: Date.now(),
                syncSettings: {
                    autoSyncIssues: true,
                    bidirectionalSync: true,
                    createTasksFromIssues: true,
                    syncLabels: true,
                },
            });

            console.log(`- Workspace "${workspace.name}" (${workspace._id}): LINKED.`);
            results.push({ workspace: workspace.name, status: "linked" });
        }

        return {
            status: "success",
            installationId: installation.installationId,
            results
        };
    },
});
