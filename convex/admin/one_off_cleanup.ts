import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * ONE-OFF CLEANUP FUNCTION
 * 
 * Run this function from the Convex Dashboard to clear ALL GitHub data.
 * Go to Functions -> admin/one_off_cleanup:clearGitHubData -> Run Mutation
 */
export const clearGitHubData = mutation({
    args: {},
    handler: async (ctx) => {
        console.log("Starting FULL GitHub cleanup...");

        // Helper to delete all records in a table
        const deleteFromTable = async (tableName: string) => {
            try {
                const records = await ctx.db.query(tableName as any).collect();
                for (const record of records) {
                    await ctx.db.delete(record._id);
                }
                console.log(`Deleted ${records.length} records from ${tableName}`);
            } catch (error) {
                console.error(`Failed to clear table ${tableName}:`, error);
            }
        };

        // 1. Delete from all GitHub-specific tables
        const tables = [
            "githubOAuthStates", "githubConnections", "githubInstallations", "githubRepositories",
            "githubWebhookEvents", "githubActivities", "githubCommits", "githubPullRequests",
            "githubIssues", "githubUserMappings", "workspaceGitHubInstallations",
            "githubTeamMappings", "githubIssueSyncQueue"
        ];

        for (const t of tables) await deleteFromTable(t);

        // 2. Clear GitHub fields from Users
        const users = await ctx.db.query("users").collect();
        for (const user of users) {
            if (user.githubUsername || user.githubTokenValidated) {
                await ctx.db.patch(user._id, {
                    githubUsername: undefined,
                    githubTokenValidated: false,
                });
            }
        }
        console.log(`Cleaned up ${users.length} users`);

        // 3. Clear GitHub fields from DeveloperProfiles
        const profiles = await ctx.db.query("developerProfiles").collect();
        for (const profile of profiles) {
            let needsUpdate = false;
            const updates: any = {};

            if (profile.profile?.githubUsername) {
                updates.profile = { ...profile.profile, githubUsername: undefined };
                needsUpdate = true;
            }
            if (profile.githubStats) {
                updates.githubStats = undefined;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await ctx.db.patch(profile._id, updates);
            }
        }
        console.log(`Cleaned up ${profiles.length} profiles`);

        // 4. Clear GitHub fields from Workspaces
        const workspaces = await ctx.db.query("workspaces").collect();
        for (const workspace of workspaces) {
            // Safely check nested properties
            const hasToken = workspace.settings && workspace.settings.integrations && workspace.settings.integrations.githubToken;
            const hasInstallation = workspace.settings && workspace.settings.integrations && workspace.settings.integrations.githubInstallationId;

            if (hasToken || hasInstallation) {
                // Construct the update object carefully
                const newSettings = { ...workspace.settings };
                if (newSettings.integrations) {
                    newSettings.integrations = {
                        ...newSettings.integrations,
                        githubToken: undefined,
                        githubInstallationId: undefined,
                    };
                }

                await ctx.db.patch(workspace._id, {
                    settings: newSettings,
                });
            }
        }
        console.log(`Cleaned up ${workspaces.length} workspaces`);

        // 5. Clear GitHub fields from Projects
        const projects = await ctx.db.query("projects").collect();
        for (const project of projects) {
            if (project.repository?.provider === "github") {
                await ctx.db.patch(project._id, {
                    repository: undefined
                });
            }
        }
        console.log(`Cleaned up ${projects.length} projects`);

        // 6. Clear GitHub fields from Tasks
        const tasks = await ctx.db.query("tasks").collect();
        let tasksCleaned = 0;
        for (const task of tasks) {
            let needsUpdate = false;
            const updates: any = {};

            if (task.githubIssue) {
                updates.githubIssue = undefined;
                needsUpdate = true;
            }
            // Check git object safely
            if (task.git && task.git.pullRequestUrl && task.git.pullRequestUrl.includes('github.com')) {
                updates.git = undefined;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await ctx.db.patch(task._id, updates);
                tasksCleaned++;
            }
        }
        console.log(`Cleaned up ${tasksCleaned} tasks`);

        return "Cleanup Complete";
    },
});
