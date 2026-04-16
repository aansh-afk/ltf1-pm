import { useEffect, useReducer } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import BrutalModal from "@/components/ui/BrutalModal";
import BrutalButton from "@/components/ui/BrutalButton";
import toast from "react-hot-toast";
import clsx from "clsx";
import {
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import {
  ACTION_META,
  PRIORITY_OPTIONS,
  TASK_TYPE_CONDITION_OPTIONS,
  TASK_TYPE_OPTIONS,
  actionIsValid,
  deserializeActions,
  makeActionRow,
  serializeActions,
  type ActionKind,
  type ActionRow,
  type Priority,
  type TaskType,
  type TaskTemplate,
} from "./skillActionEditor";

type TriggerType = "manual" | "auto" | "both";

type EditSkillState = {
  step: number;
  loaded: boolean;
  name: string;
  displayName: string;
  description: string;
  trigger: TriggerType;
  taskTypes: string[];
  keywords: string[];
  keywordInput: string;
  actions: Array<ActionRow>;
  isSaving: boolean;
};

const emptyState: EditSkillState = {
  step: 1,
  loaded: false,
  name: "",
  displayName: "",
  description: "",
  trigger: "manual",
  taskTypes: [],
  keywords: [],
  keywordInput: "",
  actions: [],
  isSaving: false,
};

type Action =
  | {
      type: "LOAD";
      name: string;
      displayName: string;
      description: string;
      trigger: TriggerType;
      taskTypes: string[];
      keywords: string[];
      actions: Array<ActionRow>;
    }
  | {
      type: "SET_FIELD";
      field: keyof EditSkillState;
      value: EditSkillState[keyof EditSkillState];
    }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "TOGGLE_TASK_TYPE"; taskType: string }
  | { type: "ADD_KEYWORD" }
  | { type: "REMOVE_KEYWORD"; index: number }
  | { type: "ADD_ACTION" }
  | { type: "REMOVE_ACTION"; index: number }
  | { type: "CHANGE_ACTION_KIND"; index: number; kind: ActionKind }
  | { type: "SET_ACTION_TYPE"; index: number; value: TaskType | "" }
  | { type: "SET_ACTION_PRIORITY"; index: number; value: Priority | "" }
  | { type: "SET_LABEL_INPUT"; index: number; value: string }
  | { type: "ADD_LABEL"; index: number }
  | { type: "REMOVE_LABEL"; index: number; labelIndex: number }
  | { type: "ADD_TASK_TEMPLATE"; index: number }
  | { type: "REMOVE_TASK_TEMPLATE"; index: number; templateIndex: number }
  | {
      type: "UPDATE_TASK_TEMPLATE";
      index: number;
      templateIndex: number;
      field: keyof TaskTemplate;
      value: string;
    }
  | { type: "RESET" };

function updateActionAt(
  state: EditSkillState,
  index: number,
  fn: (a: ActionRow) => ActionRow,
): EditSkillState {
  const actions = [...state.actions];
  actions[index] = fn(actions[index]);
  return { ...state, actions };
}

