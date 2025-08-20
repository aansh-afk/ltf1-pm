import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface BrutalCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'glitch'
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const BrutalCard = forwardRef<HTMLDivElement, BrutalCardProps>(
  ({ 
    children, 
    className,
    variant = 'default',
    hoverable = false,
    padding = 'md',
    ...props 
  }, ref) => {
    const baseClasses = 'bg-[var(--theme-background-secondary)] transition-all duration-200 ease-brutal-out'
    
    const variants = {
      default: 'border-2 border-[var(--theme-border)]',
      bordered: 'border-4 border-[var(--theme-border)]',
      elevated: 'border-2 border-[var(--theme-border)] shadow-[var(--theme-box-shadow)]',
      glitch: 'border-2 border-[var(--theme-glow)] shadow-[0_0_10px_var(--theme-glow)]',
    }

    const paddings = {
      none: '',
      sm: 'p-16px',
      md: 'p-24px',
      lg: 'p-32px',
    }

    return (
      <div
        ref={ref}
        className={clsx(
          baseClasses,
          variants[variant],
          paddings[padding],
          hoverable && 'brutal-hover cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

BrutalCard.displayName = 'BrutalCard'

export default BrutalCard