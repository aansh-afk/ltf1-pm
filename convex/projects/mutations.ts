import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requirePermission, requireProjectPermission } from "../auth/permissions";
import { internal } from "../_generated/api";
import { getCurrentUserOrThrow } from "../lib/auth";
import { projectStatusValidator, projectRoleValidator } from "../lib/validators";

export const createProject = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    workflowType: v.optional(v.union(v.literal("kanban"), v.literal("scrum"), v.literal("hybrid"))),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await requirePermission(ctx.db, user._id, args.workspaceId, "project.create");

    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.key.toUpperCase()))
      .first();

    if (existingProject) {
      throw new Error("Project key already exists");
    }

    const now = Date.now();

    // Generate unique invite code for project joining
    const inviteCode = crypto.randomUUID();

    const projectId = await ctx.db.insert("projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      key: args.key.toUpperCase(),
      description: args.description,
      leadId: args.leadId,
      status: "planning",
      visibility: "public",
      inviteCode: inviteCode,
      settings: {
        taskPrefix: args.key.toUpperCase(),
        workflowType: args.workflowType || "kanban",
      },
      teamSettings: {
        maxMembers: 50,
        allowSelfJoin: true,
        requireApproval: false,
        autoAssignLead: true,
      },
      metadata: {
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        icon: "📁",
        tags: [],
      },
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as project lead member
    const leadUserId = args.leadId || user._id;
    await ctx.db.insert("projectMembers", {
      projectId: projectId,
      userId: leadUserId,
      role: args.leadId ? "lead" : "lead", // Creator is always lead
      joinedAt: now,
      invitedBy: user._id,
      status: "active",
    });

    // Log project creation activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "project_created",
      projectId: projectId,
      workspaceId: args.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "project",
      targetId: projectId,
      targetName: args.name,
      description: `created project "${args.name}"`,
      metadata: {
        extra: { name: args.name, key: args.key }
      }
    });

    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    status: v.optional(projectStatusValidator),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.edit");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.leadId !== undefined) updates.leadId = args.leadId;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.projectId, updates);

    // Log project update activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "project_updated",
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "project",
      targetId: args.projectId,
      targetName: project.name,
      description: `updated project "${project.name}"`,
      metadata: {
        extra: updates
      }
    });

    return args.projectId;
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.delete");

    await ctx.db.patch(args.projectId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    // Log project archived activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "project_updated",
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "project",
      targetId: args.projectId,
      targetName: project.name,
      description: `archived project "${project.name}"`,
      metadata: {
        extra: { name: project.name, action: "archived" }
      }
    });

    return args.projectId;
  },
});

export const connectRepository = mutation({
  args: {
    projectId: v.id("projects"),
    repositoryUrl: v.string(),
    provider: v.union(v.literal("github"), v.literal("gitlab"), v.literal("bitbucket")),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.edit");

    // Extract repository info from URL
    const urlParts = args.repositoryUrl.replace(/\/$/, '').split('/');
    const repoName = urlParts[urlParts.length - 1];
    const owner = urlParts[urlParts.length - 2];

    if (!repoName || !owner) {
      throw new Error("Invalid repository URL");
    }

    const repository = {
      url: args.repositoryUrl,
      provider: args.provider,
      owner: owner,
      name: repoName,
      defaultBranch: "main", // Default to main branch, can be updated later
      connectedAt: Date.now(),
    };

    await ctx.db.patch(args.projectId, {
      repository: repository,
      updatedAt: Date.now(),
    });

    // Log repository connection activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "project_updated",
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "project",
      targetId: args.projectId,
      targetName: project.name,
      description: `connected repository to "${project.name}"`,
      metadata: {
        extra: { repositoryUrl: args.repositoryUrl, provider: args.provider }
      }
    });

    // Trigger data backfill if it's a GitHub repository
    if (args.provider === "github") {
      const fullName = `${owner}/${repoName}`;
      const githubRepo = await ctx.db
        .query("githubRepositories")
        .withIndex("by_full_name", (q) => q.eq("fullName", fullName))
        .first();

      if (githubRepo) {
        await ctx.scheduler.runAfter(0, internal.integrations.github.nodeActions.backfillRepositoryData, {
          repositoryId: githubRepo._id,
          installationId: githubRepo.installationId,
          repositoryFullName: fullName,
        });
      }
    }

    return args.projectId;
  },
});

// Project Team Management Mutations

