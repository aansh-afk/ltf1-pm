import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../lib/convex'
import { useEffect } from 'react'

export function useAuth() {
  const { user, isLoaded } = useUser()
  const createOrUpdateUser = useMutation(api.auth.users.createOrUpdateUser)
  const currentUser = useQuery(api.auth.users.getCurrentUser)

  useEffect(() => {
    if (isLoaded && user) {
      createOrUpdateUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || user.firstName || 'Anonymous',
        avatarUrl: user.imageUrl,
      }).catch(console.error)
    }
  }, [isLoaded, user, createOrUpdateUser])

  return {
    isLoaded,
    isAuthenticated: !!user,
    user: currentUser,
    clerkUser: user,
  }
}