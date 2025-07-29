import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import DeveloperStatusIndicator from './DeveloperStatusIndicator'
import clsx from 'clsx'
import { HiOutlineUser, HiOutlineClock, HiOutlineCode } from 'react-icons/hi'

interface DeveloperProfileCardProps {
  userId: string
  className?: string
  onClick?: () => void
}

export default function DeveloperProfileCard({
  userId,
  className,
  onClick,
}: DeveloperProfileCardProps) {
  const developerData = useQuery(api.developers.queries.getDeveloperProfile, { userId: userId as any })

  if (!developerData) {
    return (
      <div className={clsx(
        'bg-carbon-plate border-2 border-basalt-border p-24px',
        'animate-pulse',
        className
      )}>
        <div className="h-24px bg-basalt-border mb-16px" />
        <div className="h-16px bg-basalt-border w-3/4" />
      </div>
    )
  }

  const { profile, hasProfile } = developerData
  const topSkills = profile.techStack?.slice(0, 3) || []

  // If user has no profile, show prompt to create one
  if (!hasProfile) {
    return (
      <div 
        className={clsx(
          'bg-carbon-plate border-2 border-basalt-border p-24px',
          'hover:border-primary-brutalist transition-colors cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-16px">
          <h3 className="text-brutal-lg font-bold uppercase">{developerData.name}</h3>
          <DeveloperStatusIndicator status={profile.status || 'AVAILABLE'} showLabel />
        </div>
        
        <div className="text-cathode-white/60 text-brutal-sm mb-16px">
          No developer profile set up yet
        </div>
        
        <div className="text-brutal-xs uppercase text-primary-brutalist">
          Click to set up profile →
        </div>
      </div>
    )
  }

  return (
    <div 
      className={clsx(
        'bg-carbon-plate border-2 border-basalt-border p-24px',
        'hover:border-primary-brutalist transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Header with name and status */}
      <div className="flex items-center justify-between mb-16px">
        <h3 className="text-brutal-lg font-bold uppercase">{developerData.name}</h3>
        <DeveloperStatusIndicator status={profile.status || 'AVAILABLE'} showLabel />
      </div>
      
      {/* Status message if any */}
      {profile.statusMessage && (
        <div className="text-brutal-sm text-cathode-white/80 mb-16px font-mono">
          "{profile.statusMessage}"
        </div>
      )}
      
      {/* Current focus */}
      {profile.currentFocus && (
        <div className="mb-16px">
          <div className="text-brutal-xs text-primary-brutalist/60 uppercase mb-4px">
            CURRENT FOCUS
          </div>
          <div className="text-brutal-sm">{profile.currentFocus}</div>
        </div>
      )}
      
      {/* Tech stack */}
      {topSkills.length > 0 && (
        <div className="mb-16px">
          <div className="text-brutal-xs text-primary-brutalist/60 uppercase mb-8px">
            EXPERTISE
          </div>
          <div className="space-y-4px">
            {topSkills.map((tech) => (
              <div key={tech.name} className="flex items-center justify-between">
                <span className="text-brutal-sm font-mono">{tech.name}</span>
                <div className="flex items-center gap-8px">
                  <div className="h-8px bg-basalt-border" style={{ width: '80px' }}>
                    <div 
                      className={clsx(
                        'h-full',
                        tech.level === 'expert' ? 'bg-brutal-success' :
                        tech.level === 'proficient' ? 'bg-brutal-info' :
                        'bg-brutal-warning'
                      )}
                      style={{ 
                        width: tech.level === 'expert' ? '100%' :
                               tech.level === 'proficient' ? '66%' :
                               '33%'
                      }}
                    />
                  </div>
                  <span className="text-brutal-xs uppercase text-cathode-white/60">
                    {tech.level}
                  </span>
                </div>
              </div>
            ))}
            {profile.techStack && profile.techStack.length > 3 && (
              <div className="text-brutal-xs text-primary-brutalist/60 mt-4px">
                +{profile.techStack.length - 3} MORE
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Work hours */}
      {profile.workHours && (
        <div className="flex items-center gap-8px text-brutal-xs text-cathode-white/60">
          <HiOutlineClock className="w-16px h-16px" />
          <span>{profile.workHours.start} - {profile.workHours.end}</span>
          <span>({profile.timezone || 'UTC'})</span>
        </div>
      )}
      
      {/* Profile completeness */}
      <div className="mt-16px">
        <div className="flex justify-between text-brutal-xs mb-4px">
          <span className="text-primary-brutalist/60">PROFILE COMPLETENESS</span>
          <span className="font-mono">{profile.profileCompleteness}%</span>
        </div>
        <div className="h-4px bg-basalt-border">
          <div 
            className="h-full bg-primary-brutalist transition-all duration-300"
            style={{ width: `${profile.profileCompleteness}%` }}
          />
        </div>
      </div>
    </div>
  )
}