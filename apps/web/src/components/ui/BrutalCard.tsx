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
    const baseClasses = 'bg-carbon-plate transition-all duration-200 ease-brutal-out'
    
    const variants = {
      default: 'border-2 border-basalt-border',
      bordered: 'border-4 border-basalt-border',
      elevated: 'border-2 border-basalt-border shadow-brutal',
      glitch: 'border-2 border-[#00FFFF] shadow-[0_0_10px_#00FFFF]',
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