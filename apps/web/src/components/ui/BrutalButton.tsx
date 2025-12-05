import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glitch' | 'neon'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  ariaLabel?: string
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
    ariaLabel,
    ...props
  }, ref) => {
    const baseClasses = 'font-mono font-bold uppercase tracking-wider transition-all duration-100 ease-linear border-2 relative overflow-hidden active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'

    const variants = {
      primary: 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-border)] shadow-brutal hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px]',
      secondary: 'bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)] border-[var(--theme-border)] shadow-brutal hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-[var(--theme-background-tertiary)]',
      ghost: 'bg-transparent text-[var(--theme-foreground)] border-transparent hover:border-[var(--theme-border)] hover:bg-[var(--theme-background-secondary)]',
      danger: 'bg-[var(--theme-error)] text-[var(--theme-background)] border-[var(--theme-error)] shadow-brutal hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px]',
      glitch: 'bg-black text-white border-white shadow-brutal hover:shadow-brutal-hover hover:animate-glitch relative before:absolute before:inset-0 before:bg-white/20 before:translate-x-full hover:before:animate-scanline overflow-hidden',
      neon: 'bg-transparent text-[#00FFFF] border-[#00FFFF] shadow-[4px_4px_0_#00FFFF] hover:shadow-[6px_6px_0_#00FFFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-[#00FFFF]/10',
    }

    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
      xl: 'px-10 py-5 text-lg',
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
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            <span>PROCESSING...</span>
          </span>
        ) : children}
      </button>
    )
  }
)

BrutalButton.displayName = 'BrutalButton'

export default BrutalButton