import React, { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string | undefined

let initialized = false

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const didInit = useRef(false)
  const { isSignedIn } = useAuth()
  const { user: clerkUser } = useUser()

  useEffect(() => {
    if (didInit.current || initialized) return
    if (!POSTHOG_KEY) return

    didInit.current = true
    initialized = true

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST || 'https://us.i.posthog.com',
      autocapture: true,
      capture_pageview: true,
    })
  }, [])

  // Identify user when signed in
  useEffect(() => {
    if (!POSTHOG_KEY || !initialized) return

    if (isSignedIn && clerkUser) {
      posthog.identify(clerkUser.id, {
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName || clerkUser.firstName,
        created_at: clerkUser.createdAt?.toISOString(),
      })
    } else if (!isSignedIn) {
      posthog.reset()
    }
  }, [isSignedIn, clerkUser])

  return <>{children}</>
}

export function usePostHog() {
  return posthog
}
