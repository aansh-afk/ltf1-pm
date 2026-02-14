/**
 * Search Page - Full-text search across tasks with live filtering
 * Loads all project tasks and filters client-side as user types
 */

import { useState, useMemo, useCallback } from 'react';
import { useInput } from 'ink';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Row, Task } from '../types.js';
import { WHITE, LIGHT, GRAY, DIM } from '../theme.js';
import { STATUS_ICONS, STATUS_COLORS } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep,
  pageHeader, pageFooter, truncate,
} from '../helpers.js';

export interface SearchPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

export function useSearchPage({ width: W, height: H, isActive }: SearchPageProps): Row[] {
  const config = useConfig();

  const tasksQuery = useConvexQuery(
    api.tasks.queries.getProjectTasks,
    config.projectId ? { projectId: config.projectId as never } : null,
    10000,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    if (!searchQuery.trim()) return all.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return all.filter(t => t.title.toLowerCase().includes(q));
  }, [tasksQuery.data, searchQuery]);

  const visibleRows = H - 10;

  const clampIndex = useCallback(
    (n: number) => Math.max(0, Math.min(results.length - 1, n)),
    [results.length],
  );

  useInput((input, key) => {
    if (!isActive) return;

    // Navigation
    if ((input === 'j' || key.downArrow) && !key.ctrl) {
      setSelectedIndex(prev => clampIndex(prev + 1));
      return;
    }
    if ((input === 'k' || key.upArrow) && !key.ctrl) {
      setSelectedIndex(prev => clampIndex(prev - 1));
      return;
    }

    // Escape clears search (parent handles page switch)
    if (key.escape) {
      setSearchQuery('');
      setSelectedIndex(0);
      return;
    }

    // Enter on selected result (flash for now)
    if (key.return) {
      return;
    }

    // Typing into search
    if (key.backspace || key.delete) {
      setSearchQuery(prev => prev.slice(0, -1));
      setSelectedIndex(0);
      return;
    }

    if (input && !key.ctrl && !key.meta && input.length === 1) {
      setSearchQuery(prev => prev + input);
      setSelectedIndex(0);
    }
  }, { isActive });

  // ── Render ──
  const rows: Row[] = [];
  rows.push(...pageHeader('Search', '', W));
  rows.push(blank(W));

  // Search input
  rows.push(segRow(padSegs([
    { text: '  / ', color: LIGHT },
    { text: searchQuery, color: WHITE },
    { text: '\u2588', color: GRAY },
    { text: rep(' ', Math.max(0, W - 6 - searchQuery.length)), color: WHITE },
  ], W)));
  rows.push(blank(W));

  if (!config.hasContext) {
    rows.push(segRow(padSegs([
      { text: '  No project selected', color: GRAY },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Run ', color: DIM },
      { text: 'ltf project select', color: LIGHT },
      { text: ' to choose a project', color: DIM },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Back'));
    return rows;
  }

  if (tasksQuery.loading && !tasksQuery.data) {
    rows.push(segRow(padSegs([
      { text: '  Loading tasks...', color: GRAY },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Back'));
    return rows;
  }

  // Results count
  rows.push(segRow(padSegs([
    { text: `  ${results.length} result${results.length !== 1 ? 's' : ''}`, color: DIM },
    { text: searchQuery.trim() ? ` for "${truncate(searchQuery, 30)}"` : '', color: DIM },
  ], W)));
  rows.push(blank(W));

  if (results.length === 0) {
    rows.push(segRow(padSegs([
      { text: '  No matching tasks found', color: GRAY },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Back'));
    return rows;
  }

  // Result list
  const visible = results.slice(0, visibleRows);
  for (let i = 0; i < visible.length; i++) {
    const t = visible[i];
    const icon = STATUS_ICONS[t.status] || '\u25CB';
    const iconColor = STATUS_COLORS[t.status] || GRAY;
    const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
    const maxTitle = W - 16 - key.length;
    const title = truncate(t.title, maxTitle);
    const isSelected = i === selectedIndex;

    if (isSelected) {
      rows.push({
        segments: padSegs([
          { text: `  \u25B8 ${icon} ${key}  ${title}`, color: '#000000' },
        ], W),
        bgColor: WHITE,
      });
    } else {
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: icon + ' ', color: iconColor },
        { text: key, color: GRAY },
        { text: '  ', color: WHITE },
        { text: title, color: LIGHT },
      ], W)));
    }
  }

  if (results.length > visibleRows) {
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `  Showing ${visible.length} of ${results.length}`, color: DIM },
    ], W)));
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, 'J/K Nav  Enter Select  ESC Back'));
  return rows;
}
