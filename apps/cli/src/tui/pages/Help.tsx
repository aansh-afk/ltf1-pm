/**
 * Help Page - Comprehensive keybinding reference organized by page sections
 * Static page with two-column key/description layout in Panel sections
 */

import { useInput } from 'ink';
import type { Row } from '../types.js';
import { theme } from '../theme.js';
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
  { key: 'q', description: 'Quit' },
  { key: 'ESC', description: 'Go back' },
  { key: 't', description: 'Tasks' },
  { key: 's', description: 'Sprint' },
  { key: 'a', description: 'Agent' },
  { key: 'k', description: 'Skills' },
  { key: 'g', description: 'Git' },
  { key: 'p', description: 'Projects' },
  { key: '/', description: 'Search' },
  { key: 'n', description: 'Notifications' },
  { key: ',', description: 'Settings' },
  { key: '?', description: 'Help' },
];

const DASHBOARD_SHORTCUTS: KeyBinding[] = [
  { key: 'j/k', description: 'Navigate menu' },
  { key: 'Enter', description: 'Select item' },
  { key: 'W', description: 'Switch workspace' },
  { key: 'P', description: 'Switch project' },
];

const TASKS_SHORTCUTS: KeyBinding[] = [
  { key: 'j/\u2193', description: 'Move down' },
  { key: 'k/\u2191', description: 'Move up' },
  { key: 'c', description: 'Create' },
  { key: 'e', description: 'Edit' },
  { key: 'd', description: 'Delete' },
  { key: 'm', description: 'Move status' },
  { key: 'a', description: 'Assign' },
  { key: 'x', description: 'Comment' },
  { key: 'f', description: 'Filter' },
  { key: 'ESC', description: 'Cancel' },
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

const AGENT_SHORTCUTS: KeyBinding[] = [
  { key: 'a', description: 'Accept' },
  { key: 'r', description: 'Reject' },
  { key: 'e', description: 'Modify' },
  { key: 'j/k', description: 'Navigate' },
];

const GIT_SHORTCUTS: KeyBinding[] = [
  { key: 'j/k', description: 'Navigate files' },
  { key: 'Space', description: 'Stage/unstage' },
  { key: 'a', description: 'Stage all' },
  { key: 'u', description: 'Unstage all' },
  { key: 'c', description: 'Commit' },
  { key: 'l', description: 'Link task' },
  { key: 'L', description: 'Link project' },
  { key: 'r', description: 'Refresh' },
];

const SEARCH_SHORTCUTS: KeyBinding[] = [
  { key: 'Type', description: 'Filter results' },
  { key: 'j/k', description: 'Navigate' },
  { key: 'Enter', description: 'Select result' },
  { key: 'ESC', description: 'Clear search' },
];

const NOTIFICATIONS_SHORTCUTS: KeyBinding[] = [
  { key: 'j/k', description: 'Navigate' },
  { key: 'Enter', description: 'Mark read' },
  { key: 'a', description: 'Mark all read' },
  { key: 'ESC', description: 'Back' },
];

const SETTINGS_SHORTCUTS: KeyBinding[] = [
  { key: 'j/k', description: 'Navigate' },
  { key: 'Enter', description: 'Toggle/Edit' },
  { key: 'ESC', description: 'Back' },
];

function renderKeyBindingRows(
  bindings: KeyBinding[],
  W: number,
): Row[] {
  const rows: Row[] = [];
  const colWidth = Math.floor((W - 4) / 2);
  const keyW = 10;

  for (let i = 0; i < bindings.length; i += 2) {
    const left = bindings[i];
    const right = bindings[i + 1];

    const segs: Array<{ text: string; color: string }> = [
      { text: '    ', color: theme.text },
      { text: left.key.padEnd(keyW), color: theme.accent },
      { text: left.description, color: theme.textSecondary },
    ];

    if (right) {
      const leftLen = 4 + keyW + left.description.length;
      const gap = Math.max(2, colWidth - leftLen + 4);
      segs.push({ text: rep(' ', gap), color: theme.text });
      segs.push({ text: right.key.padEnd(keyW), color: theme.accent });
      segs.push({ text: right.description, color: theme.textSecondary });
    }

    rows.push(segRow(padSegs(segs, W)));
  }

  return rows;
}

export function useHelpPage({ width: W, height: H, isActive }: HelpPageProps): Row[] {
  useInput(() => {}, { isActive });

  const rows: Row[] = [];
  rows.push(...pageHeader('Help', '', W));
  rows.push(blank(W));

  // Global
  rows.push(section('GLOBAL', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(GLOBAL_SHORTCUTS, W));
  rows.push(blank(W));

  // Dashboard
  rows.push(section('DASHBOARD', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(DASHBOARD_SHORTCUTS, W));
  rows.push(blank(W));

  // Tasks
  rows.push(section('TASKS', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(TASKS_SHORTCUTS, W));
  rows.push(blank(W));

  // Sprint
  rows.push(section('SPRINT', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(SPRINT_SHORTCUTS, W));
  rows.push(blank(W));

  // Agent
  rows.push(section('AGENT', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(AGENT_SHORTCUTS, W));
  rows.push(blank(W));

  // Git
  rows.push(section('GIT', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(GIT_SHORTCUTS, W));
  rows.push(blank(W));

  // Search
  rows.push(section('SEARCH', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(SEARCH_SHORTCUTS, W));
  rows.push(blank(W));

  // Notifications
  rows.push(section('NOTIFICATIONS', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(NOTIFICATIONS_SHORTCUTS, W));
  rows.push(blank(W));

  // Settings
  rows.push(section('SETTINGS', W));
  rows.push(blank(W));
  rows.push(...renderKeyBindingRows(SETTINGS_SHORTCUTS, W));

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, 'ESC Back'));
  return rows;
}
