import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineUserAdd,
  HiOutlineTrash,
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineEye
} from 'react-icons/hi'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import BrutalModal from '../../ui/BrutalModal'

interface MemberManagementProps {
  workspace: any
  currentUserRole?: string
  canManageMembers: boolean
}

const roleConfig = {
  owner: { label: 'OWNER', color: 'bg-[var(--theme-accent)]', icon: HiOutlineShieldCheck },
  admin: { label: 'ADMIN', color: 'bg-[var(--theme-info)]', icon: HiOutlineShieldCheck },
  member: { label: 'MEMBER', color: 'bg-primary-brutalist', icon: HiOutlineUser },
  viewer: { label: 'VIEWER', color: 'bg-neutral-600', icon: HiOutlineEye }
}

export default function MemberManagement({ workspace, currentUserRole, canManageMembers }: MemberManagementProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const inviteToWorkspace = useMutation(api.workspaces.mutations.inviteToWorkspace)
  const updateMemberRole = useMutation(api.workspaces.mutations.updateMemberRole)
  const removeMember = useMutation(api.workspaces.mutations.removeMember)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required')
      return
    }

    setIsInviting(true)
    try {
      await inviteToWorkspace({
        workspaceId: workspace._id,
        email: inviteEmail.trim(),
        role: inviteRole
      })
      toast.success('Invitation sent successfully')
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite member')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (userId: any, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      await updateMemberRole({
        workspaceId: workspace._id,
        userId,
        role: newRole
      })
      toast.success('Role updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedMember) return

    try {
      await removeMember({
        workspaceId: workspace._id,
        userId: selectedMember.userId
      })
      toast.success('Member removed successfully')
      setSelectedMember(null)
      setShowRemoveConfirm(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member')
    }
  }

  return (
    <div className="space-y-24px">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-brutal-lg font-bold uppercase">WORKSPACE MEMBERS</h2>
          <p className="text-brutal-sm text-neutral-500">
            {workspace.members?.length || 0} MEMBERS
          </p>
        </div>

        {canManageMembers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="brutal-btn flex items-center gap-8px"
          >
            <HiOutlineUserAdd className="w-16px h-16px" />
            INVITE MEMBER
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
        <div className="grid grid-cols-12 gap-16px p-16px font-mono text-brutal-sm uppercase border-b-2 border-[var(--theme-border)]">
          <div className="col-span-5">MEMBER</div>
          <div className="col-span-3">ROLE</div>
          <div className="col-span-2">JOINED</div>
          <div className="col-span-2">ACTIONS</div>
        </div>

        {workspace.members?.map((member: any) => {
          const RoleIcon = roleConfig[member.role as keyof typeof roleConfig].icon
          const isCurrentUser = member.user?._id === workspace.currentUserId

          return (
            <div
              key={member._id}
              className="grid grid-cols-12 gap-16px p-16px items-center border-b-2 border-[var(--theme-border)] last:border-b-0 hover:bg-[var(--theme-background-secondary)]/10"
            >
              {/* Member Info */}
              <div className="col-span-5 flex items-center gap-12px">
                <div className="w-40px h-40px bg-primary-brutalist border-2 border-[var(--theme-border)] flex items-center justify-center">
                  {member.user?.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HiOutlineUser className="w-24px h-24px text-event-horizon" />
                  )}
                </div>
                <div>
                  <div className="font-mono text-brutal-sm">
                    {member.user?.name || 'Unknown User'}
                    {isCurrentUser && <span className="text-neutral-500 ml-8px">(YOU)</span>}
                  </div>
                  <div className="text-brutal-xs text-neutral-500 flex items-center gap-4px">
                    <HiOutlineMail className="w-12px h-12px" />
                    {member.user?.email || 'No email'}
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="col-span-3">
                {canManageMembers && member.role !== 'owner' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as any)}
                    className="px-12px py-6px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                             font-mono text-brutal-xs uppercase
                             focus:border-primary-brutalist focus:outline-none transition-colors"
                  >
                    <option value="admin">ADMIN</option>
                    <option value="member">MEMBER</option>
                    <option value="viewer">VIEWER</option>
                  </select>
                ) : (
                  <div className={clsx(
                    "inline-flex items-center gap-4px px-8px py-4px",
                    roleConfig[member.role as keyof typeof roleConfig].color,
                    "font-mono text-brutal-xs uppercase text-event-horizon"
                  )}>
                    <RoleIcon className="w-12px h-12px" />
                    {roleConfig[member.role as keyof typeof roleConfig].label}
                  </div>
                )}
              </div>

              {/* Joined Date */}
              <div className="col-span-2 text-brutal-sm">
                {new Date(member.joinedAt).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="col-span-2">
                {canManageMembers && member.role !== 'owner' && !isCurrentUser && (
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      setShowRemoveConfirm(true)
                    }}
                    className="p-8px border-2 border-[var(--theme-error)] text-[var(--theme-error)] hover:bg-[var(--theme-error)] hover:text-[var(--theme-foreground)] transition-colors"
                  >
                    <HiOutlineTrash className="w-16px h-16px" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Invite Modal */}
      <BrutalModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="INVITE MEMBER"
        size="md"
      >
        <div className="space-y-24px">
          <div>
            <label className="block text-brutal-sm mb-8px">EMAIL ADDRESS</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-brutal-sm mb-8px">ROLE</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md uppercase
                       focus:border-primary-brutalist focus:outline-none transition-colors"
            >
              <option value="admin">ADMIN - Can manage workspace and members</option>
              <option value="member">MEMBER - Can create and edit content</option>
              <option value="viewer">VIEWER - Can only view content</option>
            </select>
          </div>

          <div className="flex justify-end gap-16px">
            <button
              onClick={() => setShowInviteModal(false)}
              className="brutal-btn-secondary"
              disabled={isInviting}
            >
              CANCEL
            </button>
            <button
              onClick={handleInvite}
              className="brutal-btn"
              disabled={isInviting}
            >
              {isInviting ? 'INVITING...' : 'SEND INVITATION'}
            </button>
          </div>
        </div>
      </BrutalModal>

      {/* Remove Confirm Modal */}
      <BrutalModal
        isOpen={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false)
          setSelectedMember(null)
        }}
        title="REMOVE MEMBER"
        size="sm"
      >
        <div className="space-y-24px">
          <p className="text-brutal-sm">
            Are you sure you want to remove <strong>{selectedMember?.user?.name}</strong> from this workspace?
          </p>
          <p className="text-brutal-sm text-[var(--theme-error)]">
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-16px">
            <button
              onClick={() => {
                setShowRemoveConfirm(false)
                setSelectedMember(null)
              }}
              className="brutal-btn-secondary"
            >
              CANCEL
            </button>
            <button
              onClick={handleRemoveMember}
              className="px-24px py-12px bg-[var(--theme-error)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-sm uppercase tracking-wider text-[var(--theme-foreground)]
                       hover:bg-[#CC0000] transition-colors"
            >
              REMOVE MEMBER
            </button>
          </div>
        </div>
      </BrutalModal>
    </div>
  )
}