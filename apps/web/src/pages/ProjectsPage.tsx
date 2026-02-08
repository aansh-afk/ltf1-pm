import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlinePlus, HiOutlineFolder, HiOutlineGlobeAlt, HiOutlineChip, HiOutlineTerminal } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import WorkspaceSelector from '@/components/common/WorkspaceSelector'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import ProjectCard from '@/components/features/project/ProjectCard'
import { useCurrentWorkspace } from '../hooks/useCurrentWorkspace'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalCard from '@/components/ui/BrutalCard'
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
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show workspace selector for pages without URL workspace context
  if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
    return (
      <div className="p-5 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <BrutalCard variant="glitch" className="max-w-md w-full p-5 text-center border-2 border-[var(--theme-primary)]">
          <HiOutlineGlobeAlt className="w-16 h-16 mx-auto mb-3 text-[var(--theme-primary)]" />
          <h1 className="text-xl font-bold uppercase mb-3 tracking-tight">Select Workspace</h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mb-4">
            Please select a workspace to view projects.
          </p>
          <div className="bg-[var(--theme-background-secondary)] p-4 border border-[var(--theme-border)]">
            <WorkspaceSelector size="lg" showLabel={false} />
          </div>
        </BrutalCard>
      </div>
    )
  }

  // Show empty state if no workspaces exist
  if (!currentWorkspaceId && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="p-5 min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <BrutalCard variant="glitch" className="max-w-md w-full p-5 text-center border-dashed border-[var(--theme-error)]">
          <HiOutlineTerminal className="w-16 h-16 mx-auto mb-3 text-[var(--theme-error)]" />
          <h1 className="text-xl font-bold uppercase mb-3 tracking-tight text-[var(--theme-error)]">No Active Workspaces</h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mb-4">
            No workspaces found. Create a new workspace to get started.
          </p>
        </BrutalCard>
      </div>
    )
  }

  if (projects === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentWorkspace = workspaces?.find(w => w._id === currentWorkspaceId)

  return (
    <div className="p-4 min-h-screen bg-[var(--theme-background)]">
      {/* Header with workspace info */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-4 border-b-2 border-[var(--theme-border)] pb-3 gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-4">
              <HiOutlineChip className="w-6 h-6 md:w-7 md:h-7 text-[var(--theme-primary)]" />
              PROJECTS
            </h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm text-[var(--theme-foreground)]/60 pl-2">
            {!hasWorkspaceContext && (
              <>
                <span className="uppercase">{currentWorkspace?.name}</span>
                <span className="text-[var(--theme-primary)]">/</span>
              </>
            )}
            <span className="uppercase tracking-wide">Overview</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Show workspace selector for global routes */}
          {!hasWorkspaceContext && (
            <div className="hidden md:block">
              <WorkspaceSelector size="sm" showLabel={false} />
            </div>
          )}

          <BrutalButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            NEW PROJECT
          </BrutalButton>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <BrutalCard variant="default" className="p-8 text-center border-dashed max-w-lg">
            <HiOutlineFolder className="w-24 h-24 text-[var(--theme-foreground)]/20 mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-3 uppercase">No Projects Found</h2>
            <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mb-4">
              There are no projects in this workspace. Create a new project to get started.
            </p>
            <BrutalButton
              onClick={() => setShowCreateModal(true)}
              variant="primary"
            >
              NEW PROJECT
            </BrutalButton>
          </BrutalCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project: any, index: number) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
            transition={{ delay: projects.length * 0.1 }}
            onClick={() => setShowCreateModal(true)}
            className="group cursor-pointer"
          >
            <div className="h-full min-h-[200px] border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 hover:bg-[var(--theme-background-secondary)] hover:border-[var(--theme-primary)] transition-all flex flex-col items-center justify-center p-4 gap-4">
              <div className="w-16 h-16 border-2 border-[var(--theme-border)] group-hover:border-[var(--theme-primary)] flex items-center justify-center transition-colors">
                <HiOutlinePlus className="w-6 h-6 text-[var(--theme-foreground)]/50 group-hover:text-[var(--theme-primary)] transition-colors" />
              </div>
              <span className="font-mono text-sm font-bold text-[var(--theme-foreground)]/50 group-hover:text-[var(--theme-primary)] transition-colors">
                CREATE NEW PROJECT
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