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
      <div className={clsx('space-y-8px', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="block text-brutal-sm text-cathode-white">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'bg-event-horizon text-cathode-white border-2 px-16px py-8px',
            'transition-all duration-200 ease-brutal-out',
            'placeholder:text-cathode-white/50 placeholder:uppercase placeholder:text-xs',
            error
              ? 'border-[#FF0000] focus:border-[#FF0000] focus:shadow-[3px_3px_0px_#FF0000]'
              : 'border-basalt-border focus:border-[#00FFFF] focus:shadow-brutal',
            'outline-none',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        
        {(error || helperText) && (
          <p className={clsx(
            'text-brutal-xs',
            error ? 'text-[#FF0000]' : 'text-cathode-white/70'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

BrutalInput.displayName = 'BrutalInput'

export default BrutalInput