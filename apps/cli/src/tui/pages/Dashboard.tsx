/**
 * Dashboard Page - Ink native rewrite
 * Shows: Workspace/Project selectors, active sprint, my tasks, workspace stats, agent activity
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { Panel } from '../components/Panel.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { useAuth } from '../hooks/useAuth.js';
import { useConfig } from '../hooks/useConfig.js';
import { useConvexQuery } from '../hooks/useConvex.js';
import { api } from '../../lib/convex.js';
import type { Task, ConnectionStatus, DashboardMode } from '../types.js';

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
  pressed?: boolean;
  pressedAction?: string;
  onNavigate?: (page: string) => void;
  onSelectWorkspace?: (id: string) => void;
  onSelectProject?: (id: string) => void;
}

export interface DashboardResult {
  element: React.ReactElement;
  connectionStatus: ConnectionStatus;
  dashboardMode: DashboardMode;
  selectorItemCount: number;
  selectableItems: SelectableItem[];
}

export function useDashboardPage({
  width: W,
  height: H,
  timeStr,
  selectedIndex,
  selectorIndex,
  loginState = 'idle',
  loginError = '',
  pressed = false,
  pressedAction = '',
}: DashboardPageProps): DashboardResult {
  const auth = useAuth();
  const config = useConfig();

  // Fetch user's workspaces
  const workspacesQuery = useConvexQuery(
    api.workspaces.queries.getUserWorkspaces,
    auth.isAuthenticated && !config.workspaceId ? {} : null,
    30000,
  );

  // Fetch workspace stats
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

  // Fetch tasks for the active project
  const tasksQuery = useConvexQuery(
    api.tasks.queries.getProjectTasks,
    config.projectId ? { projectId: config.projectId as never } : null,
    10000,
  );

  // Fetch active sprint
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

  // Workspace stats
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
    : !config.workspaceId ? workspacesQuery.connectionStatus
    : !config.projectId ? (projectsQuery.connectionStatus !== 'connecting' ? projectsQuery.connectionStatus : workspaceStatsQuery.connectionStatus)
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

  // ── Sprint data ──
  const sprint = sprintQuery.data as {
    name?: string;
    startDate?: number;
    endDate?: number;
    percentComplete?: number;
    daysRemaining?: number;
  } | null;

  // ═══════════════════════════════════════════
  //  UNAUTHENTICATED SCREEN
  // ═══════════════════════════════════════════
  if (!auth.isAuthenticated) {
    const element = (
      <Box flexDirection="column" width={W} height={H}>
        <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
          <Text color={theme.text} bold>L   T   F   1</Text>
          <Text> </Text>
          <Text color={theme.border}>{'─'.repeat(28)}</Text>
          <Text> </Text>
          <Text color={theme.textMuted}>Legacy Task Framework</Text>
          <Text> </Text>
          <Text color={theme.textDim}>Collaborative project management</Text>
          <Text color={theme.textDim}>from your terminal.</Text>
          <Text> </Text>
          <Text> </Text>

          {loginState === 'authenticating' && (
            <>
              <Text color={theme.text}>Opening browser...</Text>
              <Text> </Text>
              <Text color={theme.textDim}>Complete authentication in your browser</Text>
              <Text color={theme.textDim}>and return here when finished.</Text>
            </>
          )}
          {loginState === 'success' && (
            <>
              <Text color={theme.text}>Authenticated</Text>
              <Text> </Text>
              <Text color={theme.textMuted}>Loading workspace...</Text>
            </>
          )}
          {loginState === 'error' && (
            <>
              <Text color={theme.text}>Authentication failed</Text>
              <Text> </Text>
              {loginError && <Text color={theme.textMuted}>{loginError.slice(0, W - 12)}</Text>}
              <Text> </Text>
              <Text color={theme.textSecondary}>Press  Enter  to try again</Text>
            </>
          )}
          {loginState === 'idle' && (
            <>
              <Text color={theme.text}>Press  Enter  to authenticate</Text>
              <Text> </Text>
              <Text color={theme.textDim}>Opens your browser to sign in.</Text>
            </>
          )}
        </Box>

        <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
          <Box paddingX={1}>
            {loginState === 'authenticating' ? (
              <Text color={theme.textDim}>Waiting for browser</Text>
            ) : (
              <>
                <Text color={theme.textSecondary}>Enter</Text>
                <Text color={theme.textDim}> Login   </Text>
                <Text color={theme.textSecondary}>Q</Text>
                <Text color={theme.textDim}> Quit</Text>
              </>
            )}
            <Box flexGrow={1} />
            <Text color={theme.textMuted}>{timeStr}</Text>
          </Box>
        </Box>
      </Box>
    );

    return { element, connectionStatus, dashboardMode, selectorItemCount, selectableItems };
  }

  // ═══════════════════════════════════════════
  //  HEADER (shared across authenticated modes)
  // ═══════════════════════════════════════════
  const statusDot = connectionStatus === 'connected' ? '\u25CF' : connectionStatus === 'connecting' ? '\u25CB' : '\u25CF';
  const statusLabel = connectionStatus === 'connected' ? 'Ready' :
    connectionStatus === 'connecting' ? 'Connecting' :
    connectionStatus === 'error' ? 'Error' : 'Offline';
  const statusColor = connectionStatus === 'connected' ? theme.textSecondary :
    connectionStatus === 'connecting' ? theme.textMuted : theme.textDim;

  const Header = (
    <Box>
      <Box paddingX={1}>
        <Text color={theme.text} bold>LTF1</Text>
        {config.workspaceName && (
          <>
            <Text color={theme.textDim}>  {'\u203A'}  </Text>
            <Text color={theme.textMuted}>{config.workspaceName}</Text>
          </>
        )}
        {config.projectName && (
          <>
            <Text color={theme.textDim}>  {'\u203A'}  </Text>
            <Text color={theme.textSecondary}>{config.projectName}</Text>
          </>
        )}
      </Box>
      <Box flexGrow={1} />
      <Box paddingX={1}>
        <Text color={statusColor}>{statusDot} {statusLabel}</Text>
        <Text color={theme.textMuted}>  {timeStr}</Text>
      </Box>
    </Box>
  );

  // ═══════════════════════════════════════════
  //  WORKSPACE SELECTOR
  // ═══════════════════════════════════════════
  if (dashboardMode === 'workspace_selector') {
    const element = (
      <Box flexDirection="column" width={W} height={H}>
        {Header}
        <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />

        <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
          <Text color={theme.text} bold>L   T   F   1</Text>
          <Text> </Text>
          <Text color={theme.border}>{'─'.repeat(34)}</Text>
          <Text> </Text>
          <Text color={theme.textSecondary}>Select a Workspace</Text>
          <Text> </Text>

          {workspacesQuery.loading && workspaces.length === 0 ? (
            <Text color={theme.textMuted}>Loading workspaces...</Text>
          ) : workspacesQuery.error && workspaces.length === 0 ? (
            <Text color={theme.textMuted}>Failed to load workspaces</Text>
          ) : workspaces.length === 0 ? (
            <>
              <Text color={theme.textMuted}>No workspaces found</Text>
              <Text color={theme.textDim}>Create a workspace at app.ltf1.com</Text>
            </>
          ) : (
            <Box flexDirection="column" width={Math.min(56, W - 4)}>
              <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />
              {workspaces.map((ws, i) => {
                const isSelected = i === selectorIndex;
                const isPressed = isSelected && pressed;
                const pointer = isPressed ? '\u25B8' : isSelected ? '>' : ' ';
                const role = (ws.role || 'member').padEnd(8);
                const projCount = ws.projectCount != null ? `${ws.projectCount} proj` : '';
                const memCount = ws.memberCount != null ? `${ws.memberCount} mem` : '';
                const meta = [projCount, memCount].filter(Boolean).join('  ');

                return (
                  <Box key={ws._id}
                    paddingX={1}
                    {...(isSelected && !isPressed ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
                  >
                    <Text color={isSelected ? theme.text : theme.textSecondary}>
                      {pointer} {ws.name}
                    </Text>
                    <Box flexGrow={1} />
                    <Text color={theme.textMuted}> {role}</Text>
                    <Text color={theme.textDim}>{meta}</Text>
                  </Box>
                );
              })}
              <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />
            </Box>
          )}
        </Box>

        <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
          <Box paddingX={1}>
            {pressed && pressedAction ? (
              <Text color={theme.text}>{'\u2192'} {pressedAction}</Text>
            ) : (
              <>
                <Text color={theme.textSecondary}>{'\u2191\u2193'}</Text>
                <Text color={theme.textDim}> Navigate   </Text>
                <Text color={theme.textSecondary}>Enter</Text>
                <Text color={theme.textDim}> Select   </Text>
                <Text color={theme.textSecondary}>Q</Text>
                <Text color={theme.textDim}> Quit</Text>
              </>
            )}
          </Box>
        </Box>
      </Box>
    );

    return { element, connectionStatus, dashboardMode, selectorItemCount, selectableItems };
  }

  // ═══════════════════════════════════════════
  //  PROJECT SELECTOR
  // ═══════════════════════════════════════════
  if (dashboardMode === 'project_selector') {
    const element = (
      <Box flexDirection="column" width={W} height={H}>
        {Header}
        <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />

        <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
          <Text color={theme.text} bold>L T F 1</Text>
          <Text> </Text>
          <Text color={theme.border}>{'─'.repeat(34)}</Text>
          <Text> </Text>
          <Text color={theme.textSecondary}>Select a Project</Text>
          <Text> </Text>

          {wsStats && (
            <>
              <Text color={theme.textMuted}>
                {wsStats.totalProjects || 0} projects  |  {wsStats.totalMembers || 0} members  |  {wsStats.totalTasks || 0} tasks
              </Text>
              <Text> </Text>
            </>
          )}

          {projectsQuery.loading && projects.length === 0 ? (
            <Text color={theme.textMuted}>Loading projects...</Text>
          ) : projects.length === 0 ? (
            <>
              <Text color={theme.textMuted}>No projects found</Text>
              <Text color={theme.textDim}>Create a project in your workspace first</Text>
            </>
          ) : (
            <Box flexDirection="column" width={Math.min(56, W - 4)}>
              <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />
              {projects.map((p, i) => {
                const isSelected = i === selectorIndex;
                const isPressed = isSelected && pressed;
                const pointer = isPressed ? '\u25B8' : isSelected ? '>' : ' ';
                const statusClr = p.status === 'active' ? theme.textSecondary : p.status === 'on_hold' ? theme.textMuted : theme.textDim;

                return (
                  <Box key={p._id}
                    paddingX={1}
                    {...(isSelected && !isPressed ? { borderStyle: 'single' as const, borderColor: theme.accent, borderLeft: true, borderRight: false, borderTop: false, borderBottom: false } : {})}
                  >
                    <Text color={isSelected ? theme.text : theme.textSecondary}>
                      {pointer} </Text>
                    <Text color={theme.textMuted}>{p.key.padEnd(6)}</Text>
                    <Text color={isSelected ? theme.text : theme.textSecondary}>{p.name}</Text>
                    <Box flexGrow={1} />
                    <Text color={statusClr}> {p.status}</Text>
                  </Box>
                );
              })}
              <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />
            </Box>
          )}
        </Box>

        <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
          <Box paddingX={1}>
            {pressed && pressedAction ? (
              <Text color={theme.text}>{'\u2192'} {pressedAction}</Text>
            ) : (
              <>
                <Text color={theme.textSecondary}>{'\u2191\u2193'}</Text>
                <Text color={theme.textDim}> Navigate   </Text>
                <Text color={theme.textSecondary}>Enter</Text>
                <Text color={theme.textDim}> Select   </Text>
                <Text color={theme.textSecondary}>B</Text>
                <Text color={theme.textDim}> Back   </Text>
                <Text color={theme.textSecondary}>Q</Text>
                <Text color={theme.textDim}> Quit</Text>
              </>
            )}
          </Box>
        </Box>
      </Box>
    );

    return { element, connectionStatus, dashboardMode, selectorItemCount, selectableItems };
  }

  // ═══════════════════════════════════════════
  //  NORMAL DASHBOARD
  // ═══════════════════════════════════════════
  const hasProject = !!config.projectId;
  const hasData = hasProject && taskStats.total > 0;

  // Sprint info
  const sprintName = sprint?.name || null;
  const daysLeft = sprint ? (sprint.daysRemaining ?? Math.max(0, Math.ceil(((sprint.endDate || Date.now()) - Date.now()) / 86400000))) : 0;
  const sprintPct = sprint?.percentComplete ?? (taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0);

  // Menu items
  const menuItems = [
    { key: 'T', label: 'Tasks', desc: 'View and manage your tasks' },
    { key: 'S', label: 'Sprint', desc: 'Sprint progress and metrics' },
    { key: 'G', label: 'Git', desc: 'Git status and history' },
    { key: 'Q', label: 'Quit', desc: 'Exit to shell' },
  ];

  const element = (
    <Box flexDirection="column" width={W} height={H}>
      {Header}
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />

      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
        {/* Active Sprint Panel */}
        {hasData && sprintName && (
          <Panel title="ACTIVE SPRINT" titleColor={theme.accent}>
            <Box justifyContent="space-between">
              <Text color={theme.text} bold>{sprintName}</Text>
              <Text color={theme.textMuted}>{taskStats.done}/{taskStats.total} tasks</Text>
            </Box>
            <Box>
              <ProgressBar value={taskStats.done} max={taskStats.total} width={Math.max(10, W - 30)} color={theme.green} />
            </Box>
            <Text color={theme.textDim}>{daysLeft} days remaining</Text>
          </Panel>
        )}

        {hasData ? (
          <Box marginTop={1}>
            {/* My Tasks Panel */}
            <Box flexDirection="column" flexGrow={1} marginRight={1}>
              <Panel title="MY TASKS" titleColor={theme.accent} flexGrow={1}>
                {myTasks.length === 0 ? (
                  <Text color={theme.textDim}>No active tasks</Text>
                ) : (
                  myTasks.map((t) => {
                    const icon = theme.statusIcon[t.status as keyof typeof theme.statusIcon] || '\u25CB';
                    const iconColor = theme.status[t.status as keyof typeof theme.status] || theme.textMuted;
                    const priColor = theme.priority[t.priority as keyof typeof theme.priority] || theme.textDim;
                    const key = config.projectKey ? `${config.projectKey}-${t.number}` : `#${t.number}`;
                    const maxTitle = Math.max(10, W / 2 - 20);
                    const title = t.title.length > maxTitle ? t.title.slice(0, maxTitle - 1) + '\u2026' : t.title;

                    return (
                      <Box key={t._id}>
                        <Text color={iconColor}>{icon} </Text>
                        <Text color={theme.textMuted}>{key} </Text>
                        <Text color={t.status === 'in_progress' ? theme.text : theme.textSecondary}>{title}</Text>
                        <Box flexGrow={1} />
                        <Text color={priColor}> {t.priority.charAt(0).toUpperCase()}</Text>
                      </Box>
                    );
                  })
                )}
              </Panel>
            </Box>

            {/* Workspace Stats Panel */}
            <Box flexDirection="column" width={Math.min(30, Math.floor(W * 0.35))}>
              <Panel title="WORKSPACE STATS" titleColor={theme.accent} flexGrow={1}>
                <Box justifyContent="space-between">
                  <Text color={theme.textMuted}>Projects:</Text>
                  <Text color={theme.text}>{wsStats?.totalProjects || projects.length}</Text>
                </Box>
                <Box justifyContent="space-between">
                  <Text color={theme.textMuted}>Members:</Text>
                  <Text color={theme.text}>{wsStats?.totalMembers || 0}</Text>
                </Box>
                <Box justifyContent="space-between">
                  <Text color={theme.textMuted}>Tasks:</Text>
                  <Text color={theme.text}>{taskStats.total}</Text>
                </Box>
                <Box justifyContent="space-between">
                  <Text color={theme.textMuted}>Done:</Text>
                  <Text color={theme.green}>{taskStats.done}</Text>
                </Box>
                <Box justifyContent="space-between">
                  <Text color={theme.textMuted}>Active:</Text>
                  <Text color={theme.accent}>{taskStats.inProgress}</Text>
                </Box>
                {sprintName && (
                  <Box justifyContent="space-between">
                    <Text color={theme.textMuted}>Sprint:</Text>
                    <Text color={theme.textSecondary}>{sprintPct}%</Text>
                  </Box>
                )}
              </Panel>
            </Box>
          </Box>
        ) : (
          <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
            <Text color={theme.text} bold>L T F 1</Text>
            <Text> </Text>
            <Text color={theme.textMuted}>L E G A C Y   T A S K   F R A M E W O R K</Text>
            <Text> </Text>
            {tasksQuery.loading ? (
              <Text color={theme.textMuted}>Loading project data...</Text>
            ) : taskStats.total === 0 ? (
              <Text color={theme.textDim}>No tasks yet {'\u2014'} press T to create your first task</Text>
            ) : null}
          </Box>
        )}

        {/* Navigation Menu */}
        <Box flexDirection="column" marginTop={1} alignItems="center">
          <Box flexDirection="column" width={Math.min(46, W - 4)}>
            <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />
            {menuItems.map((item, i) => {
              const isSelected = i === selectedIndex;
              const isPressed = isSelected && pressed;

              return (
                <Box key={item.key}
                  paddingX={1}
                  {...(isSelected ? {
                    borderStyle: 'single' as const,
                    borderColor: isPressed ? theme.textDim : theme.accent,
                    borderLeft: true,
                    borderRight: false,
                    borderTop: false,
                    borderBottom: false,
                  } : {})}
                >
                  <Text color={isSelected ? theme.text : theme.textSecondary} bold={isSelected}>{item.key}</Text>
                  <Text color={isSelected ? theme.text : theme.textMuted}>  {item.label}</Text>
                  <Box flexGrow={1} />
                  <Text color={theme.textDim}>{item.desc}</Text>
                </Box>
              );
            })}
            <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border} />
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
        <Box paddingX={1}>
          {pressed && pressedAction ? (
            <Text color={theme.text}>{'\u2192'} {pressedAction}</Text>
          ) : (
            <>
              <Text color={theme.textSecondary}>{'\u2191\u2193'}</Text>
              <Text color={theme.textDim}> Navigate   </Text>
              <Text color={theme.textSecondary}>Enter</Text>
              <Text color={theme.textDim}> Select   </Text>
              <Text color={theme.textSecondary}>W</Text>
              <Text color={theme.textDim}> Workspace   </Text>
              <Text color={theme.textSecondary}>P</Text>
              <Text color={theme.textDim}> Project   </Text>
              <Text color={theme.textSecondary}>Q</Text>
              <Text color={theme.textDim}> Quit</Text>
            </>
          )}
          <Box flexGrow={1} />
          <Text color={theme.textMuted}>{timeStr}</Text>
        </Box>
      </Box>
    </Box>
  );

  return { element, connectionStatus, dashboardMode, selectorItemCount, selectableItems };
}

export default function DashboardPage(props: DashboardPageProps) {
  const { element } = useDashboardPage(props);
  return element;
}
