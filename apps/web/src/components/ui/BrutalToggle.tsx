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
    sm: { track: 'w-9 h-[18px]', thumb: 'h-3 w-3', off: 'left-[3px]', on: 'left-[21px]' },
    md: { track: 'w-11 h-[22px]', thumb: 'h-3.5 w-3.5', off: 'left-[3px]', on: 'left-[27px]' },
    lg: { track: 'w-14 h-7', thumb: 'h-4.5 w-4.5', off: 'left-[4px]', on: 'left-[34px]' },
  }

  const s = sizes[size]

  return (
    <label className={clsx(
      'inline-flex items-center gap-3',
      disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer group'
    )}>
      {label && (
        <span className={clsx(
          'text-sm font-semibold uppercase tracking-wider font-mono transition-colors duration-250',
          checked ? 'text-[#F9FAFB]' : 'text-[#9CA3AF]'
        )}>
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex items-center rounded-md transition-all duration-250 ease-in-out',
          'border-2 focus-visible:outline-none',
          s.track,
          checked
            ? 'bg-[#6366F1] border-[#6366F1]'
            : 'bg-[#111111] border-[#2E2E35]',
          !disabled && 'group-hover:border-[#6366F1] group-hover:-translate-y-[2px]',
          !disabled && 'focus-visible:border-[#6366F1]',
        )}
      >
        <span
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 rounded transition-all duration-250 ease-in-out',
            s.thumb,
            checked ? 'bg-[#F9FAFB]' : 'bg-[#6B7280]',
            checked ? s.on : s.off,
          )}
        />
      </button>
    </label>
  )
}
