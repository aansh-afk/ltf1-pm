import { useState } from 'react'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlinePlus, HiOutlineFolder, HiOutlineGlobeAlt, HiOutlineTerminal, HiOutlineChip } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import WorkspaceSelector from '@/components/common/WorkspaceSelector'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import ProjectCard from '@/components/features/project/ProjectCard'
import { useCurrentWorkspace } from '@/hooks/useCurrentWorkspace'
import BrutalButton from '@/components/ui/BrutalButton'
import { m } from 'framer-motion'

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
        <div className="max-w-sm w-full border-2 border-[var(--theme-border)] bg-[var(--theme-background-tertiary)] p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineGlobeAlt className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 tracking-wider text-[var(--theme-foreground)]">Select Workspace</h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-4">
            Choose a workspace to view its projects.
          </p>
          <div className="bg-[var(--theme-background-secondary)] p-3 border border-[var(--theme-border)]">
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
        <div className="max-w-sm w-full border-2 border-dashed border-[var(--theme-error)]/30 bg-[var(--theme-background-tertiary)] p-5 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-error)]/30 text-[var(--theme-error)]">
            <HiOutlineTerminal className="w-5 h-5" />
          </div>
          <h1 className="text-sm font-bold uppercase mb-1 tracking-wider text-[var(--theme-error)]">No Active Workspaces</h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
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
    <ErrorBoundary>
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] inline-block mb-1.5">
            {!hasWorkspaceContext && currentWorkspace ? `${currentWorkspace.name} /` : ''} Projects
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--theme-foreground)] flex items-center gap-2">
            <HiOutlineChip className="w-5 h-5 text-[var(--theme-success)]" />
            Active Deployments
          </h1>
          <p className="text-xs text-[var(--theme-foreground-tertiary)] mt-1 font-mono">
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
        <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineFolder className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--theme-foreground)] mb-1">No Projects Found</h3>
          <p className="text-xs text-[var(--theme-foreground-tertiary)] mb-4 max-w-sm mx-auto">
            No projects in this workspace. Initialize a new project to begin tracking.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[var(--theme-success)] text-[var(--theme-background)] text-xs font-semibold font-mono uppercase tracking-wider border-2 border-[var(--theme-success)]"
          >
            Initialize Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project: any, index: number) => (
            <m.div
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
            </m.div>
          ))}

          {/* Add New Card Placeholder */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: projects.length * 0.06, duration: 0.5 }}
            onClick={() => setShowCreateModal(true)}
            className="group cursor-pointer"
          >
            <div className="h-full min-h-[140px] border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 hover:bg-[var(--theme-background-secondary)] hover:border-[var(--theme-success)] transition-all flex flex-col items-center justify-center p-4 gap-3">
              <div className="w-10 h-10 border-2 border-[var(--theme-border)] group-hover:border-[var(--theme-success)] flex items-center justify-center transition-colors">
                <HiOutlinePlus className="w-5 h-5 text-[var(--theme-foreground-tertiary)] group-hover:text-[var(--theme-success)] transition-colors" />
              </div>
              <span className="font-mono text-xs font-semibold text-[var(--theme-foreground-tertiary)] group-hover:text-[var(--theme-success)] uppercase tracking-wider transition-colors">
                Deploy New Project
              </span>
            </div>
          </m.div>
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        workspaceId={currentWorkspaceId}
      />
    </div>
    </ErrorBoundary>
  )
}
