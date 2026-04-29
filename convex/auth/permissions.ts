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
  | "project.team.manage"
  | "project.team.invite"
  | "project.team.remove"
  | "project.team.view"
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
    "project.team.manage", "project.team.invite", "project.team.remove", "project.team.view",
    "task.create", "task.view", "task.edit", "task.delete", "task.assign",
    "meeting.create", "meeting.view", "meeting.edit", "meeting.delete",
  ],
  admin: [
    "workspace.view", "workspace.edit", "workspace.invite",
    "project.create", "project.view", "project.edit", "project.delete",
    "project.team.manage", "project.team.invite", "project.team.remove", "project.team.view",
    "task.create", "task.view", "task.edit", "task.delete", "task.assign",
    "meeting.create", "meeting.view", "meeting.edit", "meeting.delete",
  ],
  member: [
    "workspace.view",
    "project.view", "project.edit",
    "project.team.view",
    "task.create", "task.view", "task.edit", "task.assign",
    "meeting.create", "meeting.view", "meeting.edit",
  ],
  viewer: [
    "workspace.view",
    "project.view",
    "project.team.view",
    "task.view",
    "meeting.view",
  ],
};

// Project-level role permissions
const projectRolePermissions: Record<string, Permission[]> = {
  lead: [
    "project.view", "project.edit",
    "project.team.manage", "project.team.invite", "project.team.remove", "project.team.view",
    "task.create", "task.view", "task.edit", "task.delete", "task.assign",
    "meeting.create", "meeting.view", "meeting.edit", "meeting.delete",
  ],
  member: [
    "project.view", "project.edit",
    "project.team.view",
    "task.create", "task.view", "task.edit", "task.assign",
    "meeting.create", "meeting.view", "meeting.edit",
  ],
  contributor: [
    "project.view",
    "project.team.view",
    "task.create", "task.view", "task.edit",
    "meeting.view",
  ],
  viewer: [
    "project.view",
    "project.team.view",
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

  return await hasProjectPermission(db, userId, task.projectId, permission);
}

export async function getUserProjectRole(
  db: DatabaseReader,
  userId: Id<"users">,
  projectId: Id<"projects">
): Promise<Doc<"projectMembers"> | null> {
  return await db
    .query("projectMembers")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId)
    )
    .filter((q) => q.eq(q.field("status"), "active"))
    .first();
}

export async function hasProjectPermission(
  db: DatabaseReader,
  userId: Id<"users">,
  projectId: Id<"projects">,
  permission: Permission
): Promise<boolean> {
  const project = await db.get(projectId);
  if (!project) {
    return false;
  }

  // First check workspace-level permissions
  const workspacePermission = await hasPermission(db, userId, project.workspaceId, permission);
  if (workspacePermission) {
    return true;
  }

  // Then check project-level permissions (direct membership)
  const projectMember = await getUserProjectRole(db, userId, projectId);
  if (projectMember) {
    const projectPerms = projectRolePermissions[projectMember.role] || [];
    if (projectPerms.includes(permission)) {
      return true;
    }
  }

  // Finally, check team-based permissions. Use the (teamId, userId) index
  // so each lookup is a single key probe instead of a dynamic OR over the
  // user's full team membership.
  if (project.teamIds && project.teamIds.length > 0) {
    for (const teamId of project.teamIds) {
      const teamMember = await db
        .query("teamMembers")
        .withIndex("by_team_user", (q) =>
          q.eq("teamId", teamId).eq("userId", userId),
        )
        .first();
      if (!teamMember) continue;

      const teamRole = teamMember.role === "lead" ? "lead" : "member";
      const teamPerms = projectRolePermissions[teamRole] || [];
      if (teamPerms.includes(permission)) {
        return true;
      }
    }
  }

  return false;
}

export async function requireProjectPermission(
  db: DatabaseReader,
  userId: Id<"users">,
  projectId: Id<"projects">,
  permission: Permission
): Promise<void> {
  const hasAccess = await hasProjectPermission(db, userId, projectId, permission);

  if (!hasAccess) {
    throw new Error(`Permission denied: ${permission} for project ${projectId}`);
  }
}