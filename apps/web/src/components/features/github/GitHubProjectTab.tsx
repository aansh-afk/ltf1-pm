import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import {
  FaGithub,
  FaArrowRight,
  FaCodeBranch,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { HiOutlineExternalLink, HiOutlineTerminal } from "react-icons/hi";
import { m, AnimatePresence } from "framer-motion";
import BrutalButton from "@/components/ui/BrutalButton";
import { toast } from "react-hot-toast";
import ConnectRepositoryModal from "./ConnectRepositoryModal";
import { useGitHubCommandCenter } from "./useGitHubCommandCenter";
import GitHubFilterBar from "./GitHubFilterBar";
import GitHubFeedItem from "./GitHubFeedItem";
import GitHubQuickStats from "./GitHubQuickStats";

interface GitHubProjectTabProps {
  project: any;
  workspaceId: Id<"workspaces">;
}

export function GitHubProjectTab({
  project,
  workspaceId,
}: GitHubProjectTabProps) {
  const [showConnectRepoModal, setShowConnectRepoModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Get full repository details
  const repoDetails = useQuery(
    api.integrations.github.queries.getProjectRepository,
    project?._id ? { projectId: project._id } : "skip",
  );

  const rawRepo = repoDetails || project?.repository;
  const repository = rawRepo
    ? {
        ...rawRepo,
        url:
          rawRepo.url ||
          (rawRepo.owner && rawRepo.name
            ? `https://github.com/${rawRepo.owner}/${rawRepo.name}`
            : null),
      }
    : null;

  // Get workspace GitHub installations
  const installations = useQuery(
    api.integrations.github.queries.getWorkspaceInstallations,
    { workspaceId },
  );

  const hasGitHubInstallation = installations && installations.length > 0;

  // Command center hook
  const cc = useGitHubCommandCenter({
    projectId: project?._id,
    hasRepository: !!project?.repository,
  });

  // Compute open PRs count for stats
  const openPRsCount = cc.filteredItems.filter(
    (i) => i.type === "pr" && i.state === "open",
  ).length;

  // --- No repo connected state ---
  if (!project?.repository) {
    return (
      <div className="space-y-[12px]">
        <div className="p-0 overflow-hidden border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30 hover:bg-[var(--theme-background-secondary)]/50 transition-colors group">
          <div className="p-[24px] flex flex-col items-center justify-center text-center">
            <div className="w-80px h-80px rounded-none bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex items-center justify-center mb-[12px] group-hover:scale-105">
              <FaGithub className="w-40px h-40px text-[var(--theme-foreground)]" />
            </div>

            <h3 className="text-[16px] font-bold mb-12px tracking-tight">
              Connect to GitHub
            </h3>
            <p className="text-brutal-md text-[var(--theme-foreground)]/60 mb-40px max-w-lg leading-relaxed">
              Supercharge your workflow by linking a repository. Automatically
              sync commits, track pull requests, and link code to tasks.
            </p>

            {!hasGitHubInstallation ? (
              <div className="flex flex-col items-center gap-[8px]">
                <p className="font-mono text-brutal-xs text-[var(--theme-warning)] bg-[var(--theme-warning)]/10 px-[10px] py-8px rounded-none border-2 border-[var(--theme-warning)]">
                  No GitHub App installed in this workspace
                </p>
                <BrutalButton
                  onClick={() => {
                    const appSlug =
                      import.meta.env.VITE_GITHUB_APP_SLUG || "ltf1-github";
                    const rawSlug = appSlug.replace(
                      "https://github.com/apps/",
                      "",
                    );
                    window.open(
                      `https://github.com/apps/${rawSlug}/installations/new`,
                      "github-install",
                    );
                  }}
                  className="h-[24px] px-[16px] text-brutal-sm font-bold tracking-wide"
                >
                  INSTALL GITHUB APP
                  <FaArrowRight className="ml-8px w-12px h-12px" />
                </BrutalButton>
              </div>
            ) : (
              <BrutalButton
                onClick={() => setShowConnectRepoModal(true)}
                className="h-[24px] px-[16px] bg-[var(--theme-background-tertiary)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)] text-brutal-sm font-bold tracking-wide [box-shadow:4px_4px_0px_var(--theme-shadow)] hover:[box-shadow:2px_2px_0px_var(--theme-shadow)]"
              >
                <FaGithub className="mr-8px w-16px h-16px" />
                CONNECT REPOSITORY
              </BrutalButton>
            )}
          </div>
        </div>

        <ConnectRepositoryModal
          projectId={project._id}
          workspaceId={workspaceId}
          isOpen={showConnectRepoModal}
          onClose={() => setShowConnectRepoModal(false)}
        />
      </div>
    );
  }

  // --- Connected state: Command Center ---
  return (
    <div className="space-y-[12px]">
      {/* Compact repo header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[6px] min-w-0">
          <FaGithub className="text-[var(--theme-foreground)] shrink-0" />
          <div className="flex items-center gap-[2px] text-brutal-sm font-bold truncate">
            <button
              type="button"
              className="text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] transition-colors cursor-pointer"
              onClick={() =>
                window.open(`https://github.com/${repository.owner}`, "_blank")
              }
            >
              {repository.owner}
            </button>
            <span className="text-[var(--theme-foreground)]/40">/</span>
            <button
              type="button"
              className="text-[var(--theme-foreground)] hover:underline cursor-pointer"
              onClick={() => window.open(repository.url, "_blank")}
            >
              {repository.name}
            </button>
          </div>
          <span className="px-[6px] py-[1px] text-[10px] font-bold bg-[var(--theme-success)]/10 text-[var(--theme-success)] border-2 border-[var(--theme-success)] rounded-none uppercase shrink-0">
            Connected
          </span>
          {/* About toggle */}
          {repository.description && (
            <button
              onClick={() => setShowAbout((prev) => !prev)}
              className="text-[var(--theme-foreground)]/30 hover:text-[var(--theme-foreground)]/60 transition-colors shrink-0"
              title="Toggle about"
            >
              {showAbout ? (
                <FaChevronDown className="w-[10px] h-[10px]" />
              ) : (
                <FaChevronRight className="w-[10px] h-[10px]" />
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-[6px] shrink-0">
          <BrutalButton
            onClick={() => {
              navigator.clipboard.writeText(`git clone ${repository.url}.git`);
              toast.success("Clone URL copied");
            }}
            className="h-[16px] px-[10px] text-brutal-xs bg-[var(--theme-background)] border border-[var(--theme-border)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
          >
            <HiOutlineTerminal className="mr-[4px] w-[12px] h-[12px]" />
            CLONE
          </BrutalButton>
          <BrutalButton
            onClick={() => window.open(repository.url, "_blank")}
            className="h-[16px] px-[10px] text-brutal-xs bg-[var(--theme-background)] border border-[var(--theme-border)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
          >
            <HiOutlineExternalLink className="mr-[4px] w-[12px] h-[12px]" />
            VIEW ON GITHUB
          </BrutalButton>
        </div>
      </div>

      {/* Collapsible About section */}
      <AnimatePresence>
        {showAbout && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-[12px] py-[10px] bg-[var(--theme-background-secondary)]/30 border border-[var(--theme-border)]">
              <p className="text-brutal-sm text-[var(--theme-foreground)]/70 leading-relaxed mb-[8px]">
                {repository.description}
              </p>
              <div className="flex flex-wrap items-center gap-[8px]">
                {repository.topics &&
                  repository.topics.length > 0 &&
                  repository.topics.map((topic: string) => (
                    <span
                      key={topic}
                      className="px-[8px] py-[2px] rounded-none bg-[var(--theme-primary)]/10 border-2 border-[var(--theme-primary)] text-[var(--theme-primary)] text-[10px] font-bold"
                    >
                      {topic}
                    </span>
                  ))}
                {repository.updatedAt && (
                  <span className="font-mono text-[10px] text-[var(--theme-foreground)]/40">
                    Last synced:{" "}
                    {new Date(repository.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Filter bar — the command center control surface */}
      <GitHubFilterBar
        searchQuery={cc.searchQuery}
        onSearchChange={cc.setSearchQuery}
        searchInputRef={cc.searchInputRef}
        activeType={cc.activeType}
        onTypeChange={cc.setActiveType}
        counts={cc.counts}
        stateFilter={cc.stateFilter}
        onStateChange={cc.setStateFilter}
        branchFilter={cc.branchFilter}
        onBranchChange={cc.setBranchFilter}
        authorFilter={cc.authorFilter}
        onAuthorChange={cc.setAuthorFilter}
        labelFilter={cc.labelFilter}
        onLabelChange={cc.setLabelFilter}
        availableBranches={cc.availableBranches}
        availableAuthors={cc.availableAuthors}
        availableLabels={cc.availableLabels}
        activeFilterChips={cc.activeFilterChips}
        onClearAll={cc.clearAllFilters}
      />

      {/* Unified feed */}
      {cc.isLoading ? (
        <div className="space-y-[6px]">
          {[1, 2, 3].map((n) => (
            <div
              key={`skeleton-${n}`}
              className="h-[48px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] animate-pulse"
            />
          ))}
        </div>
      ) : cc.filteredItems.length === 0 ? (
        <div className="text-center py-[48px] flex flex-col items-center justify-center border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30">
          <FaCodeBranch className="w-[20px] h-[20px] text-[var(--theme-foreground)]/20 mb-[8px]" />
          <p className="text-brutal-sm font-bold text-[var(--theme-foreground)]/60">
            {cc.activeFilterChips.length > 0 || cc.searchQuery
              ? "No items match your filters"
              : "No activity yet"}
          </p>
          <p className="text-brutal-xs text-[var(--theme-foreground)]/40 mt-[4px] max-w-[300px]">
            {cc.activeFilterChips.length > 0 || cc.searchQuery
              ? "Try adjusting your search or filters."
              : "Commits, pull requests, and issues will appear here once activity begins."}
          </p>
          {(cc.activeFilterChips.length > 0 || cc.searchQuery) && (
            <button
              onClick={cc.clearAllFilters}
              className="mt-[12px] font-mono text-brutal-xs text-[var(--theme-primary)] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[calc(100vh-380px)] space-y-[4px]">
          {cc.filteredItems.map((item, idx) => (
            <GitHubFeedItem
              key={item.id}
              item={item}
              isFocused={cc.focusedIndex === idx}
              isExpanded={cc.expandedId === item.id}
              onToggleExpand={() =>
                cc.setExpandedId(cc.expandedId === item.id ? null : item.id)
              }
              onFocus={() => cc.setFocusedIndex(idx)}
            />
          ))}
        </div>
      )}

      {/* Quick stats bar */}
      <GitHubQuickStats
        stargazersCount={repository.stargazersCount}
        language={repository.language}
        openIssuesCount={repository.openIssuesCount}
        defaultBranch={repository.defaultBranch}
        commitsCount={cc.counts.commit}
        openPRsCount={openPRsCount}
      />

      <ConnectRepositoryModal
        projectId={project._id}
        workspaceId={workspaceId}
        isOpen={showConnectRepoModal}
        onClose={() => setShowConnectRepoModal(false)}
      />
    </div>
  );
}
