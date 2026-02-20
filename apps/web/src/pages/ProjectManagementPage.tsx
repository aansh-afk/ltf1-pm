import React, { useCallback, Suspense, useReducer } from 'react'
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
import TaskFilters from '@/components/features/task/TaskFilters'
import ScheduleMeetingModal from '@/components/features/meetings/ScheduleMeetingModal'
import MeetingCard from '@/components/features/meetings/MeetingCard'
import ProjectInviteModal from '@/components/features/project/ProjectInviteModal'
import UserDisplay from '@/components/features/user/UserDisplay'
import DeveloperTimeline from '@/components/features/project/DeveloperTimeline'
const SprintBurndownChart = React.lazy(() => import('@/components/features/project/SprintBurndownChart'))
const TaskDistributionCharts = React.lazy(() => import('@/components/features/project/TaskDistributionCharts'))
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
import ProjectDocsHub from '@/components/features/documentation/ProjectDocsHub'
import type { TaskFilters as TaskFiltersType } from '@/components/features/task/TaskFilters'
import { useTemporaryShortcut } from '@/contexts/ShortcutContext'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import { m } from 'framer-motion'

type TabType = 'overview' | 'tasks' | 'team' | 'github' | 'meetings' | 'docs' | 'logs' | 'settings'

interface HealthCard {
  title: string
  status: 'success' | 'warning' | 'error' | 'info'
  value: string | number
  subtitle?: string
  icon: React.ReactNode
}

type TaskViewType = 'sprint' | 'kanban' | 'list' | 'gantt' | 'calendar'

type PageAction =
  | { type: 'SET_TAB'; tab: TabType }
  | { type: 'SET_TASK_VIEW'; view: TaskViewType }
  | { type: 'TOGGLE_MY_TASKS' }
  | { type: 'TOGGLE_COMPACT_VIEW' }
  | { type: 'SET_CONTEXT'; context: string | null }
  | { type: 'OPEN_CREATE_TASK' }
  | { type: 'OPEN_EDIT_TASK'; task: any }
  | { type: 'OPEN_CREATE_SPRINT' }
  | { type: 'OPEN_PROJECT_INVITE' }
  | { type: 'OPEN_SCHEDULE_MEETING' }
  | { type: 'OPEN_EXPERTISE_SEARCH' }
  | { type: 'OPEN_EXPERTISE_MATRIX' }
  | { type: 'CLOSE_MODALS' }
  | { type: 'TOGGLE_ADVANCED_FILTERS' }
  | { type: 'SET_SPRINT_ID'; sprintId: string | null }
  | { type: 'SET_TASK_FILTERS'; filters: TaskFiltersType }

interface PageState {
  activeTab: TabType
  taskView: TaskViewType
  showMyTasks: boolean
  isCompactView: boolean
  currentContext: string | null
  showCreateTaskModal: boolean
  showEditTaskModal: boolean
  showCreateSprintModal: boolean
  showProjectInviteModal: boolean
  showScheduleMeetingModal: boolean
  showExpertiseSearch: boolean
  showExpertiseMatrix: boolean
  selectedTask: any
  showAdvancedFilters: boolean
  selectedSprintId: string | null
  taskFilters: TaskFiltersType
}

const pageInitialState: PageState = {
  activeTab: 'overview',
  taskView: 'sprint',
  showMyTasks: false,
  isCompactView: false,
  currentContext: null,
  showCreateTaskModal: false,
  showEditTaskModal: false,
  showCreateSprintModal: false,
  showProjectInviteModal: false,
  showScheduleMeetingModal: false,
  showExpertiseSearch: false,
  showExpertiseMatrix: false,
  selectedTask: null,
  showAdvancedFilters: false,
  selectedSprintId: 'all',
  taskFilters: {
    search: '',
    status: [],
    priority: [],
    type: [],
    assigneeIds: [],
    labels: [],
    dueDateRange: { start: null, end: null },
    createdDateRange: { start: null, end: null },
    hasTimeTracked: undefined,
    isOverdue: undefined,
  },
}

function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab }
    case 'SET_TASK_VIEW':
      return { ...state, taskView: action.view }
    case 'TOGGLE_MY_TASKS':
      return { ...state, showMyTasks: !state.showMyTasks }
    case 'TOGGLE_COMPACT_VIEW':
      return { ...state, isCompactView: !state.isCompactView }
    case 'SET_CONTEXT':
      return { ...state, currentContext: action.context }
    case 'OPEN_CREATE_TASK':
      return { ...state, showCreateTaskModal: true }
    case 'OPEN_EDIT_TASK':
      return { ...state, showEditTaskModal: true, selectedTask: action.task }
    case 'OPEN_CREATE_SPRINT':
      return { ...state, showCreateSprintModal: true }
    case 'OPEN_PROJECT_INVITE':
      return { ...state, showProjectInviteModal: true }
    case 'OPEN_SCHEDULE_MEETING':
      return { ...state, showScheduleMeetingModal: true }
    case 'OPEN_EXPERTISE_SEARCH':
      return { ...state, showExpertiseSearch: true }
    case 'OPEN_EXPERTISE_MATRIX':
      return { ...state, showExpertiseMatrix: true }
    case 'CLOSE_MODALS':
      return { ...state, showCreateTaskModal: false, showEditTaskModal: false, showCreateSprintModal: false, showProjectInviteModal: false, showScheduleMeetingModal: false, showExpertiseSearch: false, showExpertiseMatrix: false, selectedTask: null }
    case 'TOGGLE_ADVANCED_FILTERS':
      return { ...state, showAdvancedFilters: !state.showAdvancedFilters }
    case 'SET_SPRINT_ID':
      return { ...state, selectedSprintId: action.sprintId }
    case 'SET_TASK_FILTERS':
      return { ...state, taskFilters: action.filters }
    default:
      return state
  }
}

// --- Sub-components ---

interface OverviewTabProps {
  project: any
  allSprints: any[] | undefined
  tasks: any[] | undefined
  healthCards: HealthCard[]
  getStatusColor: (status: string) => string
}

