import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlinePlus, HiOutlineFolder } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import WorkspaceSelector from '@/components/common/WorkspaceSelector'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import ProjectCard from '@/components/features/project/ProjectCard'
import { useCurrentWorkspace } from '../hooks/useCurrentWorkspace'

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { currentWorkspaceId, isLoading: workspaceLoading, hasWorkspaceContext, workspaces } = useCurrentWorkspace()
  
  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects, 
    currentWorkspaceId ? { workspaceId: currentWorkspaceId as any } : 'skip'
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
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-32px">
            <h1 className="text-brutal-lg font-bold mb-16px">SELECT WORKSPACE</h1>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mb-24px">
              Choose a workspace to view and manage projects.
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
          description="Create a workspace first to organize your projects."
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

  const currentWorkspace = workspaces?.find(w => w._id === currentWorkspaceId)

  return (
    <div className="p-24px">
      {/* Header with workspace info */}
      <div className="flex items-center justify-between mb-32px">
        <div>
          <div className="flex items-center gap-16px mb-8px">
            <h1 className="text-brutal-2xl font-bold">PROJECTS</h1>
            {!hasWorkspaceContext && (
              <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                IN: {currentWorkspace?.name}
              </div>
            )}
          </div>
          <p className="text-[var(--theme-foreground)]/60 text-brutal-sm">
            Organize your work into projects and track progress
          </p>
        </div>
        
        <div className="flex items-center gap-16px">
          {/* Show workspace selector for global routes */}
          {!hasWorkspaceContext && (
            <WorkspaceSelector size="sm" showLabel={false} />
          )}
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="brutal-btn flex items-center gap-8px"
          >
            <HiOutlinePlus className="w-16px h-16px" />
            NEW PROJECT
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-48px text-center">
          <HiOutlineFolder className="w-64px h-64px text-[var(--theme-foreground)]/40 mx-auto mb-24px" />
          <h3 className="text-brutal-lg font-bold mb-12px">NO PROJECTS YET</h3>
          <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mb-32px max-w-md mx-auto">
            Create your first project to start organizing tasks and tracking progress.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="brutal-btn flex items-center gap-8px mx-auto"
          >
            <HiOutlinePlus className="w-16px h-16px" />
            CREATE PROJECT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24px">
          {projects.map((project: any, index: number) => (
            <ProjectCard
              key={project._id}
              project={project}
              workspaceId={currentWorkspaceId}
              index={index}
            />
          ))}
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