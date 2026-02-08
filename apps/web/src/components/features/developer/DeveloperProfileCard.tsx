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
        'bg-[#111111] border-2 border-[#2E2E35] p-4',
        'animate-pulse',
        className
      )}>
        <div className="h-4 bg-[#2E2E35] mb-2" />
        <div className="h-4 bg-[#2E2E35] w-3/4" />
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
          'bg-[#111111] border-2 border-[#2E2E35] p-4',
          'hover:border-[#6366F1] cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold uppercase text-[#F9FAFB]">{developerData.name}</h3>
          <DeveloperStatusIndicator status={profile.status || 'AVAILABLE'} showLabel />
        </div>

        <div className="text-xs text-[#6B7280] mb-2">
          No developer profile set up yet
        </div>

        <div className="text-xs uppercase text-[#6366F1] font-mono tracking-wider">
          Click to set up profile &rarr;
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'bg-[#111111] border-2 border-[#2E2E35] p-4',
        'hover:border-[#6366F1]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Header with name and status */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase text-[#F9FAFB]">{developerData.name}</h3>
        <DeveloperStatusIndicator status={profile.status || 'AVAILABLE'} showLabel />
      </div>

      {/* Status message if any */}
      {profile.statusMessage && (
        <div className="text-xs text-[#9CA3AF] mb-2 font-mono">
          &ldquo;{profile.statusMessage}&rdquo;
        </div>
      )}

      {/* Current focus */}
      {profile.currentFocus && (
        <div className="mb-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#6366F1]/60 mb-1">
            CURRENT FOCUS
          </div>
          <div className="text-xs text-[#F9FAFB]">{profile.currentFocus}</div>
        </div>
      )}

      {/* Tech stack */}
      {topSkills.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#6366F1]/60 mb-1.5">
            EXPERTISE
          </div>
          <div className="space-y-1">
            {topSkills.map((tech) => (
              <div key={tech.name} className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#F9FAFB]">{tech.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-[#2E2E35]" style={{ width: '60px' }}>
                    <div
                      className={clsx(
                        'h-full',
                        tech.level === 'expert' ? 'bg-[#22C55E]' :
                        tech.level === 'proficient' ? 'bg-[#6366F1]' :
                        'bg-[#F59E0B]'
                      )}
                      style={{
                        width: tech.level === 'expert' ? '100%' :
                               tech.level === 'proficient' ? '66%' :
                               '33%'
                      }}
                    />
                  </div>
                  <span className="text-[10px] uppercase text-[#6B7280] font-mono tracking-wider w-[70px] text-right">
                    {tech.level}
                  </span>
                </div>
              </div>
            ))}
            {profile.techStack && profile.techStack.length > 3 && (
              <div className="text-[10px] text-[#6366F1]/60 font-mono mt-1">
                +{profile.techStack.length - 3} MORE
              </div>
            )}
          </div>
        </div>
      )}

      {/* Work hours */}
      {profile.workHours && (
        <div className="flex items-center gap-2 text-[10px] text-[#6B7280] font-mono">
          <HiOutlineClock className="w-3.5 h-3.5" />
          <span>{profile.workHours.start} - {profile.workHours.end}</span>
          <span>({profile.timezone || 'UTC'})</span>
        </div>
      )}

      {/* Profile completeness */}
      <div className="mt-2 pt-2 border-t border-[#1F1F23]">
        <div className="flex justify-between text-[10px] mb-1 font-mono">
          <span className="text-[#6366F1]/60 uppercase tracking-wider">PROFILE COMPLETENESS</span>
          <span className="text-[#9CA3AF]">{profile.profileCompleteness}%</span>
        </div>
        <div className="h-1 bg-[#2E2E35]">
          <div
            className="h-full bg-[#6366F1]"
            style={{ width: `${profile.profileCompleteness}%` }}
          />
        </div>
      </div>
    </div>
  )
}
