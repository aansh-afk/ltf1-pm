import { useState, useCallback, useEffect, useRef } from "react";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { m } from "framer-motion";
import clsx from "clsx";
import BrutalCard from "@/components/ui/BrutalCard";
import BrutalToggle from "@/components/ui/BrutalToggle";
import BrutalSelect from "@/components/ui/BrutalSelect";
import toast from "react-hot-toast";

// ── Types ──

type PresetType = "agile" | "kanban" | "custom";

type TaskStatus =
  | "no_change"
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled";

type TaskType =
  | "feature"
  | "bug"
  | "chore"
  | "improvement"
  | "refactor"
  | "test"
  | "docs"
  | "performance"
  | "ci";

interface StatusMapping {
  branch_created: TaskStatus;
  pr_opened: TaskStatus;
  pr_merged: TaskStatus;
  pr_closed: TaskStatus;
  pr_approved: TaskStatus;
  commit_pushed: TaskStatus;
}

interface CommitTypeMapping {
  feat: TaskType;
  fix: TaskType;
  chore: TaskType;
  refactor: TaskType;
  test: TaskType;
  docs: TaskType;
  perf: TaskType;
  ci: TaskType;
}

interface GitWorkflowConfigData {
  preset: PresetType;
  statusMappings: StatusMapping;
  conventionalCommits: {
    enabled: boolean;
    typeMappings: CommitTypeMapping;
  };
  branchPattern: {
    regex: string;
    enforced: boolean;
  };
  sprintAutomation: {
    autoComplete: boolean;
  };
}

// ── Defaults ──

const AGILE_DEFAULTS: GitWorkflowConfigData = {
  preset: "agile",
  statusMappings: {
    branch_created: "in_progress",
    pr_opened: "in_review",
    pr_merged: "done",
    pr_closed: "no_change",
    pr_approved: "no_change",
    commit_pushed: "no_change",
  },
  conventionalCommits: {
    enabled: true,
    typeMappings: {
      feat: "feature",
      fix: "bug",
      chore: "chore",
      refactor: "refactor",
      test: "test",
      docs: "docs",
      perf: "performance",
      ci: "ci",
    },
  },
  branchPattern: {
    regex: "(feature|fix|hotfix)/[A-Z]+-\\d+.*",
    enforced: false,
  },
  sprintAutomation: {
    autoComplete: false,
  },
};

const KANBAN_DEFAULTS: GitWorkflowConfigData = {
  preset: "kanban",
  statusMappings: {
    branch_created: "in_progress",
    pr_opened: "in_review",
    pr_merged: "done",
    pr_closed: "todo",
    pr_approved: "in_review",
    commit_pushed: "in_progress",
  },
  conventionalCommits: {
    enabled: false,
    typeMappings: {
      feat: "feature",
      fix: "bug",
      chore: "chore",
      refactor: "improvement",
      test: "test",
      docs: "docs",
      perf: "performance",
      ci: "ci",
    },
  },
  branchPattern: {
    regex: "",
    enforced: false,
  },
  sprintAutomation: {
    autoComplete: false,
  },
};

const CUSTOM_DEFAULTS: GitWorkflowConfigData = {
  preset: "custom",
  statusMappings: {
    branch_created: "no_change",
    pr_opened: "no_change",
    pr_merged: "no_change",
    pr_closed: "no_change",
    pr_approved: "no_change",
    commit_pushed: "no_change",
  },
  conventionalCommits: {
    enabled: false,
    typeMappings: {
      feat: "feature",
      fix: "bug",
      chore: "chore",
      refactor: "refactor",
      test: "test",
      docs: "docs",
      perf: "performance",
      ci: "ci",
    },
  },
  branchPattern: {
    regex: "",
    enforced: false,
  },
  sprintAutomation: {
    autoComplete: false,
  },
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "no_change", label: "No change" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "feature", label: "Feature" },
  { value: "bug", label: "Bug" },
  { value: "chore", label: "Chore" },
  { value: "improvement", label: "Improvement" },
  { value: "refactor", label: "Refactor" },
  { value: "test", label: "Test" },
  { value: "docs", label: "Docs" },
  { value: "performance", label: "Performance" },
  { value: "ci", label: "CI" },
];

