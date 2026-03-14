import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useParams } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { m } from 'framer-motion'
import {
  HiOutlineHome,
  HiOutlineBriefcase,
  HiOutlineFolder,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineMenuAlt2,
  HiOutlineX,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineExclamationCircle
} from 'react-icons/hi'
import clsx from 'clsx'
import { useResourceMonitor } from '@/hooks/useResourceMonitor'
import { useCurrentWorkspace } from '@/hooks/useCurrentWorkspace'
import { useAfkDetection } from '@/hooks/useAfkDetection'
import { ProfileCompletionBanner } from '@/components/features/profile/ProfileCompletionBanner'
import { GitHubMonitor } from '@/components/features/github/GitHubMonitor'
import GlobalSearchModal from '@/components/features/search/GlobalSearchModal'
import WorkspaceMobileBlocker from '@/components/common/WorkspaceMobileBlocker'
import NotificationBell from '@/components/common/NotificationBell'
import FeedbackWidget from '@/components/features/feedback/FeedbackWidget'
import ShortcutHelp from '@/components/shortcuts/ShortcutHelp'
import { useEnsureUser } from '@/hooks/useEnsureUser'


// --- Sub-components ---

interface StatusBarFooterProps {
  stats: {
    memory: { used: number; percentage?: number }
    cpu: { usage: number; trend: string }
    tasks: { total: number; active: number }
    system: { status: string; errors: number; uptime: number }
  }
  formatMemory: (bytes: number) => string
  workspaceId?: string
  projectId?: string
}

function StatusBarFooter({ stats, formatMemory, workspaceId, projectId }: StatusBarFooterProps) {
  return (
    <footer className="h-[28px] bg-[var(--theme-background-secondary)] border-t border-[var(--theme-border)] flex items-center px-[12px] shrink-0">
      <div className="flex items-center gap-[16px] text-[11px] font-mono w-full">
        <span>
          <span className="text-[var(--theme-primary)]">MEM:</span>{' '}
          <span className={clsx(
            stats.memory.percentage && stats.memory.percentage > 75 ? "text-[var(--theme-error)]" : "text-[var(--theme-foreground)]/60"
          )}>
            {formatMemory(stats.memory.used)}
          </span>
          {stats.memory.percentage && (
            <span className={clsx(
              "ml-[2px]",
              stats.memory.percentage > 75 ? "text-[var(--theme-error)]/80" : "text-[var(--theme-foreground)]/40"
            )}>
              ({stats.memory.percentage}%)
            </span>
          )}
        </span>

        <span>
          <span className="text-[var(--theme-info)]">CPU:</span>{' '}
          <span className={clsx(
            stats.cpu.usage > 70 ? "text-[var(--theme-error)]" :
              stats.cpu.usage > 40 ? "text-[var(--theme-warning)]" : "text-[var(--theme-foreground)]/60"
          )}>
            {stats.cpu.usage}%
          </span>
          {stats.cpu.trend !== 'stable' && (
            <span className={clsx(
              "ml-[2px]",
              stats.cpu.trend === 'increasing' ? "text-[var(--theme-error)]" : "text-[var(--theme-success)]"
            )}>
              {stats.cpu.trend === 'increasing' ? '\u2197' : '\u2198'}
            </span>
          )}
        </span>

        <span>
          <span className="text-[var(--theme-warning)]">TASKS:</span>{' '}
          <span className="text-[var(--theme-foreground)]/60">{stats.tasks.total}</span>
          <span className="text-[var(--theme-foreground)]/40 ml-[2px]">
            ({stats.tasks.active})
          </span>
        </span>

        <GitHubMonitor
          workspaceId={workspaceId}
          projectId={projectId}
          compact={true}
        />

        <span className="ml-auto">
          <span className={clsx(
            stats.system.status === 'NOMINAL' ? "text-[var(--theme-success)]" :
              stats.system.status === 'DEGRADED' ? "text-[var(--theme-warning)]" : "text-[var(--theme-error)]"
          )}>
            SYS:
          </span>
          <span className={clsx(
            "ml-[2px]",
            stats.system.status === 'NOMINAL' ? "text-[var(--theme-success)]" :
              stats.system.status === 'DEGRADED' ? "text-[var(--theme-warning)]" : "text-[var(--theme-error)]"
          )}>
            {stats.system.status === 'NOMINAL' ? 'OK' : stats.system.status}
          </span>
          {stats.system.errors > 0 && (
            <span className="text-[var(--theme-error)] ml-[2px]">
              ({stats.system.errors})
            </span>
          )}
          <span className="text-[var(--theme-foreground)]/30 ml-[4px]">
            {Math.floor(stats.system.uptime / 60)}m
          </span>
        </span>
      </div>
    </footer>
  )
}

