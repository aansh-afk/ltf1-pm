import { ReactNode } from 'react'
import clsx from 'clsx'

interface BrutalBadgeProps {
  children: ReactNode
  variant?: 'default' | 'error' | 'success' | 'info' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export default function BrutalBadge({ 
  children, 
  variant = 'default',
  size = 'md',
  className 
}: BrutalBadgeProps) {
  const sizeClasses = {
    xs: 'px-1 py-px text-[10px]',
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1.5 text-sm'
  }

  const variantClasses = {
    default: 'bg-[var(--theme-background-secondary)] border-[var(--theme-border)] text-[var(--theme-foreground)]',
    error: 'bg-[var(--theme-error)] border-[var(--theme-error)] text-[var(--theme-background)]',
    success: 'bg-[var(--theme-success)] border-[var(--theme-success)] text-[var(--theme-background)]',
    info: 'bg-[var(--theme-info)] border-[var(--theme-info)] text-[var(--theme-background)]',
    warning: 'bg-[var(--theme-warning)] border-[var(--theme-warning)] text-[var(--theme-background)]'
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold uppercase tracking-wider',
        'border-2 shadow-brutal-sm',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      style={{ borderRadius: '0 !important' }}
    >
      {children}
    </span>
  )
}