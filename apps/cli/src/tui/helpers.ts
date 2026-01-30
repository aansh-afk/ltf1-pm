/**
 * TUI rendering helpers - row/segment construction utilities
 * Extracted from the monolithic App.tsx
 */

import type { Segment, Row } from './types.js';
import { WHITE, LIGHT, GRAY, DIM, DARK } from './theme.js';

/** Repeat a character n times (clamped to 0) */
export const rep = (ch: string, n: number): string => ch.repeat(Math.max(0, n));

/** Left-pad string to width, truncating if longer */
export const pad = (t: string, n: number): string =>
  t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length);

/** Center string within width, truncating if longer */
export const center = (t: string, n: number): string => {
  if (t.length >= n) return t.slice(0, n);
  const l = Math.floor((n - t.length) / 2);
  return ' '.repeat(l) + t + ' '.repeat(n - t.length - l);
};

/** Truncate string with ellipsis if exceeds width */
export const truncate = (t: string, n: number): string =>
  t.length <= n ? t : t.slice(0, n - 1) + '…';

/** Create a single-segment row */
export const row = (text: string, color: string, bgColor?: string): Row => ({
  segments: [{ text, color }],
  bgColor,
});

/** Create a multi-segment row */
export const segRow = (segments: Segment[], bgColor?: string): Row => ({
  segments,
  bgColor,
});

/** Blank row of given width */
export const blank = (w: number): Row => row(pad('', w), WHITE);

/** Pad segments array to fill width */
export const padSegs = (segs: Segment[], w: number): Segment[] => {
  const len = segs.reduce((s, x) => s + x.text.length, 0);
  if (len >= w) return segs;
  return [...segs, { text: ' '.repeat(w - len), color: WHITE }];
};

/** Fill rows array to target height with blank rows */
export const fillTo = (rows: Row[], target: number, w: number): void => {
  while (rows.length < target) rows.push(blank(w));
};

// ── Shared layout builders ────────────────────────────────────

/** Page header with title and clock */
export const pageHeader = (title: string, timeStr: string, w: number): Row[] => [
  segRow(padSegs([
    { text: '  LTF1', color: WHITE },
    { text: '  ›  ', color: DIM },
    { text: title, color: LIGHT },
    { text: rep(' ', w - 20 - title.length - timeStr.length), color: WHITE },
    { text: timeStr, color: GRAY },
    { text: '  ', color: WHITE },
  ], w)),
  row(rep('─', w), DARK),
];

/** Page footer with navigation hints */
export const pageFooter = (w: number, extra = ''): Row[] => [
  row(rep('─', w), DARK),
  segRow(padSegs([
    { text: '  ', color: GRAY },
    { text: 'ESC', color: LIGHT },
    { text: ' Back  ', color: DIM },
    { text: 'T', color: LIGHT },
    { text: ' Tasks  ', color: DIM },
    { text: 'S', color: LIGHT },
    { text: ' Sprint  ', color: DIM },
    { text: 'G', color: LIGHT },
    { text: ' Git  ', color: DIM },
    { text: 'Q', color: LIGHT },
    { text: ' Quit', color: DIM },
    { text: extra ? rep(' ', w - 60 - extra.length) + extra + '  ' : '', color: GRAY },
  ], w)),
];

/** Section divider with label */
export const section = (label: string, w: number): Row =>
  segRow(padSegs([
    { text: '  ', color: DIM },
    { text: label, color: LIGHT },
    { text: '  ' + rep('─', w - label.length - 6), color: DARK },
  ], w));

/** Format a relative time string from a Date */
export function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}
