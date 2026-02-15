/**
 * GLOBAL THEME SYSTEM — DEVELOPER EDITION
 * 9 iconic developer themes from editors, terminals, and coding culture.
 * All themes maintain brutalist design protocol compliance.
 */

import type { GlobalTheme, ThemeName } from './themeTypes'
export type { GlobalTheme, ThemeName } from './themeTypes'
export { AVAILABLE_THEMES, ThemeNames } from './themeTypes'

// ─────────────────────────────────────────────
// 1. OBSIDIAN — LTF1 signature theme
// Deep dark with indigo accent. The home base.
// ─────────────────────────────────────────────
export const obsidianTheme: GlobalTheme = {
  name: "OBSIDIAN",
  description: "LTF1 signature — Deep dark with indigo accent",

  colors: {
    background: '#0B0B0F',
    backgroundSecondary: '#111118',
    backgroundTertiary: '#1A1A24',

    foreground: '#E4E4E8',
    foregroundSecondary: '#A0A0B0',
    foregroundTertiary: '#6B6B80',

    border: '#2A2A3A',
    borderHover: '#3A3A50',
    borderFocus: '#6366F1',

    primary: '#6366F1',
    primaryHover: '#818CF8',
    primaryFocus: '#6366F1',
    primaryActive: '#4F46E5',

    success: '#22C55E',
    successHover: '#4ADE80',
    error: '#EF4444',
    errorHover: '#F87171',
    warning: '#F59E0B',
    warningHover: '#FBBF24',
    info: '#06B6D4',
    infoHover: '#22D3EE',

    hover: '#16161F',
    active: '#0E0E14',
    selected: '#1E1E2E',
    disabled: '#131318',
    disabledText: '#4A4A5A',

    shadow: '#000000',
    shadowHover: '#000000',

    glow: '#6366F1',
    glowSecondary: '#06B6D4',
    gradient: 'linear-gradient(90deg, #6366F1, #06B6D4, #8B5CF6)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #000000',
    boxShadowHover: '6px 6px 0 #000000',
    transitionDuration: 'none',
    glowIntensity: 0.4,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '2px', shadowOffset: '4px' },
    input: { borderWidth: '2px', focusRingWidth: '2px' },
    card: { borderWidth: '2px', shadowIntensity: 0.8 },
    modal: { backdropOpacity: 0.85, borderWidth: '2px' },
  },
}

// ─────────────────────────────────────────────
// 2. VS CODE — The editor millions live in
// Classic VS Code dark+ palette
// ─────────────────────────────────────────────
export const vscodeTheme: GlobalTheme = {
  name: "VS CODE",
  description: "The editor you live in — Blue on dark gray",

  colors: {
    background: '#1E1E1E',
    backgroundSecondary: '#252526',
    backgroundTertiary: '#2D2D30',

    foreground: '#D4D4D4',
    foregroundSecondary: '#ABABAB',
    foregroundTertiary: '#808080',

    border: '#3C3C3C',
    borderHover: '#505050',
    borderFocus: '#007ACC',

    primary: '#007ACC',
    primaryHover: '#1A8CD8',
    primaryFocus: '#007ACC',
    primaryActive: '#005F9E',

    success: '#4EC9B0',
    successHover: '#6AD4C0',
    error: '#F14C4C',
    errorHover: '#F47070',
    warning: '#CCA700',
    warningHover: '#D9B820',
    info: '#3794FF',
    infoHover: '#52A5FF',

    hover: '#2A2D2E',
    active: '#1E1E1E',
    selected: '#094771',
    disabled: '#2A2A2A',
    disabledText: '#5A5A5A',

    shadow: '#000000',
    shadowHover: '#000000',

    glow: '#007ACC',
    glowSecondary: '#4EC9B0',
    gradient: 'linear-gradient(90deg, #007ACC, #4EC9B0, #DCDCAA)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.02em',
    textTransform: 'none',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #000000',
    boxShadowHover: '6px 6px 0 #000000',
    transitionDuration: 'none',
    glowIntensity: 0.3,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '1px', shadowOffset: '4px' },
    input: { borderWidth: '1px', focusRingWidth: '2px' },
    card: { borderWidth: '1px', shadowIntensity: 0.6 },
    modal: { backdropOpacity: 0.8, borderWidth: '1px' },
  },
}

