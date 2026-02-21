import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Workflow Trigger Types
export const TRIGGER_TYPES = {
  EVENT: "event",
  SCHEDULE: "schedule",
  WEBHOOK: "webhook",
  MANUAL: "manual",
} as const;

// Event Types for Triggers
export const EVENT_TYPES = {
  // Task Events
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  TASK_ASSIGNED: "task.assigned",
  TASK_COMPLETED: "task.completed",
  TASK_OVERDUE: "task.overdue",

  // Sprint Events
  SPRINT_STARTED: "sprint.started",
  SPRINT_ENDING: "sprint.ending",
  SPRINT_COMPLETED: "sprint.completed",

  // Project Events
  PROJECT_CREATED: "project.created",
  PROJECT_MILESTONE_REACHED: "project.milestone_reached",
  PROJECT_DEADLINE_APPROACHING: "project.deadline_approaching",

  // Meeting Events
  MEETING_SCHEDULED: "meeting.scheduled",
  MEETING_STARTING: "meeting.starting",
  MEETING_ENDED: "meeting.ended",

  // Time Tracking Events
  TIME_ENTRY_CREATED: "time_entry.created",
  TIME_EXCEEDED: "time_exceeded",

  // Custom Field Events
  CUSTOM_FIELD_UPDATED: "custom_field.updated",

  // Integration Events
  GITLAB_ISSUE_CREATED: "gitlab.issue_created",
  GITLAB_MR_OPENED: "gitlab.mr_opened",
  SLACK_MESSAGE_RECEIVED: "slack.message_received",
} as const;

// Action Types
export const ACTION_TYPES = {
  // Task Actions
  CREATE_TASK: "create_task",
  UPDATE_TASK: "update_task",
  ASSIGN_TASK: "assign_task",
  CHANGE_TASK_STATUS: "change_task_status",
  ADD_TASK_COMMENT: "add_task_comment",

  // Notification Actions
  SEND_EMAIL: "send_email",
  SEND_SLACK_MESSAGE: "send_slack_message",
  SEND_IN_APP_NOTIFICATION: "send_notification",

  // Sprint Actions
  CREATE_SPRINT: "create_sprint",
  MOVE_TASK_TO_SPRINT: "move_task_to_sprint",

  // Meeting Actions
  SCHEDULE_MEETING: "schedule_meeting",
  CREATE_MEETING_AGENDA: "create_meeting_agenda",

  // Integration Actions
  CREATE_GITLAB_ISSUE: "create_gitlab_issue",
  UPDATE_GITLAB_ISSUE: "update_gitlab_issue",
  POST_TO_SLACK: "post_to_slack",

  // Custom Actions
  UPDATE_CUSTOM_FIELD: "update_custom_field",
  RUN_WEBHOOK: "run_webhook",
  GENERATE_REPORT: "generate_report",

  // Conditional Actions
  IF_THEN_ELSE: "if_then_else",
  LOOP: "loop",
  WAIT: "wait",
} as const;

// Condition Operators
export const OPERATORS = {
  EQUALS: "equals",
  NOT_EQUALS: "not_equals",
  CONTAINS: "contains",
  NOT_CONTAINS: "not_contains",
  GREATER_THAN: "greater_than",
  LESS_THAN: "less_than",
  GREATER_THAN_OR_EQUAL: "greater_than_or_equal",
  LESS_THAN_OR_EQUAL: "less_than_or_equal",
  IN: "in",
  NOT_IN: "not_in",
  IS_EMPTY: "is_empty",
  IS_NOT_EMPTY: "is_not_empty",
  REGEX_MATCH: "regex_match",
} as const;

// Create a new workflow
export const createWorkflow = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.string(),
    triggerConfig: v.any(),
    conditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.string(),
          value: v.any(),
          connector: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
        }),
      ),
    ),
    actions: v.array(
      v.object({
        type: v.string(),
        config: v.any(),
        order: v.number(),
      }),
    ),
    active: v.optional(v.boolean()),
  },
  returns: v.id("workflows"),
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

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id),
      )
      .unique();
    if (!membership) {
      throw new Error("Not authorized");
    }

    return await ctx.db.insert("workflows", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      trigger: {
        type: args.triggerType as "manual" | "event" | "schedule" | "webhook",
        eventType: args.triggerConfig?.eventType,
        schedule: args.triggerConfig?.schedule,
        webhookUrl: args.triggerConfig?.webhookUrl,
        conditions: args.conditions,
      },
      actions: args.actions,
      enabled: args.active ?? true,
      lastRun: undefined,
      runCount: 0,
      createdBy: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update workflow
export const updateWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    triggerConfig: v.optional(v.any()),
    conditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.string(),
          value: v.any(),
          connector: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
        }),
      ),
    ),
    actions: v.optional(
      v.array(
        v.object({
          type: v.string(),
          config: v.any(),
          order: v.number(),
        }),
      ),
    ),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
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

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", workflow.workspaceId).eq("userId", user._id),
      )
      .unique();
    if (!membership) {
      throw new Error("Not authorized");
    }

    const { workflowId, ...updateData } = args;
    await ctx.db.patch(workflowId, {
      ...updateData,
      updatedAt: Date.now(),
    });
  },
});

