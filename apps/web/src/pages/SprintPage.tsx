import { useState } from "react";
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { m } from "framer-motion";
import {
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineViewBoards,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import WorkspaceSelector from "@/components/common/WorkspaceSelector";
import CreateSprintModal from "@/components/features/sprint/CreateSprintModal";
import SprintBoard from "@/components/features/sprint/SprintBoard";
import SprintPlanning from "@/components/features/sprint/SprintPlanning";
import BurndownChart from "@/components/features/sprint/BurndownChart";
import AIInsightsPanel from "@/components/features/project/AIInsightsPanel";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";
import BrutalSelect from "@/components/ui/BrutalSelect";
import clsx from "clsx";

// --- Sub-components ---

interface CurrentSprintInfoCardProps {
  sprint: {
    name: string;
    goal?: string;
    daysRemaining: number;
    progress: number;
    completedPoints: number;
    totalPoints: number;
    taskStats: {
      todo: number;
      inProgress: number;
      inReview: number;
      done: number;
    };
  };
}

function CurrentSprintInfoCard({ sprint }: CurrentSprintInfoCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.06 }}
      className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-4 mb-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HiOutlinePlay className="w-4 h-4 text-[var(--theme-primary)]" />
            <h2 className="text-sm font-bold text-[var(--theme-foreground)]">
              {sprint.name}
            </h2>
            <span className="px-2 py-0.5 bg-[var(--theme-success)]/10 text-[var(--theme-success)] font-mono text-[10px] uppercase tracking-wider border border-[var(--theme-success)]/30">
              ACTIVE
            </span>
          </div>
          {sprint.goal && (
            <p className="text-xs text-[var(--theme-foreground-tertiary)] mb-2">
              {sprint.goal}
            </p>
          )}
          <div className="flex gap-5">
            <div className="flex items-center gap-1.5">
              <HiOutlineCalendar className="w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)]" />
              <span className="font-mono text-xs text-[var(--theme-foreground-secondary)]">
                {sprint.daysRemaining} days left
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <HiOutlineChartBar className="w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)]" />
              <span className="font-mono text-xs text-[var(--theme-foreground-secondary)]">
                {sprint.progress}% complete
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <HiOutlineClock className="w-3.5 h-3.5 text-[var(--theme-foreground-tertiary)]" />
              <span className="font-mono text-xs text-[var(--theme-foreground-secondary)]">
                {sprint.completedPoints}/{sprint.totalPoints} points
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-[var(--theme-foreground-tertiary)] uppercase tracking-wider block mb-1.5">
            Task Progress
          </span>
          <div className="flex gap-1">
            <div
              className="w-8 h-6 bg-[var(--theme-foreground-tertiary)]/10 flex items-center justify-center border border-[var(--theme-border)]"
              title="Todo"
            >
              <span className="font-mono text-[10px] text-[var(--theme-foreground-secondary)]">
                {sprint.taskStats.todo}
              </span>
            </div>
            <div
              className="w-8 h-6 bg-[var(--theme-info)]/10 flex items-center justify-center border border-[var(--theme-info)]/30"
              title="In Progress"
            >
              <span className="font-mono text-[10px] text-[var(--theme-info)]">
                {sprint.taskStats.inProgress}
              </span>
            </div>
            <div
              className="w-8 h-6 bg-[var(--theme-glow-secondary)]/10 flex items-center justify-center border border-[var(--theme-glow-secondary)]/30"
              title="In Review"
            >
              <span className="font-mono text-[10px] text-[var(--theme-glow-secondary)]">
                {sprint.taskStats.inReview}
              </span>
            </div>
            <div
              className="w-8 h-6 bg-[var(--theme-success)]/10 flex items-center justify-center border border-[var(--theme-success)]/30"
              title="Done"
            >
              <span className="font-mono text-[10px] text-[var(--theme-success)]">
                {sprint.taskStats.done}
              </span>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}

// --- Main component ---