// ─────────────────────────────────────────────
// 3. MONOKAI — The legend from Sublime Text
// Warm charcoal with iconic pink/green/yellow
// ─────────────────────────────────────────────
export const monokaiTheme: GlobalTheme = {
  name: "MONOKAI",
  description: "The Sublime legend — Pink and green on charcoal",

  colors: {
    background: '#272822',
    backgroundSecondary: '#2D2E27',
    backgroundTertiary: '#3E3D32',

    foreground: '#F8F8F2',
    foregroundSecondary: '#CFCFC2',
    foregroundTertiary: '#75715E',

    border: '#49483E',
    borderHover: '#5B5A50',
    borderFocus: '#F92672',

    primary: '#F92672',
    primaryHover: '#FA4D8E',
    primaryFocus: '#F92672',
    primaryActive: '#D41D60',

    success: '#A6E22E',
    successHover: '#B8E85A',
    error: '#F92672',
    errorHover: '#FA4D8E',
    warning: '#E6DB74',
    warningHover: '#ECE28E',
    info: '#66D9EF',
    infoHover: '#85E1F3',

    hover: '#3E3D32',
    active: '#272822',
    selected: '#49483E',
    disabled: '#2D2E27',
    disabledText: '#5E5D53',

    shadow: '#000000',
    shadowHover: '#000000',

    glow: '#F92672',
    glowSecondary: '#A6E22E',
    gradient: 'linear-gradient(90deg, #F92672, #A6E22E, #66D9EF)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.03em',
    textTransform: 'none',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #000000',
    boxShadowHover: '6px 6px 0 #000000',
    transitionDuration: 'none',
    glowIntensity: 0.4,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '2px', shadowOffset: '4px' },
    input: { borderWidth: '2px', focusRingWidth: '2px' },
    card: { borderWidth: '2px', shadowIntensity: 0.7 },
    modal: { backdropOpacity: 0.85, borderWidth: '2px' },
  },
}

// ─────────────────────────────────────────────
// 4. SOLARIZED — Ethan Schoonover's masterpiece
// Precision-engineered color science on teal base
// ─────────────────────────────────────────────
export const solarizedTheme: GlobalTheme = {
  name: "SOLARIZED",
  description: "Color science perfected — Blue on teal-dark base",

  colors: {
    background: '#00171D',
    backgroundSecondary: '#002B36',
    backgroundTertiary: '#073642',

    foreground: '#93A1A1',
    foregroundSecondary: '#839496',
    foregroundTertiary: '#657B83',

    border: '#0A4050',
    borderHover: '#586E75',
    borderFocus: '#268BD2',

    primary: '#268BD2',
    primaryHover: '#3E9BE0',
    primaryFocus: '#268BD2',
    primaryActive: '#1A6FAA',

    success: '#859900',
    successHover: '#9DB820',
    error: '#DC322F',
    errorHover: '#E35654',
    warning: '#B58900',
    warningHover: '#CDA020',
    info: '#2AA198',
    infoHover: '#40B5AC',

    hover: '#002028',
    active: '#00131A',
    selected: '#003845',
    disabled: '#001E26',
    disabledText: '#3A5058',

    shadow: '#000D12',
    shadowHover: '#000D12',

    glow: '#268BD2',
    glowSecondary: '#2AA198',
    gradient: 'linear-gradient(90deg, #268BD2, #2AA198, #B58900)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.03em',
    textTransform: 'none',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #001A21',
    boxShadowHover: '6px 6px 0 #001A21',
    transitionDuration: 'none',
    glowIntensity: 0.3,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '2px', shadowOffset: '4px' },
    input: { borderWidth: '2px', focusRingWidth: '2px' },
    card: { borderWidth: '2px', shadowIntensity: 0.6 },
    modal: { backdropOpacity: 0.85, borderWidth: '2px' },
  },
}

