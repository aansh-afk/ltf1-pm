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

export default crons;
