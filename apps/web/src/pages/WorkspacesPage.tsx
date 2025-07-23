import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../lib/convex'
import { HiOutlinePlus, HiOutlineBriefcase } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import CreateWorkspaceModal from '@/components/features/workspace/CreateWorkspaceModal'
import WorkspaceCard from '@/components/features/workspace/WorkspaceCard'
import { BrutalButton } from '@/components/ui'

export default function WorkspacesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)

  if (workspaces === undefined) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="p-24px">
      <div className="flex items-center justify-between mb-32px">
        <div>
          <h1 className="text-4xl font-bold mb-8px uppercase">WORKSPACES</h1>
          <p className="text-brutal-sm text-cathode-white/70 uppercase">
            MANAGE YOUR WORKSPACES AND COLLABORATE WITH YOUR TEAM
          </p>
        </div>
        <BrutalButton
          onClick={() => setShowCreateModal(true)}
          variant="glitch"
        >
          <HiOutlinePlus className="w-24px h-24px mr-8px" />
          NEW WORKSPACE
        </BrutalButton>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24px">
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