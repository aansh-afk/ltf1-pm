/**
 * LTF1 TUI Theme
 * Minimal black and white aesthetic
 */

export const theme = {
  colors: {
    // Primary palette - white only
    primary: '#ffffff',
    accent: '#ffffff',

    // Text colors - grayscale
    text: '#ffffff',
    muted: '#888888',
    dim: '#555555',

    // Status colors - grayscale
    success: '#ffffff',
    error: '#ffffff',
    warning: '#ffffff',
    info: '#ffffff',

    // Priority colors - differentiated by brightness
    high: '#ffffff',
    medium: '#aaaaaa',
    low: '#666666',

    // UI colors
    border: '#555555',
    borderFocus: '#ffffff',
    background: '#000000',
    surface: '#111111',
  },

  // Box characters for borders
  box: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    teeRight: '├',
    teeLeft: '┤',
    teeDown: '┬',
    teeUp: '┴',
    cross: '┼',
  },

  // Progress bar characters
  progress: {
    filled: '█',
    empty: '░',
    partial: '▒',
  },

  // Task status icons
  icons: {
    todo: '○',
    inProgress: '●',
    done: '✓',
    blocked: '◌',
    bullet: '•',
  },
} as const;

export type Theme = typeof theme;
