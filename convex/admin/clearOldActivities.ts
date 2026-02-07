import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const clearOldActivities = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    // No auth check — internal mutations are system-only and cannot be called externally

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