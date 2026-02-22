import { useState, useEffect } from 'react'

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('ltf1-beta-banner-dismissed')
    if (stored === 'true') setDismissed(true)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('ltf1-beta-banner-dismissed', 'true')
  }

  if (dismissed) return null

  return (
    <div className="w-full bg-[var(--theme-card,#111111)] border-b border-[var(--theme-border,#2E2E35)] px-4 py-2 flex items-center justify-center gap-3 relative" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <span className="text-[#F59E0B] text-xs font-medium tracking-wider uppercase">
        EARLY ACCESS
      </span>
      <span className="text-[var(--theme-foreground-secondary,#9CA3AF)] text-xs">
        LTF1 is in active development. Features may change rapidly.
      </span>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-foreground-tertiary,#6B7280)] hover:text-[var(--theme-foreground,#F9FAFB)] text-xs transition-colors"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  )
}
