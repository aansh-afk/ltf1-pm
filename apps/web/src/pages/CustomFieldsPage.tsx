import { useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import CustomFieldsManager from '@/components/features/customfields/CustomFieldsManager'
import BrutalistLoader from '@/components/common/BrutalistLoader'

export default function CustomFieldsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  // Get current workspace
  const workspaces = useQuery(api.workspaces.listWorkspaces)
  const currentWorkspace = workspaces?.[0]

  if (!currentWorkspace) {
    return <BrutalistLoader />
  }

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      <CustomFieldsManager workspaceId={currentWorkspace._id} />
    </div>
  )
}
