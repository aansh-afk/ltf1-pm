import { query } from "../_generated/server";
import { v } from "convex/values";

export const getProjectMeetings = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get project to verify access
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(args.limit || 50);

    // Enrich meetings with user information
    const enrichedMeetings = await Promise.all(
      meetings.map(async (meeting) => {
        const organizer = await ctx.db.get(meeting.organizerId);
        
        const attendeesWithUsers = await Promise.all(
          meeting.attendees.map(async (attendee) => {
            const attendeeUser = await ctx.db.get(attendee.userId);
            return {
              ...attendee,
              user: attendeeUser ? {
                _id: attendeeUser._id,
                name: attendeeUser.name,
                email: attendeeUser.email,
                avatarUrl: attendeeUser.avatarUrl,
              } : null,
            };
          })
        );

        return {
          ...meeting,
          organizer: organizer ? {
            _id: organizer._id,
            name: organizer.name,
            email: organizer.email,
            avatarUrl: organizer.avatarUrl,
          } : null,
          attendees: attendeesWithUsers,
        };
      })
    );

    return enrichedMeetings;
  },
});

export const getWorkspaceMeetings = query({
  args: {
    workspaceId: v.id("workspaces"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("standup"), 
      v.literal("retrospective"), 
      v.literal("planning"), 
      v.literal("review"),
      v.literal("custom")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    let meetingsQuery = ctx.db
      .query("meetings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    if (args.startDate && args.endDate) {
      meetingsQuery = meetingsQuery
        .filter((q) => 
          q.and(
            q.gte(q.field("startTime"), args.startDate!),
            q.lte(q.field("startTime"), args.endDate!)
          )
        );
    }

    if (args.type) {
      meetingsQuery = meetingsQuery
        .filter((q) => q.eq(q.field("type"), args.type!));
    }

    const meetings = await meetingsQuery
      .order("asc")
      .collect();

    return meetings;
  },
});

export const getUserMeetings = query({
  args: {
    workspaceId: v.id("workspaces"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let meetingsQuery = ctx.db
      .query("meetings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    if (args.startDate && args.endDate) {
      meetingsQuery = meetingsQuery
        .filter((q) => 
          q.and(
            q.gte(q.field("startTime"), args.startDate!),
            q.lte(q.field("startTime"), args.endDate!)
          )
        );
    }

    const allMeetings = await meetingsQuery.collect();

    // Filter meetings where user is organizer or attendee
    const userMeetings = allMeetings.filter(meeting => 
      meeting.organizerId === user._id || 
      meeting.attendees.some(attendee => attendee.userId === user._id)
    );

    return userMeetings;
  },
});

export const getMeeting = query({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Enrich with user information
    const organizer = await ctx.db.get(meeting.organizerId);
    
    const attendeesWithUsers = await Promise.all(
      meeting.attendees.map(async (attendee) => {
        const attendeeUser = await ctx.db.get(attendee.userId);
        return {
          ...attendee,
          user: attendeeUser ? {
            _id: attendeeUser._id,
            name: attendeeUser.name,
            email: attendeeUser.email,
            avatarUrl: attendeeUser.avatarUrl,
          } : null,
        };
      })
    );

    // Get related tasks if any
    const relatedTasks = await Promise.all(
      meeting.relatedTasks.map(taskId => ctx.db.get(taskId))
    );

    return {
      ...meeting,
      organizer: organizer ? {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        avatarUrl: organizer.avatarUrl,
      } : null,
      attendees: attendeesWithUsers,
      relatedTasksData: relatedTasks.filter(Boolean),
    };
  },
});

export const getUpcomingMeetings = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    
    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.gte(q.field("startTime"), now))
      .order("asc")
      .take(args.limit || 10);

    // Filter meetings where user is involved
    const userMeetings = meetings.filter(meeting => 
      meeting.organizerId === user._id || 
      meeting.attendees.some(attendee => attendee.userId === user._id)
    );

    return userMeetings;
  },
});

export const getMeetingTemplates = query({
  args: {},
  handler: async (_ctx, _args) => {
    // Return predefined meeting templates for sprint ceremonies
    return [
      {
        id: "standup",
        type: "standup",
        title: "Daily Standup",
        duration: 15,
        agenda: [
          "What did you work on yesterday?",
          "What will you work on today?",
          "Any blockers or impediments?",
        ],
        isRecurring: true,
        defaultRecurrence: {
          frequency: "daily" as const,
          interval: 1,
        },
      },
      {
        id: "retrospective",
        type: "retrospective",
        title: "Sprint Retrospective",
        duration: 60,
        agenda: [
          "What went well this sprint?",
          "What could be improved?",
          "Action items for next sprint",
        ],
        isRecurring: true,
        defaultRecurrence: {
          frequency: "weekly" as const,
          interval: 2, // Every 2 weeks
        },
      },
      {
        id: "planning",
        type: "planning",
        title: "Sprint Planning",
        duration: 120,
        agenda: [
          "Review sprint goal",
          "Task estimation and assignment",
          "Capacity planning",
          "Risk assessment",
        ],
        isRecurring: true,
        defaultRecurrence: {
          frequency: "weekly" as const,
          interval: 2, // Every 2 weeks
        },
      },
      {
        id: "review",
        type: "review",
        title: "Sprint Review",
        duration: 60,
        agenda: [
          "Demo completed features",
          "Gather stakeholder feedback",
          "Review sprint metrics",
          "Plan next sprint priorities",
        ],
        isRecurring: true,
        defaultRecurrence: {
          frequency: "weekly" as const,
          interval: 2, // Every 2 weeks
        },
      },
    ];
  },
});