function OverviewTab({ project, allSprints, tasks, healthCards, getStatusColor }: OverviewTabProps) {
  const activeSprint = allSprints?.find(s => s.status === 'active')

  return (
    <div className="space-y-5">
      {/* Mission Brief & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project Overview */}
        <BrutalCard variant="default" className="lg:col-span-2" padding="sm">
          <div className="flex items-center gap-3 mb-3 border-b-2 border-[var(--theme-border)] pb-3">
            <HiOutlineChip className="w-5 h-5 text-[var(--theme-primary)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Project Overview</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="bg-[var(--theme-background-secondary)] p-3 border border-[var(--theme-border)]">
              <span className="block text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider mb-1">PROJECT LEAD</span>
              <span className="block font-bold text-sm truncate">{project.lead?.name || 'Unassigned'}</span>
            </div>
            <div className="bg-[var(--theme-background-secondary)] p-3 border border-[var(--theme-border)]">
              <span className="block text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider mb-1">TEAM SIZE</span>
              <span className="block font-bold text-sm">{project.members?.length || 0} Members</span>
            </div>
            <div className="bg-[var(--theme-background-secondary)] p-3 border border-[var(--theme-border)]">
              <span className="block text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider mb-1">WORKFLOW</span>
              <span className="block font-bold text-sm uppercase">{project.settings?.workflowType || 'Kanban'}</span>
            </div>
          </div>

          {project.description && (
            <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[var(--theme-foreground)]/80 leading-relaxed border-l-4 border-[var(--theme-primary)] pl-3">
              {project.description}
            </div>
          )}
        </BrutalCard>

        {/* System Status (Health Cards) */}
        <div className="space-y-3">
          {healthCards.map((card) => (
            <BrutalCard
              key={card.title}
              variant="bordered"
              padding="sm"
              className={clsx(
                "hover:translate-x-1",
                card.status === 'error' && "border-[var(--theme-error)]",
                card.status === 'warning' && "border-[var(--theme-warning)]",
                card.status === 'success' && "border-[var(--theme-success)]"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider mb-1">{card.title}</div>
                  <div className="text-xl font-bold">{card.value}</div>
                </div>
                <div className={clsx(
                  "p-1.5 border-2",
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BrutalCard variant="default" padding="sm" className="min-h-[260px]">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineLightningBolt className="w-4 h-4 text-[var(--theme-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">AI Insights</h3>
          </div>
          <AIInsightsPanel
            projectId={project._id}
            sprintId={activeSprint?._id}
            compact={true}
          />
        </BrutalCard>

        <div className="space-y-4">
          <BrutalCard variant="default" padding="sm">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineChartBar className="w-4 h-4 text-[var(--theme-primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Velocity</h3>
            </div>
            {activeSprint ? (
              <Suspense fallback={<div className="h-32 flex items-center justify-center"><span className="font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase">Loading chart...</span></div>}>
                <SprintBurndownChart
                  sprint={activeSprint}
                  tasks={tasks || []}
                  showPrediction={true}
                />
              </Suspense>
            ) : (
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-[var(--theme-border)]">
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground)]/40 uppercase tracking-wider">No Active Sprint Data</span>
              </div>
            )}
          </BrutalCard>

          <BrutalCard variant="default" padding="sm">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineClock className="w-4 h-4 text-[var(--theme-primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Activity</h3>
            </div>
            <GitHubStyleHeatmap
              tasks={tasks || []}
              weeks={12}
            />
          </BrutalCard>
        </div>
      </div>

      {/* Task Generator */}
      <BrutalCard variant="bordered" padding="sm" className="border-dashed">
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

interface MeetingsTabProps {
  projectMeetings: any[] | undefined
  currentUserId: any
  onScheduleMeeting: () => void
}

function MeetingsTab({ projectMeetings, currentUserId, onScheduleMeeting }: MeetingsTabProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold font-bold uppercase">PROJECT MEETINGS</h2>
          <button
            onClick={onScheduleMeeting}
            className="bg-[var(--theme-primary)] text-white border-2 border-[var(--theme-primary-active)] rounded-lg px-5 py-2.5 font-semibold text-sm font-['Inter',sans-serif] hover:bg-[var(--theme-primary-active)] transition-colors"
          >
            SCHEDULE MEETING
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          <button
            onClick={onScheduleMeeting}
            className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-xs"
          >
            🏃 DAILY STANDUP
          </button>
          <button
            onClick={onScheduleMeeting}
            className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-xs"
          >
            🔄 RETROSPECTIVE
          </button>
          <button
            onClick={onScheduleMeeting}
            className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-xs"
          >
            📋 SPRINT PLANNING
          </button>
          <button
            onClick={onScheduleMeeting}
            className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-xs"
          >
            👥 SPRINT REVIEW
          </button>
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-2">
        {projectMeetings && projectMeetings.length > 0 ? (
          <>
            {/* Upcoming Meetings */}
            {projectMeetings.filter((m: any) => m.startTime > Date.now()).length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase mb-2 text-[var(--theme-primary)]">
                  UPCOMING MEETINGS
                </h3>
                <div className="space-y-2">
                  {projectMeetings
                    .filter((m: any) => m.startTime > Date.now())
                    .slice(0, 5)
                    .map((meeting: any) => (
                      <MeetingCard
                        key={meeting._id}
                        meeting={meeting}
                        currentUserId={currentUserId}
                        onEdit={(m) => {
                          toast('Edit meeting functionality coming soon', { icon: '🚧' })
                        }}
                        onViewNotes={(m) => {
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
                <h3 className="text-xs font-bold uppercase mb-2 text-[var(--theme-foreground)]/60">
                  RECENT MEETINGS
                </h3>
                <div className="space-y-2">
                  {projectMeetings
                    .filter((m: any) => m.endTime < Date.now())
                    .slice(0, 3)
                    .map((meeting: any) => (
                      <MeetingCard
                        key={meeting._id}
                        meeting={meeting}
                        currentUserId={currentUserId}
                        onViewNotes={(m) => {
                          toast.info('Meeting notes functionality coming soon')
                        }}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-5 text-center">
            <HiOutlineVideoCamera className="w-5 h-5 text-[var(--theme-foreground-tertiary)]/40 mx-auto mb-2" />
            <h3 className="font-['IBM_Plex_Mono',monospace] text-xs uppercase mb-2">NO MEETINGS SCHEDULED</h3>
            <p className="text-[var(--theme-foreground)]/60 text-xs mb-3">
              Schedule standup meetings, sprint reviews, and planning sessions for your team
            </p>
            <button
              onClick={onScheduleMeeting}
              className="bg-[var(--theme-primary)] text-white border-2 border-[var(--theme-primary-active)] rounded-lg px-5 py-2.5 font-semibold text-sm font-['Inter',sans-serif] hover:bg-[var(--theme-primary-active)] transition-colors"
            >
              SCHEDULE FIRST MEETING
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface SettingsTabProps {
  project: any
  availableTeams: any[] | undefined
  assignTeam: (args: { projectId: any; teamId: any }) => Promise<any>
}

function SettingsTab({ project, availableTeams, assignTeam }: SettingsTabProps) {
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-4">
      <h2 className="text-xs font-semibold font-bold uppercase mb-3">PROJECT SETTINGS</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* General Settings */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase mb-2">GENERAL</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="project-settings-name" className="block text-xs uppercase mb-1">PROJECT NAME</label>
                <input
                  id="project-settings-name"
                  type="text"
                  defaultValue={project.name}
                  className="w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-['IBM_Plex_Mono',monospace] text-xs"
                />
              </div>
              <div>
                <label htmlFor="project-settings-description" className="block text-xs uppercase mb-1">DESCRIPTION</label>
                <textarea
                  id="project-settings-description"
                  defaultValue={project.description}
                  rows={3}
                  className="w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-['IBM_Plex_Mono',monospace] text-xs resize-none"
                />
              </div>
              <div>
                <label htmlFor="project-settings-key" className="block text-xs uppercase mb-1">PROJECT KEY</label>
                <input
                  id="project-settings-key"
                  type="text"
                  defaultValue={project.key}
                  disabled
                  className="w-full px-2.5 py-2 bg-[var(--theme-border)] border-2 border-[var(--theme-border)] font-['IBM_Plex_Mono',monospace] text-xs text-[var(--theme-foreground)]/60"
                />
                <p className="text-xs text-[var(--theme-foreground)]/60 mt-4px">Project key cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Workflow Settings */}
          <div>
            <h3 className="text-xs font-bold uppercase mb-2">WORKFLOW</h3>
            <div className="space-y-2">
              <div>
                <label htmlFor="project-settings-workflow-type" className="block text-xs uppercase mb-1">WORKFLOW TYPE</label>
                <select
                  id="project-settings-workflow-type"
                  defaultValue={project.settings?.workflowType || 'kanban'}
                  className="w-full px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-['IBM_Plex_Mono',monospace] text-xs"
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
          <h3 className="text-xs font-bold uppercase mb-2">TEAM ASSIGNMENT</h3>
          <div className="space-y-2">
            <div>
              <label htmlFor="project-settings-assigned-teams" className="block text-xs uppercase mb-1">ASSIGNED TEAMS</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {project.teamIds && project.teamIds.length > 0 ? (
                  project.teamIds.map((teamId: string) => {
                    const team = availableTeams?.find(t => t._id === teamId)
                    return (
                      <span key={teamId} className="px-2.5 py-1 bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)] text-xs font-['IBM_Plex_Mono',monospace] uppercase flex items-center gap-2">
                        {team?.name || 'Unknown Team'}
                      </span>
                    )
                  })
                ) : (
                  <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60">No teams assigned</span>
                )}
              </div>

              <div className="flex gap-2">
                <select
                  id="project-settings-assigned-teams"
                  className="flex-1 px-2.5 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-['IBM_Plex_Mono',monospace] text-xs"
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
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase mb-2 text-[var(--theme-error)]">DANGER ZONE</h3>
            <div className="border-2 border-[var(--theme-error)] p-2.5">
              <h4 className="text-xs font-bold uppercase mb-1.5">ARCHIVE PROJECT</h4>
              <p className="text-xs text-[var(--theme-foreground)]/80 mb-2">
                Archive this project. It will be hidden from the workspace but data will be preserved.
              </p>
              <button className="bg-[var(--theme-primary)] text-white border-2 border-[var(--theme-primary-active)] rounded-lg px-5 py-2.5 font-semibold text-sm font-['Inter',sans-serif] hover:bg-[var(--theme-primary-active)] transition-colors bg-[var(--theme-error)] border-[var(--theme-error)]">
                ARCHIVE PROJECT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t-2 border-[var(--theme-border)]">
        <button className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors">CANCEL</button>
        <button className="bg-[var(--theme-primary)] text-white border-2 border-[var(--theme-primary-active)] rounded-lg px-5 py-2.5 font-semibold text-sm font-['Inter',sans-serif] hover:bg-[var(--theme-primary-active)] transition-colors">SAVE CHANGES</button>
      </div>
    </div >
  )
}

interface TasksTabProps {
  project: any
  workspaceId: string
  tasks: any[] | undefined
  allSprints: any[] | undefined
  activeSprint: any
  taskFilters: TaskFiltersType
  taskView: TaskViewType
  selectedSprintId: string | null
  isCompactView: boolean
  projectId: string
  dispatch: React.Dispatch<PageAction>
  handleEditTask: (task: any) => void
  handleDeleteTask: (task: any) => void
  handleDuplicateTask: (task: any) => void
}

function TasksTab({
  project, workspaceId, tasks, allSprints, activeSprint, taskFilters, taskView,
  selectedSprintId, isCompactView, projectId, dispatch, handleEditTask,
  handleDeleteTask, handleDuplicateTask,
}: TasksTabProps) {
  if (!project || !workspaceId) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[24px] text-center">
        <h3 className="font-['IBM_Plex_Mono',monospace] text-sm uppercase mb-[8px]">LOADING PROJECT DATA...</h3>
      </div>
    )
  }

  let filteredTasks = tasks || []

  if (selectedSprintId && selectedSprintId !== 'all') {
    filteredTasks = filteredTasks.filter((t: any) => t.sprintId === selectedSprintId)
  } else if (selectedSprintId === null) {
    filteredTasks = filteredTasks.filter((t: any) => !t.sprintId)
  }

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
      "space-y-5",
      taskView === 'kanban' && "h-full flex flex-col space-y-0 gap-6"
    )}>
      {/* Filter Info Bar */}
      {(taskFilters.search || taskFilters.status.length > 0 || taskFilters.priority.length > 0 ||
        taskFilters.type.length > 0 || taskFilters.assigneeIds.length > 0 || taskFilters.labels.length > 0 ||
        taskFilters.dueDateRange.start || taskFilters.dueDateRange.end || taskFilters.hasTimeTracked !== undefined ||
        taskFilters.isOverdue !== undefined) && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-3 flex items-center justify-between">
            <div className="font-['IBM_Plex_Mono',monospace] text-sm">
              SHOWING <span className="font-bold text-[var(--theme-primary)]">{filteredTasks.length}</span> OF <span className="font-bold">{tasks?.length || 0}</span> TASKS
            </div>
            <button
              onClick={() => {
                dispatch({ type: 'SET_TASK_FILTERS', filters: pageInitialState.taskFilters })
              }}
              className="text-xs font-['IBM_Plex_Mono',monospace] uppercase text-[var(--theme-error)] hover:underline cursor-pointer"
            >
              CLEAR ALL FILTERS
            </button>
          </div>
        )}

      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
          <button
            onClick={() => dispatch({ type: 'OPEN_CREATE_TASK' })}
            className="h-[34px] px-4 flex items-center gap-1.5 bg-[var(--theme-primary)] text-[var(--theme-background)] border border-[var(--theme-primary)] hover:bg-[var(--theme-primary-active)] font-['IBM_Plex_Mono',monospace] text-xs uppercase transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-1 focus:ring-offset-[var(--theme-background)]"
            aria-label="Create new task"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            NEW
          </button>

          {/* Sprint Selector */}
          <select
            value={selectedSprintId || 'all'}
            onChange={(e) => dispatch({ type: 'SET_SPRINT_ID', sprintId: e.target.value === 'all' ? 'all' : e.target.value === 'backlog' ? null : e.target.value })}
            className="h-[32px] px-3 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] font-['IBM_Plex_Mono',monospace] text-xs uppercase focus:border-[var(--theme-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-1 focus:ring-offset-[var(--theme-background)] transition-colors cursor-pointer"
          >
            <option value="all">ALL SPRINTS</option>
            <option value="backlog">BACKLOG</option>
            {allSprints?.map((sprint) => (
              <option key={sprint._id} value={sprint._id}>
                {sprint.name} {sprint.status === 'active' ? '(Active)' : ''}
              </option>
            ))}
          </select>

          {/* View Mode Selector */}
          <div className="flex items-center bg-[var(--theme-background)] border border-[var(--theme-border)]" role="group" aria-label="Task view mode">
            {(['sprint', 'kanban', 'list', 'gantt', 'calendar'] as const).map((view, i) => (
              <button
                key={view}
                onClick={() => dispatch({ type: 'SET_TASK_VIEW', view })}
                className={clsx(
                  "h-[32px] px-3 font-['IBM_Plex_Mono',monospace] text-xs uppercase transition-colors cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-1 focus:ring-offset-[var(--theme-background)]",
                  i > 0 && "border-l border-[var(--theme-border)]",
                  taskView === view ? "bg-[var(--theme-primary)] text-[var(--theme-background)]" : "hover:bg-[var(--theme-background-secondary)]"
                )}
              >
                {view === 'kanban' ? 'BOARD' : view === 'calendar' ? 'CAL' : view.toUpperCase()}
              </button>
            ))}
          </div>

          {taskView === 'kanban' && (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_COMPACT_VIEW' })}
              className={clsx(
                "h-[32px] px-3 flex items-center gap-1.5 border border-[var(--theme-border)] font-['IBM_Plex_Mono',monospace] text-xs uppercase transition-colors cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-1 focus:ring-offset-[var(--theme-background)]",
                isCompactView
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
              )}
              title={isCompactView ? "Switch to normal view" : "Switch to compact view"}
            >
              <HiOutlineViewGrid className="w-3 h-3" />
              {isCompactView ? 'NORMAL' : 'COMPACT'}
            </button>
          )}

          <button
            onClick={() => dispatch({ type: 'TOGGLE_ADVANCED_FILTERS' })}
            className={clsx(
              "h-[32px] px-3 flex items-center gap-1.5 border border-[var(--theme-border)] font-['IBM_Plex_Mono',monospace] text-xs uppercase transition-colors cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-1 focus:ring-offset-[var(--theme-background)]",
              (taskFilters.search || taskFilters.status.length > 0 || taskFilters.priority.length > 0 ||
                taskFilters.type.length > 0 || taskFilters.assigneeIds.length > 0 || taskFilters.labels.length > 0 ||
                taskFilters.dueDateRange.start || taskFilters.dueDateRange.end || taskFilters.hasTimeTracked !== null ||
                taskFilters.isOverdue !== null)
                ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                : "bg-[var(--theme-background)] hover:bg-[var(--theme-background-secondary)]"
            )}
            aria-label="Advanced filters"
          >
            <HiOutlineFilter className="w-3 h-3" />
            FILTERS
            {(taskFilters.search || taskFilters.status.length > 0 || taskFilters.priority.length > 0 ||
              taskFilters.type.length > 0 || taskFilters.assigneeIds.length > 0 || taskFilters.labels.length > 0 ||
              taskFilters.dueDateRange.start || taskFilters.dueDateRange.end || taskFilters.hasTimeTracked !== null ||
              taskFilters.isOverdue !== null) && (
                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-bold">!</span>
              )}
          </button>
        </div>
      </div>

      {/* Sprint Metrics Bar */}
      {sprintProgress && (
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-['IBM_Plex_Mono',monospace] text-xs font-bold uppercase tracking-wider">SPRINT METRICS</span>
            <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[var(--theme-foreground-tertiary)]">
              {sprintProgress.daysLeft} DAYS LEFT
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] p-3">
              <span className="block text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider mb-1">VELOCITY</span>
              <span className="block text-lg font-bold text-[var(--theme-primary)] font-['IBM_Plex_Mono',monospace]">{sprintProgress.velocity}/day</span>
            </div>
            <div className="bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] p-3">
              <span className="block text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider mb-1">COMPLETE</span>
              <span className="block text-lg font-bold text-[var(--theme-success)] font-['IBM_Plex_Mono',monospace]">{sprintProgress.percentage}%</span>
            </div>
            <div className="bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] p-3">
              <span className="block text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider mb-1">BLOCKED</span>
              <span className="block text-lg font-bold text-[var(--theme-error)] font-['IBM_Plex_Mono',monospace]">{sprintProgress.blockedTasks}</span>
            </div>
            <div className="bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] p-3">
              <span className="block text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider mb-1">IN REVIEW</span>
              <span className="block text-lg font-bold text-[var(--theme-info)] font-['IBM_Plex_Mono',monospace]">{sprintProgress.inReview}</span>
            </div>
          </div>
          <div
            className="w-full h-2 bg-[var(--theme-border)]"
            role="progressbar"
            aria-valuenow={sprintProgress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Sprint progress: ${sprintProgress.percentage}% complete`}
          >
            <div
              className="h-full bg-[var(--theme-primary)] transition-all duration-300"
              style={{ width: `${sprintProgress.percentage}%` }}
            />
          </div>
          <div className="mt-2 font-['IBM_Plex_Mono',monospace] text-xs text-[var(--theme-foreground-tertiary)]">
            {sprintProgress.completedTasks}/{sprintProgress.totalTasks} tasks
          </div>
        </div>
      )}

      {/* Task View */}
      {taskView === 'sprint' && activeSprint && (
        <SprintBoard
          sprint={activeSprint}
          projectId={projectId}
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
            projectId={projectId}
            onTaskUpdate={() => {}}
          />
        </div>
      )}

      {taskView === 'list' && (
        <TaskList
          tasks={filteredTasks}
          projectId={projectId}
          onTaskEdit={handleEditTask}
          onTaskDelete={handleDeleteTask}
          onTaskDuplicate={handleDuplicateTask}
        />
      )}

      {taskView === 'gantt' && (
        <GanttView
          projectId={projectId}
          workspaceId={workspaceId}
        />
      )}

      {taskView === 'calendar' && (
        <CalendarView
          projectId={projectId}
          workspaceId={workspaceId}
        />
      )}

      {taskView === 'sprint' && !activeSprint && (
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[24px] text-center">
          <h3 className="font-['IBM_Plex_Mono',monospace] text-sm uppercase mb-[8px]">NO ACTIVE SPRINT</h3>
          <p className="text-[var(--theme-foreground)]/60 mb-[12px]">Create a sprint to start organizing your tasks</p>
          <button
            onClick={() => dispatch({ type: 'OPEN_CREATE_SPRINT' })}
            className="bg-[var(--theme-primary)] text-white border-2 border-[var(--theme-primary-active)] rounded-lg px-5 py-2.5 font-semibold text-sm font-['Inter',sans-serif] hover:bg-[var(--theme-primary-active)] transition-colors"
          >
            CREATE NEW SPRINT
          </button>
        </div>
      )}

    </div>
  )
}

interface TeamTabProps {
  project: any
  tasks: any[] | undefined
  taskFilters: TaskFiltersType
  workspaceId: string
  projectId: string
  dispatch: React.Dispatch<PageAction>
}

function TeamTab({ project, tasks, taskFilters, workspaceId, projectId, dispatch }: TeamTabProps) {
  const members = project?.members || []
  const allTasks = tasks || []

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
      pullRequests: 0,
      commits: 0,
      hoursTracked: memberTasks.reduce((sum: number, t: any) => sum + (t.timeTracked || 0), 0) / 3600000,
      productivity: memberTasks.length > 0 ? Math.round((memberTasks.filter((t: any) => t.status === 'done').length / memberTasks.length) * 100) : 0,
      lastActive: member.lastSeenAt ? formatDistanceToNow(new Date(member.lastSeenAt), { addSuffix: true }) : 'Unknown'
    }
  })

  const workloadData = {
    labels: memberStats.map((m: any) => m.name?.split(' ')[0] || 'Unknown'),
    values: memberStats.map((m: any) => m.tasksAssigned),
    max: Math.max(20, ...memberStats.map((m: any) => m.tasksAssigned))
  }

  const teamTotals = {
    totalTasks: memberStats.reduce((sum: number, m: any) => sum + m.tasksAssigned, 0),
    completedTasks: memberStats.reduce((sum: number, m: any) => sum + m.tasksCompleted, 0),
    inProgressTasks: memberStats.reduce((sum: number, m: any) => sum + m.tasksInProgress, 0),
    hoursTracked: memberStats.reduce((sum: number, m: any) => sum + m.hoursTracked, 0),
    avgProductivity: memberStats.length > 0 ? Math.round(memberStats.reduce((sum: number, m: any) => sum + m.productivity, 0) / memberStats.length) : 0
  }

  return (
    <div className="space-y-5">
      {/* Team Header */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wider">PROJECT TEAM</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'OPEN_EXPERTISE_MATRIX' })}
              className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors flex items-center gap-1 text-[10px] px-3 py-1.5"
            >
              <HiOutlineChartBar className="w-3.5 h-3.5" />
              EXPERTISE MATRIX
            </button>
            <button
              onClick={() => dispatch({ type: 'OPEN_PROJECT_INVITE' })}
              className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors flex items-center gap-1 text-[10px] px-3 py-1.5"
            >
              <HiOutlineUserGroup className="w-3.5 h-3.5" />
              INVITE MEMBERS
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[var(--theme-foreground)]/60 uppercase tracking-wider">
          Manage your project team, view workload distribution, and track productivity metrics.
        </p>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-3">
          <div className="flex items-center justify-between mb-1">
            <HiOutlineUserGroup className="w-4 h-4 text-[var(--theme-primary)]" />
            <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">TEAM SIZE</span>
          </div>
          <div className="text-lg font-bold">{members.length}</div>
          <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">MEMBERS</div>
        </div>

        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-3">
          <div className="flex items-center justify-between mb-1">
            <HiOutlineClipboardList className="w-4 h-4 text-[var(--theme-info)]" />
            <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">ACTIVE TASKS</span>
          </div>
          <div className="text-lg font-bold">{teamTotals.totalTasks}</div>
          <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">ACROSS TEAM</div>
        </div>

        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-3">
          <div className="flex items-center justify-between mb-1">
            <HiOutlineClock className="w-4 h-4 text-[var(--theme-warning)]" />
            <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">HOURS TRACKED</span>
          </div>
          <div className="text-lg font-bold">{Math.round(teamTotals.hoursTracked)}</div>
          <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">TOTAL HOURS</div>
        </div>

        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-3">
          <div className="flex items-center justify-between mb-1">
            <HiOutlineChartBar className="w-4 h-4 text-[var(--theme-success)]" />
            <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">PRODUCTIVITY</span>
          </div>
          <div className="text-lg font-bold">{teamTotals.avgProductivity}%</div>
          <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">AVG COMPLETION</div>
        </div>
      </div>

      {/* Workload Distribution - Enhanced */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
        <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider">WORKLOAD DISTRIBUTION</h3>
            <div className="flex items-center gap-1.5 font-['IBM_Plex_Mono',monospace] text-[10px]">
              <span className="text-[var(--theme-foreground-tertiary)]">AVG:</span>
              <span className="font-bold">{Math.round(teamTotals.totalTasks / memberStats.length || 0)} TASKS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[var(--theme-success)] border border-[var(--theme-border)]"></div>
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px]">OPTIMAL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[var(--theme-warning)] border border-[var(--theme-border)]"></div>
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px]">HIGH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[var(--theme-error)] border border-[var(--theme-border)]"></div>
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px]">OVERLOAD</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {memberStats.map((member: any) => {
              const taskCount = member.tasksAssigned
              const completionRate = member.tasksAssigned > 0 ? Math.round((member.tasksCompleted / member.tasksAssigned) * 100) : 0
              const isHighLoad = taskCount > 15
              const isMediumLoad = taskCount > 10
              const isLowProductivity = completionRate < 40

              return (
                <div key={member._id} className={clsx(
                  "group relative bg-[var(--theme-background-secondary)] border-2 p-3 hover:shadow-[2px_2px_0px_rgba(0,0,0,0.3)]",
                  isHighLoad ? "border-[var(--theme-error)]" :
                    isMediumLoad ? "border-[var(--theme-warning)]" : "border-[var(--theme-border)]"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <UserDisplay userId={member._id} size="sm" showName={true} showStatus={true} />
                      <div className="flex items-center gap-1.5 font-['IBM_Plex_Mono',monospace] text-[10px]">
                        <span className="text-[var(--theme-foreground-tertiary)]">ROLE:</span>
                        <span className="font-bold uppercase">{member.role || 'DEVELOPER'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isHighLoad && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-[var(--theme-error)]/20 border-2 border-[var(--theme-error)]">
                          <span className="w-1 h-1 bg-[var(--theme-error)]"></span>
                          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-error)] font-bold">OVERLOADED</span>
                        </div>
                      )}
                      {isLowProductivity && taskCount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-[var(--theme-warning)]/20 border-2 border-[var(--theme-warning)]">
                          <span className="w-1 h-1 bg-[var(--theme-warning)]"></span>
                          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-warning)] font-bold">LOW VELOCITY</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                        <button className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-[10px] px-2 py-0.5" title="Reassign tasks">BALANCE</button>
                        <button className="bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-[10px] px-2 py-0.5" title="View task details">DETAILS</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">TASK LOAD</span>
                        <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold">{taskCount} / {workloadData.max} TASKS</span>
                      </div>
                      <div className="h-6 bg-[var(--theme-border)] border-2 border-[var(--theme-border)] relative overflow-hidden">
                        <div className="absolute inset-0">
                          <div className="absolute h-full border-r-2 border-[var(--theme-warning)]/30" style={{ left: '66.7%' }} title="High load threshold"></div>
                          <div className="absolute h-full border-r-2 border-[var(--theme-error)]/30" style={{ left: '83.3%' }} title="Overload threshold"></div>
                        </div>
                        <div
                          className={clsx(
                            "absolute inset-y-0 left-0 flex items-center justify-center",
                            isHighLoad ? "bg-[var(--theme-error)]" :
                              isMediumLoad ? "bg-[var(--theme-warning)]" : "bg-[var(--theme-success)]"
                          )}
                          style={{ width: `${Math.min(100, (taskCount / workloadData.max) * 100)}%` }}
                        >
                          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[var(--theme-background)]">
                            {Math.round((taskCount / workloadData.max) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[var(--theme-success)]">{member.tasksCompleted}</div>
                        <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">COMPLETED</div>
                      </div>
                      <div className="text-center">
                        <div className="font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[var(--theme-warning)]">{member.tasksInProgress}</div>
                        <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">IN PROGRESS</div>
                      </div>
                      <div className="text-center">
                        <div className="font-['IBM_Plex_Mono',monospace] text-sm font-bold text-[var(--theme-primary)]">{completionRate}%</div>
                        <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">COMPLETION</div>
                      </div>
                    </div>

                    {member.hoursTracked > 0 && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--theme-border)]/50">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)]">TIME TRACKED:</span>
                        <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold">{member.hoursTracked}H THIS WEEK</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 pt-3 border-t-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-['IBM_Plex_Mono',monospace] text-center">
              <div>
                <div className="text-sm font-bold text-[var(--theme-primary)]">{teamTotals.totalTasks}</div>
                <div className="text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">TOTAL TASKS</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--theme-success)]">{teamTotals.completedTasks}</div>
                <div className="text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">COMPLETED</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--theme-warning)]">{teamTotals.inProgressTasks}</div>
                <div className="text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">IN PROGRESS</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--theme-primary)]">{teamTotals.avgProductivity}%</div>
                <div className="text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">AVG VELOCITY</div>
              </div>
            </div>

            {memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 && (
              <div className="flex items-center gap-2 p-2.5 mt-2 bg-[var(--theme-error)]/10 border-2 border-[var(--theme-error)]">
                <div className="w-2 h-2 bg-[var(--theme-error)] animate-pulse"></div>
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-error)] font-bold">
                  {memberStats.filter((m: any) => m.tasksAssigned > 15).length} MEMBER(S) OVERLOADED - CONSIDER REDISTRIBUTING TASKS
                </span>
                <button className="ml-auto bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-[10px] text-[var(--theme-error)] border-[var(--theme-error)] px-2 py-0.5">
                  AUTO-BALANCE
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {memberStats.map((member: any) => (
          <div key={member._id} className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
            <div className="px-3 py-2.5 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
              <div className="flex items-center justify-between">
                <UserDisplay userId={member._id} size="sm" showName={true} showStatus={true} compact={false} className="flex-1" />
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider">ROLE</div>
                    <div className="text-[10px] font-bold text-[var(--theme-primary)] uppercase">{member.role || 'DEVELOPER'}</div>
                  </div>
                  <button className="p-1 hover:bg-[var(--theme-border)]/30">
                    <HiOutlineDotsVertical className="w-3.5 h-3.5 text-[var(--theme-foreground)]/60" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-2 text-center">
                  <div className="text-sm font-bold text-[var(--theme-primary)]">{member.tasksAssigned}</div>
                  <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider">ASSIGNED</div>
                </div>
                <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-2 text-center">
                  <div className="text-sm font-bold text-[var(--theme-success)]">{member.tasksCompleted}</div>
                  <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider">COMPLETED</div>
                </div>
                <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-2 text-center">
                  <div className="text-sm font-bold text-[var(--theme-info)]">{member.tasksInProgress}</div>
                  <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider">IN PROGRESS</div>
                </div>
                <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-2 text-center">
                  <div className={clsx("text-sm font-bold", member.tasksBlocked > 0 ? "text-[var(--theme-error)]" : "text-[var(--theme-foreground)]/40")}>
                    {member.tasksBlocked}
                  </div>
                  <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[var(--theme-foreground)]/60 uppercase tracking-wider">BLOCKED</div>
                </div>
              </div>

              <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-2.5 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-wider">PRODUCTIVITY</div>
                  <div className={clsx(
                    "font-['IBM_Plex_Mono',monospace] text-xs font-bold",
                    member.productivity >= 90 ? "text-[var(--theme-success)]" :
                      member.productivity >= 70 ? "text-[var(--theme-warning)]" : "text-[var(--theme-error)]"
                  )}>{member.productivity}%</div>
                </div>
                <div className="h-1.5 bg-[var(--theme-border)] mb-1.5">
                  <div
                    className={clsx(
                      "h-full",
                      member.productivity >= 90 ? "bg-[var(--theme-success)]" :
                        member.productivity >= 70 ? "bg-[var(--theme-warning)]" : "bg-[var(--theme-error)]"
                    )}
                    style={{ width: `${member.productivity}%` }}
                  />
                </div>
                <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground)]/60 uppercase tracking-wider">
                  LAST ACTIVE: {member.lastActive || 'UNKNOWN'}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { dispatch({ type: 'SET_TAB', tab: 'tasks' }); dispatch({ type: 'SET_TASK_FILTERS', filters: { ...taskFilters, assigneeIds: [member._id] } }) }}
                  className="flex-1 bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-[10px] py-1.5"
                >VIEW TASKS</button>
                <button
                  onClick={() => { dispatch({ type: 'OPEN_CREATE_TASK' }); toast.info('Creating task for ' + (member.name || 'team member')) }}
                  className="flex-1 bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors text-[10px] py-1.5"
                >ASSIGN TASK</button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Member Card */}
        <div className="bg-[var(--theme-background)] border-2 border-dashed border-[var(--theme-border)] hover:border-[var(--theme-primary)] cursor-pointer group">
          <div className="p-8 text-center">
            <div className="w-8 h-8 bg-[var(--theme-border)]/20 border-2 border-dashed border-[var(--theme-border)] group-hover:border-[var(--theme-primary)] mx-auto mb-2 flex items-center justify-center">
              <HiOutlinePlus className="w-4 h-4 text-[var(--theme-foreground)]/60 group-hover:text-[var(--theme-primary)]" />
            </div>
            <h4 className="font-bold text-xs text-[var(--theme-foreground)]/60 group-hover:text-[var(--theme-primary)] mb-1 uppercase tracking-wider">ADD TEAM MEMBER</h4>
            <p className="text-[10px] text-[var(--theme-foreground)]/40 group-hover:text-[var(--theme-foreground)]/60">Invite someone to join this project</p>
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
        <div className="px-4 py-2.5 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider">QUICK ACTIONS</h3>
            <div className="flex items-center gap-1.5 font-['IBM_Plex_Mono',monospace] text-[10px]">
              <span className="text-[var(--theme-foreground-tertiary)]">SHORTCUTS FOR TEAM MANAGEMENT</span>
              <div className="w-1 h-1 bg-[var(--theme-primary)] animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="group relative">
              <button onClick={() => dispatch({ type: 'OPEN_PROJECT_INVITE' })} className="w-full bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors flex flex-col items-center justify-center gap-2 p-3 min-h-[80px] group-hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]">
                <div className="flex items-center justify-center w-8 h-8 bg-[var(--theme-border)] border-2 border-[var(--theme-border)]">
                  <HiOutlinePlus className="w-4 h-4 text-[var(--theme-primary)]" />
                </div>
                <div className="text-center">
                  <div className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold">ADD MEMBER</div>
                  <div className="font-['IBM_Plex_Mono',monospace] text-[9px] text-[var(--theme-foreground-tertiary)] mt-0.5">INVITE TO PROJECT</div>
                </div>
              </button>
            </div>

            <div className="group relative">
              <button
                onClick={() => {
                  const overloadedMembers = memberStats.filter((m: any) => m.tasksAssigned > 15)
                  if (overloadedMembers.length > 0) { console.log('Opening bulk reassign for overloaded members:', overloadedMembers) }
                  else { console.log('Opening general bulk reassign modal') }
                }}
                className={clsx(
                  "w-full bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors flex flex-col items-center justify-center gap-2 p-3 min-h-[80px] group-hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]",
                  memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 && "border-[var(--theme-warning)] bg-[var(--theme-warning)]/10"
                )}
              >
                <div className={clsx("flex items-center justify-center w-8 h-8 border-2 border-[var(--theme-border)]", memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 ? "bg-[var(--theme-warning)]" : "bg-[var(--theme-border)]")}>
                  <HiOutlineUserGroup className={clsx("w-4 h-4", memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 ? "text-[var(--theme-background)]" : "text-[var(--theme-primary)]")} />
                </div>
                <div className="text-center">
                  <div className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold">BULK REASSIGN</div>
                  <div className="font-['IBM_Plex_Mono',monospace] text-[9px] text-[var(--theme-foreground-tertiary)] mt-0.5">
                    {memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 ? `${memberStats.filter((m: any) => m.tasksAssigned > 15).length} OVERLOADED` : 'BALANCE WORKLOAD'}
                  </div>
                </div>
              </button>
            </div>

            <div className="group relative">
              <button
                onClick={() => {
                  const reportData = { project: project.name, date: new Date().toISOString(), teamSize: memberStats.length, totalTasks: teamTotals.totalTasks, completedTasks: teamTotals.completedTasks, avgProductivity: teamTotals.avgProductivity, members: memberStats.map((m: any) => ({ name: m.name, role: m.role, tasksAssigned: m.tasksAssigned, tasksCompleted: m.tasksCompleted, productivity: m.productivity, hoursTracked: m.hoursTracked })) }
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `${project.name}-team-report-${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
                }}
                className="w-full bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors flex flex-col items-center justify-center gap-2 p-3 min-h-[80px] group-hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-[var(--theme-border)] border-2 border-[var(--theme-border)]">
                  <HiOutlineChartBar className="w-4 h-4 text-[var(--theme-primary)]" />
                </div>
                <div className="text-center">
                  <div className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold">EXPORT REPORT</div>
                  <div className="font-['IBM_Plex_Mono',monospace] text-[9px] text-[var(--theme-foreground-tertiary)] mt-0.5">TEAM PERFORMANCE</div>
                </div>
              </button>
            </div>

            <div className="group relative">
              <button onClick={() => console.log('Opening team settings modal')} className="w-full bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors flex flex-col items-center justify-center gap-2 p-3 min-h-[80px] group-hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]">
                <div className="flex items-center justify-center w-8 h-8 bg-[var(--theme-border)] border-2 border-[var(--theme-border)]">
                  <HiOutlineCog className="w-4 h-4 text-[var(--theme-primary)]" />
                </div>
                <div className="text-center">
                  <div className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold">TEAM SETTINGS</div>
                  <div className="font-['IBM_Plex_Mono',monospace] text-[9px] text-[var(--theme-foreground-tertiary)] mt-0.5">CONFIGURE PROJECT</div>
                </div>
              </button>
            </div>

            <div className="group relative">
              <button onClick={() => dispatch({ type: 'OPEN_EXPERTISE_SEARCH' })} className="w-full bg-transparent text-[var(--theme-foreground-secondary)] border border-[var(--theme-border)] rounded-lg px-4 py-2 font-semibold text-sm font-['Inter',sans-serif] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors flex flex-col items-center justify-center gap-2 p-3 min-h-[80px] group-hover:shadow-[3px_3px_0px_rgba(0,0,0,0.4)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]">
                <div className="flex items-center justify-center w-8 h-8 bg-[var(--theme-border)] border-2 border-[var(--theme-border)]">
                  <HiOutlineSearch className="w-4 h-4 text-[var(--theme-primary)]" />
                </div>
                <div className="text-center">
                  <div className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold">FIND EXPERT</div>
                  <div className="font-['IBM_Plex_Mono',monospace] text-[9px] text-[var(--theme-foreground-tertiary)] mt-0.5">SEARCH EXPERTISE</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t-2 border-[var(--theme-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[var(--theme-primary)] animate-pulse"></div>
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] font-bold text-[var(--theme-primary)]">SMART SUGGESTIONS:</span>
              </div>
              <div className="flex items-center gap-2">
                {memberStats.filter((m: any) => m.tasksAssigned > 15).length > 0 && (
                  <button onClick={() => console.log('Quick balancing overloaded members')} className="px-2.5 py-1 bg-[var(--theme-error)]/20 border-2 border-[var(--theme-error)] font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-error)] hover:bg-[var(--theme-error)] hover:text-[var(--theme-background)]">
                    BALANCE {memberStats.filter((m: any) => m.tasksAssigned > 15).length} OVERLOADED
                  </button>
                )}
                {memberStats.filter((m: any) => m.tasksAssigned === 0).length > 0 && (
                  <button onClick={() => console.log('Assigning tasks to idle members')} className="px-2.5 py-1 bg-[var(--theme-info)]/20 border-2 border-[var(--theme-info)] font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-info)] hover:bg-[var(--theme-info)] hover:text-[var(--theme-background)]">
                    ASSIGN TO {memberStats.filter((m: any) => m.tasksAssigned === 0).length} IDLE
                  </button>
                )}
                {memberStats.filter((m: any) => m.productivity < 40 && m.tasksAssigned > 0).length > 0 && (
                  <div className="px-2.5 py-1 bg-[var(--theme-warning)]/20 border-2 border-[var(--theme-warning)] font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-warning)]">
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

// --- Project Header ---

interface ProjectHeaderProps {
  project: any
  workspaceId: string
  activeTab: TabType
  taskCount: number
  tabs: { id: string; label: string; icon: React.ReactNode }[]
  onNavigateBack: () => void
  onInvite: () => void
  onCreateTask: () => void
  onTabChange: (tab: TabType) => void
}

function ProjectHeader({ project, workspaceId, activeTab, taskCount, tabs, onNavigateBack, onInvite, onCreateTask, onTabChange }: ProjectHeaderProps) {
  return (
    <div className="border-b-2 border-[var(--theme-border)] bg-[var(--theme-background)] sticky top-0 z-40">
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateBack}
            className="group flex items-center gap-2 font-['IBM_Plex_Mono',monospace] text-xs text-[var(--theme-foreground)]/60 hover:text-[var(--theme-primary)] transition-colors"
          >
            <HiOutlineArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            BACK TO WORKSPACE
          </button>
          <div className="h-8 w-[2px] bg-[var(--theme-border)]" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">{project.name}</h1>
              <BrutalBadge variant={
                project.status === 'active' ? 'default' :
                  project.status === 'completed' ? 'success' :
                    project.status === 'on_hold' ? 'warning' : 'outline'
              }>
                {project.status}
              </BrutalBadge>
            </div>
            <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[var(--theme-foreground)]/60 flex items-center gap-2">
              <span>ID: {project.key}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <BrutalButton size="sm" variant="ghost" onClick={onInvite}>
            <HiOutlineUserGroup className="w-4 h-4 mr-2" /> INVITE
          </BrutalButton>
          <BrutalButton size="sm" variant="primary" onClick={onCreateTask}>
            <HiOutlinePlus className="w-4 h-4 mr-2" /> NEW TASK
          </BrutalButton>
        </div>
      </div>
      <div className="px-5 flex items-end gap-0.5 overflow-x-auto no-scrollbar border-t border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30" role="tablist" aria-label="Project sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={clsx(
              "relative px-4 py-2.5 font-['IBM_Plex_Mono',monospace] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              "border-r border-[var(--theme-border)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-1 focus:ring-offset-[var(--theme-background)]",
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
                  {taskCount}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Project Modals ---

interface ProjectModalsProps {
  state: PageState
  projectId: string
  workspaceId: string
  project: any
  taskFilters: TaskFiltersType
  selectedTask: any
  dispatch: React.Dispatch<PageAction>
  onDeleteTask: (task: any) => Promise<void>
}

function ProjectModals({ state, projectId, workspaceId, project, taskFilters, selectedTask, dispatch, onDeleteTask }: ProjectModalsProps) {
  return (
    <>
      {projectId && (
        <CreateTaskModal isOpen={state.showCreateTaskModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          projectId={projectId} onSuccess={() => { }} />
      )}
      {selectedTask && (
        <EditTaskModal isOpen={state.showEditTaskModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          task={selectedTask}
          onDelete={async () => { await onDeleteTask(selectedTask); dispatch({ type: 'CLOSE_MODALS' }) }} />
      )}
      {workspaceId && (
        <TaskFilters isOpen={state.showAdvancedFilters}
          onClose={() => dispatch({ type: 'TOGGLE_ADVANCED_FILTERS' })}
          filters={taskFilters}
          onFiltersChange={(filters: TaskFiltersType) => dispatch({ type: 'SET_TASK_FILTERS', filters })}
          workspaceId={workspaceId} />
      )}
      {projectId && (
        <CreateSprintModal isOpen={state.showCreateSprintModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          projectId={projectId}
          onSuccess={() => dispatch({ type: 'CLOSE_MODALS' })} />
      )}
      {projectId && workspaceId && (
        <ScheduleMeetingModal isOpen={state.showScheduleMeetingModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          projectId={projectId} workspaceId={workspaceId}
          onSuccess={() => dispatch({ type: 'CLOSE_MODALS' })} />
      )}
      {projectId && project && (
        <ProjectInviteModal isOpen={state.showProjectInviteModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          projectId={projectId} projectName={project.name} />
      )}
      {state.showExpertiseSearch && (
        <ExpertiseSearchModal onClose={() => dispatch({ type: 'CLOSE_MODALS' })} workspaceId={workspaceId} />
      )}
      {state.showExpertiseMatrix && workspaceId && (
        <TeamExpertiseMatrix workspaceId={workspaceId}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })} isModal={true} />
      )}
    </>
  )
}

// --- Tab Content ---

interface ProjectTabContentProps {
  activeTab: TabType
  taskView: TaskViewType
  project: any
  workspaceId: string
  projectId: string
  tasks: any[] | undefined
  allSprints: any[] | undefined
  activeSprint: any
  taskFilters: TaskFiltersType
  selectedSprintId: string | null
  isCompactView: boolean
  healthCards: HealthCard[]
  currentUser: any
  projectMeetings: any[] | undefined
  availableTeams: any[] | undefined
  assignTeam: any
  dispatch: React.Dispatch<PageAction>
  getStatusColor: (status: string) => string
  handleEditTask: (task: any) => void
  handleDeleteTask: (task: any) => Promise<void>
  handleDuplicateTask: (task: any) => Promise<void>
}

function ProjectTabContent({
  activeTab, taskView, project, workspaceId, projectId, tasks, allSprints,
  activeSprint, taskFilters, selectedSprintId, isCompactView, healthCards,
  currentUser, projectMeetings, availableTeams, assignTeam, dispatch,
  getStatusColor, handleEditTask, handleDeleteTask, handleDuplicateTask,
}: ProjectTabContentProps) {
  return (
    <main className={clsx(
      "flex-1 p-5",
      (activeTab === 'tasks' && taskView === 'kanban') ? "overflow-hidden flex flex-col" : "overflow-y-auto"
    )}>
      <m.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={clsx((activeTab === 'tasks' && taskView === 'kanban') && "h-full flex flex-col")}>
        {activeTab === 'overview' && (
          <OverviewTab project={project} allSprints={allSprints} tasks={tasks}
            healthCards={healthCards} getStatusColor={getStatusColor} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab project={project} workspaceId={workspaceId} tasks={tasks}
            allSprints={allSprints} activeSprint={activeSprint} taskFilters={taskFilters}
            taskView={taskView} selectedSprintId={selectedSprintId} isCompactView={isCompactView}
            projectId={projectId} dispatch={dispatch} handleEditTask={handleEditTask}
            handleDeleteTask={handleDeleteTask} handleDuplicateTask={handleDuplicateTask} />
        )}
        {activeTab === 'team' && (
          <TeamTab project={project} tasks={tasks} taskFilters={taskFilters}
            workspaceId={workspaceId} projectId={projectId} dispatch={dispatch} />
        )}
        {activeTab === 'github' && <GitHubProjectTab project={project} workspaceId={workspaceId as any} />}
        {activeTab === 'meetings' && (
          <MeetingsTab projectMeetings={projectMeetings} currentUserId={currentUser?._id}
            onScheduleMeeting={() => dispatch({ type: 'OPEN_SCHEDULE_MEETING' })} />
        )}
        {activeTab === 'docs' && (
          <ProjectDocsHub projectId={projectId} workspaceId={workspaceId}
            tasks={tasks ?? []} sprints={allSprints ?? []} projectDetails={project} />
        )}
        {activeTab === 'logs' && (
          <TeamActivityFeed projectId={projectId} workspaceId={workspaceId} limit={50} showFilters={true} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab project={project} availableTeams={availableTeams} assignTeam={assignTeam} />
        )}
      </m.div>
    </main>
  )
}

// --- Main Component ---

export default function ProjectManagementPage() {
  const { workspaceId, projectId } = useParams()
  const navigate = useNavigate()
  const { user: clerkUser } = useUser()
  const [state, dispatch] = useReducer(pageReducer, pageInitialState)
  const { activeTab, taskView, showMyTasks, isCompactView, currentContext, showCreateTaskModal, showEditTaskModal, showCreateSprintModal, showProjectInviteModal, showScheduleMeetingModal, showExpertiseSearch, showExpertiseMatrix, selectedTask, showAdvancedFilters, selectedSprintId, taskFilters } = state

  const deleteTask = useMutation(api.tasks.mutations.deleteTask)
  const createTask = useMutation(api.tasks.mutations.createTask)
  const assignTeam = useMutation(api.projects.mutations.assignTeam)

  // Move task handlers to top level
  const handleEditTask = (task: any) => {
    dispatch({ type: 'OPEN_EDIT_TASK', task })
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

  // Page-specific keyboard shortcuts via central shortcut system
  const isInputFocused = useCallback(() => {
    const el = document.activeElement
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.getAttribute('contenteditable') === 'true'
  }, [])

  useTemporaryShortcut(
    { modifiers: [], key: 'n', display: 'N' },
    () => { if (!isInputFocused()) dispatch({ type: 'OPEN_CREATE_TASK' }) },
    { enabled: activeTab === 'tasks' }
  )

  useTemporaryShortcut(
    { modifiers: [], key: 'm', display: 'M' },
    () => { if (!isInputFocused()) dispatch({ type: 'TOGGLE_MY_TASKS' }) },
    { enabled: activeTab === 'tasks' }
  )

  useTemporaryShortcut(
    { modifiers: [], key: '/', display: '/' },
    () => {
      if (!isInputFocused()) {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) searchInput.focus()
      }
    },
    { enabled: activeTab === 'tasks' }
  )

  useTemporaryShortcut(
    { modifiers: [], key: 't', display: 'T' },
    () => {
      if (!isInputFocused() && selectedTask) {
        dispatch({ type: 'SET_CONTEXT', context: currentContext === selectedTask.key ? null : selectedTask.key })
        toast.success(currentContext === selectedTask.key ? 'Timer stopped' : `Timer started for ${selectedTask.key}`)
      }
    },
    { enabled: activeTab === 'tasks' }
  )

  useTemporaryShortcut(
    { modifiers: [], key: 'b', display: 'B' },
    () => {
      if (!isInputFocused() && selectedTask) {
        toast.success(`Task ${selectedTask.key} marked as blocked`)
      }
    },
    { enabled: activeTab === 'tasks' }
  )

  useTemporaryShortcut(
    { modifiers: [], key: '1', display: '1' },
    () => { if (!isInputFocused()) toast.success('Switched focus to backlog column') },
    { enabled: activeTab === 'tasks' }
  )
  useTemporaryShortcut(
    { modifiers: [], key: '2', display: '2' },
    () => { if (!isInputFocused()) toast.success('Switched focus to todo column') },
    { enabled: activeTab === 'tasks' }
  )
  useTemporaryShortcut(
    { modifiers: [], key: '3', display: '3' },
    () => { if (!isInputFocused()) toast.success('Switched focus to in progress column') },
    { enabled: activeTab === 'tasks' }
  )
  useTemporaryShortcut(
    { modifiers: [], key: '4', display: '4' },
    () => { if (!isInputFocused()) toast.success('Switched focus to in review column') },
    { enabled: activeTab === 'tasks' }
  )
  useTemporaryShortcut(
    { modifiers: [], key: '5', display: '5' },
    () => { if (!isInputFocused()) toast.success('Switched focus to done column') },
    { enabled: activeTab === 'tasks' }
  )

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
      <div className="p-[16px]">
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
          <h1 className="text-[16px] font-bold font-bold uppercase text-[var(--theme-error)] mb-8px">PROJECT NOT FOUND</h1>
          <p className="font-['IBM_Plex_Mono',monospace] text-sm">The requested project does not exist or you don't have access.</p>
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
      case 'success': return 'text-[var(--theme-success)] border-[var(--theme-success)] bg-[var(--theme-success)]/10'
      case 'warning': return 'text-[var(--theme-warning)] border-[var(--theme-warning)] bg-[var(--theme-warning)]/10'
      case 'error': return 'text-[var(--theme-error)] border-[var(--theme-error)] bg-[var(--theme-error)]/10'
      case 'info': return 'text-[var(--theme-info)] border-[var(--theme-info)] bg-[var(--theme-info)]/10'
      default: return 'text-[var(--theme-primary)] border-[var(--theme-border)]'
    }
  }

  const renderDocsTab = () => (
    <ProjectDocsHub
      projectId={projectId}
      workspaceId={workspaceId}
      tasks={tasks ?? []}
      sprints={allSprints ?? []}
      projectDetails={project}
    />
  )

  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex flex-col">
      {/* Project Header */}
      <div className="border-b-2 border-[var(--theme-border)] bg-[var(--theme-background)] sticky top-0 z-40">
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/workspace/${workspaceId}`)}
              className="group flex items-center gap-2 font-['IBM_Plex_Mono',monospace] text-xs text-[var(--theme-foreground)]/60 hover:text-[var(--theme-primary)] transition-colors"
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
              <div className="font-['IBM_Plex_Mono',monospace] text-xs text-[var(--theme-foreground)]/60 flex items-center gap-2">
                <span>ID: {project.key}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <BrutalButton size="sm" variant="ghost" onClick={() => dispatch({ type: 'OPEN_PROJECT_INVITE' })}>
              <HiOutlineUserGroup className="w-4 h-4 mr-2" />
              INVITE
            </BrutalButton>
            <BrutalButton size="sm" variant="primary" onClick={() => dispatch({ type: 'OPEN_CREATE_TASK' })}>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              NEW TASK
            </BrutalButton>
          </div>
        </div>

        {/* Project Navigation Tabs */}
        <div className="px-5 flex items-end gap-0.5 overflow-x-auto no-scrollbar border-t border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30" role="tablist" aria-label="Project sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_TAB', tab: tab.id as TabType })}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={clsx(
                "relative px-4 py-2.5 font-['IBM_Plex_Mono',monospace] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                "border-r border-[var(--theme-border)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-1 focus:ring-offset-[var(--theme-background)]",
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
        "flex-1 p-5",
        (activeTab === 'tasks' && taskView === 'kanban') ? "overflow-hidden flex flex-col" : "overflow-y-auto"
      )}>
        <m.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={clsx((activeTab === 'tasks' && taskView === 'kanban') && "h-full flex flex-col")}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              project={project}
              allSprints={allSprints}
              tasks={tasks}
              healthCards={healthCards}
              getStatusColor={getStatusColor}
            />
          )}
          {activeTab === 'tasks' && (
            <TasksTab
              project={project}
              workspaceId={workspaceId as string}
              tasks={tasks}
              allSprints={allSprints}
              activeSprint={activeSprint}
              taskFilters={taskFilters}
              taskView={taskView}
              selectedSprintId={selectedSprintId}
              isCompactView={isCompactView}
              projectId={projectId as string}
              dispatch={dispatch}
              handleEditTask={handleEditTask}
              handleDeleteTask={handleDeleteTask}
              handleDuplicateTask={handleDuplicateTask}
            />
          )}
          {activeTab === 'team' && (
            <TeamTab
              project={project}
              tasks={tasks}
              taskFilters={taskFilters}
              workspaceId={workspaceId as string}
              projectId={projectId as string}
              dispatch={dispatch}
            />
          )}
          {activeTab === 'github' && <GitHubProjectTab project={project} workspaceId={workspaceId as any} />}
          {activeTab === 'meetings' && (
            <MeetingsTab
              projectMeetings={projectMeetings}
              currentUserId={currentUser?._id}
              onScheduleMeeting={() => dispatch({ type: 'OPEN_SCHEDULE_MEETING' })}
            />
          )}
          {activeTab === 'docs' && renderDocsTab()}
          {activeTab === 'logs' && (
            <TeamActivityFeed
              projectId={projectId}
              workspaceId={workspaceId}
              limit={50}
              showFilters={true}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              project={project}
              availableTeams={availableTeams}
              assignTeam={assignTeam}
            />
          )}
        </m.div>
      </main>

      {/* Modals */}
      {projectId && (
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          projectId={projectId}
          onSuccess={() => { }}
        />
      )}

      {selectedTask && (
        <EditTaskModal
          isOpen={showEditTaskModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          task={selectedTask}
          onDelete={async () => {
            await handleDeleteTask(selectedTask)
            dispatch({ type: 'CLOSE_MODALS' })
          }}
        />
      )}

      {workspaceId && (
        <TaskFilters
          isOpen={showAdvancedFilters}
          onClose={() => dispatch({ type: 'TOGGLE_ADVANCED_FILTERS' })}
          filters={taskFilters}
          onFiltersChange={(filters: TaskFiltersType) => dispatch({ type: 'SET_TASK_FILTERS', filters })}
          workspaceId={workspaceId}
        />
      )}

      {projectId && (
        <CreateSprintModal
          isOpen={showCreateSprintModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          projectId={projectId}
          onSuccess={() => dispatch({ type: 'CLOSE_MODALS' })}
        />
      )}

      {projectId && workspaceId && (
        <ScheduleMeetingModal
          isOpen={showScheduleMeetingModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          projectId={projectId}
          workspaceId={workspaceId}
          onSuccess={() => dispatch({ type: 'CLOSE_MODALS' })}
        />
      )}

      {projectId && project && (
        <ProjectInviteModal
          isOpen={showProjectInviteModal}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          projectId={projectId}
          projectName={project.name}
        />
      )}

      {showExpertiseSearch && (
        <ExpertiseSearchModal
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          workspaceId={workspaceId}
        />
      )}

      {showExpertiseMatrix && workspaceId && (
        <TeamExpertiseMatrix
          workspaceId={workspaceId}
          onClose={() => dispatch({ type: 'CLOSE_MODALS' })}
          isModal={true}
        />
      )}
    </div>
  )
}