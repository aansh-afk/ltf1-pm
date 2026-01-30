/**
 * Convex client setup for the LTF CLI
 * Provides authenticated access to the Convex backend
 */

import { ConvexHttpClient } from 'convex/browser';
import type { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';
import { makeFunctionReference } from 'convex/server';
import { getAuth, isAuthenticated } from './config.js';
import output from './output.js';
import { getErrorMessage } from './errors.js';

// API helper to create function references with correct path format
// Convex HTTP API expects paths like 'workspaces/queries.js:getUserWorkspaces'
// NOTE: Function names must match actual exports in the convex/ backend
export const api = {
  workspaces: {
    queries: {
      getUserWorkspaces: makeFunctionReference<'query'>('workspaces/queries.js:getUserWorkspaces'),
      getWorkspaceById: makeFunctionReference<'query'>('workspaces/queries.js:getWorkspaceById'),
      getWorkspaceMembers: makeFunctionReference<'query'>('workspaces/queries.js:getWorkspaceMembers'),
      getWorkspaceStats: makeFunctionReference<'query'>('workspaces/queries.js:getWorkspaceStats'),
    },
    mutations: {
      createWorkspace: makeFunctionReference<'mutation'>('workspaces/mutations.js:createWorkspace'),
    },
  },
  projects: {
    queries: {
      getWorkspaceProjects: makeFunctionReference<'query'>('projects/queries.js:getWorkspaceProjects'),
      getProject: makeFunctionReference<'query'>('projects/queries.js:getProject'),
      getUserProjects: makeFunctionReference<'query'>('projects/queries.js:getUserProjects'),
      getProjectTeamMembers: makeFunctionReference<'query'>('projects/queries.js:getProjectTeamMembers'),
    },
  },
  tasks: {
    queries: {
      getProjectTasks: makeFunctionReference<'query'>('tasks/queries.js:getProjectTasks'),
      getTask: makeFunctionReference<'query'>('tasks/queries.js:getTask'),
      getMyTasks: makeFunctionReference<'query'>('tasks/queries.js:getMyTasks'),
      getFilteredTasks: makeFunctionReference<'query'>('tasks/queries.js:getFilteredTasks'),
      getTasksByWorkspace: makeFunctionReference<'query'>('tasks/queries.js:getTasksByWorkspace'),
    },
    mutations: {
      createTask: makeFunctionReference<'mutation'>('tasks/mutations.js:createTask'),
      updateTask: makeFunctionReference<'mutation'>('tasks/mutations.js:updateTask'),
    },
  },
  sprints: {
    queries: {
      getProjectSprints: makeFunctionReference<'query'>('sprints/queries.js:getProjectSprints'),
      getCurrentSprint: makeFunctionReference<'query'>('sprints/queries.js:getCurrentSprint'),
      getSprintById: makeFunctionReference<'query'>('sprints/queries.js:getSprintById'),
      getBacklogTasks: makeFunctionReference<'query'>('sprints/queries.js:getBacklogTasks'),
    },
  },
  ai: {
    actions: {
      analyzeTask: makeFunctionReference<'action'>('ai/actions.js:analyzeTask'),
    },
  },
};

// Convex deployment URL - should match the web app
const CONVEX_URL = (() => {
  const raw = process.env.CONVEX_URL || 'https://tangible-butterfly-366.convex.cloud';
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'https://tangible-butterfly-366.convex.cloud';
    }
    return parsed.toString();
  } catch {
    return 'https://tangible-butterfly-366.convex.cloud';
  }
})();

let clientInstance: ConvexHttpClient | null = null;

/**
 * Get the Convex HTTP client
 * This client is used for making authenticated requests to Convex
 */
export function getClient(): ConvexHttpClient {
  if (!clientInstance) {
    clientInstance = new ConvexHttpClient(CONVEX_URL);
  }
  return clientInstance;
}

/**
 * Get an authenticated Convex client
 * Throws if not authenticated
 */
export function getAuthenticatedClient(): ConvexHttpClient {
  if (!isAuthenticated()) {
    output.error('Not authenticated', 'Run `ltf auth login` to authenticate');
    process.exit(1);
  }

  const client = getClient();
  const auth = getAuth();

  if (auth?.token) {
    client.setAuth(auth.token);
  }

  return client;
}

/**
 * Check if the current auth token is valid by making a test request
 */
export async function validateAuth(): Promise<boolean> {
  try {
    // Try to get authenticated client - this will throw if not authenticated
    // We'll implement a simple query to validate the token
    // For now, just check if we have a token
    void getAuthenticatedClient();
    return isAuthenticated();
  } catch {
    return false;
  }
}

/**
 * Reset the client instance (useful after auth changes)
 */
export function resetClient(): void {
  clientInstance = null;
}

/**
 * Get the Convex URL
 */
export function getConvexUrl(): string {
  return CONVEX_URL;
}

/**
 * Type-safe query helper with error handling
 * Uses proper function references from the Convex API
 */
export async function query<Query extends FunctionReference<'query'>>(
  client: ConvexHttpClient,
  functionReference: Query,
  args: FunctionArgs<Query>
): Promise<FunctionReturnType<Query>> {
  try {
    return await client.query(functionReference, args);
  } catch (err) {
    const errorMsg = getErrorMessage(err);
    if (errorMsg.includes('Unauthenticated')) {
      output.error('Authentication expired', 'Run `ltf auth login` to re-authenticate');
      process.exit(1);
    }
    throw err;
  }
}

/**
 * Type-safe mutation helper with error handling
 * Uses proper function references from the Convex API
 */
export async function mutation<Mutation extends FunctionReference<'mutation'>>(
  client: ConvexHttpClient,
  functionReference: Mutation,
  args: FunctionArgs<Mutation>
): Promise<FunctionReturnType<Mutation>> {
  try {
    return await client.mutation(functionReference, args);
  } catch (err) {
    const errorMsg = getErrorMessage(err);
    if (errorMsg.includes('Unauthenticated')) {
      output.error('Authentication expired', 'Run `ltf auth login` to re-authenticate');
      process.exit(1);
    }
    throw err;
  }
}

/**
 * Type-safe action helper with error handling
 * Uses proper function references from the Convex API
 */
export async function action<Action extends FunctionReference<'action'>>(
  client: ConvexHttpClient,
  functionReference: Action,
  args: FunctionArgs<Action>
): Promise<FunctionReturnType<Action>> {
  try {
    return await client.action(functionReference, args);
  } catch (err) {
    const errorMsg = getErrorMessage(err);
    if (errorMsg.includes('Unauthenticated')) {
      output.error('Authentication expired', 'Run `ltf auth login` to re-authenticate');
      process.exit(1);
    }
    throw err;
  }
}

export default {
  getClient,
  getAuthenticatedClient,
  validateAuth,
  resetClient,
  getConvexUrl,
  query,
  mutation,
  action,
};
