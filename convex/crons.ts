import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process GitHub issue sync queue every minute
crons.interval(
  "process-github-issue-sync-queue",
  { minutes: 1 },
  internal.integrations.github.issueSync.processSyncQueue,
  {}
);

// Process GitHub team sync every hour
crons.interval(
  "process-github-team-sync",
  { hours: 1 },
  internal.integrations.github.teamSync.processTeamSyncQueue,
  {}
);

// Sync GitHub repositories every 15 minutes
// This ensures all repos are available, especially for "all repositories" selection
crons.interval(
  "process-github-repository-sync",
  { minutes: 15 },
  internal.integrations.github.syncActions.processRepositorySyncQueue,
  {}
);

// Sync developer GitHub stats every 30 minutes
crons.interval(
  "process-github-stats-sync",
  { minutes: 30 },
  internal.integrations.github.syncActions.processStatsSyncQueue,
  {}
);

// Due date reminders - check every 6 hours
crons.interval(
  "process-due-date-reminders",
  { hours: 6 },
  internal.email.cronHelpers.processDueDateReminders,
  {}
);

// Overdue task alerts - check every 12 hours
crons.interval(
  "process-overdue-alerts",
  { hours: 12 },
  internal.email.cronHelpers.processOverdueAlerts,
  {}
);

// Meeting reminders - check every 15 minutes
crons.interval(
  "process-meeting-reminders",
  { minutes: 15 },
  internal.email.cronHelpers.processMeetingReminders,
  {}
);

// Sprint ending soon reminders - check every 12 hours
crons.interval(
  "process-sprint-ending-reminders",
  { hours: 12 },
  internal.email.cronHelpers.processSprintEndingReminders,
  {}
);

// Daily sprint snapshot at midnight UTC for burndown charts
crons.cron(
  "daily sprint snapshot",
  "0 0 * * *",
  internal.sprints.snapshots.captureAllActiveSprintSnapshots,
  {}
);

export default crons;
