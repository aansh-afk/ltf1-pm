import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import WorkspaceSelector from "@/components/common/WorkspaceSelector";
import BrutalButton from "@/components/ui/BrutalButton";
import SkillCard from "@/components/features/skills/SkillCard";
import CreateSkillModal from "@/components/features/skills/CreateSkillModal";
import EditSkillModal from "@/components/features/skills/EditSkillModal";
import {
  HiOutlineLightningBolt,
  HiOutlineSearch,
  HiOutlineInformationCircle,
} from "react-icons/hi";

export default function SkillsPage() {
  const {
    currentWorkspaceId,
    isLoading: workspaceLoading,
    workspaces,
  } = useCurrentWorkspace();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<Id<"skills"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const workspaceSkills = useQuery(
    api.skills.queries.getWorkspaceSkills,
    currentWorkspaceId
      ? { workspaceId: currentWorkspaceId as Id<"workspaces"> }
      : "skip",
  );

  const builtInSkills = useQuery(api.skills.queries.getBuiltInSkills);
  const publishedSkills = useQuery(api.skills.queries.getPublishedSkills, { limit: 20 });

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-primary)]">
            <HiOutlineLightningBolt className="w-5 h-5 text-[var(--theme-primary)]" />
          </div>
          <h1 className="text-lg font-bold uppercase mb-2 tracking-tight text-[var(--theme-foreground)]">
            Select Workspace
          </h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-4">
            Select a workspace to view skills.
          </p>
          <div className="bg-[var(--theme-background-secondary)] p-3 border border-[var(--theme-border)]">
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkspaceId) {
    return (
      <div className="p-4 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="border-2 border-dashed border-[var(--theme-error)]/40 p-8 text-center max-w-md w-full">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineLightningBolt className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 text-[var(--theme-foreground)]">
            No Workspaces
          </h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
            Create a workspace to manage skills.
          </p>
        </div>
      </div>
    );
  }

  // Filter workspace skills by search, then sort by usage DESC (most-used first).
  // Ties broken by display name alpha so ordering stays stable across renders.
  const filteredWorkspaceSkills = workspaceSkills
    ?.filter(
      (s) =>
        !searchQuery ||
        s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .slice()
    .sort((a, b) => {
      const diff = (b.usageCount ?? 0) - (a.usageCount ?? 0);
      if (diff !== 0) return diff;
      return a.displayName.localeCompare(b.displayName);
    });

  // The "MOST USED" badge goes on the top skill if anyone has actually used it.
  const mostUsedSkillId =
    filteredWorkspaceSkills && (filteredWorkspaceSkills[0]?.usageCount ?? 0) > 0
      ? filteredWorkspaceSkills[0]._id
      : null;

  // Filter built-in templates not yet installed
  const installedNames = new Set(workspaceSkills?.map((s) => s.name) ?? []);
  const uninstalledBuiltIns = builtInSkills?.filter(
    (s) => !installedNames.has(s.name),
  );

  // Filter library skills by search
  const filteredPublished = publishedSkills?.filter(
    (s) =>
      !searchQuery ||
      s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-[var(--theme-background)] overflow-hidden">
        {/* Header */}
        <div className="flex-none border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <HiOutlineLightningBolt className="w-4 h-4 text-[var(--theme-primary)]" />
              <span className="font-mono text-xs font-bold uppercase text-[var(--theme-foreground)]">
                SKILLS
              </span>
            </div>
            <BrutalButton
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              CREATE SKILL
            </BrutalButton>
          </div>

          {/* Search bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)]" />
              <input
                type="text"
                placeholder="SEARCH SKILLS..."
                aria-label="Search skills"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--theme-background)] border border-[var(--theme-border)]
                  font-mono text-[10px] uppercase text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground-tertiary)]
                  focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
          {/* Inline how-to-use hint — sits above the skill sections so new
              users immediately see the three ways to run a skill. */}
          <div className="flex items-start gap-2 p-3 border-2 border-[var(--theme-info)]/30 bg-[var(--theme-info)]/5">
            <HiOutlineInformationCircle className="w-4 h-4 text-[var(--theme-info)] shrink-0 mt-0.5" />
            <div className="font-mono text-[10px] text-[var(--theme-foreground-secondary)] space-y-1">
              <div>
                <kbd className="inline-flex items-center justify-center h-4 px-1 text-[9px] font-mono bg-[var(--theme-background)] border border-[var(--theme-border)] mr-1">
                  ⌘K
                </kbd>
                in any task — type a skill name, hit enter to run it.
              </div>
              <div>
                <kbd className="inline-flex items-center justify-center h-4 px-1 text-[9px] font-mono bg-[var(--theme-background)] border border-[var(--theme-border)] mr-1">
                  S
                </kbd>
                on an open task opens the skill dropdown.
              </div>
              <div>
                <span className="text-[var(--theme-foreground-tertiary)]">Auto-trigger</span> skills run by themselves when new tasks match their keywords.
              </div>
            </div>
          </div>

          {/* YOUR SKILLS section */}
          <section>
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--theme-primary)]" />
              YOUR SKILLS
              {filteredWorkspaceSkills && (
                <span className="text-[var(--theme-foreground-tertiary)] font-normal">
                  ({filteredWorkspaceSkills.length})
                </span>
              )}
            </h2>

            {workspaceSkills === undefined ? (
              <LoadingSpinner size="sm" />
            ) : filteredWorkspaceSkills && filteredWorkspaceSkills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredWorkspaceSkills.map((skill) => (
                  <SkillCard
                    key={skill._id}
                    skill={skill}
                    variant="workspace"
                    workspaceId={currentWorkspaceId}
                    onEdit={setEditingSkillId}
                    isMostUsed={skill._id === mostUsedSkillId}
                  />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-[var(--theme-border)] p-6 text-center">
                <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
                  <HiOutlineLightningBolt className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-[var(--theme-foreground)] mb-0.5">
                  {searchQuery ? "No Matching Skills" : "No Skills Yet"}
                </p>
                <p className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
                  {searchQuery
                    ? "Adjust your search to find skills."
                    : "Create a custom skill or install one from the library."}
                </p>
              </div>
            )}
          </section>

          {/* SKILL LIBRARY section */}
          <section>
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#8B5CF6]" />
              SKILL LIBRARY
            </h2>

            {/* Built-in templates not yet installed */}
            {uninstalledBuiltIns && uninstalledBuiltIns.length > 0 && (
              <div className="mb-4">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-2">
                  BUILT-IN TEMPLATES
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uninstalledBuiltIns.map((skill) => (
                    <SkillCard
                      key={skill.name}
                      skill={{ ...skill, isBuiltIn: true }}
                      variant="library"
                      workspaceId={currentWorkspaceId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Published community skills */}
            {publishedSkills === undefined ? (
              <LoadingSpinner size="sm" />
            ) : filteredPublished && filteredPublished.length > 0 ? (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-2">
                  COMMUNITY SKILLS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPublished.map((skill) => (
                    <SkillCard
                      key={skill._id}
                      skill={skill}
                      variant="library"
                      workspaceId={currentWorkspaceId}
                    />
                  ))}
                </div>
              </div>
            ) : (
              !uninstalledBuiltIns?.length && (
                <div className="border-2 border-dashed border-[var(--theme-border)] p-6 text-center">
                  <p className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
                    {searchQuery
                      ? "No matching library skills found."
                      : "No community skills available yet."}
                  </p>
                </div>
              )
            )}
          </section>
        </div>

        {/* Create Skill Modal */}
        <CreateSkillModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          workspaceId={currentWorkspaceId}
        />

        {/* Edit Skill Modal */}
        <EditSkillModal
          skillId={editingSkillId}
          isOpen={!!editingSkillId}
          onClose={() => setEditingSkillId(null)}
        />
      </div>
    </ErrorBoundary>
  );
}
