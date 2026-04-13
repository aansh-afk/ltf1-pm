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
    toast.success('Link copied')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleEmailInvite = async () => {
    const email = emailInput.trim()
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email')
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

  const tabs: { id: InviteTab; label: string; icon: React.ReactNode }[] = [
    { id: 'link', label: 'LINK', icon: <HiOutlineLink className="w-3.5 h-3.5" /> },
    { id: 'team', label: 'TEAM', icon: <HiOutlineUserGroup className="w-3.5 h-3.5" /> },
    { id: 'email', label: 'EMAIL', icon: <HiOutlineMail className="w-3.5 h-3.5" /> },
  ]

  return (
    <BrutalModal isOpen={isOpen} onClose={onClose} title={`INVITE TO ${projectName.toUpperCase()}`} size="md">
      <div className="space-y-4">
        {/* Tab bar */}
        <div className="flex border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider border-b-2 -mb-[2px] transition-colors",
                activeTab === tab.id
                  ? "text-[var(--theme-primary)] border-[var(--theme-primary)]"
                  : "text-[var(--theme-foreground)]/40 border-transparent hover:text-[var(--theme-foreground)]/60"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Share Link Tab ─── */}
        {activeTab === 'link' && (
          <div className="space-y-3">
            <p className="font-mono text-[11px] text-[var(--theme-foreground)]/50">
              Share this link with anyone to invite them to the project.
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={inviteUrl || 'Generating...'}
                readOnly
                className="flex-1 px-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)]/70 focus:outline-none"
              />
              <BrutalButton
                size="sm"
                variant={copiedLink ? "primary" : "ghost"}
                onClick={handleCopyLink}
                disabled={!inviteUrl}
              >
                {copiedLink ? <HiOutlineCheck className="w-4 h-4" /> : <HiOutlineClipboard className="w-4 h-4" />}
              </BrutalButton>
            </div>
            <p className="font-mono text-[9px] text-[var(--theme-foreground)]/30 uppercase">
              Anyone with this link can join. They'll be auto-added to the workspace too.
            </p>
          </div>
        )}

        {/* ─── Workspace Team Tab ─── */}
        {activeTab === 'team' && (
          <div className="space-y-3">
            <p className="font-mono text-[11px] text-[var(--theme-foreground)]/50">
              Add workspace members who aren't in this project yet.
            </p>
            {availableMembers.length === 0 ? (
              <div className="py-6 text-center">
                <p className="font-mono text-xs text-[var(--theme-foreground)]/40">
                  All workspace members are already in this project.
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-[240px] overflow-y-auto border-2 border-[var(--theme-border)]">
                  {availableMembers.map((member: any) => {
                    const userId = member.userId || member._id
                    const isSelected = selectedMembers.has(userId)
                    return (
                      <button
                        key={userId}
                        onClick={() => toggleMember(userId)}
                        className={clsx(
                          "w-full flex items-center gap-3 px-3 py-2.5 border-b border-[var(--theme-border)] last:border-b-0 transition-colors",
                          isSelected
                            ? "bg-[var(--theme-primary)]/10"
                            : "hover:bg-[var(--theme-background)]/50"
                        )}
                      >
                        <div className={clsx(
                          "w-4 h-4 border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]"
                            : "border-[var(--theme-border)]"
                        )}>
                          {isSelected && <HiOutlineCheck className="w-3 h-3 text-[var(--theme-background)]" />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-mono text-xs font-bold text-[var(--theme-foreground)]">
                            {member.user?.name || member.name || 'Unknown'}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--theme-foreground)]/40">
                            {member.user?.email || member.email || ''} · {member.role}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
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
          <div className="space-y-3">
            <p className="font-mono text-[11px] text-[var(--theme-foreground)]/50">
              Invite by email. If they have an LTF1 account, they're added instantly. If not, they'll get an email with a join link.
            </p>
            <div className="flex gap-1.5">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailInvite()}
                placeholder="developer@company.com"
                className="flex-1 px-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground)] placeholder:text-[var(--theme-foreground)]/20 focus:border-[var(--theme-primary)] focus:outline-none"
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
            <p className="font-mono text-[9px] text-[var(--theme-foreground)]/30 uppercase">
              New users will be added to the workspace automatically when they join.
            </p>
          </div>
        )}
      </div>
    </BrutalModal>
  )
}
