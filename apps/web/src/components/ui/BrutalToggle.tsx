import clsx from 'clsx'

interface BrutalToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function BrutalToggle({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md'
}: BrutalToggleProps) {
  const sizes = {
    sm: { width: 'w-10', height: 'h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
    md: { width: 'w-14', height: 'h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
    lg: { width: 'w-18', height: 'h-9', thumb: 'w-8 h-8', translate: 'translate-x-9' },
  }

  const sizeConfig = sizes[size]

  return (
    <label className={clsx(
      'flex items-center gap-3 cursor-pointer',
      disabled && 'cursor-not-allowed opacity-50'
    )}>
      {label && (
        <span className="text-sm font-bold uppercase tracking-wider font-mono">
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex items-center transition-colors duration-200',
          sizeConfig.width,
          sizeConfig.height,
          'border-2 border-[var(--theme-border)]',
          checked ? 'bg-[var(--theme-primary)]' : 'bg-[var(--theme-background-secondary)]',
          disabled && 'cursor-not-allowed'
        )}
      >
        <span
          className={clsx(
            'absolute transition-all duration-200',
            sizeConfig.thumb,
            'border-2 border-[var(--theme-border)]',
            checked ? 'bg-[var(--theme-foreground)]' : 'bg-[var(--theme-disabled)]'
          )}
          style={{
            transform: checked ? `translateX(${size === 'sm' ? '20px' : size === 'md' ? '28px' : '36px'})` : 'translateX(2px)'
          }}
        />
      </button>
    </label>
  )
}