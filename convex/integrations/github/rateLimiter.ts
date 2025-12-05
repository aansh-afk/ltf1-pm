/**
 * GitHub Rate Limiting Infrastructure
 *
 * Track and manage GitHub API rate limits.
 * GitHub limits: 5,000 req/hour (installation), 30 req/min (search)
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";

// Rate limit info from GitHub API headers
export interface RateLimitInfo {
  remaining: number;
  reset: number; // Unix timestamp
  limit: number;
  used?: number;
}

// API types
export type ApiType = 'core' | 'search' | 'graphql';

// Parse rate limit headers from GitHub response
export function parseRateLimitHeaders(response: Response): RateLimitInfo {
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10);
  const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10);
  const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '5000', 10);
  const used = parseInt(response.headers.get('X-RateLimit-Used') || '0', 10);

  return { remaining, reset, limit, used };
}

// Check if we should throttle based on rate limit info
export function shouldThrottle(info: RateLimitInfo, buffer: number = 100): boolean {
  return info.remaining < buffer;
}

// Get wait time until rate limit resets
export function getWaitTimeMs(info: RateLimitInfo): number {
  const now = Math.floor(Date.now() / 1000);
  const waitSeconds = Math.max(0, info.reset - now);
  return waitSeconds * 1000;
}

// Calculate recommended delay between requests
export function getRecommendedDelay(apiType: ApiType): number {
  switch (apiType) {
    case 'core':
      return 100; // 100ms between core API calls
    case 'search':
      return 2500; // 2.5s between search API calls (30/min limit)
    case 'graphql':
      return 200; // 200ms between GraphQL calls
    default:
      return 100;
  }
}

// Store rate limit info in database
export const trackRateLimitUsage = internalMutation({
  args: {
    installationId: v.number(),
    apiType: v.union(v.literal("core"), v.literal("search"), v.literal("graphql")),
    remaining: v.number(),
    reset: v.number(),
    limit: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("githubRateLimits")
      .withIndex("by_installation_api", (q) =>
        q.eq("installationId", args.installationId).eq("apiType", args.apiType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        remaining: args.remaining,
        reset: args.reset,
        limit: args.limit,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("githubRateLimits", {
        installationId: args.installationId,
        apiType: args.apiType,
        remaining: args.remaining,
        reset: args.reset,
        limit: args.limit,
        lastUpdated: Date.now(),
      });
    }

    return null;
  },
});

// Get current rate limit status
export const getRateLimitStatus = internalQuery({
  args: {
    installationId: v.number(),
  },
  returns: v.object({
    core: v.union(
      v.object({
        remaining: v.number(),
        reset: v.number(),
        limit: v.number(),
        lastUpdated: v.number(),
      }),
      v.null()
    ),
    search: v.union(
      v.object({
        remaining: v.number(),
        reset: v.number(),
        limit: v.number(),
        lastUpdated: v.number(),
      }),
      v.null()
    ),
    graphql: v.union(
      v.object({
        remaining: v.number(),
        reset: v.number(),
        limit: v.number(),
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

    const result: {
      core: { remaining: number; reset: number; limit: number; lastUpdated: number } | null;
      search: { remaining: number; reset: number; limit: number; lastUpdated: number } | null;
      graphql: { remaining: number; reset: number; limit: number; lastUpdated: number } | null;
    } = {
      core: null,
      search: null,
      graphql: null,
    };

    for (const limit of limits) {
      result[limit.apiType] = {
        remaining: limit.remaining,
        reset: limit.reset,
        limit: limit.limit,
        lastUpdated: limit.lastUpdated,
      };
    }

    return result;
  },
});

// Check if we can make a request
export const canMakeRequest = internalQuery({
  args: {
    installationId: v.number(),
    apiType: v.union(v.literal("core"), v.literal("search"), v.literal("graphql")),
    buffer: v.optional(v.number()),
  },
  returns: v.object({
    allowed: v.boolean(),
    waitTimeMs: v.number(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const buffer = args.buffer ?? 100;

    const limit = await ctx.db
      .query("githubRateLimits")
      .withIndex("by_installation_api", (q) =>
        q.eq("installationId", args.installationId).eq("apiType", args.apiType)
      )
      .first();

    // If no limit data, allow the request
    if (!limit) {
      return { allowed: true, waitTimeMs: 0 };
    }

    // Check if limit has reset
    const now = Math.floor(Date.now() / 1000);
    if (now >= limit.reset) {
      return { allowed: true, waitTimeMs: 0 };
    }

    // Check if we have enough remaining
    if (limit.remaining > buffer) {
      return { allowed: true, waitTimeMs: 0 };
    }

    // Rate limited - calculate wait time
    const waitTimeMs = (limit.reset - now) * 1000;
    return {
      allowed: false,
      waitTimeMs,
      reason: `Rate limit remaining (${limit.remaining}) below buffer (${buffer}). Resets in ${Math.ceil(waitTimeMs / 1000)}s`,
    };
  },
});

// Clean up old rate limit records
export const cleanupOldRateLimits = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Delete records older than 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const oldRecords = await ctx.db
      .query("githubRateLimits")
      .filter((q) => q.lt(q.field("lastUpdated"), cutoff))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }

    return oldRecords.length;
  },
});
