import { v } from "convex/values";
import { query } from "../_generated/server";

export const getProjectMembers = query({
  args: { 
    projectId: v.id("projects") 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get all member IDs from the project
    const memberIds = project.members || [];
    
    // Fetch all member details
    const members = await Promise.all(
      memberIds.map(async (memberId) => {
        const user = await ctx.db.get(memberId);
        if (!user) return null;
        
        return {
          _id: user._id,
          name: user.name || "Unknown User",
          email: user.email,
          avatar: user.avatarUrl,
          role: user.role,
        };
      })
    );

    // Filter out null values and return
    return members.filter(member => member !== null);
  },
});