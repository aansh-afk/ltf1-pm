import {
  action,
  internalAction,
  internalMutation,
} from "../_generated/server";
import { v } from "convex/values";
// @ts-ignore
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Execute a single skill action against a task.
 * Internal mutation that performs the DB writes for each action type.
 */
export const applySkillAction = internalMutation({
  args: {
    actionType: v.string(),
    actionConfig: v.any(),
    taskId: v.id("tasks"),
    skillId: v.id("skills"),
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    switch (args.actionType) {
      case "set_type": {
        const validTypes = ["feature", "bug", "improvement", "task", "epic"];
        const newType = args.actionConfig?.type;
        if (newType && validTypes.includes(newType)) {
          await ctx.db.patch(args.taskId, {
            type: newType,
            updatedAt: Date.now(),
          });
        }
        break;
      }

      case "set_priority": {
        const validPriorities = ["urgent", "high", "medium", "low"];
        const newPriority = args.actionConfig?.priority;
        if (newPriority && validPriorities.includes(newPriority)) {
          await ctx.db.patch(args.taskId, {
            priority: newPriority,
            updatedAt: Date.now(),
          });
        }
        break;
      }

      case "add_label": {
        const labelsToAdd: Array<string> = args.actionConfig?.labels ?? [];
        if (labelsToAdd.length > 0) {
          const currentLabels = task.labels ?? [];
          const merged = Array.from(
            new Set([...currentLabels, ...labelsToAdd]),
          );
          await ctx.db.patch(args.taskId, {
            labels: merged,
            updatedAt: Date.now(),
          });
        }
        break;
      }

      case "set_assignee": {
        const assigneeIds: Array<string> =
          args.actionConfig?.assigneeIds ?? [];
        if (assigneeIds.length > 0) {
          // Validate that all IDs are real users
          const validIds: Array<Id<"users">> = [];
          for (const id of assigneeIds) {
            const user = await ctx.db.get(id as Id<"users">);
            if (user) {
              validIds.push(user._id);
            }
          }
          if (validIds.length > 0) {
            await ctx.db.patch(args.taskId, {
              assigneeIds: validIds,
              assigneeId: undefined,
              updatedAt: Date.now(),
            });
          }
        }
        break;
      }

      case "create_tasks": {
        const taskTemplates: Array<{
          title: string;
          type?: string;
          priority?: string;
        }> = args.actionConfig?.tasks ?? [];

        // Get current max task number for the project
        const existingTasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
          .collect();

        let maxNumber = existingTasks.reduce(
          (max, t) => Math.max(max, t.number),
          0,
        );
        const now = Date.now();

        for (const template of taskTemplates) {
          maxNumber += 1;
          await ctx.db.insert("tasks", {
            projectId: task.projectId,
            parentTaskId: args.taskId,
            number: maxNumber,
            title: template.title,
            description: undefined,
            status: "todo",
            priority: (template.priority as any) ?? "medium",
            type: (template.type as any) ?? "task",
            assigneeIds: [],
            assigneeId: undefined,
            reporterId: args.userId,
            labels: [],
            position: existingTasks.length + maxNumber,
            createdAt: now,
            updatedAt: now,
          });
        }
        break;
      }

      case "add_to_sprint": {
        // Find the active sprint for the task's project
        const activeSprint = await ctx.db
          .query("sprints")
          .withIndex("by_project_and_status", (q) =>
            q.eq("projectId", task.projectId).eq("status", "active"),
          )
          .first();

        if (activeSprint) {
          await ctx.db.patch(args.taskId, {
            sprintId: activeSprint._id,
            updatedAt: Date.now(),
          });
        }
        break;
      }

      case "notify_slack": {
        // Placeholder for Slack notification integration
        // Will be implemented when Slack integration is connected
        break;
      }

      case "ai_sprint_plan": {
        // Placeholder for AI sprint planning action
        // Will be implemented when AI sprint planning is built
        break;
      }

      default:
        // Unknown action type -- skip silently
        break;
    }

    return null;
  },
});

/**
 * Increment the usage count of a skill and log the execution.
 * Internal mutation for post-execution bookkeeping.
 */
