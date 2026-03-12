import { v } from "convex/values";

// Task validators
export const taskStatusValidator = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("done"),
  v.literal("cancelled")
);

export const taskPriorityValidator = v.union(
  v.literal("urgent"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const taskTypeValidator = v.union(
  v.literal("feature"),
  v.literal("bug"),
  v.literal("improvement"),
  v.literal("task"),
  v.literal("epic")
);

// Project validators
export const projectStatusValidator = v.union(
  v.literal("planning"),
  v.literal("active"),
  v.literal("on_hold"),
  v.literal("completed"),
  v.literal("archived")
);

// Sprint validators
export const sprintStatusValidator = v.union(
  v.literal("planning"),
  v.literal("active"),
  v.literal("completed")
);

// Bug report validators
export const bugSeverityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const bugStatusValidator = v.union(
  v.literal("new"),
  v.literal("triaged"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("closed")
);

// Role validators
export const userRoleValidator = v.union(v.literal("admin"), v.literal("user"));
export const workspaceRoleValidator = v.union(v.literal("admin"), v.literal("member"), v.literal("viewer"));
export const teamRoleValidator = v.union(v.literal("lead"), v.literal("member"));
export const projectRoleValidator = v.union(v.literal("lead"), v.literal("member"), v.literal("contributor"), v.literal("viewer"));

// Feedback validators
export const feedbackStatusValidator = v.union(v.literal("new"), v.literal("reviewed"), v.literal("resolved"));
