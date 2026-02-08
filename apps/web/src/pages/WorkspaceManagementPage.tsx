import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
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
  HiOutlinePlus,
  HiOutlineChatAlt2
} from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import CreateProjectModal from '@/components/features/project/CreateProjectModal'
import { WorkspaceIntegrationsTab } from '@/components/features/github/WorkspaceIntegrationsTab'
import CommunicationsTab from '@/components/features/communications/CommunicationsTab'
import clsx from 'clsx'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalModal from '@/components/ui/BrutalModal'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface WorkspaceTab {
  id: string
  label: string
  icon: any
  count?: number
}

export default function WorkspaceManagementPage() {
  const { workspaceId } = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  const workspace = useQuery(
    api.workspaces.queries.getWorkspaceById,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  const members = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  const projects = useQuery(
    api.projects.queries.getWorkspaceProjects,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
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
        <div className="bg-[#111111] border-2 border-[#EF4444] p-5 text-center max-w-md">
          <h1 className="text-base font-bold uppercase mb-2 text-[#EF4444]">Workspace Not Found</h1>
          <p className="font-mono text-xs text-[#6B7280]">
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab workspace={workspace} projects={projects} members={members} />
      case 'projects':
        return <ProjectsTab workspaceId={workspaceId!} projects={projects} />
      case 'members':
        return <MembersTab workspaceId={workspaceId!} members={members} workspace={workspace} />
      case 'settings':
        return <SettingsTab workspace={workspace} />
      case 'analytics':
        return <AnalyticsTab workspaceId={workspaceId!} />
      case 'communications':
        return <CommunicationsTab workspace={workspace} workspaceId={workspaceId!} />
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
    <div className="h-full flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-56 lg:w-60 border-r-2 border-[#2E2E35] flex flex-col bg-[#050505]">
        {/* Workspace Header */}
        <div className="p-4 border-b border-[#1F1F23]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-6 h-6 bg-[#6366F1] flex items-center justify-center font-bold text-black text-[10px] font-mono">
              {workspace.name.substring(0, 2).toUpperCase()}
            </div>
            <h1 className="font-bold uppercase tracking-wider text-sm text-[#F9FAFB] truncate">{workspace.name}</h1>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#6B7280]">
            <span className="w-1.5 h-1.5 bg-[#22C55E]" />
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
                    ? 'bg-[#6366F1]/10 text-[#F9FAFB]'
                    : 'text-[#6B7280] hover:bg-[#111111] hover:text-[#9CA3AF]'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#6366F1]" />
                )}
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </div>
                {tab.count !== undefined && (
                  <span className={clsx(
                    "px-1.5 py-0.5 text-[10px] font-mono border",
                    isActive
                      ? "border-[#6366F1]/40 text-[#6366F1]"
                      : "border-[#2E2E35] text-[#6B7280]"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-3 border-t border-[#1F1F23] font-mono text-[10px] text-[#6B7280]/50 text-center truncate">
          {workspace._id}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Grid Background Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative z-10"
        >
          {renderTabContent()}
        </motion.div>
      </main>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ workspace, projects, members }: any) {
  const stats = [
    { icon: HiOutlineFolder, label: 'Active Projects', value: projects?.length || 0, color: '#6366F1', width: 'w-3/4' },
    { icon: HiOutlineUsers, label: 'Members', value: members?.length || 0, color: '#06B6D4', width: 'w-1/2' },
    { icon: HiOutlinePlay, label: 'Sprint Velocity', value: '100%', color: '#22C55E', width: 'w-full' },
    { icon: HiOutlineClock, label: 'Pending Tasks', value: '42', color: '#F59E0B', width: 'w-1/4' },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] inline-block mb-1">
            Overview
          </span>
          <h2 className="text-lg font-bold text-[#F9FAFB] flex items-center gap-2">
            <HiOutlineViewGrid className="w-4 h-4 text-[#6366F1]" />
            Workspace Overview
          </h2>
        </div>
        <span className="font-mono text-[10px] text-[#6B7280]">
          Last Updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-[#111111] border-2 border-[#2E2E35] p-4 group hover:border-[#6366F1] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280]">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-[#F9FAFB]">{stat.value}</div>
              <div className="w-full h-0.5 bg-[#2E2E35] mt-2 overflow-hidden">
                <div className={clsx("h-full", stat.width)} style={{ backgroundColor: stat.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Activity + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Activity Log */}
        <div className="lg:col-span-2 bg-[#111111] border-2 border-[#2E2E35] p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1F1F23]">
            <h3 className="text-sm font-bold text-[#F9FAFB] flex items-center gap-2">
              <HiOutlineTerminal className="w-4 h-4 text-[#6366F1]" />
              Activity Log
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]">
              Live
            </span>
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-3 px-3 py-2 border border-[#1F1F23] bg-[#0A0A0A]/50 hover:bg-[#0A0A0A] transition-colors font-mono text-xs">
                <span className="text-[10px] text-[#6B7280] w-10 shrink-0">0{item}:00</span>
                <div className="flex-1">
                  <span className="text-[#6366F1] font-semibold">User_{item}</span>
                  <span className="text-[#9CA3AF]"> updated </span>
                  <span className="text-[#F59E0B]">task-{item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* System Status */}
          <div className="bg-[#111111] border-2 border-[#2E2E35] p-4">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] mb-3">System Status</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#9CA3AF]">API Gateway</span>
                <span className="text-[#22C55E]">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9CA3AF]">Database</span>
                <span className="text-[#22C55E]">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9CA3AF]">Storage</span>
                <span className="text-[#F59E0B]">Degraded</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#111111] border-2 border-[#6366F1] p-4">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineLightningBolt className="w-4 h-4 text-[#6366F1]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['New Project', 'Invite User', 'View Logs', 'Deploy'].map((action) => (
                <button key={action} className="p-2 border border-[#2E2E35] hover:border-[#6366F1] hover:bg-[#6366F1]/5 text-xs font-mono text-[#9CA3AF] hover:text-[#F9FAFB] text-left transition-colors">
                  {action}
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
function ProjectsTab({ workspaceId, projects }: any) {
  const navigate = useNavigate()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] inline-block mb-1">
            Projects
          </span>
          <h2 className="text-lg font-bold text-[#F9FAFB]">Projects</h2>
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
        {projects?.map((project: any) => (
          <div key={project._id} className="bg-[#111111] border-2 border-[#2E2E35] p-4 group hover:border-[#6366F1] transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-bold text-[#F9FAFB] uppercase">{project.name}</h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border border-[#6366F1]/30 text-[#6366F1] bg-[#6366F1]/10">
                {project.status}
              </span>
            </div>
            <p className="font-mono text-xs text-[#6B7280] mb-3 h-8 line-clamp-2">
              {project.description || 'No description available'}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-[#1F1F23]">
              <span className="font-mono text-[10px] text-[#6B7280]/60">ID: {project._id.substring(0, 8)}</span>
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
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="border-2 border-dashed border-[#2E2E35] bg-[#0A0A0A]/50 hover:bg-[#0A0A0A] hover:border-[#6366F1] transition-all p-4 flex flex-col items-center justify-center cursor-pointer min-h-[140px] group"
        >
          <div className="w-8 h-8 border-2 border-[#2E2E35] group-hover:border-[#6366F1] flex items-center justify-center mb-2 transition-colors">
            <HiOutlinePlus className="w-4 h-4 text-[#6B7280] group-hover:text-[#6366F1] transition-colors" />
          </div>
          <span className="font-mono text-[10px] font-semibold text-[#6B7280] group-hover:text-[#6366F1] uppercase tracking-wider transition-colors">Create New Project</span>
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
function MembersTab({ workspaceId, members, workspace }: any) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member')
  const [isInviting, setIsInviting] = useState(false)

  const inviteToWorkspace = useMutation(api.workspaces.mutations.inviteToWorkspace)
  const pendingInvitations = useQuery(
    api.workspaces.queries.getPendingInvitations,
    workspaceId ? { workspaceId: workspaceId as any } : 'skip'
  )

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    try {
      const result = await inviteToWorkspace({
        workspaceId: workspaceId as any,
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite member')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] inline-block mb-1">
            Team
          </span>
          <h2 className="text-lg font-bold text-[#F9FAFB]">Members</h2>
        </div>
        <BrutalButton variant="secondary" size="sm" onClick={() => setShowInviteModal(true)}>Invite Member</BrutalButton>
      </div>

      <div className="bg-[#111111] border-2 border-[#2E2E35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#2E2E35] bg-[#0A0A0A]">
                <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Member</th>
                <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Role</th>
                <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member: any) => (
                <tr key={member.userId} className="border-b border-[#2E2E35]/50 hover:bg-[#0A0A0A]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#6366F1] flex items-center justify-center font-bold text-black text-[10px] font-mono">
                        {(member.user?.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[#F9FAFB]">{member.user?.name || 'Unknown User'}</div>
                        <div className="font-mono text-[10px] text-[#6B7280]">{member.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      "px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border",
                      member.role === 'admin'
                        ? "border-[#EF4444]/30 text-[#EF4444] bg-[#EF4444]/10"
                        : "border-[#6366F1]/30 text-[#6366F1] bg-[#6366F1]/10"
                    )}>
                      {member.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#22C55E]">
                      <span className="w-1.5 h-1.5 bg-[#22C55E]" />
                      Active
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button className="text-[10px] font-mono text-[#9CA3AF] hover:text-[#6366F1] transition-colors">Edit</button>
                      <button className="text-[10px] font-mono text-[#EF4444] hover:text-[#EF4444]/80 transition-colors">Remove</button>
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
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280]">
              Pending Invitations
            </span>
          </div>
          <div className="bg-[#111111] border-2 border-[#2E2E35] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#2E2E35] bg-[#0A0A0A]">
                    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Email</th>
                    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Role</th>
                    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Invited By</th>
                    <th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.map((inv: any) => (
                    <tr key={inv._id} className="border-b border-[#2E2E35]/50 hover:bg-[#0A0A0A]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center font-bold text-[#F59E0B] text-[10px] font-mono">
                            @
                          </div>
                          <span className="font-mono text-xs text-[#F9FAFB]">{inv.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border border-[#F59E0B]/30 text-[#F59E0B] bg-[#F59E0B]/10">
                          {inv.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{inv.invitedByName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#F59E0B]">
                          <span className="w-1.5 h-1.5 bg-[#F59E0B] animate-pulse" />
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
          <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] p-[10px]">
            <h3 className="font-mono text-sm font-bold text-[#F9FAFB] mb-[4px]">INVITING TO: {workspace?.name || 'WORKSPACE'}</h3>
            <p className="font-mono text-xs text-[#F9FAFB]/60">
              Enter an email address to invite someone to this workspace.
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-[#6366F1]/10 border-2 border-[#6366F1] p-[10px]">
            <p className="font-mono text-xs text-[#6366F1]">
              <span className="font-bold">NOTE:</span> If the user has an account, they'll be added immediately. Otherwise, they'll be added automatically when they sign up.
            </p>
          </div>

          {/* Email Section */}
          <div className="space-y-[8px]">
            <h4 className="font-mono text-xs font-bold text-[#F9FAFB]">EMAIL ADDRESS</h4>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-[10px] py-[8px] bg-[#050505] border-2 border-[#2E2E35] font-mono text-sm text-[#6366F1] font-bold focus:border-[#6366F1] focus:outline-none placeholder:text-[#6B7280] placeholder:font-normal"
              placeholder="user@example.com"
              required
              autoFocus
            />
          </div>

          {/* Role Section */}
          <div className="space-y-[8px]">
            <h4 className="font-mono text-xs font-bold text-[#F9FAFB]">ASSIGN ROLE</h4>
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
                      ? 'border-[#6366F1] bg-[#6366F1]/10'
                      : 'border-[#2E2E35] bg-[#0A0A0A] hover:border-[#6366F1]/50'
                  )}
                >
                  <span className={clsx(
                    "block text-[10px] font-bold uppercase tracking-wider mb-[2px]",
                    inviteRole === role.value ? 'text-[#6366F1]' : 'text-[#F9FAFB]'
                  )}>
                    {role.label}
                  </span>
                  <span className="block text-[10px] text-[#6B7280]">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Info */}
          <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] p-[10px]">
            <div className="flex items-center gap-[4px] mb-[6px]">
              <HiOutlineCog className="w-4 h-4 text-[#6366F1]" />
              <h4 className="font-mono text-xs font-bold text-[#F9FAFB]">ROLE PERMISSIONS</h4>
            </div>
            <div className="grid grid-cols-2 gap-[8px] font-mono text-[10px]">
              <div>
                <span className="text-[#6B7280]">Can Edit:</span>{' '}
                <span className={inviteRole === 'viewer' ? 'text-[#EF4444]' : 'text-[#22C55E]'}>
                  {inviteRole === 'viewer' ? 'NO' : 'YES'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280]">Can Invite:</span>{' '}
                <span className={inviteRole === 'admin' ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                  {inviteRole === 'admin' ? 'YES' : 'NO'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280]">Can Manage:</span>{' '}
                <span className={inviteRole === 'admin' ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                  {inviteRole === 'admin' ? 'YES' : 'NO'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280]">Can View:</span>{' '}
                <span className="text-[#22C55E]">YES</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-[8px] pt-[8px] border-t-2 border-[#2E2E35]">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="flex-1 px-[10px] py-[10px] bg-[#0A0A0A] border-2 border-[#2E2E35] text-[#9CA3AF] font-mono text-xs font-bold uppercase tracking-wider hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isInviting || !inviteEmail.trim()}
              className="flex-1 px-[10px] py-[10px] bg-[#6366F1] border-2 border-[#4F46E5] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#4F46E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
function SettingsTab({ workspace }: any) {
  return (
    <div className="p-4 max-w-3xl">
      <div className="mb-4">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] inline-block mb-1">
          Configuration
        </span>
        <h2 className="text-lg font-bold text-[#F9FAFB]">Workspace Settings</h2>
      </div>

      <div className="bg-[#111111] border-2 border-[#2E2E35] p-4 mb-4">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#6B7280] mb-3 pb-2 border-b border-[#1F1F23]">General Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block font-mono text-[10px] font-semibold mb-1.5 uppercase tracking-wider text-[#9CA3AF]">Workspace Name</label>
            <input
              type="text"
              defaultValue={workspace.name}
              className="w-full px-3 py-2 bg-[#0A0A0A] border-2 border-[#2E2E35] font-mono text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] font-semibold mb-1.5 uppercase tracking-wider text-[#9CA3AF]">Description</label>
            <textarea
              defaultValue={workspace.description}
              className="w-full px-3 py-2 bg-[#0A0A0A] border-2 border-[#2E2E35] font-mono text-sm text-[#F9FAFB] h-24 placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none transition-colors resize-none"
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

// Placeholder tab components
function AnalyticsTab({ workspaceId }: any) {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="border-2 border-[#2E2E35] border-dashed p-8 text-center max-w-md">
        <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
          <HiOutlineChartBar className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">Analytics Unavailable</h3>
        <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
          Analytics features are coming soon. Check back later for system updates.
        </p>
      </div>
    </div>
  )
}

function BillingTab({ workspace }: any) {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="border-2 border-[#2E2E35] border-dashed p-8 text-center max-w-md">
        <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[#2E2E35] text-[#6B7280]">
          <HiOutlineCreditCard className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-[#F9FAFB] mb-1">Billing & Plans</h3>
        <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
          Billing management is currently unavailable.
        </p>
      </div>
    </div>
  )
}

function DangerTab({ workspace }: any) {
  return (
    <div className="p-4 max-w-3xl">
      <div className="mb-4">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#EF4444] inline-block mb-1">
          Caution
        </span>
        <h2 className="text-lg font-bold text-[#EF4444]">Danger Zone</h2>
      </div>

      <div className="bg-[#111111] border-2 border-[#EF4444] p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 border-2 border-[#EF4444] flex items-center justify-center shrink-0">
            <HiOutlineExclamation className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-[#EF4444]">Delete Workspace</h3>
            <p className="font-mono text-xs text-[#6B7280] mb-3">
              Permanently delete this workspace and all associated data. This action cannot be undone.
            </p>
            <BrutalButton variant="danger" size="sm">
              Delete Workspace
            </BrutalButton>
          </div>
        </div>
      </div>
    </div>
  )
}
