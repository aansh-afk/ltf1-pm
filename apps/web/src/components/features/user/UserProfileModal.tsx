import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api' 
import { HiOutlineX, HiOutlineUser, HiOutlineMail, HiOutlineCalendar, HiOutlineCode, HiOutlineClock, HiOutlineLocationMarker, HiOutlineGlobeAlt, HiOutlineLink, HiOutlineBadgeCheck } from 'react-icons/hi'
import BrutalAvatar from '../../ui/BrutalAvatar'
import DeveloperStatusIndicator from '../developer/DeveloperStatusIndicator'
import BrutalBadge from '../../ui/BrutalBadge'
import LoadingSpinner from '../../common/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'skills'>('profile')

  const user = useQuery(api.auth.users.getUserById, userId ? { userId: userId as any } : 'skip')
  const profile = useQuery(api.developers.queries.getDeveloperProfile, userId ? { userId: userId as any } : 'skip')

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-event-horizon/90 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-24px">
        <div className="bg-carbon-plate border-2 border-basalt-border shadow-brutal-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-24px border-b-2 border-basalt-border">
            <h2 className="text-brutal-lg font-bold uppercase">USER PROFILE</h2>
            <button
              onClick={onClose}
              className="brutal-hover p-8px"
            >
              <HiOutlineX className="w-20px h-20px" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {!user || !profile ? (
              <div className="p-48px text-center">
                <LoadingSpinner size="lg" />
                <p className="text-brutal-sm text-cathode-white/60 mt-16px">LOADING PROFILE...</p>
              </div>
            ) : (
              <>
                {/* User Info Header */}
                <div className="p-24px border-b-2 border-basalt-border">
                  <div className="flex items-start gap-24px">
                    <BrutalAvatar
                      size="xl"
                      src={user.avatarUrl}
                      name={user.name || user.email}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-12px mb-8px">
                        <h3 className="text-brutal-xl font-bold">{user.name || 'UNNAMED USER'}</h3>
                        {profile.isVerified && (
                          <HiOutlineBadgeCheck className="w-20px h-20px text-brutal-success" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-8px mb-12px">
                        <HiOutlineMail className="w-16px h-16px text-cathode-white/60" />
                        <span className="text-brutal-sm text-cathode-white/80 font-mono">{user.email}</span>
                      </div>

                      <div className="flex items-center gap-16px mb-16px">
                        <DeveloperStatusIndicator 
                          status={profile.status} 
                          lastSeen={profile.lastSeen}
                          size="md"
                        />
                        {profile.location && (
                          <div className="flex items-center gap-4px text-brutal-xs text-cathode-white/60">
                            <HiOutlineLocationMarker className="w-12px h-12px" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                      </div>

                      {profile.bio && (
                        <p className="text-brutal-sm text-cathode-white/80 max-w-md">{profile.bio}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b-2 border-basalt-border">
                  <div className="flex">
                    {[
                      { id: 'profile', label: 'PROFILE', icon: HiOutlineUser },
                      { id: 'activity', label: 'ACTIVITY', icon: HiOutlineClock },
                      { id: 'skills', label: 'SKILLS', icon: HiOutlineCode }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={clsx(
                          'flex items-center gap-8px px-24px py-16px text-brutal-sm font-mono uppercase',
                          'border-r-2 border-basalt-border transition-colors',
                          activeTab === tab.id
                            ? 'bg-event-horizon text-primary-brutalist'
                            : 'hover:bg-event-horizon/50'
                        )}
                      >
                        <tab.icon className="w-16px h-16px" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-24px">
                  {activeTab === 'profile' && (
                    <div className="space-y-24px">
                      {/* Basic Info */}
                      <div>
                        <h4 className="text-brutal-md font-bold mb-16px">BASIC INFO</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16px">
                          <div className="space-y-12px">
                            <InfoItem
                              icon={HiOutlineCalendar}
                              label="JOINED"
                              value={formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }).toUpperCase()}
                            />
                            {profile.timezone && (
                              <InfoItem
                                icon={HiOutlineGlobeAlt}
                                label="TIMEZONE"
                                value={profile.timezone}
                              />
                            )}
                          </div>
                          <div className="space-y-12px">
                            {profile.githubUsername && (
                              <InfoItem
                                icon={HiOutlineLink}
                                label="GITHUB"
                                value={`@${profile.githubUsername}`}
                                link={`https://github.com/${profile.githubUsername}`}
                              />
                            )}
                            {profile.linkedinUrl && (
                              <InfoItem
                                icon={HiOutlineLink}
                                label="LINKEDIN"
                                value="VIEW PROFILE"
                                link={profile.linkedinUrl}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Work Preferences */}
                      {profile.workPreferences && (
                        <div>
                          <h4 className="text-brutal-md font-bold mb-16px">WORK PREFERENCES</h4>
                          <div className="bg-event-horizon p-16px border-2 border-basalt-border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12px text-brutal-sm">
                              <div>
                                <span className="text-cathode-white/60">COMMUNICATION:</span>{' '}
                                <span className="uppercase">{profile.workPreferences.communicationStyle}</span>
                              </div>
                              <div>
                                <span className="text-cathode-white/60">WORK HOURS:</span>{' '}
                                <span className="uppercase">{profile.workPreferences.workingHours}</span>
                              </div>
                              <div>
                                <span className="text-cathode-white/60">FOCUS TIME:</span>{' '}
                                <span className="uppercase">{profile.workPreferences.focusTime}</span>
                              </div>
                              <div>
                                <span className="text-cathode-white/60">AVAILABILITY:</span>{' '}
                                <span className="uppercase">{profile.workPreferences.availability}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-16px">
                      <h4 className="text-brutal-md font-bold">RECENT ACTIVITY</h4>
                      <div className="text-center py-32px text-cathode-white/60">
                        <HiOutlineClock className="w-48px h-48px mx-auto mb-16px" />
                        <p>Activity tracking coming soon...</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'skills' && (
                    <div className="space-y-24px">
                      {/* Tech Stack */}
                      {profile.techStack && profile.techStack.length > 0 && (
                        <div>
                          <h4 className="text-brutal-md font-bold mb-16px">TECH STACK</h4>
                          <div className="flex flex-wrap gap-8px">
                            {profile.techStack.map((tech: any) => (
                              <div key={tech.name} className="flex items-center gap-8px">
                                <BrutalBadge variant="info" size="sm">
                                  {tech.name}
                                </BrutalBadge>
                                <div className="flex gap-1px">
                                  {[1, 2, 3, 4, 5].map(level => (
                                    <div
                                      key={level}
                                      className={clsx(
                                        'w-8px h-8px',
                                        level <= tech.level ? 'bg-primary-brutalist' : 'bg-basalt-border'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expertise Areas */}
                      {profile.expertiseAreas && profile.expertiseAreas.length > 0 && (
                        <div>
                          <h4 className="text-brutal-md font-bold mb-16px">EXPERTISE AREAS</h4>
                          <div className="flex flex-wrap gap-8px">
                            {profile.expertiseAreas.map((area: string) => (
                              <BrutalBadge key={area} variant="success" size="sm">
                                {area}
                              </BrutalBadge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GitHub Stats */}
                      {profile.githubStats && (
                        <div>
                          <h4 className="text-brutal-md font-bold mb-16px">GITHUB STATS</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-16px">
                            <StatCard
                              label="REPOS"
                              value={profile.githubStats.publicRepos}
                            />
                            <StatCard
                              label="FOLLOWERS"
                              value={profile.githubStats.followers}
                            />
                            <StatCard
                              label="FOLLOWING"
                              value={profile.githubStats.following}
                            />
                            <StatCard
                              label="GISTS"
                              value={profile.githubStats.publicGists}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function InfoItem({ icon: Icon, label, value, link }: {
  icon: any
  label: string
  value: string
  link?: string
}) {
  const content = (
    <div className="flex items-center gap-8px">
      <Icon className="w-16px h-16px text-cathode-white/60" />
      <span className="text-brutal-xs text-cathode-white/60">{label}:</span>
      <span className="text-brutal-sm font-mono">{value}</span>
    </div>
  )

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary-brutalist transition-colors"
      >
        {content}
      </a>
    )
  }

  return content
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-event-horizon border-2 border-basalt-border p-16px text-center">
      <div className="text-brutal-lg font-bold text-primary-brutalist">{value}</div>
      <div className="text-brutal-xs text-cathode-white/60">{label}</div>
    </div>
  )
}