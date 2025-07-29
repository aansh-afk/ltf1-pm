import { internalMutation } from "../_generated/server";

export const clearOldActivities = internalMutation({
  args: {},
  handler: async (ctx) => {
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
    
    return { deletedCount: oldActivities.length };
  },
});