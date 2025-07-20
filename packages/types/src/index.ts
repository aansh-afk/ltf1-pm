export * from "./entities";
export * from "./api";

export type Theme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  info: string;
  success: string;
};

export const darkTheme: Theme = {
  primary: "#AD2831",
  secondary: "#800E13",
  accent: "#640D14",
  background: "#250902",
  surface: "#38040E",
  error: "#FF5252",
  warning: "#FB8C00",
  info: "#2196F3",
  success: "#4CAF50",
};

export type PermissionAction =
  | "workspace.view"
  | "workspace.edit"
  | "workspace.delete"
  | "workspace.invite"
  | "project.create"
  | "project.view"
  | "project.edit"
  | "project.delete"
  | "task.create"
  | "task.view"
  | "task.edit"
  | "task.delete"
  | "task.assign"
  | "meeting.create"
  | "meeting.view"
  | "meeting.edit"
  | "meeting.delete";

export type UserRole = "owner" | "admin" | "member" | "viewer";

export type SubscriptionPlan = "free" | "pro" | "enterprise";

export const SUBSCRIPTION_LIMITS = {
  free: {
    seats: 5,
    projects: 3,
    tasksPerProject: 100,
    storage: 1024 * 1024 * 1024, // 1GB
    features: {
      gitIntegration: false,
      aiFeatures: false,
      meetings: true,
      timeTracking: true,
    },
  },
  pro: {
    seats: 25,
    projects: 10,
    tasksPerProject: 1000,
    storage: 10 * 1024 * 1024 * 1024, // 10GB
    features: {
      gitIntegration: true,
      aiFeatures: true,
      meetings: true,
      timeTracking: true,
    },
  },
  enterprise: {
    seats: -1, // unlimited
    projects: -1,
    tasksPerProject: -1,
    storage: -1,
    features: {
      gitIntegration: true,
      aiFeatures: true,
      meetings: true,
      timeTracking: true,
    },
  },
} as const;