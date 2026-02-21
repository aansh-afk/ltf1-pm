import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useNavigate, useLocation, type NavigateFunction } from 'react-router-dom'

function handleProfileRedirect(profileComplete: boolean, navigate: NavigateFunction): void {
  if (!profileComplete) return
  const redirectPath = sessionStorage.getItem('profile-completion-redirect')
  if (redirectPath) {
    sessionStorage.removeItem('profile-completion-redirect')
    navigate(redirectPath)
  }
}
import {
  HiOutlineUser,
  HiOutlinePencil,
  HiOutlineExclamationCircle,
  HiOutlineCode,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineBriefcase,
  HiOutlineChip,
  HiOutlineTerminal
} from 'react-icons/hi'
import DeveloperStatusIndicator from '../components/features/developer/DeveloperStatusIndicator'
import { EditDeveloperProfileModal } from '../components/features/profile/EditDeveloperProfileModal'
import { GitHubProfileSection } from '../components/features/profile/GitHubProfileSection'
import BrutalCard from '../components/ui/BrutalCard'
import BrutalButton from '../components/ui/BrutalButton'
import BrutalBadge from '../components/ui/BrutalBadge'
import { useProfileCompletion } from '../hooks/useProfileCompletion'
import { m } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}

// ── Sub-components ──

interface IdentityCardProps {
  userName: string
  role: string
  userId: string
  userIdRaw: string
}

function IdentityCard({ userName, role, userId, userIdRaw }: IdentityCardProps) {
  return (
    <BrutalCard variant="default">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex items-center justify-center mb-3">
          <HiOutlineUser className="w-10 h-10 text-[var(--theme-foreground)]/20" />
        </div>

        <h2 className="text-base font-bold uppercase tracking-wider mb-0.5 text-[var(--theme-foreground)]">
          {userName}
        </h2>
        <p className="font-mono text-xs text-[var(--theme-primary)]">
          {role}
        </p>

        <div className="w-full border-t border-[var(--theme-border)] mt-3 pt-3">
          <div className="flex justify-between items-center px-1">
            <span className="font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase tracking-wider">STATUS</span>
            <DeveloperStatusIndicator userId={userId as any} size="sm" showLabel={true} />
          </div>
        </div>

        <div className="w-full border-t border-[var(--theme-border)] mt-3 pt-2">
          <span className="font-mono text-[10px] text-[var(--theme-foreground)]/20 break-all leading-tight block">
            {userIdRaw}
          </span>
        </div>
      </div>
    </BrutalCard>
  )
}

interface AvailabilityMatrixProps {
  timezone: string
  workingHours: { start: string; end: string } | undefined
  availability: string
}

