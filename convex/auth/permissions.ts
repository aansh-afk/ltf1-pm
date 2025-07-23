import { DatabaseReader } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

export type Permission = 
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

const rolePermissions: Record<string, Permission[]> = {
  owner: [
    "workspace.view", "workspace.edit", "workspace.delete", "workspace.invite",
    "project.create", "project.view", "project.edit", "project.delete",
    "task.create", "task.view", "task.edit", "task.delete", "task.assign",
    "meeting.create", "meeting.view", "meeting.edit", "meeting.delete",
  ],
  admin: [
    "workspace.view", "workspace.edit", "workspace.invite",
    "project.create", "project.view", "project.edit", "project.delete",
    "task.create", "task.view", "task.edit", "task.delete", "task.assign",
    "meeting.create", "meeting.view", "meeting.edit", "meeting.delete",
  ],
  member: [
    "workspace.view",
    "project.view", "project.edit",
    "task.create", "task.view", "task.edit", "task.assign",
    "meeting.create", "meeting.view", "meeting.edit",
  ],
  viewer: [
    "workspace.view",
    "project.view",
    "task.view",
    "meeting.view",
  ],
};

export async function getUserWorkspaceRole(
  db: DatabaseReader,
  userId: Id<"users">,
  workspaceId: Id<"workspaces">
): Promise<Doc<"workspaceMembers"> | null> {
  return await db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .first();
}

export async function hasPermission(
  db: DatabaseReader,
  userId: Id<"users">,
  workspaceId: Id<"workspaces">,
  permission: Permission
): Promise<boolean> {
  const member = await getUserWorkspaceRole(db, userId, workspaceId);
  
  if (!member) {
    return false;
  }

  const rolePerms = rolePermissions[member.role] || [];
  const hasRolePermission = rolePerms.includes(permission);
  const hasCustomPermission = member.permissions.includes(permission);

  return hasRolePermission || hasCustomPermission;
}

export async function requirePermission(
  db: DatabaseReader,
  userId: Id<"users">,
  workspaceId: Id<"workspaces">,
  permission: Permission
): Promise<void> {
  const hasAccess = await hasPermission(db, userId, workspaceId, permission);
  
  if (!hasAccess) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

export async function getProjectWorkspace(
  db: DatabaseReader,
  projectId: Id<"projects">
): Promise<Id<"workspaces">> {
  const project = await db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  return project.workspaceId;
}

export async function getTaskProject(
  db: DatabaseReader,
  taskId: Id<"tasks">
): Promise<Id<"projects">> {
  const task = await db.get(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  return task.projectId;
}

export async function canAccessTask(
  db: DatabaseReader,
  userId: Id<"users">,
  taskId: Id<"tasks">,
  permission: Permission
): Promise<boolean> {
  const task = await db.get(taskId);
  if (!task) {
    return false;
  }

  const project = await db.get(task.projectId);
  if (!project) {
    return false;
  }

  return await hasPermission(db, userId, project.workspaceId, permission);
}