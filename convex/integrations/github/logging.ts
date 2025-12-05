/**
 * GitHub Integration Logging Infrastructure
 *
 * Structured logging for GitHub API operations with database persistence.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { GitHubError, formatErrorForLogging } from "./errors";

// Log levels
export type LogLevel = "debug" | "info" | "warn" | "error";

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  operation: string;
  installationId?: number;
  workspaceId?: Id<"workspaces">;
  duration?: number;
  rateLimitRemaining?: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  metadata?: Record<string, unknown>;
}

// Create a log entry
export const createLogEntry = internalMutation({
  args: {
    level: v.union(v.literal("debug"), v.literal("info"), v.literal("warn"), v.literal("error")),
    operation: v.string(),
    installationId: v.optional(v.number()),
    workspaceId: v.optional(v.id("workspaces")),
    duration: v.optional(v.number()),
    rateLimitRemaining: v.optional(v.number()),
    error: v.optional(v.object({
      code: v.string(),
      message: v.string(),
      retryable: v.boolean(),
    })),
    metadata: v.optional(v.any()),
  },
  returns: v.id("githubOperationLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("githubOperationLogs", {
      timestamp: Date.now(),
      level: args.level,
      operation: args.operation,
      installationId: args.installationId,
      workspaceId: args.workspaceId,
      duration: args.duration,
      rateLimitRemaining: args.rateLimitRemaining,
      error: args.error,
      metadata: args.metadata,
    });
  },
});

// Get recent logs
export const getRecentLogs = internalQuery({
  args: {
    limit: v.optional(v.number()),
    level: v.optional(v.union(v.literal("debug"), v.literal("info"), v.literal("warn"), v.literal("error"))),
    installationId: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("githubOperationLogs"),
    _creationTime: v.number(),
    timestamp: v.number(),
    level: v.union(v.literal("debug"), v.literal("info"), v.literal("warn"), v.literal("error")),
    operation: v.string(),
    installationId: v.optional(v.number()),
    workspaceId: v.optional(v.id("workspaces")),
    duration: v.optional(v.number()),
    rateLimitRemaining: v.optional(v.number()),
    error: v.optional(v.object({
      code: v.string(),
      message: v.string(),
      retryable: v.boolean(),
    })),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    const queryLimit = args.limit ?? 100;

    // Use different query paths based on filter criteria
    if (args.level) {
      const logs = await ctx.db
        .query("githubOperationLogs")
        .withIndex("by_level", (q) => q.eq("level", args.level!))
        .order("desc")
        .take(queryLimit);
      return logs;
    } else if (args.installationId) {
      const logs = await ctx.db
        .query("githubOperationLogs")
        .withIndex("by_installation", (q) => q.eq("installationId", args.installationId!))
        .order("desc")
        .take(queryLimit);
      return logs;
    } else {
      const logs = await ctx.db
        .query("githubOperationLogs")
        .withIndex("by_timestamp")
        .order("desc")
        .take(queryLimit);
      return logs;
    }
  },
});

// Get error logs (last 24 hours)
export const getErrorLogs = internalQuery({
  args: {
    hoursBack: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("githubOperationLogs"),
    _creationTime: v.number(),
    timestamp: v.number(),
    level: v.union(v.literal("debug"), v.literal("info"), v.literal("warn"), v.literal("error")),
    operation: v.string(),
    installationId: v.optional(v.number()),
    workspaceId: v.optional(v.id("workspaces")),
    duration: v.optional(v.number()),
    rateLimitRemaining: v.optional(v.number()),
    error: v.optional(v.object({
      code: v.string(),
      message: v.string(),
      retryable: v.boolean(),
    })),
    metadata: v.optional(v.any()),
  })),
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack ?? 24;
    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;

    const errorLogs = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_level", (q) => q.eq("level", "error"))
      .order("desc")
      .collect();

    // Filter by timestamp since we can't use multiple index conditions
    return errorLogs.filter((log) => log.timestamp >= cutoff);
  },
});

// Clean up old logs
export const cleanupOldLogs = internalMutation({
  args: {
    daysToKeep: v.optional(v.number()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const daysToKeep = args.daysToKeep ?? 7;
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    const oldLogs = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_timestamp")
      .order("asc")
      .collect();

    let deletedCount = 0;
    for (const log of oldLogs) {
      if (log.timestamp < cutoff) {
        await ctx.db.delete(log._id);
        deletedCount++;
      } else {
        // Since ordered by timestamp, we can stop early
        break;
      }
    }

    return deletedCount;
  },
});

// Get operation statistics
export const getOperationStats = internalQuery({
  args: {
    hoursBack: v.optional(v.number()),
  },
  returns: v.object({
    totalOperations: v.number(),
    errorCount: v.number(),
    warnCount: v.number(),
    avgDuration: v.union(v.number(), v.null()),
    operationBreakdown: v.record(v.string(), v.number()),
    errorBreakdown: v.record(v.string(), v.number()),
  }),
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack ?? 24;
    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;

    const logs = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    const recentLogs = logs.filter((log) => log.timestamp >= cutoff);

    const stats = {
      totalOperations: recentLogs.length,
      errorCount: 0,
      warnCount: 0,
      totalDuration: 0,
      durationCount: 0,
      operationBreakdown: {} as Record<string, number>,
      errorBreakdown: {} as Record<string, number>,
    };

    for (const log of recentLogs) {
      // Count by level
      if (log.level === "error") stats.errorCount++;
      if (log.level === "warn") stats.warnCount++;

      // Duration tracking
      if (log.duration !== undefined) {
        stats.totalDuration += log.duration;
        stats.durationCount++;
      }

      // Operation breakdown
      stats.operationBreakdown[log.operation] = (stats.operationBreakdown[log.operation] || 0) + 1;

      // Error breakdown
      if (log.error) {
        stats.errorBreakdown[log.error.code] = (stats.errorBreakdown[log.error.code] || 0) + 1;
      }
    }

    return {
      totalOperations: stats.totalOperations,
      errorCount: stats.errorCount,
      warnCount: stats.warnCount,
      avgDuration: stats.durationCount > 0 ? stats.totalDuration / stats.durationCount : null,
      operationBreakdown: stats.operationBreakdown,
      errorBreakdown: stats.errorBreakdown,
    };
  },
});

// Helper function to create log from GitHubError
export function createErrorLogFromGitHubError(
  error: GitHubError,
  operation: string,
  installationId?: number,
  workspaceId?: Id<"workspaces">,
  duration?: number
): LogEntry {
  const formatted = formatErrorForLogging(error);
  return {
    level: "error",
    operation,
    installationId,
    workspaceId,
    duration,
    error: {
      code: formatted.code,
      message: formatted.message,
      retryable: formatted.retryable,
    },
  };
}

// Helper for timing operations
export class OperationTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  elapsed(): number {
    return Date.now() - this.startTime;
  }
}
