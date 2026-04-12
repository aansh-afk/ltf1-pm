import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requirePermission } from "../auth/permissions";
import { internal } from "../_generated/api";
// Email templates now handled by centralized dispatch
import { getCurrentUserOrThrow } from "../lib/auth";

export const createMeeting = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    sprintId: v.optional(v.id("sprints")),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("standup"), 
      v.literal("retrospective"), 
      v.literal("planning"), 
      v.literal("review"),
      v.literal("custom")
    ),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    attendeeIds: v.array(v.id("users")),
    relatedTaskIds: v.optional(v.array(v.id("tasks"))),
    recurrence: v.optional(v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      interval: v.number(),
      endDate: v.optional(v.number()),
    })),
    template: v.optional(v.object({
      agenda: v.optional(v.array(v.string())),
      duration: v.optional(v.number()),
      isRecurring: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await requirePermission(ctx.db, user._id, args.workspaceId, "meeting.create");

    const now = Date.now();

    // Create attendees array with organizer auto-accepted
    const attendees = args.attendeeIds.map(userId => ({
      userId,
      status: userId === user._id ? "accepted" as const : "pending" as const,
      responseTime: userId === user._id ? now : undefined,
    }));

    const meetingId = await ctx.db.insert("meetings", {
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      sprintId: args.sprintId,
      title: args.title,
      description: args.description,
      type: args.type,
      organizerId: user._id,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
      meetingUrl: args.meetingUrl,
      attendees,
      relatedTasks: args.relatedTaskIds || [],
      recurrence: args.recurrence,
      template: args.template,
      recordings: [],
      createdAt: now,
      updatedAt: now,
    });

    // Log meeting scheduled activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "meeting_scheduled",
      projectId: args.projectId,
      workspaceId: args.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "meeting",
      targetId: meetingId,
      targetName: args.title,
      description: `scheduled meeting "${args.title}"`,
      metadata: {
        extra: { 
          type: args.type,
          attendeeCount: args.attendeeIds.length 
        }
      }
    });

    // Notify attendees via centralized dispatch
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    for (const attendeeObj of attendees) {
      if (attendeeObj.userId !== user._id) {
        await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
          recipientUserId: attendeeObj.userId,
          workspaceId: args.workspaceId,
          type: "meeting_scheduled",
          title: "Meeting Scheduled",
          body: `${user.name || user.email} scheduled "${args.title}"`,
          actorId: user._id,
          entityId: meetingId,
          entityType: "meeting",
          emailData: {
            organizerName: user.name || user.email,
            meetingTitle: args.title,
            meetingType: args.type,
            startTime: formatDate(args.startTime),
            endTime: formatDate(args.endTime),
            location: args.location,
            meetingUrl: args.meetingUrl,
          },
        });
      }
    }

    return meetingId;
  },
});

export const updateMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    await requirePermission(ctx.db, user._id, meeting.workspaceId, "meeting.edit");

    const updates: any = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.location !== undefined) updates.location = args.location;
    if (args.meetingUrl !== undefined) updates.meetingUrl = args.meetingUrl;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.meetingId, updates);

    // Log meeting updated activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "meeting_scheduled",
      projectId: meeting.projectId,
      workspaceId: meeting.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "meeting",
      targetId: args.meetingId,
      targetName: meeting.title,
      description: `updated meeting "${meeting.title}"`,
      metadata: {
        extra: { updates }
      }
    });

    // Send update emails to attendees
    const changesList: string[] = [];
    if (args.title) changesList.push("title");
    if (args.startTime) changesList.push("start time");
    if (args.endTime) changesList.push("end time");
    if (args.location) changesList.push("location");
    if (args.meetingUrl) changesList.push("meeting link");
    if (args.description) changesList.push("description");

    if (changesList.length > 0) {
      for (const attendeeObj of meeting.attendees) {
        if (attendeeObj.userId !== user._id) {
          await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
            recipientUserId: attendeeObj.userId,
            workspaceId: meeting.workspaceId,
            type: "meeting_updated",
            title: "Meeting Updated",
            body: `"${args.title || meeting.title}" updated: ${changesList.join(", ")}`,
            actorId: user._id,
            entityId: args.meetingId,
            entityType: "meeting",
            emailData: {
              organizerName: user.name || user.email,
              meetingTitle: args.title || meeting.title,
              changes: changesList.join(", "),
            },
          });
        }
      }
    }

    return args.meetingId;
  },
});