export default function SprintPage() {
  const {
    currentWorkspaceId,
    isLoading: workspaceLoading,
    hasWorkspaceContext,
    workspaces,
  } = useCurrentWorkspace();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "planning">("board");

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    currentWorkspaceId ? { workspaceId: currentWorkspaceId as Id<"workspaces"> } : "skip",
  );

  const sprints = useQuery(
    api.sprints.queries.getProjectSprints,
    selectedProjectId ? { projectId: selectedProjectId as Id<"projects"> } : "skip",
  );

  const currentSprint = useQuery(
    api.sprints.queries.getCurrentSprint,
    selectedProjectId ? { projectId: selectedProjectId as Id<"projects"> } : "skip",
  );

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-5">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] block mb-2">
              WORKSPACE
            </span>
            <h1 className="text-base font-bold text-[var(--theme-foreground)] mb-2">
              Select Workspace
            </h1>
            <p className="text-xs text-[var(--theme-foreground-tertiary)] mb-3">
              Choose a workspace to view and manage sprints.
            </p>
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-4">
        <EmptyState
          title="No Workspaces Found"
          description="Create a workspace first to organize your sprints."
        />
      </div>
    );
  }

  if (projects === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] block mb-1">
              SPRINT MANAGEMENT
            </span>
            <h1 className="text-xl font-bold text-[var(--theme-foreground)]">
              Sprints
            </h1>
          </div>
          <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
              <HiOutlineViewBoards className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--theme-foreground)] mb-1">
              No Projects Yet
            </h3>
            <p className="text-xs text-[var(--theme-foreground-tertiary)] max-w-sm mx-auto">
              Create a project first to start sprint planning.
            </p>
          </div>
        </m.div>
      </div>
    );
  }

  if (!selectedProjectId && projects.length > 0) {
    setSelectedProjectId(projects[0]._id);
  }

  const currentWorkspace = workspaces?.find(
    (w) => w?._id === currentWorkspaceId,
  );

  return (
    <ErrorBoundary>
    <div className="p-4">
      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] block mb-1">
            SPRINT MANAGEMENT
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--theme-foreground)]">
              Sprints
            </h1>
            {!hasWorkspaceContext && currentWorkspace && (
              <span className="text-xs font-mono text-[var(--theme-foreground-tertiary)]">
                in {currentWorkspace.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasWorkspaceContext && (
            <WorkspaceSelector size="sm" showLabel={false} />
          )}
          <BrutalSelect
            value={selectedProjectId}
            onChange={(v) => setSelectedProjectId(v)}
            options={projects.map((project) => ({
              value: project._id,
              label: `${project.name} (${project.key})`,
            }))}
            compact
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[var(--theme-primary)] text-white text-xs font-semibold uppercase tracking-wider border-2 border-[var(--theme-primary-active)] flex items-center gap-1.5 hover:bg-[var(--theme-primary-active)]"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Sprint
          </button>
        </div>
      </m.div>

      {/* Current Sprint Info */}
      {currentSprint && <CurrentSprintInfoCard sprint={currentSprint} />}

      {/* Burndown Chart + Sprint Health */}
      {currentSprint && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <BurndownChart
            sprintId={currentSprint._id}
            sprintName={currentSprint.name}
          />
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.09 }}
            className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)]"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
              <HiOutlineLightningBolt className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                SPRINT HEALTH
              </span>
            </div>
            <div className="p-4">
              <AIInsightsPanel
                projectId={selectedProjectId as Id<"projects">}
                sprintId={currentSprint._id}
                compact={false}
              />
            </div>
          </m.div>
        </div>
      )}

      {/* View Toggle */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12 }}
        className="flex items-center gap-0 border-b-2 border-[var(--theme-border)] mb-4"
      >
        <button
          className={clsx(
            "px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 -mb-[2px] flex items-center gap-1.5",
            viewMode === "board"
              ? "text-[var(--theme-foreground)] border-[var(--theme-primary)]"
              : "text-[var(--theme-foreground-tertiary)] border-transparent hover:text-[var(--theme-foreground-secondary)]",
          )}
          onClick={() => setViewMode("board")}
        >
          <HiOutlineViewBoards className="w-4 h-4" />
          Sprint Board
        </button>
        <button
          className={clsx(
            "px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 -mb-[2px] flex items-center gap-1.5",
            viewMode === "planning"
              ? "text-[var(--theme-foreground)] border-[var(--theme-primary)]"
              : "text-[var(--theme-foreground-tertiary)] border-transparent hover:text-[var(--theme-foreground-secondary)]",
          )}
          onClick={() => setViewMode("planning")}
        >
          <HiOutlineCalendar className="w-4 h-4" />
          Planning
        </button>
      </m.div>

      {/* Content */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
      >
        {sprints === undefined ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : viewMode === "board" && currentSprint ? (
          <SprintBoard sprint={currentSprint} projectId={selectedProjectId} />
        ) : viewMode === "planning" ? (
          <SprintPlanning
            projectId={selectedProjectId}
            sprints={sprints}
            currentSprint={currentSprint}
          />
        ) : (
          <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
              <HiOutlinePlay className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--theme-foreground)] mb-1">
              No Active Sprint
            </h3>
            <p className="text-xs text-[var(--theme-foreground-tertiary)] mb-4 max-w-sm mx-auto">
              Create and start a sprint to see the sprint board.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[var(--theme-primary)] text-white text-xs font-semibold border-2 border-[var(--theme-primary-active)] uppercase tracking-wider hover:bg-[var(--theme-primary-active)]"
            >
              Create Sprint
            </button>
          </div>
        )}
      </m.div>

      {/* Create Sprint Modal */}
      <CreateSprintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={selectedProjectId}
      />
    </div>
    </ErrorBoundary>
  );
}