// Delete workflow
export const deleteWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
  },
  returns: v.null(),
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

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", workflow.workspaceId).eq("userId", user._id),
      )
      .unique();
    if (!membership) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.workflowId);
  },
});

// Get workflows for workspace
export const getWorkflows = query({
  args: {
    workspaceId: v.id("workspaces"),
    active: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("workflows"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      name: v.string(),
      description: v.optional(v.string()),
      trigger: v.object({
        type: v.union(
          v.literal("event"),
          v.literal("schedule"),
          v.literal("webhook"),
          v.literal("manual"),
        ),
        eventType: v.optional(v.string()),
        schedule: v.optional(v.string()),
        webhookUrl: v.optional(v.string()),
        conditions: v.optional(
          v.array(
            v.object({
              field: v.string(),
              operator: v.string(),
              value: v.any(),
            }),
          ),
        ),
      }),
      actions: v.array(
        v.object({
          type: v.string(),
          config: v.any(),
          order: v.number(),
        }),
      ),
      enabled: v.boolean(),
      lastRun: v.optional(v.number()),
      runCount: v.number(),
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("workflows")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    const workflows = await query.collect();

    if (args.active !== undefined) {
      return workflows.filter((w) => w.enabled === args.active);
    }

    return workflows;
  },
});

// Get workflow runs
export const getWorkflowRuns = query({
  args: {
    workflowId: v.id("workflows"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("workflowRuns"),
      _creationTime: v.number(),
      workflowId: v.id("workflows"),
      status: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
      ),
      triggeredBy: v.string(),
      triggerData: v.optional(v.any()),
      executionLog: v.array(
        v.object({
          timestamp: v.number(),
          action: v.string(),
          status: v.string(),
          message: v.string(),
          data: v.optional(v.any()),
        }),
      ),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      error: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("workflowRuns")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .take(args.limit ?? 50);

    return runs;
  },
});

// Trigger workflow manually
export const triggerWorkflow = action({
  args: {
    workflowId: v.id("workflows"),
    context: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await ctx.runQuery(api.automation.getWorkflowById, {
      workflowId: args.workflowId,
    });

    if (!workflow || !workflow.enabled) {
      throw new Error("Workflow not found or inactive");
    }

    // Create workflow run
    const runId = await ctx.runMutation(internal.automation.createWorkflowRun, {
      workflowId: args.workflowId,
      triggerType: TRIGGER_TYPES.MANUAL,
      context: args.context,
    });

    // Execute workflow
    await executeWorkflow(ctx, workflow, runId, args.context);
  },
});

// Get workflow by ID
export const getWorkflowById = query({
  args: {
    workflowId: v.id("workflows"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("workflows"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      name: v.string(),
      description: v.optional(v.string()),
      trigger: v.object({
        type: v.union(
          v.literal("event"),
          v.literal("schedule"),
          v.literal("webhook"),
          v.literal("manual"),
        ),
        eventType: v.optional(v.string()),
        schedule: v.optional(v.string()),
        webhookUrl: v.optional(v.string()),
        conditions: v.optional(
          v.array(
            v.object({
              field: v.string(),
              operator: v.string(),
              value: v.any(),
            }),
          ),
        ),
      }),
      actions: v.array(
        v.object({
          type: v.string(),
          config: v.any(),
          order: v.number(),
        }),
      ),
      enabled: v.boolean(),
      lastRun: v.optional(v.number()),
      runCount: v.number(),
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db.get(args.workflowId);
  },
});

// Create workflow run record
export const createWorkflowRun = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    triggerType: v.string(),
    context: v.optional(v.any()),
  },
  returns: v.id("workflowRuns"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("workflowRuns", {
      workflowId: args.workflowId,
      status: "running",
      triggeredBy: args.triggerType,
      triggerData: args.context,
      executionLog: [],
      startedAt: Date.now(),
      completedAt: undefined,
      error: undefined,
    });
  },
});

