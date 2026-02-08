import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlinePlus, HiOutlineFolder, HiOutlineGlobeAlt, HiOutlineTerminal, HiOutlineChip } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import WorkspaceSelector from '@/components/common/WorkspaceSelector'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import ProjectCard from '@/components/features/project/ProjectCard'
import { useCurrentWorkspace } from '../hooks/useCurrentWorkspace'
import BrutalButton from '@/components/ui/BrutalButton'
import { motion } from 'framer-motion'

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { currentWorkspaceId, isLoading: workspaceLoading, hasWorkspaceContext, workspaces } = useCurrentWorkspace()

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    currentWorkspaceId ? { workspaceId: currentWorkspaceId as any } : 'skip'
  )

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show workspace selector for pages without URL workspace context
  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-4 min-h-screen flex items-center justify-center">
        <div className="max-w-sm w-full border-2 border-[#2E2E35] bg-[#111111] p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
            <HiOutlineGlobeAlt className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 tracking-wider text-[#F9FAFB]">Select Workspace</h1>
          <p className="font-mono text-xs text-[#6B7280] mb-4">
            Choose a workspace to view its projects.
          </p>
          <div className="bg-[#0A0A0A] p-3 border border-[#1F1F23]">
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no workspaces exist
  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-4 min-h-screen flex items-center justify-center">
        <div className="max-w-sm w-full border-2 border-dashed border-[#EF4444]/30 bg-[#111111] p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#EF4444]/30 text-[#EF4444]">
            <HiOutlineTerminal className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 tracking-wider text-[#EF4444]">No Active Workspaces</h1>
          <p className="font-mono text-xs text-[#6B7280]">
            No workspaces found. Create a new workspace to get started.
          </p>
        </div>
      </div>
    )
  }

  if (projects === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentWorkspace = workspaces?.find(w => w._id === currentWorkspaceId)

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] inline-block mb-1.5">
            {!hasWorkspaceContext && currentWorkspace ? `${currentWorkspace.name} /` : ''} Projects
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[#F9FAFB] flex items-center gap-2">
            <HiOutlineChip className="w-5 h-5 text-[#22C55E]" />
            Active Deployments
          </h1>
          <p className="text-xs text-[#6B7280] mt-1 font-mono">
            {projects.length} project{projects.length !== 1 ? 's' : ''} deployed in workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!hasWorkspaceContext && (
            <div className="hidden md:block">
              <WorkspaceSelector size="sm" showLabel={false} />
            </div>
          )}
          <BrutalButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            New Project
          </BrutalButton>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="border-2 border-[#2E2E35] border-dashed p-8 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
            <HiOutlineFolder className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">No Projects Found</h3>
          <p className="text-xs text-[#6B7280] mb-4 max-w-sm mx-auto">
            No projects in this workspace. Initialize a new project to begin tracking.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#22C55E] text-[#050505] text-xs font-semibold font-mono uppercase tracking-wider border-2 border-[#16A34A]"
          >
            Initialize Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project: any, index: number) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.5 }}
            >
              <ProjectCard
                project={project}
                workspaceId={currentWorkspaceId}
                index={index}
              />
            </motion.div>
          ))}

          {/* Add New Card Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: projects.length * 0.06, duration: 0.5 }}
            onClick={() => setShowCreateModal(true)}
            className="group cursor-pointer"
          >
            <div className="h-full min-h-[140px] border-2 border-dashed border-[#2E2E35] bg-[#0A0A0A]/50 hover:bg-[#0A0A0A] hover:border-[#22C55E] transition-all flex flex-col items-center justify-center p-4 gap-3">
              <div className="w-10 h-10 border-2 border-[#2E2E35] group-hover:border-[#22C55E] flex items-center justify-center transition-colors">
                <HiOutlinePlus className="w-5 h-5 text-[#6B7280] group-hover:text-[#22C55E] transition-colors" />
              </div>
              <span className="font-mono text-xs font-semibold text-[#6B7280] group-hover:text-[#22C55E] uppercase tracking-wider transition-colors">
                Deploy New Project
              </span>
            </div>
          </motion.div>
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        workspaceId={currentWorkspaceId}
      />
    </div>
  )
}
