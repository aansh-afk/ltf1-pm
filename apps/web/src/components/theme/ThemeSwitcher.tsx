/**
 * THEME SWITCHER COMPONENT
 * Supports grid (settings page) and dropdown (nav bar) variants
 */

import React, { useState, useRef, useEffect } from 'react'
import { HiOutlineColorSwatch, HiOutlineX, HiOutlineAdjustments } from 'react-icons/hi'
import { useTheme } from '@/contexts/ThemeContext'
import { globalThemes } from '@/themes/globalThemes'
import type { ThemeName } from '@/themes/themeTypes'
import clsx from 'clsx'

interface ThemeSwitcherProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'button' | 'dropdown' | 'modal' | 'grid'
}

// Shared theme card used by both grid and dropdown
function ThemeCard({
  theme,
  isActive,
  onClick,
  showDescription = false,
}: {
  theme: ThemeName
  isActive: boolean
  onClick: () => void
  showDescription?: boolean
}) {
  const themeObj = globalThemes[theme]
  const colors = themeObj.colors

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative p-3 border-2 group',
        'hover:translate-x-[-1px] hover:translate-y-[-1px]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
      )}
      style={{
        backgroundColor: colors.background,
        borderColor: isActive ? colors.primary : colors.border,
        boxShadow: isActive
          ? `0 0 12px ${colors.primary}40`
          : `3px 3px 0 ${colors.shadow}`,
      }}
      aria-label={`Select ${themeObj.name} theme`}
    >
      {/* Color palette bar */}
      <div className="flex gap-[3px] mb-2 justify-center">
        <div className="w-3 h-3" style={{ backgroundColor: colors.primary }} />
        <div className="w-3 h-3" style={{ backgroundColor: colors.info }} />
        <div className="w-3 h-3" style={{ backgroundColor: colors.success }} />
        <div className="w-3 h-3" style={{ backgroundColor: colors.warning }} />
        <div className="w-3 h-3" style={{ backgroundColor: colors.error }} />
      </div>

      {/* Theme name */}
      <span
        className="block text-[10px] font-bold tracking-wider text-center leading-tight"
        style={{ color: colors.foreground }}
      >
        {themeObj.name}
      </span>

      {/* Description */}
      {showDescription && (
        <span
          className="block text-[9px] mt-1 text-center leading-tight"
          style={{ color: colors.foregroundTertiary }}
        >
          {themeObj.description.split(' — ')[1] || themeObj.description}
        </span>
      )}

      {/* Active check indicator */}
      {isActive && (
        <div
          className="absolute top-1 right-1 w-2 h-2"
          style={{ backgroundColor: colors.primary }}
        />
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10"
        style={{ backgroundColor: colors.primary }}
      />
    </button>
  )
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
    isHighContrast,
    enableHighContrast,
    disableHighContrast,
  } = useTheme()

  const [isOpen, setIsOpen] = useState(false)
  const [hoveredTheme, setHoveredTheme] = useState<ThemeName | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleThemeSelect = (theme: ThemeName) => {
    setTheme(theme)
    setIsOpen(false)
  }

  const currentColors = globalThemes[themeName].colors

  // ─── GRID VARIANT (Settings page) ───
  if (variant === 'grid') {
    return (
      <div className={className}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availableThemes.map((theme) => (
            <ThemeCard
              key={theme}
              theme={theme}
              isActive={theme === themeName}
              onClick={() => setTheme(theme)}
              showDescription={showLabel}
            />
          ))}
        </div>

        {/* Current theme info */}
        <div className="mt-4 p-3 border border-[var(--theme-border)] bg-[var(--theme-background)]">
          <div className="flex items-center gap-3">
            <div className="flex gap-[2px]">
              <div className="w-4 h-4" style={{ backgroundColor: currentColors.primary }} />
              <div className="w-4 h-4" style={{ backgroundColor: currentColors.info }} />
              <div className="w-4 h-4" style={{ backgroundColor: currentColors.success }} />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--theme-primary)] uppercase">
                {themeDisplayName}
              </span>
              <span className="text-xs text-[var(--theme-foreground-tertiary)] ml-2">
                {globalThemes[themeName].description}
              </span>
            </div>
          </div>
        </div>

        {/* High contrast toggle */}
        <div className="mt-3">
          <button
            onClick={isHighContrast ? disableHighContrast : enableHighContrast}
            className={clsx(
              'w-full p-2 border-2 text-xs font-bold uppercase font-mono',
              'hover:translate-x-[-1px] hover:translate-y-[-1px]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
              isHighContrast
                ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                : 'bg-[var(--theme-background)] text-[var(--theme-foreground)] border-[var(--theme-border)]'
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <HiOutlineAdjustments className="w-3 h-3" />
              {isHighContrast ? 'HIGH CONTRAST ON' : 'ENABLE HIGH CONTRAST'}
            </span>
          </button>
        </div>

        <p className="mt-2 text-[10px] font-mono text-[var(--theme-foreground-tertiary)]">
          CTRL+SHIFT+T: CYCLE THEMES &nbsp; CTRL+SHIFT+H: TOGGLE CONTRAST
        </p>
      </div>
    )
  }

  // ─── DROPDOWN VARIANT (Nav bar) ───
  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'relative overflow-hidden flex items-center justify-center border-2',
          'hover:shadow-[0_0_20px_var(--theme-glow),_6px_6px_0px_var(--theme-shadow)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
          sizeClasses[size]
        )}
        style={{
          backgroundColor: currentColors.background,
          borderColor: currentColors.border,
          color: currentColors.primary,
        }}
        title={`Current theme: ${themeDisplayName}`}
        aria-label="Change theme"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `linear-gradient(45deg, ${currentColors.primary}, ${currentColors.backgroundSecondary})` }}
        />
        <HiOutlineColorSwatch className={iconSizes[size]} />
        <div
          className="absolute bottom-1 right-1 w-1.5 h-1.5"
          style={{ backgroundColor: currentColors.primary }}
        />
      </button>

      {showLabel && (
        <span className="ml-2 text-sm font-bold text-[var(--theme-foreground-secondary)] uppercase">
          {themeDisplayName}
        </span>
      )}

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[340px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] shadow-[var(--theme-box-shadow)] z-50 p-4"
          role="menu"
          aria-label="Theme selection menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold uppercase text-[var(--theme-foreground)]">
                THEME SELECTOR
              </h3>
              <p className="text-[10px] text-[var(--theme-foreground-tertiary)] font-mono">
                Choose your editor theme
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center border border-[var(--theme-border)] hover:bg-[var(--theme-foreground)] hover:text-[var(--theme-background)]"
              aria-label="Close"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {availableThemes.map((theme) => {
              const themeObj = globalThemes[theme]
              const colors = themeObj.colors
              const isActive = theme === themeName
              const isHovered = theme === hoveredTheme

              return (
                <button
                  key={theme}
                  onClick={() => handleThemeSelect(theme)}
                  onMouseEnter={() => setHoveredTheme(theme)}
                  onMouseLeave={() => setHoveredTheme(null)}
                  className={clsx(
                    'relative p-2 border-2 group',
                    'hover:translate-x-[-1px] hover:translate-y-[-1px]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
                  )}
                  style={{
                    backgroundColor: colors.background,
                    borderColor: isActive ? colors.primary : colors.border,
                    boxShadow: isActive ? `0 0 10px ${colors.primary}40` : undefined,
                  }}
                  role="menuitem"
                  aria-label={`Select ${themeObj.name} theme`}
                >
                  {/* Color dots */}
                  <div className="flex gap-[2px] mb-1.5 justify-center">
                    <div className="w-2 h-2" style={{ backgroundColor: colors.primary }} />
                    <div className="w-2 h-2" style={{ backgroundColor: colors.info }} />
                    <div className="w-2 h-2" style={{ backgroundColor: colors.success }} />
                    <div className="w-2 h-2" style={{ backgroundColor: colors.warning }} />
                  </div>

                  {/* Name */}
                  <span
                    className="block text-[9px] font-bold tracking-wider text-center leading-tight"
                    style={{ color: colors.foreground }}
                  >
                    {themeObj.name}
                  </span>

                  {isActive && (
                    <div
                      className="absolute top-0.5 right-0.5 w-1.5 h-1.5"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}

                  {isHovered && (
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{ backgroundColor: colors.primary }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Hovered theme info */}
          {hoveredTheme && (
            <div className="mb-3 p-2 bg-[var(--theme-background)] border border-[var(--theme-border)]">
              <span className="text-xs font-bold text-[var(--theme-primary)] uppercase">
                {globalThemes[hoveredTheme].name}
              </span>
              <span className="text-[10px] text-[var(--theme-foreground-secondary)] font-mono ml-2">
                {globalThemes[hoveredTheme].description}
              </span>
            </div>
          )}

          {/* High contrast */}
          <div className="border-t border-[var(--theme-border)] pt-3">
            <button
              onClick={isHighContrast ? disableHighContrast : enableHighContrast}
              className={clsx(
                'w-full p-2 border text-[10px] font-bold uppercase font-mono',
                'hover:translate-x-[-1px] hover:translate-y-[-1px]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]',
                isHighContrast
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-background)] border-[var(--theme-primary)]'
                  : 'bg-[var(--theme-background)] text-[var(--theme-foreground)] border-[var(--theme-border)]'
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <HiOutlineAdjustments className="w-3 h-3" />
                {isHighContrast ? 'HIGH CONTRAST ON' : 'HIGH CONTRAST'}
              </span>
            </button>
          </div>

          <p className="mt-2 text-[9px] font-mono text-[var(--theme-foreground-tertiary)]">
            CTRL+SHIFT+T: NEXT &nbsp; CTRL+SHIFT+H: CONTRAST
          </p>
        </div>
      )}
    </div>
  )
}
