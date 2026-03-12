import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { HiOutlineUser, HiOutlineCalendar, HiOutlineOfficeBuilding } from 'react-icons/hi'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function JoinProjectPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const [manualCode, setManualCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  // Query to get project info by invite code
  const codeToUse = inviteCode || manualCode
  const projectInfo = useQuery(
    api.projects.queries.getProjectByInviteCode,
    codeToUse ? { inviteCode: codeToUse } : 'skip'
  )

  const joinProject = useMutation(api.projects.mutations.joinProjectByCode)

  const handleJoinProject = async () => {
    if (!codeToUse) {
      toast.error('Please enter a project invite code')
      return
    }

    setIsJoining(true)
    try {
      const result = await joinProject({ inviteCode: codeToUse })
      toast.success(`Successfully joined ${result.projectName}!`)
      
      // Navigate to the project page
      navigate(`/project/${result.projectId}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to join project')
    } finally {
      setIsJoining(false)
    }
  }

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) {
      toast.error('Please enter a project invite code')
      return
    }
    // The query will automatically run when manualCode changes
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[var(--theme-background-secondary)] flex items-center justify-center p-[16px]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-[16px]">
          <h1 className="text-[20px] font-bold mb-8px">JOIN PROJECT</h1>
          <p className="text-[var(--theme-foreground)]/60 text-brutal-sm">
            {inviteCode ? 'You have been invited to join a project' : 'Enter a project invite code to join'}
          </p>
        </div>

        {/* Manual Code Input (if no code in URL) */}
        {!inviteCode && (
          <form onSubmit={handleManualCodeSubmit} className="mb-[16px]">
            <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
              <label htmlFor="join-project-code" className="block text-brutal-sm mb-12px">PROJECT INVITE CODE</label>
              <input
                id="join-project-code"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter UUID or invite code..."
                className="w-full px-[10px] py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] 
                         font-mono text-brutal-md placeholder:text-neutral-600
                         focus:border-primary-brutalist focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="w-full mt-[8px] brutal-btn"
                disabled={!manualCode.trim()}
              >
                LOOKUP PROJECT
              </button>
            </div>
          </form>
        )}

        {/* Loading State */}
        {codeToUse && projectInfo === undefined && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[24px] text-center">
            <LoadingSpinner />
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mt-[8px]">
              Loading project information...
            </p>
          </div>
        )}

        {/* Invalid Code */}
        {codeToUse && projectInfo === null && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[24px] text-center">
            <div className="w-8 h-8 bg-brutal-error/20 border-2 border-brutal-error mx-auto mb-[12px] flex items-center justify-center">
              <span className="text-[20px] font-bold">❌</span>
            </div>
            <h2 className="text-[14px] font-semibold font-bold mb-12px text-brutal-error">INVALID INVITE CODE</h2>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mb-[12px]">
              The invite code you entered is invalid or has expired.
            </p>
            <button
              onClick={() => {
                setManualCode('')
                navigate('/join-project')
              }}
              className="brutal-btn-secondary"
            >
              TRY DIFFERENT CODE
            </button>
          </div>
        )}

        {/* Project Info Card */}
        {projectInfo && (
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
            {/* Project Header */}
            <div className="flex items-start gap-[8px] mb-[12px]">
              <div
                className="w-8 h-8 border-2 border-[var(--theme-border)] flex items-center justify-center text-[14px] font-semibold"
                style={{ backgroundColor: projectInfo.metadata?.color || 'var(--theme-info)' }}
              >
                {projectInfo.metadata?.icon || '📁'}
              </div>
              <div className="flex-1">
                <h2 className="text-[14px] font-semibold font-bold mb-4px">{projectInfo.name}</h2>
                <div className="flex items-center gap-4px text-brutal-xs text-[var(--theme-foreground)]/60 mb-8px">
                  <span className="font-mono">{projectInfo.key}</span>
                  <span>•</span>
                  <span className="capitalize">{projectInfo.visibility}</span>
                </div>
                {projectInfo.description && (
                  <p className="text-brutal-sm text-[var(--theme-foreground)]/80">
                    {projectInfo.description}
                  </p>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-[8px] mb-[16px]">
              {projectInfo.workspace && (
                <div className="flex items-center gap-[6px]">
                  <HiOutlineOfficeBuilding className="w-16px h-16px text-primary-brutalist" />
                  <span className="text-brutal-sm">
                    <span className="text-[var(--theme-foreground)]/60">Workspace:</span> {projectInfo.workspace.name}
                  </span>
                </div>
              )}

              {projectInfo.lead && (
                <div className="flex items-center gap-[6px]">
                  <HiOutlineUser className="w-16px h-16px text-primary-brutalist" />
                  <span className="text-brutal-sm">
                    <span className="text-[var(--theme-foreground)]/60">Project Lead:</span> {projectInfo.lead.name}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-[6px]">
                <HiOutlineCalendar className="w-16px h-16px text-primary-brutalist" />
                <span className="text-brutal-sm">
                  <span className="text-[var(--theme-foreground)]/60">Team Size:</span> {projectInfo.memberCount} members
                </span>
              </div>

              {projectInfo.teamSettings?.maxMembers && (
                <div className="flex items-center gap-[6px]">
                  <div className="w-16px h-16px flex items-center justify-center">
                    <div className="w-8px h-8px bg-primary-brutalist"></div>
                  </div>
                  <span className="text-brutal-sm">
                    <span className="text-[var(--theme-foreground)]/60">Max Members:</span> {projectInfo.teamSettings.maxMembers}
                  </span>
                </div>
              )}
            </div>

            {/* Join Button */}
            <div className="space-y-[8px]">
              <button
                onClick={handleJoinProject}
                disabled={isJoining}
                className="w-full brutal-btn"
              >
                {isJoining ? 'JOINING PROJECT...' : 'JOIN PROJECT'}
              </button>

              {projectInfo.teamSettings?.requireApproval && (
                <div className="bg-brutal-warning/10 border-2 border-brutal-warning p-[10px]">
                  <p className="text-brutal-xs text-brutal-warning">
                    ⚠️ This project requires approval to join. Your request will be sent to the project lead.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-[16px]">
          <button
            onClick={() => navigate('/')}
            className="text-primary-brutalist hover:text-[var(--theme-foreground)] transition-colors text-brutal-sm"
          >
            ← BACK TO DASHBOARD
          </button>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}