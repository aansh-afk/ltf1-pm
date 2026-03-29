/**
 * Sprint Page - Ink native rewrite
 * Active sprint overview, progress, burndown, task list, create, close, backlog
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../theme.js';
import { Panel } from '../components/Panel.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Task, Sprint } from '../types.js';

export interface SprintPageProps {
  width: number;
  height: number;
  timeStr: string;
  isActive?: boolean;
}

type SprintMode = 'overview' | 'tasks' | 'create' | 'close_confirm' | 'add_task' | 'backlog';

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'URG',
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

function truncate(t: string, n: number): string {
  return t.length > n ? t.slice(0, n - 1) + '\u2026' : t;
}

export default function SprintPage({ width: W, height: H, timeStr, isActive }: SprintPageProps) {
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

  // Tasks for the currently selected sprint
  const selectedSprintTasks = useCallback((sprintId: string) => {
    const all = (tasksQuery.data as Task[] | null) || [];
    return all.filter(t => t.sprintId === sprintId);
  }, [tasksQuery.data]);

  // Backlog tasks (no sprint assigned)
  const backlogTasks = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    return all.filter(t => !t.sprintId);
  }, [tasksQuery.data]);

  // Sprint task stats
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

  const clampSprint = useCallback(
    (n: number) => Math.max(0, Math.min(allSprints.length - 1, n)),
    [allSprints.length],
  );

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
    if (statusMessage) setStatusMessage('');

    if (mode === 'overview') {
      if (input === 'j' || key.downArrow) { setSelectedSprintIndex(prev => clampSprint(prev + 1)); }
      if (input === 'k' || key.upArrow) { setSelectedSprintIndex(prev => clampSprint(prev - 1)); }
      if (key.return && allSprints.length > 0) { setSelectedTaskIndex(0); setMode('tasks'); }
      if (input === 'c' && config.projectId) {
        setCreateStep(1); setCreateName(''); setCreateGoal('');
        setCreateStartDate(todayStr); setCreateEndDate(twoWeeksStr);
        setMode('create');
      }
      if (input === 'b') { setSelectedTaskIndex(0); setMode('backlog'); }
      if (input === 'x' && activeSprint && selectedSprintIndex === 0) { setMode('close_confirm'); }
    } else if (mode === 'tasks') {
      const sprint = allSprints[selectedSprintIndex];
      const tasks = sprint ? selectedSprintTasks(sprint._id) : [];
      if (input === 'j' || key.downArrow) { setSelectedTaskIndex(prev => Math.min(tasks.length - 1, prev + 1)); }
      if (input === 'k' || key.upArrow) { setSelectedTaskIndex(prev => Math.max(0, prev - 1)); }
      if (key.escape) { setMode('overview'); }
      if ((input === '+' || input === 'A') && sprint) { setAddTaskSelections(new Set()); setSelectedTaskIndex(0); setMode('add_task'); }
      if ((input === '-' || input === 'R') && tasks[selectedTaskIndex]) {
        setStatusMessage('Task removal requires removeTaskFromSprint mutation');
      }
    } else if (mode === 'create') {
      if (key.escape) { setMode('overview'); }
      else if (createStep === 1) {
        if (key.return && createName.trim()) { setCreateStep(2); }
        else if (key.backspace || key.delete) { setCreateName(prev => prev.slice(0, -1)); }
        else if (input && !key.ctrl && input.length === 1) { setCreateName(prev => prev + input); }
      } else if (createStep === 2) {
        if (key.return) { setCreateStep(3); }
        else if (key.backspace || key.delete) { setCreateGoal(prev => prev.slice(0, -1)); }
        else if (input && !key.ctrl && input.length === 1) { setCreateGoal(prev => prev + input); }
      } else if (createStep === 3) {
        if (key.return && createStartDate.trim()) { setCreateStep(4); }
        else if (key.backspace || key.delete) { setCreateStartDate(prev => prev.slice(0, -1)); }
        else if (input && !key.ctrl && input.length === 1) { setCreateStartDate(prev => prev + input); }
      } else if (createStep === 4) {
        if (key.return && createEndDate.trim()) {
          setStatusMessage('Sprint creation requires createSprint mutation');
          setMode('overview');
        } else if (key.backspace || key.delete) { setCreateEndDate(prev => prev.slice(0, -1)); }
        else if (input && !key.ctrl && input.length === 1) { setCreateEndDate(prev => prev + input); }
      }
    } else if (mode === 'close_confirm') {
      if (input === 'y') { setStatusMessage('Sprint close requires updateSprint mutation'); setMode('overview'); }
      if (input === 'n' || key.escape) { setMode('overview'); }
    } else if (mode === 'add_task') {
      if (key.escape) { setMode('tasks'); }
      if (input === 'j' || key.downArrow) { setSelectedTaskIndex(prev => Math.min(backlogTasks.length - 1, prev + 1)); }
      if (input === 'k' || key.upArrow) { setSelectedTaskIndex(prev => Math.max(0, prev - 1)); }
      if (input === ' ' && backlogTasks[selectedTaskIndex]) {
        const taskId = backlogTasks[selectedTaskIndex]._id;
        setAddTaskSelections(prev => {
          const next = new Set(prev);
          if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
          return next;
        });
      }
      if (key.return && addTaskSelections.size > 0) {
        setStatusMessage(`Adding ${addTaskSelections.size} tasks requires addTasksToSprint mutation`);
        setMode('tasks');
      }
    } else if (mode === 'backlog') {
      if (key.escape) { setMode('overview'); }
      if (input === 'j' || key.downArrow) { setSelectedTaskIndex(prev => Math.min(backlogTasks.length - 1, prev + 1)); }
      if (input === 'k' || key.upArrow) { setSelectedTaskIndex(prev => Math.max(0, prev - 1)); }
      if (input === '+' && backlogTasks[selectedTaskIndex] && activeSprint) {
        setStatusMessage('Adding to sprint requires addTasksToSprint mutation');
      }
    }
  }, { isActive: isActive ?? false });

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════

  const title = activeSprint ? activeSprint.name : 'Sprint';

  // ── No project context ──
  if (!config.hasContext) {
    return (
      <Box flexDirection="column" width={W} height={H}>
        <SprintHeader title={title} timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Text color={theme.textMuted}>No project selected</Text>
          <Text> </Text>
          <Text color={theme.textDim}>Run <Text color={theme.textSecondary}>ltf project select</Text> to choose a project</Text>
        </Box>
        <SprintFooter hint="ESC Back" />
      </Box>
    );
  }

  // ── Loading ──
  if (sprintQuery.loading && !sprintQuery.data) {
    return (
      <Box flexDirection="column" width={W} height={H}>
        <SprintHeader title={title} timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Text color={theme.textMuted}>Loading sprint data...</Text>
        </Box>
        <SprintFooter hint="ESC Back" />
      </Box>
    );
  }

  // ── Create mode ──
  if (mode === 'create') {
    return (
      <Box flexDirection="column" width={W} height={H}>
        <SprintHeader title={title} timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          {statusMessage && <Text color={theme.textSecondary}>{statusMessage}</Text>}
          <Box>
            <Text color={theme.textSecondary}>New Sprint</Text>
            <Text color={theme.textDim}>  (Step {createStep} of 4)</Text>
          </Box>
          <Text> </Text>

          {/* Step 1: Name */}
          <Box>
            <Text color={createStep === 1 ? theme.text : theme.textDim}>{createStep === 1 ? '\u25B8 ' : '  '}</Text>
            <Text color={theme.textMuted}>Name: </Text>
            <Text color={createStep === 1 ? theme.text : theme.textSecondary}>{createName}{createStep === 1 ? '\u2588' : ''}</Text>
          </Box>

          {/* Step 2: Goal */}
          <Box>
            <Text color={createStep === 2 ? theme.text : theme.textDim}>{createStep === 2 ? '\u25B8 ' : '  '}</Text>
            <Text color={theme.textMuted}>Goal: </Text>
            <Text color={createStep === 2 ? theme.text : theme.textDim}>{(createGoal || (createStep === 2 ? '' : '(optional)'))}{createStep === 2 ? '\u2588' : ''}</Text>
          </Box>

          {/* Step 3: Start */}
          <Box>
            <Text color={createStep === 3 ? theme.text : theme.textDim}>{createStep === 3 ? '\u25B8 ' : '  '}</Text>
            <Text color={theme.textMuted}>Start: </Text>
            <Text color={createStep === 3 ? theme.text : theme.textSecondary}>{createStartDate}{createStep === 3 ? '\u2588' : ''}</Text>
          </Box>

          {/* Step 4: End */}
          <Box>
            <Text color={createStep === 4 ? theme.text : theme.textDim}>{createStep === 4 ? '\u25B8 ' : '  '}</Text>
            <Text color={theme.textMuted}>End:   </Text>
            <Text color={createStep === 4 ? theme.text : theme.textSecondary}>{createEndDate}{createStep === 4 ? '\u2588' : ''}</Text>
          </Box>

          <Text> </Text>
          <Box>
            <Text color={theme.textSecondary}>Enter</Text>
            <Text color={theme.textDim}>{createStep === 4 ? ' Create   ' : ' Next   '}</Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Cancel</Text>
          </Box>
        </Box>
        <SprintFooter hint="" />
      </Box>
    );
  }

  // ── Close confirm ──
  if (mode === 'close_confirm' && activeSprint) {
    return (
      <Box flexDirection="column" width={W} height={H}>
        <SprintHeader title={title} timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Text color={theme.textSecondary}>Close Sprint</Text>
          <Text> </Text>
          <Box>
            <Text color={theme.text}>Close sprint '</Text>
            <Text color={theme.text} bold>{truncate(activeSprint.name, W - 20)}</Text>
            <Text color={theme.text}>'?</Text>
          </Box>
          <Text color={theme.textMuted}>Incomplete tasks will move to backlog.</Text>
          <Text> </Text>
          <Box>
            <Text color={theme.textSecondary}>Y</Text>
            <Text color={theme.textDim}> Confirm   </Text>
            <Text color={theme.textSecondary}>N</Text>
            <Text color={theme.textDim}>/ESC Cancel</Text>
          </Box>
        </Box>
        <SprintFooter hint="" />
      </Box>
    );
  }

  // ── Add task mode ──
  if (mode === 'add_task') {
    const visibleCount = Math.min(backlogTasks.length, H - 10);
    return (
      <Box flexDirection="column" width={W} height={H}>
        <SprintHeader title={title} timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          {statusMessage && <Text color={theme.textSecondary}>{statusMessage}</Text>}
          <Box>
            <Text color={theme.textSecondary}>Add Tasks to Sprint</Text>
            {addTaskSelections.size > 0 && <Text color={theme.textMuted}>  ({addTaskSelections.size} selected)</Text>}
          </Box>
          <Text> </Text>

          {backlogTasks.length === 0 ? (
            <Text color={theme.textDim}>No unassigned tasks available</Text>
          ) : (
            backlogTasks.slice(0, visibleCount).map((t, i) => {
              const isSelected = i === selectedTaskIndex;
              const isChecked = addTaskSelections.has(t._id);
              const icon = theme.statusIcon[t.status as keyof typeof theme.statusIcon] || '\u25CB';
              const pri = PRIORITY_LABELS[t.priority] || '';

              return (
                <Box key={t._id}
                  paddingLeft={1}
                  {...(isSelected ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
                >
                  <Text color={isChecked ? theme.text : theme.textDim}>{isChecked ? '[x]' : '[ ]'} </Text>
                  <Text color={theme.status[t.status as keyof typeof theme.status] || theme.textMuted}>{icon} </Text>
                  <Text color={isSelected ? theme.text : theme.textSecondary}>{truncate(t.title, W - 20 - pri.length)}</Text>
                  <Box flexGrow={1} />
                  <Text color={theme.priority[t.priority as keyof typeof theme.priority] || theme.textDim}>{pri}</Text>
                </Box>
              );
            })
          )}

          <Text> </Text>
          <Box>
            <Text color={theme.textSecondary}>Space</Text>
            <Text color={theme.textDim}> Toggle  </Text>
            <Text color={theme.textSecondary}>Enter</Text>
            <Text color={theme.textDim}> Confirm  </Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Cancel</Text>
          </Box>
        </Box>
        <SprintFooter hint="" />
      </Box>
    );
  }

  // ── Backlog mode ──
  if (mode === 'backlog') {
    const visibleCount = Math.min(backlogTasks.length, H - 10);
    return (
      <Box flexDirection="column" width={W} height={H}>
        <SprintHeader title={title} timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
          {statusMessage && <Box paddingX={1}><Text color={theme.textSecondary}>{statusMessage}</Text></Box>}
          <Panel title="BACKLOG" titleColor={theme.accent}>
            {backlogTasks.length === 0 ? (
              <Text color={theme.textDim}>No tasks in backlog</Text>
            ) : (
              <>
                <Text color={theme.textMuted}>{backlogTasks.length} unassigned tasks</Text>
                <Text> </Text>
                {backlogTasks.slice(0, visibleCount).map((t, i) => {
                  const isSelected = i === selectedTaskIndex;
                  const icon = theme.statusIcon[t.status as keyof typeof theme.statusIcon] || '\u25CB';
                  const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
                  const pri = PRIORITY_LABELS[t.priority] || '';

                  return (
                    <Box key={t._id}
                      paddingLeft={1}
                      {...(isSelected ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
                    >
                      {isSelected && <Text color={theme.accent}>{'\u25B8'} </Text>}
                      <Text color={theme.status[t.status as keyof typeof theme.status] || theme.textMuted}>{icon} </Text>
                      <Text color={theme.textMuted}>{key}</Text>
                      <Text>  </Text>
                      <Text color={isSelected ? theme.text : theme.textSecondary}>{truncate(t.title, W - 16 - key.length - pri.length)}</Text>
                      <Box flexGrow={1} />
                      <Text color={theme.priority[t.priority as keyof typeof theme.priority] || theme.textDim}>{pri}</Text>
                    </Box>
                  );
                })}
              </>
            )}
          </Panel>
          <Text> </Text>
          <Box paddingX={1}>
            <Text color={theme.textSecondary}>J/K</Text>
            <Text color={theme.textDim}> Nav  </Text>
            <Text color={theme.textSecondary}>+</Text>
            <Text color={theme.textDim}> Add to Sprint  </Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Back</Text>
          </Box>
        </Box>
        <SprintFooter hint="" />
      </Box>
    );
  }

  // ── Tasks mode (sprint task list) ──
  if (mode === 'tasks') {
    const sprint = allSprints[selectedSprintIndex];
    if (!sprint) { setMode('overview'); }
    const tasks = sprint ? selectedSprintTasks(sprint._id) : [];
    const isActiveSprint = activeSprint && sprint && sprint._id === activeSprint._id;

    return (
      <Box flexDirection="column" width={W} height={H}>
        <SprintHeader title={title} timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
          {statusMessage && <Box paddingX={1}><Text color={theme.textSecondary}>{statusMessage}</Text></Box>}

          <Panel title={sprint ? `${sprint.name}${isActiveSprint ? ' (active)' : ` (${sprint.status})`}` : 'Sprint Tasks'} titleColor={theme.accent} flexGrow={1}>
            {tasks.length === 0 ? (
              <Text color={theme.textDim}>No tasks in this sprint</Text>
            ) : (
              <>
                {tasks.slice(0, H - 12).map((t, i) => {
                  const isSelected = i === selectedTaskIndex;
                  const icon = theme.statusIcon[t.status as keyof typeof theme.statusIcon] || '\u25CB';
                  const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
                  const pri = PRIORITY_LABELS[t.priority] || '';
                  const priColor = theme.priority[t.priority as keyof typeof theme.priority] || theme.textDim;
                  const titleColor = t.status === 'done' || t.status === 'cancelled' ? theme.textDim :
                    t.status === 'in_progress' ? theme.text : theme.textSecondary;

                  return (
                    <Box key={t._id}
                      paddingLeft={1}
                      {...(isSelected ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
                    >
                      {isSelected && <Text color={theme.accent}>{'\u25B8'} </Text>}
                      <Text color={theme.status[t.status as keyof typeof theme.status] || theme.textMuted}>{icon} </Text>
                      <Text color={t.status === 'done' ? theme.textDim : theme.textMuted}>{key}</Text>
                      <Text>  </Text>
                      <Text color={isSelected ? theme.text : titleColor}>{truncate(t.title, W - 16 - key.length - pri.length)}</Text>
                      <Box flexGrow={1} />
                      <Text color={priColor}>{pri}</Text>
                    </Box>
                  );
                })}

                {/* Selected task detail */}
                {tasks[selectedTaskIndex] && (
                  <>
                    <Text> </Text>
                    <Box>
                      <Text color={theme.textMuted}>Status: </Text>
                      <Text color={theme.status[tasks[selectedTaskIndex].status as keyof typeof theme.status] || theme.textMuted}>
                        {theme.statusIcon[tasks[selectedTaskIndex].status as keyof typeof theme.statusIcon] || '\u25CB'} {tasks[selectedTaskIndex].status.replace('_', ' ')}
                      </Text>
                      <Text color={theme.textMuted}>    Priority: </Text>
                      <Text color={theme.priority[tasks[selectedTaskIndex].priority as keyof typeof theme.priority] || theme.textMuted}>
                        {tasks[selectedTaskIndex].priority}
                      </Text>
                      <Text color={theme.textMuted}>    Type: </Text>
                      <Text color={theme.textSecondary}>{tasks[selectedTaskIndex].type}</Text>
                    </Box>
                    {tasks[selectedTaskIndex].description && (
                      <Text color={theme.textDim}>  {truncate(tasks[selectedTaskIndex].description!, W - 4)}</Text>
                    )}
                  </>
                )}
              </>
            )}
          </Panel>

          <Box paddingX={1}>
            <Text color={theme.textSecondary}>J/K</Text>
            <Text color={theme.textDim}> Nav  </Text>
            <Text color={theme.textSecondary}>+/A</Text>
            <Text color={theme.textDim}> Add  </Text>
            <Text color={theme.textSecondary}>-/R</Text>
            <Text color={theme.textDim}> Remove  </Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Back</Text>
          </Box>
        </Box>
        <SprintFooter hint="" />
      </Box>
    );
  }

  // ═══════════════════════════════════════════
  //  OVERVIEW MODE (default)
  // ═══════════════════════════════════════════

  // No sprint exists
  if (!activeSprint && allSprints.length === 0) {
    return (
      <Box flexDirection="column" width={W} height={H}>
        <SprintHeader title={title} timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          {statusMessage && <Text color={theme.textSecondary}>{statusMessage}</Text>}
          <Text color={theme.textMuted}>No active sprint</Text>
          <Text> </Text>
          <Box>
            <Text color={theme.textDim}>Press </Text>
            <Text color={theme.textSecondary}>C</Text>
            <Text color={theme.textDim}> to create a sprint, or run </Text>
            <Text color={theme.textSecondary}>ltf sprint start</Text>
          </Box>
        </Box>
        <SprintFooter hint="C Create  B Backlog" />
      </Box>
    );
  }

  // Active sprint overview
  const isActiveSelected = activeSprint && selectedSprintIndex === 0;

  return (
    <Box flexDirection="column" width={W} height={H}>
      <SprintHeader title={title} timeStr={timeStr} />
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
        {statusMessage && <Box paddingX={1}><Text color={theme.textSecondary}>{statusMessage}</Text></Box>}

        {/* Current Sprint Panel */}
        {isActiveSelected && activeSprint && (
          <Panel title="CURRENT SPRINT" titleColor={theme.accent}>
            <Box justifyContent="space-between">
              <Text color={theme.text} bold>{activeSprint.name}</Text>
              <Text color={theme.textMuted}>(active)</Text>
            </Box>
            {(() => {
              const now = Date.now();
              const startDate = new Date(activeSprint.startDate);
              const endDate = new Date(activeSprint.endDate);
              const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now) / 86400000));
              const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
              const elapsed = totalDays - daysLeft;
              const startStr = startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
              const endStr = endDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
              return (
                <>
                  <Text color={theme.textMuted}>{startStr} {'\u2192'} {endStr} ({daysLeft} days left)</Text>
                  {activeSprint.goal && <Text color={theme.textDim}>Goal: {truncate(activeSprint.goal, W - 12)}</Text>}
                  <Text> </Text>
                  <Box>
                    <Text color={theme.textMuted}>Progress: </Text>
                    <ProgressBar value={stats.done} max={stats.total} width={Math.max(10, W - 40)} color={theme.green} />
                    <Text color={theme.textMuted}>  ({stats.done}/{stats.total} done)</Text>
                  </Box>
                  <Text> </Text>

                  {/* Breakdown */}
                  {stats.total > 0 && (
                    <>
                      <Box>
                        <Text color={theme.textMuted}>{'  Done         '}</Text>
                        <ProgressBar value={stats.done} max={stats.total} width={25} color={theme.green} showPercent={false} />
                        <Text color={theme.text}>  {stats.done}</Text>
                      </Box>
                      <Box>
                        <Text color={theme.textMuted}>{'  In Progress  '}</Text>
                        <ProgressBar value={stats.inProgress} max={stats.total} width={25} color={theme.accent} showPercent={false} />
                        <Text color={theme.textSecondary}>  {stats.inProgress}</Text>
                      </Box>
                      <Box>
                        <Text color={theme.textMuted}>{'  To Do        '}</Text>
                        <ProgressBar value={stats.todo} max={stats.total} width={25} color={theme.textMuted} showPercent={false} />
                        <Text color={theme.textMuted}>  {stats.todo}</Text>
                      </Box>
                    </>
                  )}
                  <Text> </Text>

                  {/* Metrics */}
                  <Box>
                    <Text color={theme.textMuted}>{'  Velocity     '}</Text>
                    <Text color={theme.text}>{stats.total} pts/sprint</Text>
                  </Box>
                  <Box>
                    <Text color={theme.textMuted}>{'  Burn rate    '}</Text>
                    <Text color={theme.text}>{elapsed > 0 ? (stats.done / elapsed).toFixed(1) : '0.0'} tasks/day</Text>
                  </Box>
                  <Box>
                    <Text color={theme.textMuted}>{'  Blockers     '}</Text>
                    <Text color={theme.text}>{sprintTasks.filter(t => t.status === 'backlog').length}</Text>
                  </Box>
                </>
              );
            })()}
          </Panel>
        )}

        {/* Non-active sprint selected */}
        {!isActiveSelected && allSprints[selectedSprintIndex] && (() => {
          const sprint = allSprints[selectedSprintIndex];
          const sStart = new Date(sprint.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
          const sEnd = new Date(sprint.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
          const sTasks = selectedSprintTasks(sprint._id);
          const sDone = sTasks.filter(t => t.status === 'done').length;
          return (
            <Panel title="SELECTED SPRINT" titleColor={theme.textMuted}>
              <Box>
                <Text color={theme.textMuted}>{'Name:    '}</Text>
                <Text color={theme.text}>{sprint.name}</Text>
              </Box>
              <Box>
                <Text color={theme.textMuted}>{'Status:  '}</Text>
                <Text color={sprint.status === 'completed' ? theme.textSecondary : theme.textMuted}>{sprint.status}</Text>
              </Box>
              <Box>
                <Text color={theme.textMuted}>{'Period:  '}</Text>
                <Text color={theme.textSecondary}>{sStart} {'\u2013'} {sEnd}</Text>
              </Box>
              <Box>
                <Text color={theme.textMuted}>{'Tasks:   '}</Text>
                <Text color={theme.text}>{sDone}/{sTasks.length} completed</Text>
              </Box>
              {sprint.goal && (
                <Box>
                  <Text color={theme.textMuted}>{'Goal:    '}</Text>
                  <Text color={theme.textDim}>{truncate(sprint.goal, W - 14)}</Text>
                </Box>
              )}
            </Panel>
          );
        })()}

        {/* Sprint List */}
        {(allSprints.length > 1 || (!activeSprint && allSprints.length > 0)) && (
          <Panel title="SPRINT LIST" titleColor={theme.textMuted}>
            {allSprints.map((s, i) => {
              const isSelected = i === selectedSprintIndex;
              const isActive = activeSprint && s._id === activeSprint._id;
              const start = new Date(s.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
              const end = new Date(s.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
              const statusIcon = isActive ? '\u25CF' : s.status === 'completed' ? '\u2713' : '\u25CB';

              return (
                <Box key={s._id}
                  paddingLeft={1}
                  {...(isSelected ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
                >
                  {isSelected && <Text color={theme.accent}>{'\u25B8'} </Text>}
                  <Text color={isActive ? theme.text : s.status === 'completed' ? theme.textSecondary : theme.textDim}>
                    {statusIcon}
                  </Text>
                  <Text>  </Text>
                  <Text color={isActive ? theme.text : theme.textMuted}>{s.name.padEnd(22)}</Text>
                  <Text color={theme.textDim}>{start} {'\u2013'} {end}</Text>
                </Box>
              );
            })}
          </Panel>
        )}
      </Box>

      <SprintFooter hint="J/K Nav  Enter Tasks  C Create  B Backlog  X Close" />
    </Box>
  );
}

// ── Shared sub-components ──

function SprintHeader({ title, timeStr }: { title: string; timeStr: string }) {
  return (
    <>
      <Box paddingX={1}>
        <Text color={theme.text} bold>{title}</Text>
        <Box flexGrow={1} />
        <Text color={theme.textMuted}>{timeStr}</Text>
      </Box>
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />
    </>
  );
}

function SprintFooter({ hint }: { hint: string }) {
  if (!hint) {
    return (
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
        <Box paddingX={1}>
          <Text color={theme.textSecondary}>ESC</Text>
          <Text color={theme.textDim}> Back</Text>
        </Box>
      </Box>
    );
  }

  // Parse hint string into styled segments
  const parts = hint.split('  ');
  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
      <Box paddingX={1}>
        {parts.map((part, i) => {
          const spaceIdx = part.indexOf(' ');
          if (spaceIdx === -1) {
            return <Text key={i} color={theme.textSecondary}>{part}</Text>;
          }
          const keyPart = part.slice(0, spaceIdx);
          const labelPart = part.slice(spaceIdx);
          return (
            <React.Fragment key={i}>
              {i > 0 && <Text>  </Text>}
              <Text color={theme.textSecondary}>{keyPart}</Text>
              <Text color={theme.textDim}>{labelPart}</Text>
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
}