const GIT_EVENTS: { key: keyof StatusMapping; label: string; description: string }[] = [
  { key: "branch_created", label: "Branch Created", description: "When a new branch is pushed matching a task key" },
  { key: "pr_opened", label: "PR Opened", description: "When a pull request is opened referencing a task" },
  { key: "pr_merged", label: "PR Merged", description: "When a pull request is merged" },
  { key: "pr_closed", label: "PR Closed", description: "When a pull request is closed without merging" },
  { key: "pr_approved", label: "PR Approved", description: "When a pull request receives an approval review" },
  { key: "commit_pushed", label: "Commit Pushed", description: "When a commit referencing a task is pushed" },
];

const COMMIT_TYPES: { key: keyof CommitTypeMapping; label: string; example: string }[] = [
  { key: "feat", label: "feat:", example: "feat(auth): add SSO login" },
  { key: "fix", label: "fix:", example: "fix(api): resolve timeout issue" },
  { key: "chore", label: "chore:", example: "chore: update dependencies" },
  { key: "refactor", label: "refactor:", example: "refactor(db): normalize schema" },
  { key: "test", label: "test:", example: "test: add integration tests" },
  { key: "docs", label: "docs:", example: "docs: update API reference" },
  { key: "perf", label: "perf:", example: "perf(query): optimize N+1" },
  { key: "ci", label: "ci:", example: "ci: add staging pipeline" },
];

const EXAMPLE_BRANCHES = [
  { name: "feature/PROJ-123-add-auth", good: true },
  { name: "fix/PROJ-456-timeout-bug", good: true },
  { name: "hotfix/PROJ-789-critical", good: true },
  { name: "my-branch", good: false },
  { name: "wip-stuff", good: false },
];

// ── Stagger animation variants ──

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Component ──

interface GitWorkflowConfigProps {
  projectId: Id<"projects">;
}

