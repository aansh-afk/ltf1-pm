/**
 * UNIVERSAL THEME SWITCHER COMPONENT
 * Global theme switching UI for main navigation
 * Supports all 9 themes with preview and accessibility
 */

import React, { useState, useRef, useEffect } from 'react'
import { HiOutlineColorSwatch, HiOutlineX, HiOutlineAdjustments } from 'react-icons/hi'
import { useTheme } from '../../contexts/ThemeContext'
import { globalThemes } from '../../themes/globalThemes'
import type { ThemeName } from '../../themes/themeTypes'
import clsx from 'clsx'
import { BrutalButton } from '@/components/ui'

interface ThemeSwitcherProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'button' | 'dropdown' | 'modal' | 'grid'
}

export default function ThemeSwitcher({
  className,
  showLabel = false,
  size = 'md',
  variant = 'dropdown'
}: ThemeSwitcherProps) {
  const {
    themeName,
    setTheme,
    availableThemes,
    themeDisplayName,
    themeDescription,
    isHighContrast,
    enableHighContrast,
    disableHighContrast,
  } = useTheme()

  const [isOpen, setIsOpen] = useState(false)
  const [hoveredTheme, setHoveredTheme] = useState<ThemeName | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-14 h-14 text-xl',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }

  // Get theme preview colors
  const getThemePreview = (theme: ThemeName) => {
    const themeObj = globalThemes[theme]
    return {
      background: themeObj.colors.background,
      primary: themeObj.colors.primary,
      border: themeObj.colors.border,
      secondary: themeObj.colors.backgroundSecondary,
    }
  }

  // Handle theme selection
  const handleThemeSelect = (theme: ThemeName) => {
    setTheme(theme)
    setIsOpen(false)
  }

  // Current theme preview colors
  const currentPreview = getThemePreview(themeName)

  // Grid variant - display all themes inline
  if (variant === 'grid') {
    return (
      <div className={className}>
        <div className="grid grid-cols-3 gap-3">
          {availableThemes.map((theme) => {
            const preview = getThemePreview(theme)
            const themeObj = globalThemes[theme]
            const isActive = theme === themeName

            return (
              <button
                key={theme}
                onClick={() => handleThemeSelect(theme)}
                className={clsx(
                  'relative p-4 border-2 transition-all duration-200',
                  'hover:translate-x-[-2px] hover:translate-y-[-2px]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
                  isActive && 'shadow-[0_0_15px_var(--theme-glow)]'
                )}
                style={{
                  backgroundColor: preview.background,
                  borderColor: isActive ? preview.primary : preview.border,
                  boxShadow: isActive ? `0 0 10px ${preview.primary}` : '4px 4px 0 var(--theme-shadow)'
                }}
                aria-label={`Select ${themeObj.name} theme`}
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Color preview bar */}
                  <div className="flex gap-1 mb-2">
                    <div
                      className="w-4 h-4 border"
                      style={{
                        backgroundColor: preview.primary,
                        borderColor: preview.border
                      }}
                    />
                    <div
                      className="w-4 h-4 border"
                      style={{
                        backgroundColor: preview.secondary,
                        borderColor: preview.border
                      }}
                    />
                    <div
                      className="w-4 h-4 border"
                      style={{
                        backgroundColor: preview.background,
                        borderColor: preview.border
                      }}
                    />
                  </div>

                  {/* Theme name */}
                  <span
                    className="text-sm font-bold tracking-wider"
                    style={{
                      color: preview.primary,
                      textTransform: themeObj.typography.textTransform as any,
                    }}
                  >
                    {themeObj.name}
                  </span>

                  {/* Description */}
                  {showLabel && (
                    <span
                      className="text-xs mt-1"
                      style={{ color: preview.border }}
                    >
                      {themeObj.description.split(' - ')[1] || themeObj.description}
                    </span>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-3 h-3"
                      style={{ backgroundColor: preview.primary }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* Theme Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'relative overflow-hidden flex items-center justify-center border-2',
          'transition-all duration-200',
          'hover:shadow-[0_0_20px_var(--theme-glow),_8px_8px_0px_var(--theme-shadow)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
          sizeClasses[size]
        )}
        style={{
          backgroundColor: currentPreview.background,
          borderColor: currentPreview.border,
          color: currentPreview.primary,
        }}
        title={`Current theme: ${themeDisplayName} (Click to change)`}
        aria-label="Change theme"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* Theme preview gradient background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(45deg, ${currentPreview.primary}, ${currentPreview.secondary})`,
          }}
        />

        {/* Icon */}
        <HiOutlineColorSwatch className={iconSizes[size]} />

        {/* Active theme indicator */}
        <div
          className="absolute bottom-1 right-1 w-1.5 h-1.5"
          style={{ backgroundColor: currentPreview.primary }}
        />
      </button>

      {/* Optional label */}
      {showLabel && (
        <span className="ml-2 text-sm font-bold text-[var(--theme-foreground-secondary)] uppercase">
          {themeDisplayName}
        </span>
      )}

      {/* Theme Dropdown Menu */}
      {isOpen && (
        <div
          className={clsx(
            'absolute right-0 top-full mt-2',
            'w-80',
            'bg-[var(--theme-background-secondary)]',
            'border-2 border-[var(--theme-border)]',
            'shadow-[var(--theme-box-shadow)]',
            'z-50 p-4',
            'animate-brutal-fade'
          )}
          role="menu"
          aria-label="Theme selection menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold uppercase text-[var(--theme-foreground)] mb-1">
                THEME SELECTOR
              </h3>
              <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
                Choose your visual style
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center border-2 border-[var(--theme-border)] hover:bg-[var(--theme-foreground)] hover:text-[var(--theme-background)] transition-colors"
              aria-label="Close theme selector"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {availableThemes.map((theme) => {
              const preview = getThemePreview(theme)
              const themeObj = globalThemes[theme]
              const isActive = theme === themeName
              const isHovered = theme === hoveredTheme

              return (
                <button
                  key={theme}
                  onClick={() => handleThemeSelect(theme)}
                  onMouseEnter={() => setHoveredTheme(theme)}
                  onMouseLeave={() => setHoveredTheme(null)}
                  className={clsx(
                    'relative p-2 border-2 transition-all duration-200',
                    'hover:translate-x-[-2px] hover:translate-y-[-2px]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
                    isActive ? 'border-[var(--theme-primary)]' : 'border-[var(--theme-border)]',
                    isActive && 'shadow-[0_0_15px_var(--theme-glow)]'
                  )}
                  style={{
                    backgroundColor: preview.background,
                    borderColor: isActive ? preview.primary : preview.border,
                  }}
                  role="menuitem"
                  aria-label={`Select ${themeObj.name} theme`}
                >
                  {/* Theme preview */}
                  <div className="flex flex-col items-center gap-1">
                    {/* Color samples */}
                    <div className="flex gap-0.5">
                      <div
                        className="w-2 h-2"
                        style={{ backgroundColor: preview.primary }}
                      />
                      <div
                        className="w-2 h-2"
                        style={{ backgroundColor: preview.border }}
                      />
                      <div
                        className="w-2 h-2"
                        style={{ backgroundColor: preview.secondary }}
                      />
                    </div>

                    {/* Theme name */}
                    <span
                      className="text-[10px] font-bold tracking-wider"
                      style={{
                        color: preview.primary,
                        textTransform: themeObj.typography.textTransform as any,
                      }}
                    >
                      {themeObj.name}
                    </span>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-2 h-2"
                      style={{ backgroundColor: preview.primary }}
                    />
                  )}

                  {/* Hover effect */}
                  {isHovered && (
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{ backgroundColor: preview.primary }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Theme Info */}
          {hoveredTheme && (
            <div className="mb-4 p-2 bg-[var(--theme-background)] border border-[var(--theme-border)]">
              <h4 className="text-sm font-bold uppercase text-[var(--theme-primary)] mb-0.5">
                {globalThemes[hoveredTheme].name}
              </h4>
              <p className="text-xs text-[var(--theme-foreground-secondary)] font-mono">
                {globalThemes[hoveredTheme].description}
              </p>
            </div>
          )}

          {/* Accessibility Options */}
          <div className="border-t-2 border-[var(--theme-border)] pt-4">
            <h4 className="text-sm font-bold uppercase text-[var(--theme-foreground)] mb-2 flex items-center gap-2">
              <HiOutlineAdjustments className="w-4 h-4" />
              ACCESSIBILITY
            </h4>

            <button
              onClick={isHighContrast ? disableHighContrast : enableHighContrast}
              className={clsx(
                'w-full p-2 border-2 transition-all duration-200',
                'hover:translate-x-[-1px] hover:translate-y-[-1px]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
                isHighContrast
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                  : 'bg-[var(--theme-background)] text-[var(--theme-foreground)] border-[var(--theme-border)]'
              )}
            >
              <span className="text-xs font-bold uppercase font-mono">
                {isHighContrast ? '✓ HIGH CONTRAST ENABLED' : 'ENABLE HIGH CONTRAST'}
              </span>
            </button>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="mt-4 text-xs font-mono text-[var(--theme-foreground-tertiary)]">
            <p>KEYBOARD SHORTCUTS:</p>
            <p>• CTRL+SHIFT+T: NEXT THEME</p>
            <p>• CTRL+SHIFT+H: TOGGLE HIGH CONTRAST</p>
          </div>
        </div>
      )}
    </div>
  )
}