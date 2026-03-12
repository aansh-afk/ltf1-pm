import { useParams } from 'react-router-dom'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import SlackIntegration from '@/components/features/slack/SlackIntegration'
import BrutalistLoader from '@/components/common/BrutalistLoader'
import { HiOutlineTerminal } from 'react-icons/hi'

export default function SlackPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  // Get current workspace
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  const currentWorkspace = workspaces?.[0]

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--theme-background)]">
        <BrutalistLoader />
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="p-4 min-h-screen bg-[var(--theme-background)]">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <HiOutlineTerminal className="w-6 h-6 md:w-7 md:h-7 text-[var(--theme-primary)]" />
          SLACK INTEGRATION
        </h1>
        <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-wide">
          Communication Hub • {currentWorkspace.name}
        </p>
      </div>

      <SlackIntegration workspaceId={currentWorkspace._id} />
    </div>
    </ErrorBoundary>
  )
}
