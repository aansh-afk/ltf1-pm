import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { motion } from 'framer-motion'
import { useProfileCompletion } from '../hooks/useProfileCompletion'
import { Link } from 'react-router-dom'
import {
  HiOutlineBriefcase,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineCode,
  HiOutlineLightningBolt,
  HiOutlineChip,
  HiOutlineDatabase,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlinePlus,
  HiOutlinePlay,
  HiOutlineFlag,
  HiOutlineUserAdd,
  HiOutlineTerminal
} from 'react-icons/hi'
import {
  HiCodeBracket as HiOutlineGitMerge,
  HiArrowPath as HiOutlineGitCommit
} from 'react-icons/hi2'
import BrutalCard from '../components/ui/BrutalCard'
import BrutalButton from '../components/ui/BrutalButton'

export default function Dashboard() {
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces) || []
  const recentActivities = useQuery(api.activities.queries.getDashboardActivities, { limit: 10 }) || []
  const { profileComplete, missingFields } = useProfileCompletion()

  const totalProjects = workspaces.reduce((sum: number, ws: any) => sum + (ws.projectCount || 0), 0)
  const totalMembers = workspaces.reduce((sum: number, ws: any) => sum + (ws.memberCount || 0), 0)

  const stats = [
    { label: 'WORKSPACES', value: workspaces.length.toString(), icon: HiOutlineBriefcase, color: 'var(--theme-info)' },
    { label: 'PROJECTS', value: totalProjects.toString(), icon: HiOutlineClipboardList, color: 'var(--theme-primary)' },
    { label: 'TEAM MEMBERS', value: totalMembers.toString(), icon: HiOutlineUsers, color: 'var(--theme-warning)' },
    { label: 'MEETINGS', value: '0', icon: HiOutlineCalendar, color: 'var(--theme-success)' },
  ]

  return (
    <div className="p-6 min-h-screen bg-[var(--theme-background)]">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[var(--theme-border)] pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60">
            Welcome back.
          </p>
        </div>
        <div className="flex gap-2">
          <BrutalButton variant="primary" size="sm">
            <HiOutlineLightningBolt className="w-4 h-4" /> Quick Action
          </BrutalButton>
        </div>
      </div>

      {/* PROFILE COMPLETION BANNER */}
      {!profileComplete && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8"
        >
          <BrutalCard variant="neon" className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-[var(--theme-warning)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border-2 border-[var(--theme-warning)] flex items-center justify-center bg-black">
                  <HiOutlineUser className="w-6 h-6 text-[var(--theme-warning)]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--theme-warning)] uppercase tracking-wider">Complete Your Profile</h3>
                  <p className="font-mono text-xs text-[var(--theme-foreground)]/80">
                    Missing data: {missingFields.join(', ')}
                  </p>
                </div>
              </div>
              <Link to="/profile">
                <BrutalButton variant="secondary" size="sm" className="border-[var(--theme-warning)] text-[var(--theme-warning)] hover:bg-[var(--theme-warning)] hover:text-black">
                  COMPLETE PROFILE
                </BrutalButton>
              </Link>
            </div>
          </BrutalCard>
        </motion.div>
      )}

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* STATS ROW */}
        {stats.map((stat, index) => (
          <div key={stat.label} className="col-span-1 md:col-span-6 lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <BrutalCard variant="default" className="h-full hover:border-[var(--theme-primary)] transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <stat.icon className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: stat.color }} />
                  <span className="font-mono text-xs opacity-50">ID_0{index + 1}</span>
                </div>
                <div className="text-4xl font-black tracking-tighter mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="font-mono text-xs uppercase tracking-widest opacity-70">
                  {stat.label}
                </div>
              </BrutalCard>
            </motion.div>
          </div>
        ))}

        {/* ACTIVITY FEED - 8 COLUMNS */}
        <div className="col-span-1 md:col-span-12 lg:col-span-8">
          <BrutalCard variant="elevated" className="h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[var(--theme-border)] pb-4">
              <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                <HiOutlineTerminal className="w-5 h-5" /> Activity Log
              </h2>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="w-2 h-2 bg-[var(--theme-success)] animate-pulse" />
                Live
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity: any, i: number) => (
                  <motion.div
                    key={activity._id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-start gap-4 p-3 border border-[var(--theme-border)] hover:bg-[var(--theme-background-secondary)] hover:border-[var(--theme-primary)] transition-all cursor-pointer"
                  >
                    <div className="font-mono text-xs opacity-50 w-16 pt-1">
                      {activity.timeAgo || 'NOW'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm" style={{ color: activity.color }}>
                          {activity.actor?.initials || 'Sys'}
                        </span>
                        <span className="text-xs uppercase tracking-wider opacity-70">
                          {activity.formattedAction}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-[var(--theme-foreground)]/80">
                        {activity.formattedTarget}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <HiOutlineCode className="w-4 h-4" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 opacity-50 font-mono text-sm">
                  // No recent activity
                </div>
              )}
            </div>
          </BrutalCard>
        </div>

        {/* SIDEBAR WIDGETS - 4 COLUMNS */}
        <div className="col-span-1 md:col-span-12 lg:col-span-4 space-y-6">

          {/* WORKSPACES WIDGET */}
          <BrutalCard variant="default">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider">Workspaces</h3>
              <Link to="/workspaces" className="text-xs font-mono hover:text-[var(--theme-primary)] hover:underline">
                VIEW ALL
              </Link>
            </div>
            <div className="space-y-3">
              {workspaces.slice(0, 3).map((ws: any) => (
                <div key={ws._id} className="p-3 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:translate-x-1 transition-transform cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">{ws.name}</span>
                    <span className="text-[10px] font-mono border border-[var(--theme-border)] px-1">
                      {ws.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs opacity-60 font-mono">
                    <span>{ws.memberCount} MEM</span>
                    <span>{ws.projectCount} PROJ</span>
                  </div>
                </div>
              ))}
              {workspaces.length === 0 && (
                <div className="text-center py-8 border border-dashed border-[var(--theme-border)]">
                  <p className="text-xs font-mono mb-2">NO WORKSPACES</p>
                  <BrutalButton variant="secondary" size="sm">CREATE NEW</BrutalButton>
                </div>
              )}
            </div>
          </BrutalCard>

          {/* SYSTEM METRICS WIDGET */}
          <BrutalCard variant="glitch" className="bg-black text-white border-white">
            <h3 className="font-mono text-xs mb-4 border-b border-white/20 pb-2">
              System Metrics
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span>CPU Load</span>
                <span className="text-[var(--theme-success)]">12%</span>
              </div>
              <div className="w-full h-1 bg-white/20">
                <div className="h-full bg-[var(--theme-success)] w-[12%]" />
              </div>

              <div className="flex justify-between mt-4">
                <span>Memory Usage</span>
                <span className="text-[var(--theme-warning)]">64%</span>
              </div>
              <div className="w-full h-1 bg-white/20">
                <div className="h-full bg-[var(--theme-warning)] w-[64%]" />
              </div>

              <div className="flex justify-between mt-4">
                <span>Network Traffic</span>
                <span className="text-[var(--theme-info)]">1.2 GB/s</span>
              </div>
              <div className="w-full h-1 bg-white/20">
                <div className="h-full bg-[var(--theme-info)] w-[45%] animate-pulse" />
              </div>
            </div>
          </BrutalCard>

        </div>
      </div>
    </div>
  )
}