import { useState, useEffect } from 'react'

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

  // Show access gate
  return (
    <div className="fixed inset-0 z-[100] bg-event-horizon flex items-center justify-center p-24px overflow-y-auto">
      <div className="max-w-3xl w-full border-4 border-brutal-warning bg-event-horizon p-32px md:p-48px my-auto">
        {/* Header */}
        <div className="text-center mb-32px">
          <div className="text-6xl mb-24px">🔒</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-16px">
            <span className="bg-glitch-flare bg-clip-text text-transparent">
              EARLY ACCESS
            </span>
          </h1>
          <p className="text-lg md:text-xl text-cathode-white/80 uppercase">
            LTF1 IS UNDER CONSTRUCTION
          </p>
        </div>

        {/* Wholesome Message */}
        <div className="space-y-24px mb-40px">
          <div className="border-2 border-brutal-info bg-brutal-info/10 p-24px">
            <h2 className="text-xl font-bold text-brutal-info mb-12px uppercase">
              👋 WE SEE YOU
            </h2>
            <div className="space-y-12px text-base text-cathode-white/80">
              <p>
                Thanks for your enthusiasm! We're building LTF1 in public with the "make it exist,
                then make it better" mentality.
              </p>
              <p>
                Right now, the app is <span className="text-brutal-warning font-bold">half-baked but functional</span>.
                We're shipping features daily, breaking things occasionally, and learning constantly.
              </p>
              <p className="text-brutal-info font-bold">
                We love that you're here. Your patience means everything.
              </p>
            </div>
          </div>

          <div className="border-2 border-brutal-warning bg-brutal-warning/10 p-24px">
            <h2 className="text-xl font-bold text-brutal-warning mb-12px uppercase">
              🚧 WHAT TO EXPECT
            </h2>
            <div className="space-y-8px text-base text-cathode-white/80">
              <div className="flex items-start gap-8px">
                <div className="w-4px h-4px bg-brutal-warning mt-8px flex-shrink-0"></div>
                <span>Features might not work perfectly (or at all sometimes)</span>
              </div>
              <div className="flex items-start gap-8px">
                <div className="w-4px h-4px bg-brutal-warning mt-8px flex-shrink-0"></div>
                <span>UI is brutalist by design, bugs are not</span>
              </div>
              <div className="flex items-start gap-8px">
                <div className="w-4px h-4px bg-brutal-warning mt-8px flex-shrink-0"></div>
                <span>We ship fast, iterate faster</span>
              </div>
              <div className="flex items-start gap-8px">
                <div className="w-4px h-4px bg-brutal-warning mt-8px flex-shrink-0"></div>
                <span>Your feedback shapes the product</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-brutal-success bg-brutal-success/10 p-24px">
            <h2 className="text-xl font-bold text-brutal-success mb-12px uppercase">
              🎟️ EARLY ACCESS CODE
            </h2>
            <p className="text-base text-cathode-white/80 mb-16px">
              Got the secret code? Enter it below to access the workspace.
              Don't have it? Reach out to the team!
            </p>

            <form onSubmit={handleSubmit} className="space-y-12px">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ENTER ACCESS CODE"
                  className="w-full px-16px py-12px bg-event-horizon border-2 border-brutal-success text-cathode-white font-mono text-lg placeholder-cathode-white/40 focus:border-brutal-warning focus:outline-none uppercase text-center tracking-wider"
                  autoFocus
                  maxLength={20}
                />
              </div>

              {error && (
                <div className="bg-brutal-error/20 border-2 border-brutal-error px-16px py-12px">
                  <p className="text-brutal-error font-bold text-sm uppercase text-center">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full brutal-btn bg-brutal-success text-event-horizon px-32px py-16px text-lg font-bold uppercase border-4 border-brutal-success hover:bg-brutal-success/80 transition-colors"
              >
                UNLOCK ACCESS →
              </button>
            </form>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-32px pt-24px border-t-2 border-basalt-border text-center">
          <p className="text-xs text-cathode-white/60 uppercase mb-8px">
            BUILDING IN PUBLIC → SHIPPING DAILY
          </p>
          <p className="text-xs text-cathode-white/40 normal-case">
            Access code required for early access. Session-based authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
