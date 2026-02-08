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
  HiOutlineLink,
  HiOutlineCreditCard,
  HiOutlineExclamation,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineTerminal,
  HiOutlineViewGrid,
  HiOutlineLightningBolt,
  HiOutlinePlus
} from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import { WorkspaceIntegrationsTab } from '@/components/features/github/WorkspaceIntegrationsTab'
import clsx from 'clsx'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import { motion } from 'framer-motion'

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
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--theme-background)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (workspace === null) {
    return (
      <div className="p-5 flex items-center justify-center min-h-screen">
        <BrutalCard variant="glitch" className="p-5 text-center max-w-md border-[var(--theme-error)]">
          <h1 className="text-xl font-bold uppercase mb-3 text-[var(--theme-error)]">WORKSPACE NOT FOUND</h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/70">
            The requested workspace does not exist or you do not have permission to view it.
          </p>
        </BrutalCard>
      </div>
    )
  }

  const tabs: WorkspaceTab[] = [
    { id: 'overview', label: 'Overview', icon: HiOutlineHome },
    { id: 'projects', label: 'Projects', icon: HiOutlineFolder, count: projects?.length },
    { id: 'members', label: 'Members', icon: HiOutlineUsers, count: members?.length },
    { id: 'analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { id: 'integrations', label: 'Integrations', icon: HiOutlineLink },
    { id: 'settings', label: 'Settings', icon: HiOutlineCog },
    { id: 'billing', label: 'Billing', icon: HiOutlineCreditCard },
    { id: 'danger', label: 'Danger Zone', icon: HiOutlineExclamation },
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
    <div className="h-full flex flex-col md:flex-row min-h-screen bg-[var(--theme-background)]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 lg:w-72 bg-[var(--theme-background)] border-r-2 border-[var(--theme-border)] flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 bg-[var(--theme-primary)] flex items-center justify-center font-bold text-black text-xs">
              {workspace.name.substring(0, 2).toUpperCase()}
            </div>
            <h1 className="font-bold uppercase tracking-wider text-sm truncate">{workspace.name}</h1>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] opacity-60">
            <span className="w-2 h-2 bg-[var(--theme-success)] rounded-full animate-pulse" />
            Active
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-6 py-3 font-mono text-xs font-bold transition-all duration-200 group relative',
                  isActive
                    ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                    : 'text-[var(--theme-foreground)]/70 hover:bg-[var(--theme-background-secondary)] hover:text-[var(--theme-foreground)]'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--theme-primary)]" />
                )}
                <div className="flex items-center gap-3">
                  <Icon className={clsx("w-4 h-4", isActive && "animate-pulse")} />
                  {tab.label}
                </div>
                {tab.count !== undefined && (
                  <span className={clsx(
                    "px-1.5 py-0.5 text-[10px] border",
                    isActive
                      ? "border-[var(--theme-primary)] text-[var(--theme-primary)]"
                      : "border-[var(--theme-border)] text-[var(--theme-foreground)]/50"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t-2 border-[var(--theme-border)] font-mono text-[10px] opacity-40 text-center">
          Workspace ID: {workspace._id}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--theme-background)] relative">
        {/* Grid Background Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 h-full">
          {renderTabContent()}
        </div>
      </main>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ workspace, projects, members }: any) {
  return (
    <div className="p-4 md:p-5 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
          <HiOutlineViewGrid className="w-5 h-5 text-[var(--theme-primary)]" />
          Workspace Overview
        </h2>
        <div className="font-mono text-xs opacity-60">
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <BrutalCard variant="default" className="group hover:border-[var(--theme-primary)] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <HiOutlineFolder className="w-5 h-5 text-[var(--theme-primary)] opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono text-xs opacity-50">Active Projects</span>
          </div>
          <div className="text-4xl font-black tracking-tighter mb-1">{projects?.length || 0}</div>
          <div className="w-full h-1 bg-[var(--theme-border)] mt-2 overflow-hidden">
            <div className="h-full bg-[var(--theme-primary)] w-3/4 animate-pulse" />
          </div>
        </BrutalCard>

        <BrutalCard variant="default" className="group hover:border-[var(--theme-info)] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <HiOutlineUsers className="w-5 h-5 text-[var(--theme-info)] opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono text-xs opacity-50">Members</span>
          </div>
          <div className="text-4xl font-black tracking-tighter mb-1">{members?.length || 0}</div>
          <div className="w-full h-1 bg-[var(--theme-border)] mt-2 overflow-hidden">
            <div className="h-full bg-[var(--theme-info)] w-1/2" />
          </div>
        </BrutalCard>

        <BrutalCard variant="default" className="group hover:border-[var(--theme-success)] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <HiOutlinePlay className="w-5 h-5 text-[var(--theme-success)] opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono text-xs opacity-50">Sprint Velocity</span>
          </div>
          <div className="text-4xl font-black tracking-tighter mb-1">100%</div>
          <div className="w-full h-1 bg-[var(--theme-border)] mt-2 overflow-hidden">
            <div className="h-full bg-[var(--theme-success)] w-full" />
          </div>
        </BrutalCard>

        <BrutalCard variant="default" className="group hover:border-[var(--theme-warning)] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <HiOutlineClock className="w-5 h-5 text-[var(--theme-warning)] opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono text-xs opacity-50">Pending Tasks</span>
          </div>
          <div className="text-4xl font-black tracking-tighter mb-1">42</div>
          <div className="w-full h-1 bg-[var(--theme-border)] mt-2 overflow-hidden">
            <div className="h-full bg-[var(--theme-warning)] w-1/4" />
          </div>
        </BrutalCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <BrutalCard variant="elevated" className="h-full">
            <div className="flex items-center justify-between mb-3 border-b border-[var(--theme-border)] pb-3">
              <h3 className="font-bold uppercase tracking-wider flex items-center gap-2">
                <HiOutlineTerminal className="w-5 h-5" /> Activity Log
              </h3>
              <BrutalBadge variant="success" className="animate-pulse">Live</BrutalBadge>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-start gap-4 p-3 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30 hover:bg-[var(--theme-background-secondary)] transition-colors font-mono text-sm">
                  <div className="w-16 opacity-50 text-xs pt-1">0{item}:00</div>
                  <div className="flex-1">
                    <span className="text-[var(--theme-primary)] font-bold">User_{item}</span>
                    <span className="opacity-70"> updated </span>
                    <span className="text-[var(--theme-warning)]">task-{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </BrutalCard>
        </div>

        <div className="space-y-3">
          <BrutalCard variant="bordered">
            <h3 className="font-bold uppercase tracking-wider mb-3 text-xs opacity-70">System Status</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span>API Gateway</span>
                <span className="text-[var(--theme-success)]">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <span className="text-[var(--theme-success)]">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Storage</span>
                <span className="text-[var(--theme-warning)]">Degraded</span>
              </div>
            </div>
          </BrutalCard>

          <BrutalCard variant="neon" className="bg-black text-white border-[var(--theme-primary)]">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineLightningBolt className="w-5 h-5 text-[var(--theme-primary)]" />
              <span className="font-bold uppercase">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button className="p-2 border border-white/20 hover:bg-white/10 text-xs font-mono text-left">New Project</button>
              <button className="p-2 border border-white/20 hover:bg-white/10 text-xs font-mono text-left">Invite User</button>
              <button className="p-2 border border-white/20 hover:bg-white/10 text-xs font-mono text-left">View Logs</button>
              <button className="p-2 border border-white/20 hover:bg-white/10 text-xs font-mono text-left">Deploy</button>
            </div>
          </BrutalCard>
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
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tighter">Projects</h2>
        <BrutalButton
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <HiOutlinePlus className="w-4 h-4" /> New Project
        </BrutalButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects?.map((project: any) => (
          <BrutalCard key={project._id} variant="default" className="group hover:border-[var(--theme-primary)] transition-all">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold uppercase">{project.name}</h3>
              <BrutalBadge variant="info">{project.status}</BrutalBadge>
            </div>
            <p className="font-mono text-xs text-[var(--theme-foreground)]/70 mb-3 h-10 line-clamp-2">
              {project.description || 'No description available'}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border)]">
              <span className="font-mono text-[10px] opacity-50">ID: {project._id.substring(0, 8)}</span>
              <BrutalButton
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/workspace/${workspaceId}/project/${project._id}`)}
              >
                View Project
              </BrutalButton>
            </div>
          </BrutalCard>
        ))}

        {/* New Project Placeholder */}
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30 hover:bg-[var(--theme-background-secondary)] hover:border-[var(--theme-primary)] transition-all p-6 flex flex-col items-center justify-center cursor-pointer min-h-[200px] group"
        >
          <div className="w-8 h-8 border-2 border-[var(--theme-border)] group-hover:border-[var(--theme-primary)] rounded-full flex items-center justify-center mb-3 transition-colors">
            <HiOutlinePlus className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:text-[var(--theme-primary)] transition-all" />
          </div>
          <span className="font-mono text-xs font-bold opacity-50 group-hover:opacity-100 group-hover:text-[var(--theme-primary)] transition-all">Create New Project</span>
        </div>
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
    <div className="p-4 md:p-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black uppercase tracking-tighter">Team Members</h2>
        <BrutalButton variant="secondary">Invite Member</BrutalButton>
      </div>

      <BrutalCard variant="elevated" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
                <th className="p-4 font-mono text-xs font-bold uppercase opacity-70">Member</th>
                <th className="p-4 font-mono text-xs font-bold uppercase opacity-70">Role</th>
                <th className="p-4 font-mono text-xs font-bold uppercase opacity-70">Status</th>
                <th className="p-4 font-mono text-xs font-bold uppercase opacity-70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member: any) => (
                <tr key={member.userId} className="border-b border-[var(--theme-border)] hover:bg-[var(--theme-background-secondary)]/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--theme-primary)] flex items-center justify-center font-bold text-black text-xs border border-black">
                        {(member.user?.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{member.user?.name || 'Unknown User'}</div>
                        <div className="font-mono text-[10px] opacity-50">{member.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <BrutalBadge variant={member.role === 'admin' ? 'danger' : 'info'}>
                      {member.role.toUpperCase()}
                    </BrutalBadge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-mono text-xs text-[var(--theme-success)]">
                      <span className="w-2 h-2 bg-[var(--theme-success)] rounded-full" />
                      Active
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-xs font-mono hover:text-[var(--theme-primary)] hover:underline">Edit</button>
                      <button className="text-xs font-mono text-[var(--theme-error)] hover:underline">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BrutalCard>
    </div>
  )
}

// Settings Tab Component
function SettingsTab({ workspace }: any) {
  return (
    <div className="p-4 md:p-5 max-w-4xl mx-auto">
      <h2 className="text-xl font-black uppercase tracking-tighter mb-4">Workspace Settings</h2>

      <BrutalCard variant="bordered" className="mb-4">
        <h3 className="font-bold uppercase tracking-wider mb-3 border-b border-[var(--theme-border)] pb-2">General Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block font-mono text-xs font-bold mb-2 uppercase">Workspace Name</label>
            <input
              type="text"
              defaultValue={workspace.name}
              className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block font-mono text-xs font-bold mb-2 uppercase">Description</label>
            <textarea
              defaultValue={workspace.description}
              className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm h-32 focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex justify-end">
            <BrutalButton variant="primary">Save Changes</BrutalButton>
          </div>
        </div>
      </BrutalCard>
    </div>
  )
}

// Other tab components with placeholder content
function AnalyticsTab({ workspaceId }: any) {
  return (
    <div className="p-4 md:p-5 flex flex-col items-center justify-center min-h-[50vh]">
      <BrutalCard variant="glitch" className="p-8 text-center max-w-lg border-dashed">
        <HiOutlineChartBar className="w-24 h-24 mx-auto mb-3 text-[var(--theme-foreground)]/20" />
        <h2 className="text-lg font-bold uppercase mb-2">Analytics Unavailable</h2>
        <p className="font-mono text-sm text-[var(--theme-foreground)]/60">
          Analytics features are coming soon. Check back later for system updates.
        </p>
      </BrutalCard>
    </div>
  )
}


function BillingTab({ workspace }: any) {
  return (
    <div className="p-4 md:p-5 flex flex-col items-center justify-center min-h-[50vh]">
      <BrutalCard variant="glitch" className="p-8 text-center max-w-lg border-dashed">
        <HiOutlineCreditCard className="w-24 h-24 mx-auto mb-3 text-[var(--theme-foreground)]/20" />
        <h2 className="text-lg font-bold uppercase mb-2">Billing & Plans</h2>
        <p className="font-mono text-sm text-[var(--theme-foreground)]/60">
          Billing management is currently unavailable.
        </p>
      </BrutalCard>
    </div>
  )
}

function DangerTab({ workspace }: any) {
  return (
    <div className="p-4 md:p-5 max-w-4xl mx-auto">
      <h2 className="text-xl font-black uppercase tracking-tighter mb-4 text-[var(--theme-error)]">Danger Zone</h2>

      <BrutalCard variant="bordered" className="border-[var(--theme-error)] bg-[var(--theme-error)]/5">
        <div className="flex items-start gap-3">
          <div className="p-3 border-2 border-[var(--theme-error)] bg-[var(--theme-background)]">
            <HiOutlineExclamation className="w-6 h-6 text-[var(--theme-error)]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold uppercase tracking-wider mb-2 text-[var(--theme-error)]">Delete Workspace</h3>
            <p className="font-mono text-sm text-[var(--theme-foreground)]/70 mb-3">
              Permanently delete this workspace and all associated data. This action cannot be undone.
            </p>
            <BrutalButton variant="danger">
              Delete Workspace
            </BrutalButton>
          </div>
        </div>
      </BrutalCard>
    </div>
  )
}