import { useQuery } from 'convex/react'
import { api } from '@ltf1/backend'
import { motion } from 'framer-motion'
import { 
  HiOutlineBriefcase, 
  HiOutlineClipboardList, 
  HiOutlineUsers, 
  HiOutlineCalendar 
} from 'react-icons/hi'

export default function Dashboard() {
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces) || []
  
  const totalProjects = workspaces.reduce((sum: number, ws: any) => sum + (ws.projectCount || 0), 0)
  const totalMembers = workspaces.reduce((sum: number, ws: any) => sum + (ws.memberCount || 0), 0)

  const stats = [
    { label: 'Workspaces', value: workspaces.length.toString(), icon: HiOutlineBriefcase, color: 'text-primary' },
    { label: 'Projects', value: totalProjects.toString(), icon: HiOutlineClipboardList, color: 'text-secondary' },
    { label: 'Team Members', value: totalMembers.toString(), icon: HiOutlineUsers, color: 'text-accent' },
    { label: 'Meetings Today', value: '0', icon: HiOutlineCalendar, color: 'text-info' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-base-content/70">Here's what's happening across your workspaces</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="card bg-base-200 shadow-xl"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-base-content/70">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <Icon className={`w-10 h-10 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-base-300 transition-colors">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-8">
                      <span className="text-xs">JD</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">John Doe</span> completed task{' '}
                      <span className="text-primary">#142</span>
                    </p>
                    <p className="text-xs text-base-content/60">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Your Workspaces</h2>
            <div className="space-y-3">
              {workspaces.length > 0 ? (
                workspaces.map((workspace: any) => (
                  <div key={workspace._id} className="p-3 rounded-lg hover:bg-base-300 transition-colors cursor-pointer">
                    <h3 className="font-semibold">{workspace.name}</h3>
                    <p className="text-sm text-base-content/60">
                      {workspace.memberCount} members • {workspace.role}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-base-content/60 mb-4">No workspaces yet</p>
                  <button className="btn btn-primary btn-sm">Create Workspace</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}