/**
 * Convex client setup for the LTF CLI
 * Provides authenticated access to the Convex backend
 */

import { ConvexHttpClient } from 'convex/browser';
import type { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';
import { makeFunctionReference } from 'convex/server';
import { getAuth, isAuthenticated } from './config.js';
import output from './output.js';

// API helper to create function references with correct path format
// Convex HTTP API expects paths like 'workspaces/queries.js:getUserWorkspaces'
export const api = {
  workspaces: {
    queries: {
      getUserWorkspaces: makeFunctionReference<'query'>('workspaces/queries.js:getUserWorkspaces'),
      getWorkspaceById: makeFunctionReference<'query'>('workspaces/queries.js:getWorkspaceById'),
    },
    mutations: {
      createWorkspace: makeFunctionReference<'mutation'>('workspaces/mutations.js:createWorkspace'),
    },
  },
  projects: {
    queries: {
      getWorkspaceProjects: makeFunctionReference<'query'>('projects/queries.js:getWorkspaceProjects'),
      getProjectById: makeFunctionReference<'query'>('projects/queries.js:getProjectById'),
    },
  },
  tasks: {
    queries: {
      getTasksByProject: makeFunctionReference<'query'>('tasks/queries.js:getTasksByProject'),
      getTaskById: makeFunctionReference<'query'>('tasks/queries.js:getTaskById'),
    },
    mutations: {
      createTask: makeFunctionReference<'mutation'>('tasks/mutations.js:createTask'),
      updateTask: makeFunctionReference<'mutation'>('tasks/mutations.js:updateTask'),
    },
  },
  sprints: {
    queries: {
      getProjectSprints: makeFunctionReference<'query'>('sprints/queries.js:getProjectSprints'),
      getActiveSprint: makeFunctionReference<'query'>('sprints/queries.js:getActiveSprint'),
    },
  },
  ai: {
    actions: {
      analyzeTask: makeFunctionReference<'action'>('ai/actions.js:analyzeTask'),
    },
  },
};

// Convex deployment URL - should match the web app
const CONVEX_URL = process.env.CONVEX_URL || 'https://tangible-butterfly-366.convex.cloud';

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
    const error = err as Error;
    if (error.message?.includes('Unauthenticated')) {
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
    const error = err as Error;
    if (error.message?.includes('Unauthenticated')) {
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
    const error = err as Error;
    if (error.message?.includes('Unauthenticated')) {
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
