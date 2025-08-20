import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { 
  HiOutlineClipboard, 
  HiOutlineExternalLink, 
  HiOutlineRefresh,
  HiOutlineShare,
  HiOutlineCog
} from 'react-icons/hi'
import BrutalModal from '../../ui/BrutalModal'
import toast from 'react-hot-toast'

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

  // Get current invite link
  const inviteLinkData = useQuery(
    api.projects.queries.getProjectInviteLink,
    isOpen ? { projectId: projectId as any } : 'skip'
  )

  // Mutations
  const generateNewCode = useMutation(api.projects.mutations.generateProjectInviteCode)
  const ensureInviteCode = useMutation(api.projects.mutations.ensureProjectInviteCode)

  const inviteCode = inviteLinkData?.inviteCode
  const inviteUrl = inviteCode ? `${window.location.origin}/join-project/${inviteCode}` : ''

  // Auto-ensure invite code exists when modal opens for projects without one
  useEffect(() => {
    if (isOpen && inviteLinkData && !inviteLinkData.inviteCode && !isEnsuring) {
      handleEnsureInviteCode()
    }
  }, [isOpen, inviteLinkData?.inviteCode, isEnsuring])

  const handleEnsureInviteCode = async () => {
    try {
      setIsEnsuring(true)
      await ensureInviteCode({ projectId: projectId as any })
      toast.success('Invite code generated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate invite code')
    } finally {
      setIsEnsuring(false)
    }
  }

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      toast.success(`${label} copied to clipboard!`)
      
      // Clear the "copied" state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleGenerateNewCode = async () => {
    try {
      setIsEnsuring(true)
      await generateNewCode({ projectId: projectId as any })
      toast.success('New single-use invite code generated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate invite code')
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
        // Fallback to clipboard if sharing fails
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
      <div className="space-y-24px">
        {/* Project Info */}
        <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-16px">
          <h3 className="text-brutal-md font-bold mb-8px">INVITING TO: {projectName}</h3>
          <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
            Share the link or code below to invite people to join this project.
          </p>
        </div>

        {inviteLinkData ? (
          <>
            {/* Show loading if generating invite code */}
            {isEnsuring && (
              <div className="bg-brutal-warning/10 border-2 border-brutal-warning p-16px mb-24px">
                <div className="flex items-center gap-12px">
                  <div className="animate-spin w-16px h-16px border-2 border-brutal-warning border-t-transparent"></div>
                  <p className="text-brutal-sm text-brutal-warning">
                    Generating new single-use invite code...
                  </p>
                </div>
              </div>
            )}

            {/* Show message if no invite code yet */}
            {!inviteCode && !isEnsuring && (
              <div className="bg-brutal-warning/10 border-2 border-brutal-warning p-16px mb-24px">
                <p className="text-brutal-sm text-brutal-warning mb-12px">
                  ⚠️ This project doesn't have an invite code yet.
                </p>
                <button
                  onClick={handleEnsureInviteCode}
                  className="brutal-btn-secondary text-brutal-xs px-16px py-8px"
                >
                  GENERATE INVITE CODE
                </button>
              </div>
            )}

            {/* Single-use warning */}
            {inviteCode && (
              <div className="bg-brutal-info/10 border-2 border-brutal-info p-16px mb-24px">
                <p className="text-brutal-sm text-brutal-info">
                  🔒 <strong>SINGLE-USE INVITE:</strong> This code can only be used once. A new code will be generated after someone joins.
                </p>
              </div>
            )}

            {/* Invite Link Section */}
            <div className="space-y-16px">
              <div className="flex items-center justify-between">
                <h4 className="text-brutal-sm font-bold">SHAREABLE LINK</h4>
                <button
                  onClick={handleShareLink}
                  disabled={!inviteUrl || isEnsuring}
                  className="brutal-btn-secondary flex items-center gap-8px text-brutal-xs px-16px py-8px disabled:opacity-50"
                >
                  <HiOutlineShare className="w-14px h-14px" />
                  SHARE
                </button>
              </div>

              <div className="flex gap-8px">
                <input
                  type="text"
                  value={inviteUrl || (isEnsuring ? 'Generating...' : 'No invite code available')}
                  readOnly
                  className="flex-1 px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                           font-mono text-brutal-sm text-[var(--theme-foreground)]/80
                           focus:border-primary-brutalist focus:outline-none"
                />
                <button
                  onClick={() => handleCopyToClipboard(inviteUrl, 'Invite Link')}
                  disabled={!inviteUrl || isEnsuring}
                  className={`px-16px py-12px border-2 transition-colors disabled:opacity-50 ${
                    copiedText === 'Invite Link'
                      ? 'bg-brutal-success border-brutal-success text-event-horizon'
                      : 'bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-foreground)] hover:border-primary-brutalist'
                  }`}
                >
                  <HiOutlineClipboard className="w-16px h-16px" />
                </button>
              </div>
            </div>

            {/* Invite Code Section */}
            <div className="space-y-16px">
              <div className="flex items-center justify-between">
                <h4 className="text-brutal-sm font-bold">INVITE CODE</h4>
                <button
                  onClick={handleGenerateNewCode}
                  disabled={isEnsuring}
                  className="brutal-btn-secondary flex items-center gap-8px text-brutal-xs px-16px py-8px disabled:opacity-50"
                >
                  <HiOutlineRefresh className="w-14px h-14px" />
                  {inviteCode ? 'REGENERATE' : 'GENERATE'}
                </button>
              </div>

              <div className="flex gap-8px">
                <input
                  type="text"
                  value={inviteCode || (isEnsuring ? 'Generating...' : 'No invite code available')}
                  readOnly
                  className="flex-1 px-16px py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] 
                           font-mono text-brutal-md text-primary-brutalist font-bold
                           focus:border-primary-brutalist focus:outline-none"
                />
                <button
                  onClick={() => handleCopyToClipboard(inviteCode || '', 'Invite Code')}
                  disabled={!inviteCode || isEnsuring}
                  className={`px-16px py-12px border-2 transition-colors disabled:opacity-50 ${
                    copiedText === 'Invite Code'
                      ? 'bg-brutal-success border-brutal-success text-event-horizon'
                      : 'bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-foreground)] hover:border-primary-brutalist'
                  }`}
                >
                  <HiOutlineClipboard className="w-16px h-16px" />
                </button>
              </div>

              <p className="text-brutal-xs text-[var(--theme-foreground)]/60">
                Users can enter this code at <strong>/join-project</strong> to join the project.
              </p>
            </div>

            {/* Team Settings Info */}
            {inviteLinkData.teamSettings && (
              <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-16px">
                <div className="flex items-center gap-8px mb-12px">
                  <HiOutlineCog className="w-16px h-16px text-primary-brutalist" />
                  <h4 className="text-brutal-sm font-bold">TEAM SETTINGS</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-16px text-brutal-xs">
                  <div>
                    <span className="text-[var(--theme-foreground)]/60">Max Members:</span>{' '}
                    <span className="text-[var(--theme-foreground)]">
                      {inviteLinkData.teamSettings.maxMembers || 'Unlimited'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--theme-foreground)]/60">Self Join:</span>{' '}
                    <span className={inviteLinkData.teamSettings.allowSelfJoin ? 'text-brutal-success' : 'text-brutal-error'}>
                      {inviteLinkData.teamSettings.allowSelfJoin ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--theme-foreground)]/60">Requires Approval:</span>{' '}
                    <span className={inviteLinkData.teamSettings.requireApproval ? 'text-brutal-warning' : 'text-brutal-success'}>
                      {inviteLinkData.teamSettings.requireApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-16px pt-16px border-t-2 border-[var(--theme-border)]">
              <button
                onClick={() => window.open(inviteUrl, '_blank')}
                disabled={!inviteUrl || isEnsuring}
                className="flex-1 brutal-btn-secondary flex items-center justify-center gap-8px disabled:opacity-50"
              >
                <HiOutlineExternalLink className="w-16px h-16px" />
                TEST LINK
              </button>
              <button
                onClick={onClose}
                className="flex-1 brutal-btn"
              >
                DONE
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-48px">
            <div className="animate-spin w-24px h-24px border-2 border-primary-brutalist border-t-transparent mx-auto mb-16px"></div>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60">Loading invite information...</p>
          </div>
        )}
      </div>
    </BrutalModal>
  )
}