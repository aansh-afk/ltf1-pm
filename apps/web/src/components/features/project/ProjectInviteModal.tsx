import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import {
  HiOutlineClipboard,
  HiOutlineExternalLink,
  HiOutlineRefresh,
  HiOutlineShare,
  HiOutlineCog,
  HiOutlineLockClosed
} from 'react-icons/hi'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalModal from '@/components/ui/BrutalModal'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface ProjectInviteModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

export default function ProjectInviteModal({
  isOpen,
  onClose,
  projectId,
  projectName
}: ProjectInviteModalProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [isEnsuring, setIsEnsuring] = useState(false)

  const inviteLinkData = useQuery(
    api.projects.queries.getProjectInviteLink,
    isOpen ? { projectId: projectId as Id<"projects"> } : 'skip'
  )

  const generateNewCode = useMutation(api.projects.mutations.generateProjectInviteCode)
  const ensureInviteCode = useMutation(api.projects.mutations.ensureProjectInviteCode)

  const inviteCode = inviteLinkData?.inviteCode
  const inviteUrl = inviteCode ? `${window.location.origin}/join-project/${inviteCode}` : ''

  useEffect(() => {
    if (isOpen && inviteLinkData && !inviteLinkData.inviteCode && !isEnsuring) {
      setIsEnsuring(true)
      ensureInviteCode({ projectId: projectId as Id<"projects"> })
        .then(() => toast.success('Invite code generated!'))
        .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to generate invite code'))
        .finally(() => setIsEnsuring(false))
    }
  }, [isOpen, inviteLinkData?.inviteCode, isEnsuring, projectId, ensureInviteCode])

  const handleEnsureInviteCode = async () => {
    try {
      setIsEnsuring(true)
      await ensureInviteCode({ projectId: projectId as Id<"projects"> })
      toast.success('Invite code generated!')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate invite code')
    } finally {
      setIsEnsuring(false)
    }
  }

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      toast.success(`${label} copied to clipboard!`)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleGenerateNewCode = async () => {
    try {
      setIsEnsuring(true)
      await generateNewCode({ projectId: projectId as Id<"projects"> })
      toast.success('New single-use invite code generated!')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate invite code')
    } finally {
      setIsEnsuring(false)
    }
  }

  const handleShareLink = async () => {
    if (navigator.share && inviteUrl) {
      try {
        await navigator.share({
          title: `Join ${projectName}`,
          text: `You've been invited to join the project "${projectName}"`,
          url: inviteUrl,
        })
      } catch (error) {
        handleCopyToClipboard(inviteUrl, 'Invite Link')
      }
    } else {
      handleCopyToClipboard(inviteUrl, 'Invite Link')
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title="PROJECT INVITE"
      size="lg"
    >
      <div className="space-y-3">
        {/* Project Info Header */}
        <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-3">
          <h3 className="font-mono text-sm font-bold text-[var(--theme-foreground)] mb-1">INVITING TO: {projectName}</h3>
          <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
            Share the link or code below to invite people to join this project.
          </p>
        </div>

        {inviteLinkData ? (
          <>
            {/* Loading state */}
            {isEnsuring && (
              <div className="bg-[var(--theme-warning)]/10 border-2 border-[var(--theme-warning)] p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-[var(--theme-warning)] border-t-transparent" />
                  <p className="font-mono text-xs text-[var(--theme-warning)]">
                    Generating new single-use invite code...
                  </p>
                </div>
              </div>
            )}

            {/* No code yet */}
            {!inviteCode && !isEnsuring && (
              <div className="bg-[var(--theme-warning)]/10 border-2 border-[var(--theme-warning)] p-3">
                <p className="font-mono text-xs text-[var(--theme-warning)] mb-2">
                  This project doesn't have an invite code yet.
                </p>
                <button
                  onClick={handleEnsureInviteCode}
                  className="px-3 py-1.5 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors"
                >
                  GENERATE INVITE CODE
                </button>
              </div>
            )}

            {/* Single-use warning */}
            {inviteCode && (
              <div className="bg-[var(--theme-error)]/10 border-2 border-[var(--theme-error)] p-3">
                <p className="font-mono text-xs text-[var(--theme-error)]">
                  <HiOutlineLockClosed className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  <strong>SINGLE-USE INVITE:</strong> This code can only be used once. A new code will be generated after someone joins.
                </p>
              </div>
            )}

            {/* Shareable Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-[var(--theme-foreground)]">SHAREABLE LINK</h4>
                <button
                  onClick={handleShareLink}
                  disabled={!inviteUrl || isEnsuring}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors disabled:opacity-50"
                >
                  <HiOutlineShare className="w-3.5 h-3.5" />
                  SHARE
                </button>
              </div>

              <div className="flex gap-1">
                <input
                  type="text"
                  value={inviteUrl || (isEnsuring ? 'Generating...' : 'No invite code available')}
                  readOnly
                  aria-label="Shareable invite link"
                  className="flex-1 px-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-xs text-[var(--theme-foreground-secondary)] focus:border-[var(--theme-primary)] focus:outline-none"
                />
                <button
                  onClick={() => handleCopyToClipboard(inviteUrl, 'Invite Link')}
                  disabled={!inviteUrl || isEnsuring}
                  className={clsx(
                    "px-3 py-2 border-2 transition-colors disabled:opacity-50",
                    copiedText === 'Invite Link'
                      ? 'bg-[var(--theme-success)]/20 border-[var(--theme-success)] text-[var(--theme-success)]'
                      : 'bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)]'
                  )}
                >
                  <HiOutlineClipboard className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invite Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-[var(--theme-foreground)]">INVITE CODE</h4>
                <button
                  onClick={handleGenerateNewCode}
                  disabled={isEnsuring}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors disabled:opacity-50"
                >
                  <HiOutlineRefresh className="w-3.5 h-3.5" />
                  {inviteCode ? 'REGENERATE' : 'GENERATE'}
                </button>
              </div>

              <div className="flex gap-1">
                <input
                  type="text"
                  value={inviteCode || (isEnsuring ? 'Generating...' : 'No invite code available')}
                  readOnly
                  aria-label="Invite code"
                  className="flex-1 px-3 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm text-[var(--theme-primary)] font-bold focus:border-[var(--theme-primary)] focus:outline-none"
                />
                <button
                  onClick={() => handleCopyToClipboard(inviteCode || '', 'Invite Code')}
                  disabled={!inviteCode || isEnsuring}
                  className={clsx(
                    "px-3 py-2 border-2 transition-colors disabled:opacity-50",
                    copiedText === 'Invite Code'
                      ? 'bg-[var(--theme-success)]/20 border-[var(--theme-success)] text-[var(--theme-success)]'
                      : 'bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)]'
                  )}
                >
                  <HiOutlineClipboard className="w-4 h-4" />
                </button>
              </div>

              <p className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] uppercase tracking-wider">
                Users can enter this code at <strong className="text-[var(--theme-foreground-secondary)]">/join-project</strong> to join the project.
              </p>
            </div>

            {/* Team Settings */}
            {inviteLinkData.teamSettings && (
              <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <HiOutlineCog className="w-4 h-4 text-[var(--theme-primary)]" />
                  <h4 className="font-mono text-xs font-bold text-[var(--theme-foreground)]">TEAM SETTINGS</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-wider">
                  <div>
                    <span className="text-[var(--theme-foreground-tertiary)]">Max Members:</span>{' '}
                    <span className="text-[var(--theme-foreground)]">
                      {inviteLinkData.teamSettings.maxMembers || 'Unlimited'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--theme-foreground-tertiary)]">Self Join:</span>{' '}
                    <span className={inviteLinkData.teamSettings.allowSelfJoin ? 'text-[var(--theme-success)]' : 'text-[var(--theme-error)]'}>
                      {inviteLinkData.teamSettings.allowSelfJoin ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--theme-foreground-tertiary)]">Requires Approval:</span>{' '}
                    <span className={inviteLinkData.teamSettings.requireApproval ? 'text-[var(--theme-warning)]' : 'text-[var(--theme-success)]'}>
                      {inviteLinkData.teamSettings.requireApproval ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex gap-2 pt-3 border-t-2 border-[var(--theme-border)]">
              <button
                onClick={() => window.open(inviteUrl, '_blank')}
                disabled={!inviteUrl || isEnsuring}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground-secondary)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-foreground)] transition-colors disabled:opacity-50"
              >
                <HiOutlineExternalLink className="w-4 h-4" />
                TEST LINK
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2.5 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-foreground)] hover:border-[var(--theme-primary)] transition-colors"
              >
                DONE
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="animate-spin w-4 h-4 border-2 border-[var(--theme-primary)] border-t-transparent mx-auto mb-2" />
            <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">Loading invite information...</p>
          </div>
        )}
      </div>
    </BrutalModal>
  )
}
