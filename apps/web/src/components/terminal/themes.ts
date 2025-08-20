// Terminal Theme System for LTF1 Command Center

export interface TerminalTheme {
  name: string
  description: string
  colors: {
    background: string
    foreground: string
    cursor: string
    selection: string
    // ASCII art and branding
    asciiPrimary: string
    asciiGlow: string
    // Text types
    input: string
    output: string
    error: string
    success: string
    info: string
    warning: string
    // UI elements
    border: string
    headerBg: string
    headerText: string
    promptUser: string
    promptPath: string
    promptSymbol: string
    // Autocomplete
    suggestion: string
    suggestionBg: string
  }
  effects: {
    textShadow: boolean
    glowIntensity: number // 0-10
    scanlines: boolean
    crtCurvature: boolean
  }
}

export const themes: Record<string, TerminalTheme> = {
  brutalist: {
    name: 'BRUTALIST',
    description: 'Default LTF1 brutal terminal theme',
    colors: {
      background: '#0a0a0a',
      foreground: '#00ff00',
      cursor: '#00ff00',
      selection: '#00ff0033',
      asciiPrimary: '#39FF14', // Lighter neon green
      asciiGlow: '0 0 10px #39FF14',
      input: '#ffffff',
      output: '#00ff00',
      error: '#ff0040',
      success: '#00ff00',
      info: '#00ffff',
      warning: '#ffff00',
      border: '#00ff00',
      headerBg: '#00ff00',
      headerText: '#0a0a0a',
      promptUser: '#00ffff',
      promptPath: '#ffffff',
      promptSymbol: '#00ff00',
      suggestion: '#00ff0066',
      suggestionBg: 'transparent'
    },
    effects: {
      textShadow: true,
      glowIntensity: 5,
      scanlines: false,
      crtCurvature: false
    }
  },
  
  matrix: {
    name: 'MATRIX',
    description: 'The Matrix digital rain theme',
    colors: {
      background: '#000000',
      foreground: '#00ff41',
      cursor: '#00ff41',
      selection: '#00ff4133',
      asciiPrimary: '#00ff41',
      asciiGlow: '0 0 15px #00ff41',
      input: '#00ff41',
      output: '#008f11',
      error: '#ff0000',
      success: '#00ff41',
      info: '#00ff41',
      warning: '#ffcc00',
      border: '#00ff41',
      headerBg: '#001100',
      headerText: '#00ff41',
      promptUser: '#00ff41',
      promptPath: '#008f11',
      promptSymbol: '#00ff41',
      suggestion: '#00ff4166',
      suggestionBg: '#00110033'
    },
    effects: {
      textShadow: true,
      glowIntensity: 8,
      scanlines: true,
      crtCurvature: true
    }
  },

  dracula: {
    name: 'DRACULA',
    description: 'Dark theme with purple accents',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#ff79c6',
      selection: '#44475a',
      asciiPrimary: '#bd93f9',
      asciiGlow: '0 0 8px #bd93f9',
      input: '#f8f8f2',
      output: '#50fa7b',
      error: '#ff5555',
      success: '#50fa7b',
      info: '#8be9fd',
      warning: '#f1fa8c',
      border: '#6272a4',
      headerBg: '#44475a',
      headerText: '#f8f8f2',
      promptUser: '#ff79c6',
      promptPath: '#8be9fd',
      promptSymbol: '#50fa7b',
      suggestion: '#6272a466',
      suggestionBg: '#44475a33'
    },
    effects: {
      textShadow: false,
      glowIntensity: 3,
      scanlines: false,
      crtCurvature: false
    }
  },

  github: {
    name: 'GITHUB',
    description: 'GitHub dark theme',
    colors: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      cursor: '#58a6ff',
      selection: '#3392ff44',
      asciiPrimary: '#58a6ff',
      asciiGlow: '0 0 5px #58a6ff',
      input: '#c9d1d9',
      output: '#3fb950',
      error: '#f85149',
      success: '#3fb950',
      info: '#58a6ff',
      warning: '#d29922',
      border: '#30363d',
      headerBg: '#161b22',
      headerText: '#c9d1d9',
      promptUser: '#58a6ff',
      promptPath: '#8b949e',
      promptSymbol: '#3fb950',
      suggestion: '#8b949e66',
      suggestionBg: '#161b2233'
    },
    effects: {
      textShadow: false,
      glowIntensity: 2,
      scanlines: false,
      crtCurvature: false
    }
  },

  cyberpunk: {
    name: 'CYBERPUNK',
    description: 'Neon cyberpunk theme',
    colors: {
      background: '#120339',
      foreground: '#f92aad',
      cursor: '#fdca40',
      selection: '#f92aad33',
      asciiPrimary: '#00ffff',
      asciiGlow: '0 0 20px #00ffff',
      input: '#ffffff',
      output: '#f92aad',
      error: '#ff0040',
      success: '#00ff88',
      info: '#00ffff',
      warning: '#fdca40',
      border: '#f92aad',
      headerBg: '#2a0845',
      headerText: '#00ffff',
      promptUser: '#fdca40',
      promptPath: '#f92aad',
      promptSymbol: '#00ffff',
      suggestion: '#f92aad66',
      suggestionBg: '#2a084533'
    },
    effects: {
      textShadow: true,
      glowIntensity: 10,
      scanlines: true,
      crtCurvature: false
    }
  },

  retro: {
    name: 'RETRO',
    description: 'Classic amber terminal',
    colors: {
      background: '#1e1e1e',
      foreground: '#ffb000',
      cursor: '#ffb000',
      selection: '#ffb00033',
      asciiPrimary: '#ffa500',
      asciiGlow: '0 0 8px #ffa500',
      input: '#ffb000',
      output: '#ff8c00',
      error: '#ff4444',
      success: '#00ff00',
      info: '#ffb000',
      warning: '#ffff00',
      border: '#ff8c00',
      headerBg: '#2a2a2a',
      headerText: '#ffb000',
      promptUser: '#ffa500',
      promptPath: '#ff8c00',
      promptSymbol: '#ffb000',
      suggestion: '#ffb00066',
      suggestionBg: '#2a2a2a33'
    },
    effects: {
      textShadow: true,
      glowIntensity: 6,
      scanlines: true,
      crtCurvature: true
    }
  },

  hacker: {
    name: 'HACKER',
    description: 'L33t hacker theme',
    colors: {
      background: '#000000',
      foreground: '#00ff00',
      cursor: '#00ff00',
      selection: '#00ff0033',
      asciiPrimary: '#00ff00',
      asciiGlow: '0 0 12px #00ff00',
      input: '#00ff00',
      output: '#00cc00',
      error: '#ff0000',
      success: '#00ff00',
      info: '#00ffff',
      warning: '#ffff00',
      border: '#00ff00',
      headerBg: '#001100',
      headerText: '#00ff00',
      promptUser: '#00ff00',
      promptPath: '#00cc00',
      promptSymbol: '#00ff00',
      suggestion: '#00ff0066',
      suggestionBg: '#00110033'
    },
    effects: {
      textShadow: true,
      glowIntensity: 7,
      scanlines: false,
      crtCurvature: false
    }
  },

  minimal: {
    name: 'MINIMAL',
    description: 'Clean minimal theme',
    colors: {
      background: '#1a1a1a',
      foreground: '#e0e0e0',
      cursor: '#ffffff',
      selection: '#ffffff22',
      asciiPrimary: '#ffffff',
      asciiGlow: 'none',
      input: '#ffffff',
      output: '#e0e0e0',
      error: '#ff6b6b',
      success: '#51cf66',
      info: '#339af0',
      warning: '#ffd43b',
      border: '#333333',
      headerBg: '#2a2a2a',
      headerText: '#e0e0e0',
      promptUser: '#339af0',
      promptPath: '#888888',
      promptSymbol: '#51cf66',
      suggestion: '#88888866',
      suggestionBg: 'transparent'
    },
    effects: {
      textShadow: false,
      glowIntensity: 0,
      scanlines: false,
      crtCurvature: false
    }
  },

  neon: {
    name: 'NEON',
    description: 'Bright neon colors',
    colors: {
      background: '#0a0a0a',
      foreground: '#ff00ff',
      cursor: '#00ffff',
      selection: '#ff00ff33',
      asciiPrimary: '#00ffff',
      asciiGlow: '0 0 25px #00ffff',
      input: '#ffffff',
      output: '#ff00ff',
      error: '#ff0040',
      success: '#00ff00',
      info: '#00ffff',
      warning: '#ffff00',
      border: '#ff00ff',
      headerBg: '#1a001a',
      headerText: '#00ffff',
      promptUser: '#ffff00',
      promptPath: '#ff00ff',
      promptSymbol: '#00ffff',
      suggestion: '#ff00ff66',
      suggestionBg: '#1a001a33'
    },
    effects: {
      textShadow: true,
      glowIntensity: 10,
      scanlines: false,
      crtCurvature: false
    }
  }
}

export const getTheme = (themeName: string): TerminalTheme => {
  return themes[themeName] || themes.brutalist
}

export const getThemeNames = (): string[] => {
  return Object.keys(themes)
}

export const saveThemePreference = (themeName: string): void => {
  localStorage.setItem('terminal-theme', themeName)
}

export const loadThemePreference = (): string => {
  return localStorage.getItem('terminal-theme') || 'brutalist'
}