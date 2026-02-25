import React, { useState, useEffect } from 'react'
import { HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi'
import BrutalSelect from '../../ui/BrutalSelect'

// Style types
export interface ElementStyle {
  // Stroke
  stroke: string
  strokeWidth: number
  strokeOpacity: number
  strokeStyle: 'solid' | 'dashed' | 'dotted'

  // Fill
  fill: string
  fillOpacity: number
  fillPattern: 'none' | 'solid' | 'hachure' | 'cross-hatch' | 'dots' | 'zigzag'

  // Background
  backgroundColor?: string
  backgroundOpacity?: number
}

interface StylePropertiesPanelProps {
  selectedElements: string[]
  elements: any[]
  onStyleChange: (elementIds: string[], style: Partial<ElementStyle>) => void
}

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b-2 border-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-mono text-xs font-bold uppercase tracking-wider">
          {title}
        </span>
        {isOpen ? (
          <HiOutlineChevronDown className="w-4 h-4 text-white" />
        ) : (
          <HiOutlineChevronRight className="w-4 h-4 text-white" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 space-y-3 bg-black/50">
          {children}
        </div>
      )}
    </div>
  )
}

interface ControlProps {
  label: string
  children: React.ReactNode
}

function Control({ label, children }: ControlProps) {
  return (
    <div className="space-y-1">
      <label className="text-white font-mono text-xs uppercase tracking-wide opacity-70">
        {label}
      </label>
      {children}
    </div>
  )
}

interface RangeSliderProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}

function RangeSlider({ value, onChange, min, max, step = 1, unit = '' }: RangeSliderProps) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 h-2 bg-white/20 rounded-none appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:bg-cyan-400
                   [&::-webkit-slider-thumb]:border-2
                   [&::-webkit-slider-thumb]:border-white
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-4
                   [&::-moz-range-thumb]:h-4
                   [&::-moz-range-thumb]:bg-cyan-400
                   [&::-moz-range-thumb]:border-2
                   [&::-moz-range-thumb]:border-white
                   [&::-moz-range-thumb]:rounded-none
                   [&::-moz-range-thumb]:cursor-pointer"
      />
      <span className="text-white font-mono text-xs w-12 text-right">
        {value}{unit}
      </span>
    </div>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-12 border-2 border-white cursor-pointer bg-transparent"
      />
      <div className="flex-1">
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black border-2 border-white text-white font-mono text-xs p-2 uppercase focus:border-cyan-400 focus:outline-none"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

function Dropdown({ value, onChange, options }: DropdownProps) {
  return (
    <BrutalSelect
      value={value}
      onChange={onChange}
      options={options}
      fullWidth
    />
  )
}

interface PatternSelectorProps {
  value: string
  onChange: (value: string) => void
}

function PatternSelector({ value, onChange }: PatternSelectorProps) {
  const patterns = [
    { value: 'none', label: 'NONE' },
    { value: 'solid', label: 'SOLID' },
    { value: 'hachure', label: 'HACHURE' },
    { value: 'cross-hatch', label: 'CROSS-HATCH' },
    { value: 'dots', label: 'DOTS' },
    { value: 'zigzag', label: 'ZIGZAG' }
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {patterns.map(pattern => (
        <button
          key={pattern.value}
          onClick={() => onChange(pattern.value)}
          className={`p-2 border-2 transition-colors ${
            value === pattern.value
              ? 'border-cyan-400 bg-cyan-400/20'
              : 'border-white hover:bg-white/10'
          }`}
        >
          <div className="aspect-square w-full flex items-center justify-center">
            <PatternPreview pattern={pattern.value} />
          </div>
          <span className="text-white font-mono text-[10px] mt-1 block">
            {pattern.label}
          </span>
        </button>
      ))}
    </div>
  )
}

function PatternPreview({ pattern }: { pattern: string }) {
  const size = 24

  switch (pattern) {
    case 'none':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x="0" y="0" width="24" height="24" fill="transparent" stroke="white" strokeWidth="2" />
          <line x1="0" y1="24" x2="24" y2="0" stroke="white" strokeWidth="1" />
        </svg>
      )
    case 'solid':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect x="0" y="0" width="24" height="24" fill="white" />
        </svg>
      )
    case 'hachure':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <defs>
            <pattern id="preview-hachure" width="4" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="4" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="24" height="24" fill="url(#preview-hachure)" />
        </svg>
      )
    case 'cross-hatch':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <defs>
            <pattern id="preview-crosshatch" width="4" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="4" stroke="white" strokeWidth="1" />
              <line x1="0" y1="0" x2="4" y2="0" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="24" height="24" fill="url(#preview-crosshatch)" />
        </svg>
      )
    case 'dots':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <defs>
            <pattern id="preview-dots" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="24" height="24" fill="url(#preview-dots)" />
        </svg>
      )
    case 'zigzag':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <defs>
            <pattern id="preview-zigzag" width="8" height="4" patternUnits="userSpaceOnUse">
              <path d="M 0 2 L 2 0 L 4 2 L 6 0 L 8 2" stroke="white" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="24" height="24" fill="url(#preview-zigzag)" />
        </svg>
      )
    default:
      return null
  }
}

