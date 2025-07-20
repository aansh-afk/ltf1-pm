import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@ltf1/backend'
import { HiOutlinePlus, HiOutlineBriefcase } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import CreateWorkspaceModal from '@/components/features/workspace/CreateWorkspaceModal'
import WorkspaceCard from '@/components/features/workspace/WorkspaceCard'

export default function WorkspacesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)

  if (workspaces === undefined) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workspaces</h1>
          <p className="text-base-content/70">
            Manage your workspaces and collaborate with your team
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <HiOutlinePlus className="w-5 h-5 mr-2" />
          New Workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<HiOutlineBriefcase className="w-16 h-16" />}
          title="No workspaces yet"
          description="Create your first workspace to start managing projects and collaborating with your team."
          action={{
            label: 'Create Workspace',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace: any, index: number) => (
            <WorkspaceCard
              key={workspace._id}
              workspace={workspace}
              index={index}
            />
          ))}
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}