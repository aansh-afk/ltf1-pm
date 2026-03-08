import { useState } from 'react'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
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
  HiOutlinePlus,
  HiOutlineChatAlt2
} from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import { WorkspaceIntegrationsTab } from '@/components/features/github/WorkspaceIntegrationsTab'
import CommunicationsTab from '@/components/features/communications/CommunicationsTab'
import WorkspaceAnalytics from '@/components/features/analytics/WorkspaceAnalytics'
import clsx from 'clsx'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalModal from '@/components/ui/BrutalModal'
import { m } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface WorkspaceTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
}

export default function WorkspaceManagementPage() {
  const { workspaceId } = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  const workspace = useQuery(
    api.workspaces.queries.getWorkspaceById,
    workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : 'skip'
  )

  const members = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : 'skip'
  )

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : 'skip'
  )

  if (workspace === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (workspace === null) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-error)] p-5 text-center max-w-md">
          <h1 className="text-base font-bold uppercase mb-2 text-[var(--theme-error)]">Workspace Not Found</h1>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
            The requested workspace does not exist or you do not have permission to view it.
          </p>
        </div>
      </div>
    )
  }

  const tabs: WorkspaceTab[] = [
    { id: 'overview', label: 'Overview', icon: HiOutlineHome },
    { id: 'projects', label: 'Projects', icon: HiOutlineFolder, count: projects?.length },
    { id: 'members', label: 'Members', icon: HiOutlineUsers, count: members?.length },
    { id: 'analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { id: 'communications', label: 'Comms', icon: HiOutlineChatAlt2 },
    { id: 'integrations', label: 'Integrations', icon: HiOutlineLink },
    { id: 'settings', label: 'Settings', icon: HiOutlineCog },
    { id: 'billing', label: 'Billing', icon: HiOutlineCreditCard },
    { id: 'danger', label: 'Danger Zone', icon: HiOutlineExclamation },
  ]

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-56 lg:w-60 border-r-2 border-[var(--theme-border)] flex flex-col bg-[var(--theme-background)]">
        {/* Workspace Header */}
        <div className="p-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-6 h-6 bg-[var(--theme-primary)] flex items-center justify-center font-bold text-black text-[10px] font-mono">
              {workspace.name.substring(0, 2).toUpperCase()}
            </div>
            <h1 className="font-bold uppercase tracking-wider text-sm text-[var(--theme-foreground)] truncate">{workspace.name}</h1>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
            <span className="w-1.5 h-1.5 bg-[var(--theme-success)]" />
            Active
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono transition-colors relative',
                  isActive
                    ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-foreground)]'
                    : 'text-[var(--theme-foreground-tertiary)] hover:bg-[var(--theme-hover)] hover:text-[var(--theme-foreground-secondary)]'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--theme-primary)]" />
                )}
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </div>
                {tab.count !== undefined && (
                  <span className={clsx(
                    "px-1.5 py-0.5 text-[10px] font-mono border",
                    isActive
                      ? "border-[var(--theme-primary)]/40 text-[var(--theme-primary)]"
                      : "border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-3 border-t border-[var(--theme-border)] font-mono text-[10px] text-[var(--theme-foreground-tertiary)]/50 text-center truncate">
          {workspace._id}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Grid Background Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <m.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative z-10"
        >
          {activeTab === 'overview' && <OverviewTab workspace={workspace} projects={projects} members={members} workspaceId={workspaceId} setActiveTab={setActiveTab} />}
          {activeTab === 'projects' && <ProjectsTab workspaceId={workspaceId!} projects={projects} />}
          {activeTab === 'members' && <MembersTab workspaceId={workspaceId!} members={members} workspace={workspace} />}
          {activeTab === 'settings' && <SettingsTab workspace={workspace} />}
          {activeTab === 'analytics' && <WorkspaceAnalytics workspaceId={workspaceId!} />}
          {activeTab === 'communications' && <CommunicationsTab workspace={workspace} workspaceId={workspaceId!} />}
          {activeTab === 'integrations' && <WorkspaceIntegrationsTab workspace={workspace} />}
          {activeTab === 'billing' && <BillingTab workspace={workspace} />}
          {activeTab === 'danger' && <DangerTab workspace={workspace} />}
        </m.div>
      </main>
    </div>
  )
}

// Type definitions for workspace management
type WorkspaceResult = Doc<"workspaces"> & {
  currentUserRole?: string
  members: MemberWithUser[]
}

type MemberWithUser = Doc<"workspaceMembers"> & {
  user: Doc<"users"> | null
}

type ProjectResult = Doc<"projects">

interface OverviewTabProps {
  workspace: WorkspaceResult
  projects: ProjectResult[] | undefined
  members: MemberWithUser[] | undefined
  workspaceId: string | undefined
  setActiveTab: (tab: string) => void
}

// Overview Tab Component
function OverviewTab({ workspace, projects, members, workspaceId, setActiveTab }: OverviewTabProps) {
  const stats = [
    { icon: HiOutlineFolder, label: 'Active Projects', value: projects?.length || 0, color: 'var(--theme-primary)', width: 'w-3/4' },
    { icon: HiOutlineUsers, label: 'Members', value: members?.length || 0, color: 'var(--theme-info)', width: 'w-1/2' },
    { icon: HiOutlinePlay, label: 'Sprint Velocity', value: '100%', color: 'var(--theme-success)', width: 'w-full' },
    { icon: HiOutlineClock, label: 'Pending Tasks', value: '42', color: 'var(--theme-warning)', width: 'w-1/4' },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] inline-block mb-1">
            Overview
          </span>
          <h2 className="text-lg font-bold text-[var(--theme-foreground)] flex items-center gap-2">
            <HiOutlineViewGrid className="w-4 h-4 text-[var(--theme-primary)]" />
            Workspace Overview
          </h2>
        </div>
        <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
          Last Updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-4 group hover:border-[var(--theme-primary)] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--theme-foreground)]">{stat.value}</div>
              <div className="w-full h-0.5 bg-[var(--theme-border)] mt-2 overflow-hidden">
                <div className={clsx("h-full", stat.width)} style={{ backgroundColor: stat.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Activity + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Activity Log */}
        <div className="lg:col-span-2 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--theme-border)]">
            <h3 className="text-sm font-bold text-[var(--theme-foreground)] flex items-center gap-2">
              <HiOutlineTerminal className="w-4 h-4 text-[var(--theme-primary)]" />
              Activity Log
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-[var(--theme-success)]/10 border border-[var(--theme-success)]/30 text-[var(--theme-success)]">
              Live
            </span>
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-3 px-3 py-2 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 hover:bg-[var(--theme-background-secondary)] transition-colors font-mono text-xs">
                <span className="text-[10px] text-[var(--theme-foreground-tertiary)] w-10 shrink-0">0{item}:00</span>
                <div className="flex-1">
                  <span className="text-[var(--theme-primary)] font-semibold">User_{item}</span>
                  <span className="text-[var(--theme-foreground-secondary)]"> updated </span>
                  <span className="text-[var(--theme-warning)]">task-{item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* System Status */}
          <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-4">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-3">System Status</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--theme-foreground-secondary)]">API Gateway</span>
                <span className="text-[var(--theme-success)]">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--theme-foreground-secondary)]">Database</span>
                <span className="text-[var(--theme-success)]">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--theme-foreground-secondary)]">Storage</span>
                <span className="text-[var(--theme-warning)]">Degraded</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-primary)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineLightningBolt className="w-4 h-4 text-[var(--theme-primary)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)]">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Project', action: () => setActiveTab('projects') },
                { label: 'Invite User', action: () => setActiveTab('members') },
                { label: 'View Logs', action: () => setActiveTab('analytics') },
                { label: 'Settings', action: () => setActiveTab('settings') },
              ].map((item) => (
                <button key={item.label} onClick={item.action} className="p-2 border border-[var(--theme-border)] hover:border-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/5 text-xs font-mono text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-foreground)] text-left transition-colors">
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Projects Tab Component
interface ProjectsTabProps {
  workspaceId: string
  projects: ProjectResult[] | undefined
}

function ProjectsTab({ workspaceId, projects }: ProjectsTabProps) {
  const navigate = useNavigate()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] inline-block mb-1">
            Projects
          </span>
          <h2 className="text-lg font-bold text-[var(--theme-foreground)]">Projects</h2>
        </div>
        <BrutalButton
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
          size="sm"
          className="flex items-center gap-1.5"
        >
          <HiOutlinePlus className="w-3.5 h-3.5" /> New Project
        </BrutalButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects?.map((project) => (
          <div key={project._id} className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-4 group hover:border-[var(--theme-primary)] transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-bold text-[var(--theme-foreground)] uppercase">{project.name}</h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border border-[var(--theme-primary)]/30 text-[var(--theme-primary)] bg-[var(--theme-primary)]/10">
                {project.status}
              </span>
            </div>
            <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-3 h-8 line-clamp-2">
              {project.description || 'No description available'}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-[var(--theme-border)]">
              <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]/60">ID: {project._id.substring(0, 8)}</span>
              <BrutalButton
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/workspace/${workspaceId}/project/${project._id}`)}
              >
                View &rarr;
              </BrutalButton>
            </div>
          </div>
        ))}

        {/* New Project Placeholder */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 hover:bg-[var(--theme-background-secondary)] hover:border-[var(--theme-primary)] transition-all p-4 flex flex-col items-center justify-center cursor-pointer min-h-[140px] group"
        >
          <div className="w-8 h-8 border-2 border-[var(--theme-border)] group-hover:border-[var(--theme-primary)] flex items-center justify-center mb-2 transition-colors">
            <HiOutlinePlus className="w-4 h-4 text-[var(--theme-foreground-tertiary)] group-hover:text-[var(--theme-primary)] transition-colors" />
          </div>
          <span className="font-mono text-[10px] font-semibold text-[var(--theme-foreground-tertiary)] group-hover:text-[var(--theme-primary)] uppercase tracking-wider transition-colors">Create New Project</span>
        </button>
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
interface MembersTabProps {
  workspaceId: string
  members: MemberWithUser[] | undefined
  workspace: WorkspaceResult
}

function MembersTab({ workspaceId, members, workspace }: MembersTabProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const inviteToWorkspace = useMutation(api.workspaces.mutations.inviteToWorkspace)
  const updateMemberRole = useMutation(api.workspaces.mutations.updateMemberRole)
  const removeMember = useMutation(api.workspaces.mutations.removeMember)
  const pendingInvitations = useQuery(
    api.workspaces.queries.getPendingInvitations,
    workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : 'skip'
  )

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    try {
      const result = await inviteToWorkspace({
        workspaceId: workspaceId as Id<"workspaces">,
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      if (result.status === 'added') {
        toast.success(`${result.email} has been added to the workspace`)
      } else {
        toast.success(`Invitation sent to ${result.email}. They will be added when they sign up.`)
      }
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteModal(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to invite member'
      toast.error(message)
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'member' | 'admin' | 'viewer') => {
    try {
      await updateMemberRole({
        workspaceId: workspaceId as Id<"workspaces">,
        userId: userId as Id<"users">,
        role: newRole,
      })
      toast.success('Member role updated')
      setEditingMemberId(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update role'
      toast.error(message)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember({
        workspaceId: workspaceId as Id<"workspaces">,
        userId: userId as Id<"users">,
      })
      toast.success('Member removed from workspace')
      setConfirmRemoveId(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove member'
      toast.error(message)
    }
  }

  const isLastMember = members?.length === 1

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] inline-block mb-1">
            Team
          </span>
          <h2 className="text-lg font-bold text-[var(--theme-foreground)]">Members</h2>
        </div>
        <BrutalButton variant="secondary" size="sm" onClick={() => setShowInviteModal(true)}>Invite Member</BrutalButton>
      </div>

      <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
                <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">Member</th>
                <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">Role</th>
                <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member) => (
                <tr key={member.userId} className="border-b border-[var(--theme-border)]/50 hover:bg-[var(--theme-background-secondary)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[var(--theme-primary)] flex items-center justify-center font-bold text-black text-[10px] font-mono">
                        {(member.user?.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[var(--theme-foreground)]">{member.user?.name || 'Unknown User'}</div>
                        <div className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">{member.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      "px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border",
                      member.role === 'admin'
                        ? "border-[var(--theme-error)]/30 text-[var(--theme-error)] bg-[var(--theme-error)]/10"
                        : "border-[var(--theme-primary)]/30 text-[var(--theme-primary)] bg-[var(--theme-primary)]/10"
                    )}>
                      {member.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--theme-success)]">
                      <span className="w-1.5 h-1.5 bg-[var(--theme-success)]" />
                      Active
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3 relative">
                      {editingMemberId === member.userId ? (
                        <div className="flex items-center gap-1">
                          {(['admin', 'member', 'viewer'] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => handleRoleChange(member.userId, r)}
                              className={clsx(
                                "px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border transition-colors",
                                member.role === r
                                  ? "border-[var(--theme-primary)] text-[var(--theme-primary)] bg-[var(--theme-primary)]/10"
                                  : "border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)]"
                              )}
                            >
                              {r}
                            </button>
                          ))}
                          <button
                            onClick={() => setEditingMemberId(null)}
                            className="px-1 text-[10px] font-mono text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => member.role !== 'owner' && setEditingMemberId(member.userId)}
                          className={clsx(
                            "text-[10px] font-mono transition-colors",
                            member.role === 'owner'
                              ? "text-[var(--theme-foreground-tertiary)] cursor-not-allowed"
                              : "text-[var(--theme-foreground-secondary)] hover:text-[var(--theme-primary)]"
                          )}
                          disabled={member.role === 'owner'}
                          title={member.role === 'owner' ? 'Cannot edit owner role' : 'Change role'}
                        >
                          Edit
                        </button>
                      )}
                      {confirmRemoveId === member.userId ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="px-2 py-0.5 text-[10px] font-mono font-bold border-2 border-[var(--theme-error)] text-[var(--theme-error)] bg-[var(--theme-error)]/10 hover:bg-[var(--theme-error)]/20 transition-colors"
                          >
                            CONFIRM
                          </button>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            className="px-1 text-[10px] font-mono text-[var(--theme-foreground-tertiary)] hover:text-[var(--theme-foreground)] transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => !isLastMember && member.role !== 'owner' && setConfirmRemoveId(member.userId)}
                          className={clsx(
                            "text-[10px] font-mono transition-colors",
                            isLastMember || member.role === 'owner'
                              ? "text-[var(--theme-foreground-tertiary)] cursor-not-allowed"
                              : "text-[var(--theme-error)] hover:text-[var(--theme-error)]/80"
                          )}
                          disabled={isLastMember || member.role === 'owner'}
                          title={
                            member.role === 'owner' ? 'Cannot remove workspace owner'
                              : isLastMember ? 'Cannot remove the last member'
                              : 'Remove from workspace'
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <div className="mt-4">
          <div className="mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">
              Pending Invitations
            </span>
          </div>
          <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
                    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">Email</th>
                    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">Role</th>
                    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">Invited By</th>
                    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.map((inv) => (
                    <tr key={inv._id} className="border-b border-[var(--theme-border)]/50 hover:bg-[var(--theme-background-secondary)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[var(--theme-warning)]/20 border border-[var(--theme-warning)]/30 flex items-center justify-center font-bold text-[var(--theme-warning)] text-[10px] font-mono">
                            @
                          </div>
                          <span className="font-mono text-xs text-[var(--theme-foreground)]">{inv.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border border-[var(--theme-warning)]/30 text-[var(--theme-warning)] bg-[var(--theme-warning)]/10">
                          {inv.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--theme-foreground-secondary)]">{inv.invitedByName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--theme-warning)]">
                          <span className="w-1.5 h-1.5 bg-[var(--theme-warning)] animate-pulse" />
                          Pending Sign-up
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <BrutalModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="WORKSPACE INVITE"
        size="lg"
      >
        <form onSubmit={handleInvite} className="space-y-[12px]">
          {/* Context Header */}
          <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-[10px]">
            <h3 className="font-mono text-sm font-bold text-[var(--theme-foreground)] mb-[4px]">INVITING TO: {workspace?.name || 'WORKSPACE'}</h3>
            <p className="font-mono text-xs text-[var(--theme-foreground)]/60">
              Enter an email address to invite someone to this workspace.
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-[var(--theme-primary)]/10 border-2 border-[var(--theme-primary)] p-[10px]">
            <p className="font-mono text-xs text-[var(--theme-primary)]">
              <span className="font-bold">NOTE:</span> If the user has an account, they'll be added immediately. Otherwise, they'll be added automatically when they sign up.
            </p>
          </div>

          {/* Email Section */}
          <div className="space-y-[8px]">
            <label htmlFor="ws-invite-email" className="block font-mono text-xs font-bold text-[var(--theme-foreground)]">EMAIL ADDRESS</label>
            <input
              id="ws-invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm text-[var(--theme-primary)] font-bold focus:border-[var(--theme-primary)] focus:outline-none placeholder:text-[var(--theme-foreground-tertiary)] placeholder:font-normal"
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Role Section */}
          <div className="space-y-[8px]">
            <h4 className="font-mono text-xs font-bold text-[var(--theme-foreground)]">ASSIGN ROLE</h4>
            <div className="grid grid-cols-3 gap-[4px]">
              {([
                { value: 'member' as const, label: 'MEMBER', desc: 'Standard access' },
                { value: 'admin' as const, label: 'ADMIN', desc: 'Full control' },
                { value: 'viewer' as const, label: 'VIEWER', desc: 'Read-only' },
              ]).map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setInviteRole(role.value)}
                  className={clsx(
                    "p-[10px] border-2 font-mono text-left transition-colors",
                    inviteRole === role.value
                      ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10'
                      : 'border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:border-[var(--theme-primary)]/50'
                  )}
                >
                  <span className={clsx(
                    "block text-[10px] font-bold uppercase tracking-wider mb-[2px]",
                    inviteRole === role.value ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-foreground)]'
                  )}>
                    {role.label}
                  </span>
                  <span className="block text-[10px] text-[var(--theme-foreground-tertiary)]">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Info */}
          <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-[10px]">
            <div className="flex items-center gap-[4px] mb-[6px]">
              <HiOutlineCog className="w-4 h-4 text-[var(--theme-primary)]" />
              <h4 className="font-mono text-xs font-bold text-[var(--theme-foreground)]">ROLE PERMISSIONS</h4>
            </div>
            <div className="grid grid-cols-2 gap-[8px] font-mono text-[10px]">
              <div>
                <span className="text-[var(--theme-foreground-tertiary)]">Can Edit:</span>{' '}
                <span className={inviteRole === 'viewer' ? 'text-[var(--theme-error)]' : 'text-[var(--theme-success)]'}>
                  {inviteRole === 'viewer' ? 'NO' : 'YES'}
                </span>
              </div>
              <div>
                <span className="text-[var(--theme-foreground-tertiary)]">Can Invite:</span>{' '}
                <span className={inviteRole === 'admin' ? 'text-[var(--theme-success)]' : 'text-[var(--theme-error)]'}>
                  {inviteRole === 'admin' ? 'YES' : 'NO'}
                </span>
              </div>
              <div>
                <span className="text-[var(--theme-foreground-tertiary)]">Can Manage:</span>{' '}
                <span className={inviteRole === 'admin' ? 'text-[var(--theme-success)]' : 'text-[var(--theme-error)]'}>
                  {inviteRole === 'admin' ? 'YES' : 'NO'}
                </span>
              </div>
              <div>
                <span className="text-[var(--theme-foreground-tertiary)]">Can View:</span>{' '}
                <span className="text-[var(--theme-success)]">YES</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-[8px] pt-[8px] border-t-2 border-[var(--theme-border)]">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="flex-1 px-[10px] py-[10px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] font-mono text-xs font-bold uppercase tracking-wider hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isInviting || !inviteEmail.trim()}
              className="flex-1 px-[10px] py-[10px] bg-[var(--theme-primary)] border-2 border-[var(--theme-primary-active)] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[var(--theme-primary-active)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInviting ? 'INVITING...' : 'SEND INVITE'}
            </button>
          </div>
        </form>
      </BrutalModal>
    </div>
  )
}

// Settings Tab Component
function SettingsTab({ workspace }: { workspace: WorkspaceResult }) {
  return (
    <div className="p-4 max-w-3xl">
      <div className="mb-4">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] inline-block mb-1">
          Configuration
        </span>
        <h2 className="text-lg font-bold text-[var(--theme-foreground)]">Workspace Settings</h2>
      </div>

      <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] p-4 mb-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-foreground-tertiary)] mb-3 pb-2 border-b border-[var(--theme-border)]">General Settings</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="ws-mgmt-name" className="block font-mono text-[10px] font-semibold mb-1.5 uppercase tracking-wider text-[var(--theme-foreground-secondary)]">Workspace Name</label>
            <input
              id="ws-mgmt-name"
              type="text"
              defaultValue={workspace.name}
              className="w-full px-3 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-sm text-[var(--theme-foreground)] placeholder-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="ws-mgmt-description" className="block font-mono text-[10px] font-semibold mb-1.5 uppercase tracking-wider text-[var(--theme-foreground-secondary)]">Description</label>
            <textarea
              id="ws-mgmt-description"
              defaultValue={workspace.description}
              className="w-full px-3 py-2 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-sm text-[var(--theme-foreground)] h-24 placeholder-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end">
            <BrutalButton variant="primary" size="sm">Save Changes</BrutalButton>
          </div>
        </div>
      </div>
    </div>
  )
}


function BillingTab({ workspace }: { workspace: WorkspaceResult }) {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center max-w-md">
        <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground-tertiary)]">
          <HiOutlineCreditCard className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-[var(--theme-foreground)] mb-1">Billing & Plans</h3>
        <p className="text-xs text-[var(--theme-foreground-tertiary)] max-w-sm mx-auto">
          Billing management is currently unavailable.
        </p>
      </div>
    </div>
  )
}

function DangerTab({ workspace }: { workspace: WorkspaceResult }) {
  return (
    <ErrorBoundary>
    <div className="p-4 max-w-3xl">
      <div className="mb-4">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--theme-error)] inline-block mb-1">
          Caution
        </span>
        <h2 className="text-lg font-bold text-[var(--theme-error)]">Danger Zone</h2>
      </div>

      <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-error)] p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 border-2 border-[var(--theme-error)] flex items-center justify-center shrink-0">
            <HiOutlineExclamation className="w-4 h-4 text-[var(--theme-error)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-[var(--theme-error)]">Delete Workspace</h3>
            <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-3">
              Permanently delete this workspace and all associated data. This action cannot be undone.
            </p>
            <BrutalButton variant="danger" size="sm">
              Delete Workspace
            </BrutalButton>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}
