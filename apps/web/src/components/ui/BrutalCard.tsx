import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface BrutalCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'glitch' | 'neon'
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
      default: 'border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]',
      bordered: 'border-4 border-[var(--theme-border)] bg-[var(--theme-background)]',
      elevated: 'border-2 border-[var(--theme-border)] shadow-brutal bg-[var(--theme-background-secondary)]',
      glitch: 'border-2 border-[var(--theme-border)] shadow-brutal hover:animate-glitch bg-[var(--theme-background-secondary)]',
      neon: 'border-2 border-[#00FFFF] shadow-[4px_4px_0_#00FFFF] bg-black/80 backdrop-blur-sm',
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