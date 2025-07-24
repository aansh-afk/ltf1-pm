import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlinePlus, HiOutlineFolder } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import ProjectCard from '@/components/features/project/ProjectCard'
import { useCurrentWorkspace } from '../hooks/useCurrentWorkspace'

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { currentWorkspaceId, isLoading: workspaceLoading } = useCurrentWorkspace()
  
  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects, 
    currentWorkspaceId ? { workspaceId: currentWorkspaceId as any } : 'skip'
  )

  if (workspaceLoading) {
    return <LoadingSpinner size="lg" />
  }

  if (!currentWorkspaceId) {
    return (
      <div className="p-6">
        <EmptyState
          title="No workspace selected"
          description="Please select a workspace to view projects"
        />
      </div>
    )
  }

  if (projects === undefined) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-base-content/70">
            Organize your work into projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <HiOutlinePlus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<HiOutlineFolder className="w-16 h-16" />}
          title="No projects yet"
          description="Create your first project to start organizing tasks and tracking progress."
          action={{
            label: 'Create Project',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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