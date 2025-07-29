import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Calculate profile completeness
function calculateCompleteness(profile: any): number {
  let score = 0;
  let total = 0;

  // Status (10 points)
  total += 10;
  if (profile.status) score += 10;

  // Work hours (10 points)
  total += 10;
  if (profile.workHours) score += 10;

  // Tech stack (20 points)
  total += 20;
  if (profile.techStack && profile.techStack.length > 0) {
    score += Math.min(20, profile.techStack.length * 4);
  }

  // Review preferences (10 points)
  total += 10;
  if (profile.reviewPreferences) score += 10;

  // GitHub integration (20 points)
  total += 20;
  if (profile.githubStats) score += 20;

  // Git co-author (10 points)
  total += 10;
  if (profile.gitCoAuthorString) score += 10;

  // Availability settings (10 points)
  total += 10;
  if (profile.availability) score += 10;

  // Current focus (10 points)
  total += 10;
  if (profile.currentFocus) score += 10;

  return Math.round((score / total) * 100);
}

// Create or update developer profile
export const updateDeveloperProfile = mutation({
  args: {
    status: v.optional(v.union(
      v.literal("LOCKED_IN"),
      v.literal("AVAILABLE"),
      v.literal("IN_REVIEW"),
      v.literal("AFK"),
      v.literal("IN_MEETING")
    )),
    statusMessage: v.optional(v.string()),
    timezone: v.optional(v.string()),
    workHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
      days: v.array(v.number()),
    })),
    techStack: v.optional(v.array(v.object({
      name: v.string(),
      level: v.union(v.literal("expert"), v.literal("proficient"), v.literal("learning")),
      yearsOfExperience: v.optional(v.number()),
    }))),
    currentFocus: v.optional(v.string()),
    reviewPreferences: v.optional(v.object({
      maxConcurrentReviews: v.number(),
      preferredFileTypes: v.array(v.string()),
      averageResponseTime: v.optional(v.number()),
    })),
    availability: v.optional(v.object({
      forProjects: v.boolean(),
      forReviews: v.boolean(),
      forPairing: v.boolean(),
    })),
    gitCoAuthorString: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const existingProfile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const profileData = {
      ...args,
      profileCompleteness: calculateCompleteness(args),
      updatedAt: Date.now(),
    };

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, profileData);
      
      // Update expertise search index if tech stack changed
      if (args.techStack) {
        await updateExpertiseIndex(ctx, existingProfile._id, user._id, args.techStack);
      }

      return existingProfile._id;
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("developerProfiles", {
        userId: user._id,
        ...profileData,
        createdAt: Date.now(),
      });

      // Create expertise search index
      if (args.techStack) {
        await updateExpertiseIndex(ctx, profileId, user._id, args.techStack);
      }

      return profileId;
    }
  },
});

// Quick status update
export const updateStatus = mutation({
  args: {
    status: v.union(
      v.literal("LOCKED_IN"),
      v.literal("AVAILABLE"),
      v.literal("IN_REVIEW"),
      v.literal("AFK"),
      v.literal("IN_MEETING")
    ),
    statusMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const profile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        status: args.status,
        statusMessage: args.statusMessage,
        updatedAt: Date.now(),
      });
    } else {
      // Create profile with just status
      await ctx.db.insert("developerProfiles", {
        userId: user._id,
        status: args.status,
        statusMessage: args.statusMessage,
        profileCompleteness: calculateCompleteness({ status: args.status }),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Update tech stack
export const updateTechStack = mutation({
  args: {
    techStack: v.array(v.object({
      name: v.string(),
      level: v.union(v.literal("expert"), v.literal("proficient"), v.literal("learning")),
      yearsOfExperience: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const profile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        techStack: args.techStack,
        profileCompleteness: calculateCompleteness({ ...profile, techStack: args.techStack }),
        updatedAt: Date.now(),
      });
      
      await updateExpertiseIndex(ctx, profile._id, user._id, args.techStack);
    } else {
      // Create profile with tech stack
      const profileId = await ctx.db.insert("developerProfiles", {
        userId: user._id,
        techStack: args.techStack,
        profileCompleteness: calculateCompleteness({ techStack: args.techStack }),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      await updateExpertiseIndex(ctx, profileId, user._id, args.techStack);
    }
  },
});

// Sync GitHub stats (would be called by a scheduled function or webhook)
export const syncGithubStats = mutation({
  args: {
    userId: v.id("users"),
    githubStats: v.object({
      username: v.optional(v.string()),
      totalPRs: v.number(),
      totalReviews: v.number(),
      avgReviewTime: v.number(),
      languages: v.array(v.object({
        name: v.string(),
        percentage: v.number(),
      })),
      lastSynced: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        githubStats: args.githubStats,
        profileCompleteness: calculateCompleteness({ ...profile, githubStats: args.githubStats }),
        updatedAt: Date.now(),
      });
    } else {
      // Create profile with GitHub stats
      await ctx.db.insert("developerProfiles", {
        userId: args.userId,
        githubStats: args.githubStats,
        profileCompleteness: calculateCompleteness({ githubStats: args.githubStats }),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Helper function to update expertise search index
async function updateExpertiseIndex(
  ctx: any,
  profileId: Id<"developerProfiles">,
  userId: Id<"users">,
  techStack: Array<{ name: string; level: string }>
) {
  // Delete existing entries
  const existingEntries = await ctx.db
    .query("expertiseSearchIndex")
    .filter((q: any) => q.eq(q.field("profileId"), profileId))
    .collect();

  for (const entry of existingEntries) {
    await ctx.db.delete(entry._id);
  }

  // Insert new entries
  for (const tech of techStack) {
    await ctx.db.insert("expertiseSearchIndex", {
      profileId,
      userId,
      technology: tech.name,
      level: tech.level,
      searchableText: `${tech.name.toLowerCase()} ${tech.level.toLowerCase()}`,
    });
  }
}