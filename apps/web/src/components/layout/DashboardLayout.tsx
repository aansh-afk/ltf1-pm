import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { 
  HiOutlineHome, 
  HiOutlineBriefcase, 
  HiOutlineFolder, 
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineCog,
  HiOutlineMenuAlt2,
  HiOutlineX,
  HiOutlineTerminal
} from 'react-icons/hi'
import clsx from 'clsx'
import { useCurrentWorkspace } from '../../hooks/useCurrentWorkspace'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { currentWorkspaceId } = useCurrentWorkspace()

  // Build navigation items dynamically based on workspace context
  const navItems = [
    { path: '/dashboard', label: 'DASHBOARD', icon: HiOutlineHome },
    { path: '/workspaces', label: 'WORKSPACES', icon: HiOutlineBriefcase },
    ...(currentWorkspaceId ? [
      { path: `/workspace/${currentWorkspaceId}/projects`, label: 'PROJECTS', icon: HiOutlineFolder },
      { path: `/workspace/${currentWorkspaceId}/tasks`, label: 'TASKS', icon: HiOutlineClipboardList },
      { path: `/workspace/${currentWorkspaceId}/meetings`, label: 'MEETINGS', icon: HiOutlineCalendar },
    ] : [
      { path: '/workspace/current/projects', label: 'PROJECTS', icon: HiOutlineFolder },
      { path: '/workspace/current/tasks', label: 'TASKS', icon: HiOutlineClipboardList },
      { path: '/workspace/current/meetings', label: 'MEETINGS', icon: HiOutlineCalendar },
    ]),
    { path: '/settings', label: 'SETTINGS', icon: HiOutlineCog },
  ]

  return (
    <div className="flex h-screen bg-event-horizon">
      {/* MOBILE OVERLAY */}
      <div className={clsx(
        'fixed inset-0 z-40 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div 
          className="absolute inset-0 bg-event-horizon/90"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      {/* BRUTAL SIDEBAR */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-256px bg-carbon-plate border-r-2 border-basalt-border transform transition-transform duration-200 ease-brutal-out lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* SIDEBAR HEADER */}
        <div className="h-64px px-24px border-b-2 border-basalt-border flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span className="text-cathode-white">LTF1</span>
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden brutal-hover"
          >
            <HiOutlineX className="w-24px h-24px text-cathode-white" />
          </button>
        </div>

        {/* NAV ITEMS */}
        <nav className="py-24px">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center px-24px py-16px text-brutal-sm font-semibold transition-all duration-200 ease-brutal-out',
                  isActive
                    ? 'bg-event-horizon text-[#00FFFF] border-l-4 border-[#00FFFF] shadow-brutal-sm'
                    : 'text-cathode-white hover:bg-event-horizon/50 hover:text-cathode-white hover:translate-x-8px'
                )}
              >
                <Icon className="w-24px h-24px mr-16px" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* TERMINAL COMMAND */}
        <div className="px-24px py-16px">
          <div className="brutal-card p-16px">
            <div className="flex items-center gap-8px mb-8px">
              <HiOutlineTerminal className="w-16px h-16px text-[#00FFFF]" />
              <span className="text-brutal-xs">QUICK CMD</span>
            </div>
            <input 
              type="text" 
              placeholder="$ TYPE COMMAND..."
              className="brutal-input w-full text-xs"
            />
          </div>
        </div>

        {/* USER SECTION */}
        <div className="absolute bottom-0 left-0 right-0 p-24px border-t-2 border-basalt-border">
          <div className="flex items-center gap-16px">
            <div className="border-2 border-basalt-border p-2">
              <UserButton afterSignOutUrl="/" />
            </div>
            <div>
              <p className="text-brutal-xs">USER ACCOUNT</p>
              <p className="text-brutal-xs text-[#00FFFF]">ACTIVE</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* BRUTAL HEADER */}
        <header className="h-64px bg-carbon-plate border-b-2 border-basalt-border flex items-center px-24px">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-16px brutal-hover"
          >
            <HiOutlineMenuAlt2 className="w-24px h-24px" />
          </button>
          
          <div className="flex-1">
            <h2 className="text-brutal-lg">
              {navItems.find(item => item.path === location.pathname)?.label || 'DASHBOARD'}
            </h2>
          </div>

          <div className="flex items-center gap-16px">
            <button className="brutal-btn">
              + QUICK ADD
            </button>
            <div className="text-brutal-xs">
              <span className="text-[#00FFFF]">STATUS:</span> OPERATIONAL
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-event-horizon">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* BRUTAL STATUS BAR */}
        <footer className="h-32px bg-carbon-plate border-t-2 border-basalt-border flex items-center px-24px">
          <div className="flex items-center gap-24px text-brutal-xs">
            <span>
              <span className="text-[#FFFF00]">MEM:</span> 128MB
            </span>
            <span>
              <span className="text-[#00FFFF]">CPU:</span> 12%
            </span>
            <span>
              <span className="text-[#FF00FF]">TASKS:</span> 42
            </span>
            <span className="ml-auto">
              <span className="text-[#00FF00]">SYSTEM:</span> NOMINAL
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}