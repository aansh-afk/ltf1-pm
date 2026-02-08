import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { 
  HiOutlineUser, 
  HiOutlineCog, 
  HiOutlineCode,
  HiOutlineClock,
  HiOutlineGlobeAlt,
  HiOutlineChartBar,
  HiOutlineBadgeCheck,
  HiOutlineBookOpen,
  HiOutlineHeart,
  HiOutlineLightningBolt,
  HiOutlineTerminal,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineChat,
  HiOutlineStar,
  HiOutlineClipboardCopy,
  HiOutlinePencil,
  HiOutlineRefresh
} from 'react-icons/hi'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import DeveloperStatusIndicator from '../components/features/developer/DeveloperStatusIndicator'
import { EditDeveloperProfileModal } from '../components/features/profile/EditDeveloperProfileModal'

export default function DeveloperProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'expertise' | 'github' | 'preferences'>('overview')

  // Get current user to check if this is their own profile
  const currentUser = useQuery(api.auth.users.getCurrentUser)
  const isOwnProfile = currentUser?._id === userId

  // Get developer profile data
  const profile = useQuery(
    api.developers.queries.getDeveloperProfile,
    userId ? { userId: userId as Id<"users"> } : 'skip'
  )

  // Get user's activity stats
  const activityStats = useQuery(
    api.activities.queries.getActivityStats,
    profile?.workspaceId ? { 
      workspaceId: profile.workspaceId,
      timeRange: "30d"
    } : 'skip'
  )

  // Mutations
  const updateStatus = useMutation(api.developers.mutations.updateStatus)
  const syncGithubStats = useMutation(api.developers.mutations.syncGithubStats)

  if (!userId) {
    return (
      <div className="p-[16px]">
        <div className="text-brutal-error">Invalid user ID</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-[16px]">
        <div className="brutal-card p-[24px] text-center">
          <div className="animate-pulse">Loading developer profile...</div>
        </div>
      </div>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!isOwnProfile) return
    await updateStatus({
      status: newStatus,
      customMessage: profile.status?.customMessage
    })
  }

  const handleSyncGithub = async () => {
    if (!isOwnProfile || !profile.githubUsername) return
    await syncGithubStats({
      githubUsername: profile.githubUsername
    })
  }

  const copyCoAuthorString = () => {
    if (!profile.name && !profile.email) return
    const coAuthorString = `Co-authored-by: ${profile.name || 'Unknown'} <${profile.email || 'unknown@example.com'}>`
    navigator.clipboard.writeText(coAuthorString)
  }

  const getExpertiseLevel = (level: number) => {
    if (level >= 8) return { label: 'EXPERT', color: 'text-brutal-success' }
    if (level >= 6) return { label: 'ADVANCED', color: 'text-brutal-info' }
    if (level >= 4) return { label: 'INTERMEDIATE', color: 'text-brutal-warning' }
    return { label: 'BEGINNER', color: 'text-primary-brutalist' }
  }

  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: HiOutlineUser },
    { id: 'expertise', label: 'EXPERTISE', icon: HiOutlineCode },
    { id: 'github', label: 'GITHUB', icon: HiOutlineChartBar },
    { id: 'preferences', label: 'PREFERENCES', icon: HiOutlineCog }
  ] as const

  return (
    <div className="space-y-[12px]">
      {/* Profile Header */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
        <div className="p-[16px] border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-[16px]">
              {/* Avatar */}
              <div className="w-80px h-80px bg-basalt-border border-2 border-[var(--theme-border)] flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.name || 'Developer'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <HiOutlineUser className="w-40px h-40px text-primary-brutalist" />
                )}
              </div>

              {/* Basic Info */}
              <div>
                <h1 className="text-[16px] font-bold font-bold mb-8px">
                  {profile.name || 'UNNAMED DEVELOPER'}
                </h1>
                <div className="flex items-center gap-[10px] mb-12px">
                  <span className="font-mono text-brutal-sm text-primary-brutalist/80">
                    {profile.role || 'DEVELOPER'}
                  </span>
                  {profile.location && (
                    <div className="flex items-center gap-4px">
                      <HiOutlineLocationMarker className="w-16px h-16px text-primary-brutalist/60" />
                      <span className="font-mono text-brutal-sm text-primary-brutalist/60">
                        {profile.location}
                      </span>
                    </div>
                  )}
                  {profile.timezone && (
                    <div className="flex items-center gap-4px">
                      <HiOutlineGlobeAlt className="w-16px h-16px text-primary-brutalist/60" />
                      <span className="font-mono text-brutal-sm text-primary-brutalist/60">
                        {profile.timezone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-[10px]">
                  <DeveloperStatusIndicator 
                    userId={userId as Id<"users">}
                    size="lg"
                    showLabel={true}
                  />
                  {isOwnProfile && (
                    <select
                      value={profile.status?.current || 'available'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="brutal-input text-xs px-8px py-4px"
                    >
                      <option value="available">AVAILABLE</option>
                      <option value="busy">BUSY</option>
                      <option value="away">AWAY</option>
                      <option value="dnd">DO NOT DISTURB</option>
                    </select>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-brutal-sm text-primary-brutalist/80 mt-12px max-w-500px">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-[6px]">
              <button
                onClick={copyCoAuthorString}
                className="brutal-btn-secondary flex items-center gap-8px px-[10px] py-8px"
                title="Copy git co-author string"
              >
                <HiOutlineClipboardCopy className="w-16px h-16px" />
                <span className="font-mono text-brutal-xs">COPY CO-AUTHOR</span>
              </button>
              
              {isOwnProfile && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="brutal-btn flex items-center gap-8px px-[10px] py-8px"
                >
                  <HiOutlinePencil className="w-16px h-16px" />
                  <span className="font-mono text-brutal-xs">EDIT PROFILE</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-8px px-[12px] py-[8px] font-mono text-brutal-sm font-bold transition-all border-r-2 border-[var(--theme-border)] last:border-r-0",
                  activeTab === tab.id
                    ? "bg-primary-brutalist text-event-horizon"
                    : "bg-[var(--theme-background)] text-primary-brutalist/80 hover:bg-[var(--theme-background-secondary)] hover:text-primary-brutalist"
                )}
              >
                <Icon className="w-16px h-16px" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
        {activeTab === 'overview' && (
          <div className="space-y-[12px]">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-[10px]">
              <div className="brutal-card p-[10px] text-center">
                <div className="text-[14px] font-semibold font-bold text-brutal-success">
                  {activityStats?.totalActivities || 0}
                </div>
                <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                  ACTIVITIES (30D)
                </div>
              </div>
              <div className="brutal-card p-[10px] text-center">
                <div className="text-[14px] font-semibold font-bold text-brutal-info">
                  {profile.techStack?.length || 0}
                </div>
                <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                  TECHNOLOGIES
                </div>
              </div>
              <div className="brutal-card p-[10px] text-center">
                <div className="text-[14px] font-semibold font-bold text-brutal-warning">
                  {profile.githubStats?.contributions || 0}
                </div>
                <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                  CONTRIBUTIONS
                </div>
              </div>
              <div className="brutal-card p-[10px] text-center">
                <div className="text-[14px] font-semibold font-bold text-primary-brutalist">
                  {profile.yearsExperience || 0}Y
                </div>
                <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                  EXPERIENCE
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {(profile.email || profile.phone || profile.githubUsername) && (
              <div className="brutal-card p-[16px]">
                <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                  <HiOutlineMail className="w-20px h-20px" />
                  CONTACT INFORMATION
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
                  {profile.email && (
                    <div className="flex items-center gap-[6px]">
                      <HiOutlineMail className="w-16px h-16px text-primary-brutalist/60" />
                      <span className="font-mono text-brutal-sm">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-[6px]">
                      <HiOutlinePhone className="w-16px h-16px text-primary-brutalist/60" />
                      <span className="font-mono text-brutal-sm">{profile.phone}</span>
                    </div>
                  )}
                  {profile.githubUsername && (
                    <div className="flex items-center gap-[6px]">
                      <HiOutlineCode className="w-16px h-16px text-primary-brutalist/60" />
                      <a 
                        href={`https://github.com/${profile.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-brutal-sm text-brutal-info hover:underline"
                      >
                        github.com/{profile.githubUsername}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {profile.lastActivity && (
              <div className="brutal-card p-[16px]">
                <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                  <HiOutlineClock className="w-20px h-20px" />
                  RECENT ACTIVITY
                </h3>
                <div className="font-mono text-brutal-sm text-primary-brutalist/80">
                  Last active: {formatDistanceToNow(new Date(profile.lastActivity), { addSuffix: true })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'expertise' && (
          <div className="space-y-[12px]">
            {/* Tech Stack */}
            {profile.techStack && profile.techStack.length > 0 && (
              <div className="brutal-card p-[16px]">
                <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                  <HiOutlineCode className="w-20px h-20px" />
                  TECHNOLOGY STACK
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[6px]">
                  {profile.techStack.map((tech, index) => {
                    const expertise = getExpertiseLevel(tech.level)
                    return (
                      <div key={index} className="flex items-center justify-between p-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]">
                        <span className="font-mono text-brutal-sm font-bold">{tech.name}</span>
                        <div className="flex items-center gap-8px">
                          <span className={clsx("font-mono text-brutal-xs font-bold", expertise.color)}>
                            {expertise.label}
                          </span>
                          <div className="flex">
                            {Array.from({ length: 10 }, (_, i) => (
                              <div
                                key={i}
                                className={clsx(
                                  "w-4px h-16px border-r border-[var(--theme-border)] last:border-r-0",
                                  i < tech.level ? "bg-primary-brutalist" : "bg-basalt-border"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Skills & Interests */}
            {(profile.skills || profile.interests) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                {profile.skills && profile.skills.length > 0 && (
                  <div className="brutal-card p-[16px]">
                    <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                      <HiOutlineBadgeCheck className="w-20px h-20px" />
                      SKILLS
                    </h3>
                    <div className="flex flex-wrap gap-8px">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-12px py-6px font-mono text-brutal-xs bg-primary-brutalist/20 border-2 border-primary-brutalist text-primary-brutalist font-bold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <div className="brutal-card p-[16px]">
                    <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                      <HiOutlineHeart className="w-20px h-20px" />
                      INTERESTS
                    </h3>
                    <div className="flex flex-wrap gap-8px">
                      {profile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-12px py-6px font-mono text-brutal-xs bg-brutal-info/20 border-2 border-brutal-info text-brutal-info font-bold"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Experience */}
            {profile.yearsExperience && (
              <div className="brutal-card p-[16px]">
                <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                  <HiOutlineBookOpen className="w-20px h-20px" />
                  EXPERIENCE
                </h3>
                <div className="text-[14px] font-semibold font-bold text-primary-brutalist">
                  {profile.yearsExperience} Years of Professional Development
                </div>
                {profile.careerLevel && (
                  <div className="font-mono text-brutal-sm text-primary-brutalist/80 mt-8px">
                    Career Level: {profile.careerLevel.replace('_', ' ').toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'github' && (
          <div className="space-y-[12px]">
            {/* GitHub Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-brutal-md font-bold flex items-center gap-8px">
                <HiOutlineChartBar className="w-20px h-20px" />
                GITHUB STATISTICS
              </h3>
              {isOwnProfile && profile.githubUsername && (
                <button
                  onClick={handleSyncGithub}
                  className="brutal-btn-secondary flex items-center gap-8px px-[10px] py-8px"
                >
                  <HiOutlineRefresh className="w-16px h-16px" />
                  <span className="font-mono text-brutal-xs">SYNC</span>
                </button>
              )}
            </div>

            {profile.githubUsername ? (
              <>
                {/* GitHub Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-[10px]">
                  <div className="brutal-card p-[10px] text-center">
                    <div className="text-[14px] font-semibold font-bold text-brutal-success">
                      {profile.githubStats?.contributions || 0}
                    </div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                      CONTRIBUTIONS
                    </div>
                  </div>
                  <div className="brutal-card p-[10px] text-center">
                    <div className="text-[14px] font-semibold font-bold text-brutal-info">
                      {profile.githubStats?.publicRepos || 0}
                    </div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                      REPOSITORIES
                    </div>
                  </div>
                  <div className="brutal-card p-[10px] text-center">
                    <div className="text-[14px] font-semibold font-bold text-brutal-warning">
                      {profile.githubStats?.followers || 0}
                    </div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                      FOLLOWERS
                    </div>
                  </div>
                  <div className="brutal-card p-[10px] text-center">
                    <div className="text-[14px] font-semibold font-bold text-primary-brutalist">
                      {profile.githubStats?.following || 0}
                    </div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                      FOLLOWING
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {profile.githubStats?.lastUpdated && (
                  <div className="brutal-card p-[16px]">
                    <h4 className="text-brutal-sm font-bold mb-12px">DATA FRESHNESS</h4>
                    <div className="font-mono text-brutal-sm text-primary-brutalist/80">
                      Last synced: {formatDistanceToNow(new Date(profile.githubStats.lastUpdated), { addSuffix: true })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="brutal-card p-[24px] text-center">
                <HiOutlineCode className="w-6 h-6 text-primary-brutalist/30 mx-auto mb-[8px]" />
                <h4 className="text-brutal-md font-bold mb-8px">NO GITHUB CONNECTED</h4>
                <p className="text-brutal-sm text-primary-brutalist/60 mb-[8px]">
                  Connect your GitHub account to display statistics and contributions.
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="brutal-btn"
                  >
                    CONNECT GITHUB
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-[12px]">
            {/* Work Preferences */}
            <div className="brutal-card p-[16px]">
              <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                <HiOutlineClock className="w-20px h-20px" />
                WORK PREFERENCES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <div>
                  <h4 className="font-mono text-brutal-sm font-bold mb-12px">AVAILABILITY</h4>
                  <div className="space-y-8px text-brutal-sm">
                    <div className="flex items-center justify-between">
                      <span>Timezone:</span>
                      <span className="font-mono">{profile.timezone || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Working Hours:</span>
                      <span className="font-mono">
                        {profile.workingHours?.start || '09:00'} - {profile.workingHours?.end || '17:00'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-mono text-brutal-sm font-bold mb-12px">COMMUNICATION</h4>
                  <div className="space-y-8px text-brutal-sm">
                    <div className="flex items-center justify-between">
                      <span>Preferred Method:</span>
                      <span className="font-mono">{profile.communicationPrefs || 'Email'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Response Time:</span>
                      <span className="font-mono">Within 24 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Preferences */}
            <div className="brutal-card p-[16px]">
              <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                <HiOutlineHeart className="w-20px h-20px" />
                PERSONAL PREFERENCES
              </h3>
              <div className="space-y-[8px]">
                <div>
                  <h4 className="font-mono text-brutal-sm font-bold mb-8px">WORK STYLE</h4>
                  <p className="text-brutal-sm text-primary-brutalist/80">
                    {profile.workStyle || 'No work style preferences specified.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-mono text-brutal-sm font-bold mb-8px">CAREER GOALS</h4>
                  <p className="text-brutal-sm text-primary-brutalist/80">
                    {profile.careerGoals || 'No career goals specified.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-mono text-brutal-sm font-bold mb-8px">MENTORING</h4>
                  <p className="text-brutal-sm text-primary-brutalist/80">
                    {profile.mentoringInterests ? 
                      `Interested in mentoring: ${profile.mentoringInterests.join(', ')}` :
                      'No mentoring interests specified.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            {isOwnProfile && (
              <div className="brutal-card p-[16px]">
                <h3 className="text-brutal-md font-bold mb-[8px] flex items-center gap-8px">
                  <HiOutlineCog className="w-20px h-20px" />
                  PRIVACY SETTINGS
                </h3>
                <div className="space-y-12px">
                  <label className="flex items-center gap-[6px]">
                    <input type="checkbox" className="brutal-checkbox" />
                    <span className="font-mono text-brutal-sm">Show email to team members</span>
                  </label>
                  <label className="flex items-center gap-[6px]">
                    <input type="checkbox" className="brutal-checkbox" />
                    <span className="font-mono text-brutal-sm">Show phone number to team members</span>
                  </label>
                  <label className="flex items-center gap-[6px]">
                    <input type="checkbox" className="brutal-checkbox" />
                    <span className="font-mono text-brutal-sm">Show GitHub profile publicly</span>
                  </label>
                  <label className="flex items-center gap-[6px]">
                    <input type="checkbox" className="brutal-checkbox" />
                    <span className="font-mono text-brutal-sm">Show activity status to team</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditDeveloperProfileModal
          userId={userId as Id<"users">}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}