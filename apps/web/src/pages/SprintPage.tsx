import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { motion } from 'framer-motion'
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

  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-[#111111] border-2 border-[#2E2E35] p-5">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6B7280] block mb-2">
              WORKSPACE
            </span>
            <h1 className="text-base font-bold text-[#F9FAFB] mb-2">Select Workspace</h1>
            <p className="text-xs text-[#6B7280] mb-3">
              Choose a workspace to view and manage sprints.
            </p>
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    )
  }

  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-4">
        <EmptyState
          title="No Workspaces Found"
          description="Create a workspace first to organize your sprints."
        />
      </div>
    )
  }

  if (projects === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6B7280] block mb-1">
              SPRINT MANAGEMENT
            </span>
            <h1 className="text-xl font-bold text-[#F9FAFB]">Sprints</h1>
          </div>
          <div className="border-2 border-[#2E2E35] border-dashed p-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
              <HiOutlineViewBoards className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">No Projects Yet</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Create a project first to start sprint planning.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!selectedProjectId && projects.length > 0) {
    setSelectedProjectId(projects[0]._id)
  }

  const selectedProject = projects.find(p => p._id === selectedProjectId)
  const currentWorkspace = workspaces?.find(w => w._id === currentWorkspaceId)

  return (
    <div className="p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6B7280] block mb-1">
            SPRINT MANAGEMENT
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#F9FAFB]">Sprints</h1>
            {!hasWorkspaceContext && currentWorkspace && (
              <span className="text-xs font-mono text-[#6B7280]">
                in {currentWorkspace.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasWorkspaceContext && (
            <WorkspaceSelector size="sm" showLabel={false} />
          )}
          <select
            className="px-3 py-2 bg-[#111111] border-2 border-[#2E2E35] font-mono text-xs text-[#9CA3AF] uppercase focus:border-[#6366F1] focus:outline-none"
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
            className="px-4 py-2 bg-[#6366F1] text-white text-xs font-semibold uppercase tracking-wider border-2 border-[#4F46E5] flex items-center gap-1.5 hover:bg-[#4F46E5]"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Sprint
          </button>
        </div>
      </motion.div>

      {/* Current Sprint Info */}
      {currentSprint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="bg-[#111111] border-2 border-[#2E2E35] p-4 mb-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HiOutlinePlay className="w-4 h-4 text-[#6366F1]" />
                <h2 className="text-sm font-bold text-[#F9FAFB]">
                  {currentSprint.name}
                </h2>
                <span className="px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] font-mono text-[10px] uppercase tracking-wider border border-[#22C55E]/30">
                  ACTIVE
                </span>
              </div>
              {currentSprint.goal && (
                <p className="text-xs text-[#6B7280] mb-2">{currentSprint.goal}</p>
              )}
              <div className="flex gap-5">
                <div className="flex items-center gap-1.5">
                  <HiOutlineCalendar className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span className="font-mono text-xs text-[#9CA3AF]">
                    {currentSprint.daysRemaining} days left
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiOutlineChartBar className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span className="font-mono text-xs text-[#9CA3AF]">
                    {currentSprint.progress}% complete
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiOutlineClock className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span className="font-mono text-xs text-[#9CA3AF]">
                    {currentSprint.completedPoints}/{currentSprint.totalPoints} points
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider block mb-1.5">
                Task Progress
              </span>
              <div className="flex gap-1">
                <div className="w-8 h-6 bg-[#6B7280]/10 flex items-center justify-center border border-[#2E2E35]" title="Todo">
                  <span className="font-mono text-[10px] text-[#9CA3AF]">
                    {currentSprint.taskStats.todo}
                  </span>
                </div>
                <div className="w-8 h-6 bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/30" title="In Progress">
                  <span className="font-mono text-[10px] text-[#3B82F6]">
                    {currentSprint.taskStats.inProgress}
                  </span>
                </div>
                <div className="w-8 h-6 bg-[#8B5CF6]/10 flex items-center justify-center border border-[#8B5CF6]/30" title="In Review">
                  <span className="font-mono text-[10px] text-[#8B5CF6]">
                    {currentSprint.taskStats.inReview}
                  </span>
                </div>
                <div className="w-8 h-6 bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/30" title="Done">
                  <span className="font-mono text-[10px] text-[#22C55E]">
                    {currentSprint.taskStats.done}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12 }}
        className="flex items-center gap-0 border-b-2 border-[#2E2E35] mb-4"
      >
        <button
          className={clsx(
            "px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 -mb-[2px] flex items-center gap-1.5",
            viewMode === 'board'
              ? 'text-[#F9FAFB] border-[#6366F1]'
              : 'text-[#6B7280] border-transparent hover:text-[#9CA3AF]'
          )}
          onClick={() => setViewMode('board')}
        >
          <HiOutlineViewBoards className="w-4 h-4" />
          Sprint Board
        </button>
        <button
          className={clsx(
            "px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 -mb-[2px] flex items-center gap-1.5",
            viewMode === 'planning'
              ? 'text-[#F9FAFB] border-[#6366F1]'
              : 'text-[#6B7280] border-transparent hover:text-[#9CA3AF]'
          )}
          onClick={() => setViewMode('planning')}
        >
          <HiOutlineCalendar className="w-4 h-4" />
          Planning
        </button>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.18 }}
      >
        {sprints === undefined ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : viewMode === 'board' && currentSprint ? (
          <SprintBoard sprint={currentSprint} projectId={selectedProjectId} />
        ) : viewMode === 'planning' ? (
          <SprintPlanning
            projectId={selectedProjectId}
            sprints={sprints}
            currentSprint={currentSprint}
          />
        ) : (
          <div className="border-2 border-[#2E2E35] border-dashed p-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
              <HiOutlinePlay className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">No Active Sprint</h3>
            <p className="text-xs text-[#6B7280] mb-4 max-w-sm mx-auto">
              Create and start a sprint to see the sprint board.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#6366F1] text-white text-xs font-semibold border-2 border-[#4F46E5] uppercase tracking-wider hover:bg-[#4F46E5]"
            >
              Create Sprint
            </button>
          </div>
        )}
      </motion.div>

      {/* Create Sprint Modal */}
      <CreateSprintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={selectedProjectId}
      />
    </div>
  )
}
