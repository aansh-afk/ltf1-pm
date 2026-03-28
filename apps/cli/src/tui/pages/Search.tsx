/**
 * Search Page - Global search across tasks, projects, and sprints
 * Uses globalSearch API for cross-entity searching with type indicators
 */

import { useState, useMemo, useCallback } from 'react';
import { useInput } from 'ink';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Row } from '../types.js';
import { theme } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep,
  pageHeader, pageFooter, truncate,
} from '../helpers.js';

export interface SearchPageProps {
  width: number;
  height: number;
  isActive: boolean;
}

interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'sprint';
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  url: string;
  createdAt: number;
}

function typeIcon(type: string): string {
  switch (type) {
    case 'task': return '\u2610';
    case 'sprint': return '\u27F3';
    case 'project': return '\u25B9';
    default: return '\u25CB';
  }
}

function typeColor(type: string): string {
  switch (type) {
    case 'task': return theme.accent;
    case 'sprint': return theme.cyan;
    case 'project': return theme.purple;
    default: return theme.textMuted;
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'task': return 'task';
    case 'sprint': return 'sprint';
    case 'project': return 'project';
    default: return type;
  }
}

export function useSearchPage({ width: W, height: H, isActive }: SearchPageProps): Row[] {
  const config = useConfig();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use globalSearch API when query is non-empty
  const searchArgs = useMemo(() => {
    if (!searchQuery.trim() || !config.workspaceId) return null;
    return {
      query: searchQuery.trim(),
      filters: {
        workspace: config.workspaceId as never,
        ...(config.projectId ? { project: config.projectId as never } : {}),
      },
      limit: 20,
    };
  }, [searchQuery, config.workspaceId, config.projectId]);

  const searchResults = useConvexQuery(
    api.search.queries.globalSearch,
    searchArgs,
    5000,
  );

  // Fall back to local task search when no global query
  const tasksQuery = useConvexQuery(
    api.tasks.queries.getProjectTasks,
    !searchQuery.trim() && config.projectId ? { projectId: config.projectId as never } : null,
    10000,
  );

  const results: SearchResult[] = useMemo(() => {
    if (searchQuery.trim() && searchResults.data) {
      return (searchResults.data as SearchResult[]) || [];
    }
    // Show recent tasks when no search query
    const tasks = (tasksQuery.data as Array<{
      _id: string;
      title: string;
      status: string;
      priority?: string;
      number: number;
      _creationTime: number;
    }> | null) || [];
    return tasks.slice(0, 20).map(t => ({
      id: t._id,
      type: 'task' as const,
      title: t.title,
      status: t.status,
      priority: t.priority,
      url: '',
      createdAt: t._creationTime,
    }));
  }, [searchQuery, searchResults.data, tasksQuery.data]);

  const visibleRows = H - 12;

  const clampIndex = useCallback(
    (n: number) => Math.max(0, Math.min(results.length - 1, n)),
    [results.length],
  );

  useInput((input, key) => {
    if (!isActive) return;

    if ((input === 'j' || key.downArrow) && !key.ctrl) {
      setSelectedIndex(prev => clampIndex(prev + 1));
      return;
    }
    if ((input === 'k' || key.upArrow) && !key.ctrl) {
      setSelectedIndex(prev => clampIndex(prev - 1));
      return;
    }

    if (key.escape) {
      setSearchQuery('');
      setSelectedIndex(0);
      return;
    }

    if (key.return) {
      // Navigate to selected result (handled by parent in future)
      return;
    }

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

  // Search input panel
  rows.push(segRow(padSegs([
    { text: '  \uD83D\uDD0D \u2502 ', color: theme.textMuted },
    { text: searchQuery || '', color: theme.text },
    { text: '\u2588', color: theme.textMuted },
    { text: rep(' ', Math.max(0, W - 8 - searchQuery.length)), color: theme.text },
  ], W)));
  rows.push(blank(W));

  if (!config.hasContext) {
    rows.push(segRow(padSegs([
      { text: '  No project selected', color: theme.textMuted },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Run ', color: theme.textDim },
      { text: 'ltf project select', color: theme.textSecondary },
      { text: ' to choose a project', color: theme.textDim },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Back'));
    return rows;
  }

  const isLoading = searchQuery.trim() ? searchResults.loading : tasksQuery.loading;
  if (isLoading && results.length === 0) {
    rows.push(segRow(padSegs([
      { text: '  Searching...', color: theme.textMuted },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Clear'));
    return rows;
  }

  // Results header
  const resultLabel = searchQuery.trim()
    ? `RESULTS (${results.length})`
    : `RECENT TASKS (${results.length})`;
  rows.push(segRow(padSegs([
    { text: '  ', color: theme.textDim },
    { text: resultLabel, color: theme.textSecondary },
    { text: '  ' + rep('\u2500', W - resultLabel.length - 6), color: theme.border },
  ], W)));
  rows.push(blank(W));

  if (results.length === 0) {
    rows.push(segRow(padSegs([
      { text: '  No results found', color: theme.textMuted },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'ESC Clear'));
    return rows;
  }

  // Result list
  const visible = results.slice(0, visibleRows);
  for (let i = 0; i < visible.length; i++) {
    const r = visible[i];
    const icon = typeIcon(r.type);
    const tColor = typeColor(r.type);
    const tLabel = typeLabel(r.type).padEnd(8);
    const isSelected = i === selectedIndex;
    const maxTitle = W - 22 - tLabel.length;
    const title = truncate(r.title, maxTitle);

    if (isSelected) {
      rows.push({
        segments: padSegs([
          { text: `  \u25B8 ${icon} `, color: theme.text },
          { text: title, color: theme.text },
          { text: rep(' ', Math.max(1, maxTitle - title.length + 2)), color: theme.text },
          { text: tLabel, color: tColor },
        ], W),
        bgColor: theme.border,
      });
    } else {
      rows.push(segRow(padSegs([
        { text: `    ${icon} `, color: tColor },
        { text: title, color: theme.textSecondary },
        { text: rep(' ', Math.max(1, maxTitle - title.length + 2)), color: theme.text },
        { text: tLabel, color: theme.textDim },
      ], W)));
    }
  }

  if (results.length > visibleRows) {
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `  Showing ${visible.length} of ${results.length}`, color: theme.textDim },
    ], W)));
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, '\u23CE Select  \u2191\u2193 Navigate  ESC Clear'));
  return rows;
}
