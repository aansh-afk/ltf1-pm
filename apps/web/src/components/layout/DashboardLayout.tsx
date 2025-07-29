import { useState, useEffect, useRef } from 'react'
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
  HiOutlineTerminal,
  HiOutlinePlay,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineUserGroup
} from 'react-icons/hi'
import clsx from 'clsx'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [isHovered, setIsHovered] = useState(false)
  const location = useLocation()
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Handle hover with delay
  const handleMouseEnter = () => {
    if (isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(true)
      }, 200) // 200ms delay before expanding
    }
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(false) // No delay on hover out
  }

  // Determine if sidebar should be expanded (either not collapsed, or collapsed but hovered)
  const isExpanded = !isCollapsed || isHovered

  // Simplified navigation without workspace dependencies
  const navItems = [
    { path: '/dashboard', label: 'DASHBOARD', icon: HiOutlineHome },
    { path: '/workspaces', label: 'WORKSPACES', icon: HiOutlineBriefcase },
    { path: '/projects', label: 'PROJECTS', icon: HiOutlineFolder },
    { path: '/tasks', label: 'TASKS', icon: HiOutlineClipboardList },
    { path: '/team', label: 'TEAM', icon: HiOutlineUserGroup },
    { path: '/sprints', label: 'SPRINTS', icon: HiOutlinePlay },
    { path: '/meetings', label: 'MEETINGS', icon: HiOutlineCalendar },
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
      <aside 
        className={clsx(
          'fixed inset-y-0 left-0 z-50 bg-carbon-plate border-r-2 border-basalt-border transform lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isExpanded ? 'w-256px' : 'w-80px',
          // Different transition durations for hover vs button
          isHovered ? 'transition-all duration-200 ease-out' : 'transition-all duration-300 ease-in-out'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* SIDEBAR HEADER */}
        <div className="h-64px px-24px border-b-2 border-basalt-border flex items-center justify-between">
          <h1 className={clsx(
            "text-2xl font-bold",
            !isExpanded && "opacity-0",
            isHovered ? "transition-opacity duration-200 ease-out" : "transition-opacity duration-300 ease-in-out"
          )}>
            <span className="text-cathode-white">LTF1</span>
          </h1>

          {/* Mobile close button */}
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
                  'flex items-center text-brutal-sm font-semibold relative group',
                  isExpanded ? 'px-24px' : 'px-0 justify-center',
                  'py-16px',
                  isActive
                    ? 'bg-event-horizon text-[#00FFFF] border-l-4 border-[#00FFFF] shadow-brutal-sm'
                    : 'text-cathode-white hover:bg-event-horizon/50 hover:text-cathode-white',
                  isExpanded && !isActive && 'hover:translate-x-4px',
                  isHovered ? 'transition-all duration-200 ease-out' : 'transition-all duration-300 ease-in-out'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className={clsx(
                  "w-24px h-24px flex-shrink-0",
                  isExpanded && "mr-16px",
                  isHovered ? "transition-all duration-200 ease-out" : "transition-all duration-300 ease-in-out"
                )} />
                <span className={clsx(
                  "whitespace-nowrap",
                  !isExpanded && "hidden",
                  isHovered ? "transition-all duration-200 ease-out" : "transition-all duration-300 ease-in-out"
                )}>
                  {item.label}
                </span>
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-8px px-8px py-4px bg-carbon-plate border-2 border-basalt-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50">
                    <span className="text-brutal-xs">{item.label}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* TERMINAL COMMAND */}
        {isExpanded && (
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
        )}

        {/* USER SECTION */}
        <div className={clsx(
          "absolute bottom-0 left-0 right-0 border-t-2 border-basalt-border",
          isExpanded ? "p-24px" : "p-16px",
          isHovered ? "transition-all duration-200 ease-out" : "transition-all duration-300 ease-in-out"
        )}>
          <div className={clsx(
            "flex items-center",
            isExpanded ? "gap-16px" : "justify-center",
            isHovered ? "transition-all duration-200 ease-out" : "transition-all duration-300 ease-in-out"
          )}>
            <div className="border-2 border-basalt-border p-2">
              <UserButton afterSignOutUrl="/" />
            </div>
            {isExpanded && (
              <div className={clsx(
                isHovered ? "transition-opacity duration-200 ease-out" : "transition-opacity duration-300 ease-in-out"
              )}>
                <p className="text-brutal-xs">USER ACCOUNT</p>
                <p className="text-brutal-xs text-[#00FFFF]">ACTIVE</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* BRUTAL HEADER */}
        <header className="h-64px bg-carbon-plate border-b-2 border-basalt-border flex items-center px-24px gap-16px">
          {/* Desktop hamburger to toggle sidebar */}
          <button
            onClick={() => isCollapsed ? setIsCollapsed(false) : setIsCollapsed(true)}
            className="hidden lg:flex items-center justify-center w-32px h-32px brutal-hover"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <HiOutlineMenuAlt2 className="w-24px h-24px" />
          </button>
          
          {/* Mobile hamburger to open sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden brutal-hover"
          >
            <HiOutlineMenuAlt2 className="w-24px h-24px" />
          </button>
          
          <div className="flex-1 flex items-center justify-center">
            <h2 className="text-brutal-md uppercase">
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