export const respondToMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
    status: v.union(v.literal("accepted"), v.literal("declined"), v.literal("tentative")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const updatedAttendees = meeting.attendees.map(attendee => 
      attendee.userId === user._id 
        ? { ...attendee, status: args.status, responseTime: Date.now() }
        : attendee
    );

    await ctx.db.patch(args.meetingId, {
      attendees: updatedAttendees,
      updatedAt: Date.now(),
    });

    // Log meeting response activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "meeting_scheduled",
      projectId: meeting.projectId,
      workspaceId: meeting.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "meeting",
      targetId: args.meetingId,
      targetName: meeting.title,
      description: `${args.status} meeting "${meeting.title}"`,
      metadata: {
        extra: { responseStatus: args.status }
      }
    });

    return args.meetingId;
  },
});

export const addActionItem = mutation({
  args: {
    meetingId: v.id("meetings"),
    description: v.string(),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    await requirePermission(ctx.db, user._id, meeting.workspaceId, "meeting.edit");

    const now = Date.now();
    const actionItem = {
      id: crypto.randomUUID(),
      description: args.description,
      assigneeId: args.assigneeId,
      completed: false,
      createdAt: now,
    };

    const existingActionItems = meeting.actionItems || [];
    const updatedActionItems = [...existingActionItems, actionItem];

    await ctx.db.patch(args.meetingId, {
      actionItems: updatedActionItems,
      updatedAt: now,
    });

    return actionItem.id;
  },
});

export const convertActionItemToTask = mutation({
  args: {
    meetingId: v.id("meetings"),
    actionItemId: v.string(),
    taskTitle: v.optional(v.string()),
    taskType: v.optional(v.string()),
    taskPriority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    const actionItem = meeting.actionItems?.find(item => item.id === args.actionItemId);
    if (!actionItem) {
      throw new Error("Action item not found");
    }

    // Ensure meeting is associated with a project
    if (!meeting.projectId) {
      throw new Error("Cannot create task from workspace-level meeting. Please associate meeting with a project first.");
    }

    // Get the next task number for this project
    const lastTask = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", meeting.projectId!))
      .order("desc")
      .first();
    
    const nextNumber = (lastTask?.number || 0) + 1;

    // Create task from action item
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      projectId: meeting.projectId!,
      number: nextNumber,
      title: args.taskTitle || actionItem.description,
      description: `Created from meeting: ${meeting.title}`,
      type: (args.taskType && ["feature", "bug", "improvement", "task", "epic"].includes(args.taskType) ? args.taskType : "task") as "feature" | "bug" | "improvement" | "task" | "epic",
      priority: (args.taskPriority && ["urgent", "high", "medium", "low"].includes(args.taskPriority) ? args.taskPriority : "medium") as "urgent" | "high" | "medium" | "low",
      status: "backlog",
      assigneeId: actionItem.assigneeId,
      assigneeIds: actionItem.assigneeId ? [actionItem.assigneeId] : [],
      reporterId: user._id,
      labels: ["meeting-action-item"],
      position: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update action item with task reference
    const updatedActionItems = meeting.actionItems?.map(item =>
      item.id === args.actionItemId
        ? { ...item, createdTaskId: taskId }
        : item
    );

    await ctx.db.patch(args.meetingId, {
      actionItems: updatedActionItems,
      updatedAt: now,
    });

    return taskId;
  },
});

export const deleteMeeting = mutation({
  args: {
    meetingId: v.id("meetings"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    await requirePermission(ctx.db, user._id, meeting.workspaceId, "meeting.delete");

    // Notify attendees about cancellation via dispatch
    const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    for (const attendeeObj of meeting.attendees) {
      if (attendeeObj.userId !== user._id) {
        await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
          recipientUserId: attendeeObj.userId,
          workspaceId: meeting.workspaceId,
          type: "meeting_cancelled",
          title: "Meeting Cancelled",
          body: `"${meeting.title}" has been cancelled`,
          actorId: user._id,
          entityId: args.meetingId,
          entityType: "meeting",
          emailData: {
            organizerName: user.name || user.email,
            meetingTitle: meeting.title,
            startTime: formatDate(meeting.startTime),
          },
        });
      }
    }

    await ctx.db.delete(args.meetingId);

    // Log meeting cancelled activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "meeting_cancelled",
      projectId: meeting.projectId,
      workspaceId: meeting.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "meeting",
      targetId: args.meetingId,
      targetName: meeting.title,
      description: `cancelled meeting "${meeting.title}"`,
      metadata: undefined
    });

    return args.meetingId;
  },
});