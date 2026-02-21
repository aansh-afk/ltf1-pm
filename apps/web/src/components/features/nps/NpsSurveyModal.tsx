import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import posthog from 'posthog-js'
import BrutalModal from '../../ui/BrutalModal'

function getScoreColor(score: number): string {
  if (score <= 6) return '#EF4444' // detractor
  if (score <= 8) return '#F59E0B' // passive
  return '#22C55E' // promoter
}

function getFollowUp(score: number): string {
  if (score <= 6) return "What could we do better?"
  if (score <= 8) return "What would make you a 9 or 10?"
  return "What do you love most about LTF1?"
}

interface NpsSurveyModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NpsSurveyModal({ isOpen, onClose }: NpsSurveyModalProps) {
  const [step, setStep] = useState<'score' | 'reason' | 'thanks'>('score')
  const [score, setScore] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const submitNps = useMutation(api.nps.submitNpsSurvey)
  const dismissNps = useMutation(api.nps.dismissNpsSurvey)

  const handleScore = (s: number) => {
    setScore(s)
    setStep('reason')
  }

  const handleSubmit = async () => {
    if (score === null) return
    try {
      await submitNps({ score, reason: reason.trim() || undefined })
      posthog.capture('nps_submitted', { score })
      setStep('thanks')
      setTimeout(onClose, 2000)
    } catch {
      // silently fail
    }
  }

  const handleDismiss = async () => {
    try {
      await dismissNps()
    } catch {
      // silently fail
    }
    onClose()
  }

  return (
    <BrutalModal isOpen={isOpen} onClose={handleDismiss} title="Quick Survey" size="sm">
      {step === 'score' && (
        <>
          <p className="text-[var(--theme-foreground)] text-sm font-mono mb-4">
            How likely are you to recommend LTF1 to a friend or colleague?
          </p>
          <div className="grid grid-cols-11 gap-1">
            {[0,1,2,3,4,5,6,7,8,9,10].map((s) => (
              <button
                key={`nps-${s}`}
                onClick={() => handleScore(s)}
                className="aspect-square flex items-center justify-center text-xs font-mono border-2 cursor-pointer transition-colors"
                style={{
                  borderColor: getScoreColor(s),
                  color: 'var(--theme-foreground)',
                  backgroundColor: 'var(--theme-background-card, #111111)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getScoreColor(s)
                  e.currentTarget.style.color = '#050505'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-background-card, #111111)'
                  e.currentTarget.style.color = 'var(--theme-foreground)'
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-mono text-[var(--theme-foreground-tertiary)]">Not likely</span>
            <span className="text-[10px] font-mono text-[var(--theme-foreground-tertiary)]">Very likely</span>
          </div>
        </>
      )}

      {step === 'reason' && score !== null && (
        <>
          <p className="text-[var(--theme-foreground)] text-sm font-mono mb-4">
            {getFollowUp(score)}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Your thoughts (optional)"
            rows={3}
            className="w-full bg-[var(--theme-background-card,#111111)] border-2 border-[var(--theme-border)] focus:border-[var(--theme-primary)] text-[var(--theme-foreground)] text-sm font-mono p-2 resize-none outline-none placeholder:text-[var(--theme-foreground-tertiary)]"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-[var(--theme-primary)] hover:bg-[#4F46E5] text-white text-xs font-mono uppercase tracking-wider py-2 px-4 border-0 cursor-pointer transition-colors"
            >
              Submit
            </button>
            <button
              onClick={() => { setScore(null); setStep('score') }}
              className="bg-[var(--theme-background-card,#111111)] border-2 border-[var(--theme-border)] hover:border-[var(--theme-primary)] text-[var(--theme-foreground-secondary)] text-xs font-mono uppercase tracking-wider py-2 px-4 cursor-pointer transition-colors"
            >
              Back
            </button>
          </div>
        </>
      )}

      {step === 'thanks' && (
        <p className="text-[#22C55E] text-sm font-mono text-center py-4">
          Thank you for your feedback!
        </p>
      )}
    </BrutalModal>
  )
}