export const ensureProjectInviteCode = mutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await requireProjectPermission(ctx.db, user._id, args.projectId, "project.team.invite");

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // If project already has an invite code, return it
    if (project.inviteCode) {
      return project.inviteCode;
    }

    // Generate new invite code for existing projects
    const newInviteCode = crypto.randomUUID();

    await ctx.db.patch(args.projectId, {
      inviteCode: newInviteCode,
      teamSettings: project.teamSettings || {
        maxMembers: 50,
        allowSelfJoin: true,
        requireApproval: false,
        autoAssignLead: true,
      },
      updatedAt: Date.now(),
    });

    return newInviteCode;
  },
});

export const generateProjectInviteCode = mutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await requireProjectPermission(ctx.db, user._id, args.projectId, "project.team.invite");

    const newInviteCode = crypto.randomUUID();

    await ctx.db.patch(args.projectId, {
      inviteCode: newInviteCode,
      updatedAt: Date.now(),
    });

    return newInviteCode;
  },
});

export const joinProjectByCode = mutation({
  args: {
    inviteCode: v.string(),
  },
  returns: v.object({
    projectId: v.id("projects"),
    projectName: v.string(),
    role: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Find project by invite code
    const project = await ctx.db
      .query("projects")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!project) {
      throw new Error("Invalid or expired invite code");
    }

    // Check if invite code has already been used (single-use)
    // REMOVED: Invite codes are now persistent
    /*
    const existingInvite = await ctx.db
      .query("projectInvitations")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (existingInvite) {
      throw new Error("This invite code has already been used");
    }
    */

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", project._id).eq("userId", user._id)
      )
      .first();

    if (existingMember && existingMember.status === "active") {
      throw new Error("You are already a member of this project");
    }

    // Invite codes bypass the self-join check — having a valid code IS the authorization.
    // The allowSelfJoin setting only applies to joining without a code (e.g. public discovery).

    // Ensure user is also a workspace member (auto-add if not)
    const workspaceMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", user._id)
      )
      .first();

    if (!workspaceMember) {
      await ctx.db.insert("workspaceMembers", {
        workspaceId: project.workspaceId,
        userId: user._id,
        role: "member",
        permissions: [],
        joinedAt: Date.now(),
      });
    }

    // Check max members limit
    const currentMemberCount = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_and_status", (q) => q.eq("projectId", project._id).eq("status", "active"))
      .collect();

    if (project.teamSettings?.maxMembers &&
      currentMemberCount.length >= project.teamSettings.maxMembers) {
      throw new Error("Project has reached maximum member limit");
    }

    const now = Date.now();

    // Add user to project team
    await ctx.db.insert("projectMembers", {
      projectId: project._id,
      userId: user._id,
      role: "member",
      joinedAt: now,
      status: "active",
    });

    // Mark invite code as used by creating an invitation record
    await ctx.db.insert("projectInvitations", {
      projectId: project._id,
      invitedEmail: user.email,
      invitedBy: project.leadId || user._id, // Fallback to user if no lead
      role: "member",
      status: "accepted",
      inviteCode: args.inviteCode,
      expiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: now,
    });

    // Generate new invite code for the project (single-use means we need a new one)
    // REMOVED: Invite codes are now persistent
    /*
    const newInviteCode = crypto.randomUUID();
    await ctx.db.patch(project._id, {
      inviteCode: newInviteCode,
      updatedAt: now,
    });
    */

    // Log team member joined activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "member_joined",
      projectId: project._id,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "user",
      targetId: user._id,
      targetName: user.name || user.email,
      description: `${user.name || user.email} joined the project`,
      metadata: { extra: { joinedVia: "invite_code" } }
    });

    return {
      projectId: project._id,
      projectName: project.name,
      role: "member"
    };
  },
});

export const addProjectMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: projectRoleValidator,
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    await requireProjectPermission(ctx.db, currentUser._id, args.projectId, "project.team.manage");

    // Check if user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();

    if (existingMember && existingMember.status === "active") {
      throw new Error("User is already a member of this project");
    }

    const now = Date.now();

    // Add or update membership
    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        role: args.role,
        status: "active",
        invitedBy: currentUser._id,
        joinedAt: now,
      });
    } else {
      await ctx.db.insert("projectMembers", {
        projectId: args.projectId,
        userId: args.userId,
        role: args.role,
        joinedAt: now,
        invitedBy: currentUser._id,
        status: "active",
      });
    }

    // Get project for activity log
    const project = await ctx.db.get(args.projectId);

    // Log member added activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "member_joined",
      projectId: args.projectId,
      workspaceId: project!.workspaceId,
      actorId: currentUser._id,
      actorName: currentUser.name || currentUser.email,
      targetType: "user",
      targetId: args.userId,
      targetName: targetUser.name || targetUser.email,
      description: `added ${targetUser.name || targetUser.email} to the project`,
      metadata: {
        extra: {
          targetUserId: args.userId,
          targetUserName: targetUser.name,
          role: args.role
        }
      }
    });

    return { success: true };
  },
});

