import { useState } from 'react'
import { FaGithub, FaSlack, FaDiscord, FaJira } from 'react-icons/fa'
import { HiOutlinePaperAirplane } from 'react-icons/hi'
import type { Id } from '../../../../../../convex/_generated/dataModel'

type Source = 'slack' | 'github' | 'discord' | 'jira' | 'internal'

interface MessageReplyInputProps {
  channelId: Id<'commsChannels'>
  source: Source
}

const SOURCE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  slack: { icon: FaSlack, label: 'Slack', color: '#4A154B' },
  github: { icon: FaGithub, label: 'GitHub', color: '#F9FAFB' },
  discord: { icon: FaDiscord, label: 'Discord', color: '#5865F2' },
  jira: { icon: FaJira, label: 'Jira', color: '#0052CC' },
  internal: { icon: FaSlack, label: 'Internal', color: '#6366F1' },
}

export default function MessageReplyInput({ channelId, source }: MessageReplyInputProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.internal
  const Icon = config.icon

  const handleSend = async () => {
    if (!content.trim() || sending) return
    setSending(true)
    // Reply action will be implemented in Phase 2
    // For now, just clear the input
    setTimeout(() => {
      setContent('')
      setSending(false)
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-[#1F1F23] p-3 bg-[#0A0A0A]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3" style={{ color: config.color }} />
        <span className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider">
          Reply via {config.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-3 py-2 bg-[#050505] border-2 border-[#2E2E35] font-mono text-xs text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="px-3 py-2 bg-[#6366F1] border-2 border-[#4F46E5] text-white hover:bg-[#4F46E5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
        </button>
      </div>
    </div>
  )
}
