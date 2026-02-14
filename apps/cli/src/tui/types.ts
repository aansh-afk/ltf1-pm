/**
 * TUI-specific types for the LTF1 dashboard
 */

export type Page = 'dashboard' | 'tasks' | 'sprint' | 'git' | 'search' | 'notifications' | 'help';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export type DashboardMode = 'normal' | 'workspace_selector' | 'project_selector';

export interface TUIState {
  page: Page;
  selectedIndex: number;
  width: number;
  height: number;
  connectionStatus: ConnectionStatus;
}

/** Segment-based row rendering types */
export type Segment = { text: string; color: string };
export type Row = { segments: Segment[]; bgColor?: string };

/** Comment on a task */
export interface Comment {
  _id: string;
  taskId: string;
  content: string;
  authorId: string;
  authorName?: string;
  _creationTime: number;
}

/** Notification entry */
export interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  taskId?: string;
  sprintId?: string;
  _creationTime: number;
}

/** Time tracking entry */
export interface TimeEntry {
  _id: string;
  taskId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  description?: string;
  duration?: number;
}

/** Project/workspace member */
export interface Member {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

/** Shared dimensions */
export const MIN_WIDTH = 100;
export const MIN_HEIGHT = 30;

/** Re-export domain types used in TUI */
export type {
  Task,
  TaskStatus,
  TaskType,
  TaskPriority,
  Sprint,
  SprintStatus,
  SprintWithStats,
  Project,
  ProjectWithStats,
  Workspace,
  User,
  GitContext,
} from '../types/index.js';
