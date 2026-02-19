import { useReducer } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineFilter,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineViewBoards,
  HiOutlineClock
} from 'react-icons/hi'
import DeveloperProfileCard from '@/components/features/developer/DeveloperProfileCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { ExpertiseSearchModal } from '@/components/features/profile/ExpertiseSearchModal'
import { TeamExpertiseMatrix } from '@/components/features/profile/TeamExpertiseMatrix'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'
import clsx from 'clsx'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import CreateSprintModal from '@/components/features/sprint/CreateSprintModal'
import SprintBoard from '@/components/features/sprint/SprintBoard'
import SprintPlanning from '@/components/features/sprint/SprintPlanning'
import EmptyState from '@/components/common/EmptyState'
import { m } from 'framer-motion'

type TabType = 'members' | 'sprints'

type TeamPageState = {
  activeTab: TabType
  searchQuery: string
  selectedStatus: string
  showExpertiseSearch: boolean
  showExpertiseMatrix: boolean
  selectedProjectId: string
  showCreateSprintModal: boolean
  sprintViewMode: 'board' | 'planning'
}

const teamPageInitialState: TeamPageState = {
  activeTab: 'members',
  searchQuery: '',
  selectedStatus: 'all',
  showExpertiseSearch: false,
  showExpertiseMatrix: false,
  selectedProjectId: '',
  showCreateSprintModal: false,
  sprintViewMode: 'board',
}

type TeamPageAction =
  | { type: 'UPDATE'; field: keyof TeamPageState; value: TeamPageState[keyof TeamPageState] }
  | { type: 'RESET' }

function teamPageReducer(state: TeamPageState, action: TeamPageAction): TeamPageState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return teamPageInitialState
    default:
      return state
  }
}

// --- Sub-components ---

interface StatusSummaryGridProps {
  statusCounts: Record<string, number>
}

