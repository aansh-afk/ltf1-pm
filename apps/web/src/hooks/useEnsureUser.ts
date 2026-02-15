import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useAuth } from '@clerk/clerk-react'
import posthog from 'posthog-js'

export function useEnsureUser() {
  const { isSignedIn } = useAuth()
  const currentUser = useQuery(api.auth.users.getCurrentUser)
  const createCurrentUser = useMutation(api.auth.users.createCurrentUser)
  const [wasJustCreated, setWasJustCreated] = useState(false)
  
  useEffect(() => {
    if (isSignedIn && currentUser === null) {
      // User doesn't exist in Convex, create them
      console.log('Creating user in Convex...')
      setWasJustCreated(true) // Mark that we just created the user
      createCurrentUser().catch(console.error)
    } else if (currentUser !== null && wasJustCreated) {
      // User was created and now exists, reset the flag
      posthog.capture('user_created', {
        referrer: document.referrer || 'direct',
        landing_page: window.location.pathname,
      })
      setWasJustCreated(false)
    }
  }, [isSignedIn, currentUser, createCurrentUser, wasJustCreated])
  
  // Check if user has completed onboarding
  const hasCompletedOnboarding = currentUser?.preferences?.hasCompletedOnboarding === true
  
  // User is a first-time user only if they exist and haven't completed onboarding
  const isFirstTimeUser = currentUser !== null && currentUser !== undefined && !hasCompletedOnboarding
  
  return {
    user: currentUser,
    isLoading: isSignedIn && currentUser === undefined,
    isAuthenticated: isSignedIn && currentUser !== null,
    isFirstTimeUser
  }
}