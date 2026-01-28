/**
 * Shared TypeScript types for the LTF CLI
 */

// Re-export Convex types
export type { Id, Doc } from '../../../../convex/_generated/dataModel.js';

// Task types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type TaskType = 'feature' | 'bug' | 'improvement' | 'task' | 'epic';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Task {
  _id: string;
  _creationTime: number;
  projectId: string;
  number: number;
  title: string;
  description?: string;
  status: TaskStatus;
  type: TaskType;
  priority: TaskPriority;
  assigneeIds?: string[];
  reporterId?: string;
  labels?: string[];
  dueDate?: number;
  startDate?: number;
  estimate?: {
    points?: number;
    hours?: number;
  };
  sprintId?: string;
  progress?: number;
  createdAt: number;
  updatedAt: number;
}

// Sprint types
export type SprintStatus = 'planning' | 'active' | 'completed';

export interface Sprint {
  _id: string;
  _creationTime: number;
  projectId: string;
  name: string;
  goal?: string;
  startDate: number;
  endDate: number;
  status: SprintStatus;
  createdAt: number;
  updatedAt: number;
}

export interface SprintWithStats extends Sprint {
  taskCount: number;
  completedCount: number;
  inProgressCount: number;
}

// Project types
export type WorkflowType = 'kanban' | 'scrum' | 'hybrid';

export interface Project {
  _id: string;
  _creationTime: number;
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  visibility: string;
  settings?: {
    taskPrefix?: string;
    defaultAssigneeId?: string;
    workflowType?: WorkflowType;
  };
  repository?: {
    provider?: string;
    url?: string;
    name?: string;
    owner?: string;
    defaultBranch?: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ProjectWithStats extends Project {
  taskCount: number;
  memberCount: number;
}

// Workspace types
export interface Workspace {
  _id: string;
  _creationTime: number;
  name: string;
  slug?: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

// User types
export interface User {
  _id: string;
  _creationTime: number;
  clerkId: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  status: string;
  createdAt: number;
}

// AI types
export interface AITaskSuggestion {
  title: string;
  type: TaskType;
  priority: TaskPriority;
  description?: string;
  estimate?: {
    points?: number;
    hours?: number;
  };
  labels?: string[];
}

export interface SprintAnalysis {
  health: 'healthy' | 'at_risk' | 'critical';
  velocity: number;
  burndown: number[];
  risks: string[];
  recommendations: string[];
  completionRate: number;
}

// CLI-specific types
export interface ParsedTaskRef {
  key?: string;
  number: number;
}

export interface GitContext {
  branch: string | null;
  remoteUrl: string | null;
  repoOwner: string | null;
  repoName: string | null;
  lastCommit: string | null;
}

// Command result types
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
