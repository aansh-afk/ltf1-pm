import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import BrutalCard from "@/components/ui/BrutalCard";
import BrutalToggle from "@/components/ui/BrutalToggle";
import BrutalButton from "@/components/ui/BrutalButton";
import toast from "react-hot-toast";
import clsx from "clsx";
import { HiOutlinePencil, HiOutlineTrash, HiOutlineDownload } from "react-icons/hi";

type TriggerType = "manual" | "auto" | "both";

interface SkillData {
  _id?: Id<"skills">;
  name: string;
  displayName: string;
  description: string;
  trigger: TriggerType;
  isActive: boolean;
  isBuiltIn?: boolean;
  usageCount?: number;
}

interface SkillCardProps {
  skill: SkillData;
  variant: "workspace" | "library";
  workspaceId?: string;
  onEdit?: (skillId: Id<"skills">) => void;
  isMostUsed?: boolean;
}

const TRIGGER_CONFIG: Record<TriggerType, { label: string; color: string; bg: string; border: string }> = {
  auto: { label: "AUTO", color: "text-[#22C55E]", bg: "bg-[#22C55E]/10", border: "border-[#22C55E]/30" },
  manual: { label: "MANUAL", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "border-[#F59E0B]/30" },
  both: { label: "BOTH", color: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10", border: "border-[#06B6D4]/30" },
};

function getSkillIcon(name: string): string {
  const map: Record<string, string> = {
    "auto-triage": "🎯",
    "bug-labeler": "🐛",
    "priority-escalator": "🔥",
    "sprint-assigner": "🏃",
    "due-date-setter": "📅",
    "subtask-creator": "📋",
    "review-requester": "👀",
    "standup-reporter": "📊",
  };
  return map[name] || "⚡";
}

export default function SkillCard({ skill, variant, workspaceId, onEdit, isMostUsed }: SkillCardProps) {
  const toggleSkill = useMutation(api.skills.mutations.toggleSkill);
  const deleteSkill = useMutation(api.skills.mutations.deleteSkill);
  const installSkill = useMutation(api.skills.mutations.installSkill);
  const installBuiltInSkill = useMutation(api.skills.mutations.installBuiltInSkill);

  const triggerCfg = TRIGGER_CONFIG[skill.trigger];

  const handleToggle = async () => {
    if (!skill._id) return;
    try {
      const newState = await toggleSkill({ skillId: skill._id });
      toast.success(`Skill ${newState ? "enabled" : "disabled"}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to toggle skill";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!skill._id) return;
    if (!confirm(`Delete "${skill.displayName}"? This cannot be undone.`)) return;
    try {
      await deleteSkill({ skillId: skill._id });
      toast.success("Skill deleted");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete skill";
      toast.error(message);
    }
  };

  const handleInstall = async () => {
    if (!workspaceId) return;
    try {
      if (skill._id) {
        // Published community skill — copy by _id.
        await installSkill({
          sourceSkillId: skill._id,
          workspaceId: workspaceId as Id<"workspaces">,
        });
      } else if (skill.isBuiltIn) {
        // Built-in template — install from the BUILT_IN_SKILLS registry by name.
        await installBuiltInSkill({
          workspaceId: workspaceId as Id<"workspaces">,
          name: skill.name,
        });
      } else {
        throw new Error("Skill has no id and is not a built-in template");
      }
      toast.success(`"${skill.displayName}" installed`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to install skill";
      toast.error(message);
    }
  };

  return (
    <BrutalCard variant="default" padding="none" className="flex flex-col">
      <div className="p-4 flex-1">
        {/* Header row: icon + name + badges */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 flex items-center justify-center border-2 border-[var(--theme-border)] bg-[var(--theme-background)] text-lg shrink-0">
            {getSkillIcon(skill.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-[var(--theme-foreground)] truncate">
                {skill.displayName}
              </h3>
              {skill.isBuiltIn && (
                <span className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  BUILT-IN
                </span>
              )}
              {isMostUsed && (
                <span className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]">
                  MOST USED
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--theme-foreground-tertiary)] mt-0.5 line-clamp-2">
              {skill.description}
            </p>
          </div>
        </div>

        {/* Trigger badge + usage */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={clsx(
              "px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border",
              triggerCfg.color,
              triggerCfg.bg,
              triggerCfg.border,
            )}
          >
            {triggerCfg.label}
          </span>
          {skill.usageCount !== undefined && (
            <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
              Used {skill.usageCount} time{skill.usageCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-2.5 border-t border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-background)]/30">
        {variant === "workspace" && skill._id ? (
          <>
            <BrutalToggle
              checked={skill.isActive}
              onChange={handleToggle}
              size="sm"
            />
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(skill._id!)}
                  className="p-1.5 text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-tertiary)] transition-colors"
                  title="Edit skill"
                >
                  <HiOutlinePencil className="w-3.5 h-3.5" />
                </button>
              )}
              {!skill.isBuiltIn && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-error)] hover:bg-[var(--theme-error)]/10 transition-colors"
                  title="Delete skill"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        ) : (
          <BrutalButton
            variant="secondary"
            size="sm"
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-1.5"
          >
            <HiOutlineDownload className="w-3.5 h-3.5" />
            INSTALL
          </BrutalButton>
        )}
      </div>
    </BrutalCard>
  );
}
