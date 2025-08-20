/**
 * GLOBAL THEME SYSTEM - COMPREHENSIVE UI THEMING
 * Extends terminal themes to full application UI system
 * Maintains brutalist design protocol compliance across all themes
 */

import type { GlobalTheme, ThemeName } from './themeTypes'
export type { GlobalTheme, ThemeName } from './themeTypes'
export { AVAILABLE_THEMES, ThemeNames } from './themeTypes'

// All theme definitions follow the GlobalTheme interface from themeTypes.ts

// BRUTALIST THEME (Default/Current)
export const brutalistTheme: GlobalTheme = {
  name: "BRUTALIST",
  description: "Default LTF1 theme - Neon green on black",
  
  colors: {
    background: '#000000',           // event-horizon
    backgroundSecondary: '#0A0A0A',  // carbon-plate
    backgroundTertiary: '#1A1A1A',   // lighter panels
    
    foreground: '#F5F5F5',           // cathode-white
    foregroundSecondary: '#CCCCCC',  // muted text
    foregroundTertiary: '#999999',   // subtle text
    
    border: '#333333',               // basalt-border
    borderHover: '#555555',          // border hover
    borderFocus: '#00FFFF',          // focus cyan
    
    primary: '#FFFF00',              // primary-brutalist
    primaryHover: '#FFFF33',         // brighter yellow
    primaryFocus: '#FFFF00',         // same as primary
    primaryActive: '#CCCC00',        // darker yellow
    
    success: '#00FF00',              // brutal-success
    successHover: '#33FF33',         // brighter green
    error: '#FF0000',                // brutal-error
    errorHover: '#FF3333',           // brighter red
    warning: '#FF00FF',              // brutal-warning/magenta
    warningHover: '#FF33FF',         // brighter magenta
    info: '#00FFFF',                 // brutal-info/cyan
    infoHover: '#33FFFF',           // brighter cyan
    
    hover: '#1A1A1A',               // hover background
    active: '#0A0A0A',              // active background
    selected: '#333333',            // selected background
    disabled: '#0A0A0A',            // disabled background
    disabledText: '#666666',        // disabled text
    
    shadow: '#000000',              // shadow color
    shadowHover: '#000000',         // hover shadow
    
    glow: '#00FFFF',               // primary glow (cyan)
    glowSecondary: '#FF00FF',      // secondary glow (magenta)
    gradient: 'linear-gradient(90deg, #00FFFF, #FF00FF, #FFFF00)', // glitch-flare
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  
  effects: {
    borderRadius: '0',                    // 1.1 LAW OF ZERO RADIUS - ABSOLUTE
    boxShadow: '5px 5px 0 #000000',      // 1.5 SHADOW DECREE - Hard binary shadows
    boxShadowHover: '8px 8px 0 #000000', // Elevated shadow on hover
    transitionDuration: 'none',          // 6.1 LAW OF INSTANT CHANGE - No easing
    glowIntensity: 0.5,
    scanlines: false,
    textShadow: false,
  },
  
  components: {
    button: {
      borderWidth: '2px',
      shadowOffset: '5px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '2px',
    },
    card: {
      borderWidth: '2px',
      shadowIntensity: 1.0,
    },
    modal: {
      backdropOpacity: 0.8,
      borderWidth: '2px',
    },
  },
}

// MATRIX THEME
export const matrixTheme: GlobalTheme = {
  name: "MATRIX",
  description: "Digital rain theme - Matrix green with scanlines",
  
  colors: {
    background: '#000000',
    backgroundSecondary: '#001100',
    backgroundTertiary: '#002200',
    
    foreground: '#00FF41',
    foregroundSecondary: '#00CC33',
    foregroundTertiary: '#009922',
    
    border: '#00FF41',
    borderHover: '#33FF55',
    borderFocus: '#00FFFF',
    
    primary: '#00FF41',
    primaryHover: '#33FF55',
    primaryFocus: '#00FF41',
    primaryActive: '#00CC33',
    
    success: '#00FF41',
    successHover: '#33FF55',
    error: '#FF4141',
    errorHover: '#FF5555',
    warning: '#FFFF41',
    warningHover: '#FFFF55',
    info: '#4141FF',
    infoHover: '#5555FF',
    
    hover: '#001100',
    active: '#000000',
    selected: '#002200',
    disabled: '#001100',
    disabledText: '#006600',
    
    shadow: '#000000',
    shadowHover: '#000000',
    
    glow: '#00FF41',
    glowSecondary: '#00FFFF',
    gradient: 'linear-gradient(90deg, #00FF41, #00FFFF, #FFFF41)',
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  
  effects: {
    borderRadius: '0',
    boxShadow: '0 0 20px #00FF41, 5px 5px 0px #000000',
    boxShadowHover: '0 0 30px #00FF41, 8px 8px 0px #000000',
    transitionDuration: 'none',
    glowIntensity: 0.8,
    scanlines: true,
    textShadow: true,
  },
  
  components: {
    button: {
      borderWidth: '2px',
      shadowOffset: '5px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '3px',
    },
    card: {
      borderWidth: '2px',
      shadowIntensity: 1.2,
    },
    modal: {
      backdropOpacity: 0.9,
      borderWidth: '2px',
    },
  },
}

// DRACULA THEME
export const draculaTheme: GlobalTheme = {
  name: "DRACULA",
  description: "Dark purple theme - Modern purple accents",
  
  colors: {
    background: '#282a36',
    backgroundSecondary: '#44475a',
    backgroundTertiary: '#6272a4',
    
    foreground: '#f8f8f2',
    foregroundSecondary: '#e6e6e6',
    foregroundTertiary: '#bfbfbf',
    
    border: '#6272a4',
    borderHover: '#8be9fd',
    borderFocus: '#ff79c6',
    
    primary: '#bd93f9',
    primaryHover: '#d4bfff',
    primaryFocus: '#bd93f9',
    primaryActive: '#9873d9',
    
    success: '#50fa7b',
    successHover: '#70ff9b',
    error: '#ff5555',
    errorHover: '#ff7575',
    warning: '#f1fa8c',
    warningHover: '#f4fc9c',
    info: '#8be9fd',
    infoHover: '#abedfd',
    
    hover: '#44475a',
    active: '#282a36',
    selected: '#6272a4',
    disabled: '#44475a',
    disabledText: '#6272a4',
    
    shadow: '#000000',
    shadowHover: '#000000',
    
    glow: '#bd93f9',
    glowSecondary: '#ff79c6',
    gradient: 'linear-gradient(90deg, #bd93f9, #ff79c6, #8be9fd)',
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.03em',
    textTransform: 'none',
  },
  
  effects: {
    borderRadius: '0',
    boxShadow: '0 0 15px rgba(189, 147, 249, 0.3), 5px 5px 0px #000000',
    boxShadowHover: '0 0 25px rgba(189, 147, 249, 0.5), 8px 8px 0px #000000',
    transitionDuration: 'none',
    glowIntensity: 0.6,
    scanlines: false,
    textShadow: false,
  },
  
  components: {
    button: {
      borderWidth: '2px',
      shadowOffset: '5px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '2px',
    },
    card: {
      borderWidth: '2px',
      shadowIntensity: 0.8,
    },
    modal: {
      backdropOpacity: 0.85,
      borderWidth: '2px',
    },
  },
}

// GITHUB THEME
export const githubTheme: GlobalTheme = {
  name: "GITHUB",
  description: "GitHub dark theme - Blue-gray professional",
  
  colors: {
    background: '#0d1117',
    backgroundSecondary: '#161b22',
    backgroundTertiary: '#21262d',
    
    foreground: '#e6edf3',
    foregroundSecondary: '#b1bac4',
    foregroundTertiary: '#7d8590',
    
    border: '#30363d',
    borderHover: '#f0f6fc',
    borderFocus: '#2f81f7',
    
    primary: '#2f81f7',
    primaryHover: '#4493f8',
    primaryFocus: '#2f81f7',
    primaryActive: '#1f6feb',
    
    success: '#3fb950',
    successHover: '#4fc65a',
    error: '#f85149',
    errorHover: '#fd7a73',
    warning: '#d29922',
    warningHover: '#e2a822',
    info: '#2f81f7',
    infoHover: '#4493f8',
    
    hover: '#161b22',
    active: '#0d1117',
    selected: '#21262d',
    disabled: '#161b22',
    disabledText: '#484f58',
    
    shadow: '#000000',
    shadowHover: '#000000',
    
    glow: '#2f81f7',
    glowSecondary: '#3fb950',
    gradient: 'linear-gradient(90deg, #2f81f7, #3fb950, #d29922)',
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.01em',
    textTransform: 'none',
  },
  
  effects: {
    borderRadius: '0',
    boxShadow: '0 0 10px rgba(47, 129, 247, 0.2), 5px 5px 0px #000000',
    boxShadowHover: '0 0 20px rgba(47, 129, 247, 0.4), 8px 8px 0px #000000',
    transitionDuration: 'none',
    glowIntensity: 0.4,
    scanlines: false,
    textShadow: false,
  },
  
  components: {
    button: {
      borderWidth: '1px',
      shadowOffset: '5px',
    },
    input: {
      borderWidth: '1px',
      focusRingWidth: '2px',
    },
    card: {
      borderWidth: '1px',
      shadowIntensity: 0.6,
    },
    modal: {
      backdropOpacity: 0.75,
      borderWidth: '1px',
    },
  },
}

// CYBERPUNK THEME
export const cyberpunkTheme: GlobalTheme = {
  name: "CYBERPUNK",
  description: "Neon cyberpunk - Pink/cyan/yellow neon",
  
  colors: {
    background: '#0a0014',
    backgroundSecondary: '#1a0028',
    backgroundTertiary: '#2a003c',
    
    foreground: '#ffffff',
    foregroundSecondary: '#f0f0f0',
    foregroundTertiary: '#d0d0d0',
    
    border: '#ff0080',
    borderHover: '#00ffff',
    borderFocus: '#ffff00',
    
    primary: '#ff0080',
    primaryHover: '#ff33a0',
    primaryFocus: '#ff0080',
    primaryActive: '#cc0066',
    
    success: '#00ff80',
    successHover: '#33ffa0',
    error: '#ff4080',
    errorHover: '#ff60a0',
    warning: '#ffff00',
    warningHover: '#ffff33',
    info: '#00ffff',
    infoHover: '#33ffff',
    
    hover: '#1a0028',
    active: '#0a0014',
    selected: '#2a003c',
    disabled: '#1a0028',
    disabledText: '#660033',
    
    shadow: '#000000',
    shadowHover: '#ff0080',
    
    glow: '#ff0080',
    glowSecondary: '#00ffff',
    gradient: 'linear-gradient(90deg, #ff0080, #00ffff, #ffff00)',
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  
  effects: {
    borderRadius: '0',
    boxShadow: '0 0 30px #ff0080, 5px 5px 0px #000000',
    boxShadowHover: '0 0 50px #ff0080, 8px 8px 0px #ff0080',
    transitionDuration: 'none',
    glowIntensity: 1.0,
    scanlines: true,
    textShadow: true,
  },
  
  components: {
    button: {
      borderWidth: '3px',
      shadowOffset: '5px',
    },
    input: {
      borderWidth: '3px',
      focusRingWidth: '3px',
    },
    card: {
      borderWidth: '3px',
      shadowIntensity: 1.5,
    },
    modal: {
      backdropOpacity: 0.95,
      borderWidth: '3px',
    },
  },
}

// RETRO THEME
export const retroTheme: GlobalTheme = {
  name: "RETRO",
  description: "Classic amber terminal - Orange amber CRT style",
  
  colors: {
    background: '#1a0f00',
    backgroundSecondary: '#2a1800',
    backgroundTertiary: '#3a2200',
    
    foreground: '#ffcc00',
    foregroundSecondary: '#e6b800',
    foregroundTertiary: '#cc9900',
    
    border: '#ff9900',
    borderHover: '#ffaa00',
    borderFocus: '#ffff00',
    
    primary: '#ff9900',
    primaryHover: '#ffaa00',
    primaryFocus: '#ff9900',
    primaryActive: '#e68800',
    
    success: '#00cc00',
    successHover: '#00ee00',
    error: '#cc0000',
    errorHover: '#ee0000',
    warning: '#ffcc00',
    warningHover: '#ffdd00',
    info: '#0099cc',
    infoHover: '#00aadd',
    
    hover: '#2a1800',
    active: '#1a0f00',
    selected: '#3a2200',
    disabled: '#2a1800',
    disabledText: '#664400',
    
    shadow: '#000000',
    shadowHover: '#000000',
    
    glow: '#ff9900',
    glowSecondary: '#ffcc00',
    gradient: 'linear-gradient(90deg, #ff9900, #ffcc00, #ffff00)',
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  
  effects: {
    borderRadius: '0',
    boxShadow: '0 0 20px #ff9900, 5px 5px 0px #000000',
    boxShadowHover: '0 0 30px #ff9900, 8px 8px 0px #000000',
    transitionDuration: 'none',
    glowIntensity: 0.7,
    scanlines: true,
    textShadow: true,
  },
  
  components: {
    button: {
      borderWidth: '2px',
      shadowOffset: '5px',
    },
    input: {
      borderWidth: '2px',
      focusRingWidth: '2px',
    },
    card: {
      borderWidth: '2px',
      shadowIntensity: 0.9,
    },
    modal: {
      backdropOpacity: 0.8,
      borderWidth: '2px',
    },
  },
}

// HACKER THEME
export const hackerTheme: GlobalTheme = {
  name: "HACKER",
  description: "L33t hacker theme - Pure green on black",
  
  colors: {
    background: '#000000',
    backgroundSecondary: '#001100',
    backgroundTertiary: '#002200',
    
    foreground: '#00ff00',
    foregroundSecondary: '#00ee00',
    foregroundTertiary: '#00dd00',
    
    border: '#00ff00',
    borderHover: '#33ff33',
    borderFocus: '#00ffff',
    
    primary: '#00ff00',
    primaryHover: '#33ff33',
    primaryFocus: '#00ff00',
    primaryActive: '#00cc00',
    
    success: '#00ff00',
    successHover: '#33ff33',
    error: '#ff0000',
    errorHover: '#ff3333',
    warning: '#ffff00',
    warningHover: '#ffff33',
    info: '#00ffff',
    infoHover: '#33ffff',
    
    hover: '#001100',
    active: '#000000',
    selected: '#002200',
    disabled: '#001100',
    disabledText: '#004400',
    
    shadow: '#000000',
    shadowHover: '#000000',
    
    glow: '#00ff00',
    glowSecondary: '#00ffff',
    gradient: 'linear-gradient(90deg, #00ff00, #00ffff, #ffff00)',
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.1em',
    textTransform: 'lowercase',
  },
  
  effects: {
    borderRadius: '0',
    boxShadow: '0 0 25px #00ff00, 5px 5px 0px #000000',
    boxShadowHover: '0 0 40px #00ff00, 8px 8px 0px #000000',
    transitionDuration: 'none',
    glowIntensity: 0.9,
    scanlines: true,
    textShadow: true,
  },
  
  components: {
    button: {
      borderWidth: '1px',
      shadowOffset: '3px',
    },
    input: {
      borderWidth: '1px',
      focusRingWidth: '3px',
    },
    card: {
      borderWidth: '1px',
      shadowIntensity: 1.3,
    },
    modal: {
      backdropOpacity: 0.9,
      borderWidth: '1px',
    },
  },
}

// MINIMAL THEME
export const minimalTheme: GlobalTheme = {
  name: "MINIMAL",
  description: "Clean minimal - White on dark gray",
  
  colors: {
    background: '#1e1e1e',
    backgroundSecondary: '#2e2e2e',
    backgroundTertiary: '#3e3e3e',
    
    foreground: '#ffffff',
    foregroundSecondary: '#e0e0e0',
    foregroundTertiary: '#c0c0c0',
    
    border: '#4e4e4e',
    borderHover: '#6e6e6e',
    borderFocus: '#ffffff',
    
    primary: '#ffffff',
    primaryHover: '#f0f0f0',
    primaryFocus: '#ffffff',
    primaryActive: '#e0e0e0',
    
    success: '#4caf50',
    successHover: '#66bb6a',
    error: '#f44336',
    errorHover: '#ef5350',
    warning: '#ff9800',
    warningHover: '#ffa726',
    info: '#2196f3',
    infoHover: '#42a5f5',
    
    hover: '#2e2e2e',
    active: '#1e1e1e',
    selected: '#3e3e3e',
    disabled: '#2e2e2e',
    disabledText: '#6e6e6e',
    
    shadow: '#000000',
    shadowHover: '#000000',
    
    glow: '#ffffff',
    glowSecondary: '#4caf50',
    gradient: 'linear-gradient(90deg, #ffffff, #4caf50, #2196f3)',
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.02em',
    textTransform: 'none',
  },
  
  effects: {
    borderRadius: '0',
    boxShadow: '5px 5px 0px #000000',
    boxShadowHover: '8px 8px 0px #000000',
    transitionDuration: 'none',
    glowIntensity: 0.3,
    scanlines: false,
    textShadow: false,
  },
  
  components: {
    button: {
      borderWidth: '1px',
      shadowOffset: '5px',
    },
    input: {
      borderWidth: '1px',
      focusRingWidth: '2px',
    },
    card: {
      borderWidth: '1px',
      shadowIntensity: 0.5,
    },
    modal: {
      backdropOpacity: 0.7,
      borderWidth: '1px',
    },
  },
}

// NEON THEME
export const neonTheme: GlobalTheme = {
  name: "NEON",
  description: "Bright neon colors - Magenta/cyan glowing",
  
  colors: {
    background: '#0f0f23',
    backgroundSecondary: '#1a1a3a',
    backgroundTertiary: '#252550',
    
    foreground: '#ffffff',
    foregroundSecondary: '#f0f0ff',
    foregroundTertiary: '#e0e0ff',
    
    border: '#ff00ff',
    borderHover: '#ff33ff',
    borderFocus: '#00ffff',
    
    primary: '#ff00ff',
    primaryHover: '#ff33ff',
    primaryFocus: '#ff00ff',
    primaryActive: '#cc00cc',
    
    success: '#00ff00',
    successHover: '#33ff33',
    error: '#ff0040',
    errorHover: '#ff3366',
    warning: '#ffff00',
    warningHover: '#ffff33',
    info: '#00ffff',
    infoHover: '#33ffff',
    
    hover: '#1a1a3a',
    active: '#0f0f23',
    selected: '#252550',
    disabled: '#1a1a3a',
    disabledText: '#6666cc',
    
    shadow: '#000000',
    shadowHover: '#ff00ff',
    
    glow: '#ff00ff',
    glowSecondary: '#00ffff',
    gradient: 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00)',
  },
  
  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  
  effects: {
    borderRadius: '0',
    boxShadow: '0 0 40px #ff00ff, 5px 5px 0px #000000',
    boxShadowHover: '0 0 60px #ff00ff, 8px 8px 0px #ff00ff',
    transitionDuration: 'none',
    glowIntensity: 1.0,
    scanlines: false,
    textShadow: true,
  },
  
  components: {
    button: {
      borderWidth: '3px',
      shadowOffset: '5px',
    },
    input: {
      borderWidth: '3px',
      focusRingWidth: '3px',
    },
    card: {
      borderWidth: '3px',
      shadowIntensity: 1.8,
    },
    modal: {
      backdropOpacity: 0.95,
      borderWidth: '3px',
    },
  },
}

// Export all themes in a single object
export const globalThemes: Record<ThemeName, GlobalTheme> = {
  brutalist: brutalistTheme,
  matrix: matrixTheme,
  dracula: draculaTheme,
  github: githubTheme,
  cyberpunk: cyberpunkTheme,
  retro: retroTheme,
  hacker: hackerTheme,
  minimal: minimalTheme,
  neon: neonTheme,
}

// Utility functions
export const getGlobalTheme = (name: ThemeName): GlobalTheme => {
  return globalThemes[name] || globalThemes.brutalist
}

export const getGlobalThemeNames = (): ThemeName[] => {
  return Object.keys(globalThemes) as ThemeName[]
}

// CSS Custom Property Generator
export const generateCSSCustomProperties = (theme: GlobalTheme): Record<string, string> => {
  return {
    // Core Colors
    '--theme-background': theme.colors.background,
    '--theme-background-secondary': theme.colors.backgroundSecondary,
    '--theme-background-tertiary': theme.colors.backgroundTertiary,
    
    '--theme-foreground': theme.colors.foreground,
    '--theme-foreground-secondary': theme.colors.foregroundSecondary,
    '--theme-foreground-tertiary': theme.colors.foregroundTertiary,
    
    '--theme-border': theme.colors.border,
    '--theme-border-hover': theme.colors.borderHover,
    '--theme-border-focus': theme.colors.borderFocus,
    
    '--theme-primary': theme.colors.primary,
    '--theme-primary-hover': theme.colors.primaryHover,
    '--theme-primary-focus': theme.colors.primaryFocus,
    '--theme-primary-active': theme.colors.primaryActive,
    '--theme-primary-opacity-20': `${theme.colors.primary}33`, // 20% opacity (33 in hex)
    
    '--theme-success': theme.colors.success,
    '--theme-success-hover': theme.colors.successHover,
    '--theme-error': theme.colors.error,
    '--theme-error-hover': theme.colors.errorHover,
    '--theme-warning': theme.colors.warning,
    '--theme-warning-hover': theme.colors.warningHover,
    '--theme-info': theme.colors.info,
    '--theme-info-hover': theme.colors.infoHover,
    
    '--theme-hover': theme.colors.hover,
    '--theme-active': theme.colors.active,
    '--theme-selected': theme.colors.selected,
    '--theme-disabled': theme.colors.disabled,
    '--theme-disabled-text': theme.colors.disabledText,
    
    '--theme-shadow': theme.colors.shadow,
    '--theme-shadow-hover': theme.colors.shadowHover,
    
    '--theme-glow': theme.colors.glow,
    '--theme-glow-secondary': theme.colors.glowSecondary,
    '--theme-gradient': theme.colors.gradient,
    
    // Typography
    '--theme-font-family': theme.typography.fontFamily,
    '--theme-letter-spacing': theme.typography.letterSpacing,
    '--theme-text-transform': theme.typography.textTransform,
    
    // Effects
    '--theme-border-radius': theme.effects.borderRadius,
    '--theme-box-shadow': theme.effects.boxShadow,
    '--theme-box-shadow-hover': theme.effects.boxShadowHover,
    '--theme-transition-duration': theme.effects.transitionDuration,
    '--theme-glow-intensity': theme.effects.glowIntensity.toString(),
    
    // Component-specific
    '--theme-button-border-width': theme.components.button.borderWidth,
    '--theme-button-shadow-offset': theme.components.button.shadowOffset,
    '--theme-input-border-width': theme.components.input.borderWidth,
    '--theme-input-focus-ring-width': theme.components.input.focusRingWidth,
    '--theme-card-border-width': theme.components.card.borderWidth,
    '--theme-modal-backdrop-opacity': theme.components.modal.backdropOpacity.toString(),
    '--theme-modal-border-width': theme.components.modal.borderWidth,
  }
}

// Default export for convenience
export default globalThemes
