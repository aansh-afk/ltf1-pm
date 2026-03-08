import { useState, useEffect } from 'react'
import ComingSoonPage from '@/pages/ComingSoonPage'

export default function ProductionAccessGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)

  // Check if access gate is enabled and get the secret code from env
  const isGateEnabled = import.meta.env.VITE_ENABLE_ACCESS_GATE === 'true'
  const secretCode = import.meta.env.VITE_ACCESS_CODE || '668588907'

  useEffect(() => {
    // Skip if gate is not enabled
    if (!isGateEnabled) {
      setIsUnlocked(true)
      return
    }

    // Check if user already unlocked this session
    const unlocked = sessionStorage.getItem('ltf1_access_unlocked')
    if (unlocked === 'true') {
      setIsUnlocked(true)
    }
  }, [isGateEnabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (code === secretCode) {
      // Success! Unlock access
      sessionStorage.setItem('ltf1_access_unlocked', 'true')
      setIsUnlocked(true)
      setError('')
    } else {
      // Wrong code
      setAttempts(prev => prev + 1)
      setError('WRONG CODE')
      setCode('')

      // Add a little humor based on attempts
      setTimeout(() => {
        if (attempts === 0) {
          setError('NICE TRY → CHECK YOUR ACCESS CODE')
        } else if (attempts === 1) {
          setError('STILL WRONG → MAYBE ASK THE TEAM?')
        } else if (attempts >= 2) {
          setError('PERSISTENT, WE LIKE THAT → BUT STILL WRONG')
        }
      }, 1000)
    }
  }

  // If gate is disabled or user is unlocked, show content
  if (!isGateEnabled || isUnlocked) {
    return <>{children}</>
  }

  // Show access gate (Coming Soon Page)
  return <ComingSoonPage />
}
