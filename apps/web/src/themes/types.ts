/**
 * THEME SYSTEM TYPE DEFINITIONS
 * Central type definitions for the global theme system
 */

// Re-export all theme types from themeTypes
export type { GlobalTheme, ThemeName } from './themeTypes'

// Additional theme-related types
export type ThemeMode = 'light' | 'dark' | 'auto'
export type ThemePreference = {
  themeName: ThemeName
  highContrast: boolean
  reducedMotion: boolean
}

// Re-export for convenience
import type { ThemeName as TN } from './themeTypes'
export type ThemeNameType = TN