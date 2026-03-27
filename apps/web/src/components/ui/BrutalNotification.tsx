import { m } from 'framer-motion'
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamation, HiOutlineInformationCircle } from 'react-icons/hi'
import clsx from 'clsx'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface BrutalNotificationProps {
  type: NotificationType
  title: string
  message?: string
  onClose?: () => void
}

export default function BrutalNotification({
  type,
  title,
  message,
  onClose,
}: BrutalNotificationProps) {
  const icons = {
    success: HiOutlineCheckCircle,
    error: HiOutlineXCircle,
    warning: HiOutlineExclamation,
    info: HiOutlineInformationCircle,
  }

  const colors = {
    success: {
      border: 'border-[var(--theme-success)]',
      icon: 'text-[var(--theme-success)]',
      bg: 'bg-[var(--theme-success)]/10',
    },
    error: {
      border: 'border-[var(--theme-error)]',
      icon: 'text-[var(--theme-error)]',
      bg: 'bg-[var(--theme-error)]/10',
    },
    warning: {
      border: 'border-[var(--theme-warning)]',
      icon: 'text-[var(--theme-warning)]',
      bg: 'bg-[var(--theme-warning)]/10',
    },
    info: {
      border: 'border-[var(--theme-info)]',
      icon: 'text-[var(--theme-info)]',
      bg: 'bg-[var(--theme-info)]/10',
    },
  }

  const Icon = icons[type]
  const colorScheme = colors[type]

  return (
    <m.div
      initial={{ opacity: 0, x: 100, y: 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={clsx(
        'border-2 shadow-brutal-lg p-[10px] min-w-[300px] max-w-[500px]',
        'bg-[var(--theme-background)]',
        colorScheme.border
      )}
    >
      <div className="flex items-start gap-[6px]">
        <div className={clsx('p-[8px]', colorScheme.bg)}>
          <Icon className={clsx('w-4 h-4', colorScheme.icon)} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-brutal-sm font-bold mb-4px text-[var(--theme-foreground)]">{title.toUpperCase()}</h3>
          {message && (
            <p className="text-xs text-[var(--theme-foreground)]/70">{message}</p>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close notification"
            className="p-4px hover:bg-[var(--theme-background-secondary)] transition-colors text-[var(--theme-foreground)]"
          >
            <HiOutlineXCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </m.div>
  )
}

// NOTIFICATION MANAGER
export function showNotification(props: BrutalNotificationProps) {
  // Implementation placeholder - would need proper toast integration
  // For now, using browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(props.title, {
      body: props.message,
      icon: '/favicon.ico'
    })
  }
}