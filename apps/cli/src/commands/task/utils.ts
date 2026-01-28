/**
 * Utility functions for task commands
 * Handles task reference parsing and resolution
 */

import type { ConvexHttpClient } from 'convex/browser';
import { query } from '../../lib/convex.js';
import type { ProjectContext } from '../../lib/config.js';

/**
 * Task reference that can be either a task ID, task number, or PROJ-123 format
 */
export interface TaskReference {
  type: 'id' | 'number' | 'key';
  value: string;
  projectKey?: string;
  number?: number;
}

/**
 * Parse a task identifier into a structured reference
 * Supports formats:
 * - Task ID (Convex ID format)
 * - Task number (just a number like 123)
 * - Project-task format (PROJ-123)
 */
export function parseTaskReference(identifier: string): TaskReference {
  // Check if it's a PROJ-123 format
  const projectNumberMatch = identifier.match(/^([A-Z]+)-(\d+)$/i);
  if (projectNumberMatch) {
    return {
      type: 'key',
      value: identifier,
      projectKey: projectNumberMatch[1].toUpperCase(),
      number: parseInt(projectNumberMatch[2], 10),
    };
  }

  // Check if it's just a number
  if (/^\d+$/.test(identifier)) {
    return {
      type: 'number',
      value: identifier,
      number: parseInt(identifier, 10),
    };
  }

  // Assume it's a task ID
  return {
    type: 'id',
    value: identifier,
  };
}

/**
 * Resolve a task reference to a task ID
 * Uses the current project context if needed
 */
export async function resolveTaskId(
  client: ConvexHttpClient,
  identifier: string,
  context?: ProjectContext
): Promise<string | null> {
  const ref = parseTaskReference(identifier);

  // If it's already an ID, return it
  if (ref.type === 'id') {
    return ref.value;
  }

  // If it's a number or key format, we need to look it up
  // We need the project ID to query by number
  if (!context?.projectId) {
    return null;
  }

  // Fetch all tasks for the project and find by number
  // Note: This is not ideal for large projects, but works for the CLI
  interface TaskBasic {
    _id: string;
    number: number;
  }

  const tasks = await query<TaskBasic[]>(
    client,
    'tasks/queries:getProjectTasks',
    { projectId: context.projectId }
  );

  const targetNumber = ref.number;
  const task = tasks.find(t => t.number === targetNumber);

  return task?._id || null;
}

/**
 * Format a task number with project key for display
 */
export function formatTaskKey(projectKey: string, number: number): string {
  return `${projectKey}-${number}`;
}

/**
 * Validate task status
 */
export function isValidStatus(status: string): status is 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled' {
  return ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'].includes(status);
}

/**
 * Validate task priority
 */
export function isValidPriority(priority: string): priority is 'urgent' | 'high' | 'medium' | 'low' {
  return ['urgent', 'high', 'medium', 'low'].includes(priority);
}

/**
 * Validate task type
 */
export function isValidType(type: string): type is 'feature' | 'bug' | 'improvement' | 'task' | 'epic' {
  return ['feature', 'bug', 'improvement', 'task', 'epic'].includes(type);
}

/**
 * Normalize status input (handle variations)
 */
export function normalizeStatus(input: string): string {
  const normalized = input.toLowerCase().replace(/[- ]/g, '_');

  // Handle common variations
  const statusMap: Record<string, string> = {
    'in_progress': 'in_progress',
    'inprogress': 'in_progress',
    'progress': 'in_progress',
    'wip': 'in_progress',
    'in_review': 'in_review',
    'inreview': 'in_review',
    'review': 'in_review',
    'todo': 'todo',
    'to_do': 'todo',
    'backlog': 'backlog',
    'done': 'done',
    'complete': 'done',
    'completed': 'done',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'closed': 'cancelled',
  };

  return statusMap[normalized] || normalized;
}
