import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import WorkflowBuilder from '@/components/features/automation/WorkflowBuilder'
import BrutalistLoader from '@/components/common/BrutalistLoader'

export default function AutomationPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId?: string }>()

  // Get current workspace from context or URL
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  const currentWorkspace = workspaces?.[0]

  if (!currentWorkspace) {
    return <BrutalistLoader />
  }

  return (
    <ErrorBoundary>
    <div className="p-[16px]">
      <div className="mb-[12px]">
        <h1 className="text-brutal-3xl font-bold mb-8px">WORKFLOW AUTOMATION</h1>
        <p className="text-[var(--theme-muted)]">
          Automate your workflows with triggers, conditions, and actions
        </p>
      </div>

      <WorkflowBuilder
        workspaceId={currentWorkspace._id}
        projectId={projectId as Id<"projects"> | undefined}
      />
    </div>
    </ErrorBoundary>
  )
}
