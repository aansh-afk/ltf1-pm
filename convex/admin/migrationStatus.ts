import { query } from "../_generated/server";
import { getCurrentUser } from "../lib/auth";

export const checkMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    // Restrict admin migration status to platform admins. Non-admin and
    // unauthenticated callers receive the up-to-date no-op shape so the
    // existing UI banner remains hidden for them.
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      return {
        needsMigration: false,
        oldRecordCount: 0,
        totalRecords: 0,
        message: "All activity data is up to date!",
      };
    }

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
      // Avoid leaking raw provider/database error text. Operators can find
      // details in Convex logs; non-admin paths never reach this branch.
      console.error("[admin/migrationStatus] check failed", error);
      return {
        needsMigration: true,
        oldRecordCount: -1,
        totalRecords: -1,
        message: "Database schema needs to be updated for the new team activity system.",
      };
    }
  },
});
