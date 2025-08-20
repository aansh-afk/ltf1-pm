import { useState } from 'react'
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
    sm: { width: 'w-40px', height: 'h-20px', thumb: 'w-16px h-16px', translate: 'translate-x-20px' },
    md: { width: 'w-56px', height: 'h-28px', thumb: 'w-24px h-24px', translate: 'translate-x-28px' },
    lg: { width: 'w-72px', height: 'h-36px', thumb: 'w-32px h-32px', translate: 'translate-x-36px' },
  }

  const sizeConfig = sizes[size]

  return (
    <label className={clsx(
      'flex items-center gap-12px cursor-pointer',
      disabled && 'cursor-not-allowed opacity-50'
    )}>
      {label && (
        <span className="text-brutal-sm uppercase tracking-wider">
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