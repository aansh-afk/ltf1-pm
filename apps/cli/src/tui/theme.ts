/**
 * TUI Theme - Dark brutalist design system
 * Matches the web app's design tokens from docs_design/
 */

export const theme = {
  // Backgrounds
  bg: '#000000',
  surface: '#111111',
  card: '#1A1A1A',

  // Borders
  border: '#2E2E35',
  borderFocus: '#6366F1',
  borderSubtle: '#1F1F23',

  // Text
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDim: '#555555',

  // Accent
  accent: '#6366F1',
  accentHover: '#4F46E5',

  // Semantic
  green: '#22C55E',
  red: '#EF4444',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',

  // Status colors
  status: {
    backlog: '#6B7280',
    todo: '#9CA3AF',
    in_progress: '#6366F1',
    in_review: '#F59E0B',
    done: '#22C55E',
    cancelled: '#EF4444',
  },

  // Priority colors
  priority: {
    urgent: '#EF4444',
    high: '#F59E0B',
    medium: '#6366F1',
    low: '#9CA3AF',
  },

  // Status icons
  statusIcon: {
    backlog: '\u25CC',
    todo: '\u25CB',
    in_progress: '\u25CF',
    in_review: '\u25C9',
    done: '\u2713',
    cancelled: '\u2715',
  },

  // Priority icons
  priorityIcon: {
    urgent: '!!!',
    high: '!!',
    medium: '!',
    low: '\u00B7',
  },
} as const;

export type Theme = typeof theme;

// Legacy re-exports for backward compatibility with existing pages
export const BG = theme.bg;
export const WHITE = theme.text;
export const LIGHT = theme.textSecondary;
export const GRAY = theme.textMuted;
export const DIM = theme.textDim;
export const DARK = theme.border;

export const STATUS_COLORS: Record<string, string> = { ...theme.status };
export const PRIORITY_COLORS: Record<string, string> = { ...theme.priority };
export const STATUS_ICONS: Record<string, string> = { ...theme.statusIcon };
export const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'URG',
  high: 'High',
  medium: 'Med',
  low: 'Low',
};
