import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useUser } from '@clerk/clerk-react'
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
  HiOutlineChip,
  HiOutlineUser,
  HiOutlineDotsVertical,
  HiOutlineArrowRight,
  HiOutlineChat,
  HiOutlineSearch
} from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import CreateTaskModal from '@/components/features/task/CreateTaskModal'
import EditTaskModal from '@/components/features/task/EditTaskModal'
import KanbanBoard from '@/components/features/kanban/KanbanBoard'
import TaskList from '@/components/features/task/TaskList'
import { GitHubProjectTab } from '@/components/features/github/GitHubProjectTab'
import SprintBoard from '@/components/features/sprint/SprintBoard'
import CreateSprintModal from '@/components/features/sprint/CreateSprintModal'
import TaskCard from '@/components/features/task/TaskCard'
import TaskFilters from '@/components/features/task/TaskFilters'
import ScheduleMeetingModal from '@/components/features/meetings/ScheduleMeetingModal'
import MeetingCard from '@/components/features/meetings/MeetingCard'
import ProjectInviteModal from '@/components/features/project/ProjectInviteModal'
import UserDisplay from '@/components/features/user/UserDisplay'
import DeveloperTimeline from '@/components/features/project/DeveloperTimeline'
import SprintBurndownChart from '@/components/features/project/SprintBurndownChart'
import TaskDistributionCharts from '@/components/features/project/TaskDistributionCharts'
import AIInsightsPanel from '@/components/features/project/AIInsightsPanel'
import GitHubStyleHeatmap from '@/components/features/project/GitHubStyleHeatmap'
import SmartTaskGenerator from '@/components/features/project/SmartTaskGenerator'
import DailyStandupSummary from '@/components/features/project/DailyStandupSummary'
import GanttView from '@/components/features/project/GanttView'
import CalendarView from '@/components/features/project/CalendarView'
import NaturalLanguageTaskCreator from '@/components/features/ai/NaturalLanguageTaskCreator'
import TeamActivityFeed from '@/components/features/activity/TeamActivityFeed'
import { ExpertiseSearchModal } from '@/components/features/profile/ExpertiseSearchModal'
import { TeamExpertiseMatrix } from '@/components/features/profile/TeamExpertiseMatrix'
import AIDocumentationHub from '@/components/features/documentation/AIDocumentationHub'
import type { TaskFilters as TaskFiltersType } from '@/components/features/task/TaskFilters'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import { motion } from 'framer-motion'

type TabType = 'overview' | 'tasks' | 'team' | 'github' | 'meetings' | 'docs' | 'logs' | 'settings'

interface HealthCard {
  title: string
  status: 'success' | 'warning' | 'error' | 'info'
  value: string | number
  subtitle?: string
  icon: React.ReactNode
}

type TaskViewType = 'sprint' | 'kanban' | 'list' | 'gantt' | 'calendar'