export default function StylePropertiesPanel({
  selectedElements,
  elements,
  onStyleChange
}: StylePropertiesPanelProps) {
  // Get current style from selected elements
  const getAverageStyle = (): ElementStyle => {
    if (selectedElements.length === 0) {
      return {
        stroke: '#000000',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        fill: '#FFFFFF',
        fillOpacity: 1,
        fillPattern: 'solid',
        backgroundColor: '#FFFFFF',
        backgroundOpacity: 1
      }
    }

    const selectedElementObjects = elements.filter(el => selectedElements.includes(el.id))
    const firstElement = selectedElementObjects[0]

    return {
      stroke: firstElement?.style?.stroke || '#000000',
      strokeWidth: firstElement?.style?.strokeWidth || 2,
      strokeOpacity: firstElement?.style?.strokeOpacity ?? 1,
      strokeStyle: firstElement?.style?.strokeStyle || 'solid',
      fill: firstElement?.style?.fill || '#FFFFFF',
      fillOpacity: firstElement?.style?.fillOpacity ?? 1,
      fillPattern: firstElement?.style?.fillPattern || 'solid',
      backgroundColor: firstElement?.style?.backgroundColor,
      backgroundOpacity: firstElement?.style?.backgroundOpacity ?? 1
    }
  }

  const [currentStyle, setCurrentStyle] = useState<ElementStyle>(getAverageStyle())

  // Update current style when selection changes
  useEffect(() => {
    setCurrentStyle(getAverageStyle())
  }, [selectedElements, elements])

  // Handle style changes
  const handleStyleChange = (changes: Partial<ElementStyle>) => {
    const newStyle = { ...currentStyle, ...changes }
    setCurrentStyle(newStyle)
    onStyleChange(selectedElements, changes)
  }

  if (selectedElements.length === 0) {
    return null
  }

  return (
    <div className="absolute right-4 top-20 w-80 bg-black border-2 border-white max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Header */}
      <div className="bg-black border-b-2 border-white p-3">
        <h3 className="text-white font-mono text-sm font-bold uppercase tracking-wider">
          PROPERTIES
        </h3>
        <p className="text-gray-400 font-mono text-xs mt-1">
          {selectedElements.length} element{selectedElements.length > 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Stroke Section */}
      <CollapsibleSection title="STROKE" defaultOpen={true}>
        <Control label="COLOR">
          <ColorPicker
            value={currentStyle.stroke}
            onChange={(value) => handleStyleChange({ stroke: value })}
          />
        </Control>

        <Control label="WIDTH">
          <RangeSlider
            value={currentStyle.strokeWidth}
            onChange={(value) => handleStyleChange({ strokeWidth: value })}
            min={1}
            max={10}
            step={0.5}
            unit="px"
          />
        </Control>

        <Control label="OPACITY">
          <RangeSlider
            value={currentStyle.strokeOpacity * 100}
            onChange={(value) => handleStyleChange({ strokeOpacity: value / 100 })}
            min={0}
            max={100}
            step={1}
            unit="%"
          />
        </Control>

        <Control label="STYLE">
          <Dropdown
            value={currentStyle.strokeStyle}
            onChange={(value) => handleStyleChange({ strokeStyle: value as any })}
            options={[
              { value: 'solid', label: 'SOLID' },
              { value: 'dashed', label: 'DASHED' },
              { value: 'dotted', label: 'DOTTED' }
            ]}
          />
        </Control>
      </CollapsibleSection>

      {/* Fill Section */}
      <CollapsibleSection title="FILL" defaultOpen={true}>
        <Control label="COLOR">
          <ColorPicker
            value={currentStyle.fill}
            onChange={(value) => handleStyleChange({ fill: value })}
          />
        </Control>

        <Control label="OPACITY">
          <RangeSlider
            value={currentStyle.fillOpacity * 100}
            onChange={(value) => handleStyleChange({ fillOpacity: value / 100 })}
            min={0}
            max={100}
            step={1}
            unit="%"
          />
        </Control>

        <Control label="PATTERN">
          <PatternSelector
            value={currentStyle.fillPattern}
            onChange={(value) => handleStyleChange({ fillPattern: value as any })}
          />
        </Control>
      </CollapsibleSection>

      {/* Background Section */}
      <CollapsibleSection title="BACKGROUND" defaultOpen={false}>
        <Control label="COLOR">
          <ColorPicker
            value={currentStyle.backgroundColor || '#FFFFFF'}
            onChange={(value) => handleStyleChange({ backgroundColor: value })}
          />
        </Control>

        <Control label="OPACITY">
          <RangeSlider
            value={(currentStyle.backgroundOpacity ?? 1) * 100}
            onChange={(value) => handleStyleChange({ backgroundOpacity: value / 100 })}
            min={0}
            max={100}
            step={1}
            unit="%"
          />
        </Control>
      </CollapsibleSection>
    </div>
  )
}
