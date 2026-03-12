import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getCurrentUserOrThrow } from "../lib/auth";

// Calculate profile completeness
function calculateCompleteness(profile: any): number {
  let score = 0;
  let total = 0;

  // Essential information (30 points)
  total += 30;
  if (profile.role || profile.profile?.role) score += 10;
  if (profile.location || profile.profile?.location) score += 10;
  if (profile.timezone || profile.profile?.timezone) score += 10;

  // Tech stack/expertise (20 points)
  total += 20;
  if ((profile.techStack && profile.techStack.length > 0) || 
      (profile.technologies && profile.technologies.length > 0) ||
      (profile.profile?.technologies && profile.profile.technologies.length > 0)) {
    const techCount = profile.techStack?.length || profile.technologies?.length || profile.profile?.technologies?.length || 0;
    score += Math.min(20, techCount * 4);
  }

  // Professional info (20 points)
  total += 20;
  const yearsExp = profile.yearsExperience || profile.profile?.yearsExperience;
  if (yearsExp !== undefined && yearsExp > 0) score += 10;
  if (profile.careerLevel || profile.profile?.careerLevel) score += 10;

  // Skills and interests (10 points)
  total += 10;
  if ((profile.skills && profile.skills.length > 0) || 
      (profile.profile?.skills && profile.profile.skills.length > 0)) score += 5;
  if ((profile.interests && profile.interests.length > 0) || 
      (profile.profile?.interests && profile.profile.interests.length > 0)) score += 5;

  // Work preferences (10 points)
  total += 10;
  if (profile.workingHours || profile.workHours || profile.profile?.workingHours) score += 5;
  if (profile.communicationPrefs || profile.profile?.communicationPrefs) score += 5;

  // Personal touch (10 points)
  total += 10;
  if (profile.bio || profile.profile?.bio) score += 5;
  if (profile.careerGoals || profile.workStyle || profile.profile?.careerGoals || profile.profile?.workStyle) score += 5;

  return Math.round((score / total) * 100);
}

// Create or update developer profile
export const updateDeveloperProfile = mutation({
  args: {
    // User fields (stored in users table)
    userId: v.id("users"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    
    // Profile fields (stored in developerProfiles table)
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
    
    // Additional profile fields from frontend (store in a new profileInfo field)
    role: v.optional(v.string()),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    yearsExperience: v.optional(v.number()),
    careerLevel: v.optional(v.union(v.literal("junior"), v.literal("mid"), v.literal("senior"), v.literal("lead"), v.literal("principal"))),
    skills: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    workingHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    })),
    communicationPrefs: v.optional(v.union(v.literal("email"), v.literal("slack"), v.literal("teams"), v.literal("discord"))),
    workStyle: v.optional(v.string()),
    careerGoals: v.optional(v.string()),
    mentoringInterests: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (user._id !== args.userId) throw new Error("Unauthorized");

    // Update user fields (name and bio)
    if (args.name !== undefined || args.bio !== undefined) {
      await ctx.db.patch(user._id, {
        ...(args.name !== undefined && { name: args.name }),
        ...(args.bio !== undefined && { bio: args.bio }),
      });
    }

    // Prepare profile object with all the additional fields
    const profileInfo = {
      role: args.role,
      bio: args.bio,
      location: args.location,
      phone: args.phone,
      githubUsername: args.githubUsername,
      yearsExperience: args.yearsExperience,
      careerLevel: args.careerLevel,
      skills: args.skills,
      interests: args.interests,
      workingHours: args.workingHours,
      communicationPrefs: args.communicationPrefs,
      workStyle: args.workStyle,
      careerGoals: args.careerGoals,
      mentoringInterests: args.mentoringInterests,
      technologies: args.techStack, // Store techStack as technologies in profile
      timezone: args.timezone,
      availability: args.availability,
    };

    // Remove undefined values from profileInfo
    const cleanedProfileInfo = Object.fromEntries(
      Object.entries(profileInfo).filter(([_, v]) => v !== undefined)
    );

    // Calculate completeness first
    const completeness = calculateCompleteness({ ...cleanedProfileInfo, techStack: args.techStack });

    // Prepare developer profile data
    const profileData = {
      profile: cleanedProfileInfo,
      status: args.status,
      statusMessage: args.statusMessage,
      timezone: args.timezone,
      workHours: args.workingHours ? {
        start: args.workingHours.start,
        end: args.workingHours.end,
        days: [1, 2, 3, 4, 5], // Default to weekdays
      } : undefined,
      techStack: args.techStack,
      currentFocus: args.currentFocus,
      reviewPreferences: args.reviewPreferences,
      availability: args.availability,
      gitCoAuthorString: args.gitCoAuthorString,
      profileCompleteness: completeness,
      updatedAt: Date.now(),
    };

    // Remove undefined values
    const cleanedProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, v]) => v !== undefined)
    ) as any;

    const existingProfile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, cleanedProfileData);
      
      // Update expertise search index if tech stack changed
      if (args.techStack) {
        await updateExpertiseIndex(ctx, existingProfile._id, user._id, args.techStack);
      }

      return existingProfile._id;
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("developerProfiles", {
        userId: user._id,
        ...cleanedProfileData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        profileCompleteness: completeness,
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
    const user = await getCurrentUserOrThrow(ctx);

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
    const user = await getCurrentUserOrThrow(ctx);

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