export default function ProjectManagementPage() {
  const { workspaceId, projectId } = useParams()
  const navigate = useNavigate()
  const { user: clerkUser } = useUser()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [taskView, setTaskView] = useState<TaskViewType>('sprint')
  const [showMyTasks, setShowMyTasks] = useState(false)
  const [isCompactView, setIsCompactView] = useState(false)
  const [currentContext, setCurrentContext] = useState<string | null>(null)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false)
  const [showProjectInviteModal, setShowProjectInviteModal] = useState(false)
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false)
  const [showExpertiseSearch, setShowExpertiseSearch] = useState(false)
  const [showExpertiseMatrix, setShowExpertiseMatrix] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [quickFilter, setQuickFilter] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>('all')
  const [taskFilters, setTaskFilters] = useState<TaskFiltersType>({
    search: '',
    status: [],
    priority: [],
    type: [],
    assigneeIds: [],
    labels: [],
    dueDateRange: { start: null, end: null },
    createdDateRange: { start: null, end: null },
    hasTimeTracked: undefined,
    isOverdue: undefined
  })

  const deleteTask = useMutation(api.tasks.mutations.deleteTask)
  const createTask = useMutation(api.tasks.mutations.createTask)
  const assignTeam = useMutation(api.projects.mutations.assignTeam)

  // Move task handlers to top level
  const handleEditTask = (task: any) => {
    setSelectedTask(task)
    setShowEditTaskModal(true)
  }

  const handleDeleteTask = async (task: any) => {
    if (confirm(`Delete task "${task.title}"?`)) {
      try {
        await deleteTask({ taskId: task._id })
        toast.success('Task deleted')
      } catch (error) {
        toast.error('Failed to delete task')
      }
    }
  }

  const handleDuplicateTask = async (task: any) => {
    try {
      await createTask({
        projectId: task.projectId,
        title: `${task.title} (Copy)`,
        description: task.description,
        type: task.type,
        priority: task.priority,
        assigneeId: task.assigneeId,
        labels: task.labels,
        estimate: task.estimate,
        startDate: task.startDate,
        dueDate: task.dueDate,
      })
      toast.success('Task duplicated')
    } catch (error) {
      toast.error('Failed to duplicate task')
    }
  }

  const project = useQuery(
    api.projects.queries.getProject,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  // Get current user from Convex
  const currentUser = useQuery(
    api.auth.users.getCurrentUser,
    clerkUser ? {} : 'skip'
  )

  // Query tasks for this project - moved here to follow hooks rules
  const tasks = useQuery(
    api.tasks.queries.getProjectTasks,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  // Get current sprint for this project
  const activeSprint = useQuery(
    api.sprints.queries.getCurrentSprint,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  // Get all sprints for this project
  const allSprints = useQuery(
    api.sprints.queries.getProjectSprints,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  // Get project meetings
  const projectMeetings = useQuery(
    api.meetings.queries.getProjectMeetings,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  // Get project team members
  const team = useQuery(
    api.projects.members.getProjectMembers,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  // Get available teams
  const availableTeams = useQuery(
    api.teams.getTeams,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
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
            setShowCreateTaskModal(true)
          }
          break
        case 'm':
          if (activeTab === 'tasks') {
            setShowMyTasks(!showMyTasks)
          }
          break
        case 't':
          if (activeTab === 'tasks' && selectedTask) {
            // Toggle timer on selected task
            setCurrentContext(currentContext === selectedTask.key ? null : selectedTask.key)
            toast.info(currentContext === selectedTask.key ? 'Timer stopped' : `Timer started for ${selectedTask.key}`)
          }
          break
        case 'b':
          if (activeTab === 'tasks' && selectedTask) {
            // Mark selected task as blocked (placeholder - would need task update mutation)
            toast.info(`Task ${selectedTask.key} marked as blocked`)
          }
          break
        case '/':
          if (activeTab === 'tasks') {
            e.preventDefault()
            // Focus search input
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
            if (searchInput) {
              searchInput.focus()
            }
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (activeTab === 'tasks') {
            // Switch to column by number
            const columnMap = { '1': 'backlog', '2': 'todo', '3': 'in_progress', '4': 'in_review', '5': 'done' }
            const columnName = columnMap[e.key as keyof typeof columnMap]
            if (columnName) {
              toast.info(`Switched focus to ${columnName.replace('_', ' ')} column`)
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [activeTab, showMyTasks, setShowCreateTaskModal])

  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: <HiOutlineHome className="w-14px h-14px" /> },
    { id: 'tasks', label: 'TASKS', icon: <HiOutlineClipboardList className="w-14px h-14px" /> },
    { id: 'team', label: 'TEAM', icon: <HiOutlineUserGroup className="w-14px h-14px" /> },
    { id: 'github', label: 'GITHUB', icon: <HiOutlineCode className="w-14px h-14px" /> },
    { id: 'meetings', label: 'MEETINGS', icon: <HiOutlineVideoCamera className="w-14px h-14px" /> },
    { id: 'docs', label: 'DOCS', icon: <HiOutlineDocumentText className="w-14px h-14px" /> },
    { id: 'logs', label: 'LOGS', icon: <HiOutlineTerminal className="w-14px h-14px" /> },
    { id: 'settings', label: 'SETTINGS', icon: <HiOutlineCog className="w-14px h-14px" /> },
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
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
          <h1 className="text-brutal-xl font-bold uppercase text-brutal-error mb-8px">PROJECT NOT FOUND</h1>
          <p className="font-mono text-brutal-sm">The requested project does not exist or you don't have access.</p>
        </div>
      </div>
    )
  }

  // Real health data based on project statistics
  const healthCards: HealthCard[] = [
    {
      title: 'TOTAL TASKS',
      status: tasks && tasks.length > 0 ? 'success' : 'info',
      value: tasks?.length || 0,
      subtitle: `${tasks?.filter(t => t.status === 'done').length || 0} completed`,
      icon: <HiOutlineClipboardList className="w-20px h-20px" />
    },
    {
      title: 'IN PROGRESS',
      status: tasks?.filter(t => t.status === 'in_progress').length > 5 ? 'warning' : 'info',
      value: tasks?.filter(t => t.status === 'in_progress').length || 0,
      subtitle: 'Active work',
      icon: <HiOutlineClock className="w-20px h-20px" />
    },
    {
      title: 'SPRINTS',
      status: allSprints && allSprints.length > 0 ? 'success' : 'info',
      value: allSprints?.length || 0,
      subtitle: `${allSprints?.filter(s => s.status === 'active').length || 0} active`,
      icon: <HiOutlineLightningBolt className="w-20px h-20px" />
    },
    {
      title: 'BLOCKERS',
      status: tasks?.filter(t => t.status === 'blocked').length > 0 ? 'error' : 'success',
      value: tasks?.filter(t => t.status === 'blocked').length || 0,
      subtitle: tasks?.filter(t => t.status === 'blocked').length > 0 ? 'Critical issues' : 'No blockers',
      icon: <HiOutlineExclamationCircle className="w-20px h-20px" />
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-brutal-success border-brutal-success bg-brutal-success/10'
      case 'warning': return 'text-brutal-warning border-brutal-warning bg-brutal-warning/10'
      case 'error': return 'text-brutal-error border-brutal-error bg-brutal-error/10'
      case 'info': return 'text-brutal-info border-brutal-info bg-brutal-info/10'
      default: return 'text-primary-brutalist border-[var(--theme-border)]'
    }
  }

  const renderOverviewTab = () => {
    // Get active sprint
    const activeSprint = allSprints?.find(s => s.status === 'active')

    return (
      <div className="space-y-8">
        {/* Mission Brief & Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Overview */}
          <BrutalCard variant="default" className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6 border-b-2 border-[var(--theme-border)] pb-4">
              <HiOutlineChip className="w-6 h-6 text-[var(--theme-primary)]" />
              <h3 className="text-lg font-bold uppercase tracking-tight">Project Overview</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-[var(--theme-background-secondary)] p-4 border border-[var(--theme-border)]">
                <span className="block text-xs font-mono text-[var(--theme-foreground)]/60 mb-1">PROJECT LEAD</span>
                <span className="block font-bold text-lg truncate">{project.lead?.name || 'Unassigned'}</span>
              </div>
              <div className="bg-[var(--theme-background-secondary)] p-4 border border-[var(--theme-border)]">
                <span className="block text-xs font-mono text-[var(--theme-foreground)]/60 mb-1">TEAM SIZE</span>
                <span className="block font-bold text-lg">{project.members?.length || 0} Members</span>
              </div>
              <div className="bg-[var(--theme-background-secondary)] p-4 border border-[var(--theme-border)]">
                <span className="block text-xs font-mono text-[var(--theme-foreground)]/60 mb-1">WORKFLOW</span>
                <span className="block font-bold text-lg uppercase">{project.settings?.workflowType || 'Kanban'}</span>
              </div>
            </div>

            {project.description && (
              <div className="font-mono text-sm text-[var(--theme-foreground)]/80 leading-relaxed border-l-4 border-[var(--theme-primary)] pl-4">
                {project.description}
              </div>
            )}
          </BrutalCard>

          {/* System Status (Health Cards) */}
          <div className="space-y-4">
            {healthCards.map((card) => (
              <BrutalCard
                key={card.title}
                variant="bordered"
                className={clsx(
                  "transition-all hover:translate-x-1",
                  card.status === 'error' && "border-[var(--theme-error)]",
                  card.status === 'warning' && "border-[var(--theme-warning)]",
                  card.status === 'success' && "border-[var(--theme-success)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-[var(--theme-foreground)]/60 uppercase mb-1">{card.title}</div>
                    <div className="text-2xl font-bold">{card.value}</div>
                  </div>
                  <div className={clsx(
                    "p-2 border-2",
                    card.status === 'error' ? "border-[var(--theme-error)] text-[var(--theme-error)]" :
                      card.status === 'warning' ? "border-[var(--theme-warning)] text-[var(--theme-warning)]" :
                        card.status === 'success' ? "border-[var(--theme-success)] text-[var(--theme-success)]" :
                          "border-[var(--theme-primary)] text-[var(--theme-primary)]"
                  )}>
                    {card.icon}
                  </div>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>

        {/* Analytics & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BrutalCard variant="default" className="min-h-[300px]">
            <div className="flex items-center gap-3 mb-4">
              <HiOutlineLightningBolt className="w-5 h-5 text-[var(--theme-primary)]" />
              <h3 className="font-bold uppercase">AI Insights</h3>
            </div>
            <AIInsightsPanel
              projectId={project._id}
              sprintId={activeSprint?._id}
              compact={true}
            />
          </BrutalCard>

          <div className="space-y-8">
            <BrutalCard variant="default">
              <div className="flex items-center gap-3 mb-4">
                <HiOutlineChartBar className="w-5 h-5 text-[var(--theme-primary)]" />
                <h3 className="font-bold uppercase">Velocity</h3>
              </div>
              {activeSprint ? (
                <SprintBurndownChart
                  sprint={activeSprint}
                  tasks={tasks || []}
                  showPrediction={true}
                />
              ) : (
                <div className="h-40 flex items-center justify-center border-2 border-dashed border-[var(--theme-border)]">
                  <span className="font-mono text-xs text-[var(--theme-foreground)]/40">No Active Sprint Data</span>
                </div>
              )}
            </BrutalCard>

            <BrutalCard variant="default">
              <div className="flex items-center gap-3 mb-4">
                <HiOutlineClock className="w-5 h-5 text-[var(--theme-primary)]" />
                <h3 className="font-bold uppercase">Activity</h3>
              </div>
              <GitHubStyleHeatmap
                tasks={tasks || []}
                weeks={12}
              />
            </BrutalCard>
          </div>
        </div>

        {/* Task Generator */}
        <BrutalCard variant="bordered" className="border-dashed">
          <NaturalLanguageTaskCreator
            projectId={project._id}
            sprintId={activeSprint?._id}
            onTasksCreated={() => {
              // Refresh tasks will happen automatically via Convex subscriptions
            }}
          />
        </BrutalCard>
      </div>
    )
  }

  const renderTasksTab = () => {
    // Safety check
    if (!project || !workspaceId) {
      return (
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-48px text-center">
          <h3 className="font-mono text-brutal-sm uppercase mb-16px">LOADING PROJECT DATA...</h3>
        </div>
      )
    }

    // Apply filters
    let filteredTasks = tasks || []

    // Filter by selected sprint
    if (selectedSprintId && selectedSprintId !== 'all') {
      filteredTasks = filteredTasks.filter((t: any) => t.sprintId === selectedSprintId)
    } else if (selectedSprintId === null) {
      // Show only tasks without a sprint (backlog)
      filteredTasks = filteredTasks.filter((t: any) => !t.sprintId)
    }

    // Apply advanced filters first
    if (taskFilters.search) {
      const searchLower = taskFilters.search.toLowerCase()
      filteredTasks = filteredTasks.filter((t: any) =>
        t.title?.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.key?.toLowerCase().includes(searchLower)
      )
    }

    if (taskFilters.status.length > 0) {
      filteredTasks = filteredTasks.filter((t: any) => taskFilters.status.includes(t.status))
    }

    if (taskFilters.priority.length > 0) {
      filteredTasks = filteredTasks.filter((t: any) => taskFilters.priority.includes(t.priority))
    }

    if (taskFilters.type.length > 0) {
      filteredTasks = filteredTasks.filter((t: any) => taskFilters.type.includes(t.type))
    }

    if (taskFilters.assigneeIds.length > 0) {
      filteredTasks = filteredTasks.filter((t: any) =>
        t.assigneeId && taskFilters.assigneeIds.includes(t.assigneeId) ||
        (t.assigneeIds && t.assigneeIds.some((id: string) => taskFilters.assigneeIds.includes(id)))
      )
    }

    if (taskFilters.labels.length > 0) {
      filteredTasks = filteredTasks.filter((t: any) =>
        t.labels && t.labels.some((label: string) => taskFilters.labels.includes(label))
      )
    }

    if (taskFilters.dueDateRange.start || taskFilters.dueDateRange.end) {
      filteredTasks = filteredTasks.filter((t: any) => {
        if (!t.dueDate) return false
        const dueDate = new Date(t.dueDate)
        if (taskFilters.dueDateRange.start && dueDate < new Date(taskFilters.dueDateRange.start)) return false
        if (taskFilters.dueDateRange.end && dueDate > new Date(taskFilters.dueDateRange.end)) return false
        return true
      })
    }

    if (taskFilters.hasTimeTracked !== undefined) {
      filteredTasks = filteredTasks.filter((t: any) =>
        taskFilters.hasTimeTracked ? (t.timeTracked && t.timeTracked > 0) : (!t.timeTracked || t.timeTracked === 0)
      )
    }

    if (taskFilters.isOverdue !== undefined && taskFilters.isOverdue) {
      filteredTasks = filteredTasks.filter((t: any) =>
        t.dueDate && new Date(t.dueDate) < new Date()
      )
    }

    // Apply quick filters on top of advanced filters
    if (quickFilter) {
      switch (quickFilter) {
        case 'my-tasks':
          filteredTasks = filteredTasks.filter((t: any) =>
            t.assigneeId === currentUser?._id ||
            (t.assigneeIds && t.assigneeIds.includes(currentUser?._id))
          )
          break
        case 'unassigned':
          filteredTasks = filteredTasks.filter((t: any) => !t.assigneeId && (!t.assigneeIds || t.assigneeIds.length === 0))
          break
        case 'due-soon':
          const threeDaysFromNow = new Date()
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
          filteredTasks = filteredTasks.filter((t: any) =>
            t.dueDate && new Date(t.dueDate) <= threeDaysFromNow
          )
          break
        case 'overdue':
          filteredTasks = filteredTasks.filter((t: any) =>
            t.dueDate && new Date(t.dueDate) < new Date()
          )
          break
        case 'high-priority':
          filteredTasks = filteredTasks.filter((t: any) =>
            t.priority === 'urgent' || t.priority === 'high'
          )
          break
      }
    }

    // Task handlers are now defined at the component level

    // Mock task columns data - replace with real data
    const taskColumns = {
      backlog: filteredTasks?.filter((t: any) => t.status === 'backlog') || [],
      todo: filteredTasks?.filter((t: any) => t.status === 'todo') || [],
      in_progress: filteredTasks?.filter((t: any) => t.status === 'in_progress') || [],
      review: filteredTasks?.filter((t: any) => t.status === 'review') || [],
      done: filteredTasks?.filter((t: any) => t.status === 'done') || []
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
      <div className={clsx(
        "space-y-24px",
        taskView === 'kanban' && "h-full flex flex-col space-y-0 gap-6"
      )}>
        {/* Filter Info Bar */}
        {(quickFilter || taskFilters.search || taskFilters.status.length > 0 || taskFilters.priority.length > 0 ||
          taskFilters.type.length > 0 || taskFilters.assigneeIds.length > 0 || taskFilters.labels.length > 0 ||
          taskFilters.dueDateRange.start || taskFilters.dueDateRange.end || taskFilters.hasTimeTracked !== undefined ||
          taskFilters.isOverdue !== undefined) && (
            <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-12px flex items-center justify-between">
              <div className="font-mono text-brutal-sm">
                SHOWING <span className="font-bold text-primary-brutalist">{filteredTasks.length}</span> OF <span className="font-bold">{tasks?.length || 0}</span> TASKS
                {quickFilter && (
                  <span className="ml-16px text-[var(--theme-foreground)]/60">
                    QUICK: <span className="text-primary-brutalist">{quickFilter.replace('-', ' ').toUpperCase()}</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setQuickFilter(null)
                  setTaskFilters({
                    search: '',
                    status: [],
                    priority: [],
                    type: [],
                    assigneeIds: [],
                    labels: [],
                    dueDateRange: { start: null, end: null },
                    createdDateRange: { start: null, end: null },
                    hasTimeTracked: undefined,
                    isOverdue: undefined
                  })
                }}
                className="text-xs font-mono uppercase text-brutal-error hover:underline"
              >
                CLEAR ALL FILTERS
              </button>
            </div>
          )}

        {/* Header Controls - Compact */}
        <div className="flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="h-[24px] px-3 flex items-center gap-1 bg-primary-brutalist text-event-horizon border border-primary-brutalist hover:bg-opacity-90 font-mono text-[10px] uppercase transition-colors"
            >
              <HiOutlinePlus className="w-[12px] h-[12px]" />
              NEW
            </button>

            {/* Compact Sprint Selector */}
            <select
              value={selectedSprintId || 'all'}
              onChange={(e) => setSelectedSprintId(e.target.value === 'all' ? 'all' : e.target.value === 'backlog' ? null : e.target.value)}
              className="h-[24px] px-2 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-mono text-[10px] uppercase focus:border-primary-brutalist focus:outline-none transition-colors"
            >
              <option value="all">ALL</option>
              <option value="backlog">BACKLOG</option>
              {allSprints?.map((sprint) => (
                <option key={sprint._id} value={sprint._id}>
                  {sprint.name} {sprint.status === 'active' ? '✓' : ''}
                </option>
              ))}
            </select>

            {/* Compact Filter Buttons - 3-Tier System */}
            <div className="flex items-center gap-1">
              {/* Tier 1: Primary Filters */}
              <button
                onClick={() => setQuickFilter(quickFilter === 'my-tasks' ? null : 'my-tasks')}
                className={clsx(
                  "h-[22px] px-2 border border-[var(--theme-border)] font-mono text-[9px] uppercase transition-colors",
                  quickFilter === 'my-tasks'
                    ? "bg-primary-brutalist text-event-horizon"
                    : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                )}
                title="Show only my tasks"
              >
                MINE
              </button>
              <button
                onClick={() => setQuickFilter(quickFilter === 'unassigned' ? null : 'unassigned')}
                className={clsx(
                  "h-[22px] px-2 border border-[var(--theme-border)] font-mono text-[9px] uppercase transition-colors",
                  quickFilter === 'unassigned'
                    ? "bg-primary-brutalist text-event-horizon"
                    : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                )}
                title="Show unassigned tasks"
              >
                NONE
              </button>

              {/* Separator */}
              <div className="w-[1px] h-[16px] bg-[var(--theme-border)]" />

              {/* Tier 2: Status Filters */}
              <button
                onClick={() => {
                  setTaskFilters(prev => ({
                    ...prev,
                    status: ['in_progress', 'in_review']
                  }))
                  setQuickFilter(null)
                }}
                className="h-[22px] px-2 border border-[var(--theme-border)] bg-blue-500/20 hover:bg-blue-500/30 font-mono text-[9px] uppercase transition-colors"
                title="In progress or review"
              >
                WIP
              </button>
              <button
                onClick={() => {
                  setTaskFilters(prev => ({
                    ...prev,
                    status: ['blocked']
                  }))
                  setQuickFilter(null)
                }}
                className="h-[22px] px-2 border border-[var(--theme-border)] bg-red-500/20 hover:bg-red-500/30 font-mono text-[9px] uppercase transition-colors"
                title="Blocked tasks"
              >
                BLOCK
              </button>

              {/* Separator */}
              <div className="w-[1px] h-[16px] bg-[var(--theme-border)]" />

              {/* Tier 3: Priority/Time Filters */}
              <button
                onClick={() => setQuickFilter(quickFilter === 'overdue' ? null : 'overdue')}
                className={clsx(
                  "h-[22px] px-2 border border-red-600 font-mono text-[9px] uppercase transition-colors",
                  quickFilter === 'overdue'
                    ? "bg-red-600 text-white"
                    : "bg-red-600/20 text-red-600 hover:bg-red-600 hover:text-white"
                )}
                title="Overdue tasks"
              >
                !DUE
              </button>
              <button
                onClick={() => setQuickFilter(quickFilter === 'high-priority' ? null : 'high-priority')}
                className={clsx(
                  "h-[22px] px-2 border border-orange-500 font-mono text-[9px] uppercase transition-colors",
                  quickFilter === 'high-priority'
                    ? "bg-orange-500 text-white"
                    : "bg-orange-500/20 text-orange-600 hover:bg-orange-500 hover:text-white"
                )}
                title="High priority tasks"
              >
                !PRI
              </button>
              <button
                onClick={() => setQuickFilter(quickFilter === 'due-soon' ? null : 'due-soon')}
                className={clsx(
                  "h-[22px] px-2 border border-[var(--theme-border)] font-mono text-[9px] uppercase transition-colors",
                  quickFilter === 'due-soon'
                    ? "bg-primary-brutalist text-event-horizon"
                    : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                )}
                title="Due within 7 days"
              >
                SOON
              </button>
            </div>

            {/* Compact View Mode Selector */}
            <div className="flex items-center bg-[var(--theme-background)] border border-[var(--theme-border)]">
              <button
                onClick={() => setTaskView('sprint')}
                className={clsx(
                  "h-[22px] px-2 font-mono text-[9px] uppercase transition-colors",
                  taskView === 'sprint' ? "bg-primary-brutalist text-event-horizon" : "hover:bg-[var(--theme-background-secondary)]"
                )}
              >
                SPRINT
              </button>
              <button
                onClick={() => setTaskView('kanban')}
                className={clsx(
                  "h-[22px] px-2 font-mono text-[9px] uppercase transition-colors border-x border-[var(--theme-border)]",
                  taskView === 'kanban' ? "bg-primary-brutalist text-event-horizon" : "hover:bg-[var(--theme-background-secondary)]"
                )}
              >
                BOARD
              </button>
              <button
                onClick={() => setTaskView('list')}
                className={clsx(
                  "h-[22px] px-2 font-mono text-[9px] uppercase transition-colors border-r border-[var(--theme-border)]",
                  taskView === 'list' ? "bg-primary-brutalist text-event-horizon" : "hover:bg-[var(--theme-background-secondary)]"
                )}
              >
                LIST
              </button>
              <button
                onClick={() => setTaskView('gantt')}
                className={clsx(
                  "h-[22px] px-2 font-mono text-[9px] uppercase transition-colors border-r border-[var(--theme-border)]",
                  taskView === 'gantt' ? "bg-primary-brutalist text-event-horizon" : "hover:bg-[var(--theme-background-secondary)]"
                )}
              >
                GANTT
              </button>
              <button
                onClick={() => setTaskView('calendar')}
                className={clsx(
                  "h-[22px] px-2 font-mono text-[9px] uppercase transition-colors",
                  taskView === 'calendar' ? "bg-primary-brutalist text-event-horizon" : "hover:bg-[var(--theme-background-secondary)]"
                )}
              >
                CAL
              </button>
            </div>

            {taskView === 'kanban' && (
              <button
                onClick={() => setIsCompactView(!isCompactView)}
                className={clsx(
                  "h-[22px] px-2 flex items-center gap-1 border border-[var(--theme-border)] font-mono text-[9px] uppercase transition-colors",
                  isCompactView
                    ? "bg-primary-brutalist text-event-horizon"
                    : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
                )}
                title={isCompactView ? "Switch to normal view" : "Switch to compact view"}
              >
                <HiOutlineViewGrid className="w-[10px] h-[10px]" />
                {isCompactView ? 'NORM' : 'COMP'}
              </button>
            )}

            <button
              onClick={() => setShowAdvancedFilters(true)}
              className={clsx(
                "h-[22px] px-2 flex items-center gap-1 border border-[var(--theme-border)] font-mono text-[9px] uppercase transition-colors",
                (taskFilters.search || taskFilters.status.length > 0 || taskFilters.priority.length > 0 ||
                  taskFilters.type.length > 0 || taskFilters.assigneeIds.length > 0 || taskFilters.labels.length > 0 ||
                  taskFilters.dueDateRange.start || taskFilters.dueDateRange.end || taskFilters.hasTimeTracked !== null ||
                  taskFilters.isOverdue !== null)
                  ? "bg-primary-brutalist text-event-horizon"
                  : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
              )}
            >
              <HiOutlineFilter className="w-[10px] h-[10px]" />
              ADV
              {(taskFilters.search || taskFilters.status.length > 0 || taskFilters.priority.length > 0 ||
                taskFilters.type.length > 0 || taskFilters.assigneeIds.length > 0 || taskFilters.labels.length > 0 ||
                taskFilters.dueDateRange.start || taskFilters.dueDateRange.end || taskFilters.hasTimeTracked !== null ||
                taskFilters.isOverdue !== null) && (
                  <span className="px-1 bg-red-600 text-white text-[7px] font-bold">!</span>
                )}
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-primary-brutalist/60">CONTEXT:</span>
            <span className="text-primary-brutalist font-bold">{currentContext || 'NONE'}</span>
          </div>
        </div>

        {/* Sprint Metrics Bar */}
        {sprintProgress && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
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

        {/* Task View */}
        {taskView === 'sprint' && activeSprint && (
          <SprintBoard
            sprint={activeSprint}
            projectId={projectId as string}
            tasks={filteredTasks.filter((t: any) => t.sprintId === activeSprint._id)}
            onTaskEdit={handleEditTask}
            onTaskDelete={handleDeleteTask}
            onTaskDuplicate={handleDuplicateTask}
          />
        )}

        {taskView === 'kanban' && (
          <div className="flex-1 min-h-0">
            <KanbanBoard
              tasks={filteredTasks}
              projectId={projectId as string}
              onTaskUpdate={() => {
                // Task updates are handled by optimistic updates in the component
              }}
            />
          </div>
        )}

        {taskView === 'list' && (
          <TaskList
            tasks={filteredTasks}
            projectId={projectId as string}
            onTaskEdit={handleEditTask}
            onTaskDelete={handleDeleteTask}
            onTaskDuplicate={handleDuplicateTask}
          />
        )}

        {taskView === 'gantt' && (
          <GanttView
            projectId={projectId as string}
            workspaceId={workspaceId as string}
          />
        )}

        {taskView === 'calendar' && (
          <CalendarView
            projectId={projectId as string}
            workspaceId={workspaceId as string}
          />
        )}

        {taskView === 'sprint' && !activeSprint && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-48px text-center">
            <h3 className="font-mono text-brutal-sm uppercase mb-16px">NO ACTIVE SPRINT</h3>
            <p className="text-[var(--theme-foreground)]/60 mb-24px">Create a sprint to start organizing your tasks</p>
            <button
              onClick={() => setShowCreateSprintModal(true)}
              className="brutal-btn"
            >
              CREATE NEW SPRINT
            </button>
          </div>
        )}

        {/* Task Activity Timeline */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
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

  // Remove the inline TaskCard component (we're using the imported one now)
  const InlineTaskCard = ({ task, onContextSwitch }: any) => {
    return (
      <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-12px hover:border-primary-brutalist hover:shadow-brutal-sm transition-all cursor-move">
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
              <div className="w-24px h-24px bg-primary-brutalist border-2 border-[var(--theme-border)] flex items-center justify-center">
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
    const allTasks = tasks || []

    // Calculate real stats for each member
    const memberStats = members.map((member: any) => {
      const memberTasks = allTasks.filter((task: any) =>
        task.assigneeId === member._id ||
        (task.assigneeIds && task.assigneeIds.includes(member._id))
      )

      return {
        ...member,
        tasksAssigned: memberTasks.length,
        tasksCompleted: memberTasks.filter((t: any) => t.status === 'done').length,
        tasksInProgress: memberTasks.filter((t: any) => t.status === 'in_progress').length,
        tasksBlocked: memberTasks.filter((t: any) => t.status === 'blocked' || t.isBlocked).length,
        tasksTodo: memberTasks.filter((t: any) => t.status === 'todo' || t.status === 'backlog').length,
        tasksInReview: memberTasks.filter((t: any) => t.status === 'in_review').length,
        pullRequests: 0, // Would require GitHub API integration
        commits: 0, // Would require GitHub API integration
        hoursTracked: memberTasks.reduce((sum: number, t: any) => sum + (t.timeTracked || 0), 0) / 3600000, // Convert ms to hours
        productivity: memberTasks.length > 0 ? Math.round((memberTasks.filter((t: any) => t.status === 'done').length / memberTasks.length) * 100) : 0,
        lastActive: member.lastSeenAt ? formatDistanceToNow(new Date(member.lastSeenAt), { addSuffix: true }) : 'Unknown'
      }
    })

    const workloadData = {
      labels: memberStats.map((m: any) => m.name?.split(' ')[0] || 'Unknown'),
      values: memberStats.map((m: any) => m.tasksAssigned),
      max: Math.max(20, ...memberStats.map((m: any) => m.tasksAssigned))
    }

    // Calculate team totals
    const teamTotals = {
      totalTasks: memberStats.reduce((sum, m) => sum + m.tasksAssigned, 0),
      completedTasks: memberStats.reduce((sum, m) => sum + m.tasksCompleted, 0),
      inProgressTasks: memberStats.reduce((sum, m) => sum + m.tasksInProgress, 0),
      hoursTracked: memberStats.reduce((sum, m) => sum + m.hoursTracked, 0),
      avgProductivity: memberStats.length > 0 ? Math.round(memberStats.reduce((sum, m) => sum + m.productivity, 0) / memberStats.length) : 0
    }

    return (
      <div className="space-y-24px">
        {/* Team Header */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
          <div className="flex items-center justify-between mb-16px">
            <h2 className="text-brutal-lg font-bold uppercase">PROJECT TEAM</h2>
            <div className="flex items-center gap-12px">
              <button
                onClick={() => setShowExpertiseMatrix(true)}
                className="brutal-btn-secondary flex items-center gap-8px"
              >
                <HiOutlineChartBar className="w-16px h-16px" />
                EXPERTISE MATRIX
              </button>
              <button
                onClick={() => setShowProjectInviteModal(true)}
                className="brutal-btn-secondary flex items-center gap-8px"
              >
                <HiOutlineUserGroup className="w-16px h-16px" />
                INVITE MEMBERS
              </button>
            </div>
          </div>
          <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
            Manage your project team, view workload distribution, and track productivity metrics.
          </p>
        </div>

        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16px">
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="flex items-center justify-between mb-8px">
              <HiOutlineUserGroup className="w-20px h-20px text-primary-brutalist" />
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">TEAM SIZE</span>
            </div>
            <div className="text-brutal-2xl font-bold">{members.length}</div>
            <div className="font-mono text-brutal-xs text-primary-brutalist/60">MEMBERS</div>
          </div>

          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="flex items-center justify-between mb-8px">
              <HiOutlineClipboardList className="w-20px h-20px text-brutal-info" />
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">ACTIVE TASKS</span>
            </div>
            <div className="text-brutal-2xl font-bold">{teamTotals.totalTasks}</div>
            <div className="font-mono text-brutal-xs text-primary-brutalist/60">ACROSS TEAM</div>
          </div>

          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="flex items-center justify-between mb-8px">
              <HiOutlineClock className="w-20px h-20px text-brutal-warning" />
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">HOURS TRACKED</span>
            </div>
            <div className="text-brutal-2xl font-bold">{Math.round(teamTotals.hoursTracked)}</div>
            <div className="font-mono text-brutal-xs text-primary-brutalist/60">TOTAL HOURS</div>
          </div>

          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
            <div className="flex items-center justify-between mb-8px">
              <HiOutlineChartBar className="w-20px h-20px text-brutal-success" />
              <span className="font-mono text-brutal-xs text-primary-brutalist/60">PRODUCTIVITY</span>
            </div>
            <div className="text-brutal-2xl font-bold">{teamTotals.avgProductivity}%</div>
            <div className="font-mono text-brutal-xs text-primary-brutalist/60">AVG COMPLETION</div>
          </div>
        </div>

        {/* Workload Distribution - Enhanced */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
          {/* Header with Controls */}
          <div className="flex items-center justify-between p-24px border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
            <div className="flex items-center gap-16px">
              <h3 className="text-brutal-lg font-bold uppercase">WORKLOAD DISTRIBUTION</h3>
              <div className="flex items-center gap-8px font-mono text-brutal-xs">
                <span className="text-primary-brutalist/60">AVG:</span>
                <span className="font-bold">{Math.round(teamTotals.totalTasks / memberStats.length || 0)} TASKS</span>
              </div>
            </div>
            <div className="flex items-center gap-12px">
              <div className="flex items-center gap-8px">
                <div className="w-12px h-12px bg-brutal-success border border-[var(--theme-border)]"></div>
                <span className="font-mono text-brutal-xs">OPTIMAL</span>
              </div>
              <div className="flex items-center gap-8px">
                <div className="w-12px h-12px bg-brutal-warning border border-[var(--theme-border)]"></div>
                <span className="font-mono text-brutal-xs">HIGH</span>
              </div>
              <div className="flex items-center gap-8px">
                <div className="w-12px h-12px bg-brutal-error border border-[var(--theme-border)]"></div>
                <span className="font-mono text-brutal-xs">OVERLOAD</span>
              </div>
            </div>
          </div>

          {/* Workload Visualization */}
          <div className="p-24px">
            <div className="space-y-16px">
              {memberStats.map((member: any, index: number) => {
                const taskCount = member.tasksAssigned
                const completionRate = member.tasksAssigned > 0 ? Math.round((member.tasksCompleted / member.tasksAssigned) * 100) : 0
                const isHighLoad = taskCount > 15
                const isMediumLoad = taskCount > 10
                const isLowProductivity = completionRate < 40

                return (
                  <div key={member._id} className={clsx(
                    "group relative bg-[var(--theme-background-secondary)] border-2 p-20px transition-all duration-200 hover:shadow-brutal-sm",
                    isHighLoad ? "border-brutal-error" :
                      isMediumLoad ? "border-brutal-warning" : "border-[var(--theme-border)]"
                  )}>
                    {/* Member Info Header */}
                    <div className="flex items-center justify-between mb-16px">
                      <div className="flex items-center gap-16px">
                        <UserDisplay
                          userId={member._id}
                          size="sm"
                          showName={true}
                          showStatus={true}
                        />
                        <div className="flex items-center gap-12px font-mono text-brutal-xs">
                          <span className="text-primary-brutalist/60">ROLE:</span>
                          <span className="font-bold uppercase">{member.role || 'DEVELOPER'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-16px">
                        {/* Status Indicators */}
                        {isHighLoad && (
                          <div className="flex items-center gap-4px px-8px py-2px bg-brutal-error/20 border-2 border-brutal-error">
                            <span className="w-4px h-4px bg-brutal-error"></span>
                            <span className="font-mono text-brutal-xs text-brutal-error font-bold">OVERLOADED</span>
                          </div>
                        )}
                        {isLowProductivity && taskCount > 0 && (
                          <div className="flex items-center gap-4px px-8px py-2px bg-brutal-warning/20 border-2 border-brutal-warning">
                            <span className="w-4px h-4px bg-brutal-warning"></span>
                            <span className="font-mono text-brutal-xs text-brutal-warning font-bold">LOW VELOCITY</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-8px opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="brutal-btn-secondary text-xs px-8px py-4px"
                            title="Reassign tasks"
                          >
                            BALANCE
                          </button>
                          <button
                            className="brutal-btn-secondary text-xs px-8px py-4px"
                            title="View task details"
                          >
                            DETAILS
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Workload Visualization */}
                    <div className="space-y-12px">
                      {/* Main Progress Bar */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-8px">
                          <span className="font-mono text-brutal-xs text-primary-brutalist/60">TASK LOAD</span>
                          <span className="font-mono text-brutal-xs font-bold">{taskCount} / {workloadData.max} TASKS</span>
                        </div>
                        <div className="h-32px bg-basalt-border border-2 border-[var(--theme-border)] relative overflow-hidden">
                          {/* Background capacity markers */}
                          <div className="absolute inset-0">
                            <div className="absolute h-full border-r-2 border-brutal-warning/30" style={{ left: '66.7%' }} title="High load threshold"></div>
                            <div className="absolute h-full border-r-2 border-brutal-error/30" style={{ left: '83.3%' }} title="Overload threshold"></div>
                          </div>

                          {/* Progress fill */}
                          <div
                            className={clsx(
                              "absolute inset-y-0 left-0 transition-all duration-500 flex items-center justify-center",
                              isHighLoad ? "bg-brutal-error" :
                                isMediumLoad ? "bg-brutal-warning" : "bg-brutal-success"
                            )}
                            style={{ width: `${Math.min(100, (taskCount / workloadData.max) * 100)}%` }}
                          >
                            <span className="font-mono text-brutal-xs font-bold text-event-horizon">
                              {Math.round((taskCount / workloadData.max) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Task Breakdown */}
                      <div className="grid grid-cols-3 gap-12px">
                        <div className="text-center">
                          <div className="font-mono text-brutal-lg font-bold text-brutal-success">{member.tasksCompleted}</div>
                          <div className="font-mono text-brutal-xs text-primary-brutalist/60">COMPLETED</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-brutal-lg font-bold text-brutal-warning">{member.tasksInProgress}</div>
                          <div className="font-mono text-brutal-xs text-primary-brutalist/60">IN PROGRESS</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-brutal-lg font-bold text-primary-brutalist">{completionRate}%</div>
                          <div className="font-mono text-brutal-xs text-primary-brutalist/60">COMPLETION</div>
                        </div>
                      </div>

                      {/* Time Tracking */}
                      {member.hoursTracked > 0 && (
                        <div className="flex items-center justify-between pt-8px border-t border-[var(--theme-border)]/50">
                          <span className="font-mono text-brutal-xs text-primary-brutalist/60">TIME TRACKED:</span>
                          <span className="font-mono text-brutal-xs font-bold">{member.hoursTracked}H THIS WEEK</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Team Summary Footer */}
            <div className="mt-24px pt-24px border-t-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 p-20px">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-16px font-mono text-center">
                <div>
                  <div className="text-brutal-lg font-bold text-primary-brutalist">{teamTotals.totalTasks}</div>
                  <div className="text-brutal-xs text-primary-brutalist/60">TOTAL TASKS</div>
                </div>
                <div>
                  <div className="text-brutal-lg font-bold text-brutal-success">{teamTotals.completedTasks}</div>
                  <div className="text-brutal-xs text-primary-brutalist/60">COMPLETED</div>
                </div>
                <div>
                  <div className="text-brutal-lg font-bold text-brutal-warning">{teamTotals.inProgressTasks}</div>
                  <div className="text-brutal-xs text-primary-brutalist/60">IN PROGRESS</div>
                </div>
                <div>
                  <div className="text-brutal-lg font-bold text-primary-brutalist">{teamTotals.avgProductivity}%</div>
                  <div className="text-brutal-xs text-primary-brutalist/60">AVG VELOCITY</div>
                </div>
              </div>

              {/* Smart Recommendations */}
              <div className="mt-16px">
                {memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 && (
                  <div className="flex items-center gap-8px p-12px bg-brutal-error/10 border-2 border-brutal-error">
                    <div className="w-8px h-8px bg-brutal-error animate-pulse"></div>
                    <span className="font-mono text-brutal-xs text-brutal-error font-bold">
                      {memberStats.filter((m: any) => m.tasksAssigned > 15).length} MEMBER(S) OVERLOADED - CONSIDER REDISTRIBUTING TASKS
                    </span>
                    <button className="ml-auto brutal-btn-secondary text-xs text-brutal-error border-brutal-error">
                      AUTO-BALANCE
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16px">
          {memberStats.map((member: any) => (
            <div key={member._id} className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-brutal hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200">
              {/* Header with enhanced user display */}
              <div className="p-20px border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
                <div className="flex items-center justify-between">
                  <UserDisplay
                    userId={member._id}
                    size="sm"
                    showName={true}
                    showStatus={true}
                    compact={false}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-8px">
                    <div className="text-right">
                      <div className="text-brutal-xs font-mono text-[var(--theme-foreground)]/60">ROLE</div>
                      <div className="text-brutal-xs font-bold text-primary-brutalist uppercase">
                        {member.role || 'DEVELOPER'}
                      </div>
                    </div>
                    <button className="p-4px hover:bg-basalt-border/30 transition-colors">
                      <HiOutlineDotsVertical className="w-16px h-16px text-[var(--theme-foreground)]/60" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-20px">
                {/* Task Statistics Grid */}
                <div className="grid grid-cols-2 gap-12px mb-20px">
                  <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-12px text-center">
                    <div className="text-brutal-md font-bold text-primary-brutalist">
                      {member.tasksAssigned}
                    </div>
                    <div className="text-brutal-xs font-mono text-[var(--theme-foreground)]/60 uppercase">
                      ASSIGNED
                    </div>
                  </div>
                  <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-12px text-center">
                    <div className="text-brutal-md font-bold text-brutal-success">
                      {member.tasksCompleted}
                    </div>
                    <div className="text-brutal-xs font-mono text-[var(--theme-foreground)]/60 uppercase">
                      COMPLETED
                    </div>
                  </div>
                  <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-12px text-center">
                    <div className="text-brutal-md font-bold text-brutal-info">
                      {member.tasksInProgress}
                    </div>
                    <div className="text-brutal-xs font-mono text-[var(--theme-foreground)]/60 uppercase">
                      IN PROGRESS
                    </div>
                  </div>
                  <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-12px text-center">
                    <div className={clsx(
                      "text-brutal-md font-bold",
                      member.tasksBlocked > 0 ? "text-brutal-error" : "text-[var(--theme-foreground)]/40"
                    )}>
                      {member.tasksBlocked}
                    </div>
                    <div className="text-brutal-xs font-mono text-[var(--theme-foreground)]/60 uppercase">
                      BLOCKED
                    </div>
                  </div>
                </div>

                {/* Productivity Section */}
                <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-16px mb-20px">
                  <div className="flex items-center justify-between mb-12px">
                    <div className="font-mono text-brutal-sm font-bold">
                      PRODUCTIVITY
                    </div>
                    <div className={clsx(
                      "font-mono text-brutal-sm font-bold",
                      member.productivity >= 90 ? "text-brutal-success" :
                        member.productivity >= 70 ? "text-brutal-warning" : "text-brutal-error"
                    )}>
                      {member.productivity}%
                    </div>
                  </div>

                  <div className="h-8px bg-basalt-border mb-8px">
                    <div
                      className={clsx(
                        "h-full transition-all duration-500 ease-out",
                        member.productivity >= 90 ? "bg-brutal-success" :
                          member.productivity >= 70 ? "bg-brutal-warning" : "bg-brutal-error"
                      )}
                      style={{ width: `${member.productivity}%` }}
                    />
                  </div>

                  <div className="font-mono text-brutal-xs text-[var(--theme-foreground)]/60">
                    LAST ACTIVE: {member.lastActive || 'UNKNOWN'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-12px">
                  <button
                    onClick={() => {
                      setActiveTab('tasks')
                      setTaskFilters(prev => ({
                        ...prev,
                        assigneeIds: [member._id]
                      }))
                    }}
                    className="flex-1 brutal-btn-secondary text-brutal-xs py-12px"
                  >
                    VIEW TASKS
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateTaskModal(true)
                      toast.info('Creating task for ' + (member.name || 'team member'))
                    }}
                    className="flex-1 brutal-btn-secondary text-brutal-xs py-12px"
                  >
                    ASSIGN TASK
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Member Card */}
          <div className="bg-[var(--theme-background)] border-2 border-dashed border-[var(--theme-border)] hover:border-primary-brutalist transition-all duration-200 cursor-pointer group">
            <div className="p-40px text-center">
              <div className="w-64px h-64px bg-basalt-border/20 border-2 border-dashed border-[var(--theme-border)] group-hover:border-primary-brutalist mx-auto mb-16px flex items-center justify-center transition-all">
                <HiOutlinePlus className="w-24px h-24px text-[var(--theme-foreground)]/60 group-hover:text-primary-brutalist" />
              </div>
              <h4 className="font-bold text-brutal-sm text-[var(--theme-foreground)]/60 group-hover:text-primary-brutalist mb-8px">
                ADD TEAM MEMBER
              </h4>
              <p className="text-brutal-xs text-[var(--theme-foreground)]/40 group-hover:text-[var(--theme-foreground)]/60">
                Invite someone to join this project
              </p>
            </div>
          </div>
        </div>

        {/* Team Activity Timeline */}
        <TeamActivityFeed
          projectId={projectId}
          workspaceId={workspaceId}
          limit={20}
          showFilters={true}
        />

        {/* Quick Actions - Functional */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
          <div className="p-24px border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
            <div className="flex items-center justify-between">
              <h3 className="text-brutal-lg font-bold uppercase">QUICK ACTIONS</h3>
              <div className="flex items-center gap-8px font-mono text-brutal-xs">
                <span className="text-primary-brutalist/60">SHORTCUTS FOR TEAM MANAGEMENT</span>
                <div className="w-4px h-4px bg-primary-brutalist animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="p-24px">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-16px">
              {/* Add Member Action */}
              <div className="group relative">
                <button
                  onClick={() => setShowProjectInviteModal(true)}
                  className="w-full brutal-btn-secondary flex flex-col items-center justify-center gap-12px p-20px min-h-120px transition-all duration-200 group-hover:shadow-brutal-hover group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]"
                >
                  <div className="flex items-center justify-center w-40px h-40px bg-basalt-border border-2 border-[var(--theme-border)]">
                    <HiOutlinePlus className="w-20px h-20px text-primary-brutalist" />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-brutal-sm font-bold">ADD MEMBER</div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60 mt-4px">INVITE TO PROJECT</div>
                  </div>
                </button>
                <div className="absolute -top-8px -right-8px opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-8px py-2px bg-primary-brutalist border-2 border-[var(--theme-border)] font-mono text-brutal-xs text-event-horizon">
                    SHIFT+A
                  </div>
                </div>
              </div>

              {/* Bulk Reassign Action */}
              <div className="group relative">
                <button
                  onClick={() => {
                    const overloadedMembers = memberStats.filter((m: any) => m.tasksAssigned > 15)
                    if (overloadedMembers.length > 0) {
                      // Open bulk reassign modal with overloaded members pre-selected
                      console.log('Opening bulk reassign for overloaded members:', overloadedMembers)
                    } else {
                      // Open general bulk reassign modal
                      console.log('Opening general bulk reassign modal')
                    }
                  }}
                  className={clsx(
                    "w-full brutal-btn-secondary flex flex-col items-center justify-center gap-12px p-20px min-h-120px transition-all duration-200 group-hover:shadow-brutal-hover group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]",
                    memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 && "border-brutal-warning bg-brutal-warning/10"
                  )}
                >
                  <div className={clsx(
                    "flex items-center justify-center w-40px h-40px border-2 border-[var(--theme-border)]",
                    memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 ? "bg-brutal-warning" : "bg-basalt-border"
                  )}>
                    <HiOutlineUserGroup className={clsx(
                      "w-20px h-20px",
                      memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 ? "text-event-horizon" : "text-primary-brutalist"
                    )} />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-brutal-sm font-bold">BULK REASSIGN</div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60 mt-4px">
                      {memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0
                        ? `${memberStats.filter((m: any) => m.tasksAssigned > 15).length} OVERLOADED`
                        : 'BALANCE WORKLOAD'
                      }
                    </div>
                  </div>
                  {memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 && (
                    <div className="absolute top-8px right-8px w-8px h-8px bg-brutal-error animate-pulse"></div>
                  )}
                </button>
                <div className="absolute -top-8px -right-8px opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-8px py-2px bg-primary-brutalist border-2 border-[var(--theme-border)] font-mono text-brutal-xs text-event-horizon">
                    SHIFT+B
                  </div>
                </div>
              </div>

              {/* Export Report Action */}
              <div className="group relative">
                <button
                  onClick={() => {
                    // Generate and download team performance report
                    const reportData = {
                      project: project.name,
                      date: new Date().toISOString(),
                      teamSize: memberStats.length,
                      totalTasks: teamTotals.totalTasks,
                      completedTasks: teamTotals.completedTasks,
                      avgProductivity: teamTotals.avgProductivity,
                      members: memberStats.map((m: any) => ({
                        name: m.name,
                        role: m.role,
                        tasksAssigned: m.tasksAssigned,
                        tasksCompleted: m.tasksCompleted,
                        productivity: m.productivity,
                        hoursTracked: m.hoursTracked
                      }))
                    }

                    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${project.name}-team-report-${new Date().toISOString().split('T')[0]}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="w-full brutal-btn-secondary flex flex-col items-center justify-center gap-12px p-20px min-h-120px transition-all duration-200 group-hover:shadow-brutal-hover group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]"
                >
                  <div className="flex items-center justify-center w-40px h-40px bg-basalt-border border-2 border-[var(--theme-border)]">
                    <HiOutlineChartBar className="w-20px h-20px text-primary-brutalist" />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-brutal-sm font-bold">EXPORT REPORT</div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60 mt-4px">TEAM PERFORMANCE</div>
                  </div>
                </button>
                <div className="absolute -top-8px -right-8px opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-8px py-2px bg-primary-brutalist border-2 border-[var(--theme-border)] font-mono text-brutal-xs text-event-horizon">
                    SHIFT+E
                  </div>
                </div>
              </div>

              {/* Team Settings Action */}
              <div className="group relative">
                <button
                  onClick={() => {
                    // Open team settings modal
                    console.log('Opening team settings modal')
                  }}
                  className="w-full brutal-btn-secondary flex flex-col items-center justify-center gap-12px p-20px min-h-120px transition-all duration-200 group-hover:shadow-brutal-hover group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]"
                >
                  <div className="flex items-center justify-center w-40px h-40px bg-basalt-border border-2 border-[var(--theme-border)]">
                    <HiOutlineCog className="w-20px h-20px text-primary-brutalist" />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-brutal-sm font-bold">TEAM SETTINGS</div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60 mt-4px">CONFIGURE PROJECT</div>
                  </div>
                </button>
                <div className="absolute -top-8px -right-8px opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-8px py-2px bg-primary-brutalist border-2 border-[var(--theme-border)] font-mono text-brutal-xs text-event-horizon">
                    SHIFT+S
                  </div>
                </div>
              </div>

              {/* Find Expert Action */}
              <div className="group relative">
                <button
                  onClick={() => setShowExpertiseSearch(true)}
                  className="w-full brutal-btn-secondary flex flex-col items-center justify-center gap-12px p-20px min-h-120px transition-all duration-200 group-hover:shadow-brutal-hover group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]"
                >
                  <div className="flex items-center justify-center w-40px h-40px bg-basalt-border border-2 border-[var(--theme-border)]">
                    <HiOutlineSearch className="w-20px h-20px text-primary-brutalist" />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-brutal-sm font-bold">FIND EXPERT</div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60 mt-4px">SEARCH EXPERTISE</div>
                  </div>
                </button>
                <div className="absolute -top-8px -right-8px opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-8px py-2px bg-primary-brutalist border-2 border-[var(--theme-border)] font-mono text-brutal-xs text-event-horizon">
                    SHIFT+F
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Suggestions Bar */}
            <div className="mt-24px pt-20px border-t-2 border-[var(--theme-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-12px">
                  <div className="w-8px h-8px bg-primary-brutalist animate-pulse"></div>
                  <span className="font-mono text-brutal-xs font-bold text-primary-brutalist">SMART SUGGESTIONS:</span>
                </div>
                <div className="flex items-center gap-8px">
                  {memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 && (
                    <button
                      onClick={() => {
                        // Quick balance action
                        console.log('Quick balancing overloaded members')
                      }}
                      className="px-12px py-6px bg-brutal-error/20 border-2 border-brutal-error font-mono text-brutal-xs text-brutal-error hover:bg-brutal-error hover:text-event-horizon transition-colors"
                    >
                      BALANCE {memberStats.filter((m: any) => m.tasksAssigned > 15).length} OVERLOADED
                    </button>
                  )}
                  {memberStats.filter((m: any) => m.tasksAssigned === 0).length > 0 && (
                    <button
                      onClick={() => {
                        // Assign tasks to idle members
                        console.log('Assigning tasks to idle members')
                      }}
                      className="px-12px py-6px bg-brutal-info/20 border-2 border-brutal-info font-mono text-brutal-xs text-brutal-info hover:bg-brutal-info hover:text-event-horizon transition-colors"
                    >
                      ASSIGN TO {memberStats.filter((m: any) => m.tasksAssigned === 0).length} IDLE
                    </button>
                  )}
                  {memberStats.filter((m: any) => m.productivity < 40 && m.tasksAssigned > 0).length > 0 && (
                    <div className="px-12px py-6px bg-brutal-warning/20 border-2 border-brutal-warning font-mono text-brutal-xs text-brutal-warning">
                      {memberStats.filter((m: any) => m.productivity < 40 && m.tasksAssigned > 0).length} LOW VELOCITY
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderGitHubTab = () => {
    // Check if project has repository configured
    if (!project?.repository) {
      return (
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-48px text-center">
          <HiOutlineCode className="w-48px h-48px text-primary-brutalist/30 mx-auto mb-16px" />
          <h3 className="font-mono text-brutal-sm uppercase mb-16px">NO REPOSITORY CONNECTED</h3>
          <p className="text-[var(--theme-foreground)]/60 mb-24px">Connect a GitHub repository to enable code tracking and PR management</p>
          <button
            onClick={() => setShowConnectRepoModal(true)}
            className="brutal-btn"
          >
            CONNECT REPOSITORY
          </button>
        </div>
      )
    }

    const repository = project.repository

    // Note: Real GitHub integration would require GitHub API calls with access tokens
    // For now, showing empty state - would need to implement GitHub API integration
    const pullRequests: any[] = []
    const branches: any[] = []

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
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
          <div className="flex items-center justify-between mb-16px">
            <div className="flex items-center gap-16px">
              <HiOutlineCode className="w-24px h-24px text-primary-brutalist" />
              <div>
                <h2 className="text-brutal-lg font-bold uppercase">{repository.provider.toUpperCase()} REPOSITORY</h2>
                <p className="font-mono text-brutal-xs text-primary-brutalist/60">{repository.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-12px">
              <button
                onClick={() => {
                  const cloneUrl = repository.url.endsWith('.git') ? repository.url : `${repository.url}.git`
                  navigator.clipboard.writeText(cloneUrl)
                  toast.success('Clone URL copied to clipboard')
                }}
                className="brutal-btn-sm"
              >
                CLONE
              </button>
              <button
                onClick={() => window.open(repository.url, '_blank')}
                className="brutal-btn-sm"
              >
                OPEN IN GITHUB
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-16px">
            <div className="border-2 border-[var(--theme-border)] p-16px">
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">DEFAULT BRANCH</div>
              <div className="font-bold">{repository.defaultBranch}</div>
            </div>
            <div className="border-2 border-[var(--theme-border)] p-16px">
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">OPEN PRS</div>
              <div className="font-bold text-brutal-info">{pullRequests.filter(pr => pr.status === 'open').length}</div>
            </div>
            <div className="border-2 border-[var(--theme-border)] p-16px">
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">ACTIVE BRANCHES</div>
              <div className="font-bold">{branches.length}</div>
            </div>
            <div className="border-2 border-[var(--theme-border)] p-16px">
              <div className="font-mono text-brutal-xs text-primary-brutalist/60 mb-4px">CI STATUS</div>
              <div className="font-bold text-brutal-success">PASSING</div>
            </div>
          </div>
        </div>

        {/* Pull Request Queue */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
          <div className="flex items-center justify-between mb-16px">
            <h3 className="text-brutal-lg font-bold uppercase">PULL REQUEST QUEUE</h3>
            <div className="flex items-center gap-12px">
              <button className="font-mono text-brutal-xs uppercase text-primary-brutalist/60 hover:text-primary-brutalist">
                FILTER ▼
              </button>
              <button
                onClick={() => {
                  const createPrUrl = `${repository.url}/compare`
                  window.open(createPrUrl, '_blank')
                }}
                className="brutal-btn-sm"
              >
                CREATE PR
              </button>
            </div>
          </div>

          <div className="space-y-12px">
            {pullRequests.length > 0 ? pullRequests.map((pr) => (
              <div key={pr.id} className="border-2 border-[var(--theme-border)] p-16px hover:border-primary-brutalist transition-all">
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
            )) : (
              <div className="text-center py-32px">
                <HiOutlineCode className="w-32px h-32px text-primary-brutalist/30 mx-auto mb-12px" />
                <p className="font-mono text-brutal-sm text-primary-brutalist/60">
                  No pull requests found
                </p>
                <p className="font-mono text-brutal-xs text-[var(--theme-foreground)]/60">
                  GitHub API integration required to fetch real data
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Branch Management */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
          <div className="flex items-center justify-between mb-16px">
            <h3 className="text-brutal-lg font-bold uppercase">BRANCH MANAGEMENT</h3>
            <button className="brutal-btn-sm">CREATE BRANCH</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-brutal-sm">
              <thead>
                <tr className="border-b-2 border-[var(--theme-border)]">
                  <th className="text-left py-8px text-brutal-xs text-primary-brutalist/60 uppercase">BRANCH</th>
                  <th className="text-left py-8px text-brutal-xs text-primary-brutalist/60 uppercase">STATUS</th>
                  <th className="text-left py-8px text-brutal-xs text-primary-brutalist/60 uppercase">LAST COMMIT</th>
                  <th className="text-right py-8px text-brutal-xs text-primary-brutalist/60 uppercase">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {branches.length > 0 ? branches.map((branch) => (
                  <tr key={branch.name} className="border-b border-[var(--theme-border)] hover:bg-basalt-border/10">
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
                )) : (
                  <tr>
                    <td colSpan={4} className="py-32px text-center">
                      <HiOutlineCode className="w-32px h-32px text-primary-brutalist/30 mx-auto mb-12px" />
                      <p className="font-mono text-brutal-sm text-primary-brutalist/60">
                        No branches found
                      </p>
                      <p className="font-mono text-brutal-xs text-[var(--theme-foreground)]/60">
                        GitHub API integration required to fetch real data
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Review Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
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

            <div className="mt-16px pt-16px border-t-2 border-[var(--theme-border)]">
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
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
            <h3 className="text-brutal-lg font-bold uppercase mb-16px">CI/CD PIPELINE</h3>
            <div className="space-y-8px">
              {ciPipeline.map((stage) => (
                <div key={stage.name} className="flex items-center justify-between p-12px bg-[var(--theme-background-secondary)]/10 border border-[var(--theme-border)]">
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
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
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
        return <GitHubProjectTab project={project} workspaceId={workspaceId as any} />
      case 'meetings':
        return (
          <div className="space-y-24px">
            {/* Header */}
            <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
              <div className="flex items-center justify-between mb-16px">
                <h2 className="text-brutal-lg font-bold uppercase">PROJECT MEETINGS</h2>
                <button
                  onClick={() => setShowScheduleMeetingModal(true)}
                  className="brutal-btn"
                >
                  SCHEDULE MEETING
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12px">
                <button
                  onClick={() => {
                    setShowScheduleMeetingModal(true)
                    // Auto-select standup type
                  }}
                  className="brutal-btn-secondary text-xs"
                >
                  🏃 DAILY STANDUP
                </button>
                <button
                  onClick={() => {
                    setShowScheduleMeetingModal(true)
                    // Auto-select retrospective type
                  }}
                  className="brutal-btn-secondary text-xs"
                >
                  🔄 RETROSPECTIVE
                </button>
                <button
                  onClick={() => {
                    setShowScheduleMeetingModal(true)
                    // Auto-select planning type
                  }}
                  className="brutal-btn-secondary text-xs"
                >
                  📋 SPRINT PLANNING
                </button>
                <button
                  onClick={() => {
                    setShowScheduleMeetingModal(true)
                    // Auto-select review type
                  }}
                  className="brutal-btn-secondary text-xs"
                >
                  👥 SPRINT REVIEW
                </button>
              </div>
            </div>

            {/* Meetings List */}
            <div className="space-y-16px">
              {projectMeetings && projectMeetings.length > 0 ? (
                <>
                  {/* Upcoming Meetings */}
                  {projectMeetings.filter((m: any) => m.startTime > Date.now()).length > 0 && (
                    <div>
                      <h3 className="text-brutal-sm font-bold uppercase mb-12px text-primary-brutalist">
                        UPCOMING MEETINGS
                      </h3>
                      <div className="space-y-12px">
                        {projectMeetings
                          .filter((m: any) => m.startTime > Date.now())
                          .slice(0, 5)
                          .map((meeting: any) => (
                            <MeetingCard
                              key={meeting._id}
                              meeting={meeting}
                              currentUserId={currentUser?._id}
                              onEdit={(m) => {
                                // TODO: Open edit modal
                                toast('Edit meeting functionality coming soon', { icon: '🚧' })
                              }}
                              onViewNotes={(m) => {
                                // TODO: Open notes modal
                                toast('Meeting notes functionality coming soon', { icon: '📝' })
                              }}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Past Meetings */}
                  {projectMeetings.filter((m: any) => m.endTime < Date.now()).length > 0 && (
                    <div>
                      <h3 className="text-brutal-sm font-bold uppercase mb-12px text-[var(--theme-foreground)]/60">
                        RECENT MEETINGS
                      </h3>
                      <div className="space-y-12px">
                        {projectMeetings
                          .filter((m: any) => m.endTime < Date.now())
                          .slice(0, 3)
                          .map((meeting: any) => (
                            <MeetingCard
                              key={meeting._id}
                              meeting={meeting}
                              currentUserId={currentUser?._id}
                              onViewNotes={(m) => {
                                // TODO: Open notes modal
                                toast.info('Meeting notes functionality coming soon')
                              }}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-48px text-center">
                  <HiOutlineVideoCamera className="w-48px h-48px text-primary-brutalist/30 mx-auto mb-16px" />
                  <h3 className="font-mono text-brutal-sm uppercase mb-16px">NO MEETINGS SCHEDULED</h3>
                  <p className="text-[var(--theme-foreground)]/60 mb-24px">
                    Schedule standup meetings, sprint reviews, and planning sessions for your team
                  </p>
                  <button
                    onClick={() => setShowScheduleMeetingModal(true)}
                    className="brutal-btn"
                  >
                    SCHEDULE FIRST MEETING
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      case 'docs':
        return (
          <AIDocumentationHub
            projectId={projectId}
            workspaceId={workspaceId}
          />
        )
      case 'logs':
        return (
          <TeamActivityFeed
            projectId={projectId}
            workspaceId={workspaceId}
            limit={50}
            showFilters={true}
          />
        )
      case 'settings':
        return (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
            <h2 className="text-brutal-lg font-bold uppercase mb-24px">PROJECT SETTINGS</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24px">
              {/* General Settings */}
              <div className="space-y-24px">
                <div>
                  <h3 className="text-brutal-sm font-bold uppercase mb-16px">GENERAL</h3>
                  <div className="space-y-16px">
                    <div>
                      <label className="block text-brutal-xs uppercase mb-8px">PROJECT NAME</label>
                      <input
                        type="text"
                        defaultValue={project.name}
                        className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-brutal-xs uppercase mb-8px">DESCRIPTION</label>
                      <textarea
                        defaultValue={project.description}
                        rows={3}
                        className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-brutal-xs uppercase mb-8px">PROJECT KEY</label>
                      <input
                        type="text"
                        defaultValue={project.key}
                        disabled
                        className="w-full px-16px py-12px bg-basalt-border border-2 border-[var(--theme-border)] font-mono text-brutal-sm text-[var(--theme-foreground)]/60"
                      />
                      <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mt-4px">Project key cannot be changed</p>
                    </div>
                  </div>
                </div>

                {/* Workflow Settings */}
                <div>
                  <h3 className="text-brutal-sm font-bold uppercase mb-16px">WORKFLOW</h3>
                  <div className="space-y-16px">
                    <div>
                      <label className="block text-brutal-xs uppercase mb-8px">WORKFLOW TYPE</label>
                      <select
                        defaultValue={project.settings?.workflowType || 'kanban'}
                        className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm"
                      >
                        <option value="kanban">KANBAN</option>
                        <option value="scrum">SCRUM</option>
                        <option value="hybrid">HYBRID</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>



              {/* Team Assignment */}
              <div>
                <h3 className="text-brutal-sm font-bold uppercase mb-16px">TEAM ASSIGNMENT</h3>
                <div className="space-y-16px">
                  <div>
                    <label className="block text-brutal-xs uppercase mb-8px">ASSIGNED TEAMS</label>
                    <div className="flex flex-wrap gap-8px mb-12px">
                      {project.teamIds && project.teamIds.length > 0 ? (
                        project.teamIds.map((teamId: string) => {
                          const team = availableTeams?.find(t => t._id === teamId)
                          return (
                            <span key={teamId} className="px-12px py-6px bg-primary-brutalist/10 border border-primary-brutalist text-brutal-xs font-mono uppercase flex items-center gap-8px">
                              {team?.name || 'Unknown Team'}
                              {/* <button className="hover:text-brutal-error">×</button> */}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-brutal-xs font-mono text-[var(--theme-foreground)]/60">No teams assigned</span>
                      )}
                    </div>

                    <div className="flex gap-8px">
                      <select
                        className="flex-1 px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm"
                        onChange={async (e) => {
                          if (e.target.value) {
                            try {
                              await assignTeam({
                                projectId: project._id,
                                teamId: e.target.value as any
                              })
                              toast.success('Team assigned successfully')
                            } catch (error) {
                              toast.error('Failed to assign team')
                              console.error(error)
                            }
                            e.target.value = ''
                          }
                        }}
                      >
                        <option value="">SELECT TEAM TO ASSIGN...</option>
                        {availableTeams?.filter(t => !project.teamIds?.includes(t._id)).map(team => (
                          <option key={team._id} value={team._id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-24px">
                <div>
                  <h3 className="text-brutal-sm font-bold uppercase mb-16px text-brutal-error">DANGER ZONE</h3>
                  <div className="border-2 border-brutal-error p-16px">
                    <h4 className="text-brutal-xs font-bold uppercase mb-8px">ARCHIVE PROJECT</h4>
                    <p className="text-brutal-xs text-[var(--theme-foreground)]/80 mb-16px">
                      Archive this project. It will be hidden from the workspace but data will be preserved.
                    </p>
                    <button className="brutal-btn bg-brutal-error border-brutal-error">
                      ARCHIVE PROJECT
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-16px mt-32px pt-24px border-t-2 border-[var(--theme-border)]">
              <button className="brutal-btn-secondary">CANCEL</button>
              <button className="brutal-btn">SAVE CHANGES</button>
            </div>
          </div >
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex flex-col">
      {/* Project Header */}
      <div className="border-b-2 border-[var(--theme-border)] bg-[var(--theme-background)] sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(`/workspace/${workspaceId}`)}
              className="group flex items-center gap-2 font-mono text-xs text-[var(--theme-foreground)]/60 hover:text-[var(--theme-primary)] transition-colors"
            >
              <HiOutlineArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              BACK TO WORKSPACE
            </button>

            <div className="h-8 w-[2px] bg-[var(--theme-border)]" />

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                  {project.name}
                </h1>
                <BrutalBadge variant={
                  project.status === 'active' ? 'default' :
                    project.status === 'completed' ? 'success' :
                      project.status === 'on_hold' ? 'warning' : 'outline'
                }>
                  {project.status}
                </BrutalBadge>
              </div>
              <div className="font-mono text-xs text-[var(--theme-foreground)]/60 flex items-center gap-2">
                <span>ID: {project.key}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <BrutalButton size="sm" variant="ghost" onClick={() => setShowProjectInviteModal(true)}>
              <HiOutlineUserGroup className="w-4 h-4 mr-2" />
              INVITE
            </BrutalButton>
            <BrutalButton size="sm" variant="primary" onClick={() => setShowCreateTaskModal(true)}>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              NEW TASK
            </BrutalButton>
          </div>
        </div>

        {/* Project Navigation Tabs */}
        <div className="px-6 flex items-end gap-1 overflow-x-auto no-scrollbar border-t border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={clsx(
                "relative px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all",
                "border-r border-[var(--theme-border)]",
                activeTab === tab.id
                  ? "bg-[var(--theme-background)] text-[var(--theme-primary)] border-t-2 border-t-[var(--theme-primary)]"
                  : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
              )}
            >
              <div className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
                {tab.id === 'tasks' && (
                  <span className={clsx(
                    "ml-1 px-1.5 py-0.5 text-[10px]",
                    activeTab === tab.id ? "bg-[var(--theme-primary)] text-[var(--theme-background)]" : "bg-[var(--theme-border)]"
                  )}>
                    {tasks?.length || 0}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Viewport */}
      <main className={clsx(
        "flex-1 p-6",
        (activeTab === 'tasks' && taskView === 'kanban') ? "overflow-hidden flex flex-col" : "overflow-y-auto"
      )}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={clsx((activeTab === 'tasks' && taskView === 'kanban') && "h-full flex flex-col")}
        >
          {renderTabContent()}
        </motion.div>
      </main>

      {/* Modals */}
      {projectId && (
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          projectId={projectId}
          onSuccess={() => { }}
        />
      )}

      {selectedTask && (
        <EditTaskModal
          isOpen={showEditTaskModal}
          onClose={() => {
            setShowEditTaskModal(false)
            setSelectedTask(null)
          }}
          task={selectedTask}
          onDelete={async () => {
            await handleDeleteTask(selectedTask)
            setShowEditTaskModal(false)
            setSelectedTask(null)
          }}
        />
      )}

      {workspaceId && (
        <TaskFilters
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={taskFilters}
          onFiltersChange={setTaskFilters}
          workspaceId={workspaceId}
        />
      )}

      {projectId && (
        <CreateSprintModal
          isOpen={showCreateSprintModal}
          onClose={() => setShowCreateSprintModal(false)}
          projectId={projectId}
          onSuccess={() => setShowCreateSprintModal(false)}
        />
      )}

      {projectId && workspaceId && (
        <ScheduleMeetingModal
          isOpen={showScheduleMeetingModal}
          onClose={() => setShowScheduleMeetingModal(false)}
          projectId={projectId}
          workspaceId={workspaceId}
          onSuccess={() => setShowScheduleMeetingModal(false)}
        />
      )}

      {projectId && project && (
        <ProjectInviteModal
          isOpen={showProjectInviteModal}
          onClose={() => setShowProjectInviteModal(false)}
          projectId={projectId}
          projectName={project.name}
        />
      )}

      {showExpertiseSearch && (
        <ExpertiseSearchModal
          onClose={() => setShowExpertiseSearch(false)}
          workspaceId={workspaceId}
        />
      )}

      {showExpertiseMatrix && workspaceId && (
        <TeamExpertiseMatrix
          workspaceId={workspaceId}
          onClose={() => setShowExpertiseMatrix(false)}
          isModal={true}
        />
      )}
    </div>
  )
}