export const removeProjectMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    await requireProjectPermission(ctx.db, currentUser._id, args.projectId, "project.team.remove");

    // Find the member
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();

    if (!member || member.status !== "active") {
      throw new Error("User is not a member of this project");
    }

    // Cannot remove project leads (unless you're workspace admin)
    if (member.role === "lead") {
      const project = await ctx.db.get(args.projectId);
      const workspacePermission = await requirePermission(ctx.db, currentUser._id, project!.workspaceId, "project.delete");
      // If the above doesn't throw, they have permission
    }

    // Remove member
    await ctx.db.patch(member._id, {
      status: "removed",
    });

    // Get project and target user for activity log
    const project = await ctx.db.get(args.projectId);
    const targetUser = await ctx.db.get(args.userId);

    // Log member removed activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "member_removed",
      projectId: args.projectId,
      workspaceId: project!.workspaceId,
      actorId: currentUser._id,
      actorName: currentUser.name || currentUser.email,
      targetType: "user",
      targetId: args.userId,
      targetName: targetUser?.name || targetUser?.email || "Unknown User",
      description: `removed ${targetUser?.name || targetUser?.email || "a user"} from the project`,
      metadata: {
        extra: {
          targetUserId: args.userId,
          targetUserName: targetUser?.name,
          previousRole: member.role
        }
      }
    });

    return { success: true };
  },
});

