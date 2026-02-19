import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { m } from 'framer-motion'
import { useProfileCompletion } from '../hooks/useProfileCompletion'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import {
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineCode,
  HiOutlineLightningBolt,
  HiOutlineUser,
  HiOutlineTerminal,
  HiOutlineChevronRight,
  HiOutlineServer
} from 'react-icons/hi'
import BrutalCard from '../components/ui/BrutalCard'
import BrutalButton from '../components/ui/BrutalButton'

const STAT_ICONS = [
  { label: 'WORKSPACES', icon: HiOutlineBriefcase, color: 'var(--theme-info)' },
  { label: 'PROJECTS', icon: HiOutlineClipboardList, color: 'var(--theme-primary)' },
  { label: 'TEAM MEMBERS', icon: HiOutlineUsers, color: 'var(--theme-warning)' },
  { label: 'MEETINGS', icon: HiOutlineCalendar, color: 'var(--theme-success)' },
] as const

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Dashboard() {
  usePageTitle('Dashboard')
  const dashboardData = useQuery(api.dashboard.queries.getDashboardData)
  const workspaces = dashboardData?.workspaces ?? []
  const recentActivities = dashboardData?.recentActivities ?? []
  const { profileComplete, missingFields } = useProfileCompletion()

  const stats = useMemo(() => {
    const totalProjects = workspaces.reduce((sum: number, ws: any) => sum + (ws.projectCount || 0), 0)
    const totalMembers = workspaces.reduce((sum: number, ws: any) => sum + (ws.memberCount || 0), 0)
    const values = [workspaces.length.toString(), totalProjects.toString(), totalMembers.toString(), '0']
    return STAT_ICONS.map((s, i) => ({ ...s, value: values[i] }))
  }, [workspaces])

  return (
    <div className="p-4 min-h-screen bg-[var(--theme-background)]">
      {/* HEADER SECTION */}
      <div className="mb-4 flex items-start justify-between">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground)]/40 inline-block mb-1">
            Command Center
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--theme-foreground)]">
            Dashboard
          </h1>
        </m.div>
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <BrutalButton variant="primary" size="sm">
            <HiOutlineLightningBolt className="w-4 h-4" /> Quick Action
          </BrutalButton>
        </m.div>
      </div>

      {/* PROFILE COMPLETION BANNER */}
      {!profileComplete && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3"
        >
          <div className="border-2 border-[var(--theme-warning)] bg-[var(--theme-warning)]/5 p-3 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 border-2 border-[var(--theme-warning)] flex items-center justify-center shrink-0">
                <HiOutlineUser className="w-4 h-4 text-[var(--theme-warning)]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--theme-warning)] uppercase tracking-wider">Complete Your Profile</h3>
                <p className="font-mono text-[11px] text-[var(--theme-foreground)]/60 mt-0.5">
                  Missing: {missingFields.join(', ')}
                </p>
              </div>
            </div>
            <Link to="/profile">
              <BrutalButton variant="secondary" size="sm" className="border-[var(--theme-warning)] text-[var(--theme-warning)] hover:bg-[var(--theme-warning)] hover:text-black">
                COMPLETE PROFILE
              </BrutalButton>
            </Link>
          </div>
        </m.div>
      )}

      {/* STATS ROW */}
      <m.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => (
          <m.div key={stat.label} variants={fadeUp}>
            <BrutalCard variant="default" padding="sm" className="h-full hover:border-[var(--theme-primary)] group">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 opacity-40 group-hover:opacity-80" style={{ color: stat.color }} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--theme-foreground)]/40">
                  {stat.label}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </BrutalCard>
          </m.div>
        ))}
      </m.div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* ACTIVITY FEED - 8 COLUMNS */}
        <div className="lg:col-span-8">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <BrutalCard variant="default" padding="sm" className="h-full">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--theme-border)]/50">
                <div className="flex items-center gap-2">
                  <HiOutlineTerminal className="w-4 h-4 text-[var(--theme-foreground)]/40" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)]">
                    Activity Log
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--theme-foreground)]/50">
                  <span className="w-1.5 h-1.5 bg-[var(--theme-success)] animate-pulse" />
                  LIVE
                </div>
              </div>

              <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity: any, i: number) => (
                    <m.div
                      key={activity._id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group flex items-center gap-3 px-2 py-2 border border-transparent hover:border-[var(--theme-border)] hover:bg-[var(--theme-background-secondary)] cursor-pointer"
                    >
                      <span className="font-mono text-[10px] text-[var(--theme-foreground)]/30 w-12 shrink-0 uppercase">
                        {activity.timeAgo || 'now'}
                      </span>
                      <span
                        className="font-bold text-xs w-8 shrink-0"
                        style={{ color: activity.color || 'var(--theme-foreground)' }}
                      >
                        {activity.actor?.initials || 'SYS'}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--theme-foreground)]/50 shrink-0">
                        {activity.formattedAction}
                      </span>
                      <span className="font-mono text-xs text-[var(--theme-foreground)]/70 truncate">
                        {activity.formattedTarget}
                      </span>
                      <HiOutlineCode className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 shrink-0 ml-auto" />
                    </m.div>
                  ))
                ) : (
                  <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground)]/30">
                      <HiOutlineTerminal className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-[var(--theme-foreground)] mb-0.5">No Recent Activity</p>
                    <p className="text-[11px] text-[var(--theme-foreground)]/40 font-mono">Activity will appear here as your team works</p>
                  </div>
                )}
              </div>
            </BrutalCard>
          </m.div>
        </div>

        {/* SIDEBAR WIDGETS - 4 COLUMNS */}
        <div className="lg:col-span-4 space-y-3">

          {/* WORKSPACES WIDGET */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <BrutalCard variant="default" padding="sm">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--theme-border)]/50">
                <div className="flex items-center gap-2">
                  <HiOutlineBriefcase className="w-4 h-4 text-[var(--theme-foreground)]/40" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)]">Workspaces</h3>
                </div>
                <Link to="/workspaces" className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/40 hover:text-[var(--theme-primary)]">
                  View All
                </Link>
              </div>
              <div className="space-y-1.5">
                {workspaces.slice(0, 3).map((ws: any) => (
                  <Link
                    key={ws._id}
                    to={`/workspace/${ws._id}`}
                    className="block p-2.5 border border-[var(--theme-border)] bg-[var(--theme-background)] hover:border-[var(--theme-primary)] group cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-[var(--theme-foreground)]">{ws.name}</span>
                      <HiOutlineChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60" />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--theme-foreground)]/40 font-mono uppercase tracking-wider">
                      <span>{ws.memberCount} mem</span>
                      <span>{ws.projectCount} proj</span>
                    </div>
                  </Link>
                ))}
                {workspaces.length === 0 && (
                  <div className="border-2 border-[var(--theme-border)] border-dashed p-6 text-center">
                    <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground)]/30">
                      <HiOutlineBriefcase className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-[var(--theme-foreground)] mb-0.5">No Workspaces</p>
                    <p className="text-[11px] text-[var(--theme-foreground)]/40 font-mono mb-3">Create your first workspace to get started</p>
                    <Link to="/workspaces">
                      <BrutalButton variant="primary" size="sm">Create Workspace</BrutalButton>
                    </Link>
                  </div>
                )}
              </div>
            </BrutalCard>
          </m.div>

          {/* SYSTEM METRICS WIDGET */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <BrutalCard variant="default" padding="sm">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--theme-border)]/50">
                <HiOutlineServer className="w-4 h-4 text-[var(--theme-foreground)]/40" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)]">
                  System Metrics
                </h3>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--theme-foreground)]/50 uppercase text-[10px] tracking-wider">CPU Load</span>
                    <span className="text-[var(--theme-success)] font-bold">12%</span>
                  </div>
                  <div className="w-full h-1 bg-[var(--theme-border)]/30">
                    <div className="h-full bg-[var(--theme-success)] w-[12%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--theme-foreground)]/50 uppercase text-[10px] tracking-wider">Memory Usage</span>
                    <span className="text-[var(--theme-warning)] font-bold">64%</span>
                  </div>
                  <div className="w-full h-1 bg-[var(--theme-border)]/30">
                    <div className="h-full bg-[var(--theme-warning)] w-[64%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--theme-foreground)]/50 uppercase text-[10px] tracking-wider">Network Traffic</span>
                    <span className="text-[var(--theme-info)] font-bold">1.2 GB/s</span>
                  </div>
                  <div className="w-full h-1 bg-[var(--theme-border)]/30">
                    <div className="h-full bg-[var(--theme-info)] w-[45%]" />
                  </div>
                </div>
              </div>
            </BrutalCard>
          </m.div>

        </div>
      </div>
    </div>
  )
}