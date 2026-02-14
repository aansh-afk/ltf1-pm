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
      getUserWorkspaces: makeFunctionReference<'query'>('workspaces/queries:getUserWorkspaces'),
      getWorkspaceById: makeFunctionReference<'query'>('workspaces/queries:getWorkspaceById'),
      getWorkspaceMembers: makeFunctionReference<'query'>('workspaces/queries:getWorkspaceMembers'),
      getWorkspaceStats: makeFunctionReference<'query'>('workspaces/queries:getWorkspaceStats'),
    },
    mutations: {
      createWorkspace: makeFunctionReference<'mutation'>('workspaces/mutations:createWorkspace'),
    },
  },
  projects: {
    queries: {
      getWorkspaceProjects: makeFunctionReference<'query'>('projects/queries:getWorkspaceProjects'),
      getProject: makeFunctionReference<'query'>('projects/queries:getProject'),
      getUserProjects: makeFunctionReference<'query'>('projects/queries:getUserProjects'),
      getProjectTeamMembers: makeFunctionReference<'query'>('projects/queries:getProjectTeamMembers'),
      getProjectMembers: makeFunctionReference<'query'>('projects/members:getProjectMembers'),
    },
  },
  tasks: {
    queries: {
      getProjectTasks: makeFunctionReference<'query'>('tasks/queries:getProjectTasks'),
      getTask: makeFunctionReference<'query'>('tasks/queries:getTask'),
      getMyTasks: makeFunctionReference<'query'>('tasks/queries:getMyTasks'),
      getFilteredTasks: makeFunctionReference<'query'>('tasks/queries:getFilteredTasks'),
      getTasksByWorkspace: makeFunctionReference<'query'>('tasks/queries:getTasksByWorkspace'),
    },
    mutations: {
      createTask: makeFunctionReference<'mutation'>('tasks/mutations:createTask'),
      updateTask: makeFunctionReference<'mutation'>('tasks/mutations:updateTask'),
      deleteTask: makeFunctionReference<'mutation'>('tasks/mutations:deleteTask'),
    },
  },
  sprints: {
    queries: {
      getProjectSprints: makeFunctionReference<'query'>('sprints/queries:getProjectSprints'),
      getCurrentSprint: makeFunctionReference<'query'>('sprints/queries:getCurrentSprint'),
      getSprintById: makeFunctionReference<'query'>('sprints/queries:getSprintById'),
      getBacklogTasks: makeFunctionReference<'query'>('sprints/queries:getBacklogTasks'),
    },
    mutations: {
      createSprint: makeFunctionReference<'mutation'>('sprints/mutations:createSprint'),
      updateSprint: makeFunctionReference<'mutation'>('sprints/mutations:updateSprint'),
      addTasksToSprint: makeFunctionReference<'mutation'>('sprints/mutations:addTasksToSprint'),
      removeTaskFromSprint: makeFunctionReference<'mutation'>('sprints/mutations:removeTaskFromSprint'),
      deleteSprint: makeFunctionReference<'mutation'>('sprints/mutations:deleteSprint'),
    },
  },
  comments: {
    queries: {
      getTaskComments: makeFunctionReference<'query'>('comments/queries:getTaskComments'),
    },
    mutations: {
      createComment: makeFunctionReference<'mutation'>('comments/mutations:createComment'),
      updateComment: makeFunctionReference<'mutation'>('comments/mutations:updateComment'),
      deleteComment: makeFunctionReference<'mutation'>('comments/mutations:deleteComment'),
    },
  },
  ai: {
    actions: {
      analyzeTask: makeFunctionReference<'action'>('ai/actions:analyzeTask'),
    },
  },
  timeEntries: {
    queries: {
      getActiveTimeEntry: makeFunctionReference<'query'>('timeEntries/queries:getActiveTimeEntry'),
      getTimeEntriesByUser: makeFunctionReference<'query'>('timeEntries/queries:getTimeEntriesByUser'),
      getTimeStatsByUser: makeFunctionReference<'query'>('timeEntries/queries:getTimeStatsByUser'),
    },
    mutations: {
      startTimer: makeFunctionReference<'mutation'>('timeEntries/mutations:startTimer'),
      stopTimer: makeFunctionReference<'mutation'>('timeEntries/mutations:stopTimer'),
      createManualEntry: makeFunctionReference<'mutation'>('timeEntries/mutations:createManualEntry'),
    },
  },
  search: {
    queries: {
      globalSearch: makeFunctionReference<'query'>('search:globalSearch'),
      quickSearch: makeFunctionReference<'query'>('search:quickSearch'),
    },
  },
  notifications: {
    queries: {
      getNotifications: makeFunctionReference<'query'>('notifications/queries:getNotifications'),
      getUnreadCount: makeFunctionReference<'query'>('notifications/queries:getUnreadCount'),
    },
    mutations: {
      markNotificationRead: makeFunctionReference<'mutation'>('notifications/mutations:markNotificationRead'),
      markAllNotificationsRead: makeFunctionReference<'mutation'>('notifications/mutations:markAllNotificationsRead'),
    },
  },
  auth: {
    queries: {
      getCurrentUser: makeFunctionReference<'query'>('auth/users:getCurrentUser'),
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
    return parsed.toString().replace(/\/+$/, '');
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
    const client = getAuthenticatedClient();
    await client.query(api.auth.queries.getCurrentUser, {});
    return true;
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
