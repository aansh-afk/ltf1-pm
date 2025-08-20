import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useEffect } from 'react'

export function useAuth() {
  const { user, isLoaded } = useUser()
  const createCurrentUser = useMutation(api.auth.users.createCurrentUser)
  const currentUser = useQuery(api.auth.users.getCurrentUser)

  useEffect(() => {
    if (isLoaded && user && !currentUser) {
      // Only create user if it doesn't exist yet
      createCurrentUser({}).catch(console.error)
    }
  }, [isLoaded, user, currentUser, createCurrentUser])

  return {
    isLoaded,
    isAuthenticated: !!user,
    user: currentUser,
    clerkUser: user,
  }
}