function StatusSummaryGrid({ statusCounts }: StatusSummaryGridProps) {
  const statuses = [
    { label: 'AVAILABLE', count: statusCounts.AVAILABLE || 0, color: 'bg-[var(--theme-success)]' },
    { label: 'LOCKED IN', count: statusCounts.LOCKED_IN || 0, color: 'bg-[var(--theme-error)]' },
    { label: 'IN REVIEW', count: statusCounts.IN_REVIEW || 0, color: 'bg-[var(--theme-primary)]' },
    { label: 'IN MEETING', count: statusCounts.IN_MEETING || 0, color: 'bg-[var(--theme-warning)]' },
    { label: 'AFK', count: statusCounts.AFK || 0, color: 'bg-[var(--theme-foreground-tertiary)]' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {statuses.map((status, i) => (
        <m.div
          key={status.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
          className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-3 hover:border-[var(--theme-foreground)]/20 transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className={`w-2.5 h-2.5 ${status.color}`} />
            <span className="font-mono text-xl font-bold text-[var(--theme-foreground)]">{status.count}</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">{status.label}</div>
        </m.div>
      ))}
    </div>
  )
}

interface MembersFiltersBarProps {
  searchQuery: string
  selectedStatus: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onFindExpert: () => void
  onShowMatrix: () => void
}

function MembersFiltersBar({ searchQuery, selectedStatus, onSearchChange, onStatusChange, onFindExpert, onShowMatrix }: MembersFiltersBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="flex-1 relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-foreground-tertiary)]" />
        <input
          type="text"
          placeholder="SEARCH TEAM MEMBERS..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search team members"
          className="w-full pl-10 pr-3 py-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] text-[var(--theme-foreground)] placeholder-[var(--theme-foreground-tertiary)] font-mono text-xs uppercase tracking-wider focus:border-[var(--theme-primary)] focus:outline-none"
        />
      </div>

      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
        className="px-3 py-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] font-mono text-xs uppercase tracking-wider focus:border-[var(--theme-primary)] focus:outline-none cursor-pointer"
      >
        <option value="all">ALL STATUSES</option>
        <option value="AVAILABLE">AVAILABLE</option>
        <option value="LOCKED_IN">LOCKED IN</option>
        <option value="IN_REVIEW">IN REVIEW</option>
        <option value="IN_MEETING">IN MEETING</option>
        <option value="AFK">AFK</option>
      </select>

      <button
        onClick={onFindExpert}
        className="px-3 py-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] font-mono text-xs uppercase tracking-wider hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] flex items-center gap-2"
      >
        <HiOutlineSearch className="w-4 h-4" />
        FIND EXPERT
      </button>

      <button
        onClick={onShowMatrix}
        className="px-3 py-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] font-mono text-xs uppercase tracking-wider hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] flex items-center gap-2"
      >
        <HiOutlineChartBar className="w-4 h-4" />
        MATRIX
      </button>
    </div>
  )
}

interface CurrentSprintInfoCardProps {
  currentSprint: any
}

function CurrentSprintInfoCard({ currentSprint }: CurrentSprintInfoCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-primary)]/40 p-4"
    >
      <div className="flex flex-col md:flex-row items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlinePlay className="w-4 h-4 text-[var(--theme-primary)]" />
            <h2 className="text-base font-bold uppercase tracking-tight text-[var(--theme-foreground)]">
              {currentSprint.name}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/40">
              ACTIVE
            </span>
          </div>
          {currentSprint.goal && (
            <p className="text-xs font-mono text-[var(--theme-foreground-secondary)] mb-3 border-l-2 border-[var(--theme-primary)] pl-3">
              {currentSprint.goal}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--theme-foreground-secondary)]">
            <div className="flex items-center gap-1.5">
              <HiOutlineCalendar className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span>{currentSprint.daysRemaining} DAYS LEFT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HiOutlineChartBar className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span>{currentSprint.progress}% COMPLETE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HiOutlineClock className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
              <span>{currentSprint.completedPoints}/{currentSprint.totalPoints} POINTS</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {[
            { count: currentSprint.taskStats.done, color: 'bg-[var(--theme-background-secondary)]', label: 'DONE' },
            { count: currentSprint.taskStats.inReview, color: 'bg-[var(--theme-success)]', label: 'REVIEW' },
            { count: currentSprint.taskStats.inProgress, color: 'bg-[var(--theme-info)]', label: 'WIP' },
            { count: currentSprint.taskStats.todo, color: 'bg-[var(--theme-primary)]', label: 'TODO' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className={`w-11 h-9 ${stat.color} flex items-center justify-center border border-[var(--theme-border)]`}>
                <span className="font-mono text-xs font-bold text-[var(--theme-foreground)]">{stat.count}</span>
              </div>
              <span className="text-[10px] font-mono mt-1 text-[var(--theme-foreground-tertiary)]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </m.div>
  )
}

// --- Main component ---

export default function TeamPage() {
  // Enforce profile completion for team features
  useProfileCompletion({ enforceCompletion: true })
  const [state, dispatch] = useReducer(teamPageReducer, teamPageInitialState)
  const { activeTab, searchQuery, selectedStatus, showExpertiseSearch, showExpertiseMatrix, selectedProjectId, showCreateSprintModal, sprintViewMode } = state

  // Get current user's workspaces
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)

  // For now, use the first workspace. In production, you'd get this from context or URL
  const currentWorkspace = workspaces?.[0]

  // Queries
  const teamStatuses = useQuery(
    api.developers.queries.getWorkspaceStatuses,
    currentWorkspace ? { workspaceId: currentWorkspace._id as any } : 'skip'
  )

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    currentWorkspace ? { workspaceId: currentWorkspace._id as any } : 'skip'
  )

  // Auto-select first project for sprints
  if (!selectedProjectId && projects && projects.length > 0) {
    dispatch({ type: 'UPDATE', field: 'selectedProjectId', value: projects[0]._id })
  }

  const sprints = useQuery(
    api.sprints.queries.getProjectSprints,
    selectedProjectId ? { projectId: selectedProjectId as any } : 'skip'
  )

  const currentSprint = useQuery(
    api.sprints.queries.getCurrentSprint,
    selectedProjectId ? { projectId: selectedProjectId as any } : 'skip'
  )

  if (!currentWorkspace) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="border-2 border-dashed border-[var(--theme-border)] p-8 text-center max-w-md">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineUserGroup className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-[var(--theme-foreground)] mb-1">NO WORKSPACE SELECTED</h2>
          <p className="text-xs text-[var(--theme-foreground-tertiary)] font-mono">Create or select a workspace to view team members</p>
        </div>
      </div>
    )
  }

  if (!teamStatuses) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Filter team members
  const filteredMembers = teamStatuses.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Group by status for summary
  const statusCounts = teamStatuses.reduce((acc, member) => {
    acc[member.status] = (acc[member.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const renderMembersTab = () => (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <StatusSummaryGrid statusCounts={statusCounts} />

      <MembersFiltersBar
        searchQuery={searchQuery}
        selectedStatus={selectedStatus}
        onSearchChange={(value) => dispatch({ type: 'UPDATE', field: 'searchQuery', value })}
        onStatusChange={(value) => dispatch({ type: 'UPDATE', field: 'selectedStatus', value })}
        onFindExpert={() => dispatch({ type: 'UPDATE', field: 'showExpertiseSearch', value: true })}
        onShowMatrix={() => dispatch({ type: 'UPDATE', field: 'showExpertiseMatrix', value: true })}
      />

      {/* Team Grid */}
      {filteredMembers.length === 0 ? (
        <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center">
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
            <HiOutlineUser className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--theme-foreground)] mb-1">NO MEMBERS FOUND</h3>
          <p className="text-xs text-[var(--theme-foreground-tertiary)] font-mono">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMembers.map((member, i) => (
            <m.div
              key={member.userId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <DeveloperProfileCard
                userId={member.userId as string}
                onClick={() => {
                  console.log('Navigate to profile:', member.userId)
                }}
              />
            </m.div>
          ))}
        </div>
      )}
    </m.div>
  )

  const renderSprintsTab = () => (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Project Selector & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="font-mono text-xs text-[var(--theme-foreground-tertiary)] uppercase tracking-wider hidden md:inline">Project:</span>
          <select
            className="flex-1 md:w-56 px-3 py-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] font-mono text-xs uppercase font-bold text-[var(--theme-foreground)] focus:border-[var(--theme-primary)] focus:outline-none cursor-pointer"
            value={selectedProjectId}
            onChange={(e) => dispatch({ type: 'UPDATE', field: 'selectedProjectId', value: e.target.value })}
            aria-label="Select project"
          >
            {projects?.map((project: any) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex border-2 border-[var(--theme-border)]">
            <button
              className={clsx(
                "px-3 py-2 flex items-center gap-2 font-mono text-xs font-bold uppercase border-r-2 border-[var(--theme-border)]",
                sprintViewMode === 'board'
                  ? "bg-[var(--theme-primary)] text-white"
                  : "bg-[var(--theme-background-tertiary)] text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)]"
              )}
              onClick={() => dispatch({ type: 'UPDATE', field: 'sprintViewMode', value: 'board' })}
            >
              <HiOutlineViewBoards className="w-4 h-4" />
              Board
            </button>
            <button
              className={clsx(
                "px-3 py-2 flex items-center gap-2 font-mono text-xs font-bold uppercase",
                sprintViewMode === 'planning'
                  ? "bg-[var(--theme-primary)] text-white"
                  : "bg-[var(--theme-background-tertiary)] text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)]"
              )}
              onClick={() => dispatch({ type: 'UPDATE', field: 'sprintViewMode', value: 'planning' })}
            >
              <HiOutlineCalendar className="w-4 h-4" />
              Planning
            </button>
          </div>

          <button
            onClick={() => dispatch({ type: 'UPDATE', field: 'showCreateSprintModal', value: true })}
            className="px-4 py-2 bg-[var(--theme-primary)] text-white font-mono text-xs font-bold uppercase border-2 border-[var(--theme-primary-active)] flex items-center gap-2 whitespace-nowrap hover:bg-[var(--theme-primary-active)]"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Sprint
          </button>
        </div>
      </div>

      {/* Current Sprint Info (Only in Board View) */}
      {sprintViewMode === 'board' && currentSprint && (
        <CurrentSprintInfoCard currentSprint={currentSprint} />
      )}

      {/* Content */}
      {sprints === undefined ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !selectedProjectId ? (
        <EmptyState
          title="No Project Selected"
          description="Select a project to view sprints."
        />
      ) : sprintViewMode === 'board' ? (
        currentSprint ? (
          <SprintBoard sprint={currentSprint} projectId={selectedProjectId} />
        ) : (
          <EmptyState
            title="No Active Sprint"
            description="Start a sprint in the Planning view to see the board."
            action={{
              label: "GO TO PLANNING",
              onClick: () => dispatch({ type: 'UPDATE', field: 'sprintViewMode', value: 'planning' })
            }}
          />
        )
      ) : (
        <SprintPlanning
          projectId={selectedProjectId}
          sprints={sprints}
          currentSprint={currentSprint}
        />
      )}
    </m.div>
  )

  return (
    <div className="p-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] inline-block mb-1.5">
            WORKSPACE
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--theme-foreground)] flex items-center gap-2">
            <HiOutlineUserGroup className="w-5 h-5 text-[var(--theme-primary)]" />
            Team & Sprints
          </h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mt-1 uppercase tracking-wider">
            {currentWorkspace.name} &bull; {teamStatuses.length} members
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-0 border-b-2 border-[var(--theme-border)] mb-4">
        {[
          { id: 'members' as TabType, label: 'MEMBERS' },
          { id: 'sprints' as TabType, label: 'SPRINTS' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'UPDATE', field: 'activeTab', value: tab.id })}
            className={clsx(
              "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-colors",
              activeTab === tab.id
                ? "text-[var(--theme-foreground)] border-[var(--theme-primary)]"
                : "text-[var(--theme-foreground-tertiary)] border-transparent hover:text-[var(--theme-foreground-secondary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'members' ? renderMembersTab() : renderSprintsTab()}

      {/* Modals */}
      {showExpertiseSearch && (
        <ExpertiseSearchModal
          onClose={() => dispatch({ type: 'UPDATE', field: 'showExpertiseSearch', value: false })}
          workspaceId={currentWorkspace._id}
        />
      )}

      {showExpertiseMatrix && (
        <TeamExpertiseMatrix
          workspaceId={currentWorkspace._id}
          onClose={() => dispatch({ type: 'UPDATE', field: 'showExpertiseMatrix', value: false })}
          isModal={true}
        />
      )}

      <CreateSprintModal
        isOpen={showCreateSprintModal}
        onClose={() => dispatch({ type: 'UPDATE', field: 'showCreateSprintModal', value: false })}
        projectId={selectedProjectId}
      />
    </div>
  )
}
