import { v } from "convex/values";
import { query } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

// Default profile for users without profiles
function getDefaultProfile(): Partial<Doc<"developerProfiles">> {
  return {
    status: "AVAILABLE",
    statusMessage: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    workHours: {
      start: "09:00",
      end: "17:00",
      days: [1, 2, 3, 4, 5], // Mon-Fri
    },
    techStack: [],
    currentFocus: "",
    reviewPreferences: {
      maxConcurrentReviews: 3,
      preferredFileTypes: [],
      averageResponseTime: 24,
    },
    githubStats: undefined,
    gitCoAuthorString: "",
    availability: {
      forProjects: true,
      forReviews: true,
      forPairing: false,
    },
    profileCompleteness: 0,
  };
}

// Get a single developer profile with user data
export const getDeveloperProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const developerProfile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!developerProfile) {
      // Return user data with no profile
      return {
        ...user,
        profile: null,
        hasProfile: false,
      };
    }

    // Merge user bio into profile object if it exists
    const profileData = developerProfile.profile || {};
    if (user.bio && !profileData.bio) {
      profileData.bio = user.bio;
    }

    // Return merged data with the nested profile structure
    return {
      ...user,
      name: user.name,
      bio: user.bio,
      profile: {
        ...profileData,
        // Include developer status fields at the profile level for backward compatibility
        status: developerProfile.status,
        statusMessage: developerProfile.statusMessage,
        timezone: developerProfile.timezone || profileData.timezone,
        workHours: developerProfile.workHours,
        techStack: developerProfile.techStack,
        currentFocus: developerProfile.currentFocus,
        reviewPreferences: developerProfile.reviewPreferences,
        githubStats: developerProfile.githubStats,
        gitCoAuthorString: developerProfile.gitCoAuthorString,
        availability: developerProfile.availability,
        profileCompleteness: developerProfile.profileCompleteness,
      },
      hasProfile: true,
    };
  },
});

// Get current user's profile
export const getMyProfile = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    // Call the handler logic directly
    const developerProfile = await ctx.db
      .query("developerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!developerProfile) {
      return {
        ...user,
        profile: null,
        hasProfile: false,
      };
    }

    // Merge user bio into profile object if it exists
    const profileData = developerProfile.profile || {};
    if (user.bio && !profileData.bio) {
      profileData.bio = user.bio;
    }

    return {
      ...user,
      name: user.name,
      bio: user.bio,
      profile: {
        ...profileData,
        status: developerProfile.status,
        statusMessage: developerProfile.statusMessage,
        timezone: developerProfile.timezone || profileData.timezone,
        workHours: developerProfile.workHours,
        techStack: developerProfile.techStack,
        currentFocus: developerProfile.currentFocus,
        reviewPreferences: developerProfile.reviewPreferences,
        githubStats: developerProfile.githubStats,
        gitCoAuthorString: developerProfile.gitCoAuthorString,
        availability: developerProfile.availability,
        profileCompleteness: developerProfile.profileCompleteness,
      },
      hasProfile: true,
    };
  },
});

// Search developers by expertise
export const searchDevelopers = query({
  args: { 
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase();
    const limit = args.limit || 10;

    // Search in expertise index
    const expertiseResults = await ctx.db
      .query("expertiseSearchIndex")
      .withSearchIndex("search_expertise", (q) => 
        q.search("searchableText", searchQuery)
      )
      .take(limit * 2); // Get extra to account for duplicates

    // Get unique user IDs
    const userIds = new Set(expertiseResults.map(r => r.userId));
    
    // Get user and profile data
    const results = await Promise.all(
      Array.from(userIds).slice(0, limit).map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        const profile = await ctx.db
          .query("developerProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();

        return {
          ...user,
          profile: profile || {
            ...getDefaultProfile(),
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          hasProfile: !!profile,
        };
      })
    );

    return results.filter(Boolean);
  },
});

// Get team expertise matrix for a workspace
export const getTeamExpertiseMatrix = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    // Get all workspace members
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Get all unique technologies from profiles
    const allTechnologies = new Set<string>();
    const memberProfiles = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        if (!user) return null;

        const profile = await ctx.db
          .query("developerProfiles")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .first();

        // Support both old techStack and new profile.technologies structure
        const techStack = profile?.techStack || profile?.profile?.technologies || [];
        if (techStack && techStack.length > 0) {
          techStack.forEach(tech => allTechnologies.add(tech.name));
        }

        return {
          member,
          user,
          profile: profile || {
            ...getDefaultProfile(),
            userId: member.userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          hasProfile: !!profile,
        };
      })
    );

    // Build matrix
    const matrix = {
      technologies: Array.from(allTechnologies).sort(),
      members: memberProfiles.filter(Boolean).map(data => ({
        userId: data!.member.userId,
        name: data!.user.name,
        expertise: data!.profile.techStack || data!.profile.profile?.technologies || [],
        status: data!.profile.status || "AVAILABLE",
      })),
    };

    return matrix;
  },
});

// Get suggested reviewers for a task/PR
export const getSuggestedReviewers = query({
  args: { 
    technologies: v.array(v.string()),
    excludeUserId: v.optional(v.id("users")),
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 3;
    
    // Get workspace members
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Score each member based on expertise match
    const scoredMembers = await Promise.all(
      members
        .filter(m => m.userId !== args.excludeUserId)
        .map(async (member) => {
          const user = await ctx.db.get(member.userId);
          if (!user) return null;

          const profile = await ctx.db
            .query("developerProfiles")
            .withIndex("by_user", (q) => q.eq("userId", member.userId))
            .first();

          if (!profile) {
            return {
              user,
              profile: getDefaultProfile(),
              score: 0,
              reasons: ["No profile data available"],
            };
          }

          // Calculate score based on:
          // 1. Technology match
          // 2. Availability
          // 3. Current review load
          let score = 0;
          const reasons: string[] = [];

          // Tech stack match (support both old and new structure)
          const techStack = profile.techStack || profile.profile?.technologies || [];
          const techMatches = techStack.filter(tech => 
            args.technologies.includes(tech.name)
          );
          
          techMatches.forEach(tech => {
            if (tech.level === "expert") score += 3;
            else if (tech.level === "proficient") score += 2;
            else score += 1;
            reasons.push(`${tech.level} in ${tech.name}`);
          });

          // Availability boost
          if (profile.status === "AVAILABLE") {
            score += 2;
            reasons.push("Currently available");
          }

          // Review availability
          if (profile.availability?.forReviews) {
            score += 1;
            reasons.push("Available for reviews");
          }

          return {
            user,
            profile,
            score,
            reasons,
          };
        })
    );

    // Sort by score and return top N
    return scoredMembers
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, limit);
  },
});

// Get all developer statuses for a workspace (real-time dashboard)
export const getWorkspaceStatuses = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const statuses = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        if (!user) return null;

        const profile = await ctx.db
          .query("developerProfiles")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .first();

        // Get current task count
        const activeTasks = await ctx.db
          .query("tasks")
          .withIndex("by_assignee", (q) => q.eq("assigneeId", member.userId))
          .filter((q) => 
            q.or(
              q.eq(q.field("status"), "in_progress"),
              q.eq(q.field("status"), "in_review")
            )
          )
          .collect();

        return {
          userId: member.userId,
          name: user.name,
          avatarUrl: user.avatarUrl,
          status: profile?.status || "AVAILABLE",
          statusMessage: profile?.statusMessage || "",
          currentFocus: profile?.currentFocus || "",
          activeTaskCount: activeTasks.length,
          lastSeenAt: user.lastSeenAt,
        };
      })
    );

    return statuses.filter(Boolean);
  },
});