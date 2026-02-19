import { HiOutlineLink, HiOutlineChatAlt2, HiOutlinePlus } from 'react-icons/hi'
import { FaGithub, FaSlack, FaDiscord, FaJira } from 'react-icons/fa'

interface CommsEmptyStateProps {
  onCreateChannel?: () => void
}

export default function CommsEmptyState({ onCreateChannel }: CommsEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg text-center">
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 border-2 border-[var(--theme-border)] flex items-center justify-center bg-[var(--theme-background-tertiary)]">
          <HiOutlineChatAlt2 className="w-7 h-7 text-[var(--theme-primary)]" />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[var(--theme-foreground)] mb-2">No Communications Yet</h3>
        <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)] mb-6 max-w-sm mx-auto">
          Start a team chat or connect your integrations to receive messages from GitHub, Slack, Discord, and Jira.
        </p>

        {/* Team Chat CTA */}
        {onCreateChannel && (
          <button
            onClick={onCreateChannel}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[var(--theme-primary-hover)] transition-colors mb-6"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create Team Chat Channel
          </button>
        )}

        {/* Integration cards */}
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-6">
          {/* Team Chat card */}
          <button
            type="button"
            className="border-2 border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/5 p-3 flex items-center gap-2.5 cursor-pointer hover:border-[var(--theme-primary)] transition-colors"
            onClick={onCreateChannel}
          >
            <HiOutlineChatAlt2 className="w-4 h-4 text-[var(--theme-primary)]" />
            <div className="text-left">
              <span className="block font-mono text-xs font-bold text-[var(--theme-foreground)]">
                Team Chat
              </span>
              <span className="block font-mono text-[10px] text-[var(--theme-success)]">
                Ready
              </span>
            </div>
          </button>

          {[
            { icon: FaGithub, name: 'GitHub', color: '#F9FAFB', status: 'Available' },
            { icon: FaSlack, name: 'Slack', color: '#4A154B', status: 'Available' },
            { icon: FaDiscord, name: 'Discord', color: '#5865F2', status: 'Coming Soon' },
            { icon: FaJira, name: 'Jira', color: '#0052CC', status: 'Coming Soon' },
          ].map((integration) => {
            const Icon = integration.icon
            return (
              <div
                key={integration.name}
                className="border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] p-3 flex items-center gap-2.5"
              >
                <Icon className="w-4 h-4" style={{ color: integration.color }} />
                <div className="text-left">
                  <span className="block font-mono text-xs font-bold text-[var(--theme-foreground)]">
                    {integration.name}
                  </span>
                  <span className="block font-mono text-[10px] text-[var(--theme-foreground-tertiary)]">
                    {integration.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Hint */}
        <div className="bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-primary)]/30 p-3 inline-flex items-center gap-2">
          <HiOutlineLink className="w-4 h-4 text-[var(--theme-primary)]" />
          <span className="font-mono text-[10px] text-[var(--theme-foreground-secondary)]">
            Visit the <span className="text-[var(--theme-primary)] font-bold">Integrations</span> tab to connect services
          </span>
        </div>
      </div>
    </div>
  )
}
