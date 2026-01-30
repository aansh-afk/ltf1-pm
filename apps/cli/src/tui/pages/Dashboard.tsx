/**
 * Dashboard Page - Real workspace/project/task hierarchy
 * Shows: Workspace > Project context, workspace stats, my tasks, sprint summary
 */

import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Row, Task, ConnectionStatus } from '../types.js';
import { BG, WHITE, LIGHT, GRAY, DIM, DARK, STATUS_ICONS } from '../theme.js';
import {
  row, segRow, blank, padSegs, fillTo, rep, pad, center, section,
} from '../helpers.js';

// World map ASCII art for auth screen (content lines only, ~80 chars wide)
const WORLD_MAP: string[] = [
  `                  ;lx0OooodxKXNNOl,   ..      .       '.`,
  `            .,;',,cdKl.ckKNNNNNNN0   ,;.       ..     ,ck:.     .`,
  `    .      ,ldol.c;xOo'   dNNNNNX:     ..    .c  c,lONNNNX0xxk,'lo:..`,
  `  .ONNNXO0XK0KKKxOKdc'OK' .XNKd,..'  :K0NKl:okkK0NXNNNNNNNNNNNNNNNNNXN0:'`,
  `   oX0xx0NNNNNNNNX' .:xl'  'o      .kN:dXNNNNNNNNNNNNNNNNNNNNNNNKkkddxdc.`,
  `    .    .xNNNNNNNKx;oNNNl      .cc.oOdXNNNNNNNNNNNNNNNNNNNNNNNK:  .o`,
  `           cNNNNNNXk0NNKc..       dNXKNNXxkNKxNNNNNNNNNNNNNNNNNK;.`,
  `           .XNNNNNNXNX:         .0x,,''lldxKN:NNNNNNNNNNNNNXck..;`,
  `             oKNN0dok.          :XNNNkoxolKNNkXNNNNNNNNNNNNN' .`,
  `               cXc.....        xNNNNNNNNNNd0NKx..:NNO:kNNxc..`,
  `                 .':'.;;'      oNNNNNNNNNNNOk,    ;l   ;oc  ..`,
  `                     dNNNNO,    .'..oNNNNNN0c          ,o oo.`,
  `                     ONNNNNNNK;      kNNNNN.            .....  .o;.`,
  `                      cXNNNNNO       kNNNNd.d.              ,kK0dd`,
  `                       KNNN0'        .XNNx  ,             .NNNNNNNK.`,
  `                      .NNNl           ':,                  ;;..;OXd    .`,
  `                      cNc                                        .    '.`,
  `                      xk`,
  `                       .`,
];
const MAP_WIDTH = 80;

export type LoginState = 'idle' | 'authenticating' | 'success' | 'error';

export interface DashboardPageProps {
  width: number;
  height: number;
  timeStr: string;
  selectedIndex: number;
  loginState?: LoginState;
  loginError?: string;
}

