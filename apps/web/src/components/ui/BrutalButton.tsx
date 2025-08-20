import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glitch'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
}

const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  ({ 
    children, 
    className, 
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'font-semibold uppercase tracking-wider transition-all duration-200 ease-brutal-out border-2 relative overflow-hidden'
    
    const variants = {
      primary: 'bg-[var(--theme-background)] text-[var(--theme-foreground)] border-[var(--theme-border)] shadow-[var(--theme-box-shadow)] hover:shadow-[var(--theme-box-shadow-hover)] hover:translate-x-[2px] hover:translate-y-[2px]',
      secondary: 'bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)] border-[var(--theme-border)] shadow-[var(--theme-box-shadow)] hover:shadow-[var(--theme-box-shadow-hover)] hover:translate-x-[2px] hover:translate-y-[2px]',
      ghost: 'bg-transparent text-[var(--theme-foreground)] border-transparent hover:border-[var(--theme-border)] hover:shadow-[var(--theme-box-shadow)]',
      danger: 'bg-[var(--theme-error)] text-[var(--theme-background)] border-[var(--theme-error-hover)] shadow-[var(--theme-box-shadow)] hover:shadow-[var(--theme-box-shadow-hover)] hover:translate-x-[2px] hover:translate-y-[2px]',
      glitch: 'bg-[var(--theme-gradient)] text-[var(--theme-background)] border-[var(--theme-background)] shadow-[var(--theme-box-shadow)] hover:shadow-[var(--theme-box-shadow-hover)] hover:animate-glitch',
    }

    const sizes = {
      sm: 'px-16px py-8px text-xs',
      md: 'px-24px py-16px text-sm',
      lg: 'px-32px py-24px text-base',
      xl: 'px-48px py-32px text-lg',
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-8px">
            <span className="animate-pulse">LOADING</span>
            <span className="animate-pulse">...</span>
          </span>
        ) : children}
      </button>
    )
  }
)

BrutalButton.displayName = 'BrutalButton'

export default BrutalButton