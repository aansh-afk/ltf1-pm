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
import BrutalModal from '../../ui/BrutalModal'
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
    isOpen ? { projectId: projectId as any } : 'skip'
  )

  const generateNewCode = useMutation(api.projects.mutations.generateProjectInviteCode)
  const ensureInviteCode = useMutation(api.projects.mutations.ensureProjectInviteCode)

  const inviteCode = inviteLinkData?.inviteCode
  const inviteUrl = inviteCode ? `${window.location.origin}/join-project/${inviteCode}` : ''

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
        <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] p-3">
          <h3 className="font-mono text-sm font-bold text-[#F9FAFB] mb-1">INVITING TO: {projectName}</h3>
          <p className="font-mono text-xs text-[#6B7280]">
            Share the link or code below to invite people to join this project.
          </p>
        </div>

        {inviteLinkData ? (
          <>
            {/* Loading state */}
            {isEnsuring && (
              <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B] p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-[#F59E0B] border-t-transparent" />
                  <p className="font-mono text-xs text-[#F59E0B]">
                    Generating new single-use invite code...
                  </p>
                </div>
              </div>
            )}

            {/* No code yet */}
            {!inviteCode && !isEnsuring && (
              <div className="bg-[#F59E0B]/10 border-2 border-[#F59E0B] p-3">
                <p className="font-mono text-xs text-[#F59E0B] mb-2">
                  This project doesn't have an invite code yet.
                </p>
                <button
                  onClick={handleEnsureInviteCode}
                  className="px-3 py-1.5 bg-[#111111] border-2 border-[#2E2E35] font-mono text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors"
                >
                  GENERATE INVITE CODE
                </button>
              </div>
            )}

            {/* Single-use warning */}
            {inviteCode && (
              <div className="bg-[#EF4444]/10 border-2 border-[#EF4444] p-3">
                <p className="font-mono text-xs text-[#EF4444]">
                  <HiOutlineLockClosed className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  <strong>SINGLE-USE INVITE:</strong> This code can only be used once. A new code will be generated after someone joins.
                </p>
              </div>
            )}

            {/* Shareable Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-[#F9FAFB]">SHAREABLE LINK</h4>
                <button
                  onClick={handleShareLink}
                  disabled={!inviteUrl || isEnsuring}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111] border-2 border-[#2E2E35] font-mono text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors disabled:opacity-50"
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
                  className="flex-1 px-3 py-2 bg-[#050505] border-2 border-[#2E2E35] font-mono text-xs text-[#9CA3AF] focus:border-[#6366F1] focus:outline-none"
                />
                <button
                  onClick={() => handleCopyToClipboard(inviteUrl, 'Invite Link')}
                  disabled={!inviteUrl || isEnsuring}
                  className={clsx(
                    "px-3 py-2 border-2 transition-colors disabled:opacity-50",
                    copiedText === 'Invite Link'
                      ? 'bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E]'
                      : 'bg-[#050505] border-[#2E2E35] text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB]'
                  )}
                >
                  <HiOutlineClipboard className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invite Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-[#F9FAFB]">INVITE CODE</h4>
                <button
                  onClick={handleGenerateNewCode}
                  disabled={isEnsuring}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111111] border-2 border-[#2E2E35] font-mono text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors disabled:opacity-50"
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
                  className="flex-1 px-3 py-2 bg-[#050505] border-2 border-[#2E2E35] font-mono text-sm text-[#6366F1] font-bold focus:border-[#6366F1] focus:outline-none"
                />
                <button
                  onClick={() => handleCopyToClipboard(inviteCode || '', 'Invite Code')}
                  disabled={!inviteCode || isEnsuring}
                  className={clsx(
                    "px-3 py-2 border-2 transition-colors disabled:opacity-50",
                    copiedText === 'Invite Code'
                      ? 'bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E]'
                      : 'bg-[#050505] border-[#2E2E35] text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB]'
                  )}
                >
                  <HiOutlineClipboard className="w-4 h-4" />
                </button>
              </div>

              <p className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider">
                Users can enter this code at <strong className="text-[#9CA3AF]">/join-project</strong> to join the project.
              </p>
            </div>

            {/* Team Settings */}
            {inviteLinkData.teamSettings && (
              <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <HiOutlineCog className="w-4 h-4 text-[#6366F1]" />
                  <h4 className="font-mono text-xs font-bold text-[#F9FAFB]">TEAM SETTINGS</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-wider">
                  <div>
                    <span className="text-[#6B7280]">Max Members:</span>{' '}
                    <span className="text-[#F9FAFB]">
                      {inviteLinkData.teamSettings.maxMembers || 'Unlimited'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Self Join:</span>{' '}
                    <span className={inviteLinkData.teamSettings.allowSelfJoin ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                      {inviteLinkData.teamSettings.allowSelfJoin ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Requires Approval:</span>{' '}
                    <span className={inviteLinkData.teamSettings.requireApproval ? 'text-[#F59E0B]' : 'text-[#22C55E]'}>
                      {inviteLinkData.teamSettings.requireApproval ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex gap-2 pt-3 border-t-2 border-[#2E2E35]">
              <button
                onClick={() => window.open(inviteUrl, '_blank')}
                disabled={!inviteUrl || isEnsuring}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0A0A0A] border-2 border-[#2E2E35] font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors disabled:opacity-50"
              >
                <HiOutlineExternalLink className="w-4 h-4" />
                TEST LINK
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2.5 bg-[#111111] border-2 border-[#2E2E35] font-mono text-xs font-bold uppercase tracking-wider text-[#F9FAFB] hover:border-[#6366F1] transition-colors"
              >
                DONE
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="animate-spin w-4 h-4 border-2 border-[#6366F1] border-t-transparent mx-auto mb-2" />
            <p className="font-mono text-xs text-[#6B7280]">Loading invite information...</p>
          </div>
        )}
      </div>
    </BrutalModal>
  )
}
