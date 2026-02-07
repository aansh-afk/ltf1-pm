import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

interface UseAfkDetectionOptions {
  afkTimeout?: number // milliseconds before marking as AFK (default: 5 minutes)
  awayTimeout?: number // milliseconds before marking as AWAY (default: 15 minutes)
  enabled?: boolean
}

export function useAfkDetection({
  afkTimeout = 5 * 60 * 1000, // 5 minutes
  awayTimeout = 15 * 60 * 1000, // 15 minutes
  enabled = true
}: UseAfkDetectionOptions = {}) {
  const updateStatus = useMutation(api.developers.mutations.updateStatus)
  const lastActivityRef = useRef(Date.now())
  const statusRef = useRef<string>('AVAILABLE')
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) return

    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      
      // If status was not AVAILABLE, update to AVAILABLE
      if (statusRef.current !== 'AVAILABLE') {
        statusRef.current = 'AVAILABLE'
        updateStatus({ status: 'AVAILABLE' }).catch(console.error)
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set timeout for AFK detection
      timeoutRef.current = setTimeout(() => {
        const timeSinceActivity = Date.now() - lastActivityRef.current
        
        if (timeSinceActivity >= awayTimeout) {
          // User has been inactive for 15+ minutes
          if (statusRef.current !== 'AWAY') {
            statusRef.current = 'AWAY'
            updateStatus({ status: 'AWAY' }).catch(console.error)
          }
        } else if (timeSinceActivity >= afkTimeout) {
          // User has been inactive for 5+ minutes
          if (statusRef.current !== 'AFK') {
            statusRef.current = 'AFK'
            updateStatus({ status: 'AFK' }).catch(console.error)
          }
        }
      }, afkTimeout)
    }

    // Activity events to monitor - split by passive capability
    const activeEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'click'
    ]
    // These events benefit from passive listeners for better scroll perf
    const passiveEvents = [
      'scroll',
      'touchstart'
    ]

    // Add event listeners
    activeEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })
    passiveEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { capture: true, passive: true })
    })

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, mark as AFK after timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          if (statusRef.current !== 'AFK') {
            statusRef.current = 'AFK'
            updateStatus({ status: 'AFK' }).catch(console.error)
          }
        }, 30000) // 30 seconds when tab is hidden
      } else {
        // Tab is visible again
        handleActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Initial activity
    handleActivity()

    // Cleanup
    return () => {
      activeEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      passiveEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, { capture: true } as EventListenerOptions)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [afkTimeout, awayTimeout, enabled, updateStatus])

  // Return current status in case component needs it
  return statusRef.current
}