/**
 * GitHub Integration Monitoring Dashboard
 *
 * Queries for monitoring the health and status of GitHub integration.
 */

import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";

// Dashboard overview query
export const getDashboardOverview = query({
  args: {},
  returns: v.object({
    rateLimits: v.array(v.object({
      installationId: v.number(),
      apiType: v.union(v.literal("core"), v.literal("search"), v.literal("graphql")),
      remaining: v.number(),
      limit: v.number(),
      resetTime: v.number(),
      percentUsed: v.number(),
      lastUpdated: v.number(),
    })),
    recentErrors: v.array(v.object({
      _id: v.id("githubOperationLogs"),
      timestamp: v.number(),
      operation: v.string(),
      error: v.optional(v.object({
        code: v.string(),
        message: v.string(),
        retryable: v.boolean(),
      })),
    })),
    stats: v.object({
      totalInstallations: v.number(),
      connectedRepositories: v.number(),
      activeSync: v.boolean(),
    }),
  }),
  handler: async (ctx) => {
    // Get rate limits
    const rateLimits = await ctx.db
      .query("githubRateLimits")
      .collect();

    const formattedRateLimits = rateLimits.map((limit) => ({
      installationId: limit.installationId,
      apiType: limit.apiType,
      remaining: limit.remaining,
      limit: limit.limit,
      resetTime: limit.reset,
      percentUsed: limit.limit > 0 ? ((limit.limit - limit.remaining) / limit.limit) * 100 : 0,
      lastUpdated: limit.lastUpdated,
    }));

    // Get recent errors
    const recentErrors = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_level", (q) => q.eq("level", "error"))
      .order("desc")
      .take(10);

    // Get stats
    const installations = await ctx.db
      .query("githubInstallations")
      .collect();

    const repositories = await ctx.db
      .query("githubRepositories")
      .collect();

    // Check if there are any recent sync operations
    const recentLogs = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(1);

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const activeSync = recentLogs.length > 0 && recentLogs[0].timestamp > oneHourAgo;

    return {
      rateLimits: formattedRateLimits,
      recentErrors: recentErrors.map((log) => ({
        _id: log._id,
        timestamp: log.timestamp,
        operation: log.operation,
        error: log.error,
      })),
      stats: {
        totalInstallations: installations.length,
        connectedRepositories: repositories.length,
        activeSync,
      },
    };
  },
});

// Get rate limit status for a specific installation
export const getInstallationRateLimits = query({
  args: {
    installationId: v.number(),
  },
  returns: v.object({
    core: v.union(
      v.object({
        remaining: v.number(),
        limit: v.number(),
        reset: v.number(),
        percentUsed: v.number(),
        isLow: v.boolean(),
        lastUpdated: v.number(),
      }),
      v.null()
    ),
    search: v.union(
      v.object({
        remaining: v.number(),
        limit: v.number(),
        reset: v.number(),
        percentUsed: v.number(),
        isLow: v.boolean(),
        lastUpdated: v.number(),
      }),
      v.null()
    ),
    graphql: v.union(
      v.object({
        remaining: v.number(),
        limit: v.number(),
        reset: v.number(),
        percentUsed: v.number(),
        isLow: v.boolean(),
        lastUpdated: v.number(),
      }),
      v.null()
    ),
  }),
  handler: async (ctx, args) => {
    const limits = await ctx.db
      .query("githubRateLimits")
      .withIndex("by_installation", (q) => q.eq("installationId", args.installationId))
      .collect();

    const formatLimit = (limit: typeof limits[0] | undefined) => {
      if (!limit) return null;
      const percentUsed = limit.limit > 0 ? ((limit.limit - limit.remaining) / limit.limit) * 100 : 0;
      return {
        remaining: limit.remaining,
        limit: limit.limit,
        reset: limit.reset,
        percentUsed,
        isLow: limit.remaining < 100,
        lastUpdated: limit.lastUpdated,
      };
    };

    return {
      core: formatLimit(limits.find((l) => l.apiType === "core")),
      search: formatLimit(limits.find((l) => l.apiType === "search")),
      graphql: formatLimit(limits.find((l) => l.apiType === "graphql")),
    };
  },
});

