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
      primary: 'bg-event-horizon text-cathode-white border-basalt-border shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]',
      secondary: 'bg-carbon-plate text-cathode-white border-basalt-border shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]',
      ghost: 'bg-transparent text-cathode-white border-transparent hover:border-basalt-border hover:shadow-brutal',
      danger: 'bg-[#FF0000] text-event-horizon border-[#CC0000] shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]',
      glitch: 'bg-glitch-flare text-event-horizon border-event-horizon shadow-brutal hover:shadow-brutal-lg hover:animate-glitch',
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