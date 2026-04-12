import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

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
    workspaceId: v.id("workspaces"),
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
      workspaceId: Id<"workspaces">;
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
        workspaceId: meeting.workspaceId,
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
    workspaceId: v.id("workspaces"),
  })),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    return {
      name: project.name,
      taskPrefix: project.settings.taskPrefix,
      workspaceId: project.workspaceId,
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
        await ctx.runAction(internal.notifications.dispatch.dispatch, {
          recipientUserId: assigneeId,
          workspaceId: project.workspaceId as Id<"workspaces">,
          type: "task_due_reminder",
          title: `Task due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
          body: `"${task.taskTitle}" is due ${dueDate}`,
          entityId: task.taskId,
          entityType: "task",
          emailData: {
            taskTitle: task.taskTitle,
            taskKey,
            projectName: project.name,
            dueDate,
            daysLeft,
          },
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
        await ctx.runAction(internal.notifications.dispatch.dispatch, {
          recipientUserId: assigneeId,
          workspaceId: project.workspaceId as Id<"workspaces">,
          type: "task_overdue",
          title: `Task overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`,
          body: `"${task.taskTitle}" was due ${dueDate}`,
          entityId: task.taskId,
          entityType: "task",
          emailData: {
            taskTitle: task.taskTitle,
            taskKey,
            projectName: project.name,
            dueDate,
            daysOverdue,
          },
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
        await ctx.runAction(internal.notifications.dispatch.dispatch, {
          recipientUserId: userId,
          workspaceId: meeting.workspaceId as Id<"workspaces">,
          type: "meeting_reminder",
          title: `Meeting in ${is60min ? "1 hour" : "15 minutes"}`,
          body: `"${meeting.title}" starts at ${startTime}`,
          entityId: meeting.meetingId,
          entityType: "meeting",
          emailData: {
            meetingTitle: meeting.title,
            meetingType: meeting.type,
            startTime,
            meetingUrl: meeting.meetingUrl,
            minutesUntil: is60min ? 60 : 15,
          },
        });
      }
    }

    return null;
  },
});

// ─── Sprint Ending Soon ───────────────────────────────────────

export const getSprintsEndingSoon = internalQuery({
  args: {},
  returns: v.array(v.object({
    sprintId: v.string(),
    sprintName: v.string(),
    projectId: v.id("projects"),
    workspaceId: v.id("workspaces"),
    endDate: v.number(),
    completedTasks: v.number(),
    totalTasks: v.number(),
    memberIds: v.array(v.id("users")),
  })),
  handler: async (ctx) => {
    const now = Date.now();
    const twoDaysFromNow = now + 2 * ONE_DAY_MS;

    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_status")
      .collect();

    const results: Array<{
      sprintId: string;
      sprintName: string;
      projectId: Id<"projects">;
      workspaceId: Id<"workspaces">;
      endDate: number;
      completedTasks: number;
      totalTasks: number;
      memberIds: Array<Id<"users">>;
    }> = [];

    for (const sprint of sprints) {
      if (sprint.status !== "active") continue;
      if (sprint.endDate < now || sprint.endDate > twoDaysFromNow) continue;

      const project = await ctx.db.get(sprint.projectId);
      if (!project) continue;

      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
        .collect();

      const completedTasks = tasks.filter(t => t.status === "done").length;

      const members = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", sprint.projectId))
        .collect();

      const memberIds = members
        .filter(m => m.status === "active")
        .map(m => m.userId);

      results.push({
        sprintId: sprint._id,
        sprintName: sprint.name,
        projectId: sprint.projectId,
        workspaceId: project.workspaceId,
        endDate: sprint.endDate,
        completedTasks,
        totalTasks: tasks.length,
        memberIds,
      });
    }

    return results;
  },
});

export const processSprintEndingReminders = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const sprints = await ctx.runQuery(internal.email.cronHelpers.getSprintsEndingSoon);
    const now = Date.now();

    for (const sprint of sprints) {
      const daysRemaining = Math.ceil((sprint.endDate - now) / ONE_DAY_MS);
      const endDate = new Date(sprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const project = await ctx.runQuery(internal.email.cronHelpers.getProjectById, { projectId: sprint.projectId });
      if (!project) continue;

      for (const userId of sprint.memberIds) {
        await ctx.runAction(internal.notifications.dispatch.dispatch, {
          recipientUserId: userId,
          workspaceId: sprint.workspaceId as Id<"workspaces">,
          type: "sprint_ending_soon",
          title: `Sprint ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
          body: `"${sprint.sprintName}" ends ${endDate} — ${sprint.completedTasks}/${sprint.totalTasks} tasks done`,
          entityId: sprint.sprintId,
          entityType: "sprint",
          emailData: {
            sprintName: sprint.sprintName,
            projectName: project.name,
            endDate,
            daysRemaining,
            completedTasks: sprint.completedTasks,
            totalTasks: sprint.totalTasks,
          },
        });
      }
    }

    return null;
  },
});