// Update workflow run
export const updateWorkflowRun = internalMutation({
  args: {
    runId: v.id("workflowRuns"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    completedAt: v.optional(v.number()),
    executionLog: v.optional(
      v.array(
        v.object({
          timestamp: v.number(),
          action: v.string(),
          status: v.string(),
          message: v.string(),
          data: v.optional(v.any()),
        }),
      ),
    ),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { runId, ...updateData } = args;
    await ctx.db.patch(runId, updateData);
  },
});

// Process event trigger
export const processEventTrigger = action({
  args: {
    eventType: v.string(),
    entityId: v.string(),
    context: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find workflows triggered by this event
    const workflows = await ctx.runQuery(api.automation.getWorkflowsByTrigger, {
      triggerType: TRIGGER_TYPES.EVENT,
      eventType: args.eventType,
    });

    // Execute each matching workflow
    for (const workflow of workflows) {
      if (!workflow.enabled) continue;

      // Check conditions
      if (
        workflow.trigger.conditions &&
        workflow.trigger.conditions.length > 0
      ) {
        const conditionsMet = await evaluateConditions(
          ctx,
          workflow.trigger.conditions,
          args.context,
        );
        if (!conditionsMet) continue;
      }

      // Create workflow run
      const runId = await ctx.runMutation(
        internal.automation.createWorkflowRun,
        {
          workflowId: workflow._id,
          triggerType: TRIGGER_TYPES.EVENT,
          context: args.context,
        },
      );

      // Execute workflow
      await executeWorkflow(ctx, workflow, runId, args.context);
    }
  },
});

// Get workflows by trigger
export const getWorkflowsByTrigger = query({
  args: {
    triggerType: v.string(),
    eventType: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("workflows"),
      _creationTime: v.number(),
      workspaceId: v.id("workspaces"),
      name: v.string(),
      description: v.optional(v.string()),
      trigger: v.object({
        type: v.union(
          v.literal("event"),
          v.literal("schedule"),
          v.literal("webhook"),
          v.literal("manual"),
        ),
        eventType: v.optional(v.string()),
        schedule: v.optional(v.string()),
        webhookUrl: v.optional(v.string()),
        conditions: v.optional(
          v.array(
            v.object({
              field: v.string(),
              operator: v.string(),
              value: v.any(),
            }),
          ),
        ),
      }),
      actions: v.array(
        v.object({
          type: v.string(),
          config: v.any(),
          order: v.number(),
        }),
      ),
      enabled: v.boolean(),
      lastRun: v.optional(v.number()),
      runCount: v.number(),
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const workflows = await ctx.db
      .query("workflows")
      .filter((q) => q.eq(q.field("trigger.type"), args.triggerType))
      .collect();

    if (args.eventType) {
      return workflows.filter((w) => w.trigger.eventType === args.eventType);
    }

    return workflows;
  },
});

// Process scheduled workflows
export const processScheduledWorkflows = action({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflows = await ctx.runQuery(api.automation.getWorkflowsByTrigger, {
      triggerType: TRIGGER_TYPES.SCHEDULE,
    });

    const now = Date.now();

    for (const workflow of workflows) {
      if (!workflow.enabled) continue;

      // Check if it's time to run based on schedule
      if (shouldRunScheduledWorkflow(workflow, now)) {
        // Create workflow run
        const runId = await ctx.runMutation(
          internal.automation.createWorkflowRun,
          {
            workflowId: workflow._id,
            triggerType: TRIGGER_TYPES.SCHEDULE,
            context: { scheduledTime: now },
          },
        );

        // Execute workflow
        await executeWorkflow(ctx, workflow, runId, { scheduledTime: now });

        // Update last executed time
        await ctx.runMutation(internal.automation.updateWorkflowLastExecuted, {
          workflowId: workflow._id,
          lastExecutedAt: now,
        });
      }
    }
  },
});

// Update workflow last executed time
export const updateWorkflowLastExecuted = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    lastExecutedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workflowId, {
      lastRun: args.lastExecutedAt,
      runCount: ((await ctx.db.get(args.workflowId))?.runCount ?? 0) + 1,
    });
  },
});