export default function GitWorkflowConfig({ projectId }: GitWorkflowConfigProps) {
  const [config, setConfig] = useState<GitWorkflowConfigData>(AGILE_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NOTE: Backend queries/mutations will be wired once the other agent creates them.
  // For now, use local state. The hooks below are commented out to avoid import errors.
  //
  // const loadedConfig = useQuery(api.gitWorkflow.queries.getGitWorkflowConfig, { projectId });
  // const upsertConfig = useMutation(api.gitWorkflow.mutations.upsertGitWorkflowConfig);
  // const resetPreset = useMutation(api.gitWorkflow.mutations.resetToPreset);
  //
  // useEffect(() => {
  //   if (loadedConfig) setConfig(loadedConfig);
  // }, [loadedConfig]);

  const showSavedIndicator = useCallback(() => {
    setShowSaved(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
  }, []);

  const handleSave = useCallback(
    async (updated: GitWorkflowConfigData) => {
      setSaving(true);
      try {
        // When backend is ready:
        // await upsertConfig({ projectId, config: updated });
        void projectId; // suppress unused warning
        await new Promise((resolve) => setTimeout(resolve, 300));
        showSavedIndicator();
      } catch {
        toast.error("Failed to save configuration");
      } finally {
        setSaving(false);
      }
    },
    [projectId, showSavedIndicator],
  );

  const updateConfig = useCallback(
    (updater: (prev: GitWorkflowConfigData) => GitWorkflowConfigData) => {
      setConfig((prev) => {
        const next = { ...updater(prev), preset: "custom" as PresetType };
        handleSave(next);
        return next;
      });
    },
    [handleSave],
  );

  const handlePresetSelect = useCallback(
    (preset: PresetType) => {
      let defaults: GitWorkflowConfigData;
      switch (preset) {
        case "agile":
          defaults = AGILE_DEFAULTS;
          break;
        case "kanban":
          defaults = KANBAN_DEFAULTS;
          break;
        default:
          defaults = CUSTOM_DEFAULTS;
      }
      setConfig(defaults);
      handleSave(defaults);
      // When backend is ready:
      // resetPreset({ projectId, preset });
    },
    [handleSave],
  );

  const updateStatusMapping = useCallback(
    (event: keyof StatusMapping, status: TaskStatus) => {
      updateConfig((prev) => ({
        ...prev,
        statusMappings: { ...prev.statusMappings, [event]: status },
      }));
    },
    [updateConfig],
  );

  const updateCommitTypeMapping = useCallback(
    (commitType: keyof CommitTypeMapping, taskType: TaskType) => {
      updateConfig((prev) => ({
        ...prev,
        conventionalCommits: {
          ...prev.conventionalCommits,
          typeMappings: { ...prev.conventionalCommits.typeMappings, [commitType]: taskType },
        },
      }));
    },
    [updateConfig],
  );

  const testBranchPattern = useCallback(
    (branchName: string): boolean => {
      if (!config.branchPattern.regex) return true;
      try {
        const regex = new RegExp(config.branchPattern.regex);
        return regex.test(branchName);
      } catch {
        return false;
      }
    },
    [config.branchPattern.regex],
  );

  return (
    <m.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Save indicator */}
      {(saving || showSaved) && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={clsx(
              "px-4 py-2 border-2 font-mono text-xs uppercase tracking-wider",
              saving
                ? "bg-[#111111] border-[#2E2E35] text-[#9CA3AF]"
                : "bg-[#111111] border-[#22C55E] text-[#22C55E]",
            )}
          >
            {saving ? "Saving..." : "Saved"}
          </div>
        </div>
      )}

      {/* Section 1: Preset Selector */}
      <m.div variants={itemVariants}>
        <PresetSelector
          activePreset={config.preset}
          onSelect={handlePresetSelect}
        />
      </m.div>

      {/* Section 2: Status Mappings */}
      <m.div variants={itemVariants}>
        <StatusMappingsSection
          mappings={config.statusMappings}
          onUpdate={updateStatusMapping}
        />
      </m.div>

      {/* Section 3: Conventional Commits */}
      <m.div variants={itemVariants}>
        <ConventionalCommitsSection
          enabled={config.conventionalCommits.enabled}
          typeMappings={config.conventionalCommits.typeMappings}
          onToggle={(enabled) =>
            updateConfig((prev) => ({
              ...prev,
              conventionalCommits: { ...prev.conventionalCommits, enabled },
            }))
          }
          onUpdateMapping={updateCommitTypeMapping}
        />
      </m.div>

      {/* Section 4: Branch Pattern */}
      <m.div variants={itemVariants}>
        <BranchPatternSection
          regex={config.branchPattern.regex}
          enforced={config.branchPattern.enforced}
          onRegexChange={(regex) =>
            updateConfig((prev) => ({
              ...prev,
              branchPattern: { ...prev.branchPattern, regex },
            }))
          }
          onEnforcedChange={(enforced) =>
            updateConfig((prev) => ({
              ...prev,
              branchPattern: { ...prev.branchPattern, enforced },
            }))
          }
          testBranch={testBranchPattern}
        />
      </m.div>

      {/* Section 5: Sprint Automation */}
      <m.div variants={itemVariants}>
        <SprintAutomationSection
          autoComplete={config.sprintAutomation.autoComplete}
          onToggle={(autoComplete) =>
            updateConfig((prev) => ({
              ...prev,
              sprintAutomation: { autoComplete },
            }))
          }
        />
      </m.div>
    </m.div>
  );
}

// ── Section Components ──

interface PresetSelectorProps {
  activePreset: PresetType;
  onSelect: (preset: PresetType) => void;
}

