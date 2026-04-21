import { useState } from 'react'
import { m } from 'framer-motion'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { HiOutlineX, HiOutlineExternalLink } from 'react-icons/hi'
import { FaDiscord } from 'react-icons/fa'

const DISCORD_URL = 'https://discord.gg/jWMS6Pcr'

/**
 * README-style welcome note shown on the dashboard after a user finishes
 * onboarding. Dismissible, persists the dismissal to user preferences so it
 * stays dismissed across sessions and devices.
 */
export default function FounderNoteCard() {
  const user = useQuery(api.auth.users.getCurrentUser)
  const updatePreferences = useMutation(api.auth.users.updateUserPreferences)
  const [dismissing, setDismissing] = useState(false)

  const shouldShow =
    user &&
    user.preferences?.hasCompletedOnboarding === true &&
    user.preferences?.dismissedFounderNote !== true

  if (!shouldShow) return null

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      await updatePreferences({
        preferences: { dismissedFounderNote: true },
      })
    } catch (err) {
      console.error('Failed to dismiss founder note', err)
      setDismissing(false)
    }
  }

  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: dismissing ? 0 : 1, y: dismissing ? -16 : 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-3 border-2 relative"
      style={{
        backgroundColor: 'var(--theme-background-secondary)',
        borderColor: 'var(--theme-primary)',
        boxShadow: '4px 4px 0 var(--theme-shadow)',
      }}
    >
      {/* File-header bar */}
      <div
        className="px-3 py-1.5 border-b-2 flex items-center justify-between"
        style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-foreground-secondary)' }}>
            README.md · from: aansh@ltf1
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Dismiss welcome note"
          className="w-5 h-5 flex items-center justify-center border"
          style={{
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-foreground-tertiary)',
          }}
        >
          <HiOutlineX className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3
          className="font-mono text-[14px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--theme-foreground)' }}
        >
          # hey — welcome in
        </h3>

        <div className="font-mono text-[12px] leading-6 space-y-2" style={{ color: 'var(--theme-foreground-secondary)' }}>
          <p>
            Thanks for trying LTF1. It&apos;s early, it&apos;s rough in places, and that&apos;s
            exactly why your feedback matters right now.
          </p>
          <p>
            If something&apos;s broken, missing, or just weird — say so.
            We ship on real feedback, not roadmap meetings.
          </p>
          <p style={{ color: 'var(--theme-foreground-tertiary)' }}>
            <span style={{ color: 'var(--theme-primary)' }}>&gt;</span>{' '}
            Drop us a line in Discord. We read everything.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t-2 flex flex-wrap items-center gap-2" style={{ borderColor: 'var(--theme-border)' }}>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 border-2 font-mono text-[11px] uppercase tracking-wider transition-transform hover:-translate-y-0.5"
            style={{
              borderRadius: '6px',
              backgroundColor: 'var(--theme-primary)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-background)',
              boxShadow: '3px 3px 0 var(--theme-shadow)',
            }}
          >
            <FaDiscord className="w-3.5 h-3.5" />
            JOIN DISCORD
            <HiOutlineExternalLink className="w-3 h-3" />
          </a>
          <a
            href="/changelog"
            className="inline-flex items-center gap-2 px-3 py-1.5 border-2 font-mono text-[11px] uppercase tracking-wider transition-transform hover:-translate-y-0.5"
            style={{
              borderRadius: '6px',
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-foreground)',
            }}
          >
            SEE CHANGELOG
          </a>
          <span
            className="ml-auto font-mono text-[10px]"
            style={{ color: 'var(--theme-foreground-tertiary)' }}
          >
            shipping every week · — a
          </span>
        </div>
      </div>
    </m.div>
  )
}
