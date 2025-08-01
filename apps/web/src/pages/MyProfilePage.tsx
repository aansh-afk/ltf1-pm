import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useNavigate } from 'react-router-dom'
import { 
  HiOutlineUser, 
  HiOutlinePencil,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineCode,
  HiOutlineBriefcase,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineChartBar
} from 'react-icons/hi'
import DeveloperStatusIndicator from '../components/features/developer/DeveloperStatusIndicator'
import { EditDeveloperProfileModal } from '../components/features/profile/EditDeveloperProfileModal'
import { GitHubProfileSection } from '../components/features/profile/GitHubProfileSection'
import clsx from 'clsx'

export default function MyProfilePage() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const navigate = useNavigate()
  
  // Get current user
  const currentUser = useQuery(api.auth.users.getCurrentUser)
  
  // Get developer profile
  const developerProfile = useQuery(
    api.developers.queries.getDeveloperProfile,
    currentUser ? { userId: currentUser._id } : 'skip'
  )
  
  // Get GitHub stats to check if connected
  const githubStats = useQuery(
    api.integrations.github.queries.getDeveloperGitHubStats,
    currentUser ? { userId: currentUser._id } : 'skip'
  )

  // Check if profile is complete
  const isProfileComplete = () => {
    if (!developerProfile?.profile) return false
    
    const profile = developerProfile.profile
    return !!(
      profile.role &&
      profile.technologies &&
      profile.technologies.length > 0 &&
      profile.timezone &&
      githubStats !== null // GitHub must be connected
    )
  }

  // Show onboarding modal for users without profiles
  useEffect(() => {
    if (currentUser && developerProfile === null) {
      setShowOnboardingModal(true)
      setShowEditModal(true)
    }
  }, [currentUser, developerProfile])

  // Check for redirect after profile completion
  useEffect(() => {
    if (isProfileComplete()) {
      const redirectPath = sessionStorage.getItem('profile-completion-redirect')
      if (redirectPath) {
        sessionStorage.removeItem('profile-completion-redirect')
        navigate(redirectPath)
      }
    }
  }, [developerProfile])

  if (!currentUser) {
    return (
      <div className="p-24px">
        <div className="text-brutal-lg">Loading...</div>
      </div>
    )
  }

  const profileComplete = isProfileComplete()

  return (
    <div className="p-24px max-w-4xl mx-auto">
      {/* Profile Completion Banner */}
      {!profileComplete && (
        <div className="mb-24px p-16px bg-brutal-error border-2 border-basalt-border flex items-center justify-between">
          <div className="flex items-center gap-16px">
            <HiOutlineExclamationCircle className="w-24px h-24px text-event-horizon" />
            <div>
              <h3 className="text-brutal-md font-bold text-event-horizon">COMPLETE YOUR PROFILE</h3>
              <p className="text-brutal-sm text-event-horizon/80">
                A complete profile helps your team find the right person for tasks and code reviews.
                {!githubStats && " Don't forget to connect your GitHub account!"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-24px py-12px bg-event-horizon text-brutal-error border-2 border-event-horizon
                     font-mono text-brutal-sm uppercase tracking-wider
                     hover:bg-brutal-error/90 transition-colors"
          >
            COMPLETE NOW
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-32px">
        <div>
          <h1 className="text-brutal-2xl font-bold mb-8px">MY DEVELOPER PROFILE</h1>
          <p className="text-brutal-sm text-primary-brutalist/80">
            Manage your professional profile and expertise
          </p>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="brutal-btn flex items-center gap-8px"
        >
          <HiOutlinePencil className="w-16px h-16px" />
          EDIT PROFILE
        </button>
      </div>

      {/* Profile Content */}
      {developerProfile ? (
        <div className="space-y-24px">
          {/* Status and Basic Info */}
          <div className="brutal-card p-24px">
            <div className="flex items-start justify-between mb-24px">
              <div className="flex items-center gap-16px">
                <div className="w-64px h-64px bg-primary-brutalist/20 border-2 border-primary-brutalist flex items-center justify-center">
                  <HiOutlineUser className="w-32px h-32px text-primary-brutalist" />
                </div>
                <div>
                  <h2 className="text-brutal-lg font-bold">{currentUser.name || 'UNNAMED DEVELOPER'}</h2>
                  <p className="text-brutal-sm text-primary-brutalist/80">
                    {developerProfile.profile?.role || 'No role set'}
                  </p>
                  <div className="mt-8px">
                    <DeveloperStatusIndicator userId={currentUser._id} size="md" showLabel={true} />
                  </div>
                </div>
              </div>
              {profileComplete && (
                <div className="flex items-center gap-8px text-brutal-success">
                  <HiOutlineCheckCircle className="w-20px h-20px" />
                  <span className="font-mono text-brutal-sm">PROFILE COMPLETE</span>
                </div>
              )}
            </div>

            {/* Bio Section */}
            {developerProfile.profile?.bio && (
              <div className="mb-24px">
                <h3 className="font-mono text-brutal-xs font-bold mb-8px">ABOUT ME</h3>
                <p className="text-brutal-sm text-cathode-white/80 whitespace-pre-wrap">
                  {developerProfile.profile.bio}
                </p>
              </div>
            )}

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16px">
              <div className="p-16px bg-event-horizon border border-basalt-border">
                <div className="flex items-center gap-8px mb-8px">
                  <HiOutlineGlobeAlt className="w-16px h-16px text-primary-brutalist" />
                  <span className="font-mono text-brutal-xs">TIMEZONE</span>
                </div>
                <p className="font-mono text-brutal-sm">{developerProfile.profile?.timezone || 'NOT SET'}</p>
              </div>
              
              <div className="p-16px bg-event-horizon border border-basalt-border">
                <div className="flex items-center gap-8px mb-8px">
                  <HiOutlineClock className="w-16px h-16px text-primary-brutalist" />
                  <span className="font-mono text-brutal-xs">WORKING HOURS</span>
                </div>
                <p className="font-mono text-brutal-sm">
                  {developerProfile.profile?.workingHours 
                    ? `${developerProfile.profile.workingHours.start} - ${developerProfile.profile.workingHours.end}`
                    : 'NOT SET'}
                </p>
              </div>
              
              <div className="p-16px bg-event-horizon border border-basalt-border">
                <div className="flex items-center gap-8px mb-8px">
                  <HiOutlineBriefcase className="w-16px h-16px text-primary-brutalist" />
                  <span className="font-mono text-brutal-xs">AVAILABILITY</span>
                </div>
                <p className="font-mono text-brutal-sm">{developerProfile.profile?.availability || 'NOT SET'}</p>
              </div>
            </div>
          </div>

          {/* Expertise Section */}
          <div className="brutal-card p-24px">
            <h3 className="text-brutal-md font-bold mb-16px flex items-center gap-8px">
              <HiOutlineCode className="w-20px h-20px text-primary-brutalist" />
              TECHNICAL EXPERTISE
            </h3>
            
            {developerProfile.profile?.technologies && developerProfile.profile.technologies.length > 0 ? (
              <div className="flex flex-wrap gap-8px">
                {developerProfile.profile.technologies.map((tech: any) => (
                  <div
                    key={tech.name}
                    className={clsx(
                      "px-16px py-8px border-2 font-mono text-brutal-sm font-bold",
                      tech.level === 'expert' && "bg-brutal-success border-brutal-success text-event-horizon",
                      tech.level === 'proficient' && "bg-brutal-info border-brutal-info text-event-horizon",
                      tech.level === 'learning' && "bg-brutal-warning border-brutal-warning text-event-horizon"
                    )}
                  >
                    {tech.name} ({tech.level.toUpperCase()})
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brutal-sm text-primary-brutalist/60">
                No expertise added yet. Add your skills to help your team find you for the right tasks.
              </p>
            )}
          </div>

          {/* Skills & Interests */}
          {(developerProfile.profile?.skills?.length > 0 || developerProfile.profile?.interests?.length > 0) && (
            <div className="brutal-card p-24px">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-24px">
                {/* Skills */}
                {developerProfile.profile?.skills?.length > 0 && (
                  <div>
                    <h3 className="text-brutal-md font-bold mb-16px">SKILLS</h3>
                    <div className="flex flex-wrap gap-8px">
                      {developerProfile.profile.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-12px py-6px font-mono text-brutal-xs bg-primary-brutalist/20 border-2 border-primary-brutalist text-primary-brutalist font-bold"
                        >
                          {skill.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Interests */}
                {developerProfile.profile?.interests?.length > 0 && (
                  <div>
                    <h3 className="text-brutal-md font-bold mb-16px">INTERESTS</h3>
                    <div className="flex flex-wrap gap-8px">
                      {developerProfile.profile.interests.map((interest: string) => (
                        <span
                          key={interest}
                          className="px-12px py-6px font-mono text-brutal-xs bg-brutal-info/20 border-2 border-brutal-info text-brutal-info font-bold"
                        >
                          {interest.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Career & Work Style */}
          {(developerProfile.profile?.careerGoals || developerProfile.profile?.workStyle) && (
            <div className="brutal-card p-24px">
              <div className="space-y-24px">
                {developerProfile.profile?.careerGoals && (
                  <div>
                    <h3 className="text-brutal-md font-bold mb-8px">CAREER GOALS</h3>
                    <p className="text-brutal-sm text-cathode-white/80 whitespace-pre-wrap">
                      {developerProfile.profile.careerGoals}
                    </p>
                  </div>
                )}
                
                {developerProfile.profile?.workStyle && (
                  <div>
                    <h3 className="text-brutal-md font-bold mb-8px">WORK STYLE</h3>
                    <p className="text-brutal-sm text-cathode-white/80 whitespace-pre-wrap">
                      {developerProfile.profile.workStyle}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GitHub Stats */}
          <GitHubProfileSection 
            userId={currentUser._id} 
            isProfileComplete={profileComplete}
            onConnect={() => {
              // Refresh profile data after connecting GitHub
              window.location.reload();
            }}
          />
        </div>
      ) : (
        // No Profile State
        <div className="brutal-card p-48px text-center">
          <HiOutlineUser className="w-64px h-64px text-primary-brutalist/40 mx-auto mb-24px" />
          <h2 className="text-brutal-lg font-bold mb-16px">NO PROFILE FOUND</h2>
          <p className="text-brutal-sm text-primary-brutalist/60 mb-24px max-w-md mx-auto">
            Create your developer profile to help your team understand your expertise and availability.
          </p>
          <button
            onClick={() => setShowEditModal(true)}
            className="brutal-btn mx-auto"
          >
            CREATE YOUR PROFILE
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditDeveloperProfileModal
          userId={currentUser._id}
          onClose={() => {
            setShowEditModal(false)
            setShowOnboardingModal(false)
          }}
        />
      )}
    </div>
  )
}