function PresetSelector({ activePreset, onSelect }: PresetSelectorProps) {
  const presets: { id: PresetType; label: string; description: string; recommended?: boolean }[] = [
    {
      id: "agile",
      label: "Agile",
      description: "Branch moves to in_progress, PRs trigger review, merge completes tasks.",
      recommended: true,
    },
    {
      id: "kanban",
      label: "Kanban",
      description: "Continuous flow with commit-based progress tracking and PR status sync.",
    },
    {
      id: "custom",
      label: "Custom",
      description: "Define your own mappings. Full control over every git event and status transition.",
    },
  ];

  return (
    <BrutalCard padding="lg">
      <SectionLabel>Workflow Preset</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className={clsx(
              "relative p-4 border-2 text-left transition-all duration-200",
              "bg-[#0A0A0A] hover:bg-[#111111]",
              activePreset === preset.id
                ? "border-[#6366F1]"
                : "border-[#2E2E35] hover:border-[#6B7280]",
            )}
          >
            {preset.recommended && (
              <span className="absolute top-2 right-2 font-mono text-[10px] uppercase tracking-widest text-[#6366F1] border border-[#6366F1]/30 px-2 py-0.5">
                Recommended
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              <div
                className={clsx(
                  "w-2 h-2 rounded-full",
                  activePreset === preset.id ? "bg-[#6366F1]" : "bg-[#2E2E35]",
                )}
              />
              <span className="font-mono text-sm font-bold uppercase tracking-wider text-[#F9FAFB]">
                {preset.label}
              </span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed font-mono">
              {preset.description}
            </p>
          </button>
        ))}
      </div>
    </BrutalCard>
  );
}

interface StatusMappingsSectionProps {
  mappings: StatusMapping;
  onUpdate: (event: keyof StatusMapping, status: TaskStatus) => void;
}

function StatusMappingsSection({ mappings, onUpdate }: StatusMappingsSectionProps) {
  return (
    <BrutalCard padding="lg">
      <SectionLabel>Git Event &rarr; Task Status Mappings</SectionLabel>
      <div className="mt-4 space-y-2">
        {GIT_EVENTS.map((event) => (
          <div
            key={event.key}
            className="flex items-center gap-4 p-3 border border-[#1F1F23] bg-[#0A0A0A]"
          >
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm font-semibold text-[#F9FAFB] uppercase tracking-wider">
                {event.label}
              </div>
              <div className="font-mono text-[10px] text-[#6B7280] mt-0.5">
                {event.description}
              </div>
            </div>
            <span className="font-mono text-sm text-[#6B7280] shrink-0 hidden sm:block">
              &rarr;
            </span>
            <div className="w-44 shrink-0">
              <BrutalSelect
                value={mappings[event.key]}
                onChange={(v) => onUpdate(event.key, v as TaskStatus)}
                options={STATUS_OPTIONS}
                fullWidth
                compact
              />
            </div>
          </div>
        ))}
      </div>
    </BrutalCard>
  );
}

interface ConventionalCommitsSectionProps {
  enabled: boolean;
  typeMappings: CommitTypeMapping;
  onToggle: (enabled: boolean) => void;
  onUpdateMapping: (commitType: keyof CommitTypeMapping, taskType: TaskType) => void;
}

function ConventionalCommitsSection({
  enabled,
  typeMappings,
  onToggle,
  onUpdateMapping,
}: ConventionalCommitsSectionProps) {
  return (
    <BrutalCard padding="lg">
      <SectionLabel>Conventional Commits</SectionLabel>
      <div className="mt-4 space-y-4">
        <BrutalToggle
          label="Enable conventional commit parsing"
          checked={enabled}
          onChange={onToggle}
        />

        {enabled && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <p className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider mb-3">
              Commit Type &rarr; Task Category Mappings
            </p>
            {COMMIT_TYPES.map((ct) => (
              <div
                key={ct.key}
                className="flex items-center gap-4 p-3 border border-[#1F1F23] bg-[#0A0A0A]"
              >
                <div className="flex-1 min-w-0">
                  <code className="font-mono text-sm font-semibold text-[#22C55E]">
                    {ct.label}
                  </code>
                  <div className="font-mono text-[10px] text-[#6B7280] mt-0.5 truncate">
                    {ct.example}
                  </div>
                </div>
                <span className="font-mono text-sm text-[#6B7280] shrink-0 hidden sm:block">
                  &rarr;
                </span>
                <div className="w-40 shrink-0">
                  <BrutalSelect
                    value={typeMappings[ct.key]}
                    onChange={(v) => onUpdateMapping(ct.key, v as TaskType)}
                    options={TASK_TYPE_OPTIONS}
                    fullWidth
                    compact
                  />
                </div>
              </div>
            ))}
          </m.div>
        )}
      </div>
    </BrutalCard>
  );
}

