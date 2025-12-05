import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

// Internal query to get pending queue items
export const getPendingQueueItems = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const now = Date.now();

    // Get items that are pending and either have no scheduled time or are ready
    const pendingItems = await ctx.db
      .query("githubIssueSyncQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(10);

    // Filter to items that are ready to process
    return pendingItems.filter(item =>
      !item.scheduledFor || item.scheduledFor <= now
    );
  },
});

// Internal mutation to update queue item status
export const updateQueueItemStatus = internalMutation({
  args: {
    itemId: v.id("githubIssueSyncQueue"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    lastError: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    scheduledFor: v.optional(v.number()),
    processedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: Record<string, any> = { status: args.status };

    if (args.lastError !== undefined) updateData.lastError = args.lastError;
    if (args.retryCount !== undefined) updateData.retryCount = args.retryCount;
    if (args.scheduledFor !== undefined) updateData.scheduledFor = args.scheduledFor;
    if (args.processedAt !== undefined) updateData.processedAt = args.processedAt;

    await ctx.db.patch(args.itemId, updateData);
    return null;
  },
});

// Internal query to get installation for a repository
export const getInstallationForRepo = internalQuery({
  args: {
    repositoryFullName: v.string(),
  },
  returns: v.union(
    v.object({
      installationId: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const repo = await ctx.db
      .query("githubRepositories")
      .withIndex("by_full_name", (q) => q.eq("fullName", args.repositoryFullName))
      .first();

    if (!repo) return null;

    return { installationId: repo.installationId };
  },
});

// Helper functions for label mapping
function mapLabelsToPriority(labels: string[]): "urgent" | "high" | "medium" | "low" {
  const lowercaseLabels = labels.map(l => l.toLowerCase());

  if (lowercaseLabels.some(l => l.includes("urgent") || l.includes("critical"))) {
    return "urgent";
  }
  if (lowercaseLabels.some(l => l.includes("high") || l.includes("important"))) {
    return "high";
  }
  if (lowercaseLabels.some(l => l.includes("low") || l.includes("minor"))) {
    return "low";
  }
  return "medium";
}

function mapLabelsToType(labels: string[]): "feature" | "bug" | "improvement" | "task" | "epic" {
  const lowercaseLabels = labels.map(l => l.toLowerCase());

  if (lowercaseLabels.some(l => l.includes("bug") || l.includes("defect"))) {
    return "bug";
  }
  if (lowercaseLabels.some(l => l.includes("feature") || l.includes("enhancement"))) {
    return "feature";
  }
  if (lowercaseLabels.some(l => l.includes("improvement") || l.includes("refactor"))) {
    return "improvement";
  }
  if (lowercaseLabels.some(l => l.includes("epic"))) {
    return "epic";
  }
  return "task";
}

function isPriorityLabel(label: string): boolean {
  const l = label.toLowerCase();
  return l.includes("urgent") || l.includes("critical") ||
         l.includes("high") || l.includes("important") ||
         l.includes("medium") || l.includes("normal") ||
         l.includes("low") || l.includes("minor");
}

function isTypeLabel(label: string): boolean {
  const l = label.toLowerCase();
  return l.includes("bug") || l.includes("defect") ||
         l.includes("feature") || l.includes("enhancement") ||
         l.includes("improvement") || l.includes("refactor") ||
         l.includes("epic") || l.includes("task");
}

// Internal mutation to create a task from GitHub issue
export const createTaskFromIssue = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    repositoryFullName: v.string(),
    issueNumber: v.number(),
    issueTitle: v.string(),
    issueBody: v.optional(v.string()),
    issueLabels: v.array(v.string()),
    issueAuthor: v.string(),
  },
  returns: v.union(v.id("tasks"), v.null()),
  handler: async (ctx, args) => {
    // Find the project that has this repository connected
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const project = projects.find(
      (p) => p.repository?.url === `https://github.com/${args.repositoryFullName}`
    );

    if (!project) {
      console.log(`No project found with repository ${args.repositoryFullName}`);
      return null;
    }

    // Check if task already exists for this issue
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    const existingTask = existingTasks.find(
      (t) => t.githubIssue?.issueNumber === args.issueNumber &&
             t.githubIssue?.repositoryFullName === args.repositoryFullName
    );

    if (existingTask) {
      console.log(`Task already exists for issue #${args.issueNumber}`);
      return existingTask._id;
    }

    // Get the next task number
    const lastTask = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .order("desc")
      .first();

    const nextNumber = (lastTask?.number || 0) + 1;

    // Map GitHub labels to task properties
    const priority = mapLabelsToPriority(args.issueLabels);
    const taskType = mapLabelsToType(args.issueLabels);

    // Try to resolve the GitHub author to an LTF1 user
    let reporterId: Id<"users"> | undefined;
    const userMapping = await ctx.db
      .query("githubUserMappings")
      .withIndex("by_workspace_username", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("githubUsername", args.issueAuthor)
      )
      .first();

    if (userMapping) {
      reporterId = userMapping.userId;
    } else {
      // Fall back to project lead or workspace owner
      if (project.leadId) {
        reporterId = project.leadId;
      } else {
        const workspace = await ctx.db.get(args.workspaceId);
        if (workspace) {
          reporterId = workspace.ownerId;
        }
      }
    }

    if (!reporterId) {
      console.log("Could not determine reporter for task");
      return null;
    }

    // Create the task
    const taskId = await ctx.db.insert("tasks", {
      projectId: project._id,
      number: nextNumber,
      title: args.issueTitle,
      description: args.issueBody || "",
      status: "backlog",
      priority,
      type: taskType,
      reporterId,
      labels: args.issueLabels.filter(l => !isPriorityLabel(l) && !isTypeLabel(l)),
      position: 0,
      githubIssue: {
        repositoryFullName: args.repositoryFullName,
        issueNumber: args.issueNumber,
        issueUrl: `https://github.com/${args.repositoryFullName}/issues/${args.issueNumber}`,
        syncEnabled: true,
        lastSyncedAt: Date.now(),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update the GitHub issue record with linked task
    const githubIssue = await ctx.db
      .query("githubIssues")
      .withIndex("by_repository_number", (q) =>
        q.eq("repositoryFullName", args.repositoryFullName).eq("number", args.issueNumber)
      )
      .first();

    if (githubIssue) {
      await ctx.db.patch(githubIssue._id, { linkedTaskId: taskId });
    }

    console.log(`Created task ${project.key}-${nextNumber} from GitHub issue #${args.issueNumber}`);
    return taskId;
  },
});

// Internal mutation to update a task from GitHub issue
export const updateTaskFromIssue = internalMutation({
  args: {
    taskId: v.id("tasks"),
    issueTitle: v.string(),
    issueBody: v.optional(v.string()),
    issueLabels: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.githubIssue?.syncEnabled) {
      return null;
    }

    await ctx.db.patch(args.taskId, {
      title: args.issueTitle,
      description: args.issueBody || task.description,
      labels: args.issueLabels.filter(l => !isPriorityLabel(l) && !isTypeLabel(l)),
      priority: mapLabelsToPriority(args.issueLabels),
      type: mapLabelsToType(args.issueLabels),
      githubIssue: {
        ...task.githubIssue,
        lastSyncedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Internal mutation to close a task when GitHub issue is closed
export const closeTaskFromIssue = internalMutation({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.githubIssue?.syncEnabled) {
      return null;
    }

    await ctx.db.patch(args.taskId, {
      status: "done",
      completedAt: Date.now(),
      githubIssue: {
        ...task.githubIssue,
        lastSyncedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Internal mutation to reopen a task when GitHub issue is reopened
export const reopenTaskFromIssue = internalMutation({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.githubIssue?.syncEnabled) {
      return null;
    }

    await ctx.db.patch(args.taskId, {
      status: "todo",
      completedAt: undefined,
      githubIssue: {
        ...task.githubIssue,
        lastSyncedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Internal mutation to link a task to a GitHub issue
export const linkTaskToIssue = internalMutation({
  args: {
    taskId: v.id("tasks"),
    repositoryFullName: v.string(),
    issueNumber: v.number(),
    issueUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      githubIssue: {
        repositoryFullName: args.repositoryFullName,
        issueNumber: args.issueNumber,
        issueUrl: args.issueUrl,
        syncEnabled: true,
        lastSyncedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Internal mutation to queue a task for syncing to GitHub
export const queueTaskToGitHub = internalMutation({
  args: {
    taskId: v.id("tasks"),
    operation: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("close"),
      v.literal("reopen")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project || !project.repository?.url) {
      throw new Error("Project has no connected repository");
    }

    const repositoryFullName = project.repository.url
      .replace("https://github.com/", "")
      .replace(".git", "");

    // For updates/close/reopen, ensure task has GitHub issue linked
    if (args.operation !== "create" && !task.githubIssue?.issueNumber) {
      throw new Error("Task is not linked to a GitHub issue");
    }

    await ctx.db.insert("githubIssueSyncQueue", {
      workspaceId: project.workspaceId,
      direction: "to_github",
      taskId: args.taskId,
      githubIssueNumber: task.githubIssue?.issueNumber,
      repositoryFullName,
      operation: args.operation,
      payload: {
        title: task.title,
        description: task.description,
        labels: task.labels,
        status: task.status,
      },
      status: "pending",
      retryCount: 0,
      createdAt: Date.now(),
    });

    return null;
  },
});
