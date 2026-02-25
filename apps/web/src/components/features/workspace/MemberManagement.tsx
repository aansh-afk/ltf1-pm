import { useReducer } from 'react'
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
import BrutalSelect from '../../ui/BrutalSelect'

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

type MemberManagementState = {
  showInviteModal: boolean
  inviteEmail: string
  inviteRole: 'admin' | 'member' | 'viewer'
  isInviting: boolean
  selectedMember: any
  showRemoveConfirm: boolean
}

const memberManagementInitialState: MemberManagementState = {
  showInviteModal: false,
  inviteEmail: '',
  inviteRole: 'member',
  isInviting: false,
  selectedMember: null,
  showRemoveConfirm: false,
}

type MemberManagementAction =
  | { type: 'UPDATE'; field: keyof MemberManagementState; value: MemberManagementState[keyof MemberManagementState] }
  | { type: 'RESET' }

function memberManagementReducer(state: MemberManagementState, action: MemberManagementAction): MemberManagementState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return memberManagementInitialState
    default:
      return state
  }
}

export default function MemberManagement({ workspace, currentUserRole, canManageMembers }: MemberManagementProps) {
  const [state, dispatch] = useReducer(memberManagementReducer, memberManagementInitialState)
  const { showInviteModal, inviteEmail, inviteRole, isInviting, selectedMember, showRemoveConfirm } = state

  const inviteToWorkspace = useMutation(api.workspaces.mutations.inviteToWorkspace)
  const updateMemberRole = useMutation(api.workspaces.mutations.updateMemberRole)
  const removeMember = useMutation(api.workspaces.mutations.removeMember)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required')
      return
    }

    dispatch({ type: 'UPDATE', field: 'isInviting', value: true })
    try {
      await inviteToWorkspace({
        workspaceId: workspace._id,
        email: inviteEmail.trim(),
        role: inviteRole
      })
      toast.success('Invitation sent successfully')
      dispatch({ type: 'UPDATE', field: 'inviteEmail', value: '' })
      dispatch({ type: 'UPDATE', field: 'inviteRole', value: 'member' })
      dispatch({ type: 'UPDATE', field: 'showInviteModal', value: false })
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite member')
    } finally {
      dispatch({ type: 'UPDATE', field: 'isInviting', value: false })
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
      dispatch({ type: 'UPDATE', field: 'selectedMember', value: null })
      dispatch({ type: 'UPDATE', field: 'showRemoveConfirm', value: false })
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member')
    }
  }

  return (
    <div className="space-y-[12px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold font-bold uppercase">WORKSPACE MEMBERS</h2>
          <p className="text-brutal-sm text-neutral-500">
            {workspace.members?.length || 0} MEMBERS
          </p>
        </div>

        {canManageMembers && (
          <button
            onClick={() => dispatch({ type: 'UPDATE', field: 'showInviteModal', value: true })}
            className="brutal-btn flex items-center gap-[4px]"
          >
            <HiOutlineUserAdd className="w-16px h-16px" />
            INVITE MEMBER
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
        <div className="grid grid-cols-12 gap-[8px] p-[10px] font-mono text-brutal-sm uppercase border-b-2 border-[var(--theme-border)]">
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
              className="grid grid-cols-12 gap-[8px] p-[10px] items-center border-b-2 border-[var(--theme-border)] last:border-b-0 hover:bg-[var(--theme-background-secondary)]/10"
            >
              {/* Member Info */}
              <div className="col-span-5 flex items-center gap-[6px]">
                <div className="w-40px h-40px bg-primary-brutalist border-2 border-[var(--theme-border)] flex items-center justify-center">
                  {member.user?.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HiOutlineUser className="w-4 h-4 text-event-horizon" />
                  )}
                </div>
                <div>
                  <div className="font-mono text-brutal-sm">
                    {member.user?.name || 'Unknown User'}
                    {isCurrentUser && <span className="text-neutral-500 ml-[4px]">(YOU)</span>}
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
                  <BrutalSelect
                    value={member.role}
                    onChange={(v) => handleRoleChange(member.userId, v as any)}
                    options={[
                      { value: 'admin', label: 'ADMIN' },
                      { value: 'member', label: 'MEMBER' },
                      { value: 'viewer', label: 'VIEWER' },
                    ]}
                    compact
                  />
                ) : (
                  <div className={clsx(
                    "inline-flex items-center gap-4px px-[4px] py-4px",
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
                      dispatch({ type: 'UPDATE', field: 'selectedMember', value: member })
                      dispatch({ type: 'UPDATE', field: 'showRemoveConfirm', value: true })
                    }}
                    className="p-[4px] border-2 border-[var(--theme-error)] text-[var(--theme-error)] hover:bg-[var(--theme-error)] hover:text-[var(--theme-foreground)] transition-colors"
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
        onClose={() => dispatch({ type: 'UPDATE', field: 'showInviteModal', value: false })}
        title="INVITE MEMBER"
        size="md"
      >
        <div className="space-y-[12px]">
          <div>
            <label htmlFor="invite-email" className="block text-brutal-sm mb-[4px]">EMAIL ADDRESS</label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'inviteEmail', value: e.target.value })}
              placeholder="user@example.com"
              className="w-full px-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                       font-mono text-brutal-md placeholder:text-neutral-600
                       focus:border-primary-brutalist focus:outline-none transition-colors"
            />
          </div>

          <div>
            <BrutalSelect
              id="invite-role"
              label="ROLE"
              value={inviteRole}
              onChange={(v) => dispatch({ type: 'UPDATE', field: 'inviteRole', value: v as 'admin' | 'member' | 'viewer' })}
              options={[
                { value: 'admin', label: 'ADMIN - Can manage workspace and members' },
                { value: 'member', label: 'MEMBER - Can create and edit content' },
                { value: 'viewer', label: 'VIEWER - Can only view content' },
              ]}
              fullWidth
            />
          </div>

          <div className="flex justify-end gap-[8px]">
            <button
              onClick={() => dispatch({ type: 'UPDATE', field: 'showInviteModal', value: false })}
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
          dispatch({ type: 'UPDATE', field: 'showRemoveConfirm', value: false })
          dispatch({ type: 'UPDATE', field: 'selectedMember', value: null })
        }}
        title="REMOVE MEMBER"
        size="sm"
      >
        <div className="space-y-[12px]">
          <p className="text-brutal-sm">
            Are you sure you want to remove <strong>{selectedMember?.user?.name}</strong> from this workspace?
          </p>
          <p className="text-brutal-sm text-[var(--theme-error)]">
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-[8px]">
            <button
              onClick={() => {
                dispatch({ type: 'UPDATE', field: 'showRemoveConfirm', value: false })
                dispatch({ type: 'UPDATE', field: 'selectedMember', value: null })
              }}
              className="brutal-btn-secondary"
            >
              CANCEL
            </button>
            <button
              onClick={handleRemoveMember}
              className="px-[12px] py-[8px] bg-[var(--theme-error)] border-2 border-[var(--theme-border)] 
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