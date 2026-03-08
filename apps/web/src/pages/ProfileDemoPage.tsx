import { useReducer } from 'react'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import clsx from 'clsx'
import { 
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineClipboardList,
  HiOutlineCode
} from 'react-icons/hi'
import { ExpertiseSearchModal } from '@/components/features/profile/ExpertiseSearchModal'
import { TeamExpertiseMatrix } from '@/components/features/profile/TeamExpertiseMatrix'
import { ReviewerSuggestions } from '@/components/features/profile/ReviewerSuggestions'
import { TaskAssignmentHelper } from '@/components/features/task/TaskAssignmentHelper'
import DeveloperProfileCard from '@/components/features/developer/DeveloperProfileCard'
import { EditDeveloperProfileModal } from '@/components/features/profile/EditDeveloperProfileModal'

type ProfileDemoState = {
  showExpertiseSearch: boolean
  showExpertiseMatrix: boolean
  showEditProfile: boolean
  selectedTechnologies: string[]
  assignedUsers: Id<"users">[]
}

const profileDemoInitialState: ProfileDemoState = {
  showExpertiseSearch: false,
  showExpertiseMatrix: false,
  showEditProfile: false,
  selectedTechnologies: ['React', 'TypeScript', 'Node.js'],
  assignedUsers: [],
}

type ProfileDemoAction =
  | { type: 'UPDATE'; field: keyof ProfileDemoState; value: ProfileDemoState[keyof ProfileDemoState] }
  | { type: 'RESET' }

function profileDemoReducer(state: ProfileDemoState, action: ProfileDemoAction): ProfileDemoState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return profileDemoInitialState
    default:
      return state
  }
}

