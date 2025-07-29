import { query } from "../_generated/server";

export const checkMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Check if there are any old activities with the old schema
      const activities = await ctx.db
        .query("activities")
        .take(5);
      
      let needsMigration = false;
      let oldRecordCount = 0;
      
      for (const activity of activities) {
        // Check if record has old schema fields (action, userId, entityId, etc.)
        if ('action' in activity || 'userId' in activity || 'entityId' in activity) {
          needsMigration = true;
          oldRecordCount++;
        }
      }
      
      if (needsMigration) {
        // Count total old records
        const allActivities = await ctx.db.query("activities").collect();
        const totalOldRecords = allActivities.filter(a => 
          'action' in a || 'userId' in a || 'entityId' in a
        ).length;
        
        return {
          needsMigration: true,
          oldRecordCount: totalOldRecords,
          totalRecords: allActivities.length,
          message: `Found ${totalOldRecords} old activity records that need to be updated for the new team activity system.`
        };
      }
      
      return {
        needsMigration: false,
        oldRecordCount: 0,
        totalRecords: activities.length,
        message: "All activity data is up to date!"
      };
      
    } catch (error) {
      // If query fails due to schema mismatch, definitely needs migration
      return {
        needsMigration: true,
        oldRecordCount: -1,
        totalRecords: -1,
        message: "Database schema needs to be updated for the new team activity system.",
        error: String(error)
      };
    }
  },
});