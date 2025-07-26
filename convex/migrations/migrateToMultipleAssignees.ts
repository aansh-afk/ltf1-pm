import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const migrateTasksToMultipleAssignees = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;
    
    // Get all tasks that haven't been migrated yet (have assigneeId but empty assigneeIds)
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.and(
          q.neq(q.field("assigneeId"), undefined),
          q.eq(q.field("assigneeIds"), undefined)
        )
      )
      .take(batchSize);
    
    let migratedCount = 0;
    
    for (const task of tasks) {
      if (task.assigneeId) {
        // Migrate single assigneeId to assigneeIds array
        await ctx.db.patch(task._id, {
          assigneeIds: [task.assigneeId],
          updatedAt: Date.now(),
        });
        migratedCount++;
      }
    }
    
    // Get tasks with no assigneeId that need empty assigneeIds array
    const unassignedTasks = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.and(
          q.eq(q.field("assigneeId"), undefined),
          q.eq(q.field("assigneeIds"), undefined)
        )
      )
      .take(batchSize);
    
    for (const task of unassignedTasks) {
      await ctx.db.patch(task._id, {
        assigneeIds: [],
        updatedAt: Date.now(),
      });
      migratedCount++;
    }
    
    // Check if there are more tasks to migrate
    const remainingTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("assigneeIds"), undefined))
      .take(1);
    
    return {
      migratedCount,
      hasMore: remainingTasks.length > 0,
      message: `Migrated ${migratedCount} tasks. ${remainingTasks.length > 0 ? 'More tasks remaining.' : 'Migration complete!'}`,
    };
  },
});

export const cleanupDeprecatedAssigneeId = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;
    
    // Only clean up tasks that have been migrated (have assigneeIds)
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.and(
          q.neq(q.field("assigneeId"), undefined),
          q.neq(q.field("assigneeIds"), undefined)
        )
      )
      .take(batchSize);
    
    let cleanedCount = 0;
    
    for (const task of tasks) {
      await ctx.db.patch(task._id, {
        assigneeId: undefined,
        updatedAt: Date.now(),
      });
      cleanedCount++;
    }
    
    return {
      cleanedCount,
      message: `Cleaned up assigneeId from ${cleanedCount} tasks.`,
    };
  },
});