import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { formatDistanceToNow } from 'date-fns'

const TYPE_ICONS: Record<string, string> = {
  task_assigned: '\u{1F4CB}',
  task_comment: '\u{1F4AC}',
  task_mention: '@',
  sprint_started: '\u{1F680}',
  sprint_completed: '\u2705',
  member_joined: '\u{1F44B}',
  pr_merged: '\u{1F500}',
}

const TYPE_LABELS: Record<string, string> = {
  task_assigned: 'ASSIGNED',
  task_comment: 'COMMENT',
  task_mention: 'MENTION',
  sprint_started: 'SPRINT',
  sprint_completed: 'SPRINT',
  member_joined: 'TEAM',
  pr_merged: 'GIT',
}

interface NotificationCenterProps {
  workspaceId: Id<'workspaces'>
  onClose: () => void
}

export default function NotificationCenter({ workspaceId, onClose }: NotificationCenterProps) {
  const notifications = useQuery(api.notifications.getNotifications, { workspaceId, limit: 30 })
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)

  const handleMarkAllRead = async () => {
    await markAllAsRead({ workspaceId })
  }

  const handleClick = async (notificationId: Id<'notifications'>, link?: string) => {
    await markAsRead({ notificationId })
    if (link) {
      window.location.href = link
    }
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0

  return (
    <div className="w-[380px] max-h-[520px] flex flex-col bg-[var(--theme-background)] border-2 border-[var(--theme-border)]"
         style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.8)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[var(--theme-border)]">
        <div className="flex items-center gap-2">
          <h2 className="font-mono font-bold text-sm uppercase tracking-wide">NOTIFICATIONS</h2>
          {unreadCount > 0 && (
            <span className="bg-[#EF4444] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-mono font-bold uppercase text-[#6366F1] hover:text-[#4F46E5] transition-colors"
            >
              MARK ALL READ
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] transition-colors p-1"
            aria-label="Close notifications"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {!notifications ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-4 h-4 border-2 border-[#6366F1] border-t-transparent animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <span className="text-2xl mb-2">0</span>
            <p className="font-mono text-xs text-[var(--theme-foreground)]/40 uppercase">NO NOTIFICATIONS</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification._id}
              onClick={() => handleClick(notification._id, notification.link)}
              className={`w-full text-left px-4 py-3 border-b border-[var(--theme-border)]/50 hover:bg-[var(--theme-background-secondary)] transition-colors ${
                !notification.isRead ? 'border-l-2 border-l-[#6366F1] bg-[#6366F1]/5' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5 shrink-0">
                  {TYPE_ICONS[notification.type] || '\u{1F514}'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-mono font-bold uppercase text-[var(--theme-foreground)]/40 tracking-wider">
                      {TYPE_LABELS[notification.type] || notification.type}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--theme-foreground)]/30">
                      {formatDistanceToNow(new Date(notification._creationTime), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-[var(--theme-foreground)]' : 'text-[var(--theme-foreground)]/70'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs font-mono text-[var(--theme-foreground)]/50 truncate mt-0.5">
                    {notification.body}
                  </p>
                </div>
                {!notification.isRead && (
                  <span className="w-2 h-2 bg-[#6366F1] shrink-0 mt-2" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
