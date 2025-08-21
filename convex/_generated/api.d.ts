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
import type * as admin_migrationStatus from "../admin/migrationStatus.js";
import type * as ai_mutations from "../ai/mutations.js";
import type * as ai_projectInsights from "../ai/projectInsights.js";
import type * as ai_queries from "../ai/queries.js";
import type * as aiCredits_actions from "../aiCredits/actions.js";
import type * as aiCredits_mutations from "../aiCredits/mutations.js";
import type * as aiCredits_queries from "../aiCredits/queries.js";
import type * as auth_permissions from "../auth/permissions.js";
import type * as auth_users from "../auth/users.js";
import type * as clerk from "../clerk.js";
import type * as comments_mutations from "../comments/mutations.js";
import type * as developers_mutations from "../developers/mutations.js";
import type * as developers_queries from "../developers/queries.js";
import type * as filterPresets_mutations from "../filterPresets/mutations.js";
import type * as filterPresets_queries from "../filterPresets/queries.js";
import type * as http from "../http.js";
import type * as integrations_github_actions from "../integrations/github/actions.js";
import type * as integrations_github_appSimple from "../integrations/github/appSimple.js";
import type * as integrations_github_auth from "../integrations/github/auth.js";
import type * as integrations_github_mutations from "../integrations/github/mutations.js";
import type * as integrations_github_nodeActions from "../integrations/github/nodeActions.js";
import type * as integrations_github_oauth from "../integrations/github/oauth.js";
import type * as integrations_github_projectQueries from "../integrations/github/projectQueries.js";
import type * as integrations_github_queries from "../integrations/github/queries.js";
import type * as integrations_github_queryActions from "../integrations/github/queryActions.js";
import type * as integrations_github_sync from "../integrations/github/sync.js";
import type * as integrations_github_syncActions from "../integrations/github/syncActions.js";
import type * as integrations_github_types from "../integrations/github/types.js";
import type * as integrations_github_webhooks from "../integrations/github/webhooks.js";
import type * as internalQueries from "../internalQueries.js";
import type * as meetings_mutations from "../meetings/mutations.js";
import type * as meetings_queries from "../meetings/queries.js";
import type * as migrations_clearOldActivities from "../migrations/clearOldActivities.js";
import type * as migrations_migrateToMultipleAssignees from "../migrations/migrateToMultipleAssignees.js";
import type * as projects_members from "../projects/members.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as sprints_mutations from "../sprints/mutations.js";
import type * as sprints_queries from "../sprints/queries.js";
import type * as tasks_mutations from "../tasks/mutations.js";
import type * as tasks_queries from "../tasks/queries.js";
import type * as tasks_timeTracking from "../tasks/timeTracking.js";
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
  "admin/migrationStatus": typeof admin_migrationStatus;
  "ai/mutations": typeof ai_mutations;
  "ai/projectInsights": typeof ai_projectInsights;
  "ai/queries": typeof ai_queries;
  "aiCredits/actions": typeof aiCredits_actions;
  "aiCredits/mutations": typeof aiCredits_mutations;
  "aiCredits/queries": typeof aiCredits_queries;
  "auth/permissions": typeof auth_permissions;
  "auth/users": typeof auth_users;
  clerk: typeof clerk;
  "comments/mutations": typeof comments_mutations;
  "developers/mutations": typeof developers_mutations;
  "developers/queries": typeof developers_queries;
  "filterPresets/mutations": typeof filterPresets_mutations;
  "filterPresets/queries": typeof filterPresets_queries;
  http: typeof http;
  "integrations/github/actions": typeof integrations_github_actions;
  "integrations/github/appSimple": typeof integrations_github_appSimple;
  "integrations/github/auth": typeof integrations_github_auth;
  "integrations/github/mutations": typeof integrations_github_mutations;
  "integrations/github/nodeActions": typeof integrations_github_nodeActions;
  "integrations/github/oauth": typeof integrations_github_oauth;
  "integrations/github/projectQueries": typeof integrations_github_projectQueries;
  "integrations/github/queries": typeof integrations_github_queries;
  "integrations/github/queryActions": typeof integrations_github_queryActions;
  "integrations/github/sync": typeof integrations_github_sync;
  "integrations/github/syncActions": typeof integrations_github_syncActions;
  "integrations/github/types": typeof integrations_github_types;
  "integrations/github/webhooks": typeof integrations_github_webhooks;
  internalQueries: typeof internalQueries;
  "meetings/mutations": typeof meetings_mutations;
  "meetings/queries": typeof meetings_queries;
  "migrations/clearOldActivities": typeof migrations_clearOldActivities;
  "migrations/migrateToMultipleAssignees": typeof migrations_migrateToMultipleAssignees;
  "projects/members": typeof projects_members;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  "sprints/mutations": typeof sprints_mutations;
  "sprints/queries": typeof sprints_queries;
  "tasks/mutations": typeof tasks_mutations;
  "tasks/queries": typeof tasks_queries;
  "tasks/timeTracking": typeof tasks_timeTracking;
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
