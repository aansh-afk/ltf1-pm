import clsx from 'clsx'

export type DeveloperStatus = 'LOCKED_IN' | 'AVAILABLE' | 'IN_REVIEW' | 'AFK' | 'IN_MEETING'

interface DeveloperStatusIndicatorProps {
  status?: DeveloperStatus | string | null
  lastSeen?: number | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const statusConfig = {
  LOCKED_IN: {
    color: 'bg-brutal-error',
    label: 'LOCKED IN',
    description: 'Deep focus mode',
  },
  AVAILABLE: {
    color: 'bg-brutal-success',
    label: 'AVAILABLE',
    description: 'Ready for collaboration',
  },
  IN_REVIEW: {
    color: 'bg-brutal-info',
    label: 'IN REVIEW',
    description: 'Reviewing code',
  },
  AFK: {
    color: 'bg-[var(--theme-primary)]/30',
    label: 'AFK',
    description: 'Away from keyboard',
  },
  IN_MEETING: {
    color: 'bg-brutal-warning',
    label: 'IN MEETING',
    description: 'In a meeting',
  },
}

export default function DeveloperStatusIndicator({
  status,
  lastSeen,
  size = 'md',
  showLabel = false,
  className,
}: DeveloperStatusIndicatorProps) {
  // Handle null/undefined status or map common status values
  let normalizedStatus = status
  if (!status) {
    normalizedStatus = 'AFK'
  } else if (typeof status === 'string') {
    // Map common status values to our enum
    const statusMapping: { [key: string]: DeveloperStatus } = {
      'online': 'AVAILABLE',
      'busy': 'LOCKED_IN',
      'away': 'AFK',
      'offline': 'AFK',
      'available': 'AVAILABLE',
      'locked_in': 'LOCKED_IN',
      'in_review': 'IN_REVIEW',
      'afk': 'AFK',
      'in_meeting': 'IN_MEETING'
    }
    normalizedStatus = statusMapping[status.toLowerCase()] || status
  }

  const config = statusConfig[normalizedStatus as DeveloperStatus] || {
    color: 'bg-[var(--theme-foreground)]/40',
    label: 'OFFLINE',
    description: 'Status unknown',
  }

  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx(
          sizeClasses[size],
          config.color,
          'border-2 border-[var(--theme-border)]'
        )}
        title={config.description}
      />
      {showLabel && (
        <span className="font-mono text-sm font-bold uppercase">
          {config.label}
        </span>
      )}
    </div>
  )
}