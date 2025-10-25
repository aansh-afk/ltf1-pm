import { useState, useEffect } from 'react'
import { useMobileDetection } from '../../hooks/useMobileDetection'

export default function WorkspaceMobileBlocker({ children }: { children: React.ReactNode }) {
  const { isSmallScreen } = useMobileDetection()
  const [choice, setChoice] = useState<'desktop' | 'urgent' | null>(null)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Check if user already made a choice this session
    const savedChoice = sessionStorage.getItem('ltf1_mobile_choice')
    if (savedChoice === 'urgent') {
      setChoice('urgent')
      setShowWarning(false)
    } else if (savedChoice === 'desktop') {
      setChoice('desktop')
    }
  }, [])

  const handleUrgentAccess = () => {
    sessionStorage.setItem('ltf1_mobile_choice', 'urgent')
    setChoice('urgent')
    setShowWarning(true)
    // Auto-hide warning after 5 seconds
    setTimeout(() => setShowWarning(false), 5000)
  }

  const handleDesktopChoice = () => {
    sessionStorage.setItem('ltf1_mobile_choice', 'desktop')
    setChoice('desktop')
  }

  const handleDismissDesktop = () => {
    sessionStorage.removeItem('ltf1_mobile_choice')
    setChoice(null)
  }

  // Don't block if not on mobile
  if (!isSmallScreen) {
    return <>{children}</>
  }

  // Don't block if user chose urgent access
  if (choice === 'urgent') {
    return (
      <>
        {showWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-brutal-warning text-event-horizon p-16px border-b-4 border-event-horizon">
            <div className="container mx-auto">
              <p className="text-sm font-bold uppercase text-center">
                ⚠️ YOU'VE BEEN WARNED → MOBILE UX IS BRUTAL
              </p>
            </div>
          </div>
        )}
        {children}
      </>
    )
  }

  // Show "come back on desktop" message if user chose that
  if (choice === 'desktop') {
    return (
      <div className="fixed inset-0 z-50 bg-event-horizon flex items-center justify-center p-24px">
        <div className="max-w-2xl w-full border-4 border-basalt-border bg-event-horizon p-32px md:p-48px">
          {/* Header */}
          <div className="text-center mb-32px">
            <div className="text-6xl mb-24px">💻</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-16px">
              <span className="bg-glitch-flare bg-clip-text text-transparent">
                SEE YOU ON DESKTOP
              </span>
            </h1>
            <p className="text-lg text-cathode-white/80 uppercase">
              SMART CHOICE
            </p>
          </div>

          {/* Body */}
          <div className="space-y-16px mb-32px text-cathode-white/80">
            <p className="text-base">
              LTF1 is built for serious project management. That means proper screen real estate,
              keyboard shortcuts, and workflows that don't make you want to throw your phone.
            </p>
            <p className="text-base">
              We're working on native iOS and Android apps that'll actually be worth using on mobile.
              Until then, crack open a laptop.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-12px">
            <button
              onClick={handleDismissDesktop}
              className="w-full brutal-btn bg-brutal-info text-event-horizon px-32px py-16px text-lg font-bold uppercase"
            >
              WAIT, I NEED URGENT ACCESS →
            </button>
            <p className="text-xs text-cathode-white/60 text-center uppercase">
              Changed your mind? We get it.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show initial choice screen
  return (
    <div className="fixed inset-0 z-50 bg-event-horizon flex items-center justify-center p-24px overflow-y-auto">
      <div className="max-w-3xl w-full border-4 border-basalt-border bg-event-horizon p-32px md:p-48px my-auto">
        {/* Header */}
        <div className="text-center mb-32px">
          <div className="text-6xl mb-24px">📱❌</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-16px">
            <span className="bg-glitch-flare bg-clip-text text-transparent">
              HOLD UP
            </span>
          </h1>
          <p className="text-lg text-cathode-white/80 uppercase">
            YOU'RE USING A PHONE
          </p>
        </div>

        {/* Body */}
        <div className="space-y-24px mb-40px">
          <div className="border-2 border-brutal-warning bg-brutal-warning/10 p-24px">
            <h2 className="text-xl font-bold text-brutal-warning mb-12px uppercase">
              LET'S BE REAL
            </h2>
            <p className="text-base text-cathode-white/80 mb-16px">
              You're smart. We're not gonna stop you. But the LTF1 workspace wasn't built for
              mobile screens. Think dashboards, kanban boards, sprint planning, real-time collaboration.
            </p>
            <p className="text-base text-cathode-white/80">
              On a phone? It's gonna be rough. Like, really rough.
            </p>
          </div>

          <div className="border-2 border-brutal-info bg-brutal-info/10 p-24px">
            <h2 className="text-xl font-bold text-brutal-info mb-12px uppercase">
              NATIVE APPS COMING SOON
            </h2>
            <p className="text-base text-cathode-white/80">
              We're building proper iOS and Android apps that'll actually make sense on mobile.
              Until then, LTF1 lives on desktop where it belongs.
            </p>
          </div>
        </div>

        {/* Choice Buttons */}
        <div className="space-y-16px">
          <button
            onClick={handleUrgentAccess}
            className="w-full brutal-btn bg-brutal-warning text-event-horizon px-32px py-20px text-lg font-bold uppercase border-4 border-brutal-warning hover:bg-brutal-warning/80 transition-colors"
          >
            I NEED URGENT ACCESS →
            <span className="block text-xs mt-8px normal-case font-normal">
              (I know it'll be terrible, let me through)
            </span>
          </button>

          <button
            onClick={handleDesktopChoice}
            className="w-full brutal-btn bg-brutal-success text-event-horizon px-32px py-20px text-lg font-bold uppercase border-4 border-brutal-success hover:bg-brutal-success/80 transition-colors"
          >
            I'LL USE DESKTOP →
            <span className="block text-xs mt-8px normal-case font-normal">
              (Smart move. Come back when you're on a real computer)
            </span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-32px pt-24px border-t-2 border-basalt-border">
          <p className="text-xs text-cathode-white/60 text-center uppercase">
            YOUR CHOICE, YOUR CONSEQUENCES → SESSION STORED
          </p>
        </div>
      </div>
    </div>
  )
}
