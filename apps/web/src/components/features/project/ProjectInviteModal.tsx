import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineClipboard,
  HiOutlineLink,
  HiOutlineMail,
  HiOutlineUserGroup,
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineShare,
} from 'react-icons/hi'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalModal from '@/components/ui/BrutalModal'
import BrutalButton from '@/components/ui/BrutalButton'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface ProjectInviteModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  workspaceId?: string
}

type InviteTab = 'link' | 'team' | 'email'

export default function ProjectInviteModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  workspaceId,
}: ProjectInviteModalProps) {
  const [activeTab, setActiveTab] = useState<InviteTab>('link')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isAddingMembers, setIsAddingMembers] = useState(false)

  const inviteLinkData = useQuery(
    api.projects.queries.getProjectInviteLink,
    isOpen ? { projectId: projectId as Id<"projects"> } : 'skip'
  )

  const workspaceMembers = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    isOpen && workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : 'skip'
  )

  const projectMembers = useQuery(
    api.projects.members.getProjectMembers,
    isOpen ? { projectId: projectId as Id<"projects"> } : 'skip'
  )

  const ensureInviteCode = useMutation(api.projects.mutations.ensureProjectInviteCode)
  const inviteByEmail = useMutation(api.projects.mutations.inviteByEmail)
  const inviteWorkspaceMembers = useMutation(api.projects.mutations.inviteWorkspaceMembers)

  const inviteCode = inviteLinkData?.inviteCode
  const inviteUrl = inviteCode ? `${window.location.origin}/join-project/${inviteCode}` : ''

  // Auto-generate invite code if missing
  useEffect(() => {
    if (isOpen && inviteLinkData && !inviteLinkData.inviteCode) {
      ensureInviteCode({ projectId: projectId as Id<"projects"> }).catch(() => {})
    }
  }, [isOpen, inviteLinkData?.inviteCode])

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setCopiedLink(false)
      setCopiedCode(false)
      setEmailInput('')
      setSelectedMembers(new Set())
    }
  }, [isOpen])

  // Get project member IDs for filtering
  const projectMemberIds = new Set(
    (projectMembers || []).map((m: any) => m.userId || m._id)
  )

  // Workspace members NOT already in the project
  const availableMembers = (workspaceMembers || []).filter(
    (m: any) => !projectMemberIds.has(m.userId || m._id)
  )

  const handleCopyLink = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyCode = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    setCopiedCode(true)
    toast.success('Code copied to clipboard')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleShareLink = async () => {
    if (!inviteUrl) return
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${projectName}`, url: inviteUrl })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink()
    }
  }

  const handleEmailInvite = async () => {
    const email = emailInput.trim()
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address')
      return
    }
    setIsSendingEmail(true)
    try {
      const result = await inviteByEmail({
        projectId: projectId as Id<"projects">,
        email,
      })
      if (result.status === 'added') {
        toast.success(`${email} added to project`)
      } else {
        toast.success(`Invite sent to ${email}`)
      }
      setEmailInput('')
    } catch (e: any) {
      toast.error(e.message || 'Failed to send invite')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleAddSelectedMembers = async () => {
    if (selectedMembers.size === 0) return
    setIsAddingMembers(true)
    try {
      const result = await inviteWorkspaceMembers({
        projectId: projectId as Id<"projects">,
        userIds: Array.from(selectedMembers) as Id<"users">[],
      })
      toast.success(`${result.added} member${result.added === 1 ? '' : 's'} added`)
      if (result.alreadyMembers > 0) {
        toast(`${result.alreadyMembers} already in project`, { icon: 'ℹ️' })
      }
      setSelectedMembers(new Set())
    } catch (e: any) {
      toast.error(e.message || 'Failed to add members')
    } finally {
      setIsAddingMembers(false)
    }
  }

  const toggleMember = (id: string) => {
    const next = new Set(selectedMembers)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedMembers(next)
  }

  const selectAll = () => {
    if (selectedMembers.size === availableMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(availableMembers.map((m: any) => m.userId || m._id)))
    }
  }

  const tabs: { id: InviteTab; label: string; icon: React.ReactNode }[] = [
    { id: 'link', label: 'LINK', icon: <HiOutlineLink className="w-3.5 h-3.5" /> },
    { id: 'team', label: 'TEAM', icon: <HiOutlineUserGroup className="w-3.5 h-3.5" /> },
    { id: 'email', label: 'EMAIL', icon: <HiOutlineMail className="w-3.5 h-3.5" /> },
  ]

  return (
    <BrutalModal isOpen={isOpen} onClose={onClose} title={`INVITE TO ${projectName.toUpperCase()}`} size="md">
      <div className="space-y-5">
        {/* Tab bar */}
        <div className="flex border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[11px] font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-colors",
                activeTab === tab.id
                  ? "text-[var(--theme-primary)] border-[var(--theme-primary)]"
                  : "text-[var(--theme-foreground)]/30 border-transparent hover:text-[var(--theme-foreground)]/50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Share Link Tab ─── */}
        {activeTab === 'link' && (
          <div className="space-y-5">
            {/* Description */}
            <p className="font-mono text-xs text-[var(--theme-foreground)]/50 leading-relaxed">
              Share a link or code to invite people to this project. Anyone with the link will be auto-added to the workspace.
            </p>

            {/* Invite Link */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40">
                Shareable Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)]/60 truncate select-all">
                  {inviteUrl || 'Generating...'}
                </div>
                <BrutalButton
                  size="sm"
                  variant={copiedLink ? "primary" : "ghost"}
                  onClick={handleCopyLink}
                  disabled={!inviteUrl}
                >
                  {copiedLink ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineClipboard className="w-4 h-4" />}
                </BrutalButton>
                <BrutalButton
                  size="sm"
                  variant="ghost"
                  onClick={handleShareLink}
                  disabled={!inviteUrl}
                >
                  <HiOutlineShare className="w-4 h-4" />
                </BrutalButton>
              </div>
            </div>

            {/* Invite Code */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40">
                Invite Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-primary)] tracking-wider select-all">
                  {inviteCode || '...'}
                </div>
                <BrutalButton
                  size="sm"
                  variant={copiedCode ? "primary" : "ghost"}
                  onClick={handleCopyCode}
                  disabled={!inviteCode}
                >
                  {copiedCode ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineClipboard className="w-4 h-4" />}
                </BrutalButton>
              </div>
              <p className="font-mono text-[10px] text-[var(--theme-foreground)]/30 leading-relaxed">
                Users can enter this code at /join-project to join.
              </p>
            </div>
          </div>
        )}

        {/* ─── Workspace Team Tab ─── */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <p className="font-mono text-xs text-[var(--theme-foreground)]/50 leading-relaxed">
              Add workspace members who aren't in this project yet.
            </p>
            {availableMembers.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-[var(--theme-border)]">
                <HiOutlineUserGroup className="w-6 h-6 mx-auto mb-2 text-[var(--theme-foreground)]/20" />
                <p className="font-mono text-xs text-[var(--theme-foreground)]/40">
                  All workspace members are already in this project.
                </p>
              </div>
            ) : (
              <>
                {/* Select all header */}
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={selectAll}
                    className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40 hover:text-[var(--theme-primary)] transition-colors"
                  >
                    {selectedMembers.size === availableMembers.length ? 'DESELECT ALL' : 'SELECT ALL'}
                  </button>
                  <span className="font-mono text-[10px] text-[var(--theme-foreground)]/30">
                    {availableMembers.length} available
                  </span>
                </div>

                {/* Member list */}
                <div className="max-h-[260px] overflow-y-auto border-2 border-[var(--theme-border)]">
                  {availableMembers.map((member: any) => {
                    const userId = member.userId || member._id
                    const isSelected = selectedMembers.has(userId)
                    return (
                      <button
                        key={userId}
                        onClick={() => toggleMember(userId)}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-3 border-b border-[var(--theme-border)]/50 last:border-b-0 transition-colors",
                          isSelected
                            ? "bg-[var(--theme-primary)]/10"
                            : "hover:bg-[var(--theme-background)]/50"
                        )}
                      >
                        <div className={clsx(
                          "w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]"
                            : "border-[var(--theme-border)]"
                        )}>
                          {isSelected && <HiOutlineCheck className="w-3 h-3 text-[var(--theme-background)]" />}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-mono text-xs font-bold text-[var(--theme-foreground)] truncate">
                            {member.user?.name || member.name || 'Unknown'}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--theme-foreground)]/40 truncate">
                            {member.user?.email || member.email || ''} · {member.role}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Add button */}
                <BrutalButton
                  size="sm"
                  variant="primary"
                  fullWidth
                  onClick={handleAddSelectedMembers}
                  disabled={selectedMembers.size === 0}
                  loading={isAddingMembers}
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 mr-1.5" />
                  ADD {selectedMembers.size > 0 ? `${selectedMembers.size} MEMBER${selectedMembers.size > 1 ? 'S' : ''}` : 'SELECTED'}
                </BrutalButton>
              </>
            )}
          </div>
        )}

        {/* ─── Email Invite Tab ─── */}
        {activeTab === 'email' && (
          <div className="space-y-5">
            <p className="font-mono text-xs text-[var(--theme-foreground)]/50 leading-relaxed">
              Invite by email. Existing LTF1 users are added instantly. New users receive a join link.
            </p>

            <div className="space-y-2">
              <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground)]/40">
                Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailInvite()}
                  placeholder="developer@company.com"
                  className="flex-1 px-3 py-2.5 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground)]/20 focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
                />
                <BrutalButton
                  size="sm"
                  variant="primary"
                  onClick={handleEmailInvite}
                  disabled={!emailInput.trim() || isSendingEmail}
                  loading={isSendingEmail}
                >
                  SEND
                </BrutalButton>
              </div>
            </div>

            <p className="font-mono text-[10px] text-[var(--theme-foreground)]/30 leading-relaxed">
              New users will be added to the workspace automatically when they accept the invite.
            </p>
          </div>
        )}
      </div>
    </BrutalModal>
  )
}
