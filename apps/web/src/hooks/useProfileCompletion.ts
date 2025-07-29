import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { useState, useEffect, useMemo } from 'react'

export function useProfileCompletion() {
  const profile = useQuery(api.developers.queries.getMyProfile)
  const [dismissed, setDismissed] = useState(false)
  const [sessionPromptShown, setSessionPromptShown] = useState(false)

  // Load dismissed state from localStorage
  useEffect(() => {
    if (profile?.hasProfile) {
      // If they have a profile, check if they've dismissed prompts
      const dismissedUntil = localStorage.getItem(`profile-prompt-dismissed-${profile._id}`)
      if (dismissedUntil) {
        const dismissedDate = new Date(dismissedUntil)
        if (dismissedDate > new Date()) {
          setDismissed(true)
        }
      }
    }
  }, [profile])

  const shouldShowPrompt = useMemo(() => {
    if (!profile || dismissed || sessionPromptShown) return false
    
    // Don't prompt if loading
    if (!profile.hasProfile) {
      // No profile exists yet - show prompt after they've been on the app for a bit
      const accountAge = Date.now() - profile.createdAt
      const ONE_HOUR = 60 * 60 * 1000
      return accountAge > ONE_HOUR
    }
    
    // Profile exists - check completeness
    return profile.profile.profileCompleteness < 50
  }, [profile, dismissed, sessionPromptShown])

  const dismissPrompt = (duration?: 'session' | 'day' | 'week') => {
    setSessionPromptShown(true)
    
    if (!profile) return
    
    if (duration === 'day') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      localStorage.setItem(`profile-prompt-dismissed-${profile._id}`, tomorrow.toISOString())
      setDismissed(true)
    } else if (duration === 'week') {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      localStorage.setItem(`profile-prompt-dismissed-${profile._id}`, nextWeek.toISOString())
      setDismissed(true)
    }
    // 'session' just sets sessionPromptShown which resets on page reload
  }

  return {
    profile: profile?.profile,
    hasProfile: profile?.hasProfile || false,
    shouldShowPrompt,
    completeness: profile?.profile?.profileCompleteness || 0,
    dismissPrompt,
  }
}