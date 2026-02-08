import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { HiOutlineUser, HiOutlineInformationCircle } from 'react-icons/hi'
import BrutalAvatar from '../../ui/BrutalAvatar'
import DeveloperStatusIndicator from '../developer/DeveloperStatusIndicator'
import UserProfileModal from './UserProfileModal'
import clsx from 'clsx'

interface UserDisplayProps {
  userId?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  showStatus?: boolean
  showTooltip?: boolean
  onClick?: () => void
  className?: string
  compact?: boolean
}

export default function UserDisplay({
  userId,
  size = 'sm',
  showName = false,
  showStatus = false,
  showTooltip = true,
  onClick,
  className,
  compact = false
}: UserDisplayProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  const user = useQuery(
    api.auth.users.getUserById,
    userId ? { userId: userId as any } : 'skip'
  )
  
  const profile = useQuery(
    api.developers.queries.getDeveloperProfile,
    userId ? { userId: userId as any } : 'skip'
  )

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onClick) {
      onClick()
    } else if (userId) {
      setShowProfileModal(true)
    }
  }

  // Unassigned state
  if (!userId) {
    return (
      <div 
        className={clsx(
          'flex items-center gap-[8px] text-[var(--theme-foreground)]/60',
          className
        )}
      >
        <div className={clsx(
          'border-2 border-dashed border-[var(--theme-border)] flex items-center justify-center',
          size === 'xs' && 'w-5 h-5',
          size === 'sm' && 'w-6 h-6',
          size === 'md' && 'w-8 h-8',
          size === 'lg' && 'w-10 h-10',
          size === 'xl' && 'w-16 h-16'
        )}>
          <HiOutlineUser className={clsx(
            size === 'xs' && 'w-2.5 h-2.5',
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-8 h-8'
          )} />
        </div>
        {showName && (
          <span className="text-brutal-xs font-mono uppercase">UNASSIGNED</span>
        )}
      </div>
    )
  }

  // Loading state
  if (!user) {
    return (
      <div className={clsx(
        'flex items-center gap-[8px] animate-pulse',
        className
      )}>
        <div className={clsx(
          'bg-basalt-border',
          size === 'xs' && 'w-5 h-5',
          size === 'sm' && 'w-6 h-6',
          size === 'md' && 'w-8 h-8',
          size === 'lg' && 'w-10 h-10',
          size === 'xl' && 'w-16 h-16'
        )} />
        {showName && (
          <div className="h-[14px] bg-basalt-border w-8" />
        )}
      </div>
    )
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={clsx(
          'flex items-center gap-[8px] cursor-pointer group relative',
          'hover:bg-[var(--theme-background-secondary)]/20 transition-colors',
          compact ? 'p-2px' : 'p-4px',
          className
        )}
        title={showTooltip ? `${user.name || user.email} - Click to view profile` : undefined}
      >
        <div className="relative">
          <BrutalAvatar
            size={size}
            src={user.avatarUrl}
            name={user.name || user.email}
          />
          
          {/* Status indicator overlay */}
          {showStatus && (
            <div className={clsx(
              'absolute -bottom-1px -right-1px',
              size === 'xs' && 'w-2 h-2',
              size === 'sm' && 'w-2.5 h-2.5',
              size === 'md' && 'w-3 h-3',
              size === 'lg' && 'w-4 h-4',
              size === 'xl' && 'w-5 h-5'
            )}>
              <DeveloperStatusIndicator
                status={profile?.status}
                lastSeen={profile?.lastSeen}
                size="xs"
                showLabel={false}
              />
            </div>
          )}
        </div>

        {showName && (
          <div className="flex flex-col">
            <span className={clsx(
              'font-mono font-semibold text-[var(--theme-foreground)] group-hover:text-primary-brutalist transition-colors',
              size === 'xs' && 'text-brutal-xs',
              size === 'sm' && 'text-brutal-xs',
              size === 'md' && 'text-brutal-sm',
              size === 'lg' && 'text-brutal-md',
              size === 'xl' && 'text-brutal-lg'
            )}>
              {user.name || 'UNNAMED'}
            </span>
            {profile && !compact && (
              <span className="text-brutal-xs text-[var(--theme-foreground)]/60 uppercase">
                {profile.role || 'MEMBER'}
              </span>
            )}
          </div>
        )}

        {/* Hover indicator */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <HiOutlineInformationCircle className={clsx(
            'text-primary-brutalist',
            size === 'xs' && 'w-3 h-3',
            size === 'sm' && 'w-3.5 h-3.5',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-6 h-6'
          )} />
        </div>

        {/* Tooltip for compact mode */}
        {compact && showTooltip && (
          <div className="absolute left-full ml-[8px] px-[8px] py-4px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 pointer-events-none">
            <div className="text-brutal-xs">
              <div className="font-semibold">{user.name || user.email}</div>
              {profile && (
                <div className="text-[var(--theme-foreground)]/60">
                  {profile.role || 'Member'} • Click to view profile
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={userId}
        />
      )}
    </>
  )
}