// ─────────────────────────────────────────────
// 5. NORD — Arctic, cool, minimal
// Frost blues on dark polar night
// ─────────────────────────────────────────────
export const nordTheme: GlobalTheme = {
  name: "NORD",
  description: "Arctic frost — Cool blues on polar night",

  colors: {
    background: '#171B22',
    backgroundSecondary: '#1E232C',
    backgroundTertiary: '#2E3440',

    foreground: '#ECEFF4',
    foregroundSecondary: '#D8DEE9',
    foregroundTertiary: '#7B88A1',

    border: '#3B4252',
    borderHover: '#4C566A',
    borderFocus: '#88C0D0',

    primary: '#88C0D0',
    primaryHover: '#9DD0DE',
    primaryFocus: '#88C0D0',
    primaryActive: '#6AAAB8',

    success: '#A3BE8C',
    successHover: '#B5CDA0',
    error: '#BF616A',
    errorHover: '#CF7B83',
    warning: '#EBCB8B',
    warningHover: '#F0D6A0',
    info: '#5E81AC',
    infoHover: '#7696BE',

    hover: '#1E232C',
    active: '#14181F',
    selected: '#2E3440',
    disabled: '#1A1F27',
    disabledText: '#4C566A',

    shadow: '#0D1016',
    shadowHover: '#0D1016',

    glow: '#88C0D0',
    glowSecondary: '#5E81AC',
    gradient: 'linear-gradient(90deg, #88C0D0, #81A1C1, #5E81AC)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #0D1016',
    boxShadowHover: '6px 6px 0 #0D1016',
    transitionDuration: 'none',
    glowIntensity: 0.3,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '2px', shadowOffset: '4px' },
    input: { borderWidth: '2px', focusRingWidth: '2px' },
    card: { borderWidth: '2px', shadowIntensity: 0.6 },
    modal: { backdropOpacity: 0.8, borderWidth: '2px' },
  },
}

// ─────────────────────────────────────────────
// 6. ONE DARK — Atom's beloved classic
// Soft blues and greens on cool charcoal
// ─────────────────────────────────────────────
export const onedarkTheme: GlobalTheme = {
  name: "ONE DARK",
  description: "Atom's classic — Soft blue on cool charcoal",

  colors: {
    background: '#14161B',
    backgroundSecondary: '#1B1D23',
    backgroundTertiary: '#21252B',

    foreground: '#ABB2BF',
    foregroundSecondary: '#9DA5B4',
    foregroundTertiary: '#636D83',

    border: '#2C313C',
    borderHover: '#3E4452',
    borderFocus: '#61AFEF',

    primary: '#61AFEF',
    primaryHover: '#7BBFF3',
    primaryFocus: '#61AFEF',
    primaryActive: '#4A98D6',

    success: '#98C379',
    successHover: '#ACD091',
    error: '#E06C75',
    errorHover: '#E88890',
    warning: '#E5C07B',
    warningHover: '#ECCE95',
    info: '#56B6C2',
    infoHover: '#6FC4CF',

    hover: '#1B1D23',
    active: '#101216',
    selected: '#282C34',
    disabled: '#171920',
    disabledText: '#3E4452',

    shadow: '#0A0B0E',
    shadowHover: '#0A0B0E',

    glow: '#61AFEF',
    glowSecondary: '#C678DD',
    gradient: 'linear-gradient(90deg, #61AFEF, #C678DD, #98C379)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.03em',
    textTransform: 'none',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #181A1F',
    boxShadowHover: '6px 6px 0 #181A1F',
    transitionDuration: 'none',
    glowIntensity: 0.35,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '2px', shadowOffset: '4px' },
    input: { borderWidth: '2px', focusRingWidth: '2px' },
    card: { borderWidth: '2px', shadowIntensity: 0.7 },
    modal: { backdropOpacity: 0.85, borderWidth: '2px' },
  },
}

// ─────────────────────────────────────────────
// 7. TOKYO NIGHT — The modern cult favorite
// Electric blue on deep navy
// ─────────────────────────────────────────────
export const tokyonightTheme: GlobalTheme = {
  name: "TOKYO NIGHT",
  description: "Neon-lit city — Electric blue on deep navy",

  colors: {
    background: '#0F1018',
    backgroundSecondary: '#14151F',
    backgroundTertiary: '#1A1B26',

    foreground: '#C0CAF5',
    foregroundSecondary: '#A9B1D6',
    foregroundTertiary: '#565F89',

    border: '#24283B',
    borderHover: '#3B4261',
    borderFocus: '#7AA2F7',

    primary: '#7AA2F7',
    primaryHover: '#93B5F9',
    primaryFocus: '#7AA2F7',
    primaryActive: '#5D88E0',

    success: '#9ECE6A',
    successHover: '#B2D884',
    error: '#F7768E',
    errorHover: '#F994A6',
    warning: '#E0AF68',
    warningHover: '#E8C083',
    info: '#7DCFFF',
    infoHover: '#97D9FF',

    hover: '#151620',
    active: '#0C0D14',
    selected: '#1E2035',
    disabled: '#111219',
    disabledText: '#3B4261',

    shadow: '#080810',
    shadowHover: '#080810',

    glow: '#7AA2F7',
    glowSecondary: '#BB9AF7',
    gradient: 'linear-gradient(90deg, #7AA2F7, #BB9AF7, #7DCFFF)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #080810',
    boxShadowHover: '6px 6px 0 #080810',
    transitionDuration: 'none',
    glowIntensity: 0.45,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '2px', shadowOffset: '4px' },
    input: { borderWidth: '2px', focusRingWidth: '2px' },
    card: { borderWidth: '2px', shadowIntensity: 0.8 },
    modal: { backdropOpacity: 0.88, borderWidth: '2px' },
  },
}

