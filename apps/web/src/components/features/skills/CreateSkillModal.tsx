import { useReducer } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import BrutalModal from "@/components/ui/BrutalModal";
import BrutalButton from "@/components/ui/BrutalButton";
import toast from "react-hot-toast";
import clsx from "clsx";
import { HiOutlinePlus, HiOutlineX, HiOutlineChevronRight, HiOutlineChevronLeft } from "react-icons/hi";

type TriggerType = "manual" | "auto" | "both";

const ACTION_TYPE_OPTIONS = [
  { value: "set_type", label: "Set Type" },
  { value: "set_priority", label: "Set Priority" },
  { value: "add_label", label: "Add Label" },
  { value: "set_assignee", label: "Set Assignee" },
  { value: "create_tasks", label: "Create Tasks" },
  { value: "add_to_sprint", label: "Add to Sprint" },
] as const;

const TASK_TYPE_OPTIONS = ["bug", "feature", "chore", "story", "epic", "improvement"] as const;

interface ActionRow {
  type: string;
  config: Record<string, string>;
}

type CreateSkillState = {
  step: number;
  name: string;
  displayName: string;
  description: string;
  trigger: TriggerType;
  taskTypes: string[];
  keywords: string[];
  keywordInput: string;
  actions: ActionRow[];
  isCreating: boolean;
};

const initialState: CreateSkillState = {
  step: 1,
  name: "",
  displayName: "",
  description: "",
  trigger: "manual",
  taskTypes: [],
  keywords: [],
  keywordInput: "",
  actions: [{ type: "set_priority", config: { value: "high" } }],
  isCreating: false,
};

type Action =
  | { type: "SET_FIELD"; field: keyof CreateSkillState; value: CreateSkillState[keyof CreateSkillState] }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "TOGGLE_TASK_TYPE"; taskType: string }
  | { type: "ADD_KEYWORD" }
  | { type: "REMOVE_KEYWORD"; index: number }
  | { type: "ADD_ACTION" }
  | { type: "REMOVE_ACTION"; index: number }
  | { type: "UPDATE_ACTION"; index: number; field: "type" | "configKey" | "configValue"; value: string }
  | { type: "RESET" };