export default function ProfileDemoPage() {
  const [state, dispatch] = useReducer(profileDemoReducer, profileDemoInitialState)
  const { showExpertiseSearch, showExpertiseMatrix, showEditProfile, selectedTechnologies, assignedUsers } = state

  // Get current user and workspace
  const currentUser = useQuery(api.auth.users.getCurrentUser)
  const workspaces = useQuery(api.workspaces.queries.getUserWorkspaces)
  const currentWorkspace = workspaces?.[0]

  if (!currentUser || !currentWorkspace) {
    return (
      <div className="p-[24px] text-center">
        <div className="text-[14px] font-semibold">Loading profile demo...</div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="p-[16px] space-y-32px">
      {/* Page Header */}
      <div className="mb-[16px]">
        <h1 className="text-[20px] font-bold font-bold mb-8px">DEVELOPER PROFILE FEATURES DEMO</h1>
        <p className="text-brutal-sm text-primary-brutalist/80">
          Explore all the new developer profile and team expertise features
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        {/* Profile Card Demo */}
        <div className="brutal-card p-[16px]">
          <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
            <HiOutlineUser className="w-20px h-20px" />
            DEVELOPER PROFILE CARD
          </h3>
          <p className="text-brutal-sm text-primary-brutalist/80 mb-[8px]">
            Real-time status, expertise display, and quick actions
          </p>
          <DeveloperProfileCard 
            userId={currentUser._id}
            onClick={() => console.log('Profile clicked')}
          />
          <button
            onClick={() => dispatch({ type: 'UPDATE', field: 'showEditProfile', value: true })}
            className="brutal-btn w-full mt-[8px]"
          >
            EDIT YOUR PROFILE
          </button>
        </div>

        {/* Expertise Search Demo */}
        <div className="brutal-card p-[16px]">
          <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
            <HiOutlineSearch className="w-20px h-20px" />
            FIND TEAM EXPERTS
          </h3>
          <p className="text-brutal-sm text-primary-brutalist/80 mb-[8px]">
            Search for team members by technology, skill, or expertise
          </p>
          <button
            onClick={() => dispatch({ type: 'UPDATE', field: 'showExpertiseSearch', value: true })}
            className="brutal-btn w-full"
          >
            OPEN EXPERTISE SEARCH
          </button>
          <div className="mt-12px p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
            <p className="font-mono text-brutal-xs text-primary-brutalist/60">
              Try searching for: React, Python, DevOps, UI/UX, or any technology
            </p>
          </div>
        </div>

        {/* Team Matrix Demo */}
        <div className="brutal-card p-[16px]">
          <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
            <HiOutlineChartBar className="w-20px h-20px" />
            EXPERTISE MATRIX
          </h3>
          <p className="text-brutal-sm text-primary-brutalist/80 mb-[8px]">
            Visualize your team's skills and expertise levels
          </p>
          <button
            onClick={() => dispatch({ type: 'UPDATE', field: 'showExpertiseMatrix', value: true })}
            className="brutal-btn w-full"
          >
            VIEW TEAM MATRIX
          </button>
          <div className="mt-12px p-12px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
            <p className="font-mono text-brutal-xs text-primary-brutalist/60">
              Matrix view with filters, sorting, and CSV export
            </p>
          </div>
        </div>
      </div>

      {/* Reviewer Suggestions Demo */}
      <div className="brutal-card p-[16px]">
        <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
          <HiOutlineLightBulb className="w-20px h-20px" />
          SMART REVIEWER SUGGESTIONS
        </h3>
        <p className="text-brutal-sm text-primary-brutalist/80 mb-[8px]">
          Get AI-powered suggestions for code reviewers based on expertise matching
        </p>
        
        <div className="mb-[8px]">
          <span className="block font-mono text-brutal-sm font-bold mb-8px">
            SELECT TECHNOLOGIES FOR REVIEW:
          </span>
          <div className="flex flex-wrap gap-8px">
            {['React', 'TypeScript', 'Node.js', 'Python', 'DevOps', 'PostgreSQL'].map((tech) => (
              <button
                key={tech}
                onClick={() => {
                  if (selectedTechnologies.includes(tech)) {
                    dispatch({ type: 'UPDATE', field: 'selectedTechnologies', value: selectedTechnologies.filter(t => t !== tech) })
                  } else {
                    dispatch({ type: 'UPDATE', field: 'selectedTechnologies', value: [...selectedTechnologies, tech] })
                  }
                }}
                className={clsx(
                  "px-12px py-6px font-mono text-brutal-xs font-bold transition-all",
                  selectedTechnologies.includes(tech)
                    ? "bg-primary-brutalist text-event-horizon border-2 border-primary-brutalist"
                    : "bg-[var(--theme-background-secondary)] text-primary-brutalist border-2 border-[var(--theme-border)] hover:border-primary-brutalist"
                )}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>

        <ReviewerSuggestions
          technologies={selectedTechnologies}
          workspaceId={currentWorkspace._id}
          excludeUserId={currentUser._id}
          maxSuggestions={5}
          onSelectReviewer={(userId) => console.log('Selected reviewer:', userId)}
          mode="detailed"
        />
      </div>

      {/* Task Assignment Helper Demo */}
      <div className="brutal-card p-[16px]">
        <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
          <HiOutlineClipboardList className="w-20px h-20px" />
          SMART TASK ASSIGNMENT
        </h3>
        <p className="text-brutal-sm text-primary-brutalist/80 mb-[8px]">
          Automatically detect technologies from task details and suggest the best assignees
        </p>

        <TaskAssignmentHelper
          workspaceId={currentWorkspace._id}
          currentAssignees={assignedUsers}
          onAssigneeChange={(users: Id<"users">[]) => dispatch({ type: 'UPDATE', field: 'assignedUsers', value: users })}
          taskTitle="Implement React component with TypeScript and integrate Node.js API"
          taskDescription="Need to create a new dashboard component using React hooks and TypeScript. The component should fetch data from our Node.js backend API and handle real-time updates."
          taskLabels={['frontend', 'api-integration', 'urgent']}
          mode="full"
        />
      </div>

      {/* Integration Examples */}
      <div className="brutal-card p-[16px] bg-[var(--theme-background-secondary)]">
        <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
          <HiOutlineCode className="w-20px h-20px" />
          INTEGRATION POINTS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
          <div>
            <h4 className="font-mono text-brutal-sm font-bold mb-8px">WHERE TO FIND THESE FEATURES:</h4>
            <ul className="space-y-4px">
              <li className="flex items-center gap-8px">
                <span className="w-4px h-4px bg-primary-brutalist"></span>
                <span className="font-mono text-brutal-xs">Team Page → "FIND EXPERT" & "EXPERTISE MATRIX" buttons</span>
              </li>
              <li className="flex items-center gap-8px">
                <span className="w-4px h-4px bg-primary-brutalist"></span>
                <span className="font-mono text-brutal-xs">Project Management → Team section → "EXPERTISE MATRIX" button</span>
              </li>
              <li className="flex items-center gap-8px">
                <span className="w-4px h-4px bg-primary-brutalist"></span>
                <span className="font-mono text-brutal-xs">Quick Actions → "FIND EXPERT" action (Shift+F)</span>
              </li>
              <li className="flex items-center gap-8px">
                <span className="w-4px h-4px bg-primary-brutalist"></span>
                <span className="font-mono text-brutal-xs">Developer Profile Page → View & edit full profile</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-brutal-sm font-bold mb-8px">COMING SOON:</h4>
            <ul className="space-y-4px">
              <li className="flex items-center gap-8px">
                <span className="w-4px h-4px bg-brutal-warning"></span>
                <span className="font-mono text-brutal-xs">Task creation/edit → Smart assignee suggestions</span>
              </li>
              <li className="flex items-center gap-8px">
                <span className="w-4px h-4px bg-brutal-warning"></span>
                <span className="font-mono text-brutal-xs">Settings page → Developer profile tab</span>
              </li>
              <li className="flex items-center gap-8px">
                <span className="w-4px h-4px bg-brutal-warning"></span>
                <span className="font-mono text-brutal-xs">GitHub PR integration → Auto-suggest reviewers</span>
              </li>
              <li className="flex items-center gap-8px">
                <span className="w-4px h-4px bg-brutal-warning"></span>
                <span className="font-mono text-brutal-xs">AFK detection → Auto status updates</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExpertiseSearchModal
        isOpen={showExpertiseSearch}
        onClose={() => dispatch({ type: 'UPDATE', field: 'showExpertiseSearch', value: false })}
        workspaceId={currentWorkspace._id}
      />

      {showExpertiseMatrix && (
        <TeamExpertiseMatrix
          workspaceId={currentWorkspace._id}
          onClose={() => dispatch({ type: 'UPDATE', field: 'showExpertiseMatrix', value: false })}
          isModal={true}
        />
      )}

      {showEditProfile && (
        <EditDeveloperProfileModal
          userId={currentUser._id}
          isOpen={showEditProfile}
          onClose={() => dispatch({ type: 'UPDATE', field: 'showEditProfile', value: false })}
        />
      )}
    </div>
    </ErrorBoundary>
  )
}