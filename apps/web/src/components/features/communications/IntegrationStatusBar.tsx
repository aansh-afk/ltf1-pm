import { FaGithub, FaSlack, FaDiscord, FaJira } from 'react-icons/fa'
import clsx from 'clsx'

interface IntegrationStatusBarProps {
  workspaceId: string
  stats: {
    bySource: Array<{ source: string; channelCount: number; messageCount: number }>
  } | null | undefined
}

const INTEGRATIONS = [
  { key: 'github', label: 'GitHub', icon: FaGithub, color: '#F9FAFB' },
  { key: 'slack', label: 'Slack', icon: FaSlack, color: '#4A154B' },
  { key: 'discord', label: 'Discord', icon: FaDiscord, color: '#5865F2' },
  { key: 'jira', label: 'Jira', icon: FaJira, color: '#0052CC' },
]

export default function IntegrationStatusBar({ workspaceId, stats }: IntegrationStatusBarProps) {
  const connectedSources = new Set(stats?.bySource?.map((s) => s.source) ?? [])

  return (
    <div className="flex items-center gap-2 mb-3">
      {INTEGRATIONS.map((integration) => {
        const Icon = integration.icon
        const connected = connectedSources.has(integration.key)
        const sourceStats = stats?.bySource?.find((s) => s.source === integration.key)

        return (
          <div
            key={integration.key}
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 border font-mono text-[10px]',
              connected
                ? 'border-[#22C55E]/30 bg-[#22C55E]/5 text-[#22C55E]'
                : 'border-[#2E2E35] bg-[#0A0A0A] text-[#6B7280]'
            )}
          >
            <Icon className="w-3 h-3" style={{ color: connected ? integration.color : undefined }} />
            <span className="uppercase font-semibold tracking-wider">{integration.label}</span>
            {connected && sourceStats && (
              <span className="text-[#6B7280] ml-1">({sourceStats.channelCount})</span>
            )}
            <span
              className={clsx(
                'w-1.5 h-1.5 ml-0.5',
                connected ? 'bg-[#22C55E]' : 'bg-[#6B7280]/30'
              )}
            />
          </div>
        )
      })}
    </div>
  )
}
