import React, { useEffect, useRef } from 'react'
import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string | undefined

let initialized = false

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const didInit = useRef(false)

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

  return <>{children}</>
}

export function usePostHog() {
  return posthog
}
