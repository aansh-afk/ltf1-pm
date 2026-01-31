/**
 * Mutation hooks for TUI
 * Wraps Convex mutations for task CRUD operations
 */

import { useState, useCallback, useRef } from 'react';
import type { ConvexHttpClient } from 'convex/browser';
import { getClient } from '../../lib/convex.js';
import { getAuth, isAuthenticated } from '../../lib/config.js';
import { api } from '../../lib/convex.js';
import type { TaskStatus, TaskPriority, TaskType } from '../types.js';

export interface MutationState {
  loading: boolean;
  error: string | null;
}

export interface CreateTaskArgs {
  projectId: string;
  title: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  description?: string;
}

export interface UpdateTaskArgs {
  taskId: string;
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  description?: string;
}

export function useMutations() {
  const [state, setState] = useState<MutationState>({ loading: false, error: null });
  const clientRef = useRef<ConvexHttpClient | null>(null);

  const getClientInstance = useCallback((): ConvexHttpClient | null => {
    if (!isAuthenticated()) {
      setState({ loading: false, error: 'Not authenticated' });
      return null;
    }
    if (!clientRef.current) {
      clientRef.current = getClient();
      const auth = getAuth();
      if (auth?.token) {
        clientRef.current.setAuth(auth.token);
      }
    }
    return clientRef.current;
  }, []);

  const createTask = useCallback(async (args: CreateTaskArgs): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;

    setState({ loading: true, error: null });
    try {
      await client.mutation(api.tasks.mutations.createTask, {
        projectId: args.projectId as never,
        title: args.title,
        type: args.type || 'task',
        priority: args.priority || 'medium',
        status: args.status || 'todo',
        description: args.description,
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Create failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const updateTask = useCallback(async (args: UpdateTaskArgs): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;

    setState({ loading: true, error: null });
    try {
      await client.mutation(api.tasks.mutations.updateTask, {
        taskId: args.taskId as never,
        ...(args.title !== undefined && { title: args.title }),
        ...(args.status !== undefined && { status: args.status }),
        ...(args.priority !== undefined && { priority: args.priority }),
        ...(args.description !== undefined && { description: args.description }),
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const moveTask = useCallback(async (taskId: string, status: TaskStatus): Promise<boolean> => {
    return updateTask({ taskId, status });
  }, [updateTask]);

  return {
    createTask,
    updateTask,
    moveTask,
    loading: state.loading,
    error: state.error,
  };
}