function toExecutionLog(actionResults: Array<any>) {
  return actionResults.map((actionResult) => ({
    timestamp: actionResult.completedAt ?? Date.now(),
    action: actionResult.type,
    status: actionResult.status,
    message:
      actionResult.status === "failed"
        ? (actionResult.error ?? "Action failed")
        : "Action completed",
    data: actionResult.result,
  }));
}

// Helper: Execute workflow
async function executeWorkflow(
  ctx: any,
  workflow: any,
  runId: Id<"workflowRuns">,
  context: any,
) {
  const actionResults: any[] = [];

  try {
    // Sort actions by order
    const sortedActions = workflow.actions.sort(
      (a: any, b: any) => a.order - b.order,
    );

    for (const action of sortedActions) {
      const actionStartTime = Date.now();
      let actionResult: any;

      try {
        // Execute action based on type
        actionResult = await executeAction(ctx, action, context, actionResults);

        // Record successful action
        actionResults.push({
          type: action.type,
          status: "completed",
          startedAt: actionStartTime,
          completedAt: Date.now(),
          result: actionResult,
        });

        // Update context with action result
        context = {
          ...context,
          [`action_${actionResults.length - 1}_result`]: actionResult,
        };
      } catch (error: any) {
        // Record failed action
        actionResults.push({
          type: action.type,
          status: "failed",
          startedAt: actionStartTime,
          completedAt: Date.now(),
          error: error.message,
        });

        // Update workflow run as failed
        await ctx.runMutation(internal.automation.updateWorkflowRun, {
          runId,
          status: "failed",
          completedAt: Date.now(),
          executionLog: toExecutionLog(actionResults),
          error: error.message,
        });

        throw error;
      }
    }

    // Update workflow run as completed
    await ctx.runMutation(internal.automation.updateWorkflowRun, {
      runId,
      status: "completed",
      completedAt: Date.now(),
      executionLog: toExecutionLog(actionResults),
    });
  } catch (error: any) {
    console.error("Workflow execution failed:", error);
  }
}

// Helper: Execute single action
async function executeAction(
  ctx: any,
  action: any,
  context: any,
  previousResults: any[],
): Promise<any> {
  switch (action.type) {
    case ACTION_TYPES.CREATE_TASK:
      return await ctx.runMutation(api.tasks.mutations.createTask, {
        workspaceId: context.workspaceId,
        projectId: action.config.projectId || context.projectId,
        title: replaceVariables(action.config.title, context),
        description: replaceVariables(action.config.description, context),
        priority: action.config.priority,
        assignedTo: action.config.assignedTo,
        sprintId: action.config.sprintId,
        dueDate: action.config.dueDate,
      });

    case ACTION_TYPES.UPDATE_TASK:
      return await ctx.runMutation(api.tasks.mutations.updateTask, {
        taskId: context.taskId || action.config.taskId,
        ...action.config.updates,
      });

    case ACTION_TYPES.ASSIGN_TASK:
      return await ctx.runMutation(api.tasks.mutations.updateTask, {
        taskId: context.taskId || action.config.taskId,
        assignedTo: action.config.userId,
      });

    case ACTION_TYPES.CHANGE_TASK_STATUS:
      return await ctx.runMutation(api.tasks.mutations.updateTask, {
        taskId: context.taskId || action.config.taskId,
        status: action.config.status,
      });

    case ACTION_TYPES.SEND_SLACK_MESSAGE:
      if (action.config.channelId) {
        return await ctx.runAction(
          api.integrations.slack.commands.handleSlashCommand,
          {
            channelId: action.config.channelId,
            text: replaceVariables(action.config.message, context),
          },
        );
      }
      break;

    case ACTION_TYPES.UPDATE_CUSTOM_FIELD:
      return await ctx.runMutation(api.customFields.setCustomFieldValue, {
        entityId: context.entityId || action.config.entityId,
        entityType: context.entityType || action.config.entityType,
        fieldKey: action.config.fieldKey,
        value: action.config.value,
      });

    case ACTION_TYPES.IF_THEN_ELSE:
      const condition = evaluateSingleCondition(
        action.config.condition,
        context,
      );
      if (condition) {
        return await executeAction(
          ctx,
          action.config.thenAction,
          context,
          previousResults,
        );
      } else if (action.config.elseAction) {
        return await executeAction(
          ctx,
          action.config.elseAction,
          context,
          previousResults,
        );
      }
      break;

    case ACTION_TYPES.WAIT:
      await new Promise((resolve) =>
        setTimeout(resolve, action.config.duration),
      );
      break;

    case ACTION_TYPES.RUN_WEBHOOK:
      return await fetch(action.config.url, {
        method: action.config.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...action.config.headers,
        },
        body: JSON.stringify(replaceVariables(action.config.body, context)),
      }).then((res) => res.json());

    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}

