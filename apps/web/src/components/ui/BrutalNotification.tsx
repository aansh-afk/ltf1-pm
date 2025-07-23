import { motion } from 'framer-motion'
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
      border: 'border-[#00FF00]',
      icon: 'text-[#00FF00]',
      bg: 'bg-[#00FF00]/10',
    },
    error: {
      border: 'border-[#FF0000]',
      icon: 'text-[#FF0000]',
      bg: 'bg-[#FF0000]/10',
    },
    warning: {
      border: 'border-[#FFFF00]',
      icon: 'text-[#FFFF00]',
      bg: 'bg-[#FFFF00]/10',
    },
    info: {
      border: 'border-[#00FFFF]',
      icon: 'text-[#00FFFF]',
      bg: 'bg-[#00FFFF]/10',
    },
  }

  const Icon = icons[type]
  const colorScheme = colors[type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, y: 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={clsx(
        'bg-carbon-plate border-2 shadow-brutal-lg p-16px min-w-[300px] max-w-[500px]',
        colorScheme.border
      )}
    >
      <div className="flex items-start gap-12px">
        <div className={clsx('p-8px', colorScheme.bg)}>
          <Icon className={clsx('w-24px h-24px', colorScheme.icon)} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-brutal-sm font-bold mb-4px">{title.toUpperCase()}</h3>
          {message && (
            <p className="text-xs text-cathode-white/70">{message}</p>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-4px hover:bg-event-horizon transition-colors"
          >
            <HiOutlineXCircle className="w-20px h-20px" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// NOTIFICATION MANAGER
export function showNotification(props: BrutalNotificationProps) {
  // This would integrate with your toast library
  // For now, it's a placeholder
  console.log('Show notification:', props)
}