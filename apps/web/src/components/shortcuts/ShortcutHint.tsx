import { useShortcuts } from '@/contexts/ShortcutContext'
import clsx from 'clsx'

interface ShortcutHintProps {
  shortcutId?: string
  keys?: string
  className?: string
  size?: 'xs' | 'sm' | 'md'
  variant?: 'inline' | 'tooltip' | 'badge'
}

export default function ShortcutHint({
  shortcutId,
  keys,
  className,
  size = 'xs',
  variant = 'inline'
}: ShortcutHintProps) {
  const { getShortcut, formatKeyCombo } = useShortcuts()
  
  // Get the shortcut if ID provided
  const shortcut = shortcutId ? getShortcut(shortcutId) : null
  
  // Determine what to display
  const displayKeys = keys || (shortcut && formatKeyCombo(shortcut.customKeys || shortcut.defaultKeys))
  
  if (!displayKeys) return null
  
  // Don't show if shortcut is disabled
  if (shortcut && !shortcut.enabled) return null
  
  const sizeClasses = {
    xs: 'px-4px py-2px text-brutal-xs',
    sm: 'px-6px py-3px text-brutal-xs',
    md: 'px-8px py-4px text-brutal-sm'
  }
  
  const variantClasses = {
    inline: 'bg-event-horizon border border-basalt-border ml-[8px]',
    tooltip: 'bg-carbon-plate border-2 border-basalt-border absolute',
    badge: 'bg-primary-brutalist/20 border border-primary-brutalist'
  }
  
  return (
    <kbd
      className={clsx(
        'font-mono uppercase inline-block',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      title={shortcut?.description}
    >
      {displayKeys}
    </kbd>
  )
}

// Component for showing shortcuts in button groups
export function ButtonWithShortcut({
  children,
  shortcutId,
  keys,
  onClick,
  className,
  disabled = false
}: {
  children: React.ReactNode
  shortcutId?: string
  keys?: string
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx('flex items-center justify-between gap-[8px]', className)}
    >
      <span>{children}</span>
      <ShortcutHint shortcutId={shortcutId} keys={keys} size="xs" />
    </button>
  )
}

// Component for menu items with shortcuts
export function MenuItemWithShortcut({
  label,
  icon,
  shortcutId,
  keys,
  onClick,
  active = false
}: {
  label: string
  icon?: React.ReactNode
  shortcutId?: string
  keys?: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full px-[10px] py-[8px] flex items-center justify-between',
        'font-mono text-brutal-sm uppercase transition-colors',
        active 
          ? 'bg-primary-brutalist text-event-horizon' 
          : 'hover:bg-primary-brutalist/20'
      )}
    >
      <div className="flex items-center gap-[6px]">
        {icon}
        <span>{label}</span>
      </div>
      <ShortcutHint shortcutId={shortcutId} keys={keys} size="xs" />
    </button>
  )
}