function AvailabilityMatrix({ timezone, workingHours, availability }: AvailabilityMatrixProps) {
  return (
    <BrutalCard variant="default">
      <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-[var(--theme-foreground)]">
        <HiOutlineClock className="w-4 h-4" /> AVAILABILITY
      </h3>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center p-2 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase">
            <HiOutlineGlobeAlt className="w-3.5 h-3.5" /> TIMEZONE
          </span>
          <span className="font-mono text-[10px] text-[var(--theme-info)]">
            {timezone}
          </span>
        </div>
        <div className="flex justify-between items-center p-2 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase">
            <HiOutlineClock className="w-3.5 h-3.5" /> HOURS
          </span>
          <span className="font-mono text-[10px] text-[var(--theme-foreground)]">
            {workingHours
              ? `${workingHours.start} - ${workingHours.end}`
              : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center p-2 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase">
            <HiOutlineBriefcase className="w-3.5 h-3.5" /> STATUS
          </span>
          <span className="font-mono text-[10px] text-[var(--theme-success)]">
            {availability}
          </span>
        </div>
      </div>
    </BrutalCard>
  )
}

export default function MyProfilePage() {
  const [showEditModal, setShowEditModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Check for edit query param
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('edit') === 'true') {
      setShowEditModal(true)
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

  useEffect(() => {
    handleProfileRedirect(profileComplete, navigate)
  }, [profileComplete, navigate])

  if (!currentUser) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--theme-primary)] border-t-transparent animate-spin" />
          <p className="font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <m.div
      className="p-4 max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* Profile Completion Banner */}
      {!profileComplete && (
        <m.div variants={fadeUp} className="mb-3">
          <div className="border-2 border-[var(--theme-error)] bg-[var(--theme-error)]/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <HiOutlineExclamationCircle className="w-4 h-4 text-[var(--theme-error)] flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-[10px] font-bold text-[var(--theme-error)] uppercase tracking-wider">Profile Incomplete</h3>
                  <p className="font-mono text-[10px] text-[var(--theme-foreground)]/50 mt-0.5 truncate">
                    {missingFields.length > 0
                      ? `Missing: ${missingFields.join(', ')}`
                      : 'Complete your profile to access all features.'}
                  </p>
                </div>
              </div>
              <BrutalButton variant="danger" size="sm" onClick={() => setShowEditModal(true)}>
                COMPLETE
              </BrutalButton>
            </div>
          </div>
        </m.div>
      )}

      {/* Page Header */}
      <m.div variants={fadeUp} className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--theme-foreground)]/40 block mb-1">
            DEVELOPER PROFILE
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--theme-foreground)]">
            My Profile
          </h1>
        </div>
        <BrutalButton variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
          <span className="flex items-center gap-1.5">
            <HiOutlinePencil className="w-3.5 h-3.5" />
            EDIT PROFILE
          </span>
        </BrutalButton>
      </m.div>

      {/* Profile Content */}
      {developerProfile ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

          {/* LEFT COLUMN - Identity & Status */}
          <div className="lg:col-span-4 space-y-3">
            {/* Identity Card */}
            <m.div variants={fadeUp}>
              <IdentityCard
                userName={currentUser.name || 'UNKNOWN AGENT'}
                role={developerProfile.profile?.role?.toUpperCase() || 'UNASSIGNED ROLE'}
                userId={currentUser._id}
                userIdRaw={currentUser._id}
              />
            </m.div>

            {/* Availability Matrix */}
            <m.div variants={fadeUp}>
              <AvailabilityMatrix
                timezone={developerProfile.profile?.timezone || 'N/A'}
                workingHours={developerProfile.profile?.workingHours}
                availability={developerProfile.profile?.availability || 'N/A'}
              />
            </m.div>
          </div>

          {/* RIGHT COLUMN - Details & Stats */}
          <div className="lg:col-span-8 space-y-3">

            {/* Bio Section */}
            <m.div variants={fadeUp}>
              <BrutalCard variant="default">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-[var(--theme-foreground)] border-b border-[var(--theme-border)] pb-2">
                  <HiOutlineTerminal className="w-4 h-4" /> BIO
                </h3>
                <p className="font-mono text-xs leading-relaxed text-[var(--theme-foreground)]/70 whitespace-pre-wrap">
                  {developerProfile.profile?.bio || '// NO BIOGRAPHICAL DATA AVAILABLE'}
                </p>
              </BrutalCard>
            </m.div>

            {/* Tech Stack Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <m.div variants={fadeUp}>
                <BrutalCard variant="default" className="h-full">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-[var(--theme-foreground)]">
                    <HiOutlineChip className="w-4 h-4" /> TECHNOLOGIES
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {developerProfile.profile?.technologies && developerProfile.profile.technologies.length > 0 ? (
                      developerProfile.profile.technologies.map((tech: any) => (
                        <BrutalBadge
                          key={tech.name}
                          variant={
                            tech.level === 'expert' ? 'success' :
                              tech.level === 'proficient' ? 'info' : 'warning'
                          }
                          size="xs"
                        >
                          {tech.name} [{tech.level.substring(0, 3).toUpperCase()}]
                        </BrutalBadge>
                      ))
                    ) : (
                      <span className="font-mono text-[10px] text-[var(--theme-foreground)]/30">// NO TECH STACK DEFINED</span>
                    )}
                  </div>
                </BrutalCard>
              </m.div>

              <m.div variants={fadeUp}>
                <BrutalCard variant="default" className="h-full">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-[var(--theme-foreground)]">
                    <HiOutlineCode className="w-4 h-4" /> SKILLS & INTERESTS
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase tracking-wider mb-1.5">SKILLS</div>
                      <div className="flex flex-wrap gap-1.5">
                        {developerProfile.profile?.skills?.map((skill: string) => (
                          <span key={skill} className="px-2 py-0.5 border border-[var(--theme-border)] text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/70 hover:border-[var(--theme-primary)] cursor-default">
                            {skill}
                          </span>
                        ))}
                        {(!developerProfile.profile?.skills || developerProfile.profile.skills.length === 0) && (
                          <span className="font-mono text-[10px] text-[var(--theme-foreground)]/30">// NONE</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] text-[var(--theme-foreground)]/40 uppercase tracking-wider mb-1.5">INTERESTS</div>
                      <div className="flex flex-wrap gap-1.5">
                        {developerProfile.profile?.interests?.map((interest: string) => (
                          <span key={interest} className="px-2 py-0.5 border border-[var(--theme-border)] text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/70 hover:border-[var(--theme-info)] cursor-default">
                            {interest}
                          </span>
                        ))}
                        {(!developerProfile.profile?.interests || developerProfile.profile.interests.length === 0) && (
                          <span className="font-mono text-[10px] text-[var(--theme-foreground)]/30">// NONE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </BrutalCard>
              </m.div>
            </div>

            {/* GitHub Stats */}
            <m.div variants={fadeUp}>
              <GitHubProfileSection
                userId={currentUser._id}
                isProfileComplete={profileComplete}
                onConnect={() => {
                  window.location.reload();
                }}
              />
            </m.div>

          </div>
        </div>
      ) : (
        // No Profile State
        <m.div variants={fadeUp}>
          <div className="border-2 border-[var(--theme-border)] border-dashed p-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border-2 border-[var(--theme-border)] text-[var(--theme-foreground)]/20">
              <HiOutlineUser className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--theme-foreground)] mb-1 uppercase tracking-wider">Profile Not Found</h3>
            <p className="font-mono text-xs text-[var(--theme-foreground)]/40 mb-4 max-w-sm mx-auto">
              Create your developer profile to initialize your identity within the system. Required for team assignment.
            </p>
            <BrutalButton
              variant="primary"
              onClick={() => setShowEditModal(true)}
            >
              CREATE PROFILE
            </BrutalButton>
          </div>
        </m.div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditDeveloperProfileModal
          userId={currentUser._id}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
          }}
        />
      )}
    </m.div>
  )
}