export const recordSkillExecution = internalMutation({
  args: {
    skillId: v.id("skills"),
    taskId: v.optional(v.id("tasks")),
    workspaceId: v.id("workspaces"),
    description: v.string(),
    activityType: v.union(
      v.literal("skill_run"),
      v.literal("skill_auto_apply"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Increment usage count
    const skill = await ctx.db.get(args.skillId);
    if (skill) {
      await ctx.db.patch(args.skillId, {
        usageCount: (skill.usageCount ?? 0) + 1,
      });
    }

    // Log to agentActivities
    await ctx.db.insert("agentActivities", {
      workspaceId: args.workspaceId,
      type: args.activityType,
      taskId: args.taskId,
      skillId: args.skillId,
      description: args.description,
      metadata: {
        executedAt: Date.now(),
      },
    });

    return null;
  },
});

/**
 * Execute a skill against a task.
 * Public action -- runs each action in the skill's actions array sequentially.
 */
export const executeSkill = action({
  args: {
    skillId: v.id("skills"),
    taskId: v.id("tasks"),
  },
  returns: v.object({
    success: v.boolean(),
    actionsExecuted: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Look up user by clerkId
    const user: any = await ctx.runQuery(
      internal.skills.internalQueries.getUserByClerkId,
      { clerkId: identity.subject },
    );
    if (!user) {
      throw new Error("User not found");
    }

    // Fetch the skill
    const skill: any = await ctx.runQuery(api.skills.queries.getSkillById, {
      skillId: args.skillId,
    });
    if (!skill) {
      throw new Error("Skill not found");
    }

    if (!skill.isActive) {
      return {
        success: false,
        actionsExecuted: 0,
        error: "Skill is disabled",
      };
    }

    // Execute each action sequentially
    let actionsExecuted = 0;
    for (const skillAction of skill.actions) {
      try {
        await ctx.runMutation(
          internal.skills.execution.applySkillAction,
          {
            actionType: skillAction.type,
            actionConfig: skillAction.config,
            taskId: args.taskId,
            skillId: args.skillId,
            userId: user._id,
            workspaceId: skill.workspaceId,
          },
        );
        actionsExecuted += 1;
      } catch (e: any) {
        // Log partial failure and continue
        await ctx.runMutation(
          internal.skills.execution.recordSkillExecution,
          {
            skillId: args.skillId,
            taskId: args.taskId,
            workspaceId: skill.workspaceId,
            description: `Skill "${skill.displayName}" partially failed on action "${skillAction.type}": ${e.message}`,
            activityType: "skill_run" as const,
          },
        );
        return {
          success: false,
          actionsExecuted,
          error: `Failed on action "${skillAction.type}": ${e.message}`,
        };
      }
    }

    // Record successful execution
    await ctx.runMutation(
      internal.skills.execution.recordSkillExecution,
      {
        skillId: args.skillId,
        taskId: args.taskId,
        workspaceId: skill.workspaceId,
        description: `Skill "${skill.displayName}" executed ${actionsExecuted} action(s) on task`,
        activityType: "skill_run" as const,
      },
    );

    return {
      success: true,
      actionsExecuted,
    };
  },
});

/**
 * Check if any auto-trigger skills match a newly created task.
 * Internal action -- called after task creation.
 */
export const checkAutoSkills = internalAction({
  args: {
    taskId: v.id("tasks"),
    workspaceId: v.id("workspaces"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all active skills for this workspace
    const allSkills: Array<any> = await ctx.runQuery(
      internal.skills.internalQueries.getActiveAutoSkills,
      { workspaceId: args.workspaceId },
    );

    if (allSkills.length === 0) {
      return null;
    }

    // Get the task details for matching
    const task: any = await ctx.runQuery(
      internal.skills.internalQueries.getTaskForMatching,
      { taskId: args.taskId },
    );

    if (!task) {
      return null;
    }

    for (const skill of allSkills) {
      if (!matchesConditions(skill.conditions, task)) {
        continue;
      }

      // Execute each action in the matching skill
      for (const skillAction of skill.actions) {
        try {
          await ctx.runMutation(
            internal.skills.execution.applySkillAction,
            {
              actionType: skillAction.type,
              actionConfig: skillAction.config,
              taskId: args.taskId,
              skillId: skill._id,
              userId: skill.createdBy,
              workspaceId: args.workspaceId,
            },
          );
        } catch (_e) {
          // Silently skip failed auto actions
        }
      }

      // Record the auto execution
      await ctx.runMutation(
        internal.skills.execution.recordSkillExecution,
        {
          skillId: skill._id,
          taskId: args.taskId,
          workspaceId: args.workspaceId,
          description: `Auto-skill "${skill.displayName}" applied to new task "${task.title}"`,
          activityType: "skill_auto_apply" as const,
        },
      );
    }

    return null;
  },
});

/**
 * Match a task against skill conditions.
 */
function matchesConditions(
  conditions:
    | {
        taskTypes?: string[];
        keywords?: string[];
        sources?: string[];
      }
    | undefined,
  task: { type: string; title: string; description?: string; labels?: string[] },
): boolean {
  if (!conditions) {
    return true;
  }

  // Check task type match
  if (conditions.taskTypes && conditions.taskTypes.length > 0) {
    if (!conditions.taskTypes.includes(task.type)) {
      return false;
    }
  }

  // Check keyword match in title/description
  if (conditions.keywords && conditions.keywords.length > 0) {
    const text = `${task.title} ${task.description ?? ""}`.toLowerCase();
    const hasKeyword = conditions.keywords.some((kw) =>
      text.includes(kw.toLowerCase()),
    );
    if (!hasKeyword) {
      return false;
    }
  }

  return true;
}
