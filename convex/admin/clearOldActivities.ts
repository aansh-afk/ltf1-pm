import { mutation } from "../_generated/server";

export const clearOldActivities = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get all activities with the old schema
    const oldActivities = await ctx.db
      .query("activities")
      .collect();

    console.log(`Found ${oldActivities.length} old activity records to delete`);

    // Delete all old activities
    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
    }

    console.log("Cleared all old activity records. New activity tracking can now start fresh.");
    
    return { 
      success: true,
      deletedCount: oldActivities.length,
      message: "Cleared all old activity records" 
    };
  },
});