// ─────────────────────────────────────────────
// 8. CATPPUCCIN — The beloved pastel palette
// Mauve on dark mocha base
// ─────────────────────────────────────────────
export const catppuccinTheme: GlobalTheme = {
  name: "CATPPUCCIN",
  description: "Pastel perfection — Mauve on warm mocha",

  colors: {
    background: '#131320',
    backgroundSecondary: '#181825',
    backgroundTertiary: '#1E1E2E',

    foreground: '#CDD6F4',
    foregroundSecondary: '#BAC2DE',
    foregroundTertiary: '#6C7086',

    border: '#313244',
    borderHover: '#45475A',
    borderFocus: '#CBA6F7',

    primary: '#CBA6F7',
    primaryHover: '#D8BBF9',
    primaryFocus: '#CBA6F7',
    primaryActive: '#B48CF2',

    success: '#A6E3A1',
    successHover: '#BAEAB6',
    error: '#F38BA8',
    errorHover: '#F6A4BC',
    warning: '#F9E2AF',
    warningHover: '#FBE9C2',
    info: '#89DCEB',
    infoHover: '#A2E4F0',

    hover: '#1A1A2A',
    active: '#101020',
    selected: '#242438',
    disabled: '#151522',
    disabledText: '#45475A',

    shadow: '#0A0A14',
    shadowHover: '#0A0A14',

    glow: '#CBA6F7',
    glowSecondary: '#F5C2E7',
    gradient: 'linear-gradient(90deg, #CBA6F7, #F5C2E7, #89DCEB)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.03em',
    textTransform: 'none',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #0A0A14',
    boxShadowHover: '6px 6px 0 #0A0A14',
    transitionDuration: 'none',
    glowIntensity: 0.35,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '2px', shadowOffset: '4px' },
    input: { borderWidth: '2px', focusRingWidth: '2px' },
    card: { borderWidth: '2px', shadowIntensity: 0.7 },
    modal: { backdropOpacity: 0.85, borderWidth: '2px' },
  },
}

// ─────────────────────────────────────────────
// 9. GRUVBOX — The retro warm workhorse
// Orange on warm brown. Pure cozy vibes.
// ─────────────────────────────────────────────
export const gruvboxTheme: GlobalTheme = {
  name: "GRUVBOX",
  description: "Retro warmth — Orange on earthy brown",

  colors: {
    background: '#282828',
    backgroundSecondary: '#1D2021',
    backgroundTertiary: '#3C3836',

    foreground: '#EBDBB2',
    foregroundSecondary: '#D5C4A1',
    foregroundTertiary: '#928374',

    border: '#504945',
    borderHover: '#665C54',
    borderFocus: '#FE8019',

    primary: '#FE8019',
    primaryHover: '#FE9A3F',
    primaryFocus: '#FE8019',
    primaryActive: '#D66510',

    success: '#B8BB26',
    successHover: '#C8CC4D',
    error: '#FB4934',
    errorHover: '#FC6D5E',
    warning: '#FABD2F',
    warningHover: '#FBCC5C',
    info: '#83A598',
    infoHover: '#9BB8AD',

    hover: '#3C3836',
    active: '#282828',
    selected: '#504945',
    disabled: '#2A2826',
    disabledText: '#665C54',

    shadow: '#1A1816',
    shadowHover: '#1A1816',

    glow: '#FE8019',
    glowSecondary: '#FABD2F',
    gradient: 'linear-gradient(90deg, #FE8019, #FABD2F, #B8BB26)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #1A1816',
    boxShadowHover: '6px 6px 0 #1A1816',
    transitionDuration: 'none',
    glowIntensity: 0.4,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '2px', shadowOffset: '4px' },
    input: { borderWidth: '2px', focusRingWidth: '2px' },
    card: { borderWidth: '2px', shadowIntensity: 0.7 },
    modal: { backdropOpacity: 0.85, borderWidth: '2px' },
  },
}

