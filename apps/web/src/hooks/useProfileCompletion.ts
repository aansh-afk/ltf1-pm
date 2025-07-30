import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface ProfileCompletionOptions {
  enforceCompletion?: boolean // Redirect to profile page if incomplete
  excludePaths?: string[] // Paths to exclude from enforcement
}

export function useProfileCompletion(options: ProfileCompletionOptions = {}) {
  const { 
    enforceCompletion = false,
    excludePaths = ['/profile', '/sign-in', '/sign-up', '/']
  } = options

  const navigate = useNavigate()
  const location = useLocation()
  
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

  const profileComplete = isProfileComplete()

  // Get missing fields
  const getMissingFields = () => {
    const missing = []
    if (!developerProfile?.profile) {
      missing.push('entire profile')
    } else {
      const profile = developerProfile.profile
      if (!profile.role) missing.push('role')
      if (!profile.technologies || profile.technologies.length === 0) missing.push('expertise')
      if (!profile.timezone) missing.push('timezone')
    }
    return missing
  }

  // Enforce profile completion by redirecting
  useEffect(() => {
    if (
      enforceCompletion &&
      currentUser &&
      developerProfile !== undefined &&
      !profileComplete &&
      !excludePaths.includes(location.pathname)
    ) {
      // Store the intended destination
      sessionStorage.setItem('profile-completion-redirect', location.pathname)
      navigate('/profile')
    }
  }, [enforceCompletion, currentUser, developerProfile, profileComplete, location.pathname, navigate, excludePaths])

  return {
    isLoading: !currentUser || developerProfile === undefined,
    profileComplete,
    missingFields: getMissingFields(),
    needsProfile: currentUser && !developerProfile?.profile,
    profile: developerProfile?.profile
  }
}