import { useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import SlackIntegration from '@/components/features/slack/SlackIntegration'
import BrutalistLoader from '@/components/common/BrutalistLoader'

export default function SlackPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  // Get current workspace
  const workspaces = useQuery(api.workspaces.listWorkspaces)
  const currentWorkspace = workspaces?.[0]

  if (!currentWorkspace) {
    return <BrutalistLoader />
  }

  return (
    <div className="p-24px">
      <div className="mb-24px">
        <h1 className="text-brutal-3xl font-bold mb-8px">SLACK INTEGRATION</h1>
        <p className="text-[var(--theme-muted)]">
          Connect your workspace to Slack for seamless notifications and updates
        </p>
      </div>

      <SlackIntegration workspaceId={currentWorkspace._id} />
    </div>
  )
}
