import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Get workspace-wide analytics computed from tasks, sprints, and projects.
 */
export const getWorkspaceAnalytics = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.object({
    tasks: v.object({
      total: v.number(),
      byStatus: v.record(v.string(), v.number()),
      byPriority: v.record(v.string(), v.number()),
      byType: v.record(v.string(), v.number()),
      completionRate: v.number(),
      overdue: v.number(),
      recentCompletions: v.number(),
    }),
    sprints: v.object({
      total: v.number(),
      active: v.number(),
      completed: v.number(),
    }),
    team: v.array(
      v.object({
        userId: v.id("users"),
        name: v.string(),
        taskCount: v.number(),
        completedCount: v.number(),
      })
    ),
    velocity: v.array(
      v.object({
        weekLabel: v.string(),
        completedCount: v.number(),
      })
    ),
    projects: v.array(
      v.object({
        projectId: v.id("projects"),
        name: v.string(),
        taskCount: v.number(),
        completedCount: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Get all projects for this workspace
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // 2. Get all tasks across all projects
    const allTasks = [];
    for (const project of projects) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      allTasks.push(...tasks);
    }

    // 3. Get all sprints across all projects
    const allSprints = [];
    for (const project of projects) {
      const sprints = await ctx.db
        .query("sprints")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      allSprints.push(...sprints);
    }

    // --- Task stats ---
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let doneCount = 0;
    let cancelledCount = 0;
    let overdueCount = 0;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    let recentCompletions = 0;

    for (const task of allTasks) {
      byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] ?? 0) + 1;
      byType[task.type] = (byType[task.type] ?? 0) + 1;

      if (task.status === "done") doneCount++;
      if (task.status === "cancelled") cancelledCount++;

      if (
        task.dueDate &&
        task.dueDate < now &&
        task.status !== "done" &&
        task.status !== "cancelled"
      ) {
        overdueCount++;
      }

      if (task.completedAt && task.completedAt >= sevenDaysAgo) {
        recentCompletions++;
      }
    }

    const denominator = allTasks.length - cancelledCount;
    const completionRate = denominator > 0 ? Math.round((doneCount / denominator) * 100) : 0;

    // --- Sprint stats ---
    let activeSprints = 0;
    let completedSprints = 0;
    for (const sprint of allSprints) {
      if (sprint.status === "active") activeSprints++;
      if (sprint.status === "completed") completedSprints++;
    }

    // --- Team stats (top contributors by assignee) ---
    const assigneeMap: Record<string, { taskCount: number; completedCount: number }> = {};
    for (const task of allTasks) {
      const assignees = task.assigneeIds ?? (task.assigneeId ? [task.assigneeId] : []);
      for (const uid of assignees) {
        if (!assigneeMap[uid]) {
          assigneeMap[uid] = { taskCount: 0, completedCount: 0 };
        }
        assigneeMap[uid].taskCount++;
        if (task.status === "done") assigneeMap[uid].completedCount++;
      }
    }

    const teamEntries = Object.entries(assigneeMap)
      .sort(([, a], [, b]) => b.taskCount - a.taskCount)
      .slice(0, 10);

    const team = [];
    for (const [userId, data] of teamEntries) {
      const user = await ctx.db.get(userId as Id<"users">);
      team.push({
        userId: userId as Id<"users">,
        name: user?.name ?? "Unknown",
        taskCount: data.taskCount,
        completedCount: data.completedCount,
      });
    }

    // --- Velocity (last 4 weeks) ---
    const velocity = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      let count = 0;
      for (const task of allTasks) {
        if (task.completedAt && task.completedAt >= weekStart && task.completedAt < weekEnd) {
          count++;
        }
      }
      const weekDate = new Date(weekEnd);
      const weekLabel = `W${Math.ceil(weekDate.getDate() / 7)} ${weekDate.toLocaleDateString("en-US", { month: "short" })}`;
      velocity.push({ weekLabel, completedCount: count });
    }

    // --- Projects breakdown ---
    const projectStats = [];
    for (const project of projects) {
      let taskCount = 0;
      let completedCount = 0;
      for (const task of allTasks) {
        if (task.projectId === project._id) {
          taskCount++;
          if (task.status === "done") completedCount++;
        }
      }
      projectStats.push({
        projectId: project._id,
        name: project.name,
        taskCount,
        completedCount,
      });
    }
    projectStats.sort((a, b) => b.taskCount - a.taskCount);

    return {
      tasks: {
        total: allTasks.length,
        byStatus,
        byPriority,
        byType,
        completionRate,
        overdue: overdueCount,
        recentCompletions,
      },
      sprints: {
        total: allSprints.length,
        active: activeSprints,
        completed: completedSprints,
      },
      team,
      velocity,
      projects: projectStats.slice(0, 10),
    };
  },
});
