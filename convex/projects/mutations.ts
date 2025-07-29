import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requirePermission, requireProjectPermission } from "../auth/permissions";

export const createProject = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    workflowType: v.optional(v.union(v.literal("kanban"), v.literal("scrum"), v.literal("hybrid"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

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
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
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

    await ctx.db.insert("activities", {
      workspaceId: args.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: projectId,
      action: "project.created",
      metadata: { name: args.name, key: args.key },
      createdAt: now,
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
    status: v.optional(v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("completed"),
      v.literal("archived")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

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

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      action: "project.updated",
      metadata: updates,
      createdAt: Date.now(),
    });

    return args.projectId;
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requirePermission(ctx.db, user._id, project.workspaceId, "project.delete");

    await ctx.db.patch(args.projectId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      action: "project.archived",
      metadata: { name: project.name },
      createdAt: Date.now(),
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
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

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

    await ctx.db.insert("activities", {
      workspaceId: project.workspaceId,
      userId: user._id,
      entityType: "project",
      entityId: args.projectId,
      action: "repository.connected",
      metadata: { repositoryUrl: args.repositoryUrl, provider: args.provider },
      createdAt: Date.now(),
    });

    return args.projectId;
  },
});

// Project Team Management Mutations

export const ensureProjectInviteCode = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

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
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

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
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find project by invite code
    const project = await ctx.db
      .query("projects")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!project) {
      throw new Error("Invalid or expired invite code");
    }

    // Check if invite code has already been used (single-use)
    const existingInvite = await ctx.db
      .query("projectInvitations")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (existingInvite) {
      throw new Error("This invite code has already been used");
    }

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

    // Check if project allows self-join
    if (!project.teamSettings?.allowSelfJoin) {
      throw new Error("This project requires approval to join");
    }

    // Check max members limit
    const currentMemberCount = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter((q) => q.eq(q.field("status"), "active"))
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
    const newInviteCode = crypto.randomUUID();
    await ctx.db.patch(project._id, {
      inviteCode: newInviteCode,
      updatedAt: now,
    });

    // Log team member joined activity
    await ctx.runMutation("activities/mutations:logMemberJoined", {
      projectId: project._id,
      userId: user._id,
      userName: user.name || user.email
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
    role: v.union(v.literal("lead"), v.literal("member"), v.literal("contributor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

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

    // Create activity log
    await ctx.db.insert("activities", {
      workspaceId: project!.workspaceId,
      userId: currentUser._id,
      entityType: "project",
      entityId: args.projectId,
      action: "project.member.added",
      metadata: { 
        targetUserId: args.userId,
        targetUserName: targetUser.name,
        role: args.role
      },
      createdAt: now,
    });

    return { success: true };
  },
});

export const removeProjectMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

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

    // Create activity log
    await ctx.db.insert("activities", {
      workspaceId: project!.workspaceId,
      userId: currentUser._id,
      entityType: "project",
      entityId: args.projectId,
      action: "project.member.removed",
      metadata: { 
        targetUserId: args.userId,
        targetUserName: targetUser?.name,
        previousRole: member.role
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateProjectMemberRole = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member"), v.literal("contributor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

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

    // Create activity log
    await ctx.db.insert("activities", {
      workspaceId: project!.workspaceId,
      userId: currentUser._id,
      entityType: "project",
      entityId: args.projectId,
      action: "project.member.role_updated",
      metadata: { 
        targetUserId: args.userId,
        targetUserName: targetUser?.name,
        previousRole: previousRole,
        newRole: args.role
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});