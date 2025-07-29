import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineViewBoards
} from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import WorkspaceSelector from '@/components/common/WorkspaceSelector'
import CreateSprintModal from '@/components/features/sprint/CreateSprintModal'
import SprintBoard from '@/components/features/sprint/SprintBoard'
import SprintPlanning from '@/components/features/sprint/SprintPlanning'
import { useCurrentWorkspace } from '../hooks/useCurrentWorkspace'
import clsx from 'clsx'

export default function SprintPage() {
  const { currentWorkspaceId, isLoading: workspaceLoading, hasWorkspaceContext, workspaces } = useCurrentWorkspace()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'board' | 'planning'>('board')

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    currentWorkspaceId ? { workspaceId: currentWorkspaceId as any } : 'skip'
  )

  const sprints = useQuery(
    api.sprints.queries.getProjectSprints,
    selectedProjectId ? { projectId: selectedProjectId as any } : 'skip'
  )

  const currentSprint = useQuery(
    api.sprints.queries.getCurrentSprint,
    selectedProjectId ? { projectId: selectedProjectId as any } : 'skip'
  )

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show workspace selector for pages without URL workspace context
  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-24px">
        <div className="max-w-md mx-auto">
          <div className="bg-carbon-plate border-2 border-basalt-border p-32px">
            <h1 className="text-brutal-lg font-bold mb-16px">SELECT WORKSPACE</h1>
            <p className="text-brutal-sm text-cathode-white/60 mb-24px">
              Choose a workspace to view and manage sprints.
            </p>
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no workspaces exist
  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-24px">
        <EmptyState
          title="NO WORKSPACES FOUND"
          description="Create a workspace first to organize your sprints."
        />
      </div>
    )
  }

  if (projects === undefined) {
    return <LoadingSpinner size="lg" />
  }

  if (projects.length === 0) {
    return (
      <div className="p-24px">
        <EmptyState
          title="No projects yet"
          description="Create a project first to start sprint planning"
        />
      </div>
    )
  }

  if (!selectedProjectId && projects.length > 0) {
    setSelectedProjectId(projects[0]._id)
  }

  const selectedProject = projects.find(p => p._id === selectedProjectId)
  const currentWorkspace = workspaces?.find(w => w._id === currentWorkspaceId)

  return (
    <div className="p-24px">
      {/* Header */}
      <div className="mb-32px">
        <div className="flex items-center justify-between mb-16px">
          <div>
            <div className="flex items-center gap-16px mb-8px">
              <h1 className="text-brutal-2xl font-bold uppercase">SPRINTS</h1>
              {!hasWorkspaceContext && (
                <div className="text-brutal-xs text-cathode-white/60">
                  IN: {currentWorkspace?.name}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-16px">
            {/* Show workspace selector for global routes */}
            {!hasWorkspaceContext && (
              <WorkspaceSelector size="sm" showLabel={false} />
            )}
            
            <select
              className="px-16px py-8px bg-carbon-plate border-2 border-basalt-border 
                       font-mono text-brutal-sm uppercase
                       focus:border-primary-brutalist focus:outline-none transition-colors"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((project: any) => (
                <option key={project._id} value={project._id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="brutal-btn flex items-center gap-8px"
            >
              <HiOutlinePlus className="w-16px h-16px" />
              NEW SPRINT
            </button>
          </div>
        </div>

        {/* Current Sprint Info */}
        {currentSprint && (
          <div className="bg-primary-brutalist border-2 border-basalt-border p-24px">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-8px mb-8px">
                  <HiOutlinePlay className="w-20px h-20px text-event-horizon" />
                  <h2 className="text-brutal-lg font-bold text-event-horizon">
                    {currentSprint.name}
                  </h2>
                  <span className="px-8px py-4px bg-event-horizon text-primary-brutalist font-mono text-brutal-xs uppercase">
                    ACTIVE
                  </span>
                </div>
                {currentSprint.goal && (
                  <p className="text-brutal-sm text-event-horizon/80 mb-16px">{currentSprint.goal}</p>
                )}
                <div className="flex gap-32px">
                  <div className="flex items-center gap-8px">
                    <HiOutlineCalendar className="w-16px h-16px text-event-horizon" />
                    <span className="font-mono text-brutal-sm text-event-horizon">
                      {currentSprint.daysRemaining} DAYS LEFT
                    </span>
                  </div>
                  <div className="flex items-center gap-8px">
                    <HiOutlineChartBar className="w-16px h-16px text-event-horizon" />
                    <span className="font-mono text-brutal-sm text-event-horizon">
                      {currentSprint.progress}% COMPLETE
                    </span>
                  </div>
                  <div className="flex items-center gap-8px">
                    <HiOutlineClock className="w-16px h-16px text-event-horizon" />
                    <span className="font-mono text-brutal-sm text-event-horizon">
                      {currentSprint.completedPoints}/{currentSprint.totalPoints} POINTS
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-brutal-xs text-event-horizon mb-8px">TASK PROGRESS</div>
                <div className="flex gap-4px">
                  <div className="w-40px h-32px bg-event-horizon flex items-center justify-center">
                    <span className="font-mono text-brutal-xs text-primary-brutalist">
                      {currentSprint.taskStats.done}
                    </span>
                  </div>
                  <div className="w-40px h-32px bg-[#00FF00] flex items-center justify-center">
                    <span className="font-mono text-brutal-xs text-event-horizon">
                      {currentSprint.taskStats.inReview}
                    </span>
                  </div>
                  <div className="w-40px h-32px bg-[#00FFFF] flex items-center justify-center">
                    <span className="font-mono text-brutal-xs text-event-horizon">
                      {currentSprint.taskStats.inProgress}
                    </span>
                  </div>
                  <div className="w-40px h-32px bg-[#FF00FF] flex items-center justify-center">
                    <span className="font-mono text-brutal-xs text-event-horizon">
                      {currentSprint.taskStats.todo}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-16px mb-24px">
        <div className="flex border-2 border-basalt-border">
          <button
            className={clsx(
              "px-16px py-8px flex items-center gap-8px",
              "font-mono text-brutal-sm uppercase transition-colors",
              "border-r-2 border-basalt-border",
              viewMode === 'board' 
                ? "bg-primary-brutalist text-event-horizon" 
                : "bg-carbon-plate hover:bg-event-horizon"
            )}
            onClick={() => setViewMode('board')}
          >
            <HiOutlineViewBoards className="w-16px h-16px" />
            SPRINT BOARD
          </button>
          <button
            className={clsx(
              "px-16px py-8px flex items-center gap-8px",
              "font-mono text-brutal-sm uppercase transition-colors",
              viewMode === 'planning' 
                ? "bg-primary-brutalist text-event-horizon" 
                : "bg-carbon-plate hover:bg-event-horizon"
            )}
            onClick={() => setViewMode('planning')}
          >
            <HiOutlineCalendar className="w-16px h-16px" />
            PLANNING
          </button>
        </div>
      </div>

      {/* Content */}
      {sprints === undefined ? (
        <LoadingSpinner size="lg" />
      ) : viewMode === 'board' && currentSprint ? (
        <SprintBoard sprint={currentSprint} projectId={selectedProjectId} />
      ) : viewMode === 'planning' ? (
        <SprintPlanning 
          projectId={selectedProjectId} 
          sprints={sprints} 
          currentSprint={currentSprint}
        />
      ) : (
        <EmptyState
          title="No active sprint"
          description="Create and start a sprint to see the sprint board"
          action={{
            label: "CREATE SPRINT",
            onClick: () => setShowCreateModal(true)
          }}
        />
      )}

      {/* Create Sprint Modal */}
      <CreateSprintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={selectedProjectId}
      />
    </div>
  )
}