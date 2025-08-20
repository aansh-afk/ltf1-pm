import { useRef, useState } from 'react'
import clsx from 'clsx'

interface BrutalSliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  label?: string
  unit?: string
  disabled?: boolean
  showValue?: boolean
}

export default function BrutalSlider({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  label,
  unit = '',
  disabled = false,
  showValue = true
}: BrutalSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-8px">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-8px">
          {label && (
            <label className="text-brutal-sm uppercase tracking-wider text-[var(--theme-foreground)]">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-brutal-md font-mono text-[var(--theme-foreground)]">
              {value}{unit}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => !disabled && onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className={clsx(
            'brutal-slider w-full h-8px appearance-none cursor-pointer',
            'border-2 focus:outline-none',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          style={{
            backgroundColor: 'var(--theme-background-secondary)',
            borderColor: 'var(--theme-border)',
            background: `linear-gradient(to right, var(--theme-primary) 0%, var(--theme-primary) ${percentage}%, var(--theme-background-secondary) ${percentage}%, var(--theme-background-secondary) 100%)`
          }}
        />
        
        {/* Min/Max labels */}
        <div className="flex justify-between mt-4px">
          <span className="text-brutal-xs font-mono text-[var(--theme-foreground)]/60">
            {min}{unit}
          </span>
          <span className="text-brutal-xs font-mono text-[var(--theme-foreground)]/60">
            {max}{unit}
          </span>
        </div>
      </div>
    </div>
  )
}