// Helper: Evaluate conditions
async function evaluateConditions(
  ctx: any,
  conditions: any[],
  context: any,
): Promise<boolean> {
  let currentAndGroup = true;
  const orGroups: boolean[] = [];

  for (const condition of conditions) {
    const conditionResult = evaluateSingleCondition(condition, context);
    currentAndGroup = currentAndGroup && conditionResult;

    const connectorToNext = condition.connector || "AND";
    if (connectorToNext === "OR") {
      orGroups.push(currentAndGroup);
      currentAndGroup = true;
    }
  }

  orGroups.push(currentAndGroup);
  return orGroups.some((groupResult) => groupResult);
}

// Helper: Evaluate single condition
function evaluateSingleCondition(condition: any, context: any): boolean {
  const fieldValue = getNestedValue(context, condition.field);
  const compareValue = condition.value;

  switch (condition.operator) {
    case OPERATORS.EQUALS:
      return fieldValue === compareValue;
    case OPERATORS.NOT_EQUALS:
      return fieldValue !== compareValue;
    case OPERATORS.CONTAINS:
      return String(fieldValue).includes(String(compareValue));
    case OPERATORS.NOT_CONTAINS:
      return !String(fieldValue).includes(String(compareValue));
    case OPERATORS.GREATER_THAN:
      return Number(fieldValue) > Number(compareValue);
    case OPERATORS.LESS_THAN:
      return Number(fieldValue) < Number(compareValue);
    case OPERATORS.GREATER_THAN_OR_EQUAL:
      return Number(fieldValue) >= Number(compareValue);
    case OPERATORS.LESS_THAN_OR_EQUAL:
      return Number(fieldValue) <= Number(compareValue);
    case OPERATORS.IN:
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case OPERATORS.NOT_IN:
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case OPERATORS.IS_EMPTY:
      return (
        !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)
      );
    case OPERATORS.IS_NOT_EMPTY:
      return (
        !!fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      );
    case OPERATORS.REGEX_MATCH:
      return new RegExp(compareValue).test(String(fieldValue));
    default:
      return false;
  }
}

// Helper: Get nested value from object
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

// Helper: Replace variables in string
function replaceVariables(str: string, context: any): string {
  if (typeof str !== "string") return str;

  return str.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path);
    return value !== undefined ? String(value) : match;
  });
}

// Helper: Check if scheduled workflow should run
function shouldRunScheduledWorkflow(workflow: any, now: number): boolean {
  if (!workflow.triggerConfig?.schedule) return false;

  const schedule = workflow.triggerConfig.schedule;
  const lastExecuted = workflow.lastExecutedAt || 0;

  switch (schedule.type) {
    case "interval":
      const intervalMs = schedule.interval * 60 * 1000; // Convert minutes to ms
      return now - lastExecuted >= intervalMs;

    case "daily":
      const dailyTime = new Date(now);
      dailyTime.setHours(schedule.hour, schedule.minute, 0, 0);
      return now >= dailyTime.getTime() && lastExecuted < dailyTime.getTime();

    case "weekly":
      const weeklyTime = new Date(now);
      const currentDay = weeklyTime.getDay();
      const targetDay = schedule.dayOfWeek;
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      weeklyTime.setDate(weeklyTime.getDate() + daysUntilTarget);
      weeklyTime.setHours(schedule.hour, schedule.minute, 0, 0);
      return now >= weeklyTime.getTime() && lastExecuted < weeklyTime.getTime();

    case "monthly":
      const monthlyTime = new Date(now);
      monthlyTime.setDate(schedule.dayOfMonth);
      monthlyTime.setHours(schedule.hour, schedule.minute, 0, 0);
      return (
        now >= monthlyTime.getTime() && lastExecuted < monthlyTime.getTime()
      );

    case "cron":
      // For cron expressions, we'd need a cron parser library
      // Simplified implementation for now
      return false;

    default:
      return false;
  }
}

