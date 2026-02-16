import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import MessageCard from './MessageCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { HiOutlinePaperAirplane, HiOutlineChatAlt2 } from 'react-icons/hi'

interface TeamChatProps {
  channelId: Id<'commsChannels'>
  channelName: string
}

export default function TeamChat({ channelId, channelName }: TeamChatProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const messages = useQuery(
    api.communications.queries.getChannelMessages,
    { channelId, limit: 50 }
  )

  const sendMessage = useMutation(api.communications.mutations.sendInternalMessage)
  const markRead = useMutation(api.communications.mutations.markChannelRead)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  // Mark as read when viewing
  useEffect(() => {
    markRead({ channelId }).catch(() => {})
  }, [channelId, markRead])

  const handleSend = async () => {
    const trimmed = message.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      await sendMessage({ channelId, content: trimmed })
      setMessage('')
      inputRef.current?.focus()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (messages === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  // Reverse so newest is at bottom (query returns desc order)
  const sorted = [...messages].reverse()

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="px-4 py-3 border-b border-[var(--theme-border)] flex items-center gap-2">
        <HiOutlineChatAlt2 className="w-4 h-4 text-[var(--theme-primary)]" />
        <h3 className="font-mono text-sm font-bold text-[var(--theme-foreground)] uppercase">
          # {channelName}
        </h3>
        <span className="font-mono text-[10px] text-[var(--theme-foreground-tertiary)] ml-2">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-2 px-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <HiOutlineChatAlt2 className="w-8 h-8 text-[var(--theme-border)]" />
            <p className="font-mono text-xs text-[var(--theme-foreground-tertiary)]">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          sorted.map((msg) => (
            <MessageCard key={msg._id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 py-3 border-t border-[var(--theme-border)] bg-[var(--theme-background)]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}`}
            className="flex-1 bg-[var(--theme-background-tertiary)] border-2 border-[var(--theme-border)] px-3 py-2 font-mono text-xs text-[var(--theme-foreground)] placeholder-[var(--theme-foreground-tertiary)] focus:border-[var(--theme-primary)] focus:outline-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="px-3 py-2 border-2 border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[var(--theme-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  )
}
