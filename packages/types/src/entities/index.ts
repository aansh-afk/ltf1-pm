export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: "admin" | "user";
  preferences?: UserPreferences;
  githubUsername?: string;
  lastSeenAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  theme?: string;
  notifications?: NotificationPreferences;
  defaultWorkspaceId?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  slack: boolean;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
  settings: WorkspaceSettings;
  subscription: WorkspaceSubscription;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceSettings {
  features: WorkspaceFeatures;
  integrations?: WorkspaceIntegrations;
}

export interface WorkspaceFeatures {
  gitIntegration: boolean;
  aiFeatures: boolean;
  meetings: boolean;
  timeTracking: boolean;
}

export interface WorkspaceIntegrations {
  githubToken?: string;
  googleCalendarId?: string;
}

export interface WorkspaceSubscription {
  plan: "free" | "pro" | "enterprise";
  validUntil?: number;
  seats: number;
}

export interface WorkspaceMember {
  _id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  permissions: string[];
  joinedAt: number;
}

export interface Project {
  _id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  leadId?: string;
  status: ProjectStatus;
  visibility: "public" | "private";
  repository?: ProjectRepository;
  settings: ProjectSettings;
  metadata?: ProjectMetadata;
  createdAt: number;
  updatedAt: number;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";

export interface ProjectRepository {
  provider: "github" | "gitlab" | "bitbucket";
  url: string;
  defaultBranch: string;
}

export interface ProjectSettings {
  taskPrefix: string;
  defaultAssigneeId?: string;
  workflowType: "kanban" | "scrum" | "hybrid";
}

export interface ProjectMetadata {
  color: string;
  icon: string;
  tags: string[];
}

export interface Task {
  _id: string;
  projectId: string;
  parentTaskId?: string;
  number: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assigneeId?: string;
  reporterId: string;
  labels: string[];
  dueDate?: number;
  startDate?: number;
  completedAt?: number;
  estimate?: TaskEstimate;
  timeTracked?: TaskTimeTracking;
  git?: TaskGitInfo;
  sprintId?: string;
  position: number;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";
export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskType = "feature" | "bug" | "improvement" | "task" | "epic";

export interface TaskEstimate {
  points?: number;
  hours?: number;
}

export interface TaskTimeTracking {
  totalMinutes: number;
  sessions: TimeSession[];
}

export interface TimeSession {
  userId: string;
  startTime: number;
  endTime: number;
  description?: string;
}

export interface TaskGitInfo {
  branch?: string;
  commits: string[];
  pullRequestUrl?: string;
  pullRequestStatus?: "open" | "merged" | "closed";
}

export interface Sprint {
  _id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate: number;
  endDate: number;
  status: "planning" | "active" | "completed";
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  _id: string;
  taskId: string;
  userId: string;
  content: string;
  editedAt?: number;
  createdAt: number;
}

export interface Meeting {
  _id: string;
  workspaceId: string;
  title: string;
  description?: string;
  organizerId: string;
  startTime: number;
  endTime: number;
  location?: string;
  meetingUrl?: string;
  googleEventId?: string;
  attendees: MeetingAttendee[];
  relatedTasks: string[];
  recurrence?: MeetingRecurrence;
  notes?: string;
  recordings: MeetingRecording[];
  createdAt: number;
  updatedAt: number;
}

export interface MeetingAttendee {
  userId: string;
  status: "pending" | "accepted" | "declined" | "tentative";
  responseTime?: number;
}

export interface MeetingRecurrence {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  endDate?: number;
}

export interface MeetingRecording {
  url: string;
  duration: number;
  createdAt: number;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: number;
  createdAt: number;
}

export interface Activity {
  _id: string;
  workspaceId: string;
  userId: string;
  entityType: "workspace" | "project" | "task" | "meeting";
  entityId: string;
  action: string;
  metadata?: any;
  createdAt: number;
}