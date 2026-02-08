import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  const user = useQuery(api.auth.users.getUserById, userId ? { userId: userId as any } : 'skip')
  const profile = useQuery(api.developers.queries.getDeveloperProfile, userId ? { userId: userId as any } : 'skip')

  useEffect(() => {
    // Create or get portal container
    let container = document.getElementById('modal-portal')
    if (!container) {
      container = document.createElement('div')
      container.id = 'modal-portal'
      container.style.position = 'fixed'
      container.style.top = '0'
      container.style.left = '0'
      container.style.width = '100%'
      container.style.height = '100%'
      container.style.pointerEvents = 'none'
      container.style.zIndex = '10000'
      document.body.appendChild(container)
    }
    setPortalElement(container)
    
    return () => {
      // Don't remove the container as other modals might use it
    }
  }, [])

  if (!isOpen || !portalElement) return null

  const modalContent = (
    <div style={{ pointerEvents: 'auto' }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[var(--theme-background-secondary)]/90" 
        style={{ zIndex: 9998 }}
        onClick={onClose} 
      />
      
      {/* Modal - Higher z-index to prevent conflicts */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-[16px]" 
        style={{ zIndex: 9999, pointerEvents: 'none' }}
      >
        <div 
          className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-brutal-lg max-w-2xl w-full max-h-[90vh] overflow-hidden" 
          style={{ pointerEvents: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-[16px] border-b-2 border-[var(--theme-border)]">
            <h2 className="text-[14px] font-semibold font-bold uppercase">USER PROFILE</h2>
            <button
              onClick={onClose}
              className="brutal-hover p-[8px]"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {!user || !profile ? (
              <div className="p-[24px] text-center">
                <LoadingSpinner size="lg" />
                <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mt-[8px]">LOADING PROFILE...</p>
              </div>
            ) : (
              <>
                {/* User Info Header */}
                <div className="p-[16px] border-b-2 border-[var(--theme-border)]">
                  <div className="flex items-start gap-[16px]">
                    <BrutalAvatar
                      size="xl"
                      src={user.avatarUrl}
                      name={user.name || user.email}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-[6px] mb-[8px]">
                        <h3 className="text-[16px] font-bold font-bold">{user.name || 'UNNAMED USER'}</h3>
                        {profile.isVerified && (
                          <HiOutlineBadgeCheck className="w-5 h-5 text-brutal-success" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-[8px] mb-[6px]">
                        <HiOutlineMail className="w-4 h-4 text-[var(--theme-foreground)]/60" />
                        <span className="text-brutal-sm text-[var(--theme-foreground)]/80 font-mono">{user.email}</span>
                      </div>

                      <div className="flex items-center gap-[8px] mb-[8px]">
                        <DeveloperStatusIndicator 
                          status={profile.status} 
                          lastSeen={profile.lastSeen}
                          size="md"
                        />
                        {profile.location && (
                          <div className="flex items-center gap-4px text-brutal-xs text-[var(--theme-foreground)]/60">
                            <HiOutlineLocationMarker className="w-[12px] h-[12px]" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                      </div>

                      {profile.bio && (
                        <p className="text-brutal-sm text-[var(--theme-foreground)]/80 max-w-md">{profile.bio}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b-2 border-[var(--theme-border)]">
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
                          'flex items-center gap-[8px] px-[12px] py-[8px] text-brutal-sm font-mono uppercase',
                          'border-r-2 border-[var(--theme-border)] transition-colors',
                          activeTab === tab.id
                            ? 'bg-[var(--theme-background-secondary)] text-primary-brutalist'
                            : 'hover:bg-[var(--theme-background-secondary)]/50'
                        )}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-[16px]">
                  {activeTab === 'profile' && (
                    <div className="space-y-[12px]">
                      {/* Basic Info */}
                      <div>
                        <h4 className="text-brutal-md font-bold mb-[8px]">BASIC INFO</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[8px]">
                          <div className="space-y-[6px]">
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
                          <div className="space-y-[6px]">
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
                          <h4 className="text-brutal-md font-bold mb-[8px]">WORK PREFERENCES</h4>
                          <div className="bg-[var(--theme-background-secondary)] p-[10px] border-2 border-[var(--theme-border)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[6px] text-brutal-sm">
                              <div>
                                <span className="text-[var(--theme-foreground)]/60">COMMUNICATION:</span>{' '}
                                <span className="uppercase">{profile.workPreferences.communicationStyle}</span>
                              </div>
                              <div>
                                <span className="text-[var(--theme-foreground)]/60">WORK HOURS:</span>{' '}
                                <span className="uppercase">{profile.workPreferences.workingHours}</span>
                              </div>
                              <div>
                                <span className="text-[var(--theme-foreground)]/60">FOCUS TIME:</span>{' '}
                                <span className="uppercase">{profile.workPreferences.focusTime}</span>
                              </div>
                              <div>
                                <span className="text-[var(--theme-foreground)]/60">AVAILABILITY:</span>{' '}
                                <span className="uppercase">{profile.workPreferences.availability}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-[8px]">
                      <h4 className="text-brutal-md font-bold">RECENT ACTIVITY</h4>
                      <div className="text-center py-[16px] text-[var(--theme-foreground)]/60">
                        <HiOutlineClock className="w-6 h-6 mx-auto mb-[8px]" />
                        <p>Activity tracking coming soon...</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'skills' && (
                    <div className="space-y-[12px]">
                      {/* Tech Stack */}
                      {profile.techStack && profile.techStack.length > 0 && (
                        <div>
                          <h4 className="text-brutal-md font-bold mb-[8px]">TECH STACK</h4>
                          <div className="flex flex-wrap gap-[8px]">
                            {profile.techStack.map((tech: any) => (
                              <div key={tech.name} className="flex items-center gap-[8px]">
                                <BrutalBadge variant="info" size="sm">
                                  {tech.name}
                                </BrutalBadge>
                                <div className="flex gap-1px">
                                  {[1, 2, 3, 4, 5].map(level => (
                                    <div
                                      key={level}
                                      className={clsx(
                                        'w-[8px] h-[8px]',
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
                          <h4 className="text-brutal-md font-bold mb-[8px]">EXPERTISE AREAS</h4>
                          <div className="flex flex-wrap gap-[8px]">
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
                          <h4 className="text-brutal-md font-bold mb-[8px]">GITHUB STATS</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-[8px]">
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
    </div>
  )

  return createPortal(modalContent, portalElement)
}

function InfoItem({ icon: Icon, label, value, link }: {
  icon: any
  label: string
  value: string
  link?: string
}) {
  const content = (
    <div className="flex items-center gap-[8px]">
      <Icon className="w-4 h-4 text-[var(--theme-foreground)]/60" />
      <span className="text-brutal-xs text-[var(--theme-foreground)]/60">{label}:</span>
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
    <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] p-[10px] text-center">
      <div className="text-[14px] font-semibold font-bold text-primary-brutalist">{value}</div>
      <div className="text-brutal-xs text-[var(--theme-foreground)]/60">{label}</div>
    </div>
  )
}