/**
 * Tasks Page - Full interactive TUI with create wizard, edit, delete,
 * assign, comment, search/filter, and my-tasks view.
 *
 * Modes: list | create | edit | move | delete_confirm | assign | comment | search | detail
 */

import { useState, useMemo, useCallback } from 'react';
import { useInput } from 'ink';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { useMutations } from '../hooks/useMutations.js';
import { api } from '../../lib/convex.js';
import type { Row, Task, TaskStatus, TaskType, TaskPriority } from '../types.js';
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

// Edit mode: fields that can be edited
const EDIT_FIELDS = ['title', 'description', 'priority', 'type', 'status'] as const;
type EditField = typeof EDIT_FIELDS[number];

const EDIT_FIELD_LABELS: Record<EditField, string> = {
  title: 'Title',
  description: 'Description',
  priority: 'Priority',
  type: 'Type',
  status: 'Status',
};

export function useTasksPage({ width: W, height: H, timeStr, isActive }: TasksPageProps): Row[] {
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

  // ── Delete state ── (no extra state needed, just mode)

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

    // My tasks filter
    if (showMyTasks) {
      // TODO: Integration agent should provide current userId from config
      // For now, filter by assigneeIds being non-empty (shows assigned tasks)
      filtered = filtered.filter(t => t.assigneeIds && t.assigneeIds.length > 0);
    }

    // Search filter
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
  const visibleRows = H - 10;

  const clampCursor = useCallback(
    (n: number) => Math.max(0, Math.min(tasks.length - 1, n)),
    [tasks.length],
  );

  // ── Helpers for entering edit mode ──
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

    // ── CREATE MODE (multi-step wizard) ──
    if (mode === 'create') {
      if (key.escape) {
        setMode('list');
        resetCreateWizard();
        return;
      }

      if (createStep === 1) {
        // Title text input
        if (key.return && createTitle.trim()) {
          setCreateStep(2);
        } else if (key.backspace || key.delete) {
          setCreateTitle(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && input.length === 1) {
          setCreateTitle(prev => prev + input);
        }
        return;
      }

      if (createStep === 2) {
        // Type selector: j/k to cycle, Enter to confirm
        if (input === 'j' || key.downArrow) {
          setCreateTypeIdx(prev => {
            const next = Math.min(TYPE_OPTIONS.length - 1, prev + 1);
            setCreateType(TYPE_OPTIONS[next]);
            return next;
          });
        } else if (input === 'k' || key.upArrow) {
          setCreateTypeIdx(prev => {
            const next = Math.max(0, prev - 1);
            setCreateType(TYPE_OPTIONS[next]);
            return next;
          });
        } else if (key.return) {
          setCreateStep(3);
        }
        return;
      }

      if (createStep === 3) {
        // Priority selector: j/k to cycle, Enter to confirm
        if (input === 'j' || key.downArrow) {
          setCreatePriorityIdx(prev => {
            const next = Math.min(PRIORITY_OPTIONS.length - 1, prev + 1);
            setCreatePriority(PRIORITY_OPTIONS[next]);
            return next;
          });
        } else if (input === 'k' || key.upArrow) {
          setCreatePriorityIdx(prev => {
            const next = Math.max(0, prev - 1);
            setCreatePriority(PRIORITY_OPTIONS[next]);
            return next;
          });
        } else if (key.return) {
          setCreateStep(4);
        }
        return;
      }

      if (createStep === 4) {
        // Description text input (optional), Enter to submit
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
        } else if (key.backspace || key.delete) {
          setCreateDescription(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && input.length === 1) {
          setCreateDescription(prev => prev + input);
        }
        return;
      }
      return;
    }

    // ── EDIT MODE ──
    if (mode === 'edit') {
      if (!editingField) {
        // Navigating fields
        if (key.escape) {
          setMode('list');
          return;
        }
        if (input === 'j' || key.downArrow) {
          setEditFieldIdx(prev => Math.min(EDIT_FIELDS.length - 1, prev + 1));
          return;
        }
        if (input === 'k' || key.upArrow) {
          setEditFieldIdx(prev => Math.max(0, prev - 1));
          return;
        }
        if (key.return) {
          setEditingField(true);
          return;
        }
        if (input === 'w' && selectedTask) {
          // Save all changes
          mutations.updateTask({
            taskId: selectedTask._id,
            title: editTitle,
            description: editDescription || undefined,
            priority: editPriority,
            status: editStatus,
            // TODO: Integration agent to add type update to UpdateTaskArgs if needed
          }).then(() => {
            tasksQuery.refetch();
            flash('Task updated');
            setMode('list');
          });
          return;
        }
        return;
      }

      // Editing a specific field
      const field = EDIT_FIELDS[editFieldIdx];

      if (key.escape) {
        // Discard current field edit, reload from task
        if (selectedTask) {
          setEditTitle(selectedTask.title);
          setEditDescription(selectedTask.description || '');
          setEditPriority(selectedTask.priority);
          setEditPriorityIdx(PRIORITY_OPTIONS.indexOf(selectedTask.priority));
          setEditType(selectedTask.type);
          setEditTypeIdx(TYPE_OPTIONS.indexOf(selectedTask.type) >= 0 ? TYPE_OPTIONS.indexOf(selectedTask.type) : 0);
          setEditStatus(selectedTask.status);
          setEditStatusIdx(STATUS_ORDER.indexOf(selectedTask.status));
        }
        setEditingField(false);
        return;
      }

      if (field === 'title') {
        if (key.return) {
          setEditingField(false);
        } else if (key.backspace || key.delete) {
          setEditTitle(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && input.length === 1) {
          setEditTitle(prev => prev + input);
        }
        return;
      }

      if (field === 'description') {
        if (key.return) {
          setEditingField(false);
        } else if (key.backspace || key.delete) {
          setEditDescription(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && input.length === 1) {
          setEditDescription(prev => prev + input);
        }
        return;
      }

      if (field === 'priority') {
        if (input === 'j' || key.downArrow) {
          setEditPriorityIdx(prev => {
            const next = Math.min(PRIORITY_OPTIONS.length - 1, prev + 1);
            setEditPriority(PRIORITY_OPTIONS[next]);
            return next;
          });
        } else if (input === 'k' || key.upArrow) {
          setEditPriorityIdx(prev => {
            const next = Math.max(0, prev - 1);
            setEditPriority(PRIORITY_OPTIONS[next]);
            return next;
          });
        } else if (key.return) {
          setEditingField(false);
        }
        return;
      }

      if (field === 'type') {
        if (input === 'j' || key.downArrow) {
          setEditTypeIdx(prev => {
            const next = Math.min(TYPE_OPTIONS.length - 1, prev + 1);
            setEditType(TYPE_OPTIONS[next]);
            return next;
          });
        } else if (input === 'k' || key.upArrow) {
          setEditTypeIdx(prev => {
            const next = Math.max(0, prev - 1);
            setEditType(TYPE_OPTIONS[next]);
            return next;
          });
        } else if (key.return) {
          setEditingField(false);
        }
        return;
      }

      if (field === 'status') {
        if (input === 'j' || key.downArrow) {
          setEditStatusIdx(prev => {
            const next = Math.min(STATUS_ORDER.length - 1, prev + 1);
            setEditStatus(STATUS_ORDER[next]);
            return next;
          });
        } else if (input === 'k' || key.upArrow) {
          setEditStatusIdx(prev => {
            const next = Math.max(0, prev - 1);
            setEditStatus(STATUS_ORDER[next]);
            return next;
          });
        } else if (key.return) {
          setEditingField(false);
        }
        return;
      }
      return;
    }

    // ── MOVE MODE ──
    if (mode === 'move') {
      if (key.escape) { setMode('list'); return; }
      if (input === 'j' || key.downArrow) {
        setMoveIndex(prev => Math.min(MOVE_TARGETS.length - 1, prev + 1));
        return;
      }
      if (input === 'k' || key.upArrow) {
        setMoveIndex(prev => Math.max(0, prev - 1));
        return;
      }
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

    // ── DELETE CONFIRM MODE ──
    if (mode === 'delete_confirm') {
      if (key.escape || input === 'n') {
        setMode('list');
        return;
      }
      if (input === 'y' && selectedTask) {
        mutations.updateTask({
          taskId: selectedTask._id,
          status: 'cancelled',
        }).then(() => {
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
        // TODO: Integration agent to wire up proper assignee mutation
        // For now, just flash a message since updateTask doesn't support assigneeIds yet
        flash(`Assign: ${assignInput.trim()} (pending)`);
        setMode('list');
        setAssignInput('');
        return;
      }
      if (key.backspace || key.delete) {
        setAssignInput(prev => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && input.length === 1) {
        setAssignInput(prev => prev + input);
        return;
      }
      return;
    }

    // ── COMMENT MODE ──
    if (mode === 'comment') {
      if (key.escape) {
        setMode('detail');
        setCommentInput('');
        return;
      }
      if (key.return && selectedTask && commentInput.trim()) {
        // TODO: Integration agent to wire up addComment mutation
        setPendingComments(prev => [...prev, { taskId: selectedTask._id, content: commentInput.trim() }]);
        flash('Comment saved');
        setCommentInput('');
        setMode('detail');
        return;
      }
      if (key.backspace || key.delete) {
        setCommentInput(prev => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && input.length === 1) {
        setCommentInput(prev => prev + input);
        return;
      }
      return;
    }

    // ── SEARCH MODE ──
    if (mode === 'search') {
      if (key.escape) {
        setSearchQuery('');
        setMode('list');
        setCursor(0);
        setScrollOffset(0);
        return;
      }
      if (key.return) {
        // Confirm search, switch to list with active filter
        setMode('list');
        setCursor(0);
        setScrollOffset(0);
        return;
      }
      if (key.backspace || key.delete) {
        setSearchQuery(prev => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && input.length === 1) {
        setSearchQuery(prev => prev + input);
        return;
      }
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
      if (input === 'C' && selectedTask) {
        setCommentInput('');
        setMode('comment');
        return;
      }
      if (input === 'e' && selectedTask) {
        enterEditMode(selectedTask);
        return;
      }
      return;
    }
  }, { isActive });

  // ═══════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════
  const rows: Row[] = [];
  rows.push(...pageHeader('Tasks', timeStr, W));
  rows.push(blank(W));

  // ── No project context ──
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

  // ── Loading ──
  if (tasksQuery.loading && !tasksQuery.data) {
    rows.push(segRow(padSegs([
      { text: '  Loading tasks...', color: GRAY },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ── Flash message ──
  if (flashMsg) {
    rows.push(segRow(padSegs([
      { text: `  ${flashMsg}`, color: WHITE },
    ], W)));
    rows.push(blank(W));
  }

  // ════════════════════════════════════════════
  //  MOVE OVERLAY
  // ════════════════════════════════════════════
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

  // ════════════════════════════════════════════
  //  CREATE WIZARD
  // ════════════════════════════════════════════
  if (mode === 'create') {
    rows.push(segRow(padSegs([
      { text: '  New Task', color: WHITE },
      { text: `  (Step ${createStep}/4)`, color: GRAY },
    ], W)));
    rows.push(blank(W));

    // Progress indicator
    const stepLabels = ['Title', 'Type', 'Priority', 'Description'];
    const stepSegs: Array<{ text: string; color: string }> = [{ text: '  ', color: DIM }];
    for (let i = 0; i < stepLabels.length; i++) {
      const done = i + 1 < createStep;
      const active = i + 1 === createStep;
      if (i > 0) stepSegs.push({ text: ' > ', color: DIM });
      stepSegs.push({
        text: stepLabels[i],
        color: active ? WHITE : done ? LIGHT : DIM,
      });
    }
    rows.push(segRow(padSegs(stepSegs, W)));
    rows.push(blank(W));

    if (createStep === 1) {
      rows.push(segRow(padSegs([
        { text: '  Title: ', color: GRAY },
        { text: createTitle + '\u2588', color: WHITE },
      ], W)));
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  Type text, ', color: DIM },
        { text: 'Enter', color: LIGHT },
        { text: ' to continue', color: DIM },
      ], W)));
    } else if (createStep === 2) {
      rows.push(segRow(padSegs([
        { text: '  Type:', color: GRAY },
      ], W)));
      for (let i = 0; i < TYPE_OPTIONS.length; i++) {
        const opt = TYPE_OPTIONS[i];
        const selected = i === createTypeIdx;
        if (selected) {
          rows.push({
            segments: padSegs([
              { text: `    \u25b8 ${opt}`, color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        } else {
          rows.push(segRow(padSegs([
            { text: `      ${opt}`, color: LIGHT },
          ], W)));
        }
      }
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  ', color: DIM },
        { text: 'J/K', color: LIGHT },
        { text: ' Cycle  ', color: DIM },
        { text: 'Enter', color: LIGHT },
        { text: ' Confirm', color: DIM },
      ], W)));
    } else if (createStep === 3) {
      rows.push(segRow(padSegs([
        { text: '  Priority:', color: GRAY },
      ], W)));
      for (let i = 0; i < PRIORITY_OPTIONS.length; i++) {
        const opt = PRIORITY_OPTIONS[i];
        const selected = i === createPriorityIdx;
        const priColor = PRIORITY_COLORS[opt] || GRAY;
        if (selected) {
          rows.push({
            segments: padSegs([
              { text: `    \u25b8 ${opt}`, color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        } else {
          rows.push(segRow(padSegs([
            { text: `      ${opt}`, color: priColor },
          ], W)));
        }
      }
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  ', color: DIM },
        { text: 'J/K', color: LIGHT },
        { text: ' Cycle  ', color: DIM },
        { text: 'Enter', color: LIGHT },
        { text: ' Confirm', color: DIM },
      ], W)));
    } else if (createStep === 4) {
      rows.push(segRow(padSegs([
        { text: '  Description (optional): ', color: GRAY },
      ], W)));
      rows.push(segRow(padSegs([
        { text: '  ' + createDescription + '\u2588', color: WHITE },
      ], W)));
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  Summary: ', color: DIM },
        { text: truncate(createTitle, 30), color: WHITE },
        { text: '  ' + createType, color: LIGHT },
        { text: '  ' + createPriority, color: PRIORITY_COLORS[createPriority] || GRAY },
      ], W)));
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  ', color: DIM },
        { text: 'Enter', color: LIGHT },
        { text: ' Create Task', color: DIM },
      ], W)));
    }

    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'ESC', color: LIGHT },
      { text: ' Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ════════════════════════════════════════════
  //  EDIT MODE
  // ════════════════════════════════════════════
  if (mode === 'edit' && selectedTask) {
    const taskKey = `${config.projectKey || '#'}-${selectedTask.number}`;
    rows.push(segRow(padSegs([
      { text: '  Edit: ', color: GRAY },
      { text: taskKey, color: LIGHT },
      { text: '  ' + truncate(selectedTask.title, 40), color: WHITE },
    ], W)));
    rows.push(blank(W));

    const editValues: Record<EditField, string> = {
      title: editTitle,
      description: editDescription || '(none)',
      priority: editPriority,
      type: editType,
      status: editStatus.replace('_', ' '),
    };

    for (let i = 0; i < EDIT_FIELDS.length; i++) {
      const field = EDIT_FIELDS[i];
      const label = EDIT_FIELD_LABELS[field];
      const value = editValues[field];
      const isSelected = i === editFieldIdx;
      const isEditing = isSelected && editingField;

      const labelStr = `  ${label.padEnd(14)}`;

      if (isEditing) {
        // Show inline editing with cursor
        if (field === 'title') {
          rows.push({
            segments: padSegs([
              { text: labelStr, color: '#000000' },
              { text: editTitle + '\u2588', color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        } else if (field === 'description') {
          rows.push({
            segments: padSegs([
              { text: labelStr, color: '#000000' },
              { text: editDescription + '\u2588', color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        } else if (field === 'priority') {
          rows.push({
            segments: padSegs([
              { text: labelStr, color: '#000000' },
              { text: `< ${editPriority} >`, color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        } else if (field === 'type') {
          rows.push({
            segments: padSegs([
              { text: labelStr, color: '#000000' },
              { text: `< ${editType} >`, color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        } else if (field === 'status') {
          rows.push({
            segments: padSegs([
              { text: labelStr, color: '#000000' },
              { text: `< ${editStatus.replace('_', ' ')} >`, color: '#000000' },
            ], W),
            bgColor: WHITE,
          });
        }
      } else if (isSelected) {
        rows.push({
          segments: padSegs([
            { text: `  \u25b8 ${label.padEnd(12)}`, color: '#000000' },
            { text: truncate(value, W - 20), color: '#000000' },
          ], W),
          bgColor: WHITE,
        });
      } else {
        rows.push(segRow(padSegs([
          { text: labelStr, color: GRAY },
          { text: truncate(value, W - 20), color: LIGHT },
        ], W)));
      }
    }

    rows.push(blank(W));
    if (editingField) {
      const field = EDIT_FIELDS[editFieldIdx];
      const isTextfield = field === 'title' || field === 'description';
      if (isTextfield) {
        rows.push(segRow(padSegs([
          { text: '  Type text, ', color: DIM },
          { text: 'Enter', color: LIGHT },
          { text: ' Confirm  ', color: DIM },
          { text: 'ESC', color: LIGHT },
          { text: ' Discard', color: DIM },
        ], W)));
      } else {
        rows.push(segRow(padSegs([
          { text: '  ', color: DIM },
          { text: 'J/K', color: LIGHT },
          { text: ' Cycle  ', color: DIM },
          { text: 'Enter', color: LIGHT },
          { text: ' Confirm  ', color: DIM },
          { text: 'ESC', color: LIGHT },
          { text: ' Discard', color: DIM },
        ], W)));
      }
    } else {
      rows.push(segRow(padSegs([
        { text: '  ', color: DIM },
        { text: 'J/K', color: LIGHT },
        { text: ' Navigate  ', color: DIM },
        { text: 'Enter', color: LIGHT },
        { text: ' Edit Field  ', color: DIM },
        { text: 'W', color: LIGHT },
        { text: ' Save  ', color: DIM },
        { text: 'ESC', color: LIGHT },
        { text: ' Cancel', color: DIM },
      ], W)));
    }

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ════════════════════════════════════════════
  //  DELETE CONFIRM
  // ════════════════════════════════════════════
  if (mode === 'delete_confirm' && selectedTask) {
    rows.push(segRow(padSegs([
      { text: '  Delete Task', color: WHITE },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: `  Cancel task '`, color: GRAY },
      { text: truncate(selectedTask.title, W - 30), color: WHITE },
      { text: `'?`, color: GRAY },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  This will set the task status to cancelled.', color: DIM },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'Y', color: WHITE },
      { text: ' Confirm   ', color: DIM },
      { text: 'N', color: LIGHT },
      { text: '/ESC Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ════════════════════════════════════════════
  //  ASSIGN MODE
  // ════════════════════════════════════════════
  if (mode === 'assign' && selectedTask) {
    const taskKey = `${config.projectKey || '#'}-${selectedTask.number}`;
    rows.push(segRow(padSegs([
      { text: '  Assign: ', color: GRAY },
      { text: taskKey, color: LIGHT },
      { text: '  ' + truncate(selectedTask.title, 40), color: WHITE },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  Enter email or name: ', color: GRAY },
      { text: assignInput + '\u2588', color: WHITE },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: DIM },
      { text: 'Enter', color: LIGHT },
      { text: ' Assign   ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ════════════════════════════════════════════
  //  COMMENT MODE
  // ════════════════════════════════════════════
  if (mode === 'comment' && selectedTask) {
    const taskKey = `${config.projectKey || '#'}-${selectedTask.number}`;
    rows.push(segRow(padSegs([
      { text: '  Comment on: ', color: GRAY },
      { text: taskKey, color: LIGHT },
      { text: '  ' + truncate(selectedTask.title, 36), color: WHITE },
    ], W)));
    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  > ', color: GRAY },
      { text: commentInput + '\u2588', color: WHITE },
    ], W)));
    rows.push(blank(W));

    // Show pending comments count
    const taskComments = pendingComments.filter(c => c.taskId === selectedTask._id);
    if (taskComments.length > 0) {
      rows.push(segRow(padSegs([
        { text: `  ${taskComments.length} pending comment(s)`, color: DIM },
      ], W)));
      rows.push(blank(W));
    }

    rows.push(segRow(padSegs([
      { text: '  ', color: DIM },
      { text: 'Enter', color: LIGHT },
      { text: ' Save   ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ════════════════════════════════════════════
  //  SEARCH MODE
  // ════════════════════════════════════════════
  if (mode === 'search') {
    rows.push(segRow(padSegs([
      { text: '  Search: ', color: GRAY },
      { text: searchQuery + '\u2588', color: WHITE },
      { text: `  (${tasks.length} results)`, color: DIM },
    ], W)));
    rows.push(blank(W));

    // Show filtered results preview
    const preview = tasks.slice(0, Math.min(visibleRows - 2, tasks.length));
    for (let i = 0; i < preview.length; i++) {
      const t = preview[i];
      const icon = STATUS_ICONS[t.status] || '○';
      const iconColor = STATUS_COLORS[t.status] || GRAY;
      const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
      const maxTitle = W - 14 - key.length;
      const title = t.title.length > maxTitle ? t.title.slice(0, maxTitle - 1) + '\u2026' : t.title;

      rows.push(segRow(padSegs([
        { text: '    ', color: WHITE },
        { text: icon + ' ', color: iconColor },
        { text: key, color: GRAY },
        { text: '  ', color: WHITE },
        { text: title, color: LIGHT },
      ], W)));
    }

    if (tasks.length > preview.length) {
      rows.push(segRow(padSegs([
        { text: `    ... and ${tasks.length - preview.length} more`, color: DIM },
      ], W)));
    }

    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: DIM },
      { text: 'Enter', color: LIGHT },
      { text: ' Apply Filter   ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Clear & Cancel', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ════════════════════════════════════════════
  //  DETAIL VIEW
  // ════════════════════════════════════════════
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

    if (t.assigneeIds && t.assigneeIds.length > 0) {
      rows.push(segRow(padSegs([
        { text: '  Assigned  ', color: GRAY },
        { text: t.assigneeIds.join(', '), color: LIGHT },
      ], W)));
    }

    if (t.description) {
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  Description', color: GRAY },
      ], W)));
      const desc = t.description;
      const lineW = W - 6;
      for (let i = 0; i < desc.length && rows.length < H - 8; i += lineW) {
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

    // Show pending comments for this task
    const taskComments = pendingComments.filter(c => c.taskId === t._id);
    if (taskComments.length > 0) {
      rows.push(blank(W));
      rows.push(segRow(padSegs([
        { text: '  Comments', color: GRAY },
      ], W)));
      for (const comment of taskComments.slice(-3)) {
        rows.push(segRow(padSegs([
          { text: '    > ' + truncate(comment.content, W - 10), color: DIM },
        ], W)));
      }
    }

    rows.push(blank(W));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: 'M', color: LIGHT },
      { text: ' Move  ', color: DIM },
      { text: 'E', color: LIGHT },
      { text: ' Edit  ', color: DIM },
      { text: 'C', color: LIGHT },
      { text: ' Comment  ', color: DIM },
      { text: 'ESC', color: LIGHT },
      { text: ' Back', color: DIM },
    ], W)));

    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W));
    return rows;
  }

  // ════════════════════════════════════════════
  //  LIST MODE
  // ════════════════════════════════════════════

  // View indicator
  const viewLabel = showMyTasks ? '[MY TASKS]' : '[ALL TASKS]';
  const advFilterLabel = advancedFilter !== 'none' ? ` | Filter: ${advancedFilter}` : '';

  // Progress bar
  const total = counts['all'] || 0;
  const doneCount = counts['done'] || 0;
  if (total > 0) {
    const barW = 30;
    const filled = Math.round((doneCount / total) * barW);
    rows.push(segRow(padSegs([
      { text: '  ', color: WHITE },
      { text: rep('\u2588', filled), color: WHITE },
      { text: rep('\u2591', barW - filled), color: DIM },
      { text: `  ${doneCount}/${total} done`, color: GRAY },
      { text: `  ${viewLabel}`, color: LIGHT },
      { text: advFilterLabel, color: DIM },
    ], W)));
    rows.push(blank(W));
  }

  // Active search indicator
  if (searchQuery) {
    rows.push(segRow(padSegs([
      { text: '  Search: "', color: DIM },
      { text: searchQuery, color: WHITE },
      { text: '"  ', color: DIM },
      { text: '/', color: LIGHT },
      { text: ' Edit  ', color: DIM },
      { text: 'ESC clears on next search', color: DARK },
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
      { text: searchQuery ? ` matching "${searchQuery}"` : '', color: DIM },
    ], W)));
    fillTo(rows, H - 2, W);
    rows.push(...pageFooter(W, 'C Create  F Filter  / Search'));
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
    const title = t.title.length > maxTitle ? t.title.slice(0, maxTitle - 1) + '\u2026' : t.title;

    if (isSelected) {
      rows.push({
        segments: padSegs([
          { text: `  \u25b8 ${icon} ${key}  ${title}`, color: '#000000' },
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
  rows.push(...pageFooter(W, 'J/K Nav  C New  E Edit  D Del  M Move  A Assign  / Search  F Filter'));
  return rows;
}
