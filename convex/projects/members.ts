import { v } from "convex/values";
import { query } from "../_generated/server";

export const getProjectMembers = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      avatar: v.optional(v.string()),
      projectRole: v.union(
        v.literal("lead"),
        v.literal("member"),
        v.literal("contributor"),
        v.literal("viewer"),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get all member IDs from the projectMembers junction table
    const projectMembersRows = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();
    // Fetch all member details
    const members = await Promise.all(
      projectMembersRows.map(async (projectMember) => {
        const user = await ctx.db.get(projectMember.userId);
        if (!user) return null;

        return {
          _id: user._id,
          name: user.name || "Unknown User",
          email: user.email,
          avatar: user.avatarUrl,
          projectRole: projectMember.role,
        };
      }),
    );

    // Filter out null values and return
    return members.filter((member) => member !== null);
  },
});
