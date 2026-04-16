import { useState } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { HiOutlineDownload, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'
import toast from 'react-hot-toast'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalInput from '@/components/ui/BrutalInput'
import BrutalBadge from '@/components/ui/BrutalBadge'
import { useCurrentWorkspace } from '@/hooks/useCurrentWorkspace'
import { LinearImportPanel } from '@/components/features/imports/LinearImportPanel'
import { JiraImportPanel } from '@/components/features/imports/JiraImportPanel'
import { ImportProgressView } from '@/components/features/imports/ImportProgressView'

type Tab = 'linear' | 'jira' | 'history'

export default function ImportPage() {
  const { currentWorkspaceId } = useCurrentWorkspace()
  const [tab, setTab] = useState<Tab>('linear')
  const [activeImportId, setActiveImportId] = useState<Id<'imports'> | null>(null)

  if (!currentWorkspaceId) {
    return (
      <div className="p-8 font-mono text-sm text-[var(--theme-foreground)]/60">
        Select a workspace to import into.
      </div>
    )
  }

  const workspaceId = currentWorkspaceId as Id<'workspaces'>

  return (
    <div className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-foreground)]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold font-mono uppercase tracking-wide flex items-center gap-3">
            <HiOutlineDownload className="text-[var(--theme-accent)]" />
            Import from Linear / Jira
          </h1>
          <p className="text-sm text-[var(--theme-foreground)]/60 font-mono">
            One-way import. Credentials are used once and never stored.
          </p>
        </header>

        <div className="flex gap-2 border-b-2 border-[var(--theme-border)]">
          <TabButton active={tab === 'linear'} onClick={() => setTab('linear')}>
            Linear
          </TabButton>
          <TabButton active={tab === 'jira'} onClick={() => setTab('jira')}>
            Jira
          </TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
            History
          </TabButton>
        </div>

        {activeImportId && (
          <ImportProgressView
            importId={activeImportId}
            onDone={() => setActiveImportId(null)}
          />
        )}

        {!activeImportId && tab === 'linear' && (
          <LinearImportPanel
            workspaceId={workspaceId}
            onImportStarted={setActiveImportId}
          />
        )}

        {!activeImportId && tab === 'jira' && (
          <JiraImportPanel
            workspaceId={workspaceId}
            onImportStarted={setActiveImportId}
          />
        )}

        {!activeImportId && tab === 'history' && (
          <ImportHistoryList workspaceId={workspaceId} />
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'px-4 py-2 font-mono text-sm uppercase tracking-wide border-2 border-b-0 transition-all ' +
        (active
          ? 'bg-[var(--theme-accent)] text-black border-[var(--theme-accent)]'
          : 'bg-transparent border-[var(--theme-border)] text-[var(--theme-foreground)]/70 hover:text-[var(--theme-foreground)]')
      }
    >
      {children}
    </button>
  )
}

function ImportHistoryList({ workspaceId }: { workspaceId: Id<'workspaces'> }) {
  const imports = useQuery(api.integrations.imports.listImports, { workspaceId })

  if (!imports) {
    return (
      <div className="font-mono text-sm text-[var(--theme-foreground)]/60">
        Loading history…
      </div>
    )
  }

  if (imports.length === 0) {
    return (
      <BrutalCard padding="lg">
        <p className="font-mono text-sm text-[var(--theme-foreground)]/60">
          No imports yet. Run your first one from the Linear or Jira tab.
        </p>
      </BrutalCard>
    )
  }

  return (
    <div className="space-y-3">
      {imports.map((imp) => (
        <BrutalCard key={imp._id} padding="md">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-sm">
                <BrutalBadge
                  variant={imp.status === 'completed' ? 'success' : imp.status === 'failed' ? 'error' : 'info'}
                >
                  {imp.status.toUpperCase()}
                </BrutalBadge>
                <span className="text-[var(--theme-foreground)]/60 uppercase">{imp.source}</span>
                <span className="font-bold">{imp.params.externalScopeName}</span>
              </div>
              <div className="font-mono text-xs text-[var(--theme-foreground)]/60 space-x-3">
                <span>{imp.progress.tasksCreated} created</span>
                <span>{imp.progress.tasksUpdated} updated</span>
                <span>{imp.progress.sprintsCreated} sprints</span>
              </div>
              {imp.error && (
                <div className="font-mono text-xs text-[var(--theme-error)]">
                  {imp.error}
                </div>
              )}
            </div>
            <div className="font-mono text-xs text-[var(--theme-foreground)]/50 shrink-0">
              {new Date(imp.startedAt).toLocaleString()}
            </div>
          </div>
        </BrutalCard>
      ))}
    </div>
  )
}
