/**
 * Sprint Page - Real sprint data from Convex with interactive features
 * Active sprint overview, progress, burndown, task list, create, close, backlog
 */

import { useState, useMemo, useCallback } from 'react';
import { useInput } from 'ink';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Row, Task, Sprint } from '../types.js';
import {
  WHITE, LIGHT, GRAY, DIM, DARK,
  STATUS_ICONS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
} from '../theme.js';
import {
  segRow, blank, padSegs, fillTo, rep, pad,
  pageHeader, pageFooter, section, truncate,
} from '../helpers.js';

export interface SprintPageProps {
  width: number;
  height: number;
  timeStr: string;
  isActive?: boolean;
}

type SprintMode = 'overview' | 'tasks' | 'create' | 'close_confirm' | 'add_task' | 'backlog';

export function useSprintPage({ width: W, height: H, timeStr, isActive }: SprintPageProps): Row[] {
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

  // All sprints list (active first, then past)
  const allSprints = useMemo(() => {
    const all = (sprintsQuery.data as Sprint[] | null) || [];
    if (!activeSprint) return all.slice(0, 10);
    const active = all.filter(s => s._id === activeSprint._id);
    const past = all.filter(s => s._id !== activeSprint._id);
    return [...active, ...past].slice(0, 10);
  }, [sprintsQuery.data, activeSprint]);

  // Tasks in active sprint
  const sprintTasks = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    if (!activeSprint) return [];
    return all.filter(t => t.sprintId === activeSprint._id);
  }, [tasksQuery.data, activeSprint]);

  // Tasks for the currently selected sprint (may differ from active)
  const selectedSprintTasks = useCallback((sprintId: string) => {
    const all = (tasksQuery.data as Task[] | null) || [];
    return all.filter(t => t.sprintId === sprintId);
  }, [tasksQuery.data]);

  // Backlog tasks (no sprint assigned)
  const backlogTasks = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    return all.filter(t => !t.sprintId);
  }, [tasksQuery.data]);

  // Sprint task stats (for active sprint)
  const stats = useMemo(() => {
    const total = sprintTasks.length;
    const done = sprintTasks.filter(t => t.status === 'done').length;
    const inProgress = sprintTasks.filter(t => t.status === 'in_progress' || t.status === 'in_review').length;
    const todo = total - done - inProgress;
    return { total, done, inProgress, todo };
  }, [sprintTasks]);

  // ── State ──
  const [mode, setMode] = useState<SprintMode>('overview');
  const [selectedSprintIndex, setSelectedSprintIndex] = useState(0);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
  const [createName, setCreateName] = useState('');
  const [createGoal, setCreateGoal] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [addTaskSelections, setAddTaskSelections] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState('');

  // Clamp helpers
  const clampSprint = useCallback(
    (n: number) => Math.max(0, Math.min(allSprints.length - 1, n)),
    [allSprints.length],
  );

  // Today's date string for create defaults
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const twoWeeksStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // ── Keyboard handling ──
  useInput((input, key) => {
    // Clear status message on any input
    if (statusMessage) setStatusMessage('');

    if (mode === 'overview') {
      if (input === 'j' || key.downArrow) {
        setSelectedSprintIndex(prev => clampSprint(prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedSprintIndex(prev => clampSprint(prev - 1));
      }
      if (key.return && allSprints.length > 0) {
        setSelectedTaskIndex(0);
        setMode('tasks');
      }
      if (input === 'c' && config.projectId) {
        setCreateStep(1);
        setCreateName('');
        setCreateGoal('');
        setCreateStartDate(todayStr);
        setCreateEndDate(twoWeeksStr);
        setMode('create');
      }
      if (input === 'b') {
        setSelectedTaskIndex(0);
        setMode('backlog');
      }
      if (input === 'x' && activeSprint && selectedSprintIndex === 0) {
        setMode('close_confirm');
      }
    } else if (mode === 'tasks') {
      const sprint = allSprints[selectedSprintIndex];
      const tasks = sprint ? selectedSprintTasks(sprint._id) : [];

      if (input === 'j' || key.downArrow) {
        setSelectedTaskIndex(prev => Math.min(tasks.length - 1, prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedTaskIndex(prev => Math.max(0, prev - 1));
      }
      if (key.escape) {
        setMode('overview');
      }
      if ((input === '+' || input === 'A') && sprint) {
        setAddTaskSelections(new Set());
        setSelectedTaskIndex(0);
        setMode('add_task');
      }
      if ((input === '-' || input === 'R') && tasks[selectedTaskIndex]) {
        // TODO: removeTaskFromSprint mutation will be wired by integration agent
        setStatusMessage('Task removal requires removeTaskFromSprint mutation');
      }
    } else if (mode === 'create') {
      if (key.escape) {
        setMode('overview');
      } else if (createStep === 1) {
        if (key.return && createName.trim()) {
          setCreateStep(2);
        } else if (key.backspace || key.delete) {
          setCreateName(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && input.length === 1) {
          setCreateName(prev => prev + input);
        }
      } else if (createStep === 2) {
        if (key.return) {
          setCreateStep(3);
        } else if (key.backspace || key.delete) {
          setCreateGoal(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && input.length === 1) {
          setCreateGoal(prev => prev + input);
        }
      } else if (createStep === 3) {
        if (key.return && createStartDate.trim()) {
          setCreateStep(4);
        } else if (key.backspace || key.delete) {
          setCreateStartDate(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && input.length === 1) {
          setCreateStartDate(prev => prev + input);
        }
      } else if (createStep === 4) {
        if (key.return && createEndDate.trim()) {
          // TODO: createSprint mutation will be wired by integration agent
          setStatusMessage('Sprint creation requires createSprint mutation');
          setMode('overview');
        } else if (key.backspace || key.delete) {
          setCreateEndDate(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && input.length === 1) {
          setCreateEndDate(prev => prev + input);
        }
      }
    } else if (mode === 'close_confirm') {
      if (input === 'y') {
        // TODO: updateSprint mutation will be wired by integration agent
        setStatusMessage('Sprint close requires updateSprint mutation');
        setMode('overview');
      }
      if (input === 'n' || key.escape) {
        setMode('overview');
      }
    } else if (mode === 'add_task') {
      if (key.escape) {
        setMode('tasks');
      }
      if (input === 'j' || key.downArrow) {
        setSelectedTaskIndex(prev => Math.min(backlogTasks.length - 1, prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedTaskIndex(prev => Math.max(0, prev - 1));
      }
      if (input === ' ' && backlogTasks[selectedTaskIndex]) {
        const taskId = backlogTasks[selectedTaskIndex]._id;
        setAddTaskSelections(prev => {
          const next = new Set(prev);
          if (next.has(taskId)) next.delete(taskId);
          else next.add(taskId);
          return next;
        });
      }
      if (key.return && addTaskSelections.size > 0) {
        // TODO: addTasksToSprint mutation will be wired by integration agent
        setStatusMessage(`Adding ${addTaskSelections.size} tasks requires addTasksToSprint mutation`);
        setMode('tasks');
      }
    } else if (mode === 'backlog') {
      if (key.escape) {
        setMode('overview');
      }
      if (input === 'j' || key.downArrow) {
        setSelectedTaskIndex(prev => Math.min(backlogTasks.length - 1, prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedTaskIndex(prev => Math.max(0, prev - 1));
      }
      if (input === '+' && backlogTasks[selectedTaskIndex] && activeSprint) {
        // TODO: addTasksToSprint mutation will be wired by integration agent
        setStatusMessage('Adding to sprint requires addTasksToSprint mutation');
      }
    }
  }, { isActive: isActive ?? false });

  // ── Render ──
  const rows: Row[] = [];

  const title = activeSprint ? activeSprint.name : 'Sprint';
  rows.push(...pageHeader(title, timeStr, W));
  rows.push(blank(W));

  // Status message banner
  if (statusMessage) {
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: statusMessage, color: LIGHT },
    ], W)));
    rows.push(blank(W));
  }

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

  // ── Create mode ──
  if (mode === 'create') {
    rows.push(segRow(padSegs([
      { text: '  New Sprint', color: LIGHT },
      { text: `  (Step ${createStep} of 4)`, color: DIM },
    ], W)));
    rows.push(blank(W));

    // Step 1: Name
    const nameActive = createStep === 1;
    rows.push(segRow(padSegs([
      { text: nameActive ? '  ▸ ' : '    ', color: nameActive ? WHITE : DIM },
      { text: 'Name: ', color: GRAY },
      { text: createName + (nameActive ? '█' : ''), color: nameActive ? WHITE : LIGHT },
    ], W)));

    // Step 2: Goal
    const goalActive = createStep === 2;
    rows.push(segRow(padSegs([
      { text: goalActive ? '  ▸ ' : '    ', color: goalActive ? WHITE : DIM },
      { text: 'Goal: ', color: GRAY },
      { text: (createGoal || (goalActive ? '' : '(optional)')) + (goalActive ? '█' : ''), color: goalActive ? WHITE : DIM },
    ], W)));

    // Step 3: Start date
    const startActive = createStep === 3;
    rows.push(segRow(padSegs([
      { text: startActive ? '  ▸ ' : '    ', color: startActive ? WHITE : DIM },
      { text: 'Start: ', color: GRAY },
      { text: createStartDate + (startActive ? '█' : ''), color: startActive ? WHITE : LIGHT },
    ], W)));

    // Step 4: End date
    const endActive = createStep === 4;
    rows.push(segRow(padSegs([
      { text: endActive ? '  ▸ ' : '    ', color: endActive ? WHITE : DIM },
      { text: 'End:   ', color: GRAY },
      { text: createEndDate + (endActive ? '█' : ''), color: endActive ? WHITE : LIGHT },
    ], W)));

    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'Enter', color: LIGHT },
      { text: createStep === 4 ? ' Create   ' : ' Next   ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Close confirm mode ──
  if (mode === 'close_confirm' && activeSprint) {
    rows.push(segRow(padSegs([
      { text: '  Close Sprint', color: LIGHT },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `  Close sprint '${truncate(activeSprint.name, W - 20)}'?`, color: WHITE },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '  Incomplete tasks will move to backlog.', color: GRAY },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'Y', color: LIGHT },
      { text: ' Confirm   ', color: DIM },
      { text: 'N', color: LIGHT },
      { text: '/ESC Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Add task mode ──
  if (mode === 'add_task') {
    rows.push(segRow(padSegs([
      { text: '  Add Tasks to Sprint', color: LIGHT },
      { text: addTaskSelections.size > 0 ? `  (${addTaskSelections.size} selected)` : '', color: GRAY },
    ], W)));
    rows.push(blank(W));

    if (backlogTasks.length === 0) {
      rows.push(segRow(padSegs([
        { text: '  No unassigned tasks available', color: DIM },
      ], W)));
    } else {
      const visibleCount = Math.min(backlogTasks.length, H - 10);
      for (let i = 0; i < visibleCount; i++) {
        const t = backlogTasks[i];
        const isSelected = i === selectedTaskIndex;
        const isChecked = addTaskSelections.has(t._id);
        const icon = STATUS_ICONS[t.status] || '○';
        const check = isChecked ? '[x]' : '[ ]';
        const pri = PRIORITY_LABELS[t.priority] || '';
        const maxTitle = W - 20 - pri.length;
        const taskTitle = truncate(t.title, maxTitle);

        if (isSelected) {
          rows.push({
            segments: padSegs([
              { text: `  ${check} ${icon} ${taskTitle}`, color: '#000000' },
              { text: rep(' ', Math.max(1, W - 10 - taskTitle.length - pri.length)), color: '#000000' },
              { text: pri, color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        } else {
          rows.push(segRow(padSegs([
            { text: `  ${check} `, color: isChecked ? WHITE : DIM },
            { text: icon + ' ', color: STATUS_COLORS[t.status] || GRAY },
            { text: taskTitle, color: LIGHT },
            { text: rep(' ', Math.max(1, W - 10 - taskTitle.length - pri.length)), color: WHITE },
            { text: pri, color: PRIORITY_COLORS[t.priority] || DIM },
          ], W)));
        }
      }
    }

    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'Space', color: LIGHT },
      { text: ' Toggle  ', color: DIM },
      { text: 'Enter', color: LIGHT },
      { text: ' Confirm  ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Backlog mode ──
  if (mode === 'backlog') {
    rows.push(section('Backlog', W));
    rows.push(blank(W));

    if (backlogTasks.length === 0) {
      rows.push(segRow(padSegs([
        { text: '  No tasks in backlog', color: DIM },
      ], W)));
    } else {
      rows.push(segRow(padSegs([
        { text: `  ${backlogTasks.length} unassigned tasks`, color: GRAY },
      ], W)));
      rows.push(blank(W));

      const visibleCount = Math.min(backlogTasks.length, H - 10);
      for (let i = 0; i < visibleCount; i++) {
        const t = backlogTasks[i];
        const isSelected = i === selectedTaskIndex;
        const icon = STATUS_ICONS[t.status] || '○';
        const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
        const pri = PRIORITY_LABELS[t.priority] || '';
        const maxTitle = W - 16 - key.length - pri.length;
        const taskTitle = truncate(t.title, maxTitle);

        if (isSelected) {
          rows.push({
            segments: padSegs([
              { text: `  ▸ ${icon} ${key}  ${taskTitle}`, color: '#000000' },
              { text: rep(' ', Math.max(1, W - 10 - key.length - taskTitle.length - pri.length)), color: '#000000' },
              { text: pri, color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        } else {
          rows.push(segRow(padSegs([
            { text: '    ', color: WHITE },
            { text: icon + ' ', color: STATUS_COLORS[t.status] || GRAY },
            { text: key, color: GRAY },
            { text: '  ', color: WHITE },
            { text: taskTitle, color: LIGHT },
            { text: rep(' ', Math.max(1, W - 12 - key.length - taskTitle.length - pri.length)), color: WHITE },
            { text: pri, color: PRIORITY_COLORS[t.priority] || DIM },
          ], W)));
        }
      }
    }

    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'J/K', color: LIGHT },
      { text: ' Nav  ', color: DIM },
      { text: '+', color: LIGHT },
      { text: ' Add to Sprint  ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Back', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Tasks mode ──
  if (mode === 'tasks') {
    const sprint = allSprints[selectedSprintIndex];
    if (!sprint) {
      setMode('overview');
    } else {
      const tasks = selectedSprintTasks(sprint._id);
      const isActiveSprint = activeSprint && sprint._id === activeSprint._id;

      rows.push(segRow(padSegs([
        { text: '  ', color: WHITE },
        { text: sprint.name, color: WHITE },
        { text: isActiveSprint ? '  (active)' : `  (${sprint.status})`, color: isActiveSprint ? LIGHT : DIM },
      ], W)));
      rows.push(blank(W));

      if (tasks.length === 0) {
        rows.push(segRow(padSegs([
          { text: '  No tasks in this sprint', color: DIM },
        ], W)));
      } else {
        const visibleCount = Math.min(tasks.length, H - 10);
        for (let i = 0; i < visibleCount; i++) {
          const t = tasks[i];
          const isSelected = i === selectedTaskIndex;
          const icon = STATUS_ICONS[t.status] || '○';
          const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
          const pri = PRIORITY_LABELS[t.priority] || '';
          const priColor = PRIORITY_COLORS[t.priority] || DIM;
          const maxTitle = W - 16 - key.length - pri.length;
          const taskTitle = truncate(t.title, maxTitle);

          if (isSelected) {
            rows.push({
              segments: padSegs([
                { text: `  ▸ ${icon} ${key}  ${taskTitle}`, color: '#000000' },
                { text: rep(' ', Math.max(1, W - 10 - key.length - taskTitle.length - pri.length)), color: '#000000' },
                { text: pri, color: '#000000' },
              ], W),
              bgColor: WHITE,
            });
          } else {
            const titleColor = t.status === 'done' || t.status === 'cancelled' ? DIM :
              t.status === 'in_progress' ? WHITE : LIGHT;
            rows.push(segRow(padSegs([
              { text: '    ', color: WHITE },
              { text: icon + ' ', color: STATUS_COLORS[t.status] || GRAY },
              { text: key, color: t.status === 'done' ? DIM : GRAY },
              { text: '  ', color: WHITE },
              { text: taskTitle, color: titleColor },
              { text: rep(' ', Math.max(1, W - 12 - key.length - taskTitle.length - pri.length)), color: WHITE },
              { text: pri, color: priColor },
            ], W)));
          }
        }

        // Task detail for selected (inline)
        if (tasks[selectedTaskIndex]) {
          const t = tasks[selectedTaskIndex];
          rows.push(blank(W));
          rows.push(segRow(padSegs([
            { text: '  Status: ', color: GRAY },
            { text: `${STATUS_ICONS[t.status] || '○'} ${t.status.replace('_', ' ')}`, color: STATUS_COLORS[t.status] || GRAY },
            { text: '    Priority: ', color: GRAY },
            { text: t.priority, color: PRIORITY_COLORS[t.priority] || GRAY },
            { text: '    Type: ', color: GRAY },
            { text: t.type, color: LIGHT },
          ], W)));
          if (t.description) {
            rows.push(segRow(padSegs([
              { text: '  ' + truncate(t.description, W - 4), color: DIM },
            ], W)));
          }
        }
      }

      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  ', color: GRAY },
        { text: 'J/K', color: LIGHT },
        { text: ' Nav  ', color: DIM },
        { text: '+/A', color: LIGHT },
        { text: ' Add  ', color: DIM },
        { text: '-/R', color: LIGHT },
        { text: ' Remove  ', color: DIM },
        { text: 'ESC', color: LIGHT },
        { text: ' Back', color: DIM },
      ], W)));

      fillTo(rows, H - 2, W);
      rows.push(...pageFooter(W));
      return rows;
    }
  }

  // ── Overview mode ──

  if (!activeSprint && allSprints.length === 0) {
    rows.push(segRow(padSegs([
      { text: '  No active sprint', color: GRAY },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Press ', color: DIM },
      { text: 'C', color: LIGHT },
      { text: ' to create a sprint, or run ', color: DIM },
      { text: 'ltf sprint start', color: LIGHT },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'C Create  B Backlog'));
    return rows;
  }

  // Active sprint details (if exists and is selected)
  if (activeSprint && selectedSprintIndex === 0) {
    const now = Date.now();
    const startDate = new Date(activeSprint.startDate);
    const endDate = new Date(activeSprint.endDate);
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now) / 86400000));
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
    const elapsed = totalDays - daysLeft;

    const startStr = startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

    // Highlight active sprint row
    rows.push({
      segments: padSegs([
        { text: `  ▸ ● ${activeSprint.name}  (active)  ${startStr} – ${endStr}  ${daysLeft}d left`, color: '#000000' },
      ], W),
      bgColor: WHITE,
    });

    if (activeSprint.goal) {
      rows.push(segRow(padSegs([
        { text: '    Goal: ', color: GRAY },
        { text: truncate(activeSprint.goal, W - 14), color: LIGHT },
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

    // Breakdown
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

    // Burndown
    rows.push(section('Burndown', W));
    rows.push(blank(W));

    if (stats.total > 0 && elapsed >= 0) {
      const remaining = stats.total - stats.done;
      const idealPerDay = stats.total / totalDays;

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

    // Metrics
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
  } else if (allSprints[selectedSprintIndex]) {
    // Non-active sprint selected - show summary row
    const sprint = allSprints[selectedSprintIndex];
    const sStart = new Date(sprint.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const sEnd = new Date(sprint.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    const sTasks = selectedSprintTasks(sprint._id);
    const sDone = sTasks.filter(t => t.status === 'done').length;

    rows.push(segRow(padSegs([
      { text: '  Selected Sprint', color: LIGHT },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Name:    ', color: GRAY },
      { text: sprint.name, color: WHITE },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '  Status:  ', color: GRAY },
      { text: sprint.status, color: sprint.status === 'completed' ? LIGHT : GRAY },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '  Period:  ', color: GRAY },
      { text: `${sStart} – ${sEnd}`, color: LIGHT },
    ], W)));
    rows.push(segRow(padSegs([
      { text: '  Tasks:   ', color: GRAY },
      { text: `${sDone}/${sTasks.length} completed`, color: WHITE },
    ], W)));
    if (sprint.goal) {
      rows.push(segRow(padSegs([
        { text: '  Goal:    ', color: GRAY },
        { text: truncate(sprint.goal, W - 14), color: DIM },
      ], W)));
    }
  }

  // Sprint history list
  if (allSprints.length > 1 || (!activeSprint && allSprints.length > 0)) {
    rows.push(blank(W));
    rows.push(blank(W));
    rows.push(section('Sprint List', W));
    rows.push(blank(W));

    for (let i = 0; i < allSprints.length; i++) {
      const s = allSprints[i];
      const isSelected = i === selectedSprintIndex;
      const isActive = activeSprint && s._id === activeSprint._id;
      const start = new Date(s.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      const end = new Date(s.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      const statusIcon = isActive ? '●' : s.status === 'completed' ? '✓' : '○';
      const label = pad(s.name, 22);
      const dateRange = `${start} – ${end}`;

      if (isSelected) {
        rows.push({
          segments: padSegs([
            { text: `  ▸ ${statusIcon}  ${label}${dateRange}`, color: '#000000' },
          ], W),
          bgColor: WHITE,
        });
      } else {
        rows.push(segRow(padSegs([
          { text: '    ', color: WHITE },
          { text: statusIcon, color: isActive ? WHITE : s.status === 'completed' ? LIGHT : DIM },
          { text: '  ', color: WHITE },
          { text: label, color: isActive ? WHITE : GRAY },
          { text: dateRange, color: DIM },
        ], W)));
      }
    }
  }

  fillTo(rows, H - 2, W);
  rows.push(...pageFooter(W, 'J/K Nav  Enter Tasks  C Create  B Backlog  X Close'));
  return rows;
}
