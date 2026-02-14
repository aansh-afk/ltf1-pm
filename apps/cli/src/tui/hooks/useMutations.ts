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
    }
    // Re-read auth if token might be stale
    const auth = getAuth();
    if (auth?.token) {
      clientRef.current.setAuth(auth.token);
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

  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;

    setState({ loading: true, error: null });
    try {
      await client.mutation(api.tasks.mutations.deleteTask, {
        taskId: taskId as never,
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const createComment = useCallback(async (taskId: string, content: string): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;

    setState({ loading: true, error: null });
    try {
      await client.mutation(api.comments.mutations.createComment, {
        taskId: taskId as never,
        content,
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Comment failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const createSprint = useCallback(async (args: {
    projectId: string;
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;

    setState({ loading: true, error: null });
    try {
      await client.mutation(api.sprints.mutations.createSprint, {
        projectId: args.projectId as never,
        name: args.name,
        ...(args.goal && { goal: args.goal }),
        ...(args.startDate && { startDate: args.startDate }),
        ...(args.endDate && { endDate: args.endDate }),
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Create sprint failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const updateSprint = useCallback(async (args: {
    sprintId: string;
    status?: string;
    name?: string;
    goal?: string;
  }): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;

    setState({ loading: true, error: null });
    try {
      await client.mutation(api.sprints.mutations.updateSprint, {
        sprintId: args.sprintId as never,
        ...(args.status && { status: args.status }),
        ...(args.name && { name: args.name }),
        ...(args.goal && { goal: args.goal }),
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update sprint failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const addTasksToSprint = useCallback(async (sprintId: string, taskIds: string[]): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;

    setState({ loading: true, error: null });
    try {
      await client.mutation(api.sprints.mutations.addTasksToSprint, {
        sprintId: sprintId as never,
        taskIds: taskIds as never,
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Add tasks failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const removeTaskFromSprint = useCallback(async (taskId: string): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;

    setState({ loading: true, error: null });
    try {
      await client.mutation(api.sprints.mutations.removeTaskFromSprint, {
        taskId: taskId as never,
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Remove task failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const assignTask = useCallback(async (taskId: string, assigneeIds: string[]): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;
    setState({ loading: true, error: null });
    try {
      await client.mutation(api.tasks.mutations.updateTask, {
        taskId: taskId as never,
        assigneeIds: assigneeIds as never,
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Assign failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  const linkTaskToBranch = useCallback(async (taskId: string, branch: string, prUrl?: string): Promise<boolean> => {
    const client = getClientInstance();
    if (!client) return false;
    setState({ loading: true, error: null });
    try {
      await client.mutation(api.tasks.mutations.updateTask, {
        taskId: taskId as never,
        gitBranch: branch,
        ...(prUrl && { gitPrUrl: prUrl }),
      } as never);
      setState({ loading: false, error: null });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Link failed';
      setState({ loading: false, error: msg });
      return false;
    }
  }, [getClientInstance]);

  return {
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    createComment,
    createSprint,
    updateSprint,
    addTasksToSprint,
    removeTaskFromSprint,
    assignTask,
    linkTaskToBranch,
    loading: state.loading,
    error: state.error,
  };
}
