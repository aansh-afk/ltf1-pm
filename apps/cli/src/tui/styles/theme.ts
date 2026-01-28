/**
 * LTF1 TUI Theme
 * Retro-futuristic HUD aesthetic
 */

export const theme = {
  colors: {
    // Primary palette
    primary: '#fcd34d',      // Yellow - brand color
    accent: '#f59e0b',       // Amber - accents

    // Text colors
    text: '#fafafa',         // White text
    muted: '#6b7280',        // Gray text
    dim: '#374151',          // Dim text

    // Status colors
    success: '#22c55e',      // Green
    error: '#ef4444',        // Red
    warning: '#f59e0b',      // Amber
    info: '#3b82f6',         // Blue

    // Priority colors
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280',

    // UI colors
    border: '#374151',
    borderFocus: '#fcd34d',
    background: '#0a0a0a',
    surface: '#141414',
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
    filled: '▓',
    empty: '░',
    partial: '▒',
  },

  // Task status icons
  icons: {
    todo: '○',
    inProgress: '●',
    done: '☑',
    blocked: '◌',
    bullet: '•',
  },
} as const;

export type Theme = typeof theme;
