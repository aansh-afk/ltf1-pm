import { useReducer } from 'react'
import { useMobileDetection } from '../../hooks/useMobileDetection'

interface MobileBlockerState {
  choice: 'desktop' | 'urgent' | null
  showWarning: boolean
}

type MobileBlockerAction =
  | { type: 'SET_URGENT' }
  | { type: 'SET_DESKTOP' }
  | { type: 'DISMISS_DESKTOP' }
  | { type: 'HIDE_WARNING' }

function mobileBlockerReducer(state: MobileBlockerState, action: MobileBlockerAction): MobileBlockerState {
  switch (action.type) {
    case 'SET_URGENT':
      return { choice: 'urgent', showWarning: true }
    case 'SET_DESKTOP':
      return { choice: 'desktop', showWarning: false }
    case 'DISMISS_DESKTOP':
      return { choice: null, showWarning: false }
    case 'HIDE_WARNING':
      return { ...state, showWarning: false }
    default:
      return state
  }
}

function getInitialState(): MobileBlockerState {
  const savedChoice = sessionStorage.getItem('ltf1_mobile_choice')
  if (savedChoice === 'urgent') {
    return { choice: 'urgent', showWarning: true }
  } else if (savedChoice === 'desktop') {
    return { choice: 'desktop', showWarning: false }
  }
  return { choice: null, showWarning: false }
}

export default function WorkspaceMobileBlocker({ children }: { children: React.ReactNode }) {
  const { isSmallScreen } = useMobileDetection()
  const [state, dispatch] = useReducer(mobileBlockerReducer, null, getInitialState)
  const { choice, showWarning } = state

  const handleUrgentAccess = () => {
    sessionStorage.setItem('ltf1_mobile_choice', 'urgent')
    dispatch({ type: 'SET_URGENT' })
  }

  const handleDesktopChoice = () => {
    sessionStorage.setItem('ltf1_mobile_choice', 'desktop')
    dispatch({ type: 'SET_DESKTOP' })
  }

  const handleDismissDesktop = () => {
    sessionStorage.removeItem('ltf1_mobile_choice')
    dispatch({ type: 'DISMISS_DESKTOP' })
  }

  // Don't block if not on mobile
  if (!isSmallScreen) {
    return <>{children}</>
  }

  // Don't block if user chose urgent access, but show persistent warning
  if (choice === 'urgent') {
    return (
      <>
        {showWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-brutal-warning text-event-horizon border-b-4 border-event-horizon">
            <div className="container mx-auto px-[10px] py-[6px]">
              <div className="flex items-center justify-between gap-[8px]">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-bold uppercase">
                    ⚠️ MOBILE UX WARNING → IOS/ANDROID APPS COMING SOON
                  </p>
                  <p className="text-xs text-event-horizon/80 mt-[2px] normal-case">
                    You chose this. Desktop recommended for best experience.
                  </p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'HIDE_WARNING' })}
                  className="text-event-horizon hover:text-event-horizon/60 font-bold text-sm px-[5px]"
                  aria-label="Dismiss warning"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
        <div className={showWarning ? 'pt-[72px] md:pt-[56px]' : ''}>
          {children}
        </div>
      </>
    )
  }

  // Show "come back on desktop" message if user chose that
  if (choice === 'desktop') {
    return (
      <div className="fixed inset-0 z-50 bg-event-horizon flex items-center justify-center p-[16px]">
        <div className="max-w-2xl w-full border-4 border-basalt-border bg-event-horizon p-[20px] md:p-[24px]">
          {/* Header */}
          <div className="text-center mb-[16px]">
            <div className="text-6xl mb-[12px]">💻</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-[8px]">
              <span className="bg-glitch-flare bg-clip-text text-transparent">
                SEE YOU ON DESKTOP
              </span>
            </h1>
            <p className="text-lg text-cathode-white/80 uppercase">
              SMART CHOICE
            </p>
          </div>

          {/* Body */}
          <div className="space-y-[8px] mb-[16px] text-cathode-white/80">
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
          <div className="space-y-[6px]">
            <button
              onClick={handleDismissDesktop}
              className="w-full brutal-btn bg-brutal-info text-event-horizon px-[16px] py-[8px] text-lg font-bold uppercase"
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
    <div className="fixed inset-0 z-50 bg-event-horizon flex items-center justify-center p-[16px] overflow-y-auto">
      <div className="max-w-3xl w-full border-4 border-basalt-border bg-event-horizon p-[20px] md:p-[24px] my-auto">
        {/* Header */}
        <div className="text-center mb-[16px]">
          <div className="text-6xl mb-[12px]">📱❌</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-[8px]">
            <span className="bg-glitch-flare bg-clip-text text-transparent">
              HOLD UP
            </span>
          </h1>
          <p className="text-lg text-cathode-white/80 uppercase">
            YOU'RE USING A PHONE
          </p>
        </div>

        {/* Body */}
        <div className="space-y-[12px] mb-[20px]">
          <div className="border-2 border-brutal-warning bg-brutal-warning/10 p-[16px]">
            <h2 className="text-xl font-bold text-brutal-warning mb-[6px] uppercase">
              LET'S BE REAL
            </h2>
            <p className="text-base text-cathode-white/80 mb-[8px]">
              You're smart. We're not gonna stop you. But the LTF1 workspace wasn't built for
              mobile screens. Think dashboards, kanban boards, sprint planning, real-time collaboration.
            </p>
            <p className="text-base text-cathode-white/80">
              On a phone? It's gonna be rough. Like, really rough.
            </p>
          </div>

          <div className="border-2 border-brutal-info bg-brutal-info/10 p-[16px]">
            <h2 className="text-xl font-bold text-brutal-info mb-[6px] uppercase">
              NATIVE APPS COMING SOON
            </h2>
            <p className="text-base text-cathode-white/80">
              We're building proper iOS and Android apps that'll actually make sense on mobile.
              Until then, LTF1 lives on desktop where it belongs.
            </p>
          </div>
        </div>

        {/* Choice Buttons */}
        <div className="space-y-[8px]">
          <button
            onClick={handleUrgentAccess}
            className="w-full brutal-btn bg-brutal-warning text-event-horizon px-[16px] py-[10px] text-lg font-bold uppercase border-4 border-brutal-warning hover:bg-brutal-warning/80 transition-colors"
          >
            I NEED URGENT ACCESS →
            <span className="block text-xs mt-[4px] normal-case font-normal">
              (I know it'll be terrible, let me through)
            </span>
          </button>

          <button
            onClick={handleDesktopChoice}
            className="w-full brutal-btn bg-brutal-success text-event-horizon px-[16px] py-[10px] text-lg font-bold uppercase border-4 border-brutal-success hover:bg-brutal-success/80 transition-colors"
          >
            I'LL USE DESKTOP →
            <span className="block text-xs mt-[4px] normal-case font-normal">
              (Smart move. Come back when you're on a real computer)
            </span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-[16px] pt-[12px] border-t-2 border-basalt-border">
          <p className="text-xs text-cathode-white/60 text-center uppercase">
            YOUR CHOICE, YOUR CONSEQUENCES → SESSION STORED
          </p>
        </div>
      </div>
    </div>
  )
}
