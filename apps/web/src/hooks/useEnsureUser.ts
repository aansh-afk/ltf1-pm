import { useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../lib/convex'
import { useAuth } from '@clerk/clerk-react'

export function useEnsureUser() {
  const { isSignedIn } = useAuth()
  const currentUser = useQuery(api.auth.users.getCurrentUser)
  const createCurrentUser = useMutation(api.auth.users.createCurrentUser)
  
  useEffect(() => {
    if (isSignedIn && currentUser === null) {
      // User doesn't exist in Convex, create them
      console.log('Creating user in Convex...')
      createCurrentUser().catch(console.error)
    }
  }, [isSignedIn, currentUser, createCurrentUser])
  
  return {
    user: currentUser,
    isLoading: isSignedIn && currentUser === undefined,
    isAuthenticated: isSignedIn && currentUser !== null
  }
}