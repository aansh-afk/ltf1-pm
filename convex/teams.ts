import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./auth/permissions";

export const createTeam = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        name: v.string(),
        description: v.optional(v.string()),
    },
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

        // Require workspace admin permission to create teams
        await requirePermission(ctx.db, user._id, args.workspaceId, "workspace.edit");

        const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const now = Date.now();

        const teamId = await ctx.db.insert("teams", {
            workspaceId: args.workspaceId,
            name: args.name,
            slug,
            description: args.description,
            createdAt: now,
            updatedAt: now,
        });

        // Add creator as team lead
        await ctx.db.insert("teamMembers", {
            teamId,
            userId: user._id,
            role: "lead",
            joinedAt: now,
        });

        return teamId;
    },
});

export const getTeams = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        return await ctx.db
            .query("teams")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();
    },
});

export const getTeamMembers = query({
    args: {
        teamId: v.id("teams"),
    },
    handler: async (ctx, args) => {
        const members = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
            .collect();

        const memberDetails = await Promise.all(
            members.map(async (member) => {
                const user = await ctx.db.get(member.userId);
                return {
                    ...member,
                    user,
                };
            })
        );

        return memberDetails;
    },
});

export const addTeamMember = mutation({
    args: {
        teamId: v.id("teams"),
        userId: v.id("users"),
        role: v.union(v.literal("lead"), v.literal("member")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        const team = await ctx.db.get(args.teamId);
        if (!team) {
            throw new Error("Team not found");
        }

        // Check permissions (must be workspace admin or team lead)
        const isWorkspaceAdmin = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspace_user", (q) => q.eq("workspaceId", team.workspaceId).eq("userId", currentUser._id))
            .first();

        const isTeamLead = await ctx.db
            .query("teamMembers")
            .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", currentUser._id))
            .filter(q => q.eq(q.field("role"), "lead"))
            .first();

        if (!isTeamLead && (!isWorkspaceAdmin || (isWorkspaceAdmin.role !== "admin" && isWorkspaceAdmin.role !== "owner"))) {
            throw new Error("Insufficient permissions to add members to this team");
        }

        const existingMember = await ctx.db
            .query("teamMembers")
            .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
            .first();

        if (existingMember) {
            throw new Error("User is already a member of this team");
        }

        await ctx.db.insert("teamMembers", {
            teamId: args.teamId,
            userId: args.userId,
            role: args.role,
            joinedAt: Date.now(),
        });

        return { success: true };
    },
});
