/**
 * THEME TYPE DEFINITIONS
 * Standalone type definitions to avoid circular dependencies
 */

// Define the available theme names as a const assertion
export const ThemeNames = {
  OBSIDIAN: 'obsidian',
  VSCODE: 'vscode',
  MONOKAI: 'monokai',
  SOLARIZED: 'solarized',
  NORD: 'nord',
  ONEDARK: 'onedark',
  TOKYONIGHT: 'tokyonight',
  CATPPUCCIN: 'catppuccin',
  GRUVBOX: 'gruvbox',
  VERCEL: 'vercel',
  // Light variants
  OBSIDIAN_LIGHT: 'obsidian-light',
  VSCODE_LIGHT: 'vscode-light',
  MONOKAI_LIGHT: 'monokai-light',
  SOLARIZED_LIGHT: 'solarized-light',
  NORD_LIGHT: 'nord-light',
  ONEDARK_LIGHT: 'onedark-light',
  TOKYONIGHT_LIGHT: 'tokyonight-light',
  CATPPUCCIN_LIGHT: 'catppuccin-light',
  GRUVBOX_LIGHT: 'gruvbox-light',
  VERCEL_LIGHT: 'vercel-light',
} as const

// Create the ThemeName type from the values
export type ThemeName = typeof ThemeNames[keyof typeof ThemeNames]

// Create an array of theme names for iteration
export const AVAILABLE_THEMES: ThemeName[] = Object.values(ThemeNames)

// Export the GlobalTheme interface
export interface GlobalTheme {
  name: string
  description: string

  // Core Colors
  colors: {
    // Background System
    background: string
    backgroundSecondary: string
    backgroundTertiary: string

    // Foreground System
    foreground: string
    foregroundSecondary: string
    foregroundTertiary: string

    // Border System
    border: string
    borderHover: string
    borderFocus: string

    // Primary System
    primary: string
    primaryHover: string
    primaryFocus: string
    primaryActive: string

    // Status System
    success: string
    successHover: string
    error: string
    errorHover: string
    warning: string
    warningHover: string
    info: string
    infoHover: string

    // Interactive Elements
    hover: string
    active: string
    selected: string
    disabled: string
    disabledText: string

    // Shadow System
    shadow: string
    shadowHover: string

    // Special Effects
    glow: string
    glowSecondary: string
    gradient: string
  }

  // Typography
  typography: {
    fontFamily: string
    letterSpacing: string
    textTransform: 'uppercase' | 'lowercase' | 'none'
  }

  // Effects & Animations - BRUTALIST PROTOCOL COMPLIANCE
  effects: {
    borderRadius: '0'
    boxShadow: string
    boxShadowHover: string
    transitionDuration: 'none'
    glowIntensity: number
    scanlines: boolean
    textShadow: boolean
  }

  // Component-Specific Overrides
  components: {
    button: {
      borderWidth: string
      shadowOffset: string
    }
    input: {
      borderWidth: string
      focusRingWidth: string
    }
    card: {
      borderWidth: string
      shadowIntensity: number
    }
    modal: {
      backdropOpacity: number
      borderWidth: string
    }
  }
}
