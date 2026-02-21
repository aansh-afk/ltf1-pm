import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Backfill legacy notification records to match current schema.
 *
 * Patches:
 * - `message` field -> `body` (if body is missing)
 * - `read` field -> `isRead` (if isRead is missing)
 * - Sets defaults for missing optional fields
 *
 * Run via Convex dashboard or CLI:
 *   npx convex run migrations/backfillNotifications:backfillNotifications '{}'
 *   npx convex run migrations/backfillNotifications:backfillNotifications '{"cursor": "<cursor>"}'
 */
export const backfillNotifications = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    patched: v.number(),
    isDone: v.boolean(),
    cursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;

    const query = ctx.db.query("notifications").order("asc");

    const results = await query.paginate({
      numItems: batchSize,
      cursor: args.cursor ?? null,
    });

    let patched = 0;

    for (const notification of results.page) {
      const updates: Record<string, any> = {};
      const doc = notification as any;

      // Migrate message -> body
      if (doc.message && !doc.body) {
        updates.body = doc.message;
      }

      // Migrate read -> isRead
      if (doc.read !== undefined && doc.isRead === undefined) {
        updates.isRead = doc.read;
      }

      // Ensure isRead has a default
      if (doc.isRead === undefined && doc.read === undefined) {
        updates.isRead = false;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(notification._id, updates);
        patched++;
      }
    }

    return {
      processed: results.page.length,
      patched,
      isDone: results.isDone,
      cursor: results.continueCursor,
    };
  },
});
