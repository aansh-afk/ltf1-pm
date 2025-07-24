import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
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
  HiOutlineChartBar,
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineBan,
  HiOutlineLink,
  HiOutlineUser,
  HiOutlineDotsVertical,
  HiOutlineArrowRight,
  HiOutlineChat
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

type TaskViewType = 'sprint' | 'kanban' | 'list'

export default function ProjectManagementPage() {
  const { workspaceId, projectId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [taskView, setTaskView] = useState<TaskViewType>('sprint')
  const [showMyTasks, setShowMyTasks] = useState(false)
  const [currentContext, setCurrentContext] = useState<string | null>(null)

  const project = useQuery(
    api.projects.queries.getProject,
    projectId ? { projectId: projectId as any } : 'skip'
  )
  
  // Query tasks for this project - moved here to follow hooks rules
  const tasks = useQuery(
    api.tasks.queries.getProjectTasks,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          if (activeTab === 'tasks') {
            // TODO: Open new task modal
            console.log('New task shortcut')
          }
          break
        case 'm':
          if (activeTab === 'tasks') {
            setShowMyTasks(!showMyTasks)
          }
          break
        case 't':
          if (activeTab === 'tasks') {
            // TODO: Toggle timer on selected task
            console.log('Toggle timer shortcut')
          }
          break
        case 'b':
          if (activeTab === 'tasks') {
            // TODO: Mark selected task as blocked
            console.log('Block task shortcut')
          }
          break
        case '/':
          if (activeTab === 'tasks') {
            e.preventDefault()
            // TODO: Focus search input
            console.log('Search shortcut')
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (activeTab === 'tasks') {
            // TODO: Switch to column by number
            console.log(`Switch to column ${e.key}`)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [activeTab, showMyTasks])

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

  const renderTasksTab = () => {
    const activeSprint = project?.activeSprint

    // Mock task columns data - replace with real data
    const taskColumns = {
      backlog: tasks?.filter((t: any) => t.status === 'backlog') || [],
      todo: tasks?.filter((t: any) => t.status === 'todo') || [],
      in_progress: tasks?.filter((t: any) => t.status === 'in_progress') || [],
      review: tasks?.filter((t: any) => t.status === 'review') || [],
      done: tasks?.filter((t: any) => t.status === 'done') || []
    }

    const sprintProgress = activeSprint ? {
      totalTasks: 25,
      completedTasks: 8,
      percentage: 32,
      velocity: 3.2,
      daysLeft: 8,
      blockedTasks: 3,
      inReview: 4
    } : null

    return (
      <div className="space-y-24px">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-16px">
            <button className="brutal-btn flex items-center gap-8px">
              <HiOutlinePlus className="w-16px h-16px" />
              NEW TASK
            </button>
            
            <button className="brutal-btn-secondary flex items-center gap-8px">
              <HiOutlineFilter className="w-16px h-16px" />
              QUICK FILTERS
            </button>
            
            <div className="flex items-center bg-carbon-plate border-2 border-basalt-border">
              <button 
                onClick={() => setTaskView('sprint')}
                className={clsx(
                  "px-16px py-8px font-mono text-brutal-xs uppercase transition-colors",
                  taskView === 'sprint' ? "bg-primary-brutalist text-event-horizon" : "text-primary-brutalist/60 hover:text-primary-brutalist"
                )}
              >
                SPRINT
              </button>
              <button 
                onClick={() => setTaskView('kanban')}
                className={clsx(
                  "px-16px py-8px font-mono text-brutal-xs uppercase transition-colors border-x-2 border-basalt-border",
                  taskView === 'kanban' ? "bg-primary-brutalist text-event-horizon" : "text-primary-brutalist/60 hover:text-primary-brutalist"
                )}
              >
                KANBAN
              </button>
              <button 
                onClick={() => setTaskView('list')}
                className={clsx(
                  "px-16px py-8px font-mono text-brutal-xs uppercase transition-colors",
                  taskView === 'list' ? "bg-primary-brutalist text-event-horizon" : "text-primary-brutalist/60 hover:text-primary-brutalist"
                )}
              >
                LIST
              </button>
            </div>
            
            <button 
              onClick={() => setShowMyTasks(!showMyTasks)}
              className={clsx(
                "brutal-btn-secondary flex items-center gap-8px",
                showMyTasks && "bg-primary-brutalist text-event-horizon border-primary-brutalist"
              )}
            >
              <HiOutlineUser className="w-16px h-16px" />
              MY TASKS
            </button>
          </div>
          
          <div className="flex items-center gap-16px font-mono text-brutal-sm">
            <span className="text-primary-brutalist/60">CONTEXT:</span>
            <span className="text-primary-brutalist font-bold">{currentContext || 'NONE'}</span>
          </div>
        </div>

        {/* Sprint Metrics Bar */}
        {sprintProgress && (
          <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
            <div className="flex items-center justify-between mb-12px">
              <div className="flex items-center gap-24px font-mono text-brutal-sm">
                <span>VELOCITY: <span className="font-bold text-primary-brutalist">{sprintProgress.velocity}/day</span></span>
                <span>COMPLETE: <span className="font-bold text-brutal-success">{sprintProgress.percentage}%</span></span>
                <span>BLOCKED: <span className="font-bold text-brutal-error">{sprintProgress.blockedTasks}</span></span>
                <span>IN REVIEW: <span className="font-bold text-brutal-info">{sprintProgress.inReview}</span></span>
              </div>
              <span className="font-mono text-brutal-sm text-primary-brutalist/60">
                {sprintProgress.daysLeft} DAYS LEFT
              </span>
            </div>
            <div className="w-full h-8px bg-basalt-border">
              <div 
                className="h-full bg-primary-brutalist transition-all duration-300"
                style={{ width: `${sprintProgress.percentage}%` }}
              />
            </div>
            <div className="mt-8px font-mono text-brutal-xs text-primary-brutalist/60">
              {sprintProgress.completedTasks}/{sprintProgress.totalTasks} tasks
            </div>
          </div>
        )}

        {/* Task Board */}
        {taskView === 'sprint' && (
          <div className="bg-carbon-plate border-2 border-basalt-border">
            {/* Sprint Header */}
            {activeSprint && (
              <div className="p-16px border-b-2 border-basalt-border flex items-center justify-between">
                <h3 className="font-mono text-brutal-sm uppercase">
                  SPRINT {activeSprint.number}: {activeSprint.name} ({sprintProgress?.daysLeft} DAYS LEFT)
                </h3>
                <div className="flex items-center gap-8px">
                  <button className="text-brutal-xs font-mono uppercase text-primary-brutalist/60 hover:text-primary-brutalist">
                    COLLAPSE
                  </button>
                  <button className="text-brutal-xs font-mono uppercase text-brutal-success hover:text-brutal-success/80">
                    COMPLETE SPRINT
                  </button>
                </div>
              </div>
            )}
            
            {/* Task Columns */}
            <div className="flex divide-x-2 divide-basalt-border">
              {Object.entries({
                backlog: { label: 'BACKLOG', color: 'text-primary-brutalist/60' },
                todo: { label: 'TODO', color: 'text-primary-brutalist' },
                in_progress: { label: 'IN PROGRESS', color: 'text-brutal-info' },
                review: { label: 'REVIEW', color: 'text-brutal-warning' },
                done: { label: 'DONE', color: 'text-brutal-success' }
              }).map(([status, config]) => (
                <div key={status} className="flex-1 min-w-256px">
                  <div className="p-16px border-b-2 border-basalt-border">
                    <h4 className={clsx("font-mono text-brutal-sm uppercase", config.color)}>
                      {config.label} ({taskColumns[status as keyof typeof taskColumns].length})
                    </h4>
                  </div>
                  <div className="p-16px space-y-12px min-h-400px">
                    {taskColumns[status as keyof typeof taskColumns].map((task: any) => (
                      <TaskCard key={task._id} task={task} onContextSwitch={setCurrentContext} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Backlog Section */}
            <div className="border-t-2 border-basalt-border p-16px">
              <button className="font-mono text-brutal-sm uppercase text-primary-brutalist/60 hover:text-primary-brutalist flex items-center gap-8px">
                BACKLOG (NO SPRINT) - 23 TASKS
                <HiOutlineArrowRight className="w-16px h-16px" />
              </button>
            </div>
          </div>
        )}

        {/* Task Activity Timeline */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <div className="flex items-center justify-between mb-16px">
            <h3 className="font-mono text-brutal-sm uppercase">TASK ACTIVITY FEED</h3>
            <button className="text-brutal-xs font-mono uppercase text-primary-brutalist/60 hover:text-primary-brutalist">
              FILTER ▼
            </button>
          </div>
          <div className="space-y-8px font-mono text-brutal-sm">
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">10:45</span>
              <span className="text-brutal-info">TASK-445</span>
              <span className="text-primary-brutalist/80">Branch created: feature/task-445-auth-middleware</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">10:32</span>
              <span className="text-brutal-info">TASK-445</span>
              <span className="text-primary-brutalist/80">Timer started (current: 2:34:15)</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">09:15</span>
              <span className="text-brutal-info">TASK-443</span>
              <span className="text-primary-brutalist/80">PR #142 opened - awaiting review</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">08:45</span>
              <span className="text-brutal-info">TASK-441</span>
              <span className="text-primary-brutalist/80">Deployed to staging</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Task Card Component
  const TaskCard = ({ task, onContextSwitch }: any) => {
    return (
      <div className="bg-event-horizon border-2 border-basalt-border p-12px hover:border-primary-brutalist hover:shadow-brutal-sm transition-all cursor-move">
        <div className="flex items-start justify-between mb-8px">
          <div className="flex items-center gap-8px">
            <span className="font-mono text-brutal-xs font-bold">{task.key || 'TASK-' + task.number}</span>
            {task.isBlocked && <HiOutlineBan className="w-14px h-14px text-brutal-error" />}
            {task.timeSpent > 0 && <HiOutlineClock className="w-14px h-14px text-brutal-info" />}
            {task.prNumber && <HiOutlineLink className="w-14px h-14px text-brutal-success" />}
          </div>
          <button className="hover:bg-basalt-border/20 p-2px">
            <HiOutlineDotsVertical className="w-16px h-16px text-primary-brutalist/60" />
          </button>
        </div>
        
        <h4 className="text-brutal-sm mb-8px line-clamp-2">{task.title}</h4>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8px">
            {task.assigneeId && (
              <div className="w-24px h-24px bg-primary-brutalist border-2 border-basalt-border flex items-center justify-center">
                <span className="text-brutal-xs font-bold text-event-horizon">JD</span>
              </div>
            )}
            <span className="font-mono text-brutal-xs text-primary-brutalist/60">{task.points || 0} pts</span>
          </div>
          
          {task.status === 'in_progress' && task.timeTracking?.isRunning && (
            <button 
              onClick={() => onContextSwitch(task.key || `TASK-${task.number}`)}
              className="text-brutal-xs font-mono text-brutal-info hover:text-brutal-info/80"
            >
              ▶ 2:34:15
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderTeamTab = () => {
    const members = project?.members || []
    
    // Mock data for demonstration - replace with real data
    const memberStats = members.map((member: any) => ({
      ...member,
      tasksAssigned: 12,
      tasksCompleted: 8,
      tasksInProgress: 3,
      tasksBlocked: 1,
      pullRequests: 5,
      commits: 28,
      hoursTracked: 32.5,
      productivity: 85,
      lastActive: '2 hours ago'
    }))

    const workloadData = {
      labels: members.map((m: any) => m.name?.split(' ')[0] || 'Unknown'),
      values: [8, 12, 6, 15, 9, 11, 7],
      max: 20
    }

    return (
      <div className="space-y-24px">
        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16px">
          <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
            <div className="flex items-center justify-between mb-8px">
              <HiOutlineUserGroup className="w-20px h-20px text-primary-brutalist" />
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">TEAM SIZE</span>
            </div>
            <div className="text-brutal-2xl font-bold">{members.length}</div>
            <div className="font-mono text-brutal-xs text-primary-brutalist/60">MEMBERS</div>
          </div>
          
          <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
            <div className="flex items-center justify-between mb-8px">
              <HiOutlineClipboardList className="w-20px h-20px text-brutal-info" />
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">ACTIVE TASKS</span>
            </div>
            <div className="text-brutal-2xl font-bold">47</div>
            <div className="font-mono text-brutal-xs text-primary-brutalist/60">ACROSS TEAM</div>
          </div>
          
          <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
            <div className="flex items-center justify-between mb-8px">
              <HiOutlineClock className="w-20px h-20px text-brutal-warning" />
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">HOURS TRACKED</span>
            </div>
            <div className="text-brutal-2xl font-bold">186</div>
            <div className="font-mono text-brutal-xs text-primary-brutalist/60">THIS WEEK</div>
          </div>
          
          <div className="bg-carbon-plate border-2 border-basalt-border p-16px">
            <div className="flex items-center justify-between mb-8px">
              <HiOutlineChartBar className="w-20px h-20px text-brutal-success" />
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">PRODUCTIVITY</span>
            </div>
            <div className="text-brutal-2xl font-bold">92%</div>
            <div className="font-mono text-brutal-xs text-primary-brutalist/60">AVG VELOCITY</div>
          </div>
        </div>

        {/* Workload Distribution */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <h3 className="text-brutal-lg font-bold uppercase mb-16px">WORKLOAD DISTRIBUTION</h3>
          <div className="space-y-12px">
            {workloadData.labels.map((label: string, index: number) => (
              <div key={label} className="flex items-center gap-16px">
                <div className="w-80px font-mono text-brutal-sm text-primary-brutalist/80">{label.toUpperCase()}</div>
                <div className="flex-1 h-24px bg-basalt-border relative">
                  <div 
                    className={clsx(
                      "absolute inset-y-0 left-0 transition-all duration-300",
                      workloadData.values[index] > 15 ? "bg-brutal-error" : 
                      workloadData.values[index] > 10 ? "bg-brutal-warning" : "bg-brutal-success"
                    )}
                    style={{ width: `${(workloadData.values[index] / workloadData.max) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-8px">
                    <span className="font-mono text-brutal-xs font-bold">
                      {workloadData.values[index]} TASKS
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16px font-mono text-brutal-xs text-primary-brutalist/60">
            CAPACITY WARNING: MEMBERS WITH &gt;15 TASKS MAY BE OVERLOADED
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16px">
          {memberStats.map((member: any) => (
            <div key={member._id} className="bg-carbon-plate border-2 border-basalt-border p-20px hover:border-primary-brutalist transition-all">
              <div className="flex items-start justify-between mb-16px">
                <div className="flex items-center gap-12px">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-48px h-48px border-2 border-basalt-border" />
                  ) : (
                    <div className="w-48px h-48px bg-primary-brutalist border-2 border-basalt-border flex items-center justify-center">
                      <span className="text-brutal-lg font-bold text-event-horizon">
                        {member.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold uppercase">{member.name || 'UNKNOWN'}</h4>
                    <p className="font-mono text-brutal-xs text-primary-brutalist/60">
                      {member.role?.toUpperCase() || 'DEVELOPER'}
                    </p>
                  </div>
                </div>
                <button className="p-4px hover:bg-basalt-border/20">
                  <HiOutlineDotsVertical className="w-16px h-16px text-primary-brutalist/60" />
                </button>
              </div>

              <div className="space-y-8px mb-16px">
                <div className="flex justify-between font-mono text-brutal-xs">
                  <span className="text-primary-brutalist/60">ASSIGNED:</span>
                  <span className="font-bold">{member.tasksAssigned}</span>
                </div>
                <div className="flex justify-between font-mono text-brutal-xs">
                  <span className="text-primary-brutalist/60">IN PROGRESS:</span>
                  <span className="font-bold text-brutal-info">{member.tasksInProgress}</span>
                </div>
                <div className="flex justify-between font-mono text-brutal-xs">
                  <span className="text-primary-brutalist/60">COMPLETED:</span>
                  <span className="font-bold text-brutal-success">{member.tasksCompleted}</span>
                </div>
                {member.tasksBlocked > 0 && (
                  <div className="flex justify-between font-mono text-brutal-xs">
                    <span className="text-primary-brutalist/60">BLOCKED:</span>
                    <span className="font-bold text-brutal-error">{member.tasksBlocked}</span>
                  </div>
                )}
              </div>

              <div className="pt-16px border-t-2 border-basalt-border">
                <div className="flex items-center justify-between mb-8px">
                  <div className="font-mono text-brutal-xs">
                    <span className="text-primary-brutalist/60">PRODUCTIVITY: </span>
                    <span className={clsx(
                      "font-bold",
                      member.productivity >= 90 ? "text-brutal-success" :
                      member.productivity >= 70 ? "text-brutal-warning" : "text-brutal-error"
                    )}>
                      {member.productivity}%
                    </span>
                  </div>
                  <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                    {member.lastActive}
                  </div>
                </div>
                
                <div className="flex items-center gap-8px">
                  <div className="flex-1 h-4px bg-basalt-border">
                    <div 
                      className={clsx(
                        "h-full transition-all duration-300",
                        member.productivity >= 90 ? "bg-brutal-success" :
                        member.productivity >= 70 ? "bg-brutal-warning" : "bg-brutal-error"
                      )}
                      style={{ width: `${member.productivity}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8px mt-16px">
                <button className="brutal-btn-sm flex-1">VIEW TASKS</button>
                <button className="brutal-btn-sm bg-basalt-border border-basalt-border">REASSIGN</button>
              </div>
            </div>
          ))}
        </div>

        {/* Team Activity Timeline */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <div className="flex items-center justify-between mb-16px">
            <h3 className="text-brutal-lg font-bold uppercase">TEAM ACTIVITY</h3>
            <div className="flex items-center gap-16px">
              <button className="font-mono text-brutal-xs uppercase text-primary-brutalist/60 hover:text-primary-brutalist">
                TODAY ▼
              </button>
              <button className="font-mono text-brutal-xs uppercase text-primary-brutalist/60 hover:text-primary-brutalist">
                FILTER ▼
              </button>
            </div>
          </div>
          
          <div className="space-y-8px font-mono text-brutal-sm">
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">14:32</span>
              <div className="w-24px h-24px bg-brutal-success border-2 border-basalt-border flex items-center justify-center">
                <span className="text-brutal-xs font-bold text-event-horizon">JD</span>
              </div>
              <span className="text-primary-brutalist">JOHN DOE</span>
              <span className="text-primary-brutalist/80">completed TASK-445: Implement auth middleware</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">13:15</span>
              <div className="w-24px h-24px bg-brutal-info border-2 border-basalt-border flex items-center justify-center">
                <span className="text-brutal-xs font-bold text-event-horizon">AS</span>
              </div>
              <span className="text-primary-brutalist">ALICE SMITH</span>
              <span className="text-primary-brutalist/80">opened PR #156: Add user profile API</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">11:45</span>
              <div className="w-24px h-24px bg-brutal-warning border-2 border-basalt-border flex items-center justify-center">
                <span className="text-brutal-xs font-bold text-event-horizon">RJ</span>
              </div>
              <span className="text-primary-brutalist">ROBERT JONES</span>
              <span className="text-primary-brutalist/80">started timer on TASK-448: Debug memory leak</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">10:20</span>
              <div className="w-24px h-24px bg-brutal-error border-2 border-basalt-border flex items-center justify-center">
                <span className="text-brutal-xs font-bold text-event-horizon">MB</span>
              </div>
              <span className="text-primary-brutalist">MARIA BROWN</span>
              <span className="text-primary-brutalist/80">marked TASK-442 as blocked: API dependency</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">09:30</span>
              <div className="w-24px h-24px bg-primary-brutalist border-2 border-basalt-border flex items-center justify-center">
                <span className="text-brutal-xs font-bold text-event-horizon">TW</span>
              </div>
              <span className="text-primary-brutalist">TOM WILSON</span>
              <span className="text-primary-brutalist/80">joined the project team</span>
            </div>
          </div>
          
          <button className="mt-16px font-mono text-brutal-xs uppercase text-primary-brutalist/60 hover:text-primary-brutalist">
            LOAD MORE →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <h3 className="text-brutal-lg font-bold uppercase mb-16px">QUICK ACTIONS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12px">
            <button className="brutal-btn flex items-center justify-center gap-8px">
              <HiOutlinePlus className="w-16px h-16px" />
              ADD MEMBER
            </button>
            <button className="brutal-btn-secondary flex items-center justify-center gap-8px">
              <HiOutlineUserGroup className="w-16px h-16px" />
              BULK REASSIGN
            </button>
            <button className="brutal-btn-secondary flex items-center justify-center gap-8px">
              <HiOutlineChartBar className="w-16px h-16px" />
              EXPORT REPORT
            </button>
            <button className="brutal-btn-secondary flex items-center justify-center gap-8px">
              <HiOutlineCog className="w-16px h-16px" />
              TEAM SETTINGS
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderGitHubTab = () => {
    // Mock data for demonstration - replace with real GitHub API data
    const repository = project?.repository || {
      provider: 'github',
      url: 'https://github.com/org/project',
      defaultBranch: 'main'
    }

    const pullRequests = [
      {
        id: 1,
        number: 156,
        title: 'feat: Add user authentication middleware',
        author: 'john.doe',
        status: 'open',
        draft: false,
        reviewStatus: 'approved',
        checks: { passed: 8, failed: 0, pending: 2 },
        comments: 12,
        additions: 245,
        deletions: 78,
        createdAt: '2 hours ago',
        labels: ['feature', 'security']
      },
      {
        id: 2,
        number: 155,
        title: 'fix: Memory leak in background worker',
        author: 'jane.smith',
        status: 'open',
        draft: false,
        reviewStatus: 'changes_requested',
        checks: { passed: 6, failed: 2, pending: 2 },
        comments: 8,
        additions: 45,
        deletions: 12,
        createdAt: '5 hours ago',
        labels: ['bug', 'critical']
      },
      {
        id: 3,
        number: 154,
        title: 'chore: Update dependencies',
        author: 'alice.jones',
        status: 'open',
        draft: true,
        reviewStatus: 'pending',
        checks: { passed: 10, failed: 0, pending: 0 },
        comments: 2,
        additions: 1245,
        deletions: 876,
        createdAt: '1 day ago',
        labels: ['dependencies']
      }
    ]

    const branches = [
      { name: 'main', isDefault: true, ahead: 0, behind: 0, lastCommit: '10 minutes ago' },
      { name: 'develop', isDefault: false, ahead: 12, behind: 3, lastCommit: '1 hour ago' },
      { name: 'feature/auth', isDefault: false, ahead: 8, behind: 0, lastCommit: '2 hours ago' },
      { name: 'fix/memory-leak', isDefault: false, ahead: 3, behind: 5, lastCommit: '5 hours ago' },
      { name: 'feature/api-v2', isDefault: false, ahead: 45, behind: 12, lastCommit: '3 days ago' }
    ]

    const codeReviewStats = {
      averageTime: '4.2h',
      pendingReviews: 8,
      completedThisWeek: 23,
      topReviewers: [
        { name: 'John Doe', reviews: 12, avgTime: '2.1h' },
        { name: 'Jane Smith', reviews: 8, avgTime: '3.5h' },
        { name: 'Bob Wilson', reviews: 5, avgTime: '6.2h' }
      ]
    }

    const ciPipeline = [
      { name: 'Build', status: 'success', duration: '2m 15s', timestamp: '10 minutes ago' },
      { name: 'Test', status: 'success', duration: '5m 32s', timestamp: '8 minutes ago' },
      { name: 'Lint', status: 'success', duration: '1m 12s', timestamp: '3 minutes ago' },
      { name: 'Deploy (Staging)', status: 'running', duration: '---', timestamp: 'In progress' }
    ]

    return (
      <div className="space-y-24px">
        {/* Repository Overview */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <div className="flex items-center justify-between mb-16px">
            <div className="flex items-center gap-16px">
              <HiOutlineCode className="w-24px h-24px text-primary-brutalist" />
              <div>
                <h2 className="text-brutal-lg font-bold uppercase">{repository.provider.toUpperCase()} REPOSITORY</h2>
                <p className="font-mono text-brutal-xs text-primary-brutalist/60">{repository.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-12px">
              <button className="brutal-btn-sm">CLONE</button>
              <button className="brutal-btn-sm">OPEN IN GITHUB</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16px">
            <div className="border-2 border-basalt-border p-16px">
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">DEFAULT BRANCH</div>
              <div className="font-bold">{repository.defaultBranch}</div>
            </div>
            <div className="border-2 border-basalt-border p-16px">
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">OPEN PRS</div>
              <div className="font-bold text-brutal-info">{pullRequests.filter(pr => pr.status === 'open').length}</div>
            </div>
            <div className="border-2 border-basalt-border p-16px">
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">ACTIVE BRANCHES</div>
              <div className="font-bold">{branches.length}</div>
            </div>
            <div className="border-2 border-basalt-border p-16px">
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">CI STATUS</div>
              <div className="font-bold text-brutal-success">PASSING</div>
            </div>
          </div>
        </div>

        {/* Pull Request Queue */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <div className="flex items-center justify-between mb-16px">
            <h3 className="text-brutal-lg font-bold uppercase">PULL REQUEST QUEUE</h3>
            <div className="flex items-center gap-12px">
              <button className="font-mono text-brutal-xs uppercase text-primary-brutalist/60 hover:text-primary-brutalist">
                FILTER ▼
              </button>
              <button className="brutal-btn-sm">CREATE PR</button>
            </div>
          </div>
          
          <div className="space-y-12px">
            {pullRequests.map((pr) => (
              <div key={pr.id} className="border-2 border-basalt-border p-16px hover:border-primary-brutalist transition-all">
                <div className="flex items-start justify-between mb-12px">
                  <div>
                    <div className="flex items-center gap-12px mb-4px">
                      <span className="font-mono text-brutal-sm font-bold">#{pr.number}</span>
                      <h4 className="font-bold">{pr.title}</h4>
                      {pr.draft && (
                        <span className="px-8px py-2px bg-basalt-border text-brutal-xs font-mono uppercase">DRAFT</span>
                      )}
                    </div>
                    <div className="flex items-center gap-16px font-mono text-brutal-xs text-primary-brutalist/60">
                      <span>by {pr.author}</span>
                      <span>•</span>
                      <span>{pr.createdAt}</span>
                      <span>•</span>
                      <span className="text-brutal-success">+{pr.additions}</span>
                      <span className="text-brutal-error">-{pr.deletions}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8px">
                    {pr.labels.map((label) => (
                      <span key={label} className="px-8px py-2px bg-primary-brutalist/20 text-brutal-xs font-mono uppercase">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-24px">
                    {/* Review Status */}
                    <div className="flex items-center gap-8px">
                      {pr.reviewStatus === 'approved' && (
                        <>
                          <HiOutlineCheckCircle className="w-16px h-16px text-brutal-success" />
                          <span className="font-mono text-brutal-xs text-brutal-success">APPROVED</span>
                        </>
                      )}
                      {pr.reviewStatus === 'changes_requested' && (
                        <>
                          <HiOutlineXCircle className="w-16px h-16px text-brutal-warning" />
                          <span className="font-mono text-brutal-xs text-brutal-warning">CHANGES REQUESTED</span>
                        </>
                      )}
                      {pr.reviewStatus === 'pending' && (
                        <>
                          <HiOutlineClock className="w-16px h-16px text-primary-brutalist/60" />
                          <span className="font-mono text-brutal-xs text-primary-brutalist/60">PENDING REVIEW</span>
                        </>
                      )}
                    </div>
                    
                    {/* Checks Status */}
                    <div className="flex items-center gap-8px font-mono text-brutal-xs">
                      <span className="text-brutal-success">{pr.checks.passed} ✓</span>
                      {pr.checks.failed > 0 && <span className="text-brutal-error">{pr.checks.failed} ✗</span>}
                      {pr.checks.pending > 0 && <span className="text-primary-brutalist/60">{pr.checks.pending} ⋯</span>}
                    </div>
                    
                    {/* Comments */}
                    <div className="flex items-center gap-4px font-mono text-brutal-xs text-primary-brutalist/60">
                      <HiOutlineChat className="w-14px h-14px" />
                      {pr.comments}
                    </div>
                  </div>
                  
                  <button className="brutal-btn-sm">VIEW PR</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Management */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <div className="flex items-center justify-between mb-16px">
            <h3 className="text-brutal-lg font-bold uppercase">BRANCH MANAGEMENT</h3>
            <button className="brutal-btn-sm">CREATE BRANCH</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-brutal-sm">
              <thead>
                <tr className="border-b-2 border-basalt-border">
                  <th className="text-left py-8px text-brutal-xs text-primary-brutalist/60 uppercase">BRANCH</th>
                  <th className="text-left py-8px text-brutal-xs text-primary-brutalist/60 uppercase">STATUS</th>
                  <th className="text-left py-8px text-brutal-xs text-primary-brutalist/60 uppercase">LAST COMMIT</th>
                  <th className="text-right py-8px text-brutal-xs text-primary-brutalist/60 uppercase">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.name} className="border-b border-basalt-border hover:bg-basalt-border/10">
                    <td className="py-12px">
                      <div className="flex items-center gap-8px">
                        {branch.isDefault && <HiOutlineHome className="w-16px h-16px text-primary-brutalist" />}
                        <span className={clsx(branch.isDefault && "font-bold")}>{branch.name}</span>
                      </div>
                    </td>
                    <td className="py-12px">
                      <div className="flex items-center gap-12px">
                        {branch.ahead > 0 && <span className="text-brutal-success">↑{branch.ahead}</span>}
                        {branch.behind > 0 && <span className="text-brutal-error">↓{branch.behind}</span>}
                        {branch.ahead === 0 && branch.behind === 0 && <span className="text-primary-brutalist/60">UP TO DATE</span>}
                      </div>
                    </td>
                    <td className="py-12px text-primary-brutalist/60">{branch.lastCommit}</td>
                    <td className="py-12px text-right">
                      <div className="flex items-center justify-end gap-8px">
                        {!branch.isDefault && (
                          <>
                            <button className="text-brutal-xs uppercase hover:text-primary-brutalist">MERGE</button>
                            <button className="text-brutal-xs uppercase text-brutal-error hover:text-brutal-error/80">DELETE</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Review Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h3 className="text-brutal-lg font-bold uppercase mb-16px">CODE REVIEW METRICS</h3>
            <div className="space-y-12px">
              <div className="flex justify-between font-mono text-brutal-sm">
                <span className="text-primary-brutalist/60">AVG REVIEW TIME:</span>
                <span className="font-bold">{codeReviewStats.averageTime}</span>
              </div>
              <div className="flex justify-between font-mono text-brutal-sm">
                <span className="text-primary-brutalist/60">PENDING REVIEWS:</span>
                <span className="font-bold text-brutal-warning">{codeReviewStats.pendingReviews}</span>
              </div>
              <div className="flex justify-between font-mono text-brutal-sm">
                <span className="text-primary-brutalist/60">COMPLETED THIS WEEK:</span>
                <span className="font-bold text-brutal-success">{codeReviewStats.completedThisWeek}</span>
              </div>
            </div>
            
            <div className="mt-16px pt-16px border-t-2 border-basalt-border">
              <h4 className="font-mono text-brutal-xs text-primary-brutalist/60 uppercase mb-8px">TOP REVIEWERS</h4>
              {codeReviewStats.topReviewers.map((reviewer, index) => (
                <div key={reviewer.name} className="flex items-center justify-between py-4px">
                  <span className="font-mono text-brutal-sm">{index + 1}. {reviewer.name}</span>
                  <span className="font-mono text-brutal-xs text-primary-brutalist/60">
                    {reviewer.reviews} reviews • {reviewer.avgTime} avg
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CI/CD Pipeline Status */}
          <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
            <h3 className="text-brutal-lg font-bold uppercase mb-16px">CI/CD PIPELINE</h3>
            <div className="space-y-8px">
              {ciPipeline.map((stage) => (
                <div key={stage.name} className="flex items-center justify-between p-12px bg-event-horizon/10 border border-basalt-border">
                  <div className="flex items-center gap-12px">
                    {stage.status === 'success' && <HiOutlineCheckCircle className="w-16px h-16px text-brutal-success" />}
                    {stage.status === 'running' && <HiOutlinePlay className="w-16px h-16px text-brutal-info animate-pulse" />}
                    {stage.status === 'failed' && <HiOutlineXCircle className="w-16px h-16px text-brutal-error" />}
                    <span className="font-mono text-brutal-sm">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-16px font-mono text-brutal-xs text-primary-brutalist/60">
                    <span>{stage.duration}</span>
                    <span>{stage.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16px flex items-center gap-12px">
              <button className="brutal-btn-sm flex-1">VIEW LOGS</button>
              <button className="brutal-btn-sm bg-brutal-error border-brutal-error">CANCEL PIPELINE</button>
            </div>
          </div>
        </div>

        {/* Recent Commits */}
        <div className="bg-carbon-plate border-2 border-basalt-border p-24px">
          <div className="flex items-center justify-between mb-16px">
            <h3 className="text-brutal-lg font-bold uppercase">RECENT COMMITS</h3>
            <button className="font-mono text-brutal-xs uppercase text-primary-brutalist/60 hover:text-primary-brutalist">
              VIEW ALL →
            </button>
          </div>
          
          <div className="space-y-8px font-mono text-brutal-sm">
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">7a8f9d2</span>
              <span className="text-primary-brutalist">fix: Resolve memory leak in worker process</span>
              <span className="text-primary-brutalist/60">by john.doe</span>
              <span className="text-brutal-xs text-primary-brutalist/60 ml-auto">10 minutes ago</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">b5c3e1a</span>
              <span className="text-primary-brutalist">feat: Add user authentication middleware</span>
              <span className="text-primary-brutalist/60">by jane.smith</span>
              <span className="text-brutal-xs text-primary-brutalist/60 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center gap-16px p-8px hover:bg-basalt-border/20 transition-colors">
              <span className="text-brutal-xs text-primary-brutalist/60">c9d4f2b</span>
              <span className="text-primary-brutalist">chore: Update dependencies to latest versions</span>
              <span className="text-primary-brutalist/60">by alice.jones</span>
              <span className="text-brutal-xs text-primary-brutalist/60 ml-auto">5 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'tasks':
        return renderTasksTab()
      case 'team':
        return renderTeamTab()
      case 'github':
        return renderGitHubTab()
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
      {/* Project Header */}
      <div className="bg-carbon-plate border-b-2 border-basalt-border px-32px py-16px">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-16px">
            <button 
              onClick={() => navigate(`/workspace/${workspaceId}`)}
              className="text-brutal-sm font-mono text-primary-brutalist/60 hover:text-primary-brutalist transition-colors flex items-center gap-8px"
            >
              ← BACK TO WORKSPACE
            </button>
            <div className="w-2px h-24px bg-basalt-border"></div>
            <div>
              <h1 className="text-brutal-lg font-bold uppercase">{project.name}</h1>
              <div className="flex items-center gap-16px font-mono text-brutal-xs text-primary-brutalist/60">
                <span>KEY: {project.key}</span>
                <span>•</span>
                <span>STATUS: <span className={clsx(
                  "font-bold",
                  project.status === 'active' && "text-brutal-success",
                  project.status === 'planning' && "text-brutal-info",
                  project.status === 'on_hold' && "text-brutal-warning",
                  project.status === 'completed' && "text-primary-brutalist",
                  project.status === 'archived' && "text-brutal-error"
                )}>{project.status.toUpperCase()}</span></span>
                <span>•</span>
                <span>WORKFLOW: {project.settings?.workflowType?.toUpperCase() || 'KANBAN'}</span>
                {project.lead && (
                  <>
                    <span>•</span>
                    <span>LEAD: {project.lead.name || 'UNASSIGNED'}</span>
                  </>
                )}
                {project.members && (
                  <>
                    <span>•</span>
                    <span>TEAM: {project.members.length}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-event-horizon border-b-4 border-basalt-border shadow-brutal">
        <div className="px-32px">
          <div className="flex items-center">
            {tabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center">
                <button
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={clsx(
                    "px-24px py-20px flex items-center gap-12px",
                    "font-mono text-brutal-sm uppercase transition-all duration-200",
                    "relative hover:bg-basalt-border/10",
                    activeTab === tab.id
                      ? "text-primary-brutalist bg-carbon-plate"
                      : "text-primary-brutalist/60 hover:text-primary-brutalist"
                  )}
                >
                  {/* Active indicator */}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-4px bg-primary-brutalist"></div>
                  )}
                  
                  <span className={clsx(
                    "transition-all duration-200",
                    activeTab === tab.id ? "text-primary-brutalist" : ""
                  )}>
                    {tab.icon}
                  </span>
                  <span className="font-bold tracking-wider">{tab.label}</span>
                  
                  {/* Badge for tasks count */}
                  {tab.id === 'tasks' && (
                    <span className="px-8px py-2px bg-primary-brutalist text-event-horizon text-brutal-xs font-bold">
                      42
                    </span>
                  )}
                </button>
                
                {/* Tab separator */}
                {index < tabs.length - 1 && (
                  <div className="h-32px w-1px bg-basalt-border/30"></div>
                )}
              </div>
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