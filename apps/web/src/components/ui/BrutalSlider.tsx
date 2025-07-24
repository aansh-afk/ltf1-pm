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
            <label className="text-brutal-sm uppercase tracking-wider">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-brutal-md font-mono">
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
            'w-full h-8px appearance-none cursor-pointer bg-carbon-plate',
            'border-2 border-basalt-border',
            'focus:outline-none focus:border-primary-brutalist',
            disabled && 'cursor-not-allowed opacity-50',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-24px',
            '[&::-webkit-slider-thumb]:h-24px',
            '[&::-webkit-slider-thumb]:bg-primary-brutalist',
            '[&::-webkit-slider-thumb]:border-2',
            '[&::-webkit-slider-thumb]:border-basalt-border',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-all',
            '[&::-webkit-slider-thumb]:hover:bg-yellow-400',
            '[&::-moz-range-thumb]:appearance-none',
            '[&::-moz-range-thumb]:w-24px',
            '[&::-moz-range-thumb]:h-24px',
            '[&::-moz-range-thumb]:bg-primary-brutalist',
            '[&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-basalt-border',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:transition-all',
            '[&::-moz-range-thumb]:hover:bg-yellow-400',
          )}
          style={{
            background: `linear-gradient(to right, #FFFF00 0%, #FFFF00 ${percentage}%, #1A1A1A ${percentage}%, #1A1A1A 100%)`
          }}
        />
        
        {/* Min/Max labels */}
        <div className="flex justify-between mt-4px">
          <span className="text-brutal-xs font-mono text-neutral-600">
            {min}{unit}
          </span>
          <span className="text-brutal-xs font-mono text-neutral-600">
            {max}{unit}
          </span>
        </div>
      </div>
    </div>
  )
}