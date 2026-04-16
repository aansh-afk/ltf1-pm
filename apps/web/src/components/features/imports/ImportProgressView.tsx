import { useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'

interface Props {
  importId: Id<'imports'>
  onDone: () => void
}

export function ImportProgressView({ importId, onDone }: Props) {
  const job = useQuery(api.integrations.imports.getImport, { importId })

  // Auto-dismiss 5 seconds after success so the user sees the completed state
  // but isn't stuck on it.
  useEffect(() => {
    if (job?.status === 'completed') {
      const t = setTimeout(onDone, 5000)
      return () => clearTimeout(t)
    }
  }, [job?.status, onDone])

  if (!job) {
    return (
      <BrutalCard padding="lg">
        <p className="font-mono text-sm text-[var(--theme-foreground)]/60">
          Loading import…
        </p>
      </BrutalCard>
    )
  }

  const running = job.status === 'running' || job.status === 'pending'
  const done = job.status === 'completed'
  const failed = job.status === 'failed'

  return (
    <BrutalCard padding="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm">
            <BrutalBadge
              variant={done ? 'success' : failed ? 'error' : 'info'}
            >
              {job.status.toUpperCase()}
            </BrutalBadge>
            <span className="uppercase text-[var(--theme-foreground)]/70">{job.source}</span>
            <span className="font-bold">{job.params.externalScopeName}</span>
          </div>
          {(done || failed) && (
            <BrutalButton variant="ghost" size="sm" onClick={onDone}>
              Close
            </BrutalButton>
          )}
        </div>

        <div className="font-mono text-xs text-[var(--theme-foreground)]/80">
          {job.progress.currentStep}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Tasks created" value={job.progress.tasksCreated} />
          <Stat label="Tasks updated" value={job.progress.tasksUpdated} />
          <Stat label="Sprints" value={job.progress.sprintsCreated} />
          <Stat label="Total" value={job.progress.total} />
        </div>

        {running && (
          <div className="h-2 w-full bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] overflow-hidden">
            <div className="h-full w-1/3 bg-[var(--theme-accent)] animate-pulse" />
          </div>
        )}

        {done && (
          <div className="flex items-center gap-2 font-mono text-sm text-[var(--theme-success)]">
            <HiOutlineCheckCircle />
            Import completed in{' '}
            {job.completedAt
              ? Math.round((job.completedAt - job.startedAt) / 1000)
              : 0}
            s
          </div>
        )}

        {failed && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-sm text-[var(--theme-error)]">
              <HiOutlineXCircle />
              Import failed
            </div>
            {job.error && (
              <pre className="font-mono text-xs bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-error)] p-3 whitespace-pre-wrap break-words">
                {job.error}
              </pre>
            )}
          </div>
        )}
      </div>
    </BrutalCard>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-[var(--theme-border)] p-3 bg-[var(--theme-background-secondary)]">
      <div className="font-mono text-[10px] uppercase text-[var(--theme-foreground)]/60 tracking-wide">
        {label}
      </div>
      <div className="font-mono text-lg font-bold">{value}</div>
    </div>
  )
}
