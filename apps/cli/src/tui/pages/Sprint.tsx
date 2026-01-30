/**
 * Sprint Page - Real sprint data from Convex
 * Active sprint info, progress, burndown, sprint tasks, history
 */

import { useMemo } from 'react';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Row, Task, Sprint } from '../types.js';
import { WHITE, LIGHT, GRAY, DIM, DARK } from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep, pad,
  pageHeader, pageFooter, section, truncate,
} from '../helpers.js';

export interface SprintPageProps {
  width: number;
  height: number;
  timeStr: string;
}

export function useSprintPage({ width: W, height: H, timeStr }: SprintPageProps): Row[] {
  const config = useConfig();

  const sprintQuery = useConvexQuery(
    api.sprints.queries.getCurrentSprint,
    config.projectId ? { projectId: config.projectId as never } : null,
    15000,
  );

  const sprintsQuery = useConvexQuery(
    api.sprints.queries.getProjectSprints,
    config.projectId ? { projectId: config.projectId as never } : null,
    30000,
  );

  const tasksQuery = useConvexQuery(
    api.tasks.queries.getProjectTasks,
    config.projectId ? { projectId: config.projectId as never } : null,
    10000,
  );

  const activeSprint = sprintQuery.data as Sprint | null;

  // Tasks in active sprint
  const sprintTasks = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    if (!activeSprint) return [];
    return all.filter(t => t.sprintId === activeSprint._id);
  }, [tasksQuery.data, activeSprint]);

  // Sprint task stats
  const stats = useMemo(() => {
    const total = sprintTasks.length;
    const done = sprintTasks.filter(t => t.status === 'done').length;
    const inProgress = sprintTasks.filter(t => t.status === 'in_progress' || t.status === 'in_review').length;
    const todo = total - done - inProgress;
    return { total, done, inProgress, todo };
  }, [sprintTasks]);

  // Sprint history (exclude active)
  const pastSprints = useMemo(() => {
    const all = (sprintsQuery.data as Sprint[] | null) || [];
    if (!activeSprint) return all.slice(0, 5);
    return all.filter(s => s._id !== activeSprint._id).slice(0, 5);
  }, [sprintsQuery.data, activeSprint]);

  const rows: Row[] = [];

  const title = activeSprint ? activeSprint.name : 'Sprint';
  rows.push(...pageHeader(title, timeStr, W));
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

  if (sprintQuery.loading && !sprintQuery.data) {
    rows.push(segRow(padSegs([
      { text: '  Loading sprint data...', color: GRAY },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  if (!activeSprint) {
    rows.push(segRow(padSegs([
      { text: '  No active sprint', color: GRAY },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Start a sprint from the web app or run ', color: DIM },
      { text: 'ltf sprint start', color: LIGHT },
    ], W)));

    // Show sprint history if available
    if (pastSprints.length > 0) {
      rows.push(blank(W));
      rows.push(blank(W));
      rows.push(section('Sprint History', W));
      rows.push(blank(W));

      for (const s of pastSprints) {
        const start = new Date(s.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        const end = new Date(s.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        rows.push(segRow(padSegs([
          { text: '    ', color: WHITE },
          { text: s.status === 'completed' ? '✓' : '○', color: s.status === 'completed' ? LIGHT : DIM },
          { text: '  ', color: WHITE },
          { text: pad(s.name, 20), color: GRAY },
          { text: `${start} – ${end}`, color: DIM },
        ], W)));
      }
    }

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Active sprint overview ──
  const now = Date.now();
  const startDate = new Date(activeSprint.startDate);
  const endDate = new Date(activeSprint.endDate);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now) / 86400000));
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
  const elapsed = totalDays - daysLeft;

  const startStr = startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

  rows.push(segRow(padSegs([
    { text: `  ${startStr} – ${endStr}`, color: GRAY },
    { text: '    ', color: WHITE },
    { text: `${daysLeft} days left`, color: WHITE },
  ], W)));

  if (activeSprint.goal) {
    rows.push(segRow(padSegs([
      { text: '  Goal: ', color: GRAY },
      { text: truncate(activeSprint.goal, W - 12), color: LIGHT },
    ], W)));
  }

  rows.push(blank(W));

  // Progress bar
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const barW = 50;
  const filled = stats.total > 0 ? Math.round((stats.done / stats.total) * barW) : 0;
  rows.push(segRow(padSegs([
    { text: '  ', color: WHITE },
    { text: rep('█', filled), color: WHITE },
    { text: rep('░', barW - filled), color: DIM },
    { text: `  ${pct}%`, color: GRAY },
    { text: `  (${stats.done} of ${stats.total} tasks)`, color: DIM },
  ], W)));

  rows.push(blank(W));
  rows.push(blank(W));

  // ── Breakdown ──
  rows.push(section('Breakdown', W));
  rows.push(blank(W));

  const bw = 25;
  if (stats.total > 0) {
    rows.push(segRow(padSegs([
      { text: '    Done          ', color: GRAY },
      { text: rep('█', Math.round(stats.done / stats.total * bw)), color: WHITE },
      { text: rep('░', bw - Math.round(stats.done / stats.total * bw)), color: DIM },
      { text: `  ${String(stats.done).padStart(3)}`, color: WHITE },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '    In Progress   ', color: GRAY },
      { text: rep('█', Math.round(stats.inProgress / stats.total * bw)), color: LIGHT },
      { text: rep('░', bw - Math.round(stats.inProgress / stats.total * bw)), color: DIM },
      { text: `  ${String(stats.inProgress).padStart(3)}`, color: LIGHT },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '    To Do         ', color: GRAY },
      { text: rep('█', Math.round(stats.todo / stats.total * bw)), color: GRAY },
      { text: rep('░', bw - Math.round(stats.todo / stats.total * bw)), color: DIM },
      { text: `  ${String(stats.todo).padStart(3)}`, color: GRAY },
    ], W)));
  } else {
    rows.push(segRow(padSegs([
      { text: '    No tasks in this sprint', color: DIM },
    ], W)));
  }

  rows.push(blank(W));
  rows.push(blank(W));

  // ── Burndown (time-based approximation) ──
  rows.push(section('Burndown', W));
  rows.push(blank(W));

  if (stats.total > 0 && elapsed >= 0) {
    const remaining = stats.total - stats.done;
    const idealPerDay = stats.total / totalDays;

    // Show key points: day 1, 1/4, 1/2, 3/4, now
    const checkpoints = [
      { day: 1, remaining: stats.total, ideal: stats.total },
    ];

    const quarter = Math.floor(totalDays / 4);
    if (quarter > 1) checkpoints.push({ day: quarter, remaining: Math.round(stats.total * 0.75), ideal: Math.round(stats.total - idealPerDay * quarter) });
    const half = Math.floor(totalDays / 2);
    if (half > quarter) checkpoints.push({ day: half, remaining: Math.round(stats.total * 0.5), ideal: Math.round(stats.total - idealPerDay * half) });
    if (elapsed > 0) {
      checkpoints.push({ day: elapsed, remaining, ideal: Math.max(0, Math.round(stats.total - idealPerDay * elapsed)) });
    }

    for (const d of checkpoints) {
      const dayLabel = `Day ${String(d.day).padStart(2)}`;
      rows.push(segRow(padSegs([
        { text: `    ${dayLabel}  `, color: GRAY },
        { text: rep('█', d.remaining), color: WHITE },
        { text: rep('░', Math.max(0, stats.total - d.remaining)), color: DARK },
        { text: ` ${String(d.remaining).padStart(2)}`, color: WHITE },
        { text: `  ideal ${String(d.ideal).padStart(2)}`, color: DIM },
      ], W)));
    }

    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `    ${remaining} tasks remaining, ideal is ${Math.max(0, Math.round(stats.total - idealPerDay * elapsed))}`, color: DIM },
    ], W)));
  } else {
    rows.push(segRow(padSegs([
      { text: '    No burndown data yet', color: DIM },
    ], W)));
  }

  rows.push(blank(W));
  rows.push(blank(W));

  // ── Metrics ──
  rows.push(section('Metrics', W));
  rows.push(blank(W));

  const burnRate = elapsed > 0 ? (stats.done / elapsed).toFixed(1) : '0.0';
  const blockers = sprintTasks.filter(t => t.status === 'backlog').length;

  rows.push(segRow(padSegs([
    { text: '    Velocity       ', color: GRAY },
    { text: `${stats.total} pts/sprint`, color: WHITE },
  ], W)));
  rows.push(segRow(padSegs([
    { text: '    Burn rate      ', color: GRAY },
    { text: `${burnRate} tasks/day`, color: WHITE },
  ], W)));
  rows.push(segRow(padSegs([
    { text: '    Blockers       ', color: GRAY },
    { text: String(blockers), color: WHITE },
  ], W)));

  // ── Sprint History ──
  if (pastSprints.length > 0) {
    rows.push(blank(W));
    rows.push(blank(W));
    rows.push(section('History', W));
    rows.push(blank(W));

    for (const s of pastSprints.slice(0, 3)) {
      const start = new Date(s.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      const end = new Date(s.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: s.status === 'completed' ? '✓' : '○', color: s.status === 'completed' ? LIGHT : DIM },
        { text: '  ', color: WHITE },
        { text: pad(s.name, 20), color: GRAY },
        { text: `${start} – ${end}`, color: DIM },
      ], W)));
    }
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W));
  return rows;
}
