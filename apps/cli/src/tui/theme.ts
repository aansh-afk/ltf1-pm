/**
 * TUI Theme - Grayscale palette and status/priority color mappings
 * Used by the segment-based row rendering system
 */

// Core grayscale palette
export const BG = '#000000';
export const WHITE = '#ffffff';
export const LIGHT = '#cccccc';
export const GRAY = '#888888';
export const DIM = '#555555';
export const DARK = '#333333';

// Status colors (grayscale differentiated by brightness)
export const STATUS_COLORS: Record<string, string> = {
  backlog: DIM,
  todo: GRAY,
  in_progress: WHITE,
  in_review: LIGHT,
  done: DIM,
  cancelled: DARK,
};

// Priority colors
export const PRIORITY_COLORS: Record<string, string> = {
  urgent: WHITE,
  high: WHITE,
  medium: LIGHT,
  low: GRAY,
};

// Status icons
export const STATUS_ICONS: Record<string, string> = {
  backlog: '◌',
  todo: '○',
  in_progress: '●',
  in_review: '◉',
  done: '✓',
  cancelled: '✕',
};

// Priority labels (short)
export const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'URG',
  high: 'High',
  medium: 'Med',
  low: 'Low',
};
