import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { taskDueReminder, taskOverdue, meetingReminder } from "./templates";

const ONE_DAY_MS = 86_400_000;

// Query tasks with upcoming due dates (within 7 days)
export const getTasksDueSoon = internalQuery({
  args: {},
  returns: v.array(v.object({
    taskId: v.string(),
    taskTitle: v.string(),
    taskNumber: v.number(),
    projectId: v.id("projects"),
    dueDate: v.number(),
    assigneeIds: v.array(v.id("users")),
  })),
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * ONE_DAY_MS;

    // Get all non-completed tasks via by_status index
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status")
      .collect();

    const results: Array<{
      taskId: string;
      taskTitle: string;
      taskNumber: number;
      projectId: Id<"projects">;
      dueDate: number;
      assigneeIds: Array<Id<"users">>;
    }> = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;
      if (task.status === "done" || task.status === "cancelled") continue;
      if (!task.assigneeIds || task.assigneeIds.length === 0) continue;
      if (task.dueDate < now || task.dueDate > sevenDaysFromNow) continue;

      results.push({
        taskId: task._id,
        taskTitle: task.title,
        taskNumber: task.number,
        projectId: task.projectId,
        dueDate: task.dueDate,
        assigneeIds: task.assigneeIds,
      });
    }

    return results;
  },
});

// Query overdue tasks
export const getOverdueTasks = internalQuery({
  args: {},
  returns: v.array(v.object({
    taskId: v.string(),
    taskTitle: v.string(),
    taskNumber: v.number(),
    projectId: v.id("projects"),
    dueDate: v.number(),
    assigneeIds: v.array(v.id("users")),
  })),
  handler: async (ctx) => {
    const now = Date.now();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status")
      .collect();

    const results: Array<{
      taskId: string;
      taskTitle: string;
      taskNumber: number;
      projectId: Id<"projects">;
      dueDate: number;
      assigneeIds: Array<Id<"users">>;
    }> = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;
      if (task.status === "done" || task.status === "cancelled") continue;
      if (!task.assigneeIds || task.assigneeIds.length === 0) continue;
      if (task.dueDate >= now) continue;

      results.push({
        taskId: task._id,
        taskTitle: task.title,
        taskNumber: task.number,
        projectId: task.projectId,
        dueDate: task.dueDate,
        assigneeIds: task.assigneeIds,
      });
    }

    return results;
  },
});

// Query upcoming meetings (within next 60 minutes)
export const getUpcomingMeetings = internalQuery({
  args: {},
  returns: v.array(v.object({
    meetingId: v.string(),
    title: v.string(),
    type: v.string(),
    startTime: v.number(),
    meetingUrl: v.optional(v.string()),
    attendeeUserIds: v.array(v.id("users")),
  })),
  handler: async (ctx) => {
    const now = Date.now();
    const sixtyMinutesFromNow = now + 60 * 60 * 1000;

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_start_time")
      .collect();

    const results: Array<{
      meetingId: string;
      title: string;
      type: string;
      startTime: number;
      meetingUrl?: string;
      attendeeUserIds: Array<Id<"users">>;
    }> = [];

    for (const meeting of meetings) {
      if (meeting.startTime < now || meeting.startTime > sixtyMinutesFromNow) continue;

      const attendeeUserIds = meeting.attendees
        .filter((a) => a.status === "accepted" || a.status === "pending")
        .map((a) => a.userId);

      if (attendeeUserIds.length === 0) continue;

      results.push({
        meetingId: meeting._id,
        title: meeting.title,
        type: meeting.type,
        startTime: meeting.startTime,
        meetingUrl: meeting.meetingUrl,
        attendeeUserIds,
      });
    }

    return results;
  },
});

// Helper query: get project info for email
export const getProjectById = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.union(v.null(), v.object({
    name: v.string(),
    taskPrefix: v.string(),
  })),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    return {
      name: project.name,
      taskPrefix: project.settings.taskPrefix,
    };
  },
});

// Helper query: get user email info
export const getUserEmailInfo = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.null(), v.object({
    email: v.string(),
    emailEnabled: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      email: user.email,
      emailEnabled: user.preferences?.notifications?.email !== false,
    };
  },
});

// Process due date reminders
export const processDueDateReminders = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const tasks = await ctx.runQuery(internal.email.cronHelpers.getTasksDueSoon);
    const now = Date.now();

    for (const task of tasks) {
      const daysLeft = Math.ceil((task.dueDate - now) / ONE_DAY_MS);

      // Only send for 1, 3, or 7 days out
      if (daysLeft !== 1 && daysLeft !== 3 && daysLeft !== 7) continue;

      const project = await ctx.runQuery(internal.email.cronHelpers.getProjectById, { projectId: task.projectId as Id<"projects"> });
      if (!project) continue;

      const taskKey = `${project.taskPrefix}-${task.taskNumber}`;
      const dueDate = new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      for (const assigneeId of task.assigneeIds) {
        const userInfo = await ctx.runQuery(internal.email.cronHelpers.getUserEmailInfo, { userId: assigneeId });
        if (!userInfo || !userInfo.emailEnabled) continue;

        const emailContent = taskDueReminder({
          taskTitle: task.taskTitle,
          taskKey,
          projectName: project.name,
          dueDate,
          daysLeft,
        });

        await ctx.runAction(internal.email.send.sendEmail, {
          to: userInfo.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    }

    return null;
  },
});

// Process overdue task alerts
export const processOverdueAlerts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const tasks = await ctx.runQuery(internal.email.cronHelpers.getOverdueTasks);
    const now = Date.now();

    for (const task of tasks) {
      const daysOverdue = Math.floor((now - task.dueDate) / ONE_DAY_MS);
      if (daysOverdue < 1) continue;

      const project = await ctx.runQuery(internal.email.cronHelpers.getProjectById, { projectId: task.projectId as Id<"projects"> });
      if (!project) continue;

      const taskKey = `${project.taskPrefix}-${task.taskNumber}`;
      const dueDate = new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      for (const assigneeId of task.assigneeIds) {
        const userInfo = await ctx.runQuery(internal.email.cronHelpers.getUserEmailInfo, { userId: assigneeId });
        if (!userInfo || !userInfo.emailEnabled) continue;

        const emailContent = taskOverdue({
          taskTitle: task.taskTitle,
          taskKey,
          projectName: project.name,
          dueDate,
          daysOverdue,
        });

        await ctx.runAction(internal.email.send.sendEmail, {
          to: userInfo.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    }

    return null;
  },
});

// Process meeting reminders
export const processMeetingReminders = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const meetings = await ctx.runQuery(internal.email.cronHelpers.getUpcomingMeetings);
    const now = Date.now();

    for (const meeting of meetings) {
      const minutesUntil = Math.round((meeting.startTime - now) / 60000);

      // Only send at 60min and 15min marks (with 5min tolerance)
      const is60min = minutesUntil >= 55 && minutesUntil <= 65;
      const is15min = minutesUntil >= 10 && minutesUntil <= 20;

      if (!is60min && !is15min) continue;

      const startTime = new Date(meeting.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      for (const userId of meeting.attendeeUserIds) {
        const userInfo = await ctx.runQuery(internal.email.cronHelpers.getUserEmailInfo, { userId });
        if (!userInfo || !userInfo.emailEnabled) continue;

        const emailContent = meetingReminder({
          meetingTitle: meeting.title,
          meetingType: meeting.type,
          startTime,
          meetingUrl: meeting.meetingUrl,
          minutesUntil: is60min ? 60 : 15,
        });

        await ctx.runAction(internal.email.send.sendEmail, {
          to: userInfo.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    }

    return null;
  },
});
