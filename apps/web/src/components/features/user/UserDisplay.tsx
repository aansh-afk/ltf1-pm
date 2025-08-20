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
  size?: 'xs' | 'sm' | 'md' | 'lg'
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
          'flex items-center gap-8px text-[var(--theme-foreground)]/60',
          className
        )}
      >
        <div className={clsx(
          'border-2 border-dashed border-[var(--theme-border)] flex items-center justify-center',
          size === 'xs' && 'w-20px h-20px',
          size === 'sm' && 'w-24px h-24px',
          size === 'md' && 'w-32px h-32px',
          size === 'lg' && 'w-40px h-40px'
        )}>
          <HiOutlineUser className={clsx(
            size === 'xs' && 'w-10px h-10px',
            size === 'sm' && 'w-12px h-12px',
            size === 'md' && 'w-16px h-16px',
            size === 'lg' && 'w-20px h-20px'
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
        'flex items-center gap-8px animate-pulse',
        className
      )}>
        <div className={clsx(
          'bg-basalt-border',
          size === 'xs' && 'w-20px h-20px',
          size === 'sm' && 'w-24px h-24px',
          size === 'md' && 'w-32px h-32px',
          size === 'lg' && 'w-40px h-40px'
        )} />
        {showName && (
          <div className="h-14px bg-basalt-border w-64px" />
        )}
      </div>
    )
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={clsx(
          'flex items-center gap-8px cursor-pointer group relative',
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
              size === 'xs' && 'w-8px h-8px',
              size === 'sm' && 'w-10px h-10px',
              size === 'md' && 'w-12px h-12px',
              size === 'lg' && 'w-16px h-16px'
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
              size === 'lg' && 'text-brutal-md'
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
            size === 'xs' && 'w-12px h-12px',
            size === 'sm' && 'w-14px h-14px',
            size === 'md' && 'w-16px h-16px',
            size === 'lg' && 'w-20px h-20px'
          )} />
        </div>

        {/* Tooltip for compact mode */}
        {compact && showTooltip && (
          <div className="absolute left-full ml-8px px-8px py-4px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-50 pointer-events-none">
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