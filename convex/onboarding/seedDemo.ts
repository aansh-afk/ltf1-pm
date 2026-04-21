import { mutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";

/**
 * Plants a demo workspace (project + sprint + 3 tasks + activity timeline)
 * on a newly created user so the dashboard is never empty on first load and
 * the "push closes ticket" loop is visible before the user has done anything.
 *
 * Idempotent by design — bails early if the user already owns any workspace
 * membership, so reruns are safe.
 */
export async function seedDemoWorkspace(
  ctx: MutationCtx,
  user: { _id: Id<"users">; name: string; email: string },
): Promise<Id<"workspaces"> | null> {
  const existing = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .first();
  if (existing) return null;

  const now = Date.now();
  const slug = `demo-${Math.random().toString(36).slice(2, 10)}`;
  const actorName = user.name || user.email;

  const workspaceId = await ctx.db.insert("workspaces", {
    name: "LTF1 Tour (Demo)",
    slug,
    description: "Your walkthrough workspace. Delete when you're done.",
    ownerId: user._id,
    isDemo: true,
    settings: {
      features: {
        gitIntegration: true,
        aiFeatures: true,
        meetings: true,
        timeTracking: true,
      },
    },
    subscription: {
      plan: "free" as const,
      seats: 5,
    },
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert("workspaceMembers", {
    workspaceId,
    userId: user._id,
    role: "owner" as const,
    permissions: [],
    joinedAt: now,
  });

  const projectCreatedAt = now - 1000 * 60 * 60 * 24 * 5; // 5 days ago
  const projectId = await ctx.db.insert("projects", {
    workspaceId,
    name: "demo-app",
    key: "LTF",
    description: "A pretend service so you can watch LTF1 react to your commits.",
    leadId: user._id,
    status: "active" as const,
    visibility: "private" as const,
    isDemo: true,
    settings: {
      taskPrefix: "LTF",
      workflowType: "scrum" as const,
    },
    metadata: {
      color: "#6366F1",
      icon: "code",
      tags: ["demo"],
    },
    createdAt: projectCreatedAt,
    updatedAt: now,
  });

  const sprintStart = now - 1000 * 60 * 60 * 24 * 3;
  const sprintEnd = now + 1000 * 60 * 60 * 24 * 11;
  const sprintId = await ctx.db.insert("sprints", {
    projectId,
    name: "Sprint 1 (demo)",
    goal: "Ship the auth fix and wire in OAuth.",
    startDate: sprintStart,
    endDate: sprintEnd,
    status: "active" as const,
    createdAt: sprintStart,
    updatedAt: now,
  });

  // Task LTF-1 — DONE, auto-closed by the (fake) merged PR.
  const t1CreatedAt = now - 1000 * 60 * 60 * 24 * 2;
  const t1ClosedAt = now - 1000 * 60 * 30;
  const task1Id = await ctx.db.insert("tasks", {
    projectId,
    number: 1,
    title: "fix: null pointer in auth guard",
    description:
      "Users hitting /dashboard without a session crash the guard. Needs a null check + redirect to /sign-in.",
    status: "done" as const,
    priority: "high" as const,
    type: "bug" as const,
    reporterId: user._id,
    labels: ["demo", "bug", "backend"],
    completedAt: t1ClosedAt,
    estimate: { points: 2 },
    isDemo: true,
    git: {
      branch: "fix/auth-guard-npe",
      commits: ["a1b2c3d"],
      pullRequestUrl: "https://github.com/demo/ltf1-demo/pull/87",
      pullRequestStatus: "merged" as const,
    },
    sprintId,
    position: 0,
    createdAt: t1CreatedAt,
    updatedAt: t1ClosedAt,
  });

  // Task LTF-2 — IN_REVIEW, open PR.
  const t2CreatedAt = now - 1000 * 60 * 60 * 24;
  const task2Id = await ctx.db.insert("tasks", {
    projectId,
    number: 2,
    title: "feat: GitHub OAuth sign-in",
    description:
      "Let devs sign in via GitHub in addition to email. Reuse the existing Clerk flow.",
    status: "in_review" as const,
    priority: "medium" as const,
    type: "feature" as const,
    reporterId: user._id,
    labels: ["demo", "auth", "frontend"],
    estimate: { points: 5 },
    isDemo: true,
    git: {
      branch: "feat/github-oauth",
      commits: ["b2c3d4e"],
      pullRequestUrl: "https://github.com/demo/ltf1-demo/pull/88",
      pullRequestStatus: "open" as const,
    },
    sprintId,
    position: 1,
    createdAt: t2CreatedAt,
    updatedAt: t2CreatedAt,
  });

  // Task LTF-3 — TODO, not started.
  const t3CreatedAt = now - 1000 * 60 * 60 * 12;
  await ctx.db.insert("tasks", {
    projectId,
    number: 3,
    title: "refactor: migrate error handling to Result<T>",
    description:
      "Stop throwing; thread errors as values. Start with the API layer, then move inward.",
    status: "todo" as const,
    priority: "medium" as const,
    type: "improvement" as const,
    reporterId: user._id,
    labels: ["demo", "refactor"],
    estimate: { points: 8 },
    isDemo: true,
    sprintId,
    position: 2,
    createdAt: t3CreatedAt,
    updatedAt: t3CreatedAt,
  });

  // ── Activity timeline: the narrative a real git→ticket loop would produce.
  await ctx.db.insert("activities", {
    type: "task_created",
    workspaceId,
    projectId,
    actorId: user._id,
    actorName,
    targetType: "task",
    targetId: task1Id,
    targetName: "LTF-1",
    description: `opened LTF-1 "fix: null pointer in auth guard"`,
    metadata: { demo: true },
    timestamp: t1CreatedAt,
  });

  await ctx.db.insert("activities", {
    type: "pr_opened",
    workspaceId,
    projectId,
    actorName,
    targetType: "task",
    targetId: task1Id,
    targetName: "LTF-1",
    description: "opened PR #87 on demo/ltf1-demo",
    metadata: { demo: true, prNumber: 87, branch: "fix/auth-guard-npe" },
    timestamp: t1CreatedAt + 1000 * 60 * 90,
  });

  await ctx.db.insert("activities", {
    type: "commit_linked",
    workspaceId,
    projectId,
    actorName,
    targetType: "task",
    targetId: task1Id,
    targetName: "LTF-1",
    description: "commit a1b2c3d → LTF-1",
    metadata: { demo: true, sha: "a1b2c3d", branch: "fix/auth-guard-npe" },
    timestamp: t1ClosedAt - 1000 * 60 * 60,
  });

  await ctx.db.insert("activities", {
    type: "pr_merged",
    workspaceId,
    projectId,
    actorName,
    targetType: "task",
    targetId: task1Id,
    targetName: "LTF-1",
    description: "merged PR #87 · auto-closed LTF-1",
    metadata: { demo: true, prNumber: 87 },
    timestamp: t1ClosedAt,
  });

  await ctx.db.insert("activities", {
    type: "task_status_changed",
    workspaceId,
    projectId,
    actorName: "LTF1 Engine",
    targetType: "task",
    targetId: task1Id,
    targetName: "LTF-1",
    description: "LTF-1: IN_REVIEW → DONE (auto · PR merge)",
    metadata: { demo: true, from: "in_review", to: "done" },
    timestamp: t1ClosedAt,
  });

  await ctx.db.insert("activities", {
    type: "task_created",
    workspaceId,
    projectId,
    actorId: user._id,
    actorName,
    targetType: "task",
    targetId: task2Id,
    targetName: "LTF-2",
    description: `opened LTF-2 "feat: GitHub OAuth sign-in"`,
    metadata: { demo: true },
    timestamp: t2CreatedAt,
  });

  return workspaceId;
}

/**
 * Nuke every demo row owned by the user. Safe to call even if there is no
 * demo workspace. Used by the Dashboard "DELETE DEMO" action.
 */
export async function deleteDemoForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<number> {
  const memberships = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  let deletedWorkspaces = 0;
  for (const m of memberships) {
    const ws = await ctx.db.get(m.workspaceId);
    if (!ws || ws.isDemo !== true || ws.ownerId !== userId) continue;

    // Collect projects under this workspace
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", m.workspaceId))
      .collect();

    for (const p of projects) {
      // Delete tasks
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", p._id))
        .collect();
      for (const t of tasks) await ctx.db.delete(t._id);

      // Delete sprints
      const sprints = await ctx.db
        .query("sprints")
        .withIndex("by_project", (q) => q.eq("projectId", p._id))
        .collect();
      for (const s of sprints) await ctx.db.delete(s._id);

      await ctx.db.delete(p._id);
    }

    // Delete activities
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", m.workspaceId))
      .collect();
    for (const a of activities) await ctx.db.delete(a._id);

    // Delete memberships (including the owner's)
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", m.workspaceId))
      .collect();
    for (const mem of members) await ctx.db.delete(mem._id);

    await ctx.db.delete(m.workspaceId);
    deletedWorkspaces++;
  }

  return deletedWorkspaces;
}

export const deleteMyDemo = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    return await deleteDemoForUser(ctx, user._id);
  },
});

