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
import type * as auth_permissions from "../auth/permissions.js";
import type * as auth_users from "../auth/users.js";
import type * as clerk from "../clerk.js";
import type * as comments_mutations from "../comments/mutations.js";
import type * as http from "../http.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as tasks_mutations from "../tasks/mutations.js";
import type * as tasks_queries from "../tasks/queries.js";
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
  "auth/permissions": typeof auth_permissions;
  "auth/users": typeof auth_users;
  clerk: typeof clerk;
  "comments/mutations": typeof comments_mutations;
  http: typeof http;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  "tasks/mutations": typeof tasks_mutations;
  "tasks/queries": typeof tasks_queries;
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
