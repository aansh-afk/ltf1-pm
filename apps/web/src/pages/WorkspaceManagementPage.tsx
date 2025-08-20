import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  HiOutlineHome,
  HiOutlineCog,
  HiOutlineUsers,
  HiOutlineFolder,
  HiOutlineChartBar,
  HiOutlineBell,
  HiOutlineLink,
  HiOutlineCreditCard,
  HiOutlineExclamation,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineCode,
  HiOutlineCheck,
  HiOutlineX
} from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import { WorkspaceIntegrationsTab } from '@/components/features/github/WorkspaceIntegrationsTab'
import clsx from 'clsx'

interface WorkspaceTab {
  id: string
  label: string
  icon: any
  count?: number
}

export default function WorkspaceManagementPage() {
  const { workspaceId } = useParams()
  const [activeTab, setActiveTab] = useState('overview')


  // Get workspace details
  const workspace = useQuery(
    api.workspaces.queries.getWorkspaceById,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  // Get workspace members for member count
  const members = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  // Get workspace projects for project count
  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  if (workspace === undefined) {
    return <LoadingSpinner size="lg" />
  }

  if (workspace === null) {
    return (
      <div className="p-32px">
        <div className="brutal-card p-32px text-center">
          <h1 className="text-brutal-xl font-bold uppercase mb-16px text-[var(--theme-error)]">WORKSPACE NOT FOUND</h1>
          <p className="text-brutal-sm text-[var(--theme-foreground)]/70">
            THE WORKSPACE YOU'RE LOOKING FOR DOESN'T EXIST OR YOU DON'T HAVE ACCESS TO IT.
          </p>
        </div>
      </div>
    )
  }

  const tabs: WorkspaceTab[] = [
    { id: 'overview', label: 'OVERVIEW', icon: HiOutlineHome },
    { id: 'projects', label: 'PROJECTS', icon: HiOutlineFolder, count: projects?.length },
    { id: 'members', label: 'MEMBERS', icon: HiOutlineUsers, count: members?.length },
    { id: 'settings', label: 'SETTINGS', icon: HiOutlineCog },
    { id: 'analytics', label: 'ANALYTICS', icon: HiOutlineChartBar },
    { id: 'integrations', label: 'INTEGRATIONS', icon: HiOutlineLink },
    { id: 'billing', label: 'BILLING', icon: HiOutlineCreditCard },
    { id: 'danger', label: 'DANGER ZONE', icon: HiOutlineExclamation },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab workspace={workspace} projects={projects} members={members} />
      case 'projects':
        return <ProjectsTab workspaceId={workspaceId!} projects={projects} />
      case 'members':
        return <MembersTab workspaceId={workspaceId!} members={members} />
      case 'settings':
        return <SettingsTab workspace={workspace} />
      case 'analytics':
        return <AnalyticsTab workspaceId={workspaceId!} />
      case 'integrations':
        return <WorkspaceIntegrationsTab workspace={workspace} />
      case 'billing':
        return <BillingTab workspace={workspace} />
      case 'danger':
        return <DangerTab workspace={workspace} />
      default:
        return <OverviewTab workspace={workspace} projects={projects} members={members} />
    }
  }

  return (
    <div className="h-full flex">
      {/* Sidebar Navigation */}
      <aside className="w-320px bg-[var(--theme-background)] border-r-2 border-[var(--theme-border)]">
        {/* Workspace Header */}
        <div className="p-24px border-b-2 border-[var(--theme-border)]">
          <h1 className="text-brutal-xl font-bold uppercase mb-8px">{workspace.name}</h1>
          <p className="text-brutal-xs text-[var(--theme-foreground)]/70 uppercase">
            {workspace.description || 'WORKSPACE MANAGEMENT'}
          </p>
        </div>

        {/* Tab Navigation */}
        <nav className="py-16px">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-24px py-16px text-brutal-sm font-semibold transition-all duration-200 ease-brutal-out',
                  isActive
                    ? 'bg-[var(--theme-background-secondary)] text-primary-brutalist border-l-4 border-primary-brutalist'
                    : 'text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]/50 hover:text-[var(--theme-foreground)] hover:translate-x-4px'
                )}
              >
                <div className="flex items-center">
                  <Icon className="w-20px h-20px mr-12px" />
                  {tab.label}
                </div>
                {tab.count !== undefined && (
                  <span className="px-8px py-2px bg-basalt-border text-brutal-xs font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </main>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ workspace, projects, members }: any) {
  return (
    <div className="p-32px space-y-32px">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24px">
        <div className="brutal-card p-24px">
          <div className="flex items-center justify-between mb-16px">
            <HiOutlineFolder className="w-24px h-24px text-primary-brutalist" />
            <span className="text-brutal-xs text-[var(--theme-foreground)]/70">PROJECTS</span>
          </div>
          <div className="text-brutal-2xl font-bold">{projects?.length || 0}</div>
        </div>

        <div className="brutal-card p-24px">
          <div className="flex items-center justify-between mb-16px">
            <HiOutlineUsers className="w-24px h-24px text-[var(--theme-info)]" />
            <span className="text-brutal-xs text-[var(--theme-foreground)]/70">MEMBERS</span>
          </div>
          <div className="text-brutal-2xl font-bold">{members?.length || 0}</div>
        </div>

        <div className="brutal-card p-24px">
          <div className="flex items-center justify-between mb-16px">
            <HiOutlinePlay className="w-24px h-24px text-[var(--theme-success)]" />
            <span className="text-brutal-xs text-[var(--theme-foreground)]/70">ACTIVE SPRINTS</span>
          </div>
          <div className="text-brutal-2xl font-bold">3</div>
        </div>

        <div className="brutal-card p-24px">
          <div className="flex items-center justify-between mb-16px">
            <HiOutlineClock className="w-24px h-24px text-[var(--theme-warning)]" />
            <span className="text-brutal-xs text-[var(--theme-foreground)]/70">TASKS COMPLETED</span>
          </div>
          <div className="text-brutal-2xl font-bold">127</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="brutal-card p-32px">
        <h2 className="text-brutal-lg font-bold uppercase mb-24px">RECENT ACTIVITY</h2>
        <div className="space-y-16px">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-16px p-16px bg-[var(--theme-background-secondary)]/10 border border-[var(--theme-border)]">
              <div className="w-8px h-8px bg-primary-brutalist"></div>
              <div className="flex-1">
                <p className="text-brutal-sm font-mono">
                  USER JOHN_DOE COMPLETED TASK "IMPLEMENT AUTH SYSTEM"
                </p>
                <p className="text-brutal-xs text-[var(--theme-foreground)]/60">2 HOURS AGO</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Projects Tab Component
function ProjectsTab({ workspaceId, projects }: any) {
  const navigate = useNavigate()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  return (
    <div className="p-32px">
      <div className="flex items-center justify-between mb-32px">
        <h1 className="text-brutal-xl font-bold uppercase">PROJECTS</h1>
        <button 
          className="brutal-btn"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + NEW PROJECT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24px">
        {projects?.map((project: any) => (
          <div key={project._id} className="brutal-card p-24px">
            <h3 className="text-brutal-lg font-bold uppercase mb-16px">{project.name}</h3>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/70 mb-16px">{project.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-brutal-xs text-[var(--theme-foreground)]/60">STATUS: {project.status}</span>
              <button 
                onClick={() => navigate(`/workspace/${workspaceId}/project/${project._id}`)}
                className="brutal-btn-sm"
              >
                MANAGE
              </button>
            </div>
          </div>
        ))}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  )
}

// Members Tab Component
function MembersTab({ workspaceId, members }: any) {
  return (
    <div className="p-32px">
      <div className="flex items-center justify-between mb-32px">
        <h1 className="text-brutal-xl font-bold uppercase">MEMBERS</h1>
        <button className="brutal-btn">+ INVITE MEMBER</button>
      </div>

      <div className="brutal-card p-32px">
        <div className="space-y-16px">
          {members?.map((member: any) => (
            <div key={member.userId} className="flex items-center justify-between p-16px bg-[var(--theme-background-secondary)]/10 border border-[var(--theme-border)]">
              <div className="flex items-center gap-16px">
                <div className="w-48px h-48px bg-primary-brutalist border-2 border-[var(--theme-border)] flex items-center justify-center">
                  <HiOutlineUsers className="w-24px h-24px text-event-horizon" />
                </div>
                <div>
                  <h3 className="font-mono text-brutal-sm uppercase">{member.user?.name || 'UNKNOWN USER'}</h3>
                  <p className="text-brutal-xs text-[var(--theme-foreground)]/60">ROLE: {member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-8px">
                <button className="brutal-btn-sm">EDIT</button>
                <button className="brutal-btn-sm bg-[var(--theme-error)] border-[var(--theme-error)]">REMOVE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Settings Tab Component
function SettingsTab({ workspace }: any) {
  return (
    <div className="p-32px space-y-32px">
      <h1 className="text-brutal-xl font-bold uppercase">WORKSPACE SETTINGS</h1>
      
      <div className="brutal-card p-32px">
        <h2 className="text-brutal-lg font-bold uppercase mb-24px">GENERAL SETTINGS</h2>
        <div className="space-y-24px">
          <div>
            <label className="block text-brutal-sm mb-8px uppercase">WORKSPACE NAME</label>
            <input 
              type="text" 
              defaultValue={workspace.name}
              className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm"
            />
          </div>
          <div>
            <label className="block text-brutal-sm mb-8px uppercase">DESCRIPTION</label>
            <textarea 
              defaultValue={workspace.description}
              className="w-full px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm h-96px"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Other tab components with placeholder content
function AnalyticsTab({ workspaceId }: any) {
  return (
    <div className="p-32px">
      <h1 className="text-brutal-xl font-bold uppercase mb-32px">ANALYTICS</h1>
      <div className="brutal-card p-32px text-center">
        <HiOutlineChartBar className="w-64px h-64px mx-auto mb-16px text-[var(--theme-foreground)]/50" />
        <p className="text-brutal-sm text-[var(--theme-foreground)]/70">ANALYTICS DASHBOARD COMING SOON</p>
      </div>
    </div>
  )
}


function BillingTab({ workspace }: any) {
  return (
    <div className="p-32px">
      <h1 className="text-brutal-xl font-bold uppercase mb-32px">BILLING & SUBSCRIPTION</h1>
      <div className="brutal-card p-32px text-center">
        <HiOutlineCreditCard className="w-64px h-64px mx-auto mb-16px text-[var(--theme-foreground)]/50" />
        <p className="text-brutal-sm text-[var(--theme-foreground)]/70">BILLING MANAGEMENT COMING SOON</p>
      </div>
    </div>
  )
}

function DangerTab({ workspace }: any) {
  return (
    <div className="p-32px">
      <h1 className="text-brutal-xl font-bold uppercase mb-32px text-[var(--theme-error)]">DANGER ZONE</h1>
      <div className="brutal-card p-32px border-[var(--theme-error)]">
        <div className="space-y-24px">
          <div className="p-24px bg-[var(--theme-error)]/10 border border-[var(--theme-error)]">
            <h3 className="text-brutal-lg font-bold uppercase mb-16px text-[var(--theme-error)]">DELETE WORKSPACE</h3>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/70 mb-16px">
              PERMANENTLY DELETE THIS WORKSPACE AND ALL ITS DATA. THIS ACTION CANNOT BE UNDONE.
            </p>
            <button className="brutal-btn bg-[var(--theme-error)] border-[var(--theme-error)] hover:bg-[#CC0000]">
              DELETE WORKSPACE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}