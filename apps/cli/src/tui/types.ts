/**
 * TUI-specific types for the LTF1 dashboard
 */

export type Page = 'dashboard' | 'tasks' | 'sprint' | 'git';

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
