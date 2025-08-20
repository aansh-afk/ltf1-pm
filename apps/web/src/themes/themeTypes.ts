/**
 * THEME TYPE DEFINITIONS
 * Standalone type definitions to avoid circular dependencies
 */

// Define the available theme names as a const assertion
export const ThemeNames = {
  BRUTALIST: 'brutalist',
  MATRIX: 'matrix',
  DRACULA: 'dracula',
  GITHUB: 'github',
  CYBERPUNK: 'cyberpunk',
  RETRO: 'retro',
  HACKER: 'hacker',
  MINIMAL: 'minimal',
  NEON: 'neon'
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
    background: string          // Primary background (event-horizon equivalent)
    backgroundSecondary: string // Secondary background (carbon-plate equivalent)
    backgroundTertiary: string  // Tertiary background (lighter panels)
    
    // Foreground System
    foreground: string          // Primary text (cathode-white equivalent)
    foregroundSecondary: string // Secondary text (muted)
    foregroundTertiary: string  // Tertiary text (subtle)
    
    // Border System
    border: string              // Primary borders (basalt-border equivalent)
    borderHover: string         // Border hover states
    borderFocus: string         // Focus indicator borders
    
    // Primary System
    primary: string             // Primary brand color (primary-brutalist equivalent)
    primaryHover: string        // Primary hover state
    primaryFocus: string        // Primary focus state
    primaryActive: string       // Primary active state
    
    // Status System
    success: string             // Success states
    successHover: string        // Success hover
    error: string               // Error states
    errorHover: string          // Error hover  
    warning: string             // Warning states
    warningHover: string        // Warning hover
    info: string                // Info states
    infoHover: string           // Info hover
    
    // Interactive Elements
    hover: string               // General hover background
    active: string              // General active background
    selected: string            // Selected item background
    disabled: string            // Disabled element background
    disabledText: string        // Disabled text color
    
    // Shadow System
    shadow: string              // Shadow color for brutal shadows
    shadowHover: string         // Hover shadow color
    
    // Special Effects
    glow: string                // Glow effects
    glowSecondary: string       // Secondary glow
    gradient: string            // Gradient backgrounds
  }
  
  // Typography
  typography: {
    fontFamily: string
    letterSpacing: string
    textTransform: 'uppercase' | 'lowercase' | 'none'
  }
  
  // Effects & Animations - BRUTALIST PROTOCOL COMPLIANCE
  effects: {
    borderRadius: '0'           // 1.1 LAW OF ZERO RADIUS - ABSOLUTE
    boxShadow: string          // 1.5 SHADOW DECREE - Hard shadows only
    boxShadowHover: string     // Hover shadow pattern
    transitionDuration: 'none' // 6.1 LAW OF INSTANT CHANGE - No easing
    glowIntensity: number      // Glow effect strength (0-1)
    scanlines: boolean         // Terminal scanline effects
    textShadow: boolean        // Text shadow effects
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