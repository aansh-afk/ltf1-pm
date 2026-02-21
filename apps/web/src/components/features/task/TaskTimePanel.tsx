import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import TimeTracker from './TimeTracker'
import { HiOutlineClock, HiOutlineChartBar } from 'react-icons/hi'
import { format, formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface TaskTimePanelProps {
  taskId: Id<'tasks'>
}

export default function TaskTimePanel({ taskId }: TaskTimePanelProps) {
  const timeEntries = useQuery(
    api.tasks.queries.getTaskTimeEntries,
    { taskId }
  )

  const activeTimeEntry = useQuery(
    api.tasks.queries.getActiveTimeEntry,
    { taskId }
  )

  const isLoading = timeEntries === undefined

  // Compute totals from actual time entries
  const totalMs = timeEntries?.reduce(
    (sum, entry) => sum + (entry.duration || 0),
    0
  ) ?? 0

  const completedEntries = timeEntries?.filter(e => e.endTime != null) ?? []
  const totalSessions = completedEntries.length

  const formatDuration = (ms: number): string => {
    if (ms === 0) return '0m'
    const totalMinutes = Math.floor(ms / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatEntryDuration = (ms: number): string => {
    if (ms === 0) return '0m'
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="space-y-[12px]">
      {/* Active Timer */}
      <div>
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40 mb-[6px]">
          TIMER
        </h3>
        <TimeTracker
          taskId={taskId}
          isRunning={!!activeTimeEntry}
          currentDuration={totalMs}
        />
      </div>

      {/* Summary Stats */}
      <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background)] p-[12px]">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40 mb-[8px]">
          TIME SUMMARY
        </h3>
        <div className="grid grid-cols-2 gap-[8px]">
          <div className="flex items-center gap-[6px]">
            <HiOutlineClock className="w-[14px] h-[14px] text-primary-brutalist" />
            <div>
              <div className="text-[10px] font-mono text-[var(--theme-foreground)]/40 uppercase">
                TOTAL
              </div>
              <div className="text-[14px] font-mono font-bold text-[var(--theme-foreground)]">
                {formatDuration(totalMs)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[6px]">
            <HiOutlineChartBar className="w-[14px] h-[14px] text-primary-brutalist" />
            <div>
              <div className="text-[10px] font-mono text-[var(--theme-foreground)]/40 uppercase">
                SESSIONS
              </div>
              <div className="text-[14px] font-mono font-bold text-[var(--theme-foreground)]">
                {totalSessions}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background)] p-[12px]">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40 mb-[8px]">
          TIME LOG
        </h3>

        {isLoading ? (
          <div className="space-y-[6px]">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[40px] bg-[var(--theme-foreground)]/5 animate-pulse"
              />
            ))}
          </div>
        ) : completedEntries.length > 0 ? (
          <div className="space-y-[4px]">
            {completedEntries
              .sort((a, b) => b.startTime - a.startTime)
              .map((entry) => (
                <div
                  key={entry._id}
                  className={clsx(
                    'p-[8px] border border-[var(--theme-border)]',
                    'bg-[var(--theme-foreground)]/[0.02]',
                    'hover:bg-[var(--theme-foreground)]/[0.04] transition-colors'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[6px]">
                      <div className="w-[6px] h-[6px] bg-primary-brutalist" />
                      <div>
                        <div className="text-[12px] font-mono font-bold text-[var(--theme-foreground)]">
                          {formatEntryDuration(entry.duration || 0)}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--theme-foreground)]/40">
                          {format(new Date(entry.startTime), 'MMM dd, HH:mm')}
                          {entry.endTime && (
                            <span> - {format(new Date(entry.endTime), 'HH:mm')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--theme-foreground)]/30">
                      {formatDistanceToNow(new Date(entry.startTime), { addSuffix: true })}
                    </div>
                  </div>
                  {entry.description && (
                    <div className="mt-[4px] pl-[12px] text-[10px] font-mono text-[var(--theme-foreground)]/50">
                      {entry.description}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-[20px]">
            <HiOutlineClock className="w-[20px] h-[20px] text-[var(--theme-foreground)]/20 mx-auto mb-[6px]" />
            <p className="font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase">
              NO TIME ENTRIES YET
            </p>
            <p className="font-mono text-[10px] text-[var(--theme-foreground)]/25 mt-[2px]">
              START THE TIMER ABOVE TO LOG TIME
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
