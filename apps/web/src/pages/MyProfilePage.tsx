import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HiOutlineUser,
  HiOutlinePencil,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineCode,
  HiOutlineBriefcase,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineIdentification,
  HiOutlineChip,
  HiOutlineTerminal
} from 'react-icons/hi'
import DeveloperStatusIndicator from '../components/features/developer/DeveloperStatusIndicator'
import { EditDeveloperProfileModal } from '../components/features/profile/EditDeveloperProfileModal'
import { GitHubProfileSection } from '../components/features/profile/GitHubProfileSection'
import clsx from 'clsx'
import BrutalCard from '../components/ui/BrutalCard'
import BrutalButton from '../components/ui/BrutalButton'
import BrutalBadge from '../components/ui/BrutalBadge'

import { useProfileCompletion } from '../hooks/useProfileCompletion'

export default function MyProfilePage() {
  const [showEditModal, setShowEditModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Check for edit query param
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('edit') === 'true') {
      setShowEditModal(true)
      // Clean up the URL without reloading
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [location])

  // Get current user
  const currentUser = useQuery(api.auth.users.getCurrentUser)

  // Get developer profile
  const developerProfile = useQuery(
    api.developers.queries.getDeveloperProfile,
    currentUser ? { userId: currentUser._id } : 'skip'
  )

  const { profileComplete, missingFields } = useProfileCompletion()

  // Show onboarding modal for users without profiles
  useEffect(() => {
    if (currentUser && developerProfile === null) {
      setShowEditModal(true)
    }
  }, [currentUser, developerProfile])

  // Check for redirect after profile completion
  useEffect(() => {
    if (profileComplete) {
      const redirectPath = sessionStorage.getItem('profile-completion-redirect')
      if (redirectPath) {
        sessionStorage.removeItem('profile-completion-redirect')
        navigate(redirectPath)
      }
    }
  }, [profileComplete, navigate])

  if (!currentUser) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm animate-pulse">Loading Profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-7xl mx-auto min-h-screen bg-[var(--theme-background)]">
      {/* Profile Completion Banner */}
      {!profileComplete && (
        <div className="mb-4">
          <BrutalCard variant="glitch" className="bg-[var(--theme-error)]/10 border-[var(--theme-error)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <HiOutlineExclamationCircle className="w-6 h-6 text-[var(--theme-error)] animate-pulse" />
                <div>
                  <h3 className="font-bold text-[var(--theme-error)] uppercase tracking-wider">Profile Incomplete</h3>
                  <p className="font-mono text-xs text-[var(--theme-foreground)]/80">
                    {missingFields.length > 0
                      ? `Missing data: ${missingFields.join(', ')}`
                      : "Please complete your profile to access all features."}
                  </p>
                </div>
              </div>
              <BrutalButton
                variant="danger"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                COMPLETE PROFILE
              </BrutalButton>
            </div>
          </BrutalCard>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-4 border-b-2 border-[var(--theme-border)] pb-3 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 flex items-center gap-4">
            <HiOutlineIdentification className="w-8 h-8 md:w-10 md:h-10 text-[var(--theme-primary)]" />
            MY PROFILE
          </h1>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-widest pl-2">
            USER ID: <span className="text-[var(--theme-primary)]">{currentUser._id}</span>
          </p>
        </div>
        <BrutalButton
          variant="secondary"
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2"
        >
          <HiOutlinePencil className="w-4 h-4" />
          EDIT PROFILE
        </BrutalButton>
      </div>

      {/* Profile Content */}
      {developerProfile ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

          {/* LEFT COLUMN - IDENTITY & STATUS (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <BrutalCard variant="bordered" className="relative overflow-hidden">
              <div className="flex flex-col items-center text-center mb-3 relative z-10 pt-4">
                <div className="w-32 h-32 bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-primary)] flex items-center justify-center mb-4 relative group overflow-hidden rounded-full">
                  <HiOutlineUser className="w-16 h-16 text-[var(--theme-primary)] group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-[var(--theme-primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <h2 className="text-xl font-bold uppercase tracking-wider mb-1">{currentUser.name || 'UNKNOWN AGENT'}</h2>
                <p className="font-mono text-sm text-[var(--theme-primary)] mb-4">
                  {developerProfile.profile?.role?.toUpperCase() || 'UNASSIGNED ROLE'}
                </p>

                <div className="w-full border-t border-[var(--theme-border)] my-4" />

                <div className="w-full flex justify-between items-center px-4">
                  <span className="font-mono text-xs opacity-60">CURRENT STATUS</span>
                  <DeveloperStatusIndicator userId={currentUser._id} size="sm" showLabel={true} />
                </div>
              </div>
            </BrutalCard>

            {/* Availability Matrix */}
            <BrutalCard variant="default">
              <h3 className="font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <HiOutlineClock className="w-5 h-5" /> Availability
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-2 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
                  <span className="flex items-center gap-2"><HiOutlineGlobeAlt /> TIMEZONE</span>
                  <span className="text-[var(--theme-info)]">{developerProfile.profile?.timezone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-2 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
                  <span className="flex items-center gap-2"><HiOutlineClock /> HOURS</span>
                  <span>
                    {developerProfile.profile?.workingHours
                      ? `${developerProfile.profile.workingHours.start} - ${developerProfile.profile.workingHours.end}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
                  <span className="flex items-center gap-2"><HiOutlineBriefcase /> STATUS</span>
                  <span className="text-[var(--theme-success)]">{developerProfile.profile?.availability || 'N/A'}</span>
                </div>
              </div>
            </BrutalCard>
          </div>

          {/* RIGHT COLUMN - DETAILS & STATS (8 cols) */}
          <div className="lg:col-span-8 space-y-3">

            {/* Bio Section */}
            <BrutalCard variant="elevated">
              <h3 className="font-bold uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-[var(--theme-border)] pb-2">
                <HiOutlineTerminal className="w-5 h-5" /> Bio
              </h3>
              <p className="font-mono text-sm leading-relaxed text-[var(--theme-foreground)]/80 whitespace-pre-wrap">
                {developerProfile.profile?.bio || '// NO BIOGRAPHICAL DATA AVAILABLE'}
              </p>
            </BrutalCard>

            {/* Tech Stack Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <BrutalCard variant="default">
                <h3 className="font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <HiOutlineChip className="w-5 h-5" /> Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {developerProfile.profile?.technologies && developerProfile.profile.technologies.length > 0 ? (
                    developerProfile.profile.technologies.map((tech: any) => (
                      <BrutalBadge
                        key={tech.name}
                        variant={
                          tech.level === 'expert' ? 'success' :
                            tech.level === 'proficient' ? 'info' : 'warning'
                        }
                      >
                        {tech.name} [{tech.level.substring(0, 3).toUpperCase()}]
                      </BrutalBadge>
                    ))
                  ) : (
                    <span className="font-mono text-xs opacity-50">// NO TECH STACK DEFINED</span>
                  )}
                </div>
              </BrutalCard>

              <BrutalCard variant="default">
                <h3 className="font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <HiOutlineCode className="w-5 h-5" /> Skills & Interests
                </h3>
                <div className="space-y-2">
                  <div>
                    <div className="font-mono text-[10px] opacity-60 mb-2">SKILLS</div>
                    <div className="flex flex-wrap gap-2">
                      {developerProfile.profile?.skills?.map((skill: string) => (
                        <span key={skill} className="px-2 py-1 border border-[var(--theme-border)] text-[10px] font-mono uppercase hover:bg-[var(--theme-primary)] hover:text-black transition-colors cursor-default">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] opacity-60 mb-2">INTERESTS</div>
                    <div className="flex flex-wrap gap-2">
                      {developerProfile.profile?.interests?.map((interest: string) => (
                        <span key={interest} className="px-2 py-1 border border-[var(--theme-border)] text-[10px] font-mono uppercase hover:bg-[var(--theme-info)] hover:text-black transition-colors cursor-default">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </BrutalCard>
            </div>

            {/* GitHub Stats */}
            <GitHubProfileSection
              userId={currentUser._id}
              isProfileComplete={profileComplete}
              onConnect={() => {
                window.location.reload();
              }}
            />

          </div>
        </div>
      ) : (
        // No Profile State
        <BrutalCard variant="glitch" className="p-8 text-center border-dashed">
          <HiOutlineUser className="w-24 h-24 text-[var(--theme-foreground)]/20 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-3">PROFILE NOT FOUND</h2>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 mb-4 max-w-md mx-auto">
            Create your developer profile to initialize your identity within the system. This is required for team assignment.
          </p>
          <BrutalButton
            variant="primary"
            onClick={() => setShowEditModal(true)}
          >
            CREATE PROFILE
          </BrutalButton>
        </BrutalCard>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditDeveloperProfileModal
          userId={currentUser._id}
          onClose={() => {
            setShowEditModal(false)
          }}
        />
      )}
    </div>
  )
}