export const updateProjectMemberRole = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: projectRoleValidator,
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserOrThrow(ctx);

    await requireProjectPermission(ctx.db, currentUser._id, args.projectId, "project.team.manage");

    // Find the member
    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();

    if (!member || member.status !== "active") {
      throw new Error("User is not a member of this project");
    }

    const previousRole = member.role;

    // Update role
    await ctx.db.patch(member._id, {
      role: args.role,
    });

    // Get project and target user for activity log
    const project = await ctx.db.get(args.projectId);
    const targetUser = await ctx.db.get(args.userId);

    // Log member role change activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "member_role_changed",
      projectId: args.projectId,
      workspaceId: project!.workspaceId,
      actorId: currentUser._id,
      actorName: currentUser.name || currentUser.email,
      targetType: "user",
      targetId: args.userId,
      targetName: targetUser?.name || targetUser?.email || "Unknown User",
      description: `changed ${targetUser?.name || targetUser?.email || "a user"}'s role from ${previousRole} to ${args.role}`,
      metadata: {
        oldValue: previousRole,
        newValue: args.role,
        extra: {
          targetUserId: args.userId,
          targetUserName: targetUser?.name
        }
      }
    });

    return { success: true };
  },
}); export const assignTeam = mutation({
  args: {
    projectId: v.id("projects"),
    teamId: v.id("teams"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    await requireProjectPermission(ctx.db, user._id, args.projectId, "project.team.manage");

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Ensure team belongs to same workspace
    if (team.workspaceId !== project.workspaceId) {
      throw new Error("Team must belong to the same workspace as the project");
    }

    const currentTeamIds = project.teamIds || [];
    if (currentTeamIds.includes(args.teamId)) {
      throw new Error("Team is already assigned to this project");
    }

    await ctx.db.patch(args.projectId, {
      teamIds: [...currentTeamIds, args.teamId],
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.runMutation(internal.activities.mutations.logActivity, {
      type: "project_updated",
      projectId: args.projectId,
      workspaceId: project.workspaceId,
      actorId: user._id,
      actorName: user.name || user.email,
      targetType: "project",
      targetId: args.projectId,
      targetName: project.name,
      description: `assigned team "${team.name}" to project "${project.name}"`,
      metadata: {
        extra: { teamId: args.teamId, teamName: team.name }
      }
    });

    return { success: true };
  },
});

// ─── Invite by email ─────────────────────────────────────────────────
export const inviteByEmail = mutation({
  args: {
    projectId: v.id("projects"),
    email: v.string(),
    role: v.optional(projectRoleValidator),
  },
  returns: v.object({
    status: v.union(v.literal("added"), v.literal("invited")),
    email: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    await requireProjectPermission(ctx.db, user._id, args.projectId, "project.team.manage");

    const role = args.role || "member";
    const now = Date.now();

    // Check if email belongs to existing LTF1 user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      const existingMember = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", args.projectId).eq("userId", existingUser._id)
        )
        .first();

      if (existingMember && existingMember.status === "active") {
        throw new Error("This user is already a project member");
      }

      if (existingMember) {
        await ctx.db.patch(existingMember._id, { role, status: "active", joinedAt: now, invitedBy: user._id });
      } else {
        await ctx.db.insert("projectMembers", {
          projectId: args.projectId, userId: existingUser._id,
          role, joinedAt: now, invitedBy: user._id, status: "active",
        });
      }

      // Ensure workspace membership
      const wsMember = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", project.workspaceId).eq("userId", existingUser._id)
        )
        .first();
      if (!wsMember) {
        await ctx.db.insert("workspaceMembers", {
          workspaceId: project.workspaceId, userId: existingUser._id,
          role: "member", permissions: [], joinedAt: now,
        });
      }

      // Notify
      await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
        recipientUserId: existingUser._id,
        workspaceId: project.workspaceId,
        type: "project_added",
        title: "Added to Project",
        body: `${user.name || user.email} added you to "${project.name}"`,
        actorId: user._id, entityId: args.projectId, entityType: "project",
        emailData: { projectName: project.name, addedByName: user.name || user.email, role },
      });

      return { status: "added" as const, email: args.email };
    }

    // User doesn't exist — create pending invitation + send email
    const inviteCode = project.inviteCode || crypto.randomUUID();
    if (!project.inviteCode) {
      await ctx.db.patch(args.projectId, { inviteCode, updatedAt: now });
    }

    const existingInvite = await ctx.db
      .query("projectInvitations")
      .withIndex("by_email", (q) => q.eq("invitedEmail", args.email))
      .first();
    if (existingInvite && existingInvite.projectId === args.projectId && existingInvite.status === "pending") {
      throw new Error("An invitation has already been sent to this email");
    }

    await ctx.db.insert("projectInvitations", {
      projectId: args.projectId, invitedEmail: args.email, invitedBy: user._id,
      role, status: "pending", inviteCode,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.email.send.sendEmail, {
      to: args.email,
      subject: `Join ${project.name} on LTF1`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050505;font-family:Inter,Arial,sans-serif;"><table width="100%" style="background:#050505;padding:40px 0;"><tr><td align="center"><table width="600" style="background:#0A0A0A;border:2px solid #2E2E35;max-width:600px;width:100%;"><tr><td style="padding:32px 40px 24px;border-bottom:1px solid #1F1F23;"><span style="font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:700;color:#6366F1;">LTF1</span></td></tr><tr><td style="padding:32px 40px;"><h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#F9FAFB;">Join ${project.name}</h1><p style="margin:0 0 16px;font-size:14px;color:#9CA3AF;line-height:1.6;"><strong style="color:#F9FAFB;">${user.name || user.email}</strong> invited you to join <strong style="color:#F9FAFB;">${project.name}</strong> as a ${role}.</p><table style="margin:24px 0;"><tr><td style="background:#6366F1;border-radius:8px;padding:12px 24px;"><a href="https://ltf1.dev/join-project/${inviteCode}" style="color:#F9FAFB;text-decoration:none;font-size:14px;font-weight:600;">Join Project</a></td></tr></table><p style="margin:0;font-size:12px;color:#6B7280;">Don't have an account? <a href="https://ltf1.dev/sign-up" style="color:#6366F1;">Sign up</a> first.</p></td></tr></table></td></tr></table></body></html>`,
    });

    return { status: "invited" as const, email: args.email };
  },
});

// ─── Invite workspace members to project ─────────────────────────────
export const inviteWorkspaceMembers = mutation({
  args: {
    projectId: v.id("projects"),
    userIds: v.array(v.id("users")),
    role: v.optional(projectRoleValidator),
  },
  returns: v.object({ added: v.number(), alreadyMembers: v.number() }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    await requireProjectPermission(ctx.db, user._id, args.projectId, "project.team.manage");

    const role = args.role || "member";
    const now = Date.now();
    let added = 0;
    let alreadyMembers = 0;

    for (const userId of args.userIds) {
      const existing = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", args.projectId).eq("userId", userId)
        )
        .first();

      if (existing && existing.status === "active") { alreadyMembers++; continue; }

      if (existing) {
        await ctx.db.patch(existing._id, { role, status: "active", joinedAt: now, invitedBy: user._id });
      } else {
        await ctx.db.insert("projectMembers", {
          projectId: args.projectId, userId, role, joinedAt: now, invitedBy: user._id, status: "active",
        });
      }

      await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
        recipientUserId: userId,
        workspaceId: project.workspaceId,
        type: "project_added",
        title: "Added to Project",
        body: `${user.name || user.email} added you to "${project.name}"`,
        actorId: user._id, entityId: args.projectId, entityType: "project",
        emailData: { projectName: project.name, addedByName: user.name || user.email, role },
      });

      added++;
    }

    return { added, alreadyMembers };
  },
});
