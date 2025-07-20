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
  HiOutlineX
} from 'react-icons/hi'
import clsx from 'clsx'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { path: '/workspaces', label: 'Workspaces', icon: HiOutlineBriefcase },
  { path: '/workspace/current/projects', label: 'Projects', icon: HiOutlineFolder },
  { path: '/workspace/current/tasks', label: 'Tasks', icon: HiOutlineClipboardList },
  { path: '/workspace/current/meetings', label: 'Meetings', icon: HiOutlineCalendar },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen bg-base-100">
      <div className={clsx(
        'fixed inset-0 z-40 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-base-200 transform transition-transform duration-300 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-base-300">
          <h1 className="text-2xl font-bold text-gradient">LTF1</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center px-6 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-base-300 border-r-2 border-primary'
                    : 'text-base-content hover:text-primary hover:bg-base-300'
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-base-300">
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/" />
            <span className="ml-3 text-sm font-medium">Account</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-base-200 border-b border-base-300 flex items-center px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4"
          >
            <HiOutlineMenuAlt2 className="w-6 h-6" />
          </button>
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <button className="btn btn-sm btn-ghost">
              Quick Add
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}