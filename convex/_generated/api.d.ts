/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activities_mutations from "../activities/mutations.js";
import type * as activities_queries from "../activities/queries.js";
import type * as admin_clearOldActivities from "../admin/clearOldActivities.js";
import type * as admin_inspect_links from "../admin/inspect_links.js";
import type * as admin_inspect_workspaces from "../admin/inspect_workspaces.js";
import type * as admin_link_latest from "../admin/link_latest.js";
import type * as admin_migrationStatus from "../admin/migrationStatus.js";
import type * as admin_one_off_cleanup from "../admin/one_off_cleanup.js";
import type * as ai_mutations from "../ai/mutations.js";
import type * as ai_projectInsights from "../ai/projectInsights.js";
import type * as ai_queries from "../ai/queries.js";
import type * as aiCredits_actions from "../aiCredits/actions.js";
import type * as aiCredits_mutations from "../aiCredits/mutations.js";
import type * as aiCredits_queries from "../aiCredits/queries.js";
import type * as audit from "../audit.js";
import type * as auth_permissions from "../auth/permissions.js";
import type * as auth_users from "../auth/users.js";
import type * as automation from "../automation.js";
import type * as chat from "../chat.js";
import type * as clerk from "../clerk.js";
import type * as cliRefresh from "../cliRefresh.js";
import type * as comments_mutations from "../comments/mutations.js";
import type * as communications_mutations from "../communications/mutations.js";
import type * as communications_queries from "../communications/queries.js";
import type * as crons from "../crons.js";
import type * as customFields from "../customFields.js";
import type * as dashboard_queries from "../dashboard/queries.js";
import type * as developers_mutations from "../developers/mutations.js";
import type * as developers_queries from "../developers/queries.js";
import type * as email_cronHelpers from "../email/cronHelpers.js";
import type * as email_send from "../email/send.js";
import type * as email_templates from "../email/templates.js";
import type * as feedback from "../feedback.js";
import type * as filterPresets_mutations from "../filterPresets/mutations.js";
import type * as filterPresets_queries from "../filterPresets/queries.js";
import type * as http from "../http.js";
import type * as integrations_github_actions from "../integrations/github/actions.js";
import type * as integrations_github_appSimple from "../integrations/github/appSimple.js";
import type * as integrations_github_auth from "../integrations/github/auth.js";
import type * as integrations_github_errors from "../integrations/github/errors.js";
import type * as integrations_github_installationManagement from "../integrations/github/installationManagement.js";
import type * as integrations_github_issueSync from "../integrations/github/issueSync.js";
import type * as integrations_github_issueSyncMutations from "../integrations/github/issueSyncMutations.js";
import type * as integrations_github_logging from "../integrations/github/logging.js";
import type * as integrations_github_monitoring from "../integrations/github/monitoring.js";
import type * as integrations_github_mutations from "../integrations/github/mutations.js";
import type * as integrations_github_nodeActions from "../integrations/github/nodeActions.js";
import type * as integrations_github_oauth from "../integrations/github/oauth.js";
import type * as integrations_github_projectQueries from "../integrations/github/projectQueries.js";
import type * as integrations_github_queries from "../integrations/github/queries.js";
import type * as integrations_github_queryActions from "../integrations/github/queryActions.js";
import type * as integrations_github_rateLimiter from "../integrations/github/rateLimiter.js";
import type * as integrations_github_sync from "../integrations/github/sync.js";
import type * as integrations_github_syncActions from "../integrations/github/syncActions.js";
import type * as integrations_github_teamSync from "../integrations/github/teamSync.js";
import type * as integrations_github_teamSyncMutations from "../integrations/github/teamSyncMutations.js";
import type * as integrations_github_types from "../integrations/github/types.js";
import type * as integrations_github_userMapping from "../integrations/github/userMapping.js";
import type * as integrations_github_webhooks from "../integrations/github/webhooks.js";
import type * as integrations_gitlab_mutations from "../integrations/gitlab/mutations.js";
import type * as integrations_gitlab_oauth from "../integrations/gitlab/oauth.js";
import type * as integrations_gitlab_queries from "../integrations/gitlab/queries.js";
import type * as integrations_gitlab_sync from "../integrations/gitlab/sync.js";
import type * as integrations_gitlab_types from "../integrations/gitlab/types.js";
import type * as integrations_slack_commands from "../integrations/slack/commands.js";
import type * as integrations_slack_events from "../integrations/slack/events.js";
import type * as integrations_slack_mutations from "../integrations/slack/mutations.js";
import type * as integrations_slack_queries from "../integrations/slack/queries.js";
import type * as internalQueries from "../internalQueries.js";
import type * as meetings_mutations from "../meetings/mutations.js";
import type * as meetings_queries from "../meetings/queries.js";
import type * as migrations_clearOldActivities from "../migrations/clearOldActivities.js";
import type * as migrations_migrateToMultipleAssignees from "../migrations/migrateToMultipleAssignees.js";
import type * as migrations from "../migrations.js";
import type * as nps from "../nps.js";
import type * as projects_members from "../projects/members.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as resources from "../resources.js";
import type * as search from "../search.js";
import type * as sprints_mutations from "../sprints/mutations.js";
import type * as sprints_queries from "../sprints/queries.js";
import type * as tasks_mutations from "../tasks/mutations.js";
import type * as tasks_queries from "../tasks/queries.js";
import type * as tasks_timeTracking from "../tasks/timeTracking.js";
import type * as teams from "../teams.js";
import type * as timeEntries from "../timeEntries.js";
import type * as video from "../video.js";
import type * as waitlist from "../waitlist.js";
import type * as whiteboard from "../whiteboard.js";
import type * as workspaces_mutations from "../workspaces/mutations.js";
import type * as workspaces_queries from "../workspaces/queries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "activities/mutations": typeof activities_mutations;
  "activities/queries": typeof activities_queries;
  "admin/clearOldActivities": typeof admin_clearOldActivities;
  "admin/inspect_links": typeof admin_inspect_links;
  "admin/inspect_workspaces": typeof admin_inspect_workspaces;
  "admin/link_latest": typeof admin_link_latest;
  "admin/migrationStatus": typeof admin_migrationStatus;
  "admin/one_off_cleanup": typeof admin_one_off_cleanup;
  "ai/mutations": typeof ai_mutations;
  "ai/projectInsights": typeof ai_projectInsights;
  "ai/queries": typeof ai_queries;
  "aiCredits/actions": typeof aiCredits_actions;
  "aiCredits/mutations": typeof aiCredits_mutations;
  "aiCredits/queries": typeof aiCredits_queries;
  audit: typeof audit;
  "auth/permissions": typeof auth_permissions;
  "auth/users": typeof auth_users;
  automation: typeof automation;
  chat: typeof chat;
  clerk: typeof clerk;
  cliRefresh: typeof cliRefresh;
  "comments/mutations": typeof comments_mutations;
  "communications/mutations": typeof communications_mutations;
  "communications/queries": typeof communications_queries;
  crons: typeof crons;
  customFields: typeof customFields;
  "dashboard/queries": typeof dashboard_queries;
  "developers/mutations": typeof developers_mutations;
  "developers/queries": typeof developers_queries;
  "email/cronHelpers": typeof email_cronHelpers;
  "email/send": typeof email_send;
  "email/templates": typeof email_templates;
  feedback: typeof feedback;
  "filterPresets/mutations": typeof filterPresets_mutations;
  "filterPresets/queries": typeof filterPresets_queries;
  http: typeof http;
  "integrations/github/actions": typeof integrations_github_actions;
  "integrations/github/appSimple": typeof integrations_github_appSimple;
  "integrations/github/auth": typeof integrations_github_auth;
  "integrations/github/errors": typeof integrations_github_errors;
  "integrations/github/installationManagement": typeof integrations_github_installationManagement;
  "integrations/github/issueSync": typeof integrations_github_issueSync;
  "integrations/github/issueSyncMutations": typeof integrations_github_issueSyncMutations;
  "integrations/github/logging": typeof integrations_github_logging;
  "integrations/github/monitoring": typeof integrations_github_monitoring;
  "integrations/github/mutations": typeof integrations_github_mutations;
  "integrations/github/nodeActions": typeof integrations_github_nodeActions;
  "integrations/github/oauth": typeof integrations_github_oauth;
  "integrations/github/projectQueries": typeof integrations_github_projectQueries;
  "integrations/github/queries": typeof integrations_github_queries;
  "integrations/github/queryActions": typeof integrations_github_queryActions;
  "integrations/github/rateLimiter": typeof integrations_github_rateLimiter;
  "integrations/github/sync": typeof integrations_github_sync;
  "integrations/github/syncActions": typeof integrations_github_syncActions;
  "integrations/github/teamSync": typeof integrations_github_teamSync;
  "integrations/github/teamSyncMutations": typeof integrations_github_teamSyncMutations;
  "integrations/github/types": typeof integrations_github_types;
  "integrations/github/userMapping": typeof integrations_github_userMapping;
  "integrations/github/webhooks": typeof integrations_github_webhooks;
  "integrations/gitlab/mutations": typeof integrations_gitlab_mutations;
  "integrations/gitlab/oauth": typeof integrations_gitlab_oauth;
  "integrations/gitlab/queries": typeof integrations_gitlab_queries;
  "integrations/gitlab/sync": typeof integrations_gitlab_sync;
  "integrations/gitlab/types": typeof integrations_gitlab_types;
  "integrations/slack/commands": typeof integrations_slack_commands;
  "integrations/slack/events": typeof integrations_slack_events;
  "integrations/slack/mutations": typeof integrations_slack_mutations;
  "integrations/slack/queries": typeof integrations_slack_queries;
  internalQueries: typeof internalQueries;
  "meetings/mutations": typeof meetings_mutations;
  "meetings/queries": typeof meetings_queries;
  "migrations/clearOldActivities": typeof migrations_clearOldActivities;
  "migrations/migrateToMultipleAssignees": typeof migrations_migrateToMultipleAssignees;
  migrations: typeof migrations;
  nps: typeof nps;
  "projects/members": typeof projects_members;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  resources: typeof resources;
  search: typeof search;
  "sprints/mutations": typeof sprints_mutations;
  "sprints/queries": typeof sprints_queries;
  "tasks/mutations": typeof tasks_mutations;
  "tasks/queries": typeof tasks_queries;
  "tasks/timeTracking": typeof tasks_timeTracking;
  teams: typeof teams;
  timeEntries: typeof timeEntries;
  video: typeof video;
  waitlist: typeof waitlist;
  whiteboard: typeof whiteboard;
  "workspaces/mutations": typeof workspaces_mutations;
  "workspaces/queries": typeof workspaces_queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
