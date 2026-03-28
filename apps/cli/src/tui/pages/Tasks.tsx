/**
 * Tasks Page - Ink native rewrite
 * Full interactive TUI with create wizard, edit, delete,
 * assign, comment, search/filter, and my-tasks view.
 *
 * Modes: list | create | edit | move | delete_confirm | assign | comment | search | detail
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../theme.js';
import { Panel } from '../components/Panel.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { useMutations } from '../hooks/useMutations.js';
import { api } from '../../lib/convex.js';
import type { Task, TaskStatus, TaskType, TaskPriority } from '../types.js';

export interface TasksPageProps {
  width: number;
  height: number;
  timeStr: string;
  isActive: boolean;
}

type TasksMode =
  | 'list'
  | 'create'
  | 'edit'
  | 'move'
  | 'delete_confirm'
  | 'assign'
  | 'comment'
  | 'search'
  | 'detail';

type StatusFilter = TaskStatus | 'all';
type AdvancedFilter = 'none' | 'priority' | 'type';

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

const TYPE_OPTIONS: TaskType[] = ['task', 'bug', 'feature'];
const PRIORITY_OPTIONS: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

const EDIT_FIELDS = ['title', 'description', 'priority', 'type', 'status'] as const;
type EditField = typeof EDIT_FIELDS[number];

const EDIT_FIELD_LABELS: Record<EditField, string> = {
  title: 'Title',
  description: 'Description',
  priority: 'Priority',
  type: 'Type',
  status: 'Status',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'URG',
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

function truncate(t: string, n: number): string {
  return t.length > n ? t.slice(0, n - 1) + '\u2026' : t;
}

// ── TaskRow component ──
function TaskRow({ task, isSelected, projectKey, width }: {
  task: Task;
  isSelected: boolean;
  projectKey: string | undefined;
  width: number;
}) {
  const icon = theme.statusIcon[task.status as keyof typeof theme.statusIcon] || '\u25CB';
  const iconColor = theme.status[task.status as keyof typeof theme.status] || theme.textMuted;
  const key = projectKey ? `${projectKey}-${task.number}` : `#${task.number}`;
  const pri = PRIORITY_LABELS[task.priority] || '';
  const priColor = theme.priority[task.priority as keyof typeof theme.priority] || theme.textDim;
  const maxTitle = Math.max(10, width - 14 - key.length - pri.length);
  const title = truncate(task.title, maxTitle);
  const titleColor = task.status === 'done' || task.status === 'cancelled' ? theme.textDim :
    task.status === 'in_progress' ? theme.text : theme.textSecondary;

  return (
    <Box paddingLeft={1}
      {...(isSelected ? {
        borderStyle: 'single' as const,
        borderColor: theme.accent,
        borderLeft: true,
        borderRight: false,
        borderTop: false,
        borderBottom: false,
      } : {})}
    >
      {isSelected && <Text color={theme.accent}>{'\u25B8'} </Text>}
      <Text color={iconColor}>{icon} </Text>
      <Text color={task.status === 'done' ? theme.textDim : theme.textMuted}>{key}</Text>
      <Text>  </Text>
      <Text color={isSelected ? theme.text : titleColor}>{title}</Text>
      <Box flexGrow={1} />
      <Text color={isSelected ? theme.text : priColor}>{pri}</Text>
    </Box>
  );
}

export default function TasksPage({ width: W, height: H, timeStr, isActive }: TasksPageProps) {
  const config = useConfig();
  const mutations = useMutations();

  const tasksQuery = useConvexQuery(
    api.tasks.queries.getProjectTasks,
    config.projectId ? { projectId: config.projectId as never } : null,
    10000,
  );

  // ── Core list state ──
  const [mode, setMode] = useState<TasksMode>('list');
  const [cursor, setCursor] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [, setFilterIdx] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  // ── Move state ──
  const [moveIndex, setMoveIndex] = useState(0);

  // ── Create wizard state ──
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
  const [createTitle, setCreateTitle] = useState('');
  const [createType, setCreateType] = useState<TaskType>('task');
  const [createTypeIdx, setCreateTypeIdx] = useState(0);
  const [createPriority, setCreatePriority] = useState<TaskPriority>('medium');
  const [createPriorityIdx, setCreatePriorityIdx] = useState(2);
  const [createDescription, setCreateDescription] = useState('');

  // ── Edit state ──
  const [editFieldIdx, setEditFieldIdx] = useState(0);
  const [editingField, setEditingField] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [, setEditPriorityIdx] = useState(2);
  const [editType, setEditType] = useState<TaskType>('task');
  const [, setEditTypeIdx] = useState(0);
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');
  const [, setEditStatusIdx] = useState(0);

  // ── Assign state ──
  const [assignInput, setAssignInput] = useState('');

  // ── Comment state ──
  const [commentInput, setCommentInput] = useState('');
  const [pendingComments, setPendingComments] = useState<Array<{ taskId: string; content: string }>>([]);

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilter>('none');

  // ── Flash message helper ──
  const flash = useCallback((msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(null), 2000);
  }, []);

  // ── Filter and sort tasks ──
  const tasks = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    let filtered = filter === 'all' ? all : all.filter(t => t.status === filter);

    if (showMyTasks) {
      filtered = filtered.filter(t => t.assigneeIds && t.assigneeIds.length > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q));
    }

    return filtered.sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.status);
      const bi = STATUS_ORDER.indexOf(b.status);
      if (ai !== bi) return ai - bi;
      return b._creationTime - a._creationTime;
    });
  }, [tasksQuery.data, filter, showMyTasks, searchQuery]);

  // Task counts by status
  const counts = useMemo(() => {
    const all = (tasksQuery.data as Task[] | null) || [];
    const c: Record<string, number> = { all: all.length };
    for (const t of all) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tasksQuery.data]);

  const selectedTask = tasks[cursor] || null;
  const visibleRows = Math.max(3, H - 12);

  const clampCursor = useCallback(
    (n: number) => Math.max(0, Math.min(tasks.length - 1, n)),
    [tasks.length],
  );

  const enterEditMode = useCallback((task: Task) => {
    setMode('edit');
    setEditFieldIdx(0);
    setEditingField(false);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditPriorityIdx(PRIORITY_OPTIONS.indexOf(task.priority));
    setEditType(task.type);
    setEditTypeIdx(TYPE_OPTIONS.indexOf(task.type) >= 0 ? TYPE_OPTIONS.indexOf(task.type) : 0);
    setEditStatus(task.status);
    setEditStatusIdx(STATUS_ORDER.indexOf(task.status));
  }, []);

  const resetCreateWizard = useCallback(() => {
    setCreateStep(1);
    setCreateTitle('');
    setCreateType('task');
    setCreateTypeIdx(0);
    setCreatePriority('medium');
    setCreatePriorityIdx(2);
    setCreateDescription('');
  }, []);

  // ── Input handling ──
  useInput((input, key) => {
    if (!isActive) return;

    // ── LIST MODE ──
    if (mode === 'list') {
      if (input === 'j' || key.downArrow) {
        setCursor(prev => {
          const next = clampCursor(prev + 1);
          if (next >= scrollOffset + visibleRows) setScrollOffset(next - visibleRows + 1);
          return next;
        });
        return;
      }
      if (input === 'k' || key.upArrow) {
        setCursor(prev => {
          const next = clampCursor(prev - 1);
          if (next < scrollOffset) setScrollOffset(next);
          return next;
        });
        return;
      }
      if (input === 'f') {
        setFilterIdx(prev => {
          const next = (prev + 1) % FILTER_OPTIONS.length;
          setFilter(FILTER_OPTIONS[next].value);
          setCursor(0);
          setScrollOffset(0);
          return next;
        });
        return;
      }
      if (input === 'F') {
        setAdvancedFilter(prev => {
          if (prev === 'none') return 'priority';
          if (prev === 'priority') return 'type';
          return 'none';
        });
        return;
      }
      if (input === 'M') {
        setShowMyTasks(prev => !prev);
        setCursor(0);
        setScrollOffset(0);
        return;
      }
      if (input === 'c' && config.projectId) {
        resetCreateWizard();
        setMode('create');
        return;
      }
      if (input === 'e' && selectedTask) {
        enterEditMode(selectedTask);
        return;
      }
      if (input === 'd' && selectedTask) {
        setMode('delete_confirm');
        return;
      }
      if (input === 'a' && selectedTask) {
        setAssignInput('');
        setMode('assign');
        return;
      }
      if (input === 'm' && selectedTask) {
        setMode('move');
        const idx = MOVE_TARGETS.indexOf(selectedTask.status);
        setMoveIndex(idx >= 0 ? idx : 0);
        return;
      }
      if (input === '/') {
        setSearchQuery('');
        setMode('search');
        return;
      }
      if (key.return && selectedTask) {
        setMode('detail');
        return;
      }
      return;
    }

    // ── CREATE MODE ──
    if (mode === 'create') {
      if (key.escape) { setMode('list'); resetCreateWizard(); return; }

      if (createStep === 1) {
        if (key.return && createTitle.trim()) { setCreateStep(2); }
        else if (key.backspace || key.delete) { setCreateTitle(prev => prev.slice(0, -1)); }
        else if (input && !key.ctrl && input.length === 1) { setCreateTitle(prev => prev + input); }
        return;
      }
      if (createStep === 2) {
        if (input === 'j' || key.downArrow) {
          setCreateTypeIdx(prev => { const next = Math.min(TYPE_OPTIONS.length - 1, prev + 1); setCreateType(TYPE_OPTIONS[next]); return next; });
        } else if (input === 'k' || key.upArrow) {
          setCreateTypeIdx(prev => { const next = Math.max(0, prev - 1); setCreateType(TYPE_OPTIONS[next]); return next; });
        } else if (key.return) { setCreateStep(3); }
        return;
      }
      if (createStep === 3) {
        if (input === 'j' || key.downArrow) {
          setCreatePriorityIdx(prev => { const next = Math.min(PRIORITY_OPTIONS.length - 1, prev + 1); setCreatePriority(PRIORITY_OPTIONS[next]); return next; });
        } else if (input === 'k' || key.upArrow) {
          setCreatePriorityIdx(prev => { const next = Math.max(0, prev - 1); setCreatePriority(PRIORITY_OPTIONS[next]); return next; });
        } else if (key.return) { setCreateStep(4); }
        return;
      }
      if (createStep === 4) {
        if (key.return) {
          mutations.createTask({
            projectId: config.projectId!,
            title: createTitle.trim(),
            type: createType,
            priority: createPriority,
            description: createDescription.trim() || undefined,
          }).then(() => {
            tasksQuery.refetch();
            flash('Task created');
            setMode('list');
            resetCreateWizard();
          });
        } else if (key.backspace || key.delete) { setCreateDescription(prev => prev.slice(0, -1)); }
        else if (input && !key.ctrl && input.length === 1) { setCreateDescription(prev => prev + input); }
        return;
      }
      return;
    }

    // ── EDIT MODE ──
    if (mode === 'edit') {
      if (!editingField) {
        if (key.escape) { setMode('list'); return; }
        if (input === 'j' || key.downArrow) { setEditFieldIdx(prev => Math.min(EDIT_FIELDS.length - 1, prev + 1)); return; }
        if (input === 'k' || key.upArrow) { setEditFieldIdx(prev => Math.max(0, prev - 1)); return; }
        if (key.return) { setEditingField(true); return; }
        if (input === 'w' && selectedTask) {
          mutations.updateTask({
            taskId: selectedTask._id,
            title: editTitle,
            description: editDescription || undefined,
            priority: editPriority,
            status: editStatus,
          }).then(() => {
            tasksQuery.refetch();
            flash('Task updated');
            setMode('list');
          });
          return;
        }
        return;
      }

      const field = EDIT_FIELDS[editFieldIdx];
      if (key.escape) {
        if (selectedTask) {
          setEditTitle(selectedTask.title);
          setEditDescription(selectedTask.description || '');
          setEditPriority(selectedTask.priority);
          setEditType(selectedTask.type);
          setEditStatus(selectedTask.status);
        }
        setEditingField(false);
        return;
      }
      if (field === 'title') {
        if (key.return) { setEditingField(false); }
        else if (key.backspace || key.delete) { setEditTitle(prev => prev.slice(0, -1)); }
        else if (input && !key.ctrl && input.length === 1) { setEditTitle(prev => prev + input); }
        return;
      }
      if (field === 'description') {
        if (key.return) { setEditingField(false); }
        else if (key.backspace || key.delete) { setEditDescription(prev => prev.slice(0, -1)); }
        else if (input && !key.ctrl && input.length === 1) { setEditDescription(prev => prev + input); }
        return;
      }
      if (field === 'priority') {
        if (input === 'j' || key.downArrow) { setEditPriorityIdx(prev => { const next = Math.min(PRIORITY_OPTIONS.length - 1, prev + 1); setEditPriority(PRIORITY_OPTIONS[next]); return next; }); }
        else if (input === 'k' || key.upArrow) { setEditPriorityIdx(prev => { const next = Math.max(0, prev - 1); setEditPriority(PRIORITY_OPTIONS[next]); return next; }); }
        else if (key.return) { setEditingField(false); }
        return;
      }
      if (field === 'type') {
        if (input === 'j' || key.downArrow) { setEditTypeIdx(prev => { const next = Math.min(TYPE_OPTIONS.length - 1, prev + 1); setEditType(TYPE_OPTIONS[next]); return next; }); }
        else if (input === 'k' || key.upArrow) { setEditTypeIdx(prev => { const next = Math.max(0, prev - 1); setEditType(TYPE_OPTIONS[next]); return next; }); }
        else if (key.return) { setEditingField(false); }
        return;
      }
      if (field === 'status') {
        if (input === 'j' || key.downArrow) { setEditStatusIdx(prev => { const next = Math.min(STATUS_ORDER.length - 1, prev + 1); setEditStatus(STATUS_ORDER[next]); return next; }); }
        else if (input === 'k' || key.upArrow) { setEditStatusIdx(prev => { const next = Math.max(0, prev - 1); setEditStatus(STATUS_ORDER[next]); return next; }); }
        else if (key.return) { setEditingField(false); }
        return;
      }
      return;
    }

    // ── MOVE MODE ──
    if (mode === 'move') {
      if (key.escape) { setMode('list'); return; }
      if (input === 'j' || key.downArrow) { setMoveIndex(prev => Math.min(MOVE_TARGETS.length - 1, prev + 1)); return; }
      if (input === 'k' || key.upArrow) { setMoveIndex(prev => Math.max(0, prev - 1)); return; }
      if (key.return && selectedTask) {
        const target = MOVE_TARGETS[moveIndex];
        mutations.moveTask(selectedTask._id, target).then(() => {
          tasksQuery.refetch();
          flash(`Moved to ${target.replace('_', ' ')}`);
          setMode('list');
        });
        return;
      }
      return;
    }

    // ── DELETE CONFIRM ──
    if (mode === 'delete_confirm') {
      if (key.escape || input === 'n') { setMode('list'); return; }
      if (input === 'y' && selectedTask) {
        mutations.updateTask({ taskId: selectedTask._id, status: 'cancelled' }).then(() => {
          tasksQuery.refetch();
          flash('Task cancelled');
          setMode('list');
        });
        return;
      }
      return;
    }

    // ── ASSIGN MODE ──
    if (mode === 'assign') {
      if (key.escape) { setMode('list'); return; }
      if (key.return && selectedTask && assignInput.trim()) {
        flash(`Assign: ${assignInput.trim()} (pending)`);
        setMode('list');
        setAssignInput('');
        return;
      }
      if (key.backspace || key.delete) { setAssignInput(prev => prev.slice(0, -1)); return; }
      if (input && !key.ctrl && input.length === 1) { setAssignInput(prev => prev + input); return; }
      return;
    }

    // ── COMMENT MODE ──
    if (mode === 'comment') {
      if (key.escape) { setMode('detail'); setCommentInput(''); return; }
      if (key.return && selectedTask && commentInput.trim()) {
        setPendingComments(prev => [...prev, { taskId: selectedTask._id, content: commentInput.trim() }]);
        flash('Comment saved');
        setCommentInput('');
        setMode('detail');
        return;
      }
      if (key.backspace || key.delete) { setCommentInput(prev => prev.slice(0, -1)); return; }
      if (input && !key.ctrl && input.length === 1) { setCommentInput(prev => prev + input); return; }
      return;
    }

    // ── SEARCH MODE ──
    if (mode === 'search') {
      if (key.escape) { setSearchQuery(''); setMode('list'); setCursor(0); setScrollOffset(0); return; }
      if (key.return) { setMode('list'); setCursor(0); setScrollOffset(0); return; }
      if (key.backspace || key.delete) { setSearchQuery(prev => prev.slice(0, -1)); return; }
      if (input && !key.ctrl && input.length === 1) { setSearchQuery(prev => prev + input); return; }
      return;
    }

    // ── DETAIL MODE ──
    if (mode === 'detail') {
      if (key.escape || input === 'b') { setMode('list'); return; }
      if (input === 'm' && selectedTask) {
        setMode('move');
        setMoveIndex(MOVE_TARGETS.indexOf(selectedTask.status));
        return;
      }
      if (input === 'C' && selectedTask) { setCommentInput(''); setMode('comment'); return; }
      if (input === 'e' && selectedTask) { enterEditMode(selectedTask); return; }
      return;
    }
  }, { isActive });

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════

  // ── No project context ──
  if (!config.hasContext) {
    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Text color={theme.textMuted}>No project selected</Text>
          <Text> </Text>
          <Text color={theme.textDim}>Run <Text color={theme.textSecondary}>ltf project select</Text> to choose a project</Text>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── Loading ──
  if (tasksQuery.loading && !tasksQuery.data) {
    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Text color={theme.textMuted}>Loading tasks...</Text>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── MOVE OVERLAY ──
  if (mode === 'move' && selectedTask) {
    const taskKey = `${config.projectKey || '#'}-${selectedTask.number}`;
    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          {flashMsg && <Text color={theme.text}>{flashMsg}</Text>}
          <Box>
            <Text color={theme.textMuted}>Move: </Text>
            <Text color={theme.textSecondary}>{taskKey}</Text>
            <Text color={theme.text}>  {truncate(selectedTask.title, 40)}</Text>
          </Box>
          <Text> </Text>
          {MOVE_TARGETS.map((s, i) => {
            const icon = theme.statusIcon[s as keyof typeof theme.statusIcon] || '\u25CB';
            const isCurrent = s === selectedTask.status;
            const isHighlighted = i === moveIndex;
            const label = s.replace('_', ' ');
            return (
              <Box key={s} paddingLeft={2}
                {...(isHighlighted ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
              >
                <Text color={isHighlighted ? theme.text : isCurrent ? theme.text : theme.textMuted}>
                  {icon} {label}{isCurrent ? ' (current)' : ''}
                </Text>
              </Box>
            );
          })}
          <Text> </Text>
          <Box>
            <Text color={theme.textSecondary}>Enter</Text>
            <Text color={theme.textDim}> Confirm   </Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Cancel</Text>
          </Box>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── CREATE WIZARD ──
  if (mode === 'create') {
    const stepLabels = ['Title', 'Type', 'Priority', 'Description'];
    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          {flashMsg && <Text color={theme.text}>{flashMsg}</Text>}
          <Box>
            <Text color={theme.text} bold>New Task</Text>
            <Text color={theme.textMuted}>  (Step {createStep}/4)</Text>
          </Box>
          <Text> </Text>

          {/* Step progress */}
          <Box>
            {stepLabels.map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <Text color={theme.textDim}> {'>'} </Text>}
                <Text color={i + 1 === createStep ? theme.text : i + 1 < createStep ? theme.textSecondary : theme.textDim}>
                  {label}
                </Text>
              </React.Fragment>
            ))}
          </Box>
          <Text> </Text>

          {createStep === 1 && (
            <>
              <Box>
                <Text color={theme.textMuted}>Title: </Text>
                <Text color={theme.text}>{createTitle}{'\u2588'}</Text>
              </Box>
              <Text> </Text>
              <Box>
                <Text color={theme.textDim}>Type text, </Text>
                <Text color={theme.textSecondary}>Enter</Text>
                <Text color={theme.textDim}> to continue</Text>
              </Box>
            </>
          )}

          {createStep === 2 && (
            <>
              <Text color={theme.textMuted}>Type:</Text>
              {TYPE_OPTIONS.map((opt, i) => (
                <Box key={opt} paddingLeft={2}
                  {...(i === createTypeIdx ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
                >
                  <Text color={i === createTypeIdx ? theme.text : theme.textSecondary}>
                    {i === createTypeIdx ? '\u25B8 ' : '  '}{opt}
                  </Text>
                </Box>
              ))}
              <Text> </Text>
              <Box>
                <Text color={theme.textSecondary}>J/K</Text>
                <Text color={theme.textDim}> Cycle  </Text>
                <Text color={theme.textSecondary}>Enter</Text>
                <Text color={theme.textDim}> Confirm</Text>
              </Box>
            </>
          )}

          {createStep === 3 && (
            <>
              <Text color={theme.textMuted}>Priority:</Text>
              {PRIORITY_OPTIONS.map((opt, i) => {
                const priColor = theme.priority[opt as keyof typeof theme.priority] || theme.textMuted;
                return (
                  <Box key={opt} paddingLeft={2}
                    {...(i === createPriorityIdx ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
                  >
                    <Text color={i === createPriorityIdx ? theme.text : priColor}>
                      {i === createPriorityIdx ? '\u25B8 ' : '  '}{opt}
                    </Text>
                  </Box>
                );
              })}
              <Text> </Text>
              <Box>
                <Text color={theme.textSecondary}>J/K</Text>
                <Text color={theme.textDim}> Cycle  </Text>
                <Text color={theme.textSecondary}>Enter</Text>
                <Text color={theme.textDim}> Confirm</Text>
              </Box>
            </>
          )}

          {createStep === 4 && (
            <>
              <Text color={theme.textMuted}>Description (optional):</Text>
              <Text color={theme.text}>  {createDescription}{'\u2588'}</Text>
              <Text> </Text>
              <Box>
                <Text color={theme.textDim}>Summary: </Text>
                <Text color={theme.text}>{truncate(createTitle, 30)}</Text>
                <Text color={theme.textSecondary}>  {createType}</Text>
                <Text color={theme.priority[createPriority as keyof typeof theme.priority] || theme.textMuted}>  {createPriority}</Text>
              </Box>
              <Text> </Text>
              <Box>
                <Text color={theme.textSecondary}>Enter</Text>
                <Text color={theme.textDim}> Create Task</Text>
              </Box>
            </>
          )}

          <Text> </Text>
          <Box>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Cancel</Text>
          </Box>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── EDIT MODE ──
  if (mode === 'edit' && selectedTask) {
    const taskKey = `${config.projectKey || '#'}-${selectedTask.number}`;
    const editValues: Record<EditField, string> = {
      title: editTitle,
      description: editDescription || '(none)',
      priority: editPriority,
      type: editType,
      status: editStatus.replace('_', ' '),
    };

    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          {flashMsg && <Text color={theme.text}>{flashMsg}</Text>}
          <Box>
            <Text color={theme.textMuted}>Edit: </Text>
            <Text color={theme.textSecondary}>{taskKey}</Text>
            <Text color={theme.text}>  {truncate(selectedTask.title, 40)}</Text>
          </Box>
          <Text> </Text>

          {EDIT_FIELDS.map((field, i) => {
            const label = EDIT_FIELD_LABELS[field];
            const value = editValues[field];
            const isSelected = i === editFieldIdx;
            const isEditing = isSelected && editingField;
            const isTextField = field === 'title' || field === 'description';

            return (
              <Box key={field} paddingLeft={1}
                {...(isSelected ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
              >
                <Text color={isSelected ? theme.text : theme.textMuted}>{isSelected && !isEditing ? '\u25B8 ' : '  '}{label.padEnd(14)}</Text>
                {isEditing ? (
                  isTextField ? (
                    <Text color={theme.text}>{field === 'title' ? editTitle : editDescription}{'\u2588'}</Text>
                  ) : (
                    <Text color={theme.text}>{'< '}{value}{' >'}</Text>
                  )
                ) : (
                  <Text color={isSelected ? theme.text : theme.textSecondary}>{truncate(value, W - 24)}</Text>
                )}
              </Box>
            );
          })}

          <Text> </Text>
          {editingField ? (
            <Box>
              {(EDIT_FIELDS[editFieldIdx] === 'title' || EDIT_FIELDS[editFieldIdx] === 'description') ? (
                <>
                  <Text color={theme.textDim}>Type text, </Text>
                  <Text color={theme.textSecondary}>Enter</Text>
                  <Text color={theme.textDim}> Confirm  </Text>
                </>
              ) : (
                <>
                  <Text color={theme.textSecondary}>J/K</Text>
                  <Text color={theme.textDim}> Cycle  </Text>
                  <Text color={theme.textSecondary}>Enter</Text>
                  <Text color={theme.textDim}> Confirm  </Text>
                </>
              )}
              <Text color={theme.textSecondary}>ESC</Text>
              <Text color={theme.textDim}> Discard</Text>
            </Box>
          ) : (
            <Box>
              <Text color={theme.textSecondary}>J/K</Text>
              <Text color={theme.textDim}> Navigate  </Text>
              <Text color={theme.textSecondary}>Enter</Text>
              <Text color={theme.textDim}> Edit Field  </Text>
              <Text color={theme.textSecondary}>W</Text>
              <Text color={theme.textDim}> Save  </Text>
              <Text color={theme.textSecondary}>ESC</Text>
              <Text color={theme.textDim}> Cancel</Text>
            </Box>
          )}
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── DELETE CONFIRM ──
  if (mode === 'delete_confirm' && selectedTask) {
    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Text color={theme.text} bold>Delete Task</Text>
          <Text> </Text>
          <Box>
            <Text color={theme.textMuted}>Cancel task '</Text>
            <Text color={theme.text}>{truncate(selectedTask.title, W - 30)}</Text>
            <Text color={theme.textMuted}>'?</Text>
          </Box>
          <Text color={theme.textDim}>This will set the task status to cancelled.</Text>
          <Text> </Text>
          <Box>
            <Text color={theme.text}>Y</Text>
            <Text color={theme.textDim}> Confirm   </Text>
            <Text color={theme.textSecondary}>N</Text>
            <Text color={theme.textDim}>/ESC Cancel</Text>
          </Box>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── ASSIGN MODE ──
  if (mode === 'assign' && selectedTask) {
    const taskKey = `${config.projectKey || '#'}-${selectedTask.number}`;
    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Box>
            <Text color={theme.textMuted}>Assign: </Text>
            <Text color={theme.textSecondary}>{taskKey}</Text>
            <Text color={theme.text}>  {truncate(selectedTask.title, 40)}</Text>
          </Box>
          <Text> </Text>
          <Box>
            <Text color={theme.textMuted}>Enter email or name: </Text>
            <Text color={theme.text}>{assignInput}{'\u2588'}</Text>
          </Box>
          <Text> </Text>
          <Box>
            <Text color={theme.textSecondary}>Enter</Text>
            <Text color={theme.textDim}> Assign   </Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Cancel</Text>
          </Box>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── COMMENT MODE ──
  if (mode === 'comment' && selectedTask) {
    const taskKey = `${config.projectKey || '#'}-${selectedTask.number}`;
    const taskComments = pendingComments.filter(c => c.taskId === selectedTask._id);
    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Box>
            <Text color={theme.textMuted}>Comment on: </Text>
            <Text color={theme.textSecondary}>{taskKey}</Text>
            <Text color={theme.text}>  {truncate(selectedTask.title, 36)}</Text>
          </Box>
          <Text> </Text>
          <Box>
            <Text color={theme.textMuted}>{'> '}</Text>
            <Text color={theme.text}>{commentInput}{'\u2588'}</Text>
          </Box>
          <Text> </Text>
          {taskComments.length > 0 && (
            <Text color={theme.textDim}>{taskComments.length} pending comment(s)</Text>
          )}
          <Box>
            <Text color={theme.textSecondary}>Enter</Text>
            <Text color={theme.textDim}> Save   </Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Cancel</Text>
          </Box>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── SEARCH MODE ──
  if (mode === 'search') {
    const preview = tasks.slice(0, Math.min(visibleRows - 2, tasks.length));
    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Box>
            <Text color={theme.textMuted}>Search: </Text>
            <Text color={theme.text}>{searchQuery}{'\u2588'}</Text>
            <Text color={theme.textDim}>  ({tasks.length} results)</Text>
          </Box>
          <Text> </Text>
          {preview.map(t => {
            const icon = theme.statusIcon[t.status as keyof typeof theme.statusIcon] || '\u25CB';
            const iconColor = theme.status[t.status as keyof typeof theme.status] || theme.textMuted;
            const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
            return (
              <Box key={t._id} paddingLeft={2}>
                <Text color={iconColor}>{icon} </Text>
                <Text color={theme.textMuted}>{key}</Text>
                <Text>  </Text>
                <Text color={theme.textSecondary}>{truncate(t.title, W - 14 - key.length)}</Text>
              </Box>
            );
          })}
          {tasks.length > preview.length && (
            <Text color={theme.textDim}>    ... and {tasks.length - preview.length} more</Text>
          )}
          <Text> </Text>
          <Box>
            <Text color={theme.textSecondary}>Enter</Text>
            <Text color={theme.textDim}> Apply Filter   </Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Clear & Cancel</Text>
          </Box>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ── DETAIL VIEW ──
  if (mode === 'detail' && selectedTask) {
    const t = selectedTask;
    const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
    const icon = theme.statusIcon[t.status as keyof typeof theme.statusIcon] || '\u25CB';
    const statusLabel = t.status.replace('_', ' ');
    const taskComments = pendingComments.filter(c => c.taskId === t._id);

    return (
      <Box flexDirection="column" width={W} height={H}>
        <PageHeader title="Tasks" timeStr={timeStr} />
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
          <Box>
            <Text color={theme.textSecondary}>{key}</Text>
            <Text>  </Text>
            <Text color={theme.text} bold>{t.title}</Text>
          </Box>
          <Text> </Text>
          <Box>
            <Text color={theme.textMuted}>{'Status    '}</Text>
            <Text color={theme.status[t.status as keyof typeof theme.status] || theme.textMuted}>{icon} {statusLabel}</Text>
          </Box>
          <Box>
            <Text color={theme.textMuted}>{'Priority  '}</Text>
            <Text color={theme.priority[t.priority as keyof typeof theme.priority] || theme.textMuted}>{t.priority}</Text>
          </Box>
          <Box>
            <Text color={theme.textMuted}>{'Type      '}</Text>
            <Text color={theme.textSecondary}>{t.type}</Text>
          </Box>
          {t.assigneeIds && t.assigneeIds.length > 0 && (
            <Box>
              <Text color={theme.textMuted}>{'Assigned  '}</Text>
              <Text color={theme.textSecondary}>{t.assigneeIds.join(', ')}</Text>
            </Box>
          )}
          {t.description && (
            <>
              <Text> </Text>
              <Text color={theme.textMuted}>Description</Text>
              <Text color={theme.textSecondary}>  {truncate(t.description, W - 6)}</Text>
            </>
          )}
          {t.labels && t.labels.length > 0 && (
            <>
              <Text> </Text>
              <Box>
                <Text color={theme.textMuted}>{'Labels    '}</Text>
                <Text color={theme.textDim}>{t.labels.join(', ')}</Text>
              </Box>
            </>
          )}
          {taskComments.length > 0 && (
            <>
              <Text> </Text>
              <Text color={theme.textMuted}>Comments</Text>
              {taskComments.slice(-3).map((comment, i) => (
                <Text key={i} color={theme.textDim}>  {'> '}{truncate(comment.content, W - 10)}</Text>
              ))}
            </>
          )}
          <Text> </Text>
          <Box>
            <Text color={theme.textSecondary}>M</Text>
            <Text color={theme.textDim}> Move  </Text>
            <Text color={theme.textSecondary}>E</Text>
            <Text color={theme.textDim}> Edit  </Text>
            <Text color={theme.textSecondary}>C</Text>
            <Text color={theme.textDim}> Comment  </Text>
            <Text color={theme.textSecondary}>ESC</Text>
            <Text color={theme.textDim}> Back</Text>
          </Box>
        </Box>
        <PageFooter />
      </Box>
    );
  }

  // ═══════════════════════════════════════════
  //  LIST MODE (default)
  // ═══════════════════════════════════════════
  const total = counts['all'] || 0;
  const doneCount = counts['done'] || 0;
  const viewLabel = showMyTasks ? '[MY TASKS]' : '[ALL TASKS]';
  const advFilterLabel = advancedFilter !== 'none' ? ` | Filter: ${advancedFilter}` : '';
  const visible = tasks.slice(scrollOffset, scrollOffset + visibleRows);

  // Detect status section changes
  let lastStatus = '';

  return (
    <Box flexDirection="column" width={W} height={H}>
      <PageHeader title="Tasks" timeStr={timeStr} />
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={0}>
        {/* Flash message */}
        {flashMsg && (
          <Box paddingX={1}>
            <Text color={theme.text}>{flashMsg}</Text>
          </Box>
        )}

        {/* Filters panel */}
        <Panel title="FILTERS" titleColor={theme.textMuted}>
          <Box>
            <Text color={theme.textMuted}>Status: </Text>
            {FILTER_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.value}>
                {i > 0 && <Text color={theme.textDim}>  </Text>}
                <Text color={filter === opt.value ? theme.text : theme.textDim}>
                  {filter === opt.value ? `[${opt.label}]` : opt.label}
                </Text>
                {(counts[opt.value] > 0 || opt.value === 'all') && (
                  <Text color={filter === opt.value ? theme.textMuted : theme.border}>
                    {' '}{opt.value === 'all' ? total : counts[opt.value] || 0}
                  </Text>
                )}
              </React.Fragment>
            ))}
          </Box>
        </Panel>

        {/* Progress bar + view label */}
        {total > 0 && (
          <Box paddingX={1}>
            <ProgressBar value={doneCount} max={total} width={Math.min(30, W - 30)} />
            <Text color={theme.textMuted}>  {doneCount}/{total} done</Text>
            <Text color={theme.textSecondary}>  {viewLabel}</Text>
            <Text color={theme.textDim}>{advFilterLabel}</Text>
          </Box>
        )}

        {/* Active search indicator */}
        {searchQuery && (
          <Box paddingX={1}>
            <Text color={theme.textDim}>Search: "</Text>
            <Text color={theme.text}>{searchQuery}</Text>
            <Text color={theme.textDim}>"</Text>
          </Box>
        )}

        {/* Task list */}
        <Panel title={`TASKS (${tasks.length})`} titleColor={theme.accent} flexGrow={1}>
          {tasks.length === 0 ? (
            <Box>
              <Text color={theme.textDim}>No tasks</Text>
              {filter !== 'all' && <Text color={theme.textDim}> with status "{filter.replace('_', ' ')}"</Text>}
              {searchQuery && <Text color={theme.textDim}> matching "{searchQuery}"</Text>}
            </Box>
          ) : (
            <>
              {visible.map((t, vi) => {
                const idx = scrollOffset + vi;
                const isSelected = idx === cursor;

                // Section header on status change (only in 'all' filter)
                let sectionHeader: React.ReactElement | null = null;
                if (filter === 'all' && t.status !== lastStatus) {
                  lastStatus = t.status;
                  const label = t.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                  sectionHeader = (
                    <Box key={`section-${t.status}`} marginTop={vi > 0 ? 0 : 0}>
                      <Text color={theme.textMuted} bold>{label}</Text>
                      <Text color={theme.border}>  {'─'.repeat(Math.max(0, W - label.length - 8))}</Text>
                    </Box>
                  );
                }

                return (
                  <React.Fragment key={t._id}>
                    {sectionHeader}
                    <TaskRow
                      task={t}
                      isSelected={isSelected}
                      projectKey={config.projectKey}
                      width={W - 6}
                    />
                  </React.Fragment>
                );
              })}

              {/* Scroll indicator */}
              {tasks.length > visibleRows && (
                <Text color={theme.textDim}>
                  {scrollOffset + 1}-{Math.min(scrollOffset + visibleRows, tasks.length)} of {tasks.length}
                </Text>
              )}
            </>
          )}
        </Panel>
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
        <Box paddingX={1}>
          <Text color={theme.textSecondary}>c</Text>
          <Text color={theme.textDim}> Create  </Text>
          <Text color={theme.textSecondary}>e</Text>
          <Text color={theme.textDim}> Edit  </Text>
          <Text color={theme.textSecondary}>m</Text>
          <Text color={theme.textDim}> Move  </Text>
          <Text color={theme.textSecondary}>d</Text>
          <Text color={theme.textDim}> Delete  </Text>
          <Text color={theme.textSecondary}>a</Text>
          <Text color={theme.textDim}> Assign  </Text>
          <Text color={theme.textSecondary}>f</Text>
          <Text color={theme.textDim}> Filter</Text>
        </Box>
      </Box>
    </Box>
  );
}

// ── Shared sub-components ──

function PageHeader({ title, timeStr }: { title: string; timeStr: string }) {
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

function PageFooter() {
  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
      <Box paddingX={1}>
        <Text color={theme.textSecondary}>ESC</Text>
        <Text color={theme.textDim}> Back</Text>
      </Box>
    </Box>
  );
}
