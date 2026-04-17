// Shared types + helpers for the Skill action editor UI.
// Both CreateSkillModal and EditSkillModal use these so the config shapes
// they emit stay in sync with convex/skills/execution.ts.

export type ActionKind =
  | "set_type"
  | "set_priority"
  | "add_label"
  | "create_tasks"
  | "add_to_sprint";

export type TaskType = "bug" | "feature" | "improvement" | "task" | "epic";
export type Priority = "urgent" | "high" | "medium" | "low";

export type TaskTemplate = {
  title: string;
  type?: TaskType;
  priority?: Priority;
};

export type ActionRow =
  | { id: string; kind: "set_type"; type: TaskType | "" }
  | { id: string; kind: "set_priority"; priority: Priority | "" }
  | { id: string; kind: "add_label"; labels: Array<string>; input: string }
  | { id: string; kind: "create_tasks"; tasks: Array<TaskTemplate> }
  | { id: string; kind: "add_to_sprint" }
  // Preserves unknown / deprecated action types (e.g. "set_assignee",
  // "notify_slack") when editing existing skills, so we never destroy data
  // on save. Rendered read-only.
  | {
      id: string;
      kind: "unsupported";
      rawType: string;
      rawConfig: unknown;
    };

export const ACTION_META: Record<ActionKind, { label: string; description: string }> = {
  set_type: { label: "Set Type", description: "Change task type" },
  set_priority: { label: "Set Priority", description: "Change priority" },
  add_label: { label: "Add Label", description: "Add one or more labels" },
  create_tasks: {
    label: "Create Tasks",
    description: "Create new linked child tasks",
  },
  add_to_sprint: { label: "Add to Sprint", description: "Move to active sprint" },
};

export const TASK_TYPE_OPTIONS: Array<TaskType> = [
  "bug",
  "feature",
  "improvement",
  "task",
  "epic",
];
export const PRIORITY_OPTIONS: Array<Priority> = ["urgent", "high", "medium", "low"];

export const TASK_TYPE_CONDITION_OPTIONS = [
  "bug",
  "feature",
  "chore",
  "story",
  "epic",
  "improvement",
] as const;

let actionIdCounter = 0;
function nextActionId(): string {
  actionIdCounter += 1;
  return `action-${Date.now().toString(36)}-${actionIdCounter}`;
}

export function makeActionRow(kind: ActionKind): ActionRow {
  const id = nextActionId();
  switch (kind) {
    case "set_type":
      return { id, kind, type: "" };
    case "set_priority":
      return { id, kind, priority: "high" };
    case "add_label":
      return { id, kind, labels: [], input: "" };
    case "create_tasks":
      return { id, kind, tasks: [{ title: "" }] };
    case "add_to_sprint":
      return { id, kind };
  }
}

/**
 * Convert stored skill actions (from the DB) into ActionRow UI state.
 * Unknown action types become "unsupported" rows so we don't lose data.
 */
export function deserializeActions(
  stored: Array<{ type: string; config: unknown }>,
): Array<ActionRow> {
  return stored.map((a) => {
    const id = nextActionId();
    const cfg = (a.config ?? {}) as Record<string, unknown>;
    switch (a.type) {
      case "set_type":
        return {
          id,
          kind: "set_type",
          type: (cfg.type as TaskType) ?? "",
        };
      case "set_priority":
        return {
          id,
          kind: "set_priority",
          priority: (cfg.priority as Priority) ?? "",
        };
      case "add_label":
        return {
          id,
          kind: "add_label",
          labels: Array.isArray(cfg.labels) ? (cfg.labels as Array<string>) : [],
          input: "",
        };
      case "create_tasks": {
        const tasks = Array.isArray(cfg.tasks)
          ? (cfg.tasks as Array<TaskTemplate>)
          : [];
        return {
          id,
          kind: "create_tasks",
          tasks: tasks.length > 0 ? tasks : [{ title: "" }],
        };
      }
      case "add_to_sprint":
        return { id, kind: "add_to_sprint" };
      default:
        return { id, kind: "unsupported", rawType: a.type, rawConfig: a.config };
    }
  });
}

/**
 * Convert UI action rows to the shape the executor expects. "unsupported"
 * rows pass through unchanged so editing a skill preserves deprecated actions.
 */
export function serializeActions(
  rows: Array<ActionRow>,
): Array<{ type: string; config: Record<string, unknown> }> {
  const out: Array<{ type: string; config: Record<string, unknown> }> = [];
  for (const row of rows) {
    switch (row.kind) {
      case "set_type":
        if (row.type) out.push({ type: "set_type", config: { type: row.type } });
        break;
      case "set_priority":
        if (row.priority)
          out.push({
            type: "set_priority",
            config: { priority: row.priority },
          });
        break;
      case "add_label":
        if (row.labels.length > 0)
          out.push({ type: "add_label", config: { labels: row.labels } });
        break;
      case "create_tasks": {
        const tasks = row.tasks
          .map((t) => ({
            title: t.title.trim(),
            type: t.type,
            priority: t.priority,
          }))
          .filter((t) => t.title.length > 0);
        if (tasks.length > 0)
          out.push({ type: "create_tasks", config: { tasks } });
        break;
      }
      case "add_to_sprint":
        out.push({ type: "add_to_sprint", config: {} });
        break;
      case "unsupported":
        out.push({
          type: row.rawType,
          config: (row.rawConfig ?? {}) as Record<string, unknown>,
        });
        break;
    }
  }
  return out;
}

export function actionIsValid(row: ActionRow): boolean {
  switch (row.kind) {
    case "set_type":
      return !!row.type;
    case "set_priority":
      return !!row.priority;
    case "add_label":
      return row.labels.length > 0;
    case "create_tasks":
      return row.tasks.some((t) => t.title.trim().length > 0);
    case "add_to_sprint":
      return true;
    case "unsupported":
      // Passthrough — always valid since we preserve raw data.
      return true;
  }
}
