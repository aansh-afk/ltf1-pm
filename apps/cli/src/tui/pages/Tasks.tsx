/**
 * Tasks Page - Real task data from Convex with interactive features
 * Scrollable list with j/k navigation, status filters, create/move/detail
 */

import { useState, useMemo, useCallback } from 'react';
import { useInput } from 'ink';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { useMutations } from '../hooks/useMutations.js';
import { api } from '../../lib/convex.js';
import type { Row, Task, TaskStatus } from '../types.js';
import {
  WHITE, LIGHT, GRAY, DIM, DARK,
  STATUS_ICONS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
} from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep,
  pageHeader, pageFooter, section, truncate,
} from '../helpers.js';

export interface TasksPageProps {
  width: number;
  height: number;
  timeStr: string;
  isActive: boolean;
}

type TasksMode = 'list' | 'create' | 'move' | 'detail';
type StatusFilter = TaskStatus | 'all';

const STATUS_ORDER: TaskStatus[] = ['in_progress', 'in_review', 'todo', 'backlog', 'done', 'cancelled'];
const FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'in_progress' },
  { label: 'Review', value: 'in_review' },
  { label: 'To Do', value: 'todo' },
  { label: 'Backlog', value: 'backlog' },
  { label: 'Done', value: 'done' },
];

const MOVE_TARGETS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

