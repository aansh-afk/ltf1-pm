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

interface ThemeSwitcherProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'dropdown' | 'modal'
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
    sm: 'w-32px h-32px text-sm',
    md: 'w-40px h-40px text-base',
    lg: 'w-48px h-48px text-lg',
  }
  
  const iconSizes = {
    sm: 'w-16px h-16px',
    md: 'w-20px h-20px',  
    lg: 'w-24px h-24px',
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
  
  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* Theme Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'brutal-icon-btn',
          'relative overflow-hidden',
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
          className="absolute bottom-1 right-1 w-6px h-6px"
          style={{ backgroundColor: currentPreview.primary }}
        />
      </button>
      
      {/* Optional label */}
      {showLabel && (
        <span className="ml-8px text-brutal-sm text-[var(--theme-foreground-secondary)]">
          {themeDisplayName}
        </span>
      )}
      
      {/* Theme Dropdown Menu */}
      {isOpen && (
        <div 
          className={clsx(
            'absolute right-0 top-full mt-8px',
            'min-w-280px max-w-400px',
            'bg-[var(--theme-background-secondary)]',
            'border-2 border-[var(--theme-border)]',
            'shadow-[var(--theme-box-shadow)]',
            'z-50 p-16px',
            'animate-brutal-fade'
          )}
          role="menu"
          aria-label="Theme selection menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-16px">
            <div>
              <h3 className="text-brutal-lg text-[var(--theme-foreground)] mb-4px">
                THEME SELECTOR
              </h3>
              <p className="text-brutal-xs text-[var(--theme-foreground-secondary)]">
                Choose your visual style
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="brutal-icon-btn w-32px h-32px"
              aria-label="Close theme selector"
            >
              <HiOutlineX className="w-16px h-16px" />
            </button>
          </div>
          
          {/* Theme Grid */}
          <div className="grid grid-cols-3 gap-8px mb-16px">
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
                    'relative p-8px border-2 transition-all duration-200',
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
                  <div className="flex flex-col items-center gap-4px">
                    {/* Color samples */}
                    <div className="flex gap-2px">
                      <div 
                        className="w-8px h-8px"
                        style={{ backgroundColor: preview.primary }}
                      />
                      <div 
                        className="w-8px h-8px"
                        style={{ backgroundColor: preview.border }}
                      />
                      <div 
                        className="w-8px h-8px"
                        style={{ backgroundColor: preview.secondary }}
                      />
                    </div>
                    
                    {/* Theme name */}
                    <span 
                      className="text-brutal-xs font-bold tracking-wider"
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
                      className="absolute -top-1 -right-1 w-8px h-8px"
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
            <div className="mb-16px p-8px bg-[var(--theme-background)] border border-[var(--theme-border)]">
              <h4 className="text-brutal-sm text-[var(--theme-primary)] mb-2px">
                {globalThemes[hoveredTheme].name}
              </h4>
              <p className="text-brutal-xs text-[var(--theme-foreground-secondary)]">
                {globalThemes[hoveredTheme].description}
              </p>
            </div>
          )}
          
          {/* Accessibility Options */}
          <div className="border-t-2 border-[var(--theme-border)] pt-16px">
            <h4 className="text-brutal-sm text-[var(--theme-foreground)] mb-8px flex items-center gap-8px">
              <HiOutlineAdjustments className="w-16px h-16px" />
              ACCESSIBILITY
            </h4>
            
            <button
              onClick={isHighContrast ? disableHighContrast : enableHighContrast}
              className={clsx(
                'w-full p-8px border-2 transition-all duration-200',
                'hover:translate-x-[-1px] hover:translate-y-[-1px]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
                isHighContrast 
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                  : 'bg-[var(--theme-background)] text-[var(--theme-foreground)] border-[var(--theme-border)]'
              )}
            >
              <span className="text-brutal-xs">
                {isHighContrast ? '✓ HIGH CONTRAST ENABLED' : 'ENABLE HIGH CONTRAST'}
              </span>
            </button>
          </div>
          
          {/* Keyboard Shortcuts Info */}
          <div className="mt-16px text-brutal-xs text-[var(--theme-foreground-tertiary)]">
            <p>Keyboard shortcuts:</p>
            <p>• Ctrl+Shift+T: Next theme</p>
            <p>• Ctrl+Shift+H: Toggle high contrast</p>
          </div>
        </div>
      )}
    </div>
  )
}