/**
 * GLOBAL THEME CONTEXT PROVIDER
 * React context system for dynamic theme management
 * Includes persistence, performance optimization, and accessibility
 * 
 * PERFORMANCE OPTIMIZED:
 * - Batched CSS custom property updates
 * - CSS containment for paint optimization
 * - Performance monitoring and metrics
 * - Brutalist Protocol v2.0 compliant (instant changes)
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { 
  globalThemes, 
  getGlobalTheme, 
  getGlobalThemeNames,
  generateCSSCustomProperties 
} from '@/themes/globalThemes'
import type { GlobalTheme, ThemeName } from '@/themes/themeTypes'
import { themePerformanceOptimizer, ThemePerformanceUtils } from '@/utils/themePerformance'

interface ThemeContextType {
  // Current theme state
  currentTheme: GlobalTheme
  themeName: ThemeName
  
  // Theme switching
  setTheme: (name: ThemeName) => void
  switchToNextTheme: () => void
  switchToPreviousTheme: () => void
  
  // Theme information
  availableThemes: ThemeName[]
  themeDisplayName: string
  themeDescription: string
  
  // Loading state
  isLoading: boolean
  
  // Accessibility
  enableHighContrast: () => void
  disableHighContrast: () => void
  isHighContrast: boolean
  
  // Performance monitoring
  getPerformanceMetrics: () => any
  optimizeMemory: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Theme persistence utilities
const THEME_STORAGE_KEY = 'ltf1-global-theme'
const HIGH_CONTRAST_KEY = 'ltf1-high-contrast'

const saveThemePreference = (themeName: ThemeName): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeName)
  } catch (error) {
    console.warn('Failed to save theme preference:', error)
  }
}

const loadThemePreference = (): ThemeName => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName
    if (saved && saved in globalThemes) {
      return saved
    }
  } catch (error) {
    console.warn('Failed to load theme preference:', error)
  }
  return 'obsidian' // Default fallback
}

const saveHighContrastPreference = (enabled: boolean): void => {
  try {
    localStorage.setItem(HIGH_CONTRAST_KEY, enabled.toString())
  } catch (error) {
    console.warn('Failed to save high contrast preference:', error)
  }
}

const loadHighContrastPreference = (): boolean => {
  try {
    const saved = localStorage.getItem(HIGH_CONTRAST_KEY)
    return saved === 'true'
  } catch (error) {
    console.warn('Failed to load high contrast preference:', error)
    return false
  }
}

// PERFORMANCE-OPTIMIZED CSS Custom Properties applier
const applyCSSCustomProperties = async (theme: GlobalTheme): Promise<void> => {
  const properties = generateCSSCustomProperties(theme)
  
  // Use performance optimizer for batched updates
  await themePerformanceOptimizer.optimizedThemeSwitch(properties)
  
  // Apply theme-specific data attributes (separate from performance-critical CSS props)
  const root = document.documentElement
  root.setAttribute('data-theme', theme.name.toLowerCase())
  
  // Apply special effects with performance measurement
  ThemePerformanceUtils.measureThemeOperation('theme-effects', () => {
    if (theme.effects.scanlines) {
      root.setAttribute('data-scanlines', 'true')
    } else {
      root.removeAttribute('data-scanlines')
    }
    
    if (theme.effects.textShadow) {
      root.setAttribute('data-text-shadow', 'true')
    } else {
      root.removeAttribute('data-text-shadow')
    }
  })
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(() => loadThemePreference())
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => loadHighContrastPreference())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  const currentTheme = getGlobalTheme(themeName)
  const availableThemes = getGlobalThemeNames()
  
  // Apply theme changes to CSS custom properties with performance optimization
  useEffect(() => {
    const applyThemeWithPerformanceTracking = async () => {
      // Measure theme application performance
      await ThemePerformanceUtils.measureThemeOperation('theme-switch', async () => {
        await applyCSSCustomProperties(currentTheme)
        
        // Handle high contrast mode (instant change)
        if (isHighContrast) {
          document.documentElement.setAttribute('data-accessibility', 'high-contrast')
        } else {
          document.documentElement.removeAttribute('data-accessibility')
        }
      })
      
      // Mark as loaded after first theme application
      setIsLoading(false)
    }
    
    applyThemeWithPerformanceTracking()
  }, [currentTheme, isHighContrast])
  
  // Performance-optimized theme switching functions
  const setTheme = useCallback((name: ThemeName) => {
    if (name in globalThemes) {
      // Use debounced theme switching to prevent performance issues
      ThemePerformanceUtils.debouncedThemeSwitch(() => {
        setThemeName(name)
        saveThemePreference(name)
      }, 50) // 50ms debounce for optimal performance
    }
  }, [])
  
  const switchToNextTheme = useCallback(() => {
    // Performance measurement for theme cycling
    ThemePerformanceUtils.measureThemeOperation('theme-cycle-next', () => {
      const currentIndex = availableThemes.indexOf(themeName)
      const nextIndex = (currentIndex + 1) % availableThemes.length
      setTheme(availableThemes[nextIndex])
    })
  }, [themeName, availableThemes, setTheme])
  
  const switchToPreviousTheme = useCallback(() => {
    // Performance measurement for theme cycling
    ThemePerformanceUtils.measureThemeOperation('theme-cycle-previous', () => {
      const currentIndex = availableThemes.indexOf(themeName)
      const previousIndex = currentIndex === 0 ? availableThemes.length - 1 : currentIndex - 1
      setTheme(availableThemes[previousIndex])
    })
  }, [themeName, availableThemes, setTheme])
  
  // Accessibility functions
  const enableHighContrast = useCallback(() => {
    setIsHighContrast(true)
    saveHighContrastPreference(true)
  }, [])
  
  const disableHighContrast = useCallback(() => {
    setIsHighContrast(false)
    saveHighContrastPreference(false)
  }, [])
  
  // Keyboard shortcuts for theme switching
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + T for next theme
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        switchToNextTheme()
      }
      
      // Ctrl/Cmd + Shift + H for high contrast toggle
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault()
        if (isHighContrast) {
          disableHighContrast()
        } else {
          enableHighContrast()
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [switchToNextTheme, isHighContrast, enableHighContrast, disableHighContrast])
  
  // Performance monitoring functions - define before contextValue
  const getPerformanceMetrics = useCallback(() => {
    return themePerformanceOptimizer.auditThemePerformance()
  }, [])
  
  const optimizeMemory = useCallback(() => {
    themePerformanceOptimizer.optimizeThemeMemory()
  }, [])
  
  // Performance monitoring and cleanup
  useEffect(() => {
    // Check browser performance capabilities on mount
    const capabilities = ThemePerformanceUtils.checkPerformanceCapabilities()
    if (!capabilities.customProperties) {
      console.warn('CSS Custom Properties not supported - using fallback mode')
    }
    
    // Enable CSS containment for performance
    themePerformanceOptimizer.enableCSSContainment()
    
    // Cleanup on unmount
    return () => {
      themePerformanceOptimizer.cleanup()
    }
  }, [])
  
  const contextValue: ThemeContextType = {
    currentTheme,
    themeName,
    setTheme,
    switchToNextTheme,
    switchToPreviousTheme,
    availableThemes,
    themeDisplayName: currentTheme.name,
    themeDescription: currentTheme.description,
    isLoading,
    enableHighContrast,
    disableHighContrast,
    isHighContrast,
    getPerformanceMetrics,
    optimizeMemory,
  }
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook for using theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Utility hooks for specific theme aspects
export function useThemeColors() {
  const { currentTheme } = useTheme()
  return currentTheme.colors
}

export function useThemeEffects() {
  const { currentTheme } = useTheme()
  return currentTheme.effects
}

export function useThemeTypography() {
  const { currentTheme } = useTheme()
  return currentTheme.typography
}

export function useThemeComponents() {
  const { currentTheme } = useTheme()
  return currentTheme.components
}

// Theme detection hook for component-specific styling
export function useIsTheme(targetTheme: ThemeName): boolean {
  const { themeName } = useTheme()
  return themeName === targetTheme
}

// System theme detection (optional enhancement)
export function useSystemThemeDetection(): 'light' | 'dark' | null {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark' | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const updateSystemTheme = () => {
        setSystemTheme(darkMediaQuery.matches ? 'dark' : 'light')
      }
      
      updateSystemTheme()
      darkMediaQuery.addEventListener('change', updateSystemTheme)
      
      return () => darkMediaQuery.removeEventListener('change', updateSystemTheme)
    }
  }, [])
  
  return systemTheme
}