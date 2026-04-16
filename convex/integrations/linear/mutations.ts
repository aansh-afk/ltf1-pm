import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

const sourceLiteral = v.literal("linear");

const taskStatusValidator = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("done"),
  v.literal("cancelled"),
);

const taskPriorityValidator = v.union(
  v.literal("urgent"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

const taskTypeValidator = v.union(
  v.literal("feature"),
  v.literal("bug"),
  v.literal("improvement"),
  v.literal("task"),
  v.literal("epic"),
);

/**
 * Create a new LTF1 project scoped to a Linear team. Called only by the
 * Linear import worker, so it skips the normal permission check.
 */
export const createImportedProject = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    reporterId: v.id("users"),
    name: v.string(),
    key: v.string(),
    externalId: v.string(),
    externalKey: v.string(),
    externalUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    importSource: sourceLiteral,
  },
  returns: v.id("projects"),
  handler: async (ctx, args): Promise<Id<"projects">> => {
    const now = Date.now();

    // Uniqueness on "key" across the whole DB is a hard constraint — if a
    // project with this key already exists, suffix until free.
    let finalKey = args.key.toUpperCase().slice(0, 6);
    let suffix = 0;
    while (
      await ctx.db
        .query("projects")
        .withIndex("by_key", (q) => q.eq("key", finalKey))
        .first()
    ) {
      suffix += 1;
      finalKey = `${args.key.toUpperCase().slice(0, 4)}${suffix}`;
      if (suffix > 99) throw new Error("Could not allocate a unique project key");
    }

    const projectId = await ctx.db.insert("projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      key: finalKey,
      description: args.description,
      status: "active",
      visibility: "public",
      inviteCode: crypto.randomUUID(),
      settings: {
        taskPrefix: finalKey,
        workflowType: "kanban",
      },
      metadata: {
        color: "#6366F1",
        icon: "📥",
        tags: [`imported:${args.importSource}`],
      },
      importSource: args.importSource,
      externalId: args.externalId,
      externalKey: args.externalKey,
      externalUrl: args.externalUrl,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("projectMembers", {
      projectId,
      userId: args.reporterId,
      role: "lead",
      joinedAt: now,
      invitedBy: args.reporterId,
      status: "active",
    });

    return projectId;
  },
});

/**
 * Upsert a task by external id. If a task with the same (projectId,
 * importSource, externalId) already exists, patch it; otherwise insert.
 */
export const upsertImportedTask = internalMutation({
  args: {
    projectId: v.id("projects"),
    reporterId: v.id("users"),
    importSource: sourceLiteral,
    externalId: v.string(),
    externalKey: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    status: taskStatusValidator,
    priority: taskPriorityValidator,
    type: taskTypeValidator,
    labels: v.array(v.string()),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    estimatePoints: v.optional(v.number()),
    sprintId: v.optional(v.id("sprints")),
  },
  returns: v.object({
    taskId: v.id("tasks"),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_project_external", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("importSource", args.importSource)
          .eq("externalId", args.externalId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        status: args.status,
        priority: args.priority,
        type: args.type,
        labels: args.labels,
        dueDate: args.dueDate,
        startDate: args.startDate,
        completedAt: args.completedAt,
        estimate:
          args.estimatePoints !== undefined
            ? { points: args.estimatePoints }
            : undefined,
        sprintId: args.sprintId,
        externalKey: args.externalKey,
        externalUrl: args.externalUrl,
        updatedAt: now,
      });
      return { taskId: existing._id, created: false };
    }

    // Allocate next task number in project.
    const projectTasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const maxNumber = projectTasks.reduce(
      (m, t) => (t.number > m ? t.number : m),
      0,
    );

    const taskId = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      number: maxNumber + 1,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      type: args.type,
      assigneeIds: [],
      reporterId: args.reporterId,
      labels: args.labels,
      dueDate: args.dueDate,
      startDate: args.startDate,
      completedAt: args.completedAt,
      estimate:
        args.estimatePoints !== undefined
          ? { points: args.estimatePoints }
          : undefined,
      sprintId: args.sprintId,
      importSource: args.importSource,
      externalId: args.externalId,
      externalKey: args.externalKey,
      externalUrl: args.externalUrl,
      position: projectTasks.length,
      createdAt: now,
      updatedAt: now,
    });

    return { taskId, created: true };
  },
});

export const createImportedSprint = internalMutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
    ),
  },
  returns: v.id("sprints"),
  handler: async (ctx, args): Promise<Id<"sprints">> => {
    const now = Date.now();
    return await ctx.db.insert("sprints", {
      projectId: args.projectId,
      name: args.name,
      goal: args.goal,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});