// Workflow templates
export const WORKFLOW_TEMPLATES = {
  TASK_OVERDUE_NOTIFICATION: {
    name: "Task Overdue Notification",
    description: "Notify assignee when task becomes overdue",
    triggerType: TRIGGER_TYPES.EVENT,
    triggerConfig: {
      eventType: EVENT_TYPES.TASK_OVERDUE,
    },
    actions: [
      {
        type: ACTION_TYPES.SEND_SLACK_MESSAGE,
        config: {
          channelId: "{{task.assignee.slackChannelId}}",
          message:
            "Task '{{task.title}}' is now overdue. Please update its status.",
        },
        order: 1,
      },
    ],
  },
  SPRINT_DAILY_SUMMARY: {
    name: "Sprint Daily Summary",
    description: "Send daily sprint progress summary",
    triggerType: TRIGGER_TYPES.SCHEDULE,
    triggerConfig: {
      schedule: {
        type: "daily",
        hour: 9,
        minute: 0,
      },
    },
    actions: [
      {
        type: ACTION_TYPES.GENERATE_REPORT,
        config: {
          reportType: "sprint_daily",
        },
        order: 1,
      },
      {
        type: ACTION_TYPES.SEND_SLACK_MESSAGE,
        config: {
          channelId: "{{workspace.defaultSlackChannel}}",
          message: "Daily Sprint Summary: {{action_0_result.summary}}",
        },
        order: 2,
      },
    ],
  },
  AUTO_ASSIGN_BY_SKILL: {
    name: "Auto-assign by Skill",
    description: "Automatically assign tasks based on team member skills",
    triggerType: TRIGGER_TYPES.EVENT,
    triggerConfig: {
      eventType: EVENT_TYPES.TASK_CREATED,
    },
    conditions: [
      {
        field: "task.autoAssign",
        operator: OPERATORS.EQUALS,
        value: true,
      },
    ],
    actions: [
      {
        type: ACTION_TYPES.ASSIGN_TASK,
        config: {
          strategy: "skill_match",
          fallback: "least_loaded",
        },
        order: 1,
      },
    ],
  },
  GITLAB_SYNC: {
    name: "GitLab Issue Sync",
    description: "Create GitLab issue when high-priority task is created",
    triggerType: TRIGGER_TYPES.EVENT,
    triggerConfig: {
      eventType: EVENT_TYPES.TASK_CREATED,
    },
    conditions: [
      {
        field: "task.priority",
        operator: OPERATORS.IN,
        value: ["high", "critical"],
      },
    ],
    actions: [
      {
        type: ACTION_TYPES.CREATE_GITLAB_ISSUE,
        config: {
          projectId: "{{project.gitlabProjectId}}",
          title: "{{task.title}}",
          description: "{{task.description}}",
          labels: ["from-iceberg", "{{task.priority}}"],
        },
        order: 1,
      },
      {
        type: ACTION_TYPES.UPDATE_CUSTOM_FIELD,
        config: {
          entityId: "{{task._id}}",
          entityType: "task",
          fieldKey: "gitlab_issue_id",
          value: "{{action_0_result.issueId}}",
        },
        order: 2,
      },
    ],
  },
};

// Export workflow template
export const exportWorkflowTemplate = query({
  args: {
    workflowId: v.id("workflows"),
  },
  returns: v.object({
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.string(),
    triggerConfig: v.any(),
    conditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.string(),
          value: v.any(),
          connector: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
        }),
      ),
    ),
    actions: v.array(
      v.object({
        type: v.string(),
        config: v.any(),
        order: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Remove sensitive and instance-specific data
    const template = {
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.trigger.type,
      triggerConfig: {
        eventType: workflow.trigger.eventType,
        schedule: workflow.trigger.schedule,
        webhookUrl: workflow.trigger.webhookUrl,
      },
      conditions: workflow.trigger.conditions,
      actions: workflow.actions,
    };

    return template;
  },
});

// Import workflow template
export const importWorkflowTemplate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    template: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      triggerType: v.string(),
      triggerConfig: v.any(),
      conditions: v.optional(v.array(v.any())),
      actions: v.array(v.any()),
    }),
  },
  returns: v.id("workflows"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("workflows", {
      workspaceId: args.workspaceId,
      name: args.template.name,
      description: args.template.description,
      trigger: {
        type: args.template.triggerType as
          | "manual"
          | "event"
          | "schedule"
          | "webhook",
        eventType: args.template.triggerConfig?.eventType,
        schedule: args.template.triggerConfig?.schedule,
        webhookUrl: args.template.triggerConfig?.webhookUrl,
        conditions: args.template.conditions,
      },
      actions: args.template.actions,
      enabled: false, // Start as inactive for safety
      createdBy: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runCount: 0,
      lastRun: undefined,
    });
  },
});