interface BranchPatternSectionProps {
  regex: string;
  enforced: boolean;
  onRegexChange: (regex: string) => void;
  onEnforcedChange: (enforced: boolean) => void;
  testBranch: (name: string) => boolean;
}

function BranchPatternSection({
  regex,
  enforced,
  onRegexChange,
  onEnforcedChange,
  testBranch,
}: BranchPatternSectionProps) {
  const [localRegex, setLocalRegex] = useState(regex);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalRegex(regex);
  }, [regex]);

  const handleChange = (value: string) => {
    setLocalRegex(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onRegexChange(value);
    }, 600);
  };

  return (
    <BrutalCard padding="lg">
      <SectionLabel>Branch Naming Pattern</SectionLabel>
      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="branch-pattern-input"
            className="block font-mono text-xs uppercase tracking-wider text-[#6B7280] mb-2"
          >
            Regex Pattern
          </label>
          <input
            id="branch-pattern-input"
            type="text"
            value={localRegex}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="(feature|fix|hotfix)/[A-Z]+-\d+.*"
            className="w-full px-4 py-2.5 bg-[#111111] border-2 border-[#2E2E35] text-[#F9FAFB] font-mono text-sm rounded-lg focus:border-[#6366F1] focus:outline-none transition-colors placeholder:text-[#6B7280]"
          />
          <p className="font-mono text-[10px] text-[#6B7280] mt-2">
            Enforced via CLI pre-push hook. Example: (feature|fix|hotfix)/[A-Z]+-\d+.*
          </p>
        </div>

        <BrutalToggle
          label="Enforce pattern on push"
          checked={enforced}
          onChange={onEnforcedChange}
        />

        {/* Branch preview */}
        {localRegex && (
          <div className="border border-[#1F1F23] bg-[#0A0A0A] p-4">
            <p className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider mb-3">
              Pattern Preview
            </p>
            <div className="space-y-1.5">
              {EXAMPLE_BRANCHES.map((branch) => {
                const matches = testBranch(branch.name);
                return (
                  <div
                    key={branch.name}
                    className="flex items-center gap-3 font-mono text-xs"
                  >
                    <div
                      className={clsx(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        matches ? "bg-[#22C55E]" : "bg-[#EF4444]",
                      )}
                    />
                    <code
                      className={clsx(
                        matches ? "text-[#9CA3AF]" : "text-[#6B7280]/60 line-through",
                      )}
                    >
                      {branch.name}
                    </code>
                    <span
                      className={clsx(
                        "text-[10px] uppercase tracking-wider ml-auto",
                        matches ? "text-[#22C55E]" : "text-[#EF4444]",
                      )}
                    >
                      {matches ? "match" : "no match"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BrutalCard>
  );
}

interface SprintAutomationSectionProps {
  autoComplete: boolean;
  onToggle: (autoComplete: boolean) => void;
}

function SprintAutomationSection({ autoComplete, onToggle }: SprintAutomationSectionProps) {
  return (
    <BrutalCard padding="lg">
      <SectionLabel>Sprint Automation</SectionLabel>
      <div className="mt-4 space-y-3">
        <BrutalToggle
          label="Auto-complete sprint when all tasks have merged PRs"
          checked={autoComplete}
          onChange={onToggle}
        />
        <p className="font-mono text-[10px] text-[#6B7280] leading-relaxed max-w-2xl">
          When enabled, a sprint will automatically transition to "completed" once every task
          assigned to it has at least one merged pull request. This respects the status mappings
          configured above -- only tasks whose PR-merged status is "done" count toward completion.
        </p>
      </div>
    </BrutalCard>
  );
}

// ── Shared label component ──

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
      {children}
    </span>
  );
}
