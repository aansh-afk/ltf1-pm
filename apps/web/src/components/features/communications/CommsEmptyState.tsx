import { HiOutlineLink, HiOutlineChatAlt2 } from 'react-icons/hi'
import { FaGithub, FaSlack, FaDiscord, FaJira } from 'react-icons/fa'

export default function CommsEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-lg text-center">
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 border-2 border-[#2E2E35] flex items-center justify-center bg-[#111111]">
          <HiOutlineChatAlt2 className="w-7 h-7 text-[#6366F1]" />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#F9FAFB] mb-2">No Communications Yet</h3>
        <p className="font-mono text-xs text-[#6B7280] mb-6 max-w-sm mx-auto">
          Connect your integrations to start receiving messages from GitHub, Slack, Discord, and Jira
          in one unified feed.
        </p>

        {/* Integration cards */}
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-6">
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
                className="border-2 border-[#2E2E35] bg-[#0A0A0A] p-3 flex items-center gap-2.5"
              >
                <Icon className="w-4 h-4" style={{ color: integration.color }} />
                <div className="text-left">
                  <span className="block font-mono text-xs font-bold text-[#F9FAFB]">
                    {integration.name}
                  </span>
                  <span className="block font-mono text-[10px] text-[#6B7280]">
                    {integration.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Hint */}
        <div className="bg-[#111111] border-2 border-[#6366F1]/30 p-3 inline-flex items-center gap-2">
          <HiOutlineLink className="w-4 h-4 text-[#6366F1]" />
          <span className="font-mono text-[10px] text-[#9CA3AF]">
            Visit the <span className="text-[#6366F1] font-bold">Integrations</span> tab to connect services
          </span>
        </div>
      </div>
    </div>
  )
}