// --- Main component ---

const NAV_ITEMS = [
  { path: '/dashboard', label: 'DASHBOARD', icon: HiOutlineHome },
  { path: '/profile', label: 'MY PROFILE', icon: HiOutlineUser },
  { path: '/workspaces', label: 'WORKSPACES', icon: HiOutlineBriefcase },
  { path: '/projects', label: 'PROJECTS', icon: HiOutlineFolder },
  { path: '/tasks', label: 'TASKS', icon: HiOutlineClipboardList },
  { path: '/team', label: 'TEAM', icon: HiOutlineUserGroup },
  { path: '/sprints', label: 'SPRINTS', icon: HiOutlineRefresh },
  { path: '/pages', label: 'PAGES', icon: HiOutlineDocumentText },
  { path: '/settings', label: 'SETTINGS', icon: HiOutlineCog },
] as const

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const params = useParams()

  const { stats, formatMemory } = useResourceMonitor()
  const { currentWorkspaceId } = useCurrentWorkspace()

  useAfkDetection({
    afkTimeout: 5 * 60 * 1000,
    awayTimeout: 15 * 60 * 1000,
    enabled: true
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  // Listen for toggle-sidebar shortcut (Ctrl+B)
  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsCollapsed(prev => !prev)
    }
    window.addEventListener('toggle-sidebar' as any, handleToggleSidebar)
    return () => window.removeEventListener('toggle-sidebar' as any, handleToggleSidebar)
  }, [])

  const isExpanded = !isCollapsed
  const { user } = useEnsureUser()
  const isAdmin = user?.role === 'admin'

  const navItems = isAdmin
    ? [...NAV_ITEMS, { path: '/admin/bugs' as const, label: 'BUG REPORTS' as const, icon: HiOutlineExclamationCircle }]
    : [...NAV_ITEMS]

  return (
    <div className="flex h-screen bg-[var(--theme-background)]">
      {/* MOBILE OVERLAY */}
      <div className={clsx(
        'fixed inset-0 z-[40] lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <button
          type="button"
          className="absolute inset-0 bg-[var(--theme-background)]/90 w-full h-full"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      </div>

      {/* SIDEBAR */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-[50] bg-[var(--theme-background-secondary)] border-r border-[var(--theme-border)] transform lg:relative lg:translate-x-0 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isExpanded ? 'w-[220px]' : 'w-[48px]',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]'
        )}
      >
        {/* SIDEBAR HEADER */}
        <div className="h-[40px] px-[12px] border-b border-[var(--theme-border)] flex items-center justify-between shrink-0">
          <h1 className={clsx(
            "text-[13px] font-bold tracking-wide",
            !isExpanded && "opacity-0",
            "transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          )}>
            <span className="text-[var(--theme-foreground)]">LTF1</span>
          </h1>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden brutal-hover"
          >
            <HiOutlineX className="w-4 h-4 text-[var(--theme-foreground)]" />
          </button>
        </div>

        {/* NAV ITEMS */}
        <nav className="py-[6px] flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center text-[12px] font-medium relative group',
                  isExpanded ? 'px-[12px]' : 'px-0 justify-center',
                  'py-[6px] mx-[4px]',
                  isActive
                    ? 'bg-[var(--theme-background)] text-[var(--theme-info)] border-l-2 border-[var(--theme-info)]'
                    : 'text-[var(--theme-foreground)]/70 hover:bg-[var(--theme-hover)] hover:text-[var(--theme-foreground)]',
                  'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <div className={clsx(
                  "flex items-center flex-1",
                  isExpanded ? "justify-between" : "justify-center"
                )}>
                  <div className="flex items-center">
                    <Icon className={clsx(
                      "w-4 h-4 flex-shrink-0",
                      isExpanded && "mr-[8px]",
                      "transition-all duration-200 ease-in-out"
                    )} />
                    <span className={clsx(
                      "whitespace-nowrap tracking-wide",
                      !isExpanded && "hidden",
                      "transition-all duration-200 ease-in-out"
                    )}>
                      {item.label}
                    </span>
                  </div>
                </div>

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-[6px] px-[6px] py-[3px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-100 whitespace-nowrap z-[60]">
                    <span className="text-[11px]">{item.label}</span>
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
          "border-t border-[var(--theme-border)] shrink-0",
          isExpanded ? "p-[10px]" : "p-[8px]",
          "transition-all duration-200 ease-in-out"
        )}>
          <div className={clsx(
            "flex items-center",
            isExpanded ? "gap-[8px]" : "justify-center",
            "transition-all duration-200 ease-in-out"
          )}>
            <div className="border border-[var(--theme-border)] p-[1px]">
              <UserButton afterSignOutUrl="/" />
            </div>
            {isExpanded && (
              <div className={clsx(
                "transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              )}>
                <p className="text-[11px] text-[var(--theme-foreground)]/60">ACCOUNT</p>
                <p className="text-[11px] text-[var(--theme-info)]">ACTIVE</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-[40px] bg-[var(--theme-background-secondary)] border-b border-[var(--theme-border)] flex items-center px-[12px] gap-[8px] shrink-0">
          {/* Desktop hamburger */}
          <button
            onClick={() => isCollapsed ? setIsCollapsed(false) : setIsCollapsed(true)}
            className="hidden lg:flex items-center justify-center w-[28px] h-[28px] brutal-hover"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <HiOutlineMenuAlt2 className="w-4 h-4" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden brutal-hover"
          >
            <HiOutlineMenuAlt2 className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center justify-center">
            <h2 className="text-[12px] uppercase tracking-wider font-medium text-[var(--theme-foreground)]/70">
              {navItems.find(item => item.path === location.pathname)?.label || 'DASHBOARD'}
            </h2>
          </div>

          <div className="flex items-center gap-[6px]">
            <button
              className="flex items-center gap-[4px] px-[8px] py-[4px] text-[11px] border border-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
              onClick={() => setSearchOpen(true)}
              title="Global Search (Ctrl+K or /)"
            >
              <HiOutlineSearch className="w-[14px] h-[14px]" />
              <span className="hidden sm:inline">SEARCH</span>
            </button>
            <NotificationBell workspaceId={currentWorkspaceId as any} />
            <div className="text-[11px] hidden md:block">
              <span className="text-[var(--theme-info)]">STATUS:</span>{' '}
              <span className="text-[var(--theme-foreground)]/60">OK</span>
            </div>
          </div>
        </header>

        {/* PROFILE COMPLETION BANNER */}
        <ProfileCompletionBanner />

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-[var(--theme-background)]">
          <m.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full"
          >
              <WorkspaceMobileBlocker>
                <Outlet />
              </WorkspaceMobileBlocker>
          </m.div>
        </main>

        {/* STATUS BAR */}
        <StatusBarFooter
          stats={stats}
          formatMemory={formatMemory}
          workspaceId={params.workspaceId}
          projectId={params.projectId}
        />
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Feedback Widget */}
      <FeedbackWidget />

      {/* Keyboard Shortcut Help Modal */}
      <ShortcutHelp />
    </div>
  )
}
