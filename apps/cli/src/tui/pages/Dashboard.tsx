/**
 * Dashboard Page - Real workspace/project/task hierarchy
 * Shows: Workspace > Project context, workspace stats, my tasks, sprint summary
 * Includes interactive workspace/project selectors when context is missing
 */

import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { useParticleField } from '../hooks/useParticles.js';
import { api } from '../../lib/convex.js';
import type { Row, Task, ConnectionStatus, DashboardMode } from '../types.js';
import { BG, WHITE, LIGHT, GRAY, DIM, DARK, STATUS_ICONS } from '../theme.js';
import {
  row, segRow, blank, padSegs, fillTo, rep, pad, center,
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

/**
 * Renders a wave loading animation between heading and label.
 * Each position oscillates independently via sine; the wave propagates across.
 */
function renderLoadingAnimation(rows: Row[], label: string, W: number): void {
  // 9 height levels: space at 0, full block at 8
  const blocks = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const barW = 44;
  const t = Date.now() / 120;               // scroll speed
  let bar = '';
  for (let j = 0; j < barW; j++) {
    // Sine wave: each char rises/falls on its own; phase shifts across positions
    const val = Math.sin(j / 5 - t);        // wavelength ~31 chars
    const idx = Math.round((val + 1) / 2 * (blocks.length - 1));
    bar += blocks[idx];
  }
  rows.push(segRow(padSegs([
    { text: center(bar, W), color: LIGHT },
  ], W)));
  rows.push(blank(W));
  rows.push(row(center(label, W), GRAY));
  rows.push(blank(W));
}

export type LoginState = 'idle' | 'authenticating' | 'success' | 'error';

export interface SelectableItem {
  id: string;
  name: string;
  key?: string;
}

export interface DashboardPageProps {
  width: number;
  height: number;
  timeStr: string;
  selectedIndex: number;
  selectorIndex: number;
  loginState?: LoginState;
  loginError?: string;
}

export interface DashboardResult {
  rows: Row[];
  connectionStatus: ConnectionStatus;
  dashboardMode: DashboardMode;
  selectorItemCount: number;
  selectableItems: SelectableItem[];
}

export function useDashboardPage({ width: W, height: H, timeStr, selectedIndex, selectorIndex, loginState = 'idle', loginError = '' }: DashboardPageProps): DashboardResult {
  const auth = useAuth();
  const config = useConfig();
  const particleRows = useParticleField(W);

  // Fetch user's workspaces (enabled when authenticated but no workspace selected)
  const workspacesQuery = useConvexQuery(
    api.workspaces.queries.getUserWorkspaces,
    auth.isAuthenticated && !config.workspaceId ? {} : null,
    30000,
  );

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

  // Workspace list
  const workspaces = useMemo(() => {
    const data = workspacesQuery.data as Array<{
      _id: string;
      name: string;
      role?: string;
      memberCount?: number;
      projectCount?: number;
    }> | null;
    return data || [];
  }, [workspacesQuery.data]);

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

  // Determine dashboard mode
  const dashboardMode: DashboardMode = !auth.isAuthenticated ? 'normal'
    : !config.workspaceId ? 'workspace_selector'
    : !config.projectId ? 'project_selector'
    : 'normal';

  // Build selectable items for current mode
  const selectableItems: SelectableItem[] = useMemo(() => {
    if (dashboardMode === 'workspace_selector') {
      return workspaces.map(w => ({ id: w._id, name: w.name }));
    }
    if (dashboardMode === 'project_selector') {
      return projects.map(p => ({ id: p._id, name: p.name, key: p.key }));
    }
    return [];
  }, [dashboardMode, workspaces, projects]);

  const selectorItemCount = selectableItems.length;

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

    return { rows, connectionStatus, dashboardMode, selectorItemCount, selectableItems };
  }

  // ══════════════════════════════════════════════════════════════
  // AUTHENTICATED: Header (shared across all modes)
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

  // ══════════════════════════════════════════════════════════════
  // WORKSPACE SELECTOR
  // ══════════════════════════════════════════════════════════════
  if (dashboardMode === 'workspace_selector') {
    const logoTop = Math.max(3, Math.floor((H - 28) / 2));
    for (let i = 0; i < logoTop; i++) rows.push(blank(W));

    // Logo
    rows.push(row(center('L   T   F   1', W), WHITE));
    rows.push(blank(W));
    const sepW = 34;
    const sepL = Math.floor((W - sepW) / 2);
    rows.push(row(pad(rep(' ', sepL) + rep('─', sepW), W), DARK));
    rows.push(blank(W));

    rows.push(row(center('Select a Workspace', W), LIGHT));
    rows.push(blank(W));

    if (workspacesQuery.loading && workspaces.length === 0) {
      renderLoadingAnimation(rows, 'Loading workspaces', W);
    } else if (workspaces.length === 0) {
      rows.push(row(center('No workspaces found', W), GRAY));
      rows.push(blank(W));
      rows.push(row(center('Create a workspace at app.ltf1.com', W), DIM));
    } else {
      // Centered list layout
      const wlw = 56;
      const wll = Math.floor((W - wlw) / 2);

      rows.push(row(pad(rep(' ', wll) + rep('─', wlw), W), DARK));

      for (let i = 0; i < workspaces.length; i++) {
        const ws = workspaces[i];
        const isSelected = i === selectorIndex;
        const pointer = isSelected ? '>' : ' ';
        const role = (ws.role || 'member').padEnd(8);
        const projCount = ws.projectCount != null ? `${ws.projectCount} proj` : '';
        const memCount = ws.memberCount != null ? `${ws.memberCount} mem` : '';
        const meta = [projCount, memCount].filter(Boolean).join('  ');

        const nameMax = wlw - 4 - role.length - meta.length - 4;
        const displayName = ws.name.length > nameMax ? ws.name.slice(0, nameMax - 1) + '…' : ws.name.padEnd(nameMax);
        const inner = ` ${pointer} ${displayName} ${role}${meta} `;

        if (isSelected) {
          rows.push({
            segments: padSegs([
              { text: rep(' ', wll) + pad(inner, wlw), color: BG },
            ], W),
            bgColor: WHITE,
          });
        } else {
          rows.push(segRow(padSegs([
            { text: rep(' ', wll) + ` ${pointer} `, color: WHITE },
            { text: displayName, color: LIGHT },
            { text: ' ', color: WHITE },
            { text: role, color: GRAY },
            { text: meta, color: DIM },
            { text: ' ', color: WHITE },
          ], W)));
        }
      }

      rows.push(row(pad(rep(' ', wll) + rep('─', wlw), W), DARK));
    }

    rows.push(blank(W));

    // Fill blank rows, then insert particle band just above footer
    const wsTarget = H - 2;
    const wsAvail = wsTarget - rows.length;
    if (wsAvail > 0) {
      const wsBand = particleRows.slice(particleRows.length - Math.min(wsAvail, particleRows.length));
      fillTo(rows, wsTarget - wsBand.length, W);
      rows.push(...wsBand);
    }
    fillTo(rows, wsTarget, W);

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

    return { rows, connectionStatus, dashboardMode, selectorItemCount, selectableItems };
  }

  // ══════════════════════════════════════════════════════════════
  // PROJECT SELECTOR
  // ══════════════════════════════════════════════════════════════
  if (dashboardMode === 'project_selector') {
    const logoTop = Math.max(2, Math.floor((H - 30) / 2));
    for (let i = 0; i < logoTop; i++) rows.push(blank(W));

    // Logo
    rows.push(row(center('L T F 1', W), WHITE));
    rows.push(blank(W));
    const sepW = 34;
    const sepL = Math.floor((W - sepW) / 2);
    rows.push(row(pad(rep(' ', sepL) + rep('─', sepW), W), DARK));
    rows.push(blank(W));

    rows.push(row(center('Select a Project', W), LIGHT));
    rows.push(blank(W));

    // Workspace stats line
    if (wsStats) {
      const wsLine = `${wsStats.totalProjects || 0} projects  |  ${wsStats.totalMembers || 0} members  |  ${wsStats.totalTasks || 0} tasks`;
      rows.push(row(center(wsLine, W), GRAY));
      rows.push(blank(W));
    }

    if (projectsQuery.loading && projects.length === 0) {
      renderLoadingAnimation(rows, 'Loading projects', W);
    } else if (projects.length === 0) {
      rows.push(row(center('No projects found', W), GRAY));
      rows.push(blank(W));
      rows.push(row(center('Create a project in your workspace first', W), DIM));
    } else {
      // Centered list layout
      const plw = 56;
      const pll = Math.floor((W - plw) / 2);

      rows.push(row(pad(rep(' ', pll) + rep('─', plw), W), DARK));

      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        const isSelected = i === selectorIndex;
        const pointer = isSelected ? '>' : ' ';
        const statusStr = (p.status || '').padEnd(8);
        const keyStr = p.key.padEnd(6);

        const nameMax = plw - 4 - keyStr.length - statusStr.length - 2;
        const displayName = p.name.length > nameMax ? p.name.slice(0, nameMax - 1) + '…' : p.name.padEnd(nameMax);
        const inner = ` ${pointer} ${keyStr}${displayName} ${statusStr}`;

        if (isSelected) {
          rows.push({
            segments: padSegs([
              { text: rep(' ', pll) + pad(inner, plw), color: BG },
            ], W),
            bgColor: WHITE,
          });
        } else {
          const statusClr = p.status === 'active' ? LIGHT : p.status === 'on_hold' ? GRAY : DIM;
          rows.push(segRow(padSegs([
            { text: rep(' ', pll) + ` ${pointer} `, color: WHITE },
            { text: keyStr, color: GRAY },
            { text: displayName, color: LIGHT },
            { text: ' ', color: WHITE },
            { text: statusStr, color: statusClr },
          ], W)));
        }
      }

      rows.push(row(pad(rep(' ', pll) + rep('─', plw), W), DARK));
    }

    rows.push(blank(W));

    // Fill blank rows, then insert particle band just above footer
    const psTarget = H - 2;
    const psAvail = psTarget - rows.length;
    if (psAvail > 0) {
      const psBand = particleRows.slice(particleRows.length - Math.min(psAvail, particleRows.length));
      fillTo(rows, psTarget - psBand.length, W);
      rows.push(...psBand);
    }
    fillTo(rows, psTarget, W);

    rows.push(row(rep('─', W), DARK));
    rows.push(segRow(padSegs([
      { text: '  ', color: GRAY },
      { text: '↑↓', color: LIGHT },
      { text: ' Navigate   ', color: DIM },
      { text: 'Enter', color: LIGHT },
      { text: ' Select   ', color: DIM },
      { text: 'B', color: LIGHT },
      { text: ' Back   ', color: DIM },
      { text: 'Q', color: LIGHT },
      { text: ' Quit', color: DIM },
    ], W)));

    return { rows, connectionStatus, dashboardMode, selectorItemCount, selectableItems };
  }

  // ══════════════════════════════════════════════════════════════
  // NORMAL DASHBOARD
  // ══════════════════════════════════════════════════════════════

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

  if (hasData) {
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
    if (tasksQuery.loading) {
      renderLoadingAnimation(rows, 'Loading project data', W);
    } else if (taskStats.total === 0) {
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

  // Fill blank rows, then insert particle band just above footer
  const ndTarget = H - 2;
  const ndAvail = ndTarget - rows.length;
  if (ndAvail > 0) {
    const ndBand = particleRows.slice(particleRows.length - Math.min(ndAvail, particleRows.length));
    fillTo(rows, ndTarget - ndBand.length, W);
    rows.push(...ndBand);
  }
  fillTo(rows, ndTarget, W);

  rows.push(row(rep('─', W), DARK));
  rows.push(segRow(padSegs([
    { text: '  ', color: GRAY },
    { text: '↑↓', color: LIGHT },
    { text: ' Navigate   ', color: DIM },
    { text: 'Enter', color: LIGHT },
    { text: ' Select   ', color: DIM },
    { text: 'W', color: LIGHT },
    { text: ' Workspace   ', color: DIM },
    { text: 'P', color: LIGHT },
    { text: ' Project   ', color: DIM },
    { text: 'Q', color: LIGHT },
    { text: ' Quit', color: DIM },
  ], W)));

  return { rows, connectionStatus, dashboardMode, selectorItemCount, selectableItems };
}