function reducer(state: EditSkillState, action: Action): EditSkillState {
  switch (action.type) {
    case "LOAD":
      return {
        ...state,
        loaded: true,
        step: 1,
        name: action.name,
        displayName: action.displayName,
        description: action.description,
        trigger: action.trigger,
        taskTypes: action.taskTypes,
        keywords: action.keywords,
        actions: action.actions,
      };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "NEXT_STEP":
      return { ...state, step: Math.min(state.step + 1, 4) };
    case "PREV_STEP":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "TOGGLE_TASK_TYPE": {
      const taskTypes = state.taskTypes.includes(action.taskType)
        ? state.taskTypes.filter((t) => t !== action.taskType)
        : [...state.taskTypes, action.taskType];
      return { ...state, taskTypes };
    }
    case "ADD_KEYWORD": {
      const kw = state.keywordInput.trim();
      if (!kw || state.keywords.includes(kw))
        return { ...state, keywordInput: "" };
      return {
        ...state,
        keywords: [...state.keywords, kw],
        keywordInput: "",
      };
    }
    case "REMOVE_KEYWORD":
      return {
        ...state,
        keywords: state.keywords.filter((_, i) => i !== action.index),
      };
    case "ADD_ACTION":
      return {
        ...state,
        actions: [...state.actions, makeActionRow("set_priority")],
      };
    case "REMOVE_ACTION":
      return {
        ...state,
        actions: state.actions.filter((_, i) => i !== action.index),
      };
    case "CHANGE_ACTION_KIND": {
      const fresh = makeActionRow(action.kind);
      fresh.id = state.actions[action.index].id;
      const actions = [...state.actions];
      actions[action.index] = fresh;
      return { ...state, actions };
    }
    case "SET_ACTION_TYPE":
      return updateActionAt(state, action.index, (a) =>
        a.kind === "set_type" ? { ...a, type: action.value } : a,
      );
    case "SET_ACTION_PRIORITY":
      return updateActionAt(state, action.index, (a) =>
        a.kind === "set_priority" ? { ...a, priority: action.value } : a,
      );
    case "SET_LABEL_INPUT":
      return updateActionAt(state, action.index, (a) =>
        a.kind === "add_label" ? { ...a, input: action.value } : a,
      );
    case "ADD_LABEL":
      return updateActionAt(state, action.index, (a) => {
        if (a.kind !== "add_label") return a;
        const v = a.input.trim();
        if (!v || a.labels.includes(v)) return { ...a, input: "" };
        return { ...a, labels: [...a.labels, v], input: "" };
      });
    case "REMOVE_LABEL":
      return updateActionAt(state, action.index, (a) =>
        a.kind === "add_label"
          ? {
              ...a,
              labels: a.labels.filter((_, i) => i !== action.labelIndex),
            }
          : a,
      );
    case "ADD_TASK_TEMPLATE":
      return updateActionAt(state, action.index, (a) =>
        a.kind === "create_tasks"
          ? { ...a, tasks: [...a.tasks, { title: "" }] }
          : a,
      );
    case "REMOVE_TASK_TEMPLATE":
      return updateActionAt(state, action.index, (a) =>
        a.kind === "create_tasks"
          ? {
              ...a,
              tasks: a.tasks.filter((_, i) => i !== action.templateIndex),
            }
          : a,
      );
    case "UPDATE_TASK_TEMPLATE":
      return updateActionAt(state, action.index, (a) => {
        if (a.kind !== "create_tasks") return a;
        const tasks = [...a.tasks];
        tasks[action.templateIndex] = {
          ...tasks[action.templateIndex],
          [action.field]:
            action.value === "" ? undefined : (action.value as never),
        };
        return { ...a, tasks };
      });
    case "RESET":
      return emptyState;
    default:
      return state;
  }
}

interface EditSkillModalProps {
  skillId: Id<"skills"> | null;
  isOpen: boolean;
  onClose: () => void;
}

const labelClass =
  "block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-1.5";
const inputClass =
  "w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors";
const smallInputClass =
  "px-2 py-1.5 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-[10px] text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none";

