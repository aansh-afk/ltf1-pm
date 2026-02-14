/**
 * Help Page - Keybinding reference organized by section
 * Static page, no data fetching required
 */

import { useInput } from 'ink';
import type { Row } from '../types.js';
import { WHITE, LIGHT, GRAY } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep,
  pageHeader, pageFooter, section,
} from '../helpers.js';

export interface HelpPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

interface KeyBinding {
  key: string;
  description: string;
}

const GLOBAL_SHORTCUTS: KeyBinding[] = [
  { key: '1/D', description: 'Dashboard' },
  { key: '?', description: 'Help' },
  { key: '2/T', description: 'Tasks' },
  { key: '/', description: 'Search' },
  { key: '3/S', description: 'Sprint' },
  { key: 'N', description: 'Notifications' },
  { key: '4/G', description: 'Git' },
  { key: 'Q', description: 'Quit' },
];

const TASKS_SHORTCUTS: KeyBinding[] = [
  { key: 'j/k', description: 'Navigate' },
  { key: 'c', description: 'Create task' },
  { key: 'Enter', description: 'View detail' },
  { key: 'e', description: 'Edit task' },
  { key: 'm', description: 'Move task' },
  { key: 'd', description: 'Delete task' },
  { key: 'a', description: 'Assign task' },
  { key: '/', description: 'Search' },
  { key: 'f', description: 'Cycle filter' },
  { key: 'F', description: 'Advanced filter' },
  { key: 'M', description: 'My tasks' },
  { key: 'C', description: 'Comment (detail)' },
  { key: 'T', description: 'Timer (detail)' },
];

const SPRINT_SHORTCUTS: KeyBinding[] = [
  { key: 'j/k', description: 'Navigate' },
  { key: 'c', description: 'Create sprint' },
  { key: 'Enter', description: 'View tasks' },
  { key: 'b', description: 'Backlog' },
  { key: '+/A', description: 'Add task' },
  { key: '-/R', description: 'Remove task' },
  { key: 'x', description: 'Close sprint' },
];

const GIT_SHORTCUTS: KeyBinding[] = [
  { key: 'j/k', description: 'Navigate files' },
  { key: 'Space', description: 'Stage/unstage' },
  { key: 's', description: 'Stage all' },
  { key: 'u', description: 'Unstage all' },
  { key: 'c', description: 'Commit' },
  { key: 'l', description: 'Link task' },
  { key: 'r', description: 'Refresh' },
];

function renderKeyBindingRows(
  bindings: KeyBinding[],
  W: number,
): Row[] {
  const rows: Row[] = [];
  const colWidth = Math.floor((W - 4) / 2);
  const keyW = 10;

  // Render two columns per row
  for (let i = 0; i < bindings.length; i += 2) {
    const left = bindings[i];
    const right = bindings[i + 1];

    const segs: Array<{ text: string; color: string }> = [
      { text: '    ', color: WHITE },
      { text: left.key.padEnd(keyW), color: LIGHT },
      { text: left.description, color: GRAY },
    ];

    if (right) {
      const leftLen = 4 + keyW + left.description.length;
      const gap = Math.max(2, colWidth - leftLen + 4);
      segs.push({ text: rep(' ', gap), color: WHITE });
      segs.push({ text: right.key.padEnd(keyW), color: LIGHT });
      segs.push({ text: right.description, color: GRAY });
    }

    rows.push(segRow(padSegs(segs, W)));
  }

  return rows;
}

export function useHelpPage({ width: W, height: H, isActive }: HelpPageProps): Row[] {
  // Escape is handled by App.tsx; no local input handling needed
  useInput(() => {}, { isActive });

  const rows: Row[] = [];
  rows.push(...pageHeader('Help', '', W));
  rows.push(blank(W));

  // Global shortcuts
  rows.push(section('GLOBAL SHORTCUTS', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(GLOBAL_SHORTCUTS, W));
  rows.push(blank(W));

  // Tasks page
  rows.push(section('TASKS PAGE', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(TASKS_SHORTCUTS, W));
  rows.push(blank(W));

  // Sprint page
  rows.push(section('SPRINT PAGE', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(SPRINT_SHORTCUTS, W));
  rows.push(blank(W));

  // Git page
  rows.push(section('GIT PAGE', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(GIT_SHORTCUTS, W));

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, 'ESC Back'));
  return rows;
}