// ─────────────────────────────────────────────
// 10. VERCEL — Minimal, sharp, monochrome
// Pure black & white with precise gray accents
// ─────────────────────────────────────────────
export const vercelTheme: GlobalTheme = {
  name: "VERCEL",
  description: "Ship fast — Minimal black and white",

  colors: {
    background: '#000000',
    backgroundSecondary: '#0A0A0A',
    backgroundTertiary: '#141414',

    foreground: '#EDEDED',
    foregroundSecondary: '#A1A1A1',
    foregroundTertiary: '#666666',

    border: '#262626',
    borderHover: '#3A3A3A',
    borderFocus: '#EDEDED',

    primary: '#EDEDED',
    primaryHover: '#FFFFFF',
    primaryFocus: '#EDEDED',
    primaryActive: '#D4D4D4',

    success: '#45D483',
    successHover: '#62DC97',
    error: '#E5484D',
    errorHover: '#EB6B6E',
    warning: '#FFB224',
    warningHover: '#FFC24B',
    info: '#52A8FF',
    infoHover: '#75BBFF',

    hover: '#111111',
    active: '#080808',
    selected: '#1A1A1A',
    disabled: '#0A0A0A',
    disabledText: '#444444',

    shadow: '#000000',
    shadowHover: '#000000',

    glow: '#EDEDED',
    glowSecondary: '#666666',
    gradient: 'linear-gradient(90deg, #EDEDED, #666666, #EDEDED)',
  },

  typography: {
    fontFamily: 'IBM Plex Mono, monospace',
    letterSpacing: '0.02em',
    textTransform: 'none',
  },

  effects: {
    borderRadius: '0',
    boxShadow: '4px 4px 0 #000000',
    boxShadowHover: '6px 6px 0 #000000',
    transitionDuration: 'none',
    glowIntensity: 0.15,
    scanlines: false,
    textShadow: false,
  },

  components: {
    button: { borderWidth: '1px', shadowOffset: '4px' },
    input: { borderWidth: '1px', focusRingWidth: '2px' },
    card: { borderWidth: '1px', shadowIntensity: 0.5 },
    modal: { backdropOpacity: 0.8, borderWidth: '1px' },
  },
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

export const globalThemes: Record<ThemeName, GlobalTheme> = {
  obsidian: obsidianTheme,
  vscode: vscodeTheme,
  monokai: monokaiTheme,
  solarized: solarizedTheme,
  nord: nordTheme,
  onedark: onedarkTheme,
  tokyonight: tokyonightTheme,
  catppuccin: catppuccinTheme,
  gruvbox: gruvboxTheme,
  vercel: vercelTheme,
}

export const getGlobalTheme = (name: ThemeName): GlobalTheme => {
  return globalThemes[name] || globalThemes.obsidian
}

export const getGlobalThemeNames = (): ThemeName[] => {
  return Object.keys(globalThemes) as ThemeName[]
}

// CSS Custom Property Generator
export const generateCSSCustomProperties = (theme: GlobalTheme): Record<string, string> => {
  return {
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
    '--theme-primary-opacity-20': `${theme.colors.primary}33`,

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

    '--theme-font-family': theme.typography.fontFamily,
    '--theme-letter-spacing': theme.typography.letterSpacing,
    '--theme-text-transform': theme.typography.textTransform,

    '--theme-border-radius': theme.effects.borderRadius,
    '--theme-box-shadow': theme.effects.boxShadow,
    '--theme-box-shadow-hover': theme.effects.boxShadowHover,
    '--theme-transition-duration': theme.effects.transitionDuration,
    '--theme-glow-intensity': theme.effects.glowIntensity.toString(),

    '--theme-button-border-width': theme.components.button.borderWidth,
    '--theme-button-shadow-offset': theme.components.button.shadowOffset,
    '--theme-input-border-width': theme.components.input.borderWidth,
    '--theme-input-focus-ring-width': theme.components.input.focusRingWidth,
    '--theme-card-border-width': theme.components.card.borderWidth,
    '--theme-modal-backdrop-opacity': theme.components.modal.backdropOpacity.toString(),
    '--theme-modal-border-width': theme.components.modal.borderWidth,
  }
}

export default globalThemes
