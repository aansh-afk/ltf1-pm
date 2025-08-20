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
    { label: 'PROJECTS', value: totalProjects.toString(), icon: HiOutlineClipboardList, color: 'var(--theme-accent)' },
    { label: 'TEAM MEMBERS', value: totalMembers.toString(), icon: HiOutlineUsers, color: 'var(--theme-warning)' },
    { label: 'MEETINGS TODAY', value: '0', icon: HiOutlineCalendar, color: 'var(--theme-success)' },
  ]

  return (
    <div className="p-24px">
      {/* BRUTAL HEADER */}
      <div className="mb-32px">
        <h1 className="text-4xl font-bold mb-8px">
          WELCOME BACK, <span className="glitch-text">OPERATOR</span>
        </h1>
        <p className="text-brutal-sm text-[var(--theme-foreground)]/70">
          SYSTEM STATUS: OPERATIONAL | TASKS PENDING: 42
        </p>
      </div>

      {/* PROFILE COMPLETION PROMPT */}
      {!profileComplete && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-24px"
        >
          <Link to="/profile" className="block">
            <BrutalCard variant="elevated" hoverable className="bg-[var(--theme-warning)]/10 border-[var(--theme-warning)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-brutal-lg font-bold mb-8px text-[var(--theme-foreground)]">COMPLETE YOUR DEVELOPER PROFILE</h3>
                  <p className="text-brutal-sm text-[var(--theme-foreground)]/80">
                    Missing: {missingFields.join(', ')} — Complete your profile to unlock smart task assignments and team collaboration features.
                  </p>
                </div>
                <BrutalButton variant="primary">
                  COMPLETE NOW →
                </BrutalButton>
              </div>
            </BrutalCard>
          </Link>
        </motion.div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24px mb-48px">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
            >
              <BrutalCard variant="elevated" hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brutal-xs text-[var(--theme-foreground)]/70">{stat.label}</p>
                    <p className="text-5xl font-bold mt-8px" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className="w-48px h-48px" style={{ color: stat.color }} />
                </div>
              </BrutalCard>
            </motion.div>
          )
        })}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-24px">
        {/* ACTIVITY FEED */}
        <div className="lg:col-span-2">
          <BrutalCard variant="elevated">
            <div className="flex items-center justify-between mb-24px">
              <h2 className="text-brutal-xl text-[var(--theme-foreground)]">RECENT ACTIVITY</h2>
              <div className="flex items-center gap-8px">
                <div className="w-8px h-8px bg-[var(--theme-success)] animate-pulse"></div>
                <span className="text-brutal-xs text-[var(--theme-foreground)]">LIVE</span>
              </div>
            </div>
            
            <div className="space-y-16px">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 6).map((activity: any, i: number) => {
                  // Get the appropriate icon based on activity type
                  const getActivityIcon = () => {
                    switch (activity.icon) {
                      case 'check': return HiOutlineCheckCircle;
                      case 'plus': return HiOutlinePlus;
                      case 'user': return HiOutlineUser;
                      case 'play': return HiOutlinePlay;
                      case 'flag': return HiOutlineFlag;
                      case 'git-merge': return HiOutlineGitMerge;
                      case 'git-commit': return HiOutlineGitCommit;
                      case 'calendar': return HiOutlineCalendar;
                      case 'user-plus': return HiOutlineUserAdd;
                      default: return HiOutlineTerminal;
                    }
                  };
                  
                  const Icon = getActivityIcon();
                  
                  return (
                    <motion.div 
                      key={activity._id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-16px p-16px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] hover:border-[var(--theme-info)] transition-colors cursor-pointer"
                    >
                      <div className="w-40px h-40px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex items-center justify-center">
                        <span className="text-brutal-xs font-bold" style={{ color: activity.color }}>
                          {activity.actor?.initials || 'SYS'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-brutal-sm">
                          <span className="text-[var(--theme-foreground)]/70">{activity.formattedAction}</span>{' '}
                          <span style={{ color: activity.color }}>{activity.formattedTarget}</span>
                        </p>
                        <div className="flex items-center gap-8px">
                          <p className="text-brutal-xs text-[var(--theme-foreground)]/50">{activity.timeAgo}</p>
                          {activity.showWorkspace && activity.workspace && (
                            <>
                              <span className="text-brutal-xs text-[var(--theme-foreground)]/30">•</span>
                              <p className="text-brutal-xs text-[var(--theme-foreground)]/50">{activity.workspace.name}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <Icon className="w-24px h-24px" style={{ color: `${activity.color}30` }} />
                    </motion.div>
                  );
                })
              ) : (
                // Fallback placeholder data if no activities
                [
                  { user: 'SYS', action: 'WAITING FOR', target: 'ACTIVITIES', time: 'JUST NOW', icon: HiOutlineTerminal, color: 'var(--theme-info)' },
                ].map((activity, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-16px p-16px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]"
                  >
                    <div className="w-40px h-40px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex items-center justify-center">
                      <span className="text-brutal-xs font-bold text-[var(--theme-info)]">{activity.user}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-brutal-sm">
                        <span className="text-[var(--theme-foreground)]/70">{activity.action}</span>{' '}
                        <span className="text-[var(--theme-warning)]">{activity.target}</span>
                      </p>
                      <p className="text-brutal-xs text-[var(--theme-foreground)]/50">{activity.time}</p>
                    </div>
                    <activity.icon className="w-24px h-24px text-[var(--theme-foreground)]/30" />
                  </motion.div>
                ))
              )}
            </div>
          </BrutalCard>
        </div>

        {/* WORKSPACES PANEL */}
        <div>
          <BrutalCard variant="elevated">
            <h2 className="text-brutal-xl mb-24px text-[var(--theme-foreground)]">YOUR WORKSPACES</h2>
            
            <div className="space-y-16px">
              {workspaces.length > 0 ? (
                workspaces.map((workspace: any, i: number) => (
                  <motion.div 
                    key={workspace._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-16px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all cursor-pointer brutal-hover"
                  >
                    <h3 className="text-brutal-sm font-bold mb-4px text-[var(--theme-foreground)]">{workspace.name.toUpperCase()}</h3>
                    <div className="flex items-center gap-16px text-brutal-xs">
                      <span className="text-[var(--theme-info)]">{workspace.memberCount} MEMBERS</span>
                      <span className="text-[var(--theme-warning)]">{workspace.role.toUpperCase()}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-48px">
                  <div className="mb-24px">
                    <div className="w-80px h-80px mx-auto bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex items-center justify-center mb-16px">
                      <HiOutlineBriefcase className="w-40px h-40px text-[var(--theme-foreground)]/30" />
                    </div>
                    <p className="text-brutal-sm text-[var(--theme-foreground)]/60">NO WORKSPACES DETECTED</p>
                  </div>
                  <BrutalButton variant="glitch" size="sm">
                    CREATE WORKSPACE
                  </BrutalButton>
                </div>
              )}
            </div>
          </BrutalCard>

          {/* SYSTEM METRICS */}
          <BrutalCard variant="bordered" className="mt-24px">
            <h3 className="text-brutal-sm mb-16px text-[var(--theme-foreground)]">SYSTEM METRICS</h3>
            <div className="space-y-8px text-brutal-xs">
              <div className="flex justify-between">
                <span className="text-[var(--theme-foreground)]/70">UPTIME</span>
                <span className="text-[var(--theme-success)]">99.98%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--theme-foreground)]/70">API LATENCY</span>
                <span className="text-[var(--theme-warning)]">42MS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--theme-foreground)]/70">QUEUE DEPTH</span>
                <span className="text-[var(--theme-info)]">128</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--theme-foreground)]/70">ERROR RATE</span>
                <span className="text-[var(--theme-accent)]">0.02%</span>
              </div>
            </div>
          </BrutalCard>
        </div>
      </div>
    </div>
  )
}