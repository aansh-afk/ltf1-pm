/**
 * THEME SYSTEM BARREL EXPORT
 * Central export point for all theme-related modules
 */

// Re-export everything from globalThemes
export * from './globalThemes'

// Re-export types
export type { ThemeName, GlobalTheme } from './globalThemes'

// Re-export constants and utilities
export { 
  getGlobalTheme, 
  getGlobalThemeNames, 
  generateCSSCustomProperties,
  globalThemes,
  brutalistTheme,
  matrixTheme,
  draculaTheme,
  githubTheme,
  cyberpunkTheme,
  retroTheme,
  hackerTheme,
  minimalTheme,
  neonTheme
} from './globalThemes'

// Re-export AVAILABLE_THEMES from themeTypes
export { AVAILABLE_THEMES } from './themeTypes'

// Re-export default
export { default } from './globalThemes'