export default function EditSkillModal({
  skillId,
  isOpen,
  onClose,
}: EditSkillModalProps) {
  const [state, dispatch] = useReducer(reducer, emptyState);
  const updateSkill = useMutation(api.skills.mutations.updateSkill);

  const skill = useQuery(
    api.skills.queries.getSkillById,
    skillId ? { skillId } : "skip",
  );

  // Load state once the query resolves. We key on skillId so reopening the
  // modal for a different skill reloads fresh state.
  useEffect(() => {
    if (!skillId) {
      dispatch({ type: "RESET" });
      return;
    }
    if (!skill) return;
    dispatch({
      type: "LOAD",
      name: skill.name,
      displayName: skill.displayName,
      description: skill.description,
      trigger: skill.trigger,
      taskTypes: skill.conditions?.taskTypes ?? [],
      keywords: skill.conditions?.keywords ?? [],
      actions: deserializeActions(skill.actions),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, skill?._id]);

  const handleClose = () => {
    dispatch({ type: "RESET" });
    onClose();
  };

  const handleSubmit = async () => {
    if (!skillId) return;
    if (!state.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    const serialized = serializeActions(state.actions);
    if (serialized.length === 0) {
      toast.error("At least one action must have a value");
      return;
    }

    dispatch({ type: "SET_FIELD", field: "isSaving", value: true });

    try {
      const conditions =
        state.taskTypes.length > 0 || state.keywords.length > 0
          ? {
              taskTypes:
                state.taskTypes.length > 0 ? state.taskTypes : undefined,
              keywords:
                state.keywords.length > 0 ? state.keywords : undefined,
            }
          : undefined;

      await updateSkill({
        skillId,
        displayName: state.displayName.trim(),
        description:
          state.description.trim() || `Custom skill: ${state.displayName.trim()}`,
        trigger: state.trigger,
        conditions,
        actions: serialized,
      });

      toast.success("Skill updated");
      handleClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update skill";
      toast.error(message);
    } finally {
      dispatch({ type: "SET_FIELD", field: "isSaving", value: false });
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 1:
        return !!state.displayName.trim();
      case 2:
      case 3:
        return true;
      case 4:
        return state.actions.length > 0 && state.actions.every(actionIsValid);
      default:
        return false;
    }
  };

  if (skillId && skill === null) {
    // Query resolved to null — either not found or no access.
    return (
      <BrutalModal isOpen={isOpen} onClose={handleClose} title="EDIT SKILL" size="md">
        <div className="p-4 text-center font-mono text-xs text-[var(--theme-foreground-tertiary)]">
          Skill not found.
        </div>
      </BrutalModal>
    );
  }

  if (!state.loaded) {
    return (
      <BrutalModal isOpen={isOpen} onClose={handleClose} title="EDIT SKILL" size="md">
        <div className="p-4 text-center font-mono text-xs text-[var(--theme-foreground-tertiary)]">
          Loading skill…
        </div>
      </BrutalModal>
    );
  }

  return (
    <BrutalModal isOpen={isOpen} onClose={handleClose} title="EDIT SKILL" size="md">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div
              className={clsx(
                "w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold border-2 transition-colors",
                s === state.step
                  ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : s < state.step
                    ? "border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]"
                    : "border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]",
              )}
            >
              {s < state.step ? "✓" : s}
            </div>
            {s < 4 && (
              <div
                className={clsx(
                  "flex-1 h-0.5",
                  s < state.step
                    ? "bg-[#22C55E]"
                    : "bg-[var(--theme-border)]",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Basic info (name read-only) */}
      {state.step === 1 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-primary)] mb-2">
            STEP 1: BASIC INFO
          </div>
          <div>
            <label htmlFor="edit-skill-name" className={labelClass}>
              NAME (SLUG) — READ ONLY
            </label>
            <input
              id="edit-skill-name"
              type="text"
              value={state.name}
              readOnly
              className={clsx(
                inputClass,
                "opacity-60 cursor-not-allowed",
              )}
            />
          </div>
          <div>
            <label htmlFor="edit-skill-display-name" className={labelClass}>
              DISPLAY NAME
            </label>
            <input
              id="edit-skill-display-name"
              type="text"
              value={state.displayName}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "displayName",
                  value: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="edit-skill-description" className={labelClass}>
              DESCRIPTION
            </label>
            <textarea
              id="edit-skill-description"
              value={state.description}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "description",
                  value: e.target.value,
                })
              }
              rows={3}
              className={clsx(inputClass, "resize-none")}
            />
          </div>
        </div>
      )}

      {/* Step 2 — Trigger */}
      {state.step === 2 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-primary)] mb-2">
            STEP 2: TRIGGER TYPE
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["manual", "auto", "both"] as const).map((t) => {
              const colors: Record<TriggerType, { accent: string; bg: string }> = {
                manual: { accent: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
                auto: { accent: "#22C55E", bg: "rgba(34, 197, 94, 0.1)" },
                both: { accent: "#06B6D4", bg: "rgba(6, 182, 212, 0.1)" },
              };
              const c = colors[t];
              const isSelected = state.trigger === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    dispatch({ type: "SET_FIELD", field: "trigger", value: t })
                  }
                  className={clsx(
                    "p-3 border-2 text-center transition-all",
                    isSelected
                      ? ""
                      : "border-[var(--theme-border)] hover:border-[var(--theme-foreground-tertiary)]",
                  )}
                  style={
                    isSelected
                      ? { borderColor: c.accent, backgroundColor: c.bg }
                      : undefined
                  }
                >
                  <div
                    className="font-mono text-xs font-bold uppercase"
                    style={{ color: c.accent }}
                  >
                    {t.toUpperCase()}
                  </div>
                  <div className="font-mono text-[9px] text-[var(--theme-foreground-tertiary)] mt-1">
                    {t === "manual" && "Run on demand"}
                    {t === "auto" && "Runs automatically"}
                    {t === "both" && "Auto + manual"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3 — Conditions */}
      {state.step === 3 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-primary)] mb-2">
            STEP 3: CONDITIONS (OPTIONAL)
          </div>
          <div>
            <label className={labelClass}>TASK TYPES</label>
            <div className="flex flex-wrap gap-1.5">
              {TASK_TYPE_CONDITION_OPTIONS.map((tt) => (
                <button
                  key={tt}
                  type="button"
                  onClick={() =>
                    dispatch({ type: "TOGGLE_TASK_TYPE", taskType: tt })
                  }
                  className={clsx(
                    "px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border-2 transition-colors",
                    state.taskTypes.includes(tt)
                      ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]"
                      : "border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)] hover:border-[var(--theme-foreground-secondary)]",
                  )}
                >
                  {tt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="edit-keyword-input" className={labelClass}>
              KEYWORDS
            </label>
            <div className="flex gap-1.5">
              <input
                id="edit-keyword-input"
                type="text"
                value={state.keywordInput}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "keywordInput",
                    value: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    dispatch({ type: "ADD_KEYWORD" });
                  }
                }}
                placeholder="Type and press Enter..."
                className={clsx(inputClass, "flex-1")}
              />
              <BrutalButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => dispatch({ type: "ADD_KEYWORD" })}
              >
                <HiOutlinePlus className="w-3.5 h-3.5" />
              </BrutalButton>
            </div>
            {state.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {state.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--theme-background)] border border-[var(--theme-border)] font-mono text-[10px] text-[var(--theme-foreground-secondary)]"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({ type: "REMOVE_KEYWORD", index: i })
                      }
                      className="text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-error)] transition-colors"
                    >
                      <HiOutlineX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4 — Actions */}
      {state.step === 4 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-primary)] mb-2">
            STEP 4: ACTIONS
          </div>
          <div className="space-y-2">
            {state.actions.map((row, i) => (
              <div
                key={row.id}
                className="p-2.5 border border-[var(--theme-border)] bg-[var(--theme-background)] space-y-2"
              >
                <div className="flex items-center gap-2">
                  {row.kind === "unsupported" ? (
                    <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 font-mono text-[10px] text-[#F59E0B]">
                      <HiOutlineExclamationCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="uppercase">UNSUPPORTED: {row.rawType}</span>
                    </div>
                  ) : (
                    <select
                      value={row.kind}
                      onChange={(e) =>
                        dispatch({
                          type: "CHANGE_ACTION_KIND",
                          index: i,
                          kind: e.target.value as ActionKind,
                        })
                      }
                      className={clsx(smallInputClass, "flex-1 uppercase")}
                    >
                      {(Object.keys(ACTION_META) as Array<ActionKind>).map((k) => (
                        <option key={k} value={k}>
                          {ACTION_META[k].label}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "REMOVE_ACTION", index: i })
                    }
                    className="p-1 text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-error)] transition-colors"
                    aria-label="Remove action"
                  >
                    <HiOutlineX className="w-3.5 h-3.5" />
                  </button>
                </div>

                {row.kind === "set_type" && (
                  <select
                    value={row.type}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_ACTION_TYPE",
                        index: i,
                        value: e.target.value as TaskType | "",
                      })
                    }
                    className={clsx(smallInputClass, "w-full uppercase")}
                  >
                    <option value="">— Pick task type —</option>
                    {TASK_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}

                {row.kind === "set_priority" && (
                  <select
                    value={row.priority}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_ACTION_PRIORITY",
                        index: i,
                        value: e.target.value as Priority | "",
                      })
                    }
                    className={clsx(smallInputClass, "w-full uppercase")}
                  >
                    <option value="">— Pick priority —</option>
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}

                {row.kind === "add_label" && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={row.input}
                        onChange={(e) =>
                          dispatch({
                            type: "SET_LABEL_INPUT",
                            index: i,
                            value: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            dispatch({ type: "ADD_LABEL", index: i });
                          }
                        }}
                        placeholder="Label and press Enter..."
                        className={clsx(smallInputClass, "flex-1")}
                      />
                      <BrutalButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          dispatch({ type: "ADD_LABEL", index: i })
                        }
                      >
                        <HiOutlinePlus className="w-3.5 h-3.5" />
                      </BrutalButton>
                    </div>
                    {row.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {row.labels.map((lbl, li) => (
                          <span
                            key={`${row.id}-lbl-${li}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-[10px] text-[var(--theme-foreground-secondary)]"
                          >
                            {lbl}
                            <button
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: "REMOVE_LABEL",
                                  index: i,
                                  labelIndex: li,
                                })
                              }
                              className="text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-error)] transition-colors"
                            >
                              <HiOutlineX className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {row.kind === "create_tasks" && (
                  <div className="space-y-1.5">
                    {row.tasks.map((tpl, ti) => (
                      <div
                        key={`${row.id}-tpl-${ti}`}
                        className="grid grid-cols-[1fr_auto_auto_auto] gap-1.5 items-center"
                      >
                        <input
                          type="text"
                          value={tpl.title}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_TASK_TEMPLATE",
                              index: i,
                              templateIndex: ti,
                              field: "title",
                              value: e.target.value,
                            })
                          }
                          placeholder="Task title..."
                          className={clsx(smallInputClass, "min-w-0")}
                        />
                        <select
                          value={tpl.type ?? ""}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_TASK_TEMPLATE",
                              index: i,
                              templateIndex: ti,
                              field: "type",
                              value: e.target.value,
                            })
                          }
                          className={clsx(smallInputClass, "uppercase")}
                        >
                          <option value="">type</option>
                          {TASK_TYPE_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <select
                          value={tpl.priority ?? ""}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_TASK_TEMPLATE",
                              index: i,
                              templateIndex: ti,
                              field: "priority",
                              value: e.target.value,
                            })
                          }
                          className={clsx(smallInputClass, "uppercase")}
                        >
                          <option value="">prio</option>
                          {PRIORITY_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "REMOVE_TASK_TEMPLATE",
                              index: i,
                              templateIndex: ti,
                            })
                          }
                          className="p-1 text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-error)] transition-colors"
                          aria-label="Remove template"
                        >
                          <HiOutlineX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <BrutalButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        dispatch({ type: "ADD_TASK_TEMPLATE", index: i })
                      }
                      className="flex items-center gap-1"
                    >
                      <HiOutlinePlus className="w-3 h-3" />
                      ADD TASK
                    </BrutalButton>
                  </div>
                )}

                {row.kind === "add_to_sprint" && (
                  <p className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
                    Moves the task into the project&apos;s active sprint.
                  </p>
                )}

                {row.kind === "unsupported" && (
                  <p className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
                    This action type isn&apos;t editable here. It will be
                    preserved on save. Remove the row to drop it.
                  </p>
                )}
              </div>
            ))}
          </div>
          <BrutalButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "ADD_ACTION" })}
            className="flex items-center gap-1.5"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            ADD ACTION
          </BrutalButton>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--theme-border)]">
        <div>
          {state.step > 1 && (
            <BrutalButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "PREV_STEP" })}
              className="flex items-center gap-1"
            >
              <HiOutlineChevronLeft className="w-3.5 h-3.5" />
              BACK
            </BrutalButton>
          )}
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={state.isSaving}
          >
            CANCEL
          </BrutalButton>
          {state.step < 4 ? (
            <BrutalButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => dispatch({ type: "NEXT_STEP" })}
              disabled={!canProceed()}
              className="flex items-center gap-1"
            >
              NEXT
              <HiOutlineChevronRight className="w-3.5 h-3.5" />
            </BrutalButton>
          ) : (
            <BrutalButton
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!canProceed() || state.isSaving}
              loading={state.isSaving}
            >
              SAVE SKILL
            </BrutalButton>
          )}
        </div>
      </div>
    </BrutalModal>
  );
}
