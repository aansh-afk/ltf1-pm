import { useState, useEffect } from 'react'
import { useBugReporter } from '@/hooks/useBugReporter'
import BugReporterModal from '@/components/features/bug-reporter/BugReporterModal'

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(false)
  const bugReporter = useBugReporter()

  useEffect(() => {
    const stored = localStorage.getItem('ltf1-beta-banner-dismissed')
    if (stored === 'true') setDismissed(true)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('ltf1-beta-banner-dismissed', 'true')
  }

  // Recording indicator bar — always visible when recording
  if (bugReporter.isRecording) {
    return (
      <div
        data-recording-bar
        className="w-full bg-[#0A0A0A] border-b-2 border-[#EF4444] px-4 py-2 flex items-center justify-center gap-3 relative"
        style={{ fontFamily: "'IBM Plex Mono', monospace", zIndex: 99 }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EF4444]" />
        </span>
        <span className="text-[#EF4444] text-xs font-bold tracking-wider uppercase">
          RECORDING BUG STEPS
        </span>
        <span className="text-[#9CA3AF] text-xs">
          {bugReporter.recordedSteps.length} step{bugReporter.recordedSteps.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={bugReporter.stopRecording}
          className="ml-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-[#EF4444] text-[#EF4444] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
        >
          STOP
        </button>
      </div>
    )
  }

  if (dismissed) return null

  return (
    <>
      <div className="w-full bg-[var(--theme-card,#111111)] border-b border-[var(--theme-border,#2E2E35)] px-4 py-2 flex items-center justify-center gap-3 relative" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        <span className="text-[#F59E0B] text-xs font-medium tracking-wider uppercase">
          EARLY ACCESS
        </span>
        <span className="text-[var(--theme-foreground-secondary,#9CA3AF)] text-xs">
          LTF1 is in active development. Features may change rapidly.
        </span>
        <button
          onClick={bugReporter.open}
          className="ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-[#EF4444] text-[#EF4444] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          REPORT BUG
        </button>
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-foreground-tertiary,#6B7280)] hover:text-[var(--theme-foreground,#F9FAFB)] text-xs transition-colors"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
      <BugReporterModal
        isOpen={bugReporter.isOpen}
        step={bugReporter.step}
        setStep={bugReporter.setStep}
        formData={bugReporter.formData}
        setFormData={bugReporter.setFormData}
        screenshotUrls={bugReporter.screenshotUrls}
        isSubmitting={bugReporter.isSubmitting}
        isCapturing={bugReporter.isCapturing}
        isRecording={bugReporter.isRecording}
        recordedSteps={bugReporter.recordedSteps}
        onClose={bugReporter.close}
        onTakeScreenshot={bugReporter.takeScreenshot}
        onRemoveScreenshot={bugReporter.removeScreenshot}
        onStartRecording={bugReporter.startRecording}
        onStopRecording={bugReporter.stopRecording}
        onSubmit={bugReporter.submit}
      />
    </>
  )
}