// Get sync health status
export const getSyncHealth = query({
  args: {},
  returns: v.object({
    isHealthy: v.boolean(),
    lastSyncTime: v.union(v.number(), v.null()),
    recentErrorRate: v.number(),
    avgResponseTime: v.union(v.number(), v.null()),
    issues: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const issues: Array<string> = [];

    // Get recent logs
    const recentLogs = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(100);

    const filteredLogs = recentLogs.filter((log) => log.timestamp >= oneHourAgo);

    // Calculate error rate
    const errorCount = filteredLogs.filter((log) => log.level === "error").length;
    const errorRate = filteredLogs.length > 0 ? (errorCount / filteredLogs.length) * 100 : 0;

    // Calculate average response time
    const logsWithDuration = filteredLogs.filter((log) => log.duration !== undefined);
    const avgResponseTime = logsWithDuration.length > 0
      ? logsWithDuration.reduce((sum, log) => sum + (log.duration || 0), 0) / logsWithDuration.length
      : null;

    // Get last sync time
    const lastSyncTime = recentLogs.length > 0 ? recentLogs[0].timestamp : null;

    // Check rate limits
    const rateLimits = await ctx.db
      .query("githubRateLimits")
      .collect();

    for (const limit of rateLimits) {
      if (limit.remaining < 100) {
        issues.push(`Low ${limit.apiType} API quota: ${limit.remaining} remaining`);
      }
    }

    // Check error patterns
    if (errorRate > 20) {
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
    }

    if (avgResponseTime !== null && avgResponseTime > 5000) {
      issues.push(`Slow response times: ${(avgResponseTime / 1000).toFixed(1)}s avg`);
    }

    // Check if sync is stale
    if (lastSyncTime && Date.now() - lastSyncTime > 2 * 60 * 60 * 1000) {
      issues.push("No sync activity in the last 2 hours");
    }

    return {
      isHealthy: issues.length === 0,
      lastSyncTime,
      recentErrorRate: errorRate,
      avgResponseTime,
      issues,
    };
  },
});

// Get installation health for workspace
export const getWorkspaceInstallationHealth = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.object({
    hasInstallation: v.boolean(),
    installation: v.union(
      v.object({
        _id: v.id("githubInstallations"),
        installationId: v.number(),
        accountName: v.string(),
        accountType: v.string(),
        isActive: v.boolean(),
        repositoryCount: v.number(),
      }),
      v.null()
    ),
    recentActivity: v.array(v.object({
      timestamp: v.number(),
      operation: v.string(),
      level: v.union(v.literal("debug"), v.literal("info"), v.literal("warn"), v.literal("error")),
    })),
    syncStatus: v.object({
      lastIssueSync: v.union(v.number(), v.null()),
      lastTeamSync: v.union(v.number(), v.null()),
      pendingOperations: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    // Get workspace-installation connection from junction table
    const workspaceInstallation = await ctx.db
      .query("workspaceGitHubInstallations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (!workspaceInstallation) {
      return {
        hasInstallation: false,
        installation: null,
        recentActivity: [],
        syncStatus: {
          lastIssueSync: null,
          lastTeamSync: null,
          pendingOperations: 0,
        },
      };
    }

    // Find the installation
    const installation = await ctx.db
      .query("githubInstallations")
      .withIndex("by_installation_id", (q) => q.eq("installationId", workspaceInstallation.installationId))
      .first();

    if (!installation) {
      return {
        hasInstallation: false,
        installation: null,
        recentActivity: [],
        syncStatus: {
          lastIssueSync: null,
          lastTeamSync: null,
          pendingOperations: 0,
        },
      };
    }

    // Count connected repositories
    const repositories = await ctx.db
      .query("githubRepositories")
      .withIndex("by_installation", (q) => q.eq("installationId", installation.installationId))
      .collect();

    // Get recent activity logs
    const recentLogs = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_installation", (q) => q.eq("installationId", installation.installationId))
      .order("desc")
      .take(20);

    // Get sync queue status for this workspace
    const pendingOperations = await ctx.db
      .query("githubIssueSyncQueue")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const pendingCount = pendingOperations.filter((op) => op.status === "pending").length;

    // Find last sync times from logs
    const issueSyncLogs = recentLogs.filter((log) => log.operation.includes("issue"));
    const teamSyncLogs = recentLogs.filter((log) => log.operation.includes("team"));

    // Check if installation is active (not suspended)
    const isActive = !installation.suspendedAt;

    return {
      hasInstallation: true,
      installation: {
        _id: installation._id,
        installationId: installation.installationId,
        accountName: installation.accountName,
        accountType: installation.accountType,
        isActive,
        repositoryCount: repositories.length,
      },
      recentActivity: recentLogs.map((log) => ({
        timestamp: log.timestamp,
        operation: log.operation,
        level: log.level,
      })),
      syncStatus: {
        lastIssueSync: issueSyncLogs.length > 0 ? issueSyncLogs[0].timestamp : null,
        lastTeamSync: teamSyncLogs.length > 0 ? teamSyncLogs[0].timestamp : null,
        pendingOperations: pendingCount,
      },
    };
  },
});

// Internal query for cleanup scheduling
export const getStaleLogCount = internalQuery({
  args: {
    daysOld: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.daysOld * 24 * 60 * 60 * 1000;

    const staleLogs = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_timestamp")
      .order("asc")
      .collect();

    return staleLogs.filter((log) => log.timestamp < cutoff).length;
  },
});

// Get summary for admin dashboard
export const getAdminSummary = query({
  args: {},
  returns: v.object({
    totalInstallations: v.number(),
    activeInstallations: v.number(),
    totalRepositories: v.number(),
    syncedIssues: v.number(),
    todayOperations: v.number(),
    todayErrors: v.number(),
    rateLimitWarnings: v.number(),
  }),
  handler: async (ctx) => {
    // Get all installations
    const installations = await ctx.db.query("githubInstallations").collect();
    // Active installations are those without suspendedAt
    const activeInstallations = installations.filter((i) => !i.suspendedAt);

    // Get repositories
    const repositories = await ctx.db.query("githubRepositories").collect();

    // Get synced issues
    const syncedIssues = await ctx.db.query("githubIssues").collect();

    // Get today's operations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const todayLogs = await ctx.db
      .query("githubOperationLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    const filteredTodayLogs = todayLogs.filter((log) => log.timestamp >= todayTimestamp);
    const todayErrors = filteredTodayLogs.filter((log) => log.level === "error");

    // Check rate limits for warnings
    const rateLimits = await ctx.db.query("githubRateLimits").collect();
    const lowLimits = rateLimits.filter((limit) => limit.remaining < 100);

    return {
      totalInstallations: installations.length,
      activeInstallations: activeInstallations.length,
      totalRepositories: repositories.length,
      syncedIssues: syncedIssues.length,
      todayOperations: filteredTodayLogs.length,
      todayErrors: todayErrors.length,
      rateLimitWarnings: lowLimits.length,
    };
  },
});
