import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { Link } from 'react-router-dom'
import { HiOutlineExclamationCircle, HiOutlineX } from 'react-icons/hi'
import { useState } from 'react'

export function ProfileCompletionBanner() {
  const [dismissed, setDismissed] = useState(() => {
    // Check if banner was dismissed in this session
    return sessionStorage.getItem('profile-banner-dismissed') === 'true'
  })

  // Get current user
  const currentUser = useQuery(api.auth.users.getCurrentUser)

  // Get developer profile
  const developerProfile = useQuery(
    api.developers.queries.getDeveloperProfile,
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
      profile.timezone
    )
  }

  // Don't show if dismissed, loading, or profile is complete
  if (dismissed || !currentUser || !developerProfile || isProfileComplete()) {
    return null
  }

  const handleDismiss = () => {
    sessionStorage.setItem('profile-banner-dismissed', 'true')
    setDismissed(true)
  }

  const missingFields = []
  if (!developerProfile.profile) {
    missingFields.push('profile')
  } else {
    const profile = developerProfile.profile
    if (!profile.role) missingFields.push('role')
    if (!profile.technologies || profile.technologies.length === 0) missingFields.push('expertise')
    if (!profile.timezone) missingFields.push('timezone')
  }

  return (
    <div className="bg-brutal-warning border-b-2 border-[var(--theme-border)]">
      <div className="px-24px py-12px flex items-center justify-between">
        <div className="flex items-center gap-16px flex-1">
          <HiOutlineExclamationCircle className="w-24px h-24px text-event-horizon flex-shrink-0" />
          <div className="flex-1">
            <p className="font-mono text-brutal-sm text-event-horizon">
              <span className="font-bold">PROFILE INCOMPLETE:</span> {' '}
              {missingFields.length === 1 && missingFields[0] === 'profile'
                ? 'Create your developer profile to enable smart task assignments and team collaboration.'
                : `Add your ${missingFields.join(', ')} to help your team find the right person for tasks.`
              }
            </p>
          </div>
          <Link
            to="/profile?edit=true"
            className="px-16px py-8px bg-[var(--theme-background-secondary)] text-brutal-warning border-2 border-event-horizon
                     font-mono text-brutal-xs uppercase tracking-wider font-bold
                     hover:bg-brutal-warning/90 transition-colors flex-shrink-0"
          >
            COMPLETE PROFILE
          </Link>
          <button
            onClick={handleDismiss}
            className="p-8px text-event-horizon hover:bg-[var(--theme-background-secondary)]/10 transition-colors"
            title="Dismiss for this session"
          >
            <HiOutlineX className="w-16px h-16px" />
          </button>
        </div>
      </div>
    </div>
  )
}