import { useState } from 'react'
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

type TabType = 'members' | 'sprints'

export default function TeamPage() {
  // Enforce profile completion for team features
  useProfileCompletion({ enforceCompletion: true })
  const [activeTab, setActiveTab] = useState<TabType>('members')

  // Members State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showExpertiseSearch, setShowExpertiseSearch] = useState(false)
  const [showExpertiseMatrix, setShowExpertiseMatrix] = useState(false)

  // Sprints State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false)
  const [sprintViewMode, setSprintViewMode] = useState<'board' | 'planning'>('board')

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
    setSelectedProjectId(projects[0]._id)
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
      <div className="p-8 flex items-center justify-center min-h-screen bg-[var(--theme-background)]">
        <BrutalCard variant="glitch" className="max-w-md text-center p-8 border-2 border-[var(--theme-border)]">
          <h2 className="text-xl font-bold mb-4 uppercase">No Workspace Selected</h2>
          <p className="text-[var(--theme-foreground)]/60 font-mono text-sm">Create or select a workspace to view team members</p>
        </BrutalCard>
      </div>
    )
  }

  if (!teamStatuses) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--theme-background)]">
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
    <div className="space-y-8">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'AVAILABLE', count: statusCounts.AVAILABLE || 0, color: 'bg-brutal-success' },
          { label: 'LOCKED IN', count: statusCounts.LOCKED_IN || 0, color: 'bg-brutal-error' },
          { label: 'IN REVIEW', count: statusCounts.IN_REVIEW || 0, color: 'bg-brutal-info' },
          { label: 'IN MEETING', count: statusCounts.IN_MEETING || 0, color: 'bg-brutal-warning' },
          { label: 'AFK', count: statusCounts.AFK || 0, color: 'bg-primary-brutalist/30' },
        ].map((status) => (
          <div key={status.label} className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-4 hover:translate-x-1 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-3 h-3 ${status.color}`}></div>
              <span className="font-mono text-2xl font-bold">{status.count}</span>
            </div>
            <div className="font-mono text-xs uppercase text-[var(--theme-foreground)]/60">{status.label}</div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-foreground)]/60" />
          <input
            type="text"
            placeholder="SEARCH TEAM MEMBERS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-[var(--theme-foreground)] placeholder-[var(--theme-foreground)]/40 font-mono text-sm uppercase focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-[var(--theme-foreground)] font-mono text-sm uppercase focus:border-[var(--theme-primary)] focus:outline-none transition-colors cursor-pointer"
        >
          <option value="all">ALL STATUSES</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="LOCKED_IN">LOCKED IN</option>
          <option value="IN_REVIEW">IN REVIEW</option>
          <option value="IN_MEETING">IN MEETING</option>
          <option value="AFK">AFK</option>
        </select>

        <BrutalButton
          variant="secondary"
          onClick={() => setShowExpertiseSearch(true)}
          className="flex items-center gap-2"
        >
          <HiOutlineSearch className="w-4 h-4" />
          FIND EXPERT
        </BrutalButton>

        <BrutalButton
          variant="secondary"
          onClick={() => setShowExpertiseMatrix(true)}
          className="flex items-center gap-2"
        >
          <HiOutlineChartBar className="w-4 h-4" />
          MATRIX
        </BrutalButton>
      </div>

      {/* Team Grid */}
      {filteredMembers.length === 0 ? (
        <BrutalCard variant="default" className="p-12 text-center border-dashed">
          <HiOutlineUser className="w-12 h-12 text-[var(--theme-foreground)]/20 mx-auto mb-4" />
          <p className="text-[var(--theme-foreground)]/60 font-mono">No team members found</p>
        </BrutalCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <DeveloperProfileCard
              key={member.userId}
              userId={member.userId as string}
              onClick={() => {
                // Navigate to profile page when implemented
                console.log('Navigate to profile:', member.userId)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )

  const renderSprintsTab = () => (
    <div className="space-y-8">
      {/* Project Selector & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <span className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase hidden md:inline">Project:</span>
          <select
            className="flex-1 md:w-64 px-4 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                     font-mono text-sm uppercase font-bold
                     focus:border-[var(--theme-primary)] focus:outline-none transition-colors cursor-pointer"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects?.map((project: any) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex border-2 border-[var(--theme-border)] bg-[var(--theme-background)]">
            <button
              className={clsx(
                "px-4 py-2 flex items-center gap-2 font-mono text-xs font-bold uppercase transition-colors",
                "border-r-2 border-[var(--theme-border)]",
                sprintViewMode === 'board'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
              )}
              onClick={() => setSprintViewMode('board')}
            >
              <HiOutlineViewBoards className="w-4 h-4" />
              Board
            </button>
            <button
              className={clsx(
                "px-4 py-2 flex items-center gap-2 font-mono text-xs font-bold uppercase transition-colors",
                sprintViewMode === 'planning'
                  ? "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                  : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
              )}
              onClick={() => setSprintViewMode('planning')}
            >
              <HiOutlineCalendar className="w-4 h-4" />
              Planning
            </button>
          </div>

          <BrutalButton
            variant="primary"
            onClick={() => setShowCreateSprintModal(true)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Sprint
          </BrutalButton>
        </div>
      </div>

      {/* Current Sprint Info (Only in Board View) */}
      {sprintViewMode === 'board' && currentSprint && (
        <BrutalCard variant="neon" className="border-[var(--theme-primary)]">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <HiOutlinePlay className="w-6 h-6 text-[var(--theme-primary)]" />
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  {currentSprint.name}
                </h2>
                <BrutalBadge variant="default">ACTIVE</BrutalBadge>
              </div>
              {currentSprint.goal && (
                <p className="text-sm font-mono text-[var(--theme-foreground)]/80 mb-4 border-l-2 border-[var(--theme-primary)] pl-3">
                  {currentSprint.goal}
                </p>
              )}
              <div className="flex flex-wrap gap-6 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <HiOutlineCalendar className="w-4 h-4 text-[var(--theme-primary)]" />
                  <span>{currentSprint.daysRemaining} DAYS LEFT</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineChartBar className="w-4 h-4 text-[var(--theme-primary)]" />
                  <span>{currentSprint.progress}% COMPLETE</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineClock className="w-4 h-4 text-[var(--theme-primary)]" />
                  <span>{currentSprint.completedPoints}/{currentSprint.totalPoints} POINTS</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              {[
                { count: currentSprint.taskStats.done, color: 'bg-[var(--theme-background-secondary)]', label: 'DONE' },
                { count: currentSprint.taskStats.inReview, color: 'bg-[var(--theme-success)]', label: 'REVIEW' },
                { count: currentSprint.taskStats.inProgress, color: 'bg-[var(--theme-info)]', label: 'WIP' },
                { count: currentSprint.taskStats.todo, color: 'bg-[var(--theme-accent)]', label: 'TODO' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <div className={`w-12 h-10 ${stat.color} flex items-center justify-center border border-[var(--theme-background)]`}>
                    <span className="font-mono text-xs font-bold">{stat.count}</span>
                  </div>
                  <span className="text-[10px] font-mono mt-1 text-[var(--theme-foreground)]/60">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </BrutalCard>
      )}

      {/* Content */}
      {sprints === undefined ? (
        <LoadingSpinner size="lg" />
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
              onClick: () => setSprintViewMode('planning')
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
    </div>
  )

  return (
    <div className="p-6 min-h-screen bg-[var(--theme-background)]">
      {/* Page Header */}
      <div className="mb-8 border-b-2 border-[var(--theme-border)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <HiOutlineUserGroup className="w-8 h-8 md:w-10 md:h-10 text-[var(--theme-primary)]" />
            TEAM & SPRINTS
          </h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-wide">
            {currentWorkspace.name} • {teamStatuses.length} MEMBERS
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('members')}
            className={clsx(
              "px-6 py-2 font-mono text-sm font-bold uppercase transition-all border-t-2 border-x-2",
              activeTab === 'members'
                ? "bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-primary)] -mb-[26px] z-10 pb-8"
                : "bg-[var(--theme-background-secondary)] border-transparent text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]"
            )}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('sprints')}
            className={clsx(
              "px-6 py-2 font-mono text-sm font-bold uppercase transition-all border-t-2 border-x-2",
              activeTab === 'sprints'
                ? "bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-primary)] -mb-[26px] z-10 pb-8"
                : "bg-[var(--theme-background-secondary)] border-transparent text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]"
            )}
          >
            Sprints
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'members' ? renderMembersTab() : renderSprintsTab()}
      </div>

      {/* Modals */}
      {showExpertiseSearch && (
        <ExpertiseSearchModal
          onClose={() => setShowExpertiseSearch(false)}
          workspaceId={currentWorkspace._id}
        />
      )}

      {showExpertiseMatrix && (
        <TeamExpertiseMatrix
          workspaceId={currentWorkspace._id}
          onClose={() => setShowExpertiseMatrix(false)}
          isModal={true}
        />
      )}

      <CreateSprintModal
        isOpen={showCreateSprintModal}
        onClose={() => setShowCreateSprintModal(false)}
        projectId={selectedProjectId}
      />
    </div>
  )
}