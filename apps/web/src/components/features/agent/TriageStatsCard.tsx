import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { Link } from 'react-router-dom'
import { HiOutlineInbox } from 'react-icons/hi'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'

interface TriageStatsCardProps {
  workspaceId: Id<'workspaces'>
}

export default function TriageStatsCard({ workspaceId }: TriageStatsCardProps) {
  const stats = useQuery(api.agent.queries.getTriageStats, { workspaceId })

  return (
    <BrutalCard variant="default" padding="sm">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--theme-border)]/50">
        <HiOutlineInbox className="w-4 h-4 text-[#F59E0B]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)]">
          Triage Stats
        </h3>
      </div>

      {stats === undefined ? (
        <div className="flex items-center justify-center py-6">
          <span className="animate-spin w-4 h-4 border-2 border-[#F59E0B] border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span
                  className="text-xl font-bold tracking-tight text-[#F59E0B]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {stats.pendingCount}
                </span>
                {stats.pendingCount > 0 && (
                  <span className="w-2 h-2 bg-[#F59E0B] animate-pulse rounded-full" />
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--theme-foreground)]/40">
                Pending
              </span>
            </div>
            <div className="text-center">
              <span
                className="text-xl font-bold tracking-tight text-[var(--theme-foreground)] block mb-1"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {stats.acceptanceRate}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--theme-foreground)]/40">
                Accepted
              </span>
            </div>
            <div className="text-center">
              <span
                className="text-xl font-bold tracking-tight text-[var(--theme-success)] block mb-1"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {stats.autoAppliedCount}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--theme-foreground)]/40">
                Auto-Applied
              </span>
            </div>
          </div>

          <Link to="/triage">
            <BrutalButton
              variant="secondary"
              size="sm"
              fullWidth
              className="border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]"
            >
              View Triage Queue <HiOutlineInbox className="w-3.5 h-3.5 ml-1" />
            </BrutalButton>
          </Link>
        </>
      )}
    </BrutalCard>
  )
}
