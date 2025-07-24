import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineCode,
  HiOutlineVideoCamera,
  HiOutlineDocumentText,
  HiOutlineTerminal,
  HiOutlineCog,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineBeaker,
  HiOutlineDatabase,
  HiOutlineLightningBolt,
  HiOutlineChartBar
} from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import clsx from 'clsx'

type TabType = 'overview' | 'tasks' | 'team' | 'github' | 'meetings' | 'docs' | 'logs' | 'settings'

interface HealthCard {
  title: string
  status: 'success' | 'warning' | 'error' | 'info'
  value: string | number
  subtitle?: string
  icon: React.ReactNode
}

export default function ProjectManagementPage() {
  const { workspaceId, projectId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const project = useQuery(
    api.projects.queries.getProject,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: <HiOutlineHome className="w-16px h-16px" /> },
    { id: 'tasks', label: 'TASKS', icon: <HiOutlineClipboardList className="w-16px h-16px" /> },
    { id: 'team', label: 'TEAM', icon: <HiOutlineUserGroup className="w-16px h-16px" /> },
    { id: 'github', label: 'GITHUB', icon: <HiOutlineCode className="w-16px h-16px" /> },
    { id: 'meetings', label: 'MEETINGS', icon: <HiOutlineVideoCamera className="w-16px h-16px" /> },
    { id: 'docs', label: 'DOCS', icon: <HiOutlineDocumentText className="w-16px h-16px" /> },
    { id: 'logs', label: 'LOGS', icon: <HiOutlineTerminal className="w-16px h-16px" /> },
    { id: 'settings', label: 'SETTINGS', icon: <HiOutlineCog className="w-16px h-16px" /> },
  ]

  if (!projectId || !workspaceId) {
    navigate('/projects')
    return null
  }

  if (project === undefined) {
    return <LoadingSpinner size="lg" />
  }

  if (!project) {
    return (
      <div className="p-24px">
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <h1 className="text-brutal-xl font-bold uppercase text-brutal-error mb-8px">PROJECT NOT FOUND</h1>
          <p className="font-mono text-brutal-sm">The requested project does not exist or you don't have access.</p>
        </div>
      </div>
    )
  }

  // Mock health data - replace with real queries
  const healthCards: HealthCard[] = [
    {
      title: 'BUILD STATUS',
      status: 'success',
      value: 'PASSING',
      subtitle: 'Last run 5m ago',
      icon: <HiOutlineCheckCircle className="w-20px h-20px" />
    },
    {
      title: 'TESTS',
      status: 'warning',
      value: '142/150',
      subtitle: '8 tests failing',
      icon: <HiOutlineBeaker className="w-20px h-20px" />
    },
    {
      title: 'PR QUEUE',
      status: 'info',
      value: 3,
      subtitle: 'Awaiting review',
      icon: <HiOutlineDatabase className="w-20px h-20px" />
    },
    {
      title: 'BLOCKERS',
      status: 'error',
      value: 2,
      subtitle: 'Critical issues',
      icon: <HiOutlineExclamationCircle className="w-20px h-20px" />
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-brutal-success border-brutal-success bg-brutal-success/10'
      case 'warning': return 'text-brutal-warning border-brutal-warning bg-brutal-warning/10'
      case 'error': return 'text-brutal-error border-brutal-error bg-brutal-error/10'
      case 'info': return 'text-brutal-info border-brutal-info bg-brutal-info/10'
      default: return 'text-primary-brutalist border-basalt-border'
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-24px">
      {/* Project Header */}
      <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-16px mb-8px">
              <h1 className="text-brutal-2xl font-bold uppercase">{project.name}</h1>
              <span className="px-8px py-4px bg-primary-brutalist text-event-horizon font-mono text-brutal-xs uppercase">
                {project.key}
              </span>
              <span className={clsx(
                "px-8px py-4px font-mono text-brutal-xs uppercase",
                project.status === 'active' ? 'bg-brutal-success text-event-horizon' : 'bg-basalt-border text-primary-brutalist'
              )}>
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="text-brutal-sm text-primary-brutalist/80 mb-16px max-w-2xl">{project.description}</p>
            )}
            <div className="flex items-center gap-24px font-mono text-brutal-xs">
              <div>LEAD: {project.lead?.name || 'UNASSIGNED'}</div>
              <div>WORKFLOW: {project.settings.workflowType.toUpperCase()}</div>
              <div>TEAM SIZE: {project.members?.length || 0}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">TASK PROGRESS</div>
            <div className="text-brutal-2xl font-bold">
              {project.tasks ? Math.round((project.tasks.filter((t: any) => t.status === 'done').length / project.tasks.length) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16px">
        {healthCards.map((card) => (
          <div 
            key={card.title}
            className={clsx(
              "border-2 p-16px transition-all",
              getStatusColor(card.status)
            )}
          >
            <div className="flex items-start justify-between mb-8px">
              <h3 className="font-mono text-brutal-xs uppercase">{card.title}</h3>
              {card.icon}
            </div>
            <div className="text-brutal-xl font-bold mb-4px">{card.value}</div>
            {card.subtitle && (
              <div className="font-mono text-brutal-xs opacity-80">{card.subtitle}</div>
            )}
          </div>
        ))}
      </div>

      {/* Sprint Progress */}
      {project.activeSprint && (
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <h2 className="text-brutal-lg font-bold uppercase mb-16px flex items-center gap-8px">
            <HiOutlineLightningBolt className="w-20px h-20px" />
            ACTIVE SPRINT: {project.activeSprint.name}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24px">
            <div>
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-8px">PROGRESS VISUALIZATION</div>
              <div className="h-80px bg-event-horizon border-2 border-basalt-border relative overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary-brutalist transition-all duration-300"
                  style={{ width: '65%' }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-mono text-brutal-sm">
                  65% COMPLETE
                </div>
              </div>
            </div>
            <div className="space-y-8px">
              <div className="flex justify-between font-mono text-brutal-sm">
                <span>DAYS REMAINING:</span>
                <span className="font-bold">7</span>
              </div>
              <div className="flex justify-between font-mono text-brutal-sm">
                <span>STORY POINTS:</span>
                <span className="font-bold">24/40</span>
              </div>
              <div className="flex justify-between font-mono text-brutal-sm">
                <span>VELOCITY:</span>
                <span className="font-bold">3.4 PTS/DAY</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Developer Timeline */}
      <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
        <h2 className="text-brutal-lg font-bold uppercase mb-16px flex items-center gap-8px">
          <HiOutlineClock className="w-20px h-20px" />
          DEVELOPER TIMELINE
        </h2>
        <div className="space-y-8px font-mono text-brutal-sm">
          <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
            <span className="text-brutal-xs text-primary-brutalist/60">10:45</span>
            <span className="text-brutal-success">✓ BUILD PASSED</span>
            <span className="text-primary-brutalist/80">main branch - commit 7a8f9d2</span>
          </div>
          <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
            <span className="text-brutal-xs text-primary-brutalist/60">10:32</span>
            <span className="text-brutal-warning">⚠ TEST FAILURES</span>
            <span className="text-primary-brutalist/80">feature/auth - 8 tests failing</span>
          </div>
          <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
            <span className="text-brutal-xs text-primary-brutalist/60">09:15</span>
            <span className="text-brutal-info">→ PR OPENED</span>
            <span className="text-primary-brutalist/80">#142: Add user authentication</span>
          </div>
          <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
            <span className="text-brutal-xs text-primary-brutalist/60">08:45</span>
            <span className="text-brutal-error">✗ DEPLOY FAILED</span>
            <span className="text-primary-brutalist/80">staging environment - timeout error</span>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
        <h2 className="text-brutal-lg font-bold uppercase mb-16px flex items-center gap-8px">
          <HiOutlineTerminal className="w-20px h-20px" />
          QUICK COMMANDS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8px">
          <button className="p-12px bg-event-horizon border-2 border-basalt-border hover:border-primary-brutalist hover:bg-basalt-border transition-all text-left font-mono text-brutal-sm">
            <div className="text-primary-brutalist">npm run dev</div>
            <div className="text-brutal-xs text-primary-brutalist/60">Start development server</div>
          </button>
          <button className="p-12px bg-event-horizon border-2 border-basalt-border hover:border-primary-brutalist hover:bg-basalt-border transition-all text-left font-mono text-brutal-sm">
            <div className="text-primary-brutalist">npm test</div>
            <div className="text-brutal-xs text-primary-brutalist/60">Run test suite</div>
          </button>
          <button className="p-12px bg-event-horizon border-2 border-basalt-border hover:border-primary-brutalist hover:bg-basalt-border transition-all text-left font-mono text-brutal-sm">
            <div className="text-primary-brutalist">git push origin main</div>
            <div className="text-brutal-xs text-primary-brutalist/60">Deploy to production</div>
          </button>
          <button className="p-12px bg-event-horizon border-2 border-basalt-border hover:border-primary-brutalist hover:bg-basalt-border transition-all text-left font-mono text-brutal-sm">
            <div className="text-primary-brutalist">docker-compose up</div>
            <div className="text-brutal-xs text-primary-brutalist/60">Start containers</div>
          </button>
          <button className="p-12px bg-event-horizon border-2 border-basalt-border hover:border-primary-brutalist hover:bg-basalt-border transition-all text-left font-mono text-brutal-sm">
            <div className="text-primary-brutalist">npm run build</div>
            <div className="text-brutal-xs text-primary-brutalist/60">Build for production</div>
          </button>
          <button className="p-12px bg-event-horizon border-2 border-basalt-border hover:border-primary-brutalist hover:bg-basalt-border transition-all text-left font-mono text-brutal-sm">
            <div className="text-primary-brutalist">npm run lint</div>
            <div className="text-brutal-xs text-primary-brutalist/60">Check code quality</div>
          </button>
        </div>
      </div>

      {/* Active Blockers */}
      <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
        <h2 className="text-brutal-lg font-bold uppercase mb-16px flex items-center gap-8px">
          <HiOutlineExclamationCircle className="w-20px h-20px text-brutal-error" />
          ACTIVE BLOCKERS
        </h2>
        <div className="space-y-12px">
          <div className="border-2 border-brutal-error bg-brutal-error/10 p-16px">
            <div className="flex items-start justify-between mb-8px">
              <h3 className="font-bold text-brutal-error">CRITICAL: Database connection timeout</h3>
              <span className="font-mono text-brutal-xs text-brutal-error">2H AGO</span>
            </div>
            <p className="text-brutal-sm mb-8px">Production database experiencing intermittent connection timeouts. Affecting user authentication.</p>
            <div className="flex items-center gap-16px font-mono text-brutal-xs">
              <span>ASSIGNED: @john.doe</span>
              <span>PRIORITY: P0</span>
              <span>EST: 4H</span>
            </div>
          </div>
          <div className="border-2 border-brutal-warning bg-brutal-warning/10 p-16px">
            <div className="flex items-start justify-between mb-8px">
              <h3 className="font-bold text-brutal-warning">HIGH: Memory leak in worker process</h3>
              <span className="font-mono text-brutal-xs text-brutal-warning">5H AGO</span>
            </div>
            <p className="text-brutal-sm mb-8px">Background worker consuming excessive memory. Requires restart every 6 hours.</p>
            <div className="flex items-center gap-16px font-mono text-brutal-xs">
              <span>ASSIGNED: @jane.smith</span>
              <span>PRIORITY: P1</span>
              <span>EST: 8H</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'tasks':
        return (
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h2 className="text-brutal-lg font-bold uppercase">TASKS COMING SOON</h2>
          </div>
        )
      case 'team':
        return (
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h2 className="text-brutal-lg font-bold uppercase">TEAM MANAGEMENT COMING SOON</h2>
          </div>
        )
      case 'github':
        return (
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h2 className="text-brutal-lg font-bold uppercase">GITHUB INTEGRATION COMING SOON</h2>
          </div>
        )
      case 'meetings':
        return (
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h2 className="text-brutal-lg font-bold uppercase">MEETINGS COMING SOON</h2>
          </div>
        )
      case 'docs':
        return (
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h2 className="text-brutal-lg font-bold uppercase">DOCUMENTATION COMING SOON</h2>
          </div>
        )
      case 'logs':
        return (
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h2 className="text-brutal-lg font-bold uppercase">LOGS COMING SOON</h2>
          </div>
        )
      case 'settings':
        return (
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h2 className="text-brutal-lg font-bold uppercase">PROJECT SETTINGS COMING SOON</h2>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      {/* Tab Navigation */}
      <div className="border-b-2 border-basalt-border bg-carbon-plate">
        <div className="px-24px">
          <div className="flex items-center gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={clsx(
                  "px-20px py-16px flex items-center gap-8px",
                  "font-mono text-brutal-sm uppercase transition-all",
                  "border-b-4",
                  activeTab === tab.id
                    ? "border-primary-brutalist text-primary-brutalist bg-basalt-border/20"
                    : "border-transparent text-primary-brutalist/60 hover:text-primary-brutalist hover:bg-basalt-border/10"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-24px">
        {renderTabContent()}
      </div>
    </div>
  )
}