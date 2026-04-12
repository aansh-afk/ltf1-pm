import { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { HiOutlineBell } from 'react-icons/hi'
import NotificationCenter from './NotificationCenter'

interface NotificationBellProps {
  workspaceId: Id<'workspaces'> | undefined
}

export default function NotificationBell({ workspaceId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = useQuery(
    api.notificationQueries.getUnreadCount,
    workspaceId ? { workspaceId } : 'skip'
  )

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  if (!workspaceId) return null

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] transition-colors"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <HiOutlineBell className="w-5 h-5" />
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-[#EF4444] text-white text-[9px] font-mono font-bold min-w-[16px] h-[16px] flex items-center justify-center px-1">
            {unreadCount! > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-[150]">
          <NotificationCenter
            workspaceId={workspaceId}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
