import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useParams } from 'react-router-dom'
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
  HiOutlineUserGroup,
  HiOutlineUser
} from 'react-icons/hi'
import clsx from 'clsx'
import { useResourceMonitor } from '../../hooks/useResourceMonitor'
import { useAfkDetection } from '../../hooks/useAfkDetection'
import { ProfileCompletionBanner } from '../features/profile/ProfileCompletionBanner'
import { GitHubMonitor } from '../features/github/GitHubMonitor'
import CommandTerminal from '../terminal/CommandTerminal'
// ThemeSwitcher moved to Settings page

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [isHovered, setIsHovered] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const location = useLocation()
  const params = useParams()
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Real-time resource monitoring
  const { stats, formatMemory } = useResourceMonitor()
  
  // AFK detection for automatic status updates
  useAfkDetection({
    afkTimeout: 5 * 60 * 1000, // 5 minutes
    awayTimeout: 15 * 60 * 1000, // 15 minutes
    enabled: true
  })

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  // Listen for terminal open events
  useEffect(() => {
    const handleOpenTerminal = () => {
      setTerminalOpen(true)
    }

    window.addEventListener('open-terminal', handleOpenTerminal)
    
    return () => {
      window.removeEventListener('open-terminal', handleOpenTerminal)
    }
  }, [])

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
    { path: '/profile', label: 'MY PROFILE', icon: HiOutlineUser },
    { path: '/workspaces', label: 'WORKSPACES', icon: HiOutlineBriefcase },
    { path: '/projects', label: 'PROJECTS', icon: HiOutlineFolder },
    { path: '/tasks', label: 'TASKS', icon: HiOutlineClipboardList },
    { path: '/team', label: 'TEAM', icon: HiOutlineUserGroup },
    { path: '/sprints', label: 'SPRINTS', icon: HiOutlinePlay },
    { path: '/meetings', label: 'MEETINGS', icon: HiOutlineCalendar },
    { path: '/settings', label: 'SETTINGS', icon: HiOutlineCog },
  ]

  return (
    <div className="flex h-screen bg-[var(--theme-background)]">
      {/* MOBILE OVERLAY */}
      <div className={clsx(
        'fixed inset-0 z-[40] lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div 
          className="absolute inset-0 bg-[var(--theme-background)]/90"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      {/* BRUTAL SIDEBAR */}
      <aside 
        className={clsx(
          'fixed inset-y-0 left-0 z-[50] bg-[var(--theme-background-secondary)] border-r-2 border-[var(--theme-border)] transform lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isExpanded ? 'w-256px' : 'w-80px',
          // Different transition durations for hover vs button
          isHovered ? 'transition-all duration-200 ease-out' : 'transition-all duration-300 ease-in-out'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* SIDEBAR HEADER */}
        <div className="h-64px px-24px border-b-2 border-[var(--theme-border)] flex items-center justify-between">
          <h1 className={clsx(
            "text-2xl font-bold",
            !isExpanded && "opacity-0",
            isHovered ? "transition-opacity duration-200 ease-out" : "transition-opacity duration-300 ease-in-out"
          )}>
            <span className="text-[var(--theme-foreground)]">LTF1</span>
          </h1>

          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden brutal-hover"
          >
            <HiOutlineX className="w-24px h-24px text-[var(--theme-foreground)]" />
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
                    ? 'bg-[var(--theme-background)] text-[var(--theme-info)] border-l-4 border-[var(--theme-info)] shadow-brutal-sm'
                    : 'text-[var(--theme-foreground)] hover:bg-[var(--theme-hover)] hover:text-[var(--theme-foreground)]',
                  isExpanded && !isActive && 'hover:translate-x-4px',
                  isHovered ? 'transition-all duration-200 ease-out' : 'transition-all duration-300 ease-in-out'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <div className={clsx(
                  "flex items-center flex-1",
                  isExpanded ? "justify-between" : "justify-center"
                )}>
                  <div className="flex items-center">
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
                  </div>
                </div>
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-8px px-8px py-4px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">
                    <span className="text-brutal-xs">{item.label}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>


        {/* GITHUB MONITOR */}
        <GitHubMonitor isExpanded={isExpanded} />

        {/* USER SECTION */}
        <div className={clsx(
          "absolute bottom-0 left-0 right-0 border-t-2 border-[var(--theme-border)]",
          isExpanded ? "p-24px" : "p-16px",
          isHovered ? "transition-all duration-200 ease-out" : "transition-all duration-300 ease-in-out"
        )}>
          <div className={clsx(
            "flex items-center",
            isExpanded ? "gap-16px" : "justify-center",
            isHovered ? "transition-all duration-200 ease-out" : "transition-all duration-300 ease-in-out"
          )}>
            <div className="border-2 border-[var(--theme-border)] p-2">
              <UserButton afterSignOutUrl="/" />
            </div>
            {isExpanded && (
              <div className={clsx(
                isHovered ? "transition-opacity duration-200 ease-out" : "transition-opacity duration-300 ease-in-out"
              )}>
                <p className="text-brutal-xs">USER ACCOUNT</p>
                <p className="text-brutal-xs text-[var(--theme-info)]">ACTIVE</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* BRUTAL HEADER */}
        <header className="h-64px bg-[var(--theme-background-secondary)] border-b-2 border-[var(--theme-border)] flex items-center px-24px gap-16px">
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
            <button 
              className="brutal-btn flex items-center gap-8px"
              onClick={() => setTerminalOpen(true)}
              title="Open Terminal (Ctrl+K)"
            >
              <HiOutlineTerminal className="w-20px h-20px" />
              <span>TERMINAL</span>
            </button>
            <div className="text-brutal-xs">
              <span className="text-[var(--theme-info)]">STATUS:</span> OPERATIONAL
            </div>
          </div>
        </header>

        {/* PROFILE COMPLETION BANNER */}
        <ProfileCompletionBanner />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-[var(--theme-background)]">
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
        <footer className="h-32px bg-[var(--theme-background-secondary)] border-t-2 border-[var(--theme-border)] flex items-center px-24px">
          <div className="flex items-center gap-24px text-brutal-xs font-mono">
            <span className="transition-all duration-200">
              <span className="text-[var(--theme-primary)]">MEM:</span>{' '}
              <span className={clsx(
                "transition-colors duration-300",
                stats.memory.percentage && stats.memory.percentage > 75 ? "text-[var(--theme-error)]" : "text-[var(--theme-foreground)]"
              )}>
                {formatMemory(stats.memory.used)}
              </span>
              {stats.memory.percentage && (
                <span className={clsx(
                  "ml-4px transition-colors duration-300",
                  stats.memory.percentage > 75 ? "text-[var(--theme-error)]/80" : "text-[var(--theme-foreground)]/60"
                )}>
                  ({stats.memory.percentage}%)
                </span>
              )}
            </span>
            
            <span className="transition-all duration-200">
              <span className="text-[var(--theme-info)]">CPU:</span>{' '}
              <span className={clsx(
                "transition-colors duration-300",
                stats.cpu.usage > 70 ? "text-[var(--theme-error)]" : 
                stats.cpu.usage > 40 ? "text-[var(--theme-warning)]" : "text-[var(--theme-foreground)]"
              )}>
                {stats.cpu.usage}%
              </span>
              {stats.cpu.trend !== 'stable' && (
                <span className={clsx(
                  "ml-4px transition-all duration-300",
                  stats.cpu.trend === 'increasing' ? "text-[var(--theme-error)] animate-pulse" : "text-[var(--theme-success)]"
                )}>
                  {stats.cpu.trend === 'increasing' ? '↗' : '↘'}
                </span>
              )}
            </span>
            
            <span className="transition-all duration-200">
              <span className="text-[var(--theme-warning)]">TASKS:</span>{' '}
              <span className="text-[var(--theme-foreground)]">{stats.tasks.total}</span>
              <span className="text-[var(--theme-foreground)]/60 ml-4px">
                ({stats.tasks.active} active)
              </span>
            </span>
            
            <GitHubMonitor 
              workspaceId={params.workspaceId}
              projectId={params.projectId}
              compact={true}
            />
            
            <span className="ml-auto transition-all duration-300">
              <span className={clsx(
                "transition-colors duration-500",
                stats.system.status === 'NOMINAL' ? "text-[var(--theme-success)]" :
                stats.system.status === 'DEGRADED' ? "text-[var(--theme-warning)]" : "text-[var(--theme-error)]"
              )}>
                SYSTEM:
              </span>
              <span className={clsx(
                "ml-4px transition-all duration-500",
                stats.system.status === 'NOMINAL' ? "text-[var(--theme-success)]" :
                stats.system.status === 'DEGRADED' ? "text-[var(--theme-warning)] animate-pulse" : "text-[var(--theme-error)] animate-pulse"
              )}>
                {stats.system.status}
              </span>
              {stats.system.errors > 0 && (
                <span className="text-[var(--theme-error)] ml-4px animate-bounce">
                  ({stats.system.errors} ERR)
                </span>
              )}
              <span className="text-[var(--theme-foreground)]/40 ml-4px text-brutal-xs">
                ↻ {Math.floor(stats.system.uptime / 60)}m
              </span>
            </span>
          </div>
        </footer>
      </div>

      {/* Command Terminal */}
      <CommandTerminal 
        isOpen={terminalOpen} 
        onClose={() => setTerminalOpen(false)} 
      />
    </div>
  )
}