export function useDashboardPage({ width: W, height: H, timeStr, selectedIndex, loginState = 'idle', loginError = '' }: DashboardPageProps): {
  rows: Row[];
  connectionStatus: ConnectionStatus;
} {
  const auth = useAuth();
  const config = useConfig();

  // Fetch workspace stats (totalProjects, activeProjects, totalTasks, completedTasks, etc.)
  const workspaceStatsQuery = useConvexQuery(
    api.workspaces.queries.getWorkspaceStats,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    30000,
  );

  // Fetch projects in workspace
  const projectsQuery = useConvexQuery(
    api.projects.queries.getWorkspaceProjects,
    config.workspaceId ? { workspaceId: config.workspaceId as never } : null,
    30000,
  );

  // Fetch tasks for the active project (getProjectTasks - correct backend name)
  const tasksQuery = useConvexQuery(
    api.tasks.queries.getProjectTasks,
    config.projectId ? { projectId: config.projectId as never } : null,
    10000,
  );

  // Fetch active sprint (getCurrentSprint - correct backend name)
  const sprintQuery = useConvexQuery(
    api.sprints.queries.getCurrentSprint,
    config.projectId ? { projectId: config.projectId as never } : null,
    30000,
  );

  // Workspace stats from backend
  const wsStats = workspaceStatsQuery.data as {
    totalProjects?: number;
    activeProjects?: number;
    totalTasks?: number;
    completedTasks?: number;
    inProgressTasks?: number;
    totalMembers?: number;
  } | null;

  // Projects list
  const projects = (projectsQuery.data as Array<{ _id: string; name: string; key: string; status: string }> | null) || [];

  // Task stats from project tasks
  const taskStats = useMemo(() => {
    const tasks = (tasksQuery.data as Task[] | null) || [];
    const total = tasks.length;
    const byStatus: Record<string, number> = {};
    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }
    return {
      total,
      backlog: byStatus['backlog'] || 0,
      todo: byStatus['todo'] || 0,
      inProgress: (byStatus['in_progress'] || 0) + (byStatus['in_review'] || 0),
      done: byStatus['done'] || 0,
    };
  }, [tasksQuery.data]);

  // My tasks (assigned to current user, active only)
  const myTasks = useMemo(() => {
    const tasks = (tasksQuery.data as Task[] | null) || [];
    const active = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    if (!auth.userId) return active.slice(0, 5);
    const mine = active.filter(t => t.assigneeIds?.includes(auth.userId!));
    return (mine.length > 0 ? mine : active).slice(0, 5);
  }, [tasksQuery.data, auth.userId]);

  // Connection status
  const connectionStatus: ConnectionStatus = !auth.isAuthenticated
    ? 'disconnected'
    : workspaceStatsQuery.connectionStatus !== 'connecting' ? workspaceStatsQuery.connectionStatus
    : tasksQuery.connectionStatus;

  const rows: Row[] = [];

  // ══════════════════════════════════════════════════════════════
  // UNAUTHENTICATED: Full-screen welcome / login prompt
  // ══════════════════════════════════════════════════════════════
  if (!auth.isAuthenticated) {
    const showMap = H >= 38 && W >= 76;
    const contentH = showMap ? 36 : 18;
    const top = Math.max(showMap ? 0 : 2, Math.floor((H - contentH) / 2));
    for (let i = 0; i < top; i++) rows.push(blank(W));

    // World map backdrop (shown when terminal is large enough)
    if (showMap) {
      const mapPad = Math.max(0, Math.floor((W - MAP_WIDTH) / 2));
      for (const mapLine of WORLD_MAP) {
        const padded = mapLine.padEnd(MAP_WIDTH);
        const display = W >= MAP_WIDTH
          ? rep(' ', mapPad) + padded
          : padded.slice(0, W);
        rows.push(row(pad(display, W), DARK));
      }
      rows.push(blank(W));
    }

    // Logo
    rows.push(row(center('L   T   F   1', W), WHITE));
    rows.push(blank(W));

    // Thin separator
    const uSepW = 28;
    const uSepL = Math.floor((W - uSepW) / 2);
    rows.push(row(pad(rep(' ', uSepL) + rep('─', uSepW), W), DARK));
    rows.push(blank(W));

    // Full name
    rows.push(row(center('Legacy Task Framework', W), GRAY));
    rows.push(blank(W));

    // Tagline
    rows.push(row(center('Collaborative project management', W), DIM));
    rows.push(row(center('from your terminal.', W), DIM));
    rows.push(blank(W));
    rows.push(blank(W));

    // ── Login-state-dependent content ──
    if (loginState === 'authenticating') {
      // Dots animation derived from clock seconds
      const sec = parseInt(timeStr.split(':')[2] || '0', 10);
      const dots = '.'.repeat((sec % 3) + 1);

      rows.push(row(center(`Opening browser${dots}`, W), WHITE));
      rows.push(blank(W));
      rows.push(row(center('Complete authentication in your browser', W), DIM));
      rows.push(row(center('and return here when finished.', W), DIM));
      rows.push(blank(W));

      // Subtle waiting indicator
      const waitBarW = 20;
      const phase = sec % waitBarW;
      const waitBar = rep('─', phase) + '●' + rep('─', waitBarW - phase - 1);
      rows.push(row(center(waitBar, W), DARK));

    } else if (loginState === 'success') {
      rows.push(row(center('Authenticated', W), WHITE));
      rows.push(blank(W));
      rows.push(row(center('Loading workspace...', W), GRAY));
      rows.push(blank(W));
      rows.push(blank(W));
      rows.push(blank(W));

    } else if (loginState === 'error') {
      rows.push(row(center('Authentication failed', W), WHITE));
      rows.push(blank(W));
      if (loginError) {
        const errMsg = loginError.length > W - 12 ? loginError.slice(0, W - 13) + '…' : loginError;
        rows.push(row(center(errMsg, W), GRAY));
      }
      rows.push(blank(W));
      rows.push(row(center('Press  Enter  to try again', W), LIGHT));
      rows.push(blank(W));

    } else {
      // idle - show login prompt
      rows.push(row(center('Press  Enter  to authenticate', W), WHITE));
      rows.push(blank(W));
      rows.push(row(center('Opens your browser to sign in.', W), DIM));
      rows.push(blank(W));
      rows.push(blank(W));
      rows.push(blank(W));
    }

    // Fill to footer
    fillTo(rows, H - 2, W);

    // Minimal footer
    rows.push(row(rep('─', W), DARK));
    if (loginState === 'authenticating') {
      rows.push(segRow(padSegs([
        { text: '  ', color: GRAY },
        { text: 'Waiting for browser', color: DIM },
        { text: rep(' ', Math.max(1, W - 36 - timeStr.length)), color: WHITE },
        { text: timeStr, color: GRAY },
        { text: '  ', color: WHITE },
      ], W)));
    } else {
      rows.push(segRow(padSegs([
        { text: '  ', color: GRAY },
        { text: 'Enter', color: LIGHT },
        { text: ' Login   ', color: DIM },
        { text: 'Q', color: LIGHT },
        { text: ' Quit', color: DIM },
      ], W)));
    }

    return { rows, connectionStatus };
  }

  // ══════════════════════════════════════════════════════════════
  // AUTHENTICATED: Normal dashboard
  // ══════════════════════════════════════════════════════════════

  // ── Header: Workspace > Project > Status ──
  const breadcrumb: Array<{ text: string; color: string }> = [
    { text: '  LTF1', color: WHITE },
  ];
  if (config.workspaceName) {
    breadcrumb.push({ text: '  ›  ', color: DIM });
    breadcrumb.push({ text: config.workspaceName, color: GRAY });
  }
  if (config.projectName) {
    breadcrumb.push({ text: '  ›  ', color: DIM });
    breadcrumb.push({ text: config.projectName, color: LIGHT });
  }

  const statusDot = connectionStatus === 'connected' ? '●' : connectionStatus === 'connecting' ? '○' : '●';
  const statusLabel = connectionStatus === 'connected' ? 'Ready' :
    connectionStatus === 'connecting' ? 'Connecting' :
    connectionStatus === 'error' ? 'Error' : 'Offline';
  const statusColor = connectionStatus === 'connected' ? LIGHT :
    connectionStatus === 'connecting' ? GRAY : DIM;

  const breadcrumbLen = breadcrumb.reduce((s, b) => s + b.text.length, 0);
  const rightLen = 3 + statusLabel.length + 2 + timeStr.length + 2;
  const gap = Math.max(1, W - breadcrumbLen - rightLen);

  rows.push(segRow(padSegs([
    ...breadcrumb,
    { text: rep(' ', gap), color: WHITE },
    { text: statusDot, color: statusColor },
    { text: ` ${statusLabel}  `, color: GRAY },
    { text: timeStr, color: GRAY },
    { text: '  ', color: WHITE },
  ], W)));
  rows.push(row(rep('─', W), DARK));

  // ── Determine layout based on context ──
  const hasWorkspace = !!config.workspaceId;
  const hasProject = hasWorkspace && !!config.projectId;
  const hasData = hasProject && taskStats.total > 0;

  const logoTop = hasData ? 2 : Math.max(3, Math.floor((H - 28) / 2));
  for (let i = 0; i < logoTop; i++) rows.push(blank(W));

  // ── Logo ──
  rows.push(row(center('L T F 1', W), WHITE));
  rows.push(blank(W));
  const sepW = 34;
  const sepL = Math.floor((W - sepW) / 2);
  rows.push(row(pad(rep(' ', sepL) + rep('─', sepW), W), DARK));
  rows.push(blank(W));

  // ── Context-dependent content ──
  if (!config.workspaceId) {
    rows.push(row(center('No workspace selected', W), GRAY));
    rows.push(blank(W));
    rows.push(row(center('Run  ltf workspace select  to choose a workspace', W), DIM));
  } else if (!config.projectId) {
    // Show workspace info and projects list
    if (wsStats) {
      const wsLine = `${wsStats.totalProjects || 0} projects  |  ${wsStats.totalMembers || 0} members  |  ${wsStats.totalTasks || 0} tasks`;
      rows.push(row(center(wsLine, W), GRAY));
      rows.push(blank(W));
    }
    rows.push(row(center('No project selected', W), LIGHT));
    rows.push(blank(W));

    if (projects.length > 0) {
      rows.push(section('Projects', W));
      rows.push(blank(W));
      for (const p of projects.slice(0, 6)) {
        const statusColor2 = p.status === 'active' ? WHITE : p.status === 'on_hold' ? GRAY : DIM;
        rows.push(segRow(padSegs([
          { text: '    ', color: WHITE },
          { text: p.key.padEnd(8), color: LIGHT },
          { text: p.name, color: statusColor2 },
          { text: rep(' ', Math.max(1, W - 14 - p.key.length - p.name.length - p.status.length)), color: WHITE },
          { text: p.status, color: DIM },
        ], W)));
      }
      rows.push(blank(W));
    }
    rows.push(row(center('Run  ltf project select  to choose a project', W), DIM));
  } else if (hasData) {
    // ── Project stats ──
    const statsStr = `${taskStats.total} tasks  |  ${taskStats.todo + taskStats.backlog} open  |  ${taskStats.inProgress} active  |  ${taskStats.done} done`;
    rows.push(row(center(statsStr, W), GRAY));
    rows.push(blank(W));

    // Sprint summary
    const sprint = sprintQuery.data as { name?: string; startDate?: number; endDate?: number; percentComplete?: number; daysRemaining?: number } | null;
    if (sprint?.name) {
      const daysLeft = sprint.daysRemaining ?? Math.max(0, Math.ceil(((sprint.endDate || Date.now()) - Date.now()) / 86400000));
      const pct = sprint.percentComplete != null ? `${sprint.percentComplete}%` : '';
      const sprintStr = `${sprint.name}  ·  ${daysLeft} days remaining${pct ? `  ·  ${pct}` : ''}`;
      rows.push(row(center(sprintStr, W), DIM));
      rows.push(blank(W));
    }

    // Workspace-level context
    if (wsStats && wsStats.totalProjects && wsStats.totalProjects > 1) {
      const wsContext = `Workspace: ${wsStats.totalProjects} projects, ${wsStats.totalMembers || 0} members`;
      rows.push(row(center(wsContext, W), DARK));
      rows.push(blank(W));
    }

    // My tasks section
    if (myTasks.length > 0) {
      const myLabel = '  My Tasks';
      rows.push(segRow(padSegs([
        { text: myLabel, color: LIGHT },
        { text: '  ' + rep('─', W - myLabel.length - 4), color: DARK },
      ], W)));
      rows.push(blank(W));

      for (const t of myTasks) {
        const icon = STATUS_ICONS[t.status] || '○';
        const iconColor = t.status === 'in_progress' ? WHITE : GRAY;
        const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
        rows.push(segRow(padSegs([
          { text: '    ', color: WHITE },
          { text: icon + ' ', color: iconColor },
          { text: key, color: GRAY },
          { text: '  ', color: WHITE },
          { text: t.title.length > W - 30 ? t.title.slice(0, W - 31) + '…' : t.title, color: t.status === 'in_progress' ? WHITE : LIGHT },
        ], W)));
      }
      rows.push(blank(W));
    }
  } else {
    // Authenticated with project but no tasks yet
    rows.push(row(center('L E G A C Y   T A S K   F R A M E W O R K', W), GRAY));
    rows.push(blank(W));
    if (taskStats.total === 0 && !tasksQuery.loading) {
      rows.push(row(center('No tasks yet — press T to create your first task', W), DIM));
    }
  }

  rows.push(blank(W));

  // ── Menu ──
  const menuItems = [
    { key: 'T', label: 'Tasks', desc: 'View and manage your tasks' },
    { key: 'S', label: 'Sprint', desc: 'Sprint progress and metrics' },
    { key: 'G', label: 'Git', desc: 'Git status and history' },
    { key: 'Q', label: 'Quit', desc: 'Exit to shell' },
  ];

  const mw = 46;
  const ml = Math.floor((W - mw) / 2);

  rows.push(row(pad(rep(' ', ml) + rep('─', mw), W), DARK));

  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const isSelected = i === selectedIndex;
    const line = ` ${item.key}  ${item.label}` + rep(' ', mw - 3 - item.label.length - item.desc.length) + item.desc + ' ';

    if (isSelected) {
      rows.push({
        segments: padSegs([
          { text: rep(' ', ml) + line, color: BG },
        ], W),
        bgColor: WHITE,
      });
    } else {
      rows.push(segRow(padSegs([
        { text: rep(' ', ml) + ' ', color: WHITE },
        { text: item.key, color: WHITE },
        { text: '  ', color: WHITE },
        { text: item.label, color: GRAY },
        { text: rep(' ', mw - 4 - item.label.length - item.desc.length), color: WHITE },
        { text: item.desc, color: DIM },
        { text: ' ', color: WHITE },
      ], W)));
    }
  }

  rows.push(row(pad(rep(' ', ml) + rep('─', mw), W), DARK));

  fillTo(rows, H - 2, W);

  rows.push(row(rep('─', W), DARK));
  rows.push(segRow(padSegs([
    { text: '  ', color: GRAY },
    { text: '↑↓', color: LIGHT },
    { text: ' Navigate   ', color: DIM },
    { text: 'Enter', color: LIGHT },
    { text: ' Select   ', color: DIM },
    { text: 'Q', color: LIGHT },
    { text: ' Quit', color: DIM },
  ], W)));

  return { rows, connectionStatus };
}
