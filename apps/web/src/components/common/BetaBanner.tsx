import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'ltf1-beta-banner-dismissed'

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(true) // default true to prevent flash

  useEffect(() => {
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
    setDismissed(isDismissed)
  }, [])

  if (dismissed) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 h-8"
      style={{
        backgroundColor: '#111111',
        borderBottom: '1px solid var(--theme-border)',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div className="flex items-center gap-2 text-xs text-[#F59E0B]">
        <span>⚠</span>
        <span>EARLY ACCESS — LTF1 is in active development. Expect rapid changes.</span>
      </div>
      <button
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, 'true')
          setDismissed(true)
        }}
        className="text-[#6B7280] hover:text-[#9CA3AF] text-xs font-mono transition-colors"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  )
}
