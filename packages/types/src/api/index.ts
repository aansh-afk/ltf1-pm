export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  logoUrl?: string;
}

export interface InviteToWorkspaceRequest {
  email: string;
  role: "admin" | "member" | "viewer";
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  leadId?: string;
  workflowType?: "kanban" | "scrum" | "hybrid";
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  leadId?: string;
  status?: "planning" | "active" | "on_hold" | "completed" | "archived";
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  type: "feature" | "bug" | "improvement" | "task" | "epic";
  priority?: "urgent" | "high" | "medium" | "low";
  assigneeId?: string;
  labels?: string[];
  dueDate?: number;
  estimate?: {
    points?: number;
    hours?: number;
  };
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";
  priority?: "urgent" | "high" | "medium" | "low";
  assigneeId?: string;
  labels?: string[];
  dueDate?: number;
  estimate?: {
    points?: number;
    hours?: number;
  };
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  location?: string;
  attendeeIds: string[];
  relatedTaskIds?: string[];
}

export interface TaskFilters {
  projectId?: string;
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  labels?: string[];
  search?: string;
}

export interface GitHubWebhookPayload {
  action: string;
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
  [key: string]: any;
}

export interface AITaskSuggestion {
  title: string;
  description: string;
  type: string;
  priority: string;
  estimate?: number;
  confidence: number;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalMembers: number;
  upcomingMeetings: number;
  recentActivityCount: number;
}