import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { HiOutlineUser, HiOutlineMail, HiOutlineCalendar, HiOutlineCode, HiOutlineClock, HiOutlineLocationMarker, HiOutlineGlobeAlt, HiOutlineLink, HiOutlineBadgeCheck } from 'react-icons/hi'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import BrutalAvatar from '@/components/ui/BrutalAvatar'
import BrutalModal from '@/components/ui/BrutalModal'
import DeveloperStatusIndicator from '@/components/features/developer/DeveloperStatusIndicator'
import BrutalBadge from '@/components/ui/BrutalBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

// --- Sub-components ---

function InfoItem({ icon: Icon, label, value, link }: {
  icon: React.ComponentType<{ className?: string }>
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

interface ProfileTabContentProps {
  user: { createdAt: number; email: string };
  profile: {
    timezone?: string;
    githubUsername?: string;
    linkedinUrl?: string;
    workPreferences?: {
      communicationStyle: string;
      workingHours: string;
      focusTime: string;
      availability: string;
    };
  };
}

function ProfileTabContent({ user, profile }: ProfileTabContentProps) {
  return (
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
  )
}

interface SkillsTabContentProps {
  profile: {
    techStack?: Array<{ name: string; level: number }>;
    expertiseAreas?: string[];
    githubStats?: {
      publicRepos: number;
      followers: number;
      following: number;
      publicGists: number;
    };
  };
}

function SkillsTabContent({ profile }: SkillsTabContentProps) {
  return (
    <div className="space-y-[12px]">
      {/* Tech Stack */}
      {profile.techStack && profile.techStack.length > 0 && (
        <div>
          <h4 className="text-brutal-md font-bold mb-[8px]">TECH STACK</h4>
          <div className="flex flex-wrap gap-[8px]">
            {profile.techStack.map((tech) => (
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
            <StatCard label="REPOS" value={profile.githubStats.publicRepos} />
            <StatCard label="FOLLOWERS" value={profile.githubStats.followers} />
            <StatCard label="FOLLOWING" value={profile.githubStats.following} />
            <StatCard label="GISTS" value={profile.githubStats.publicGists} />
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Component ---

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'skills'>('profile')

  const user = useQuery(api.auth.users.getUserById, userId ? { userId: userId as Id<"users"> } : 'skip')
  const profile = useQuery(api.developers.queries.getDeveloperProfile, userId ? { userId: userId as Id<"users"> } : 'skip')

  return (
    <BrutalModal isOpen={isOpen} onClose={onClose} title="USER PROFILE" size="lg">
      {/* Escape BrutalModal's default padding for full-width layout */}
      <div className="-mx-[16px] -mt-[16px]">
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
                    onClick={() => setActiveTab(tab.id as 'profile' | 'activity' | 'skills')}
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
                <ProfileTabContent user={user} profile={profile} />
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
                <SkillsTabContent profile={profile} />
              )}
            </div>
          </>
        )}
      </div>
    </BrutalModal>
  )
}
