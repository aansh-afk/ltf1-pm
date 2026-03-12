import { useState, useMemo } from 'react'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useUser } from '@clerk/clerk-react'
import { m } from 'framer-motion'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCurrentWorkspace } from '@/hooks/useCurrentWorkspace'
import BrutalCard from '@/components/ui/BrutalCard'
import {
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineFolder,
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineDocumentReport,
  HiOutlineDownload,
} from 'react-icons/hi'

// ─── Date range helpers ────────────────────────────────────────────

type RangeKey = 'this_week' | 'this_month' | 'last_month' | 'custom'

function getStartOfWeek(): number {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  const start = new Date(now.getFullYear(), now.getMonth(), diff)
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

function getStartOfMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

function getStartOfLastMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
}

function getEndOfLastMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime()
}

function formatHours(hours: number): string {
  if (hours < 0.01) return '0h'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// ─── Animation variants ────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ─── Range Picker ──────────────────────────────────────────────────

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'custom', label: 'Custom' },
]

// ─── Component ─────────────────────────────────────────────────────

export default function TimeReportPage() {
  usePageTitle('Time Reports')
  const { user } = useUser()
  const { currentWorkspaceId } = useCurrentWorkspace()

  // Date range state
  const [rangeKey, setRangeKey] = useState<RangeKey>('this_week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Billable filter state
  const [billableOnly, setBillableOnly] = useState(false)

  const { startDate, endDate } = useMemo(() => {
    switch (rangeKey) {
      case 'this_week':
        return { startDate: getStartOfWeek(), endDate: Date.now() }
      case 'this_month':
        return { startDate: getStartOfMonth(), endDate: Date.now() }
      case 'last_month':
        return { startDate: getStartOfLastMonth(), endDate: getEndOfLastMonth() }
      case 'custom': {
        const s = customStart ? new Date(customStart).getTime() : getStartOfMonth()
        const e = customEnd ? new Date(customEnd + 'T23:59:59').getTime() : Date.now()
        return { startDate: s, endDate: e }
      }
    }
  }, [rangeKey, customStart, customEnd])

  const clerkUserId = user?.id ?? ''

  // Fetch time stats and entries from backend
  const timeStats = useQuery(
    api.timeEntries.getTimeStatsByUser,
    clerkUserId ? { userId: clerkUserId, startDate, endDate } : 'skip'
  )

  const timeEntries = useQuery(
    api.timeEntries.getTimeEntriesByUser,
    clerkUserId ? { userId: clerkUserId, startDate, endDate } : 'skip'
  )

  // Calculate derived data
  const dayCount = useMemo(() => {
    const ms = endDate - startDate
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  }, [startDate, endDate])

  const avgPerDay = timeStats ? timeStats.totalTime / dayCount : 0

  // Apply billable filter to entries
  const filteredEntries = useMemo(() => {
    if (!timeEntries) return []
    if (!billableOnly) return timeEntries
    return timeEntries.filter((e) => e.billable === true)
  }, [timeEntries, billableOnly])

  // Group filtered entries by date for display
  const filteredGroupedEntries = useMemo(() => {
    if (filteredEntries.length === 0) return []

    const groups = new Map<string, typeof filteredEntries>()
    const sorted = [...filteredEntries].sort((a, b) => b.startTime - a.startTime)

    for (const entry of sorted) {
      const dateKey = new Date(entry.startTime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(entry)
    }

    return Array.from(groups.entries()).map(([date, entries]) => ({
      date,
      entries,
      totalMs: entries.reduce((s, e) => s + (e.duration || 0), 0),
    }))
  }, [filteredEntries])

  // Calculate total time from filtered entries
  const filteredTotalMs = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
  }, [filteredEntries])

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredEntries.length) return

    const headers = 'Date,Start Time,End Time,Duration (h),Task ID,Description,Billable,Approved'
    const rows = filteredEntries.map((entry) => {
      const dur = entry.duration || (entry.endTime ? entry.endTime - entry.startTime : 0)
      const durationH = (dur / 3600000).toFixed(2)
      const date = formatDate(entry.startTime)
      const start = formatTime(entry.startTime)
      const end = entry.endTime ? formatTime(entry.endTime) : ''
      const desc = (entry.description || '').replace(/,/g, ';').replace(/"/g, '""')
      const billable = entry.billable ? 'Yes' : 'No'
      const approved = entry.approved ? 'Yes' : 'No'
      return `${date},${start},${end},${durationH},${String(entry.taskId)},"${desc}",${billable},${approved}`
    })

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Task breakdown from stats
  const taskBreakdown = timeStats?.taskBreakdown ?? []

  // Most tracked task
  const mostTracked = useMemo(() => {
    if (!taskBreakdown.length) return null
    return taskBreakdown.reduce((a, b) => (a.duration > b.duration ? a : b))
  }, [taskBreakdown])

  const isLoading = !timeStats && clerkUserId !== ''

  return (
    <ErrorBoundary>
    <div className="p-4 min-h-screen bg-[var(--theme-background)]">
      <div className="max-w-5xl mx-auto">

        {/* ─── HEADER ───────────────────────────────────────── */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineDocumentReport className="w-4 h-4 text-[var(--theme-foreground)]/40" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground)]/40">
              Workspace Analytics
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-[var(--theme-foreground)]">
              TIME REPORTS
            </h1>
            <button
              onClick={handleExportCSV}
              disabled={!filteredEntries.length}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider border-2 border-[var(--theme-border)] text-[var(--theme-foreground)]/50 hover:border-[#6366F1] hover:text-[#6366F1] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <HiOutlineDownload className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
          <p className="text-xs font-mono text-[var(--theme-foreground)]/50 mt-1">
            Track logged hours, billable time, and session breakdowns.
          </p>
        </m.div>

        {/* ─── DATE RANGE FILTER ────────────────────────────── */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-4"
        >
          <BrutalCard variant="default" padding="sm">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineFilter className="w-3.5 h-3.5 text-[var(--theme-foreground)]/40" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/50">
                Date Range
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRangeKey(opt.key)}
                  className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider border-2 transition-all ${
                    rangeKey === opt.key
                      ? 'border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]'
                      : 'border-[var(--theme-border)] text-[var(--theme-foreground)]/50 hover:border-[var(--theme-foreground)]/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-5 bg-[var(--theme-border)] mx-1" />

              {/* Billable Filter Toggle */}
              <button
                onClick={() => setBillableOnly((prev) => !prev)}
                className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider border-2 transition-all ${
                  billableOnly
                    ? 'border-[var(--theme-success)] bg-[var(--theme-success)]/10 text-[var(--theme-success)]'
                    : 'border-[var(--theme-border)] text-[var(--theme-foreground)]/50 hover:border-[var(--theme-foreground)]/30'
                }`}
              >
                Billable Only
              </button>
            </div>

            {rangeKey === 'custom' && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/40">
                    From
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] px-2 py-1 text-xs font-mono text-[var(--theme-foreground)] focus:border-[#6366F1] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/40">
                    To
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] px-2 py-1 text-xs font-mono text-[var(--theme-foreground)] focus:border-[#6366F1] outline-none"
                  />
                </div>
              </div>
            )}

            <div className="mt-2 text-[10px] font-mono text-[var(--theme-foreground)]/30">
              {formatDate(startDate)} &mdash; {formatDate(endDate)}
            </div>
          </BrutalCard>
        </m.div>

        {/* ─── SUMMARY CARDS ────────────────────────────────── */}
        <m.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {/* Total Hours */}
          <m.div variants={fadeUp}>
            <BrutalCard variant="default" padding="sm" className="h-full group hover:border-[#6366F1]">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineClock className="w-4 h-4 text-[#6366F1] opacity-50 group-hover:opacity-80" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40">
                  Total Hours
                </span>
              </div>
              {isLoading ? (
                <div className="h-8 w-20 bg-[var(--theme-border)] animate-pulse" />
              ) : (
                <>
                  <div className="text-2xl font-bold font-mono tracking-tight text-[#6366F1]">
                    {formatHours(timeStats?.totalTime ?? 0)}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-mono text-[var(--theme-success)]">
                      {formatHours(timeStats?.billableTime ?? 0)} billable
                    </span>
                    <span className="text-[10px] font-mono text-[var(--theme-foreground)]/30">
                      {timeStats?.entryCount ?? 0} sessions
                    </span>
                  </div>
                </>
              )}
            </BrutalCard>
          </m.div>

          {/* Avg Per Day */}
          <m.div variants={fadeUp}>
            <BrutalCard variant="default" padding="sm" className="h-full group hover:border-[var(--theme-warning)]">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineChartBar className="w-4 h-4 text-[var(--theme-warning)] opacity-50 group-hover:opacity-80" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40">
                  Avg / Day
                </span>
              </div>
              {isLoading ? (
                <div className="h-8 w-20 bg-[var(--theme-border)] animate-pulse" />
              ) : (
                <>
                  <div className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-warning)]">
                    {formatHours(avgPerDay)}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-mono text-[var(--theme-foreground)]/30">
                      over {dayCount} day{dayCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </>
              )}
            </BrutalCard>
          </m.div>

          {/* Most Tracked */}
          <m.div variants={fadeUp}>
            <BrutalCard variant="default" padding="sm" className="h-full group hover:border-[var(--theme-success)]">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineFolder className="w-4 h-4 text-[var(--theme-success)] opacity-50 group-hover:opacity-80" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40">
                  Top Task
                </span>
              </div>
              {isLoading ? (
                <div className="h-8 w-20 bg-[var(--theme-border)] animate-pulse" />
              ) : mostTracked ? (
                <>
                  <div className="text-2xl font-bold font-mono tracking-tight text-[var(--theme-success)]">
                    {formatHours(mostTracked.duration)}
                  </div>
                  <div className="mt-1.5">
                    <span className="text-[10px] font-mono text-[var(--theme-foreground)]/40 truncate block">
                      {String(mostTracked.taskId).slice(-8)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm font-mono text-[var(--theme-foreground)]/30">
                  No data
                </div>
              )}
            </BrutalCard>
          </m.div>
        </m.div>

        {/* ─── STATS BAR ────────────────────────────────────── */}
        {timeStats && (timeStats.totalTime > 0) && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-4"
          >
            <BrutalCard variant="default" padding="sm">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineChartBar className="w-3.5 h-3.5 text-[var(--theme-foreground)]/40" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/50">
                  Breakdown
                </span>
              </div>
              <div className="h-3 w-full bg-[var(--theme-background)] border border-[var(--theme-border)] flex overflow-hidden">
                {timeStats.billableTime > 0 && (
                  <div
                    className="h-full bg-[var(--theme-success)]"
                    style={{
                      width: `${(timeStats.billableTime / timeStats.totalTime) * 100}%`,
                    }}
                    title={`Billable: ${formatHours(timeStats.billableTime)}`}
                  />
                )}
                {timeStats.nonBillableTime > 0 && (
                  <div
                    className="h-full bg-[var(--theme-foreground)]/20"
                    style={{
                      width: `${(timeStats.nonBillableTime / timeStats.totalTime) * 100}%`,
                    }}
                    title={`Non-billable: ${formatHours(timeStats.nonBillableTime)}`}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[var(--theme-success)]" />
                  <span className="text-[10px] font-mono text-[var(--theme-foreground)]/50">
                    Billable {formatHours(timeStats.billableTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[var(--theme-foreground)]/20" />
                  <span className="text-[10px] font-mono text-[var(--theme-foreground)]/50">
                    Non-billable {formatHours(timeStats.nonBillableTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#6366F1]" />
                  <span className="text-[10px] font-mono text-[var(--theme-foreground)]/50">
                    Approved {formatHours(timeStats.approvedTime)}
                  </span>
                </div>
              </div>
            </BrutalCard>
          </m.div>
        )}

        {/* ─── TASK BREAKDOWN TABLE ─────────────────────────── */}
        {taskBreakdown.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-4"
          >
            <BrutalCard variant="default" padding="sm">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineFolder className="w-3.5 h-3.5 text-[var(--theme-foreground)]/40" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/50">
                  By Task
                </span>
                <span className="text-[10px] font-mono text-[var(--theme-foreground)]/30 ml-auto">
                  {taskBreakdown.length} task{taskBreakdown.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="border border-[var(--theme-border)]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[var(--theme-background)] border-b border-[var(--theme-border)]">
                  <div className="col-span-7 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40">
                    Task ID
                  </div>
                  <div className="col-span-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40 text-right">
                    Duration
                  </div>
                  <div className="col-span-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40 text-right">
                    %
                  </div>
                </div>

                {/* Table Rows */}
                {[...taskBreakdown]
                  .sort((a, b) => b.duration - a.duration)
                  .map((row, i) => (
                    <div
                      key={String(row.taskId)}
                      className={`grid grid-cols-12 gap-2 px-3 py-2 ${
                        i % 2 === 0
                          ? 'bg-[var(--theme-background-secondary)]'
                          : 'bg-[var(--theme-background)]'
                      } hover:bg-[#6366F1]/5 transition-colors`}
                    >
                      <div className="col-span-7 text-xs font-mono text-[var(--theme-foreground)]/70 truncate">
                        {String(row.taskId)}
                      </div>
                      <div className="col-span-3 text-xs font-mono text-[var(--theme-foreground)] text-right font-bold">
                        {formatHours(row.duration)}
                      </div>
                      <div className="col-span-2 text-xs font-mono text-[var(--theme-foreground)]/40 text-right">
                        {timeStats ? Math.round((row.duration / timeStats.totalTime) * 100) : 0}%
                      </div>
                    </div>
                  ))}

                {/* Total Summary Row */}
                <div className="sticky bottom-0 grid grid-cols-12 gap-2 px-4 py-3 bg-[#111111] border-t-2 border-[#2E2E35]">
                  <div className="col-span-7 text-xs font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]">
                    TOTAL
                  </div>
                  <div className="col-span-3 text-xs font-mono font-bold text-[#6366F1] text-right">
                    {formatHours(timeStats?.totalTime ?? 0)}
                  </div>
                  <div className="col-span-2 text-xs font-mono font-bold text-[var(--theme-foreground)] text-right">
                    100%
                  </div>
                </div>
              </div>
            </BrutalCard>
          </m.div>
        )}

        {/* ─── TIME ENTRIES LOG ──────────────────────────────── */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <BrutalCard variant="default" padding="sm">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineCalendar className="w-3.5 h-3.5 text-[var(--theme-foreground)]/40" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/50">
                Session Log
              </span>
              <span className="text-[10px] font-mono text-[var(--theme-foreground)]/30 ml-auto">
                {filteredEntries.length} entries
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-[var(--theme-border)] animate-pulse" />
                ))}
              </div>
            ) : filteredGroupedEntries.length > 0 ? (
              <>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredGroupedEntries.map((group) => (
                  <div key={group.date}>
                    {/* Day header */}
                    <div className="flex items-center justify-between px-2 py-1.5 bg-[var(--theme-background)] border border-[var(--theme-border)] mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]/60">
                        {group.date}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#6366F1]">
                        {formatHours(group.totalMs / 3600000)}
                      </span>
                    </div>

                    {/* Entries for this day */}
                    {group.entries.map((entry) => {
                      const dur = entry.duration || (entry.endTime ? entry.endTime - entry.startTime : 0)
                      const isActive = !entry.endTime

                      return (
                        <div
                          key={entry._id}
                          className="flex items-center gap-3 px-3 py-2 border-b border-[var(--theme-border)]/30 hover:bg-[var(--theme-background)] transition-colors group"
                        >
                          {/* Time range */}
                          <span className="text-[10px] font-mono text-[var(--theme-foreground)]/40 w-24 shrink-0">
                            {formatTime(entry.startTime)}
                            {entry.endTime
                              ? ` - ${formatTime(entry.endTime)}`
                              : ''}
                          </span>

                          {/* Status dot */}
                          <span
                            className={`w-1.5 h-1.5 shrink-0 ${
                              isActive
                                ? 'bg-[var(--theme-success)] animate-pulse'
                                : entry.billable
                                  ? 'bg-[#6366F1]'
                                  : 'bg-[var(--theme-foreground)]/20'
                            }`}
                          />

                          {/* Description or task ID */}
                          <span className="text-xs font-mono text-[var(--theme-foreground)]/60 truncate flex-1">
                            {entry.description || String(entry.taskId).slice(-8)}
                          </span>

                          {/* Badges */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isActive && (
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[var(--theme-success)] text-[var(--theme-success)]">
                                LIVE
                              </span>
                            )}
                            {entry.approved && (
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#6366F1] text-[#6366F1]">
                                OK
                              </span>
                            )}
                          </div>

                          {/* Duration */}
                          <span className="text-xs font-mono font-bold text-[var(--theme-foreground)] w-16 text-right shrink-0">
                            {isActive ? '--:--' : formatHours(dur / 3600000)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Session Log Total Footer */}
              <div className="sticky bottom-0 flex items-center justify-between px-4 py-3 bg-[#111111] border-t-2 border-[#2E2E35] mt-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--theme-foreground)]">
                  TOTAL
                </span>
                <span className="text-xs font-mono font-bold text-[#6366F1]">
                  {formatHours(filteredTotalMs / 3600000)}
                </span>
              </div>
              </>
            ) : (
              /* ─── EMPTY STATE ──────────────────────────────── */
              <div className="border-2 border-[var(--theme-border)] border-dashed p-10 text-center">
                <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground)]/20">
                  <HiOutlineClock className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-[var(--theme-foreground)] mb-1">
                  No Time Entries
                </p>
                <p className="text-xs font-mono text-[var(--theme-foreground)]/40 max-w-xs mx-auto">
                  Start tracking time on tasks to see your report here. Use the timer on any task
                  to begin logging hours.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#6366F1]/30 text-[#6366F1] text-[10px] font-mono font-bold uppercase tracking-wider">
                  <HiOutlineClock className="w-3 h-3" />
                  Waiting for entries...
                </div>
              </div>
            )}
          </BrutalCard>
        </m.div>
      </div>
    </div>
    </ErrorBoundary>
  )
}