function reducer(state: CreateSkillState, action: Action): CreateSkillState {
  switch (action.type) {
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
      if (!kw || state.keywords.includes(kw)) return { ...state, keywordInput: "" };
      return { ...state, keywords: [...state.keywords, kw], keywordInput: "" };
    }
    case "REMOVE_KEYWORD":
      return { ...state, keywords: state.keywords.filter((_, i) => i !== action.index) };
    case "ADD_ACTION":
      return { ...state, actions: [...state.actions, { type: "set_priority", config: { value: "" } }] };
    case "REMOVE_ACTION":
      return { ...state, actions: state.actions.filter((_, i) => i !== action.index) };
    case "UPDATE_ACTION": {
      const actions = [...state.actions];
      if (action.field === "type") {
        actions[action.index] = { type: action.value, config: { value: "" } };
      } else {
        actions[action.index] = {
          ...actions[action.index],
          config: { value: action.value },
        };
      }
      return { ...state, actions };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface CreateSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

const labelClass = "block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-1.5";
const inputClass = "w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors";

export default function CreateSkillModal({ isOpen, onClose, workspaceId }: CreateSkillModalProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const createSkill = useMutation(api.skills.mutations.createSkill);

  const handleClose = () => {
    dispatch({ type: "RESET" });
    onClose();
  };

  const handleSubmit = async () => {
    if (!state.name.trim() || !state.displayName.trim()) {
      toast.error("Name and display name are required");
      return;
    }
    if (state.actions.length === 0) {
      toast.error("At least one action is required");
      return;
    }

    dispatch({ type: "SET_FIELD", field: "isCreating", value: true });

    try {
      const conditions =
        state.taskTypes.length > 0 || state.keywords.length > 0
          ? {
              taskTypes: state.taskTypes.length > 0 ? state.taskTypes : undefined,
              keywords: state.keywords.length > 0 ? state.keywords : undefined,
            }
          : undefined;

      await createSkill({
        workspaceId: workspaceId as Id<"workspaces">,
        name: state.name.trim(),
        displayName: state.displayName.trim(),
        description: state.description.trim() || `Custom skill: ${state.displayName.trim()}`,
        trigger: state.trigger,
        conditions,
        actions: state.actions.map((a) => ({
          type: a.type,
          config: a.config,
        })),
      });

      toast.success("Skill created");
      handleClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create skill";
      toast.error(message);
    } finally {
      dispatch({ type: "SET_FIELD", field: "isCreating", value: false });
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 1:
        return state.name.trim() && state.displayName.trim();
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return state.actions.length > 0;
      default:
        return false;
    }
  };

  return (
    <BrutalModal isOpen={isOpen} onClose={handleClose} title="CREATE SKILL" size="md">
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
                  s < state.step ? "bg-[#22C55E]" : "bg-[var(--theme-border)]",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {state.step === 1 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-primary)] mb-2">
            STEP 1: BASIC INFO
          </div>
          <div>
            <label htmlFor="skill-name" className={labelClass}>NAME (SLUG)</label>
            <input
              id="skill-name"
              type="text"
              value={state.name}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "name", value: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              placeholder="my-custom-skill"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="skill-display-name" className={labelClass}>DISPLAY NAME</label>
            <input
              id="skill-display-name"
              type="text"
              value={state.displayName}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "displayName", value: e.target.value })}
              placeholder="My Custom Skill"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="skill-description" className={labelClass}>DESCRIPTION</label>
            <textarea
              id="skill-description"
              value={state.description}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "description", value: e.target.value })}
              placeholder="What does this skill do..."
              rows={3}
              className={clsx(inputClass, "resize-none")}
            />
          </div>
        </div>
      )}

      {/* Step 2: Trigger Type */}
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
                  onClick={() => dispatch({ type: "SET_FIELD", field: "trigger", value: t })}
                  className={clsx(
                    "p-3 border-2 text-center transition-all",
                    isSelected
                      ? `border-[${c.accent}]`
                      : "border-[var(--theme-border)] hover:border-[var(--theme-foreground-tertiary)]",
                  )}
                  style={isSelected ? { borderColor: c.accent, backgroundColor: c.bg } : undefined}
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

      {/* Step 3: Conditions */}
      {state.step === 3 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-primary)] mb-2">
            STEP 3: CONDITIONS (OPTIONAL)
          </div>
          <div>
            <label className={labelClass}>TASK TYPES</label>
            <div className="flex flex-wrap gap-1.5">
              {TASK_TYPE_OPTIONS.map((tt) => (
                <button
                  key={tt}
                  type="button"
                  onClick={() => dispatch({ type: "TOGGLE_TASK_TYPE", taskType: tt })}
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
            <label htmlFor="skill-keyword-input" className={labelClass}>KEYWORDS</label>
            <div className="flex gap-1.5">
              <input
                id="skill-keyword-input"
                type="text"
                value={state.keywordInput}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "keywordInput", value: e.target.value })}
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
                      onClick={() => dispatch({ type: "REMOVE_KEYWORD", index: i })}
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

      {/* Step 4: Actions */}
      {state.step === 4 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-primary)] mb-2">
            STEP 4: ACTIONS
          </div>
          <div className="space-y-2">
            {state.actions.map((action, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 border border-[var(--theme-border)] bg-[var(--theme-background)]"
              >
                <select
                  value={action.type}
                  onChange={(e) => dispatch({ type: "UPDATE_ACTION", index: i, field: "type", value: e.target.value })}
                  className="flex-1 px-2 py-1.5 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-[10px] text-[var(--theme-foreground)] uppercase focus:border-[var(--theme-primary)] focus:outline-none"
                >
                  {ACTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={action.config.value || ""}
                  onChange={(e) => dispatch({ type: "UPDATE_ACTION", index: i, field: "configValue", value: e.target.value })}
                  placeholder="Value..."
                  className="flex-1 px-2 py-1.5 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-[10px] text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_ACTION", index: i })}
                  className="p-1 text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-error)] transition-colors"
                >
                  <HiOutlineX className="w-3.5 h-3.5" />
                </button>
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
            disabled={state.isCreating}
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
              disabled={!canProceed() || state.isCreating}
              loading={state.isCreating}
            >
              CREATE SKILL
            </BrutalButton>
          )}
        </div>
      </div>
    </BrutalModal>
  );
}
