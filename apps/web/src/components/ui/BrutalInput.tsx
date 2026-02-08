import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ 
    label,
    error,
    helperText,
    fullWidth = false,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={clsx('space-y-[8px]', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="block text-brutal-sm text-[var(--theme-foreground)]">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          aria-label={label || props['aria-label']}
          aria-invalid={!!error}
          aria-describedby={error || helperText ? `${inputId}-description` : undefined}
          className={clsx(
            'bg-[var(--theme-background)] text-[var(--theme-foreground)] border-2 px-[10px] py-8px',
            'transition-all duration-200 ease-brutal-out',
            'placeholder:text-[var(--theme-foreground)]/50 placeholder:uppercase placeholder:text-xs',
            error
              ? 'border-[var(--theme-error)] focus:border-[var(--theme-error)] focus:shadow-[3px_3px_0px_var(--theme-error)]'
              : 'border-[var(--theme-border)] focus:border-[var(--theme-border-focus)] focus:shadow-[var(--theme-box-shadow)]',
            'outline-none',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        
        {(error || helperText) && (
          <p 
            id={`${inputId}-description`}
            className={clsx(
              'text-brutal-xs',
              error ? 'text-[var(--theme-error)]' : 'text-[var(--theme-foreground)]/70'
            )}
            role={error ? 'alert' : 'status'}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

BrutalInput.displayName = 'BrutalInput'

export default BrutalInput