import { internalMutation, query } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// Capture snapshot for a single sprint (idempotent - skips if today's snapshot exists)
export const captureSprintSnapshot = internalMutation({
  args: { sprintId: v.id("sprints") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) return null;

    // Check if snapshot already exists for today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const existingSnapshot = await ctx.db
      .query("sprintSnapshots")
      .withIndex("by_sprint_and_date", (q) =>
        q.eq("sprintId", args.sprintId).eq("date", todayTimestamp),
      )
      .unique();

    if (existingSnapshot) return null; // Already captured today

    // Get all tasks in this sprint
    const sprintTasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();

    const totalTasks = sprintTasks.length;
    const completedTasks = sprintTasks.filter(
      (t) => t.status === "done",
    ).length;
    const remainingTasks = totalTasks - completedTasks;

    // Calculate story points using estimate.points field; fall back to 1 per task
    const totalPoints = sprintTasks.reduce(
      (sum, t) => sum + (t.estimate?.points ?? 1),
      0,
    );
    const completedPoints = sprintTasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.estimate?.points ?? 1), 0);
    const remainingPoints = totalPoints - completedPoints;

    await ctx.db.insert("sprintSnapshots", {
      sprintId: args.sprintId,
      projectId: sprint.projectId,
      date: todayTimestamp,
      totalPoints,
      completedPoints,
      remainingPoints,
      totalTasks,
      completedTasks,
      remainingTasks,
    });

    return null;
  },
});

// Capture snapshots for all active sprints
export const captureAllActiveSprintSnapshots = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const activeSprints = await ctx.db
      .query("sprints")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const sprint of activeSprints) {
      await ctx.runMutation(internal.sprints.snapshots.captureSprintSnapshot, {
        sprintId: sprint._id,
      });
    }

    return null;
  },
});

// Get burndown data for a sprint
export const getBurndownData = query({
  args: { sprintId: v.id("sprints") },
  returns: v.array(
    v.object({
      date: v.number(),
      remainingPoints: v.number(),
      remainingTasks: v.number(),
      idealRemaining: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) return [];

    const snapshots = await ctx.db
      .query("sprintSnapshots")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .order("asc")
      .collect();

    if (snapshots.length === 0) return [];

    const totalPoints = snapshots[0]?.totalPoints ?? 0;
    const startDate = sprint.startDate ?? snapshots[0]?.date ?? Date.now();
    const endDate = sprint.endDate ?? startDate + 14 * 24 * 60 * 60 * 1000;
    const sprintDuration = endDate - startDate;

    return snapshots.map((snapshot) => {
      const elapsed = snapshot.date - startDate;
      const progress = sprintDuration > 0 ? elapsed / sprintDuration : 0;
      const idealRemaining = Math.max(0, totalPoints * (1 - progress));

      return {
        date: snapshot.date,
        remainingPoints: snapshot.remainingPoints,
        remainingTasks: snapshot.remainingTasks,
        idealRemaining: Math.round(idealRemaining * 10) / 10,
      };
    });
  },
});

// Get velocity data for last 6 completed sprints
export const getVelocityData = query({
  args: { projectId: v.id("projects") },
  returns: v.array(
    v.object({
      sprintId: v.id("sprints"),
      sprintName: v.string(),
      completedPoints: v.number(),
      totalPoints: v.number(),
      completedTasks: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const completedSprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    const filtered = completedSprints
      .filter((s) => s.status === "completed")
      .slice(0, 6);

    const result: Array<{
      sprintId: Id<"sprints">;
      sprintName: string;
      completedPoints: number;
      totalPoints: number;
      completedTasks: number;
    }> = [];

    for (const sprint of filtered) {
      // Get the last snapshot for this sprint
      const snapshots = await ctx.db
        .query("sprintSnapshots")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
        .order("desc")
        .take(1);

      const lastSnapshot = snapshots[0];
      if (lastSnapshot) {
        result.push({
          sprintId: sprint._id,
          sprintName: sprint.name,
          completedPoints: lastSnapshot.completedPoints,
          totalPoints: lastSnapshot.totalPoints,
          completedTasks: lastSnapshot.completedTasks,
        });
      }
    }

    return result;
  },
});