export function useTasksPage({ width: W, height: H, timeStr, isActive }: TasksPageProps): Row[] {
  const config = useConfig();
  const mutations = useMutations();

  const tasksQuery = useConvexQuery(
    api.tasks.queries.getProjectTasks,
    config.projectId ? { projectId: config.projectId as never } : null,
    10000,
  );

  const [mode, setMode] = useState<TasksMode>('list');
  const [cursor, setCursor] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [, setFilterIdx] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  const [createTitle, setCreateTitle] = useState('');
  const [scrollOffset, setScrollOffset] = useState(0);

  // Filter and sort tasks
  const tasks = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    const filtered = filter === 'all' ? all : all.filter(t => t.status === filter);
    return filtered.sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.status);
      const bi = STATUS_ORDER.indexOf(b.status);
      if (ai !== bi) return ai - bi;
      return b._creationTime - a._creationTime;
    });
  }, [tasksQuery.data, filter]);

  // Task counts by status
  const counts = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    const c: Record<string, number> = { all: all.length };
    for (const t of all) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tasksQuery.data]);

  const selectedTask = tasks[cursor] || null;
  const visibleRows = H - 10; // approximate lines available for task list

  // Keep cursor in bounds
  const clampCursor = useCallback((n: number) => Math.max(0, Math.min(tasks.length - 1, n)), [tasks.length]);

  // Handle input for this page
  useInput((input, key) => {
    if (!isActive) return;

    if (mode === 'list') {
      // Navigation
      if (input === 'j' || key.downArrow) {
        setCursor(prev => {
          const next = clampCursor(prev + 1);
          if (next >= scrollOffset + visibleRows) setScrollOffset(next - visibleRows + 1);
          return next;
        });
      }
      if (input === 'k' || key.upArrow) {
        setCursor(prev => {
          const next = clampCursor(prev - 1);
          if (next < scrollOffset) setScrollOffset(next);
          return next;
        });
      }

      // Filter cycling with f
      if (input === 'f') {
        setFilterIdx(prev => {
          const next = (prev + 1) % FILTER_OPTIONS.length;
          setFilter(FILTER_OPTIONS[next].value);
          setCursor(0);
          setScrollOffset(0);
          return next;
        });
      }

      // Create task
      if (input === 'c' && config.projectId) {
        setMode('create');
        setCreateTitle('');
      }

      // Move task
      if (input === 'm' && selectedTask) {
        setMode('move');
        const idx = MOVE_TARGETS.indexOf(selectedTask.status);
        setMoveIndex(idx >= 0 ? idx : 0);
      }

      // Detail view
      if (key.return && selectedTask) {
        setMode('detail');
      }
    } else if (mode === 'create') {
      if (key.escape) {
        setMode('list');
        setCreateTitle('');
      } else if (key.return && createTitle.trim()) {
        mutations.createTask({
          projectId: config.projectId!,
          title: createTitle.trim(),
        }).then(() => {
          tasksQuery.refetch();
          setMode('list');
          setCreateTitle('');
        });
      } else if (key.backspace || key.delete) {
        setCreateTitle(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && input.length === 1) {
        setCreateTitle(prev => prev + input);
      }
    } else if (mode === 'move') {
      if (key.escape) setMode('list');
      if (input === 'j' || key.downArrow) {
        setMoveIndex(prev => Math.min(MOVE_TARGETS.length - 1, prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setMoveIndex(prev => Math.max(0, prev - 1));
      }
      if (key.return && selectedTask) {
        const target = MOVE_TARGETS[moveIndex];
        mutations.moveTask(selectedTask._id, target).then(() => {
          tasksQuery.refetch();
          setMode('list');
        });
      }
    } else if (mode === 'detail') {
      if (key.escape || input === 'b') setMode('list');
      if (input === 'm' && selectedTask) {
        setMode('move');
        setMoveIndex(MOVE_TARGETS.indexOf(selectedTask.status));
      }
    }
  }, { isActive });

  // ── Render ──
  const rows: Row[] = [];
  rows.push(...pageHeader('Tasks', timeStr, W));
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
    rows.push(...pageFooter(W));
    return rows;
  }

  if (tasksQuery.loading && !tasksQuery.data) {
    rows.push(segRow(padSegs([
      { text: '  Loading tasks...', color: GRAY },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Move overlay ──
  if (mode === 'move' && selectedTask) {
    rows.push(segRow(padSegs([
      { text: '  Move: ', color: GRAY },
      { text: `${config.projectKey || '#'}-${selectedTask.number}`, color: LIGHT },
      { text: '  ' + truncate(selectedTask.title, 40), color: WHITE },
    ], W)));
    rows.push(blank(W));

    for (let i = 0; i < MOVE_TARGETS.length; i++) {
      const s = MOVE_TARGETS[i];
      const icon = STATUS_ICONS[s] || '○';
      const isCurrent = s === selectedTask.status;
      const isHighlighted = i === moveIndex;
      const label = s.replace('_', ' ');

      if (isHighlighted) {
        rows.push({
          segments: padSegs([
            { text: `    ${icon} ${label}${isCurrent ? ' (current)' : ''}`, color: '#000000' },
          ], W),
          bgColor: WHITE,
        });
      } else {
        rows.push(segRow(padSegs([
          { text: '    ', color: WHITE },
          { text: icon + ' ', color: isCurrent ? WHITE : GRAY },
          { text: label, color: isCurrent ? WHITE : GRAY },
          { text: isCurrent ? ' (current)' : '', color: DIM },
        ], W)));
      }
    }
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'Enter', color: LIGHT },
      { text: ' Confirm   ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Create overlay ──
  if (mode === 'create') {
    rows.push(segRow(padSegs([
      { text: '  New Task', color: LIGHT },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Title: ', color: GRAY },
      { text: createTitle + '█', color: WHITE },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'Enter', color: LIGHT },
      { text: ' Create   ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Detail view ──
  if (mode === 'detail' && selectedTask) {
    const t = selectedTask;
    const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
    const icon = STATUS_ICONS[t.status] || '○';
    const statusLabel = t.status.replace('_', ' ');

    rows.push(segRow(padSegs([
      { text: '  ', color: WHITE },
      { text: key, color: LIGHT },
      { text: '  ', color: WHITE },
      { text: t.title, color: WHITE },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Status    ', color: GRAY },
      { text: icon + ' ' + statusLabel, color: STATUS_COLORS[t.status] || GRAY },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '  Priority  ', color: GRAY },
      { text: t.priority, color: PRIORITY_COLORS[t.priority] || GRAY },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '  Type      ', color: GRAY },
      { text: t.type, color: LIGHT },
    ], W)));

    if (t.description) {
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  Description', color: GRAY },
      ], W)));
      // Wrap description to width
      const desc = t.description;
      const lineW = W - 6;
      for (let i = 0; i < desc.length && rows.length < H - 6; i += lineW) {
        rows.push(segRow(padSegs([
          { text: '    ' + desc.slice(i, i + lineW), color: LIGHT },
        ], W)));
      }
    }

    if (t.labels && t.labels.length > 0) {
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  Labels    ', color: GRAY },
        { text: t.labels.join(', '), color: DIM },
      ], W)));
    }

    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'M', color: LIGHT },
      { text: ' Move   ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Back', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── List mode ──

  // Progress bar
  const total = counts['all'] || 0;
  const doneCount = counts['done'] || 0;
  if (total > 0) {
    const barW = 40;
    const filled = Math.round((doneCount / total) * barW);
    rows.push(segRow(padSegs([
      { text: '  ', color: WHITE },
      { text: rep('█', filled), color: WHITE },
      { text: rep('░', barW - filled), color: DIM },
      { text: `  ${doneCount}/${total} done`, color: GRAY },
    ], W)));
    rows.push(blank(W));
  }

  // Filter bar
  const filterSegs: Array<{ text: string; color: string }> = [{ text: '  Filter: ', color: GRAY }];
  for (let i = 0; i < FILTER_OPTIONS.length; i++) {
    const opt = FILTER_OPTIONS[i];
    const count = counts[opt.value] || 0;
    const active = filter === opt.value;
    if (i > 0) filterSegs.push({ text: '  ', color: DIM });
    filterSegs.push({ text: active ? `[${opt.label}]` : opt.label, color: active ? WHITE : DIM });
    if (count > 0 || opt.value === 'all') {
      filterSegs.push({ text: ` ${opt.value === 'all' ? total : count}`, color: active ? GRAY : DARK });
    }
  }
  rows.push(segRow(padSegs(filterSegs, W)));
  rows.push(blank(W));

  if (tasks.length === 0) {
    rows.push(segRow(padSegs([
      { text: '  No tasks', color: DIM },
      { text: filter !== 'all' ? ` with status "${filter.replace('_', ' ')}"` : '', color: DIM },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'C Create  F Filter'));
    return rows;
  }

  // Group by status for section headers
  let lastStatus = '';
  const visible = tasks.slice(scrollOffset, scrollOffset + visibleRows);

  for (let vi = 0; vi < visible.length; vi++) {
    const t = visible[vi];
    const idx = scrollOffset + vi;
    const isSelected = idx === cursor;

    // Section header on status change (only in 'all' filter)
    if (filter === 'all' && t.status !== lastStatus) {
      lastStatus = t.status;
      const label = t.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
      rows.push(section(label, W));
      rows.push(blank(W));
    }

    const icon = STATUS_ICONS[t.status] || '○';
    const iconColor = STATUS_COLORS[t.status] || GRAY;
    const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
    const pri = PRIORITY_LABELS[t.priority] || '';
    const priColor = PRIORITY_COLORS[t.priority] || DIM;
    const maxTitle = W - 14 - key.length - pri.length;
    const title = t.title.length > maxTitle ? t.title.slice(0, maxTitle - 1) + '…' : t.title;

    if (isSelected) {
      rows.push({
        segments: padSegs([
          { text: `  ▸ ${icon} ${key}  ${title}`, color: '#000000' },
          { text: rep(' ', Math.max(1, W - 8 - key.length - title.length - pri.length)), color: '#000000' },
          { text: pri, color: '#000000' },
        ], W),
        bgColor: WHITE,
      });
    } else {
      const titleColor = t.status === 'done' || t.status === 'cancelled' ? DIM :
        t.status === 'in_progress' ? WHITE : LIGHT;
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: icon + ' ', color: iconColor },
        { text: key, color: t.status === 'done' ? DIM : GRAY },
        { text: '  ', color: WHITE },
        { text: title, color: titleColor },
        { text: rep(' ', Math.max(1, W - 10 - key.length - title.length - pri.length)), color: WHITE },
        { text: pri, color: priColor },
      ], W)));
    }
  }

  // Scroll indicator
  if (tasks.length > visibleRows) {
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `  ${scrollOffset + 1}-${Math.min(scrollOffset + visibleRows, tasks.length)} of ${tasks.length}`, color: DIM },
    ], W)));
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, 'J/K Nav  C Create  M Move  F Filter  Enter Detail'));
  return rows;
}
