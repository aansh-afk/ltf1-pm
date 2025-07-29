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
    xs: 'px-4px py-1px text-[10px]',
    sm: 'px-8px py-2px text-xs',
    md: 'px-16px py-8px text-sm',
    lg: 'px-24px py-16px text-base'
  }

  const variantClasses = {
    default: 'bg-carbon-plate border-basalt-border text-cathode-white',
    error: 'bg-brutal-error border-brutal-error text-event-horizon',
    success: 'bg-brutal-success border-brutal-success text-event-horizon',
    info: 'bg-brutal-info border-brutal-info text-event-horizon',
    warning: 'bg-brutal-warning border-brutal-warning text-event-horizon'
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