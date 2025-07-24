import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { motion } from 'framer-motion'
import { 
  HiOutlineBriefcase, 
  HiOutlineClipboardList, 
  HiOutlineUsers, 
  HiOutlineCalendar,
  HiOutlineCode,
  HiOutlineLightningBolt,
  HiOutlineChip,
  HiOutlineDatabase
} from 'react-icons/hi'
import BrutalCard from '../components/ui/BrutalCard'
import BrutalButton from '../components/ui/BrutalButton'

export default function Dashboard() {
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces) || []
  
  const totalProjects = workspaces.reduce((sum: number, ws: any) => sum + (ws.projectCount || 0), 0)
  const totalMembers = workspaces.reduce((sum: number, ws: any) => sum + (ws.memberCount || 0), 0)

  const stats = [
    { label: 'WORKSPACES', value: workspaces.length.toString(), icon: HiOutlineBriefcase, color: '#00FFFF' },
    { label: 'PROJECTS', value: totalProjects.toString(), icon: HiOutlineClipboardList, color: '#FF00FF' },
    { label: 'TEAM MEMBERS', value: totalMembers.toString(), icon: HiOutlineUsers, color: '#FFFF00' },
    { label: 'MEETINGS TODAY', value: '0', icon: HiOutlineCalendar, color: '#00FF00' },
  ]

  return (
    <div className="p-24px">
      {/* BRUTAL HEADER */}
      <div className="mb-32px">
        <h1 className="text-4xl font-bold mb-8px">
          WELCOME BACK, <span className="glitch-text">OPERATOR</span>
        </h1>
        <p className="text-brutal-sm text-cathode-white/70">
          SYSTEM STATUS: OPERATIONAL | TASKS PENDING: 42
        </p>
      </div>

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
                    <p className="text-brutal-xs text-cathode-white/70">{stat.label}</p>
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
              <h2 className="text-brutal-xl">RECENT ACTIVITY</h2>
              <div className="flex items-center gap-8px">
                <div className="w-8px h-8px bg-[#00FF00] animate-pulse"></div>
                <span className="text-brutal-xs">LIVE</span>
              </div>
            </div>
            
            <div className="space-y-16px">
              {[
                { user: 'JD', action: 'COMPLETED TASK', target: '#142', time: '2 HOURS AGO', icon: HiOutlineCode },
                { user: 'SM', action: 'DEPLOYED TO', target: 'PRODUCTION', time: '3 HOURS AGO', icon: HiOutlineLightningBolt },
                { user: 'AK', action: 'MERGED PR', target: '#89', time: '5 HOURS AGO', icon: HiOutlineChip },
                { user: 'RT', action: 'UPDATED DATABASE', target: 'SCHEMA', time: '6 HOURS AGO', icon: HiOutlineDatabase },
              ].map((activity, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-16px p-16px bg-event-horizon border-2 border-basalt-border hover:border-[#00FFFF] transition-colors cursor-pointer"
                >
                  <div className="w-40px h-40px bg-carbon-plate border-2 border-basalt-border flex items-center justify-center">
                    <span className="text-brutal-xs font-bold text-[#00FFFF]">{activity.user}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-brutal-sm">
                      <span className="text-cathode-white/70">{activity.action}</span>{' '}
                      <span className="text-[#FFFF00]">{activity.target}</span>
                    </p>
                    <p className="text-brutal-xs text-cathode-white/50">{activity.time}</p>
                  </div>
                  <activity.icon className="w-24px h-24px text-cathode-white/30" />
                </motion.div>
              ))}
            </div>
          </BrutalCard>
        </div>

        {/* WORKSPACES PANEL */}
        <div>
          <BrutalCard variant="elevated">
            <h2 className="text-brutal-xl mb-24px">YOUR WORKSPACES</h2>
            
            <div className="space-y-16px">
              {workspaces.length > 0 ? (
                workspaces.map((workspace: any, i: number) => (
                  <motion.div 
                    key={workspace._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-16px bg-event-horizon border-2 border-basalt-border hover:border-[#FF00FF] transition-all cursor-pointer brutal-hover"
                  >
                    <h3 className="text-brutal-sm font-bold mb-4px">{workspace.name.toUpperCase()}</h3>
                    <div className="flex items-center gap-16px text-brutal-xs">
                      <span className="text-[#00FFFF]">{workspace.memberCount} MEMBERS</span>
                      <span className="text-[#FFFF00]">{workspace.role.toUpperCase()}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-48px">
                  <div className="mb-24px">
                    <div className="w-80px h-80px mx-auto bg-carbon-plate border-2 border-basalt-border flex items-center justify-center mb-16px">
                      <HiOutlineBriefcase className="w-40px h-40px text-cathode-white/30" />
                    </div>
                    <p className="text-brutal-sm text-cathode-white/60">NO WORKSPACES DETECTED</p>
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
            <h3 className="text-brutal-sm mb-16px">SYSTEM METRICS</h3>
            <div className="space-y-8px text-brutal-xs">
              <div className="flex justify-between">
                <span className="text-cathode-white/70">UPTIME</span>
                <span className="text-[#00FF00]">99.98%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cathode-white/70">API LATENCY</span>
                <span className="text-[#FFFF00]">42MS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cathode-white/70">QUEUE DEPTH</span>
                <span className="text-[#00FFFF]">128</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cathode-white/70">ERROR RATE</span>
                <span className="text-[#FF00FF]">0.02%</span>
              </div>
            </div>
          </BrutalCard>
        </div>
      </div>
    </div>
  )
}