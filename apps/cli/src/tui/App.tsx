/**
 * LTF1 TUI Dashboard - Full Screen Application
 * Thin shell: resize detection, page routing, keyboard handling, fullscreen
 * All page rendering delegated to pages/ modules with real data hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';

import type { Page, Row } from './types.js';
import { MIN_WIDTH, MIN_HEIGHT } from './types.js';
import { BG, WHITE, LIGHT, GRAY, DIM, DARK } from './theme.js';
import { row, segRow, padSegs, rep, pad, center } from './helpers.js';
import { useAuth } from './hooks/useAuth.js';
import { useConfig } from './hooks/useConfig.js';
import { useDashboardPage } from './pages/Dashboard.js';
import type { LoginState } from './pages/Dashboard.js';
import { useTasksPage } from './pages/Tasks.js';
import { useSprintPage } from './pages/Sprint.js';
import { useGitPage } from './pages/Git.js';
import { login } from '../lib/auth.js';
import { setContext, clearContext } from '../lib/config.js';

interface AppProps {
  initialView?: Page;
}

export function App({ initialView = 'dashboard' }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [width, setWidth] = useState(stdout?.columns || 120);
  const [height, setHeight] = useState(stdout?.rows || 30);
  const [view, setView] = useState<Page>(initialView);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectorIndex, setSelectorIndex] = useState(0);
  const [time, setTime] = useState(new Date());

  // Login flow state
  const [loginState, setLoginState] = useState<LoginState>('idle');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (stdout) {
        setWidth(stdout.columns);
        setHeight(stdout.rows);
      }
    };
    stdout?.on('resize', handleResize);
    return () => { stdout?.off('resize', handleResize); };
  }, [stdout]);

  const auth = useAuth();
  const config = useConfig();

  // Trigger browser login flow
  const startLogin = useCallback(() => {
    if (loginState === 'authenticating') return;
    setLoginState('authenticating');
    setLoginError('');

    login()
      .then(() => {
        setLoginState('success');
        auth.refresh();
        // Brief success display, then auth state triggers re-render
        setTimeout(() => auth.refresh(), 500);
      })
      .catch((err: Error) => {
        setLoginState('error');
        setLoginError(err.message || 'Authentication failed');
      });
  }, [loginState, auth]);

  const tooSmall = width < MIN_WIDTH || height < MIN_HEIGHT;
  const W = Math.max(width, MIN_WIDTH);
  const H = Math.max(height, MIN_HEIGHT);
  const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });

  // Call all page hooks unconditionally (React rules of hooks)
  const dashboardResult = useDashboardPage({ width: W, height: H, timeStr, selectedIndex, selectorIndex, loginState, loginError });
  const tasksRows = useTasksPage({ width: W, height: H, timeStr, isActive: view === 'tasks' });
  const sprintRows = useSprintPage({ width: W, height: H, timeStr });
  const gitRows = useGitPage({ width: W, height: H, timeStr, isActive: view === 'git' });

  const { dashboardMode, selectorItemCount, selectableItems } = dashboardResult;

  // Selection handlers
  const handleWorkspaceSelect = useCallback(() => {
    const item = selectableItems[selectorIndex];
    if (!item) return;
    setContext({
      workspaceId: item.id,
      workspaceName: item.name,
      projectId: undefined,
      projectKey: undefined,
      projectName: undefined,
    });
    config.refresh();
    setSelectorIndex(0);
  }, [selectableItems, selectorIndex, config]);

  const handleProjectSelect = useCallback(() => {
    const item = selectableItems[selectorIndex];
    if (!item) return;
    setContext({
      projectId: item.id,
      projectKey: item.key,
      projectName: item.name,
    });
    config.refresh();
    setSelectorIndex(0);
    setSelectedIndex(0);
  }, [selectableItems, selectorIndex, config]);

  const handleBackToWorkspaceSelector = useCallback(() => {
    clearContext();
    config.refresh();
    setSelectorIndex(0);
  }, [config]);

  const handleSwitchToProjectSelector = useCallback(() => {
    setContext({
      projectId: undefined,
      projectKey: undefined,
      projectName: undefined,
    });
    config.refresh();
    setSelectorIndex(0);
  }, [config]);

  // Global keyboard handling
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) exit();

    // Unauthenticated: Enter triggers login
    if (!auth.isAuthenticated) {
      if (key.return && (loginState === 'idle' || loginState === 'error')) {
        startLogin();
      }
      return;
    }

    if (view === 'dashboard') {
      // ── Workspace selector mode ──
      if (dashboardMode === 'workspace_selector') {
        if (key.upArrow) setSelectorIndex(i => Math.max(0, i - 1));
        if (key.downArrow) setSelectorIndex(i => Math.min(Math.max(0, selectorItemCount - 1), i + 1));
        if (key.return && selectorItemCount > 0) handleWorkspaceSelect();
        return;
      }

      // ── Project selector mode ──
      if (dashboardMode === 'project_selector') {
        if (key.upArrow) setSelectorIndex(i => Math.max(0, i - 1));
        if (key.downArrow) setSelectorIndex(i => Math.min(Math.max(0, selectorItemCount - 1), i + 1));
        if (key.return && selectorItemCount > 0) handleProjectSelect();
        if (input === 'b') handleBackToWorkspaceSelector();
        return;
      }

      // ── Normal dashboard mode ──
      if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
      if (key.downArrow) setSelectedIndex(i => Math.min(3, i + 1));
      if (key.return) {
        const views: Page[] = ['tasks', 'sprint', 'git', 'dashboard'];
        if (selectedIndex < 3) setView(views[selectedIndex]);
        else exit();
      }
      if (input === 't' || input === '1') setView('tasks');
      if (input === 's' || input === '2') setView('sprint');
      if (input === 'g' || input === '3') setView('git');
      if (input === 'w') handleBackToWorkspaceSelector();
      if (input === 'p') handleSwitchToProjectSelector();
    } else {
      if (key.escape || input === 'b') setView('dashboard');
      if (input === 't') setView('tasks');
      if (input === 's') setView('sprint');
      if (input === 'g') setView('git');
      if (input === 'd') setView('dashboard');
    }
  });

  // ── Resize prompt (too small) ──
  if (tooSmall) {
    const sw = Math.max(width, 1);
    const sh = Math.max(height, 1);
    const tRows: Row[] = [];

    const contentH = 13;
    const top = Math.max(0, Math.floor((sh - contentH) / 2));
    for (let i = 0; i < top; i++) tRows.push(row(rep(' ', sw), WHITE));

    tRows.push(row(center('L T F 1', sw), WHITE));
    tRows.push(row(rep(' ', sw), WHITE));

    const rSepW = Math.min(34, sw - 4);
    const rSepL = Math.floor((sw - rSepW) / 2);
    tRows.push(row(pad(rep(' ', rSepL) + rep('─', rSepW), sw), DARK));
    tRows.push(row(rep(' ', sw), WHITE));

    tRows.push(row(center('Resize to continue', sw), GRAY));
    tRows.push(row(rep(' ', sw), WHITE));

    const curStr = `${String(width).padStart(3)} × ${String(height).padStart(2)}`;
    const reqStr = `${String(MIN_WIDTH).padStart(3)} × ${String(MIN_HEIGHT).padStart(2)}`;
    const dimW = 20;
    const dimL = Math.max(0, Math.floor((sw - dimW) / 2));
    tRows.push(segRow(padSegs([
      { text: rep(' ', dimL), color: WHITE },
      { text: curStr, color: LIGHT },
      { text: '   current', color: DIM },
    ], sw)));
    tRows.push(segRow(padSegs([
      { text: rep(' ', dimL), color: WHITE },
      { text: reqStr, color: LIGHT },
      { text: '   minimum', color: DIM },
    ], sw)));
    tRows.push(row(rep(' ', sw), WHITE));

    const pct = Math.min(100, Math.round(Math.min(width / MIN_WIDTH, height / MIN_HEIGHT) * 100));
    const bw = Math.min(20, sw - 12);
    if (bw > 0) {
      const f = Math.round((pct / 100) * bw);
      const barL = Math.max(0, Math.floor((sw - bw - 6) / 2));
      tRows.push(segRow(padSegs([
        { text: rep(' ', barL), color: WHITE },
        { text: rep('█', f), color: LIGHT },
        { text: rep('░', bw - f), color: DARK },
        { text: `  ${String(pct).padStart(3)}%`, color: DIM },
      ], sw)));
    }

    while (tRows.length < sh) tRows.push(row(rep(' ', sw), WHITE));

    return (
      <Box flexDirection="column" width={sw} height={sh}>
        {tRows.map((r, i) => (
          <Text key={i} backgroundColor={BG}>
            {r.segments.map((seg, j) => (
              <Text key={j} color={seg.color}>{seg.text}</Text>
            ))}
          </Text>
        ))}
      </Box>
    );
  }

  // ── Route to active page ──
  let rows: Row[];
  switch (view) {
    case 'dashboard': rows = dashboardResult.rows; break;
    case 'tasks':     rows = tasksRows;             break;
    case 'sprint':    rows = sprintRows;            break;
    case 'git':       rows = gitRows;               break;
  }

  return (
    <Box flexDirection="column" width={W} height={H}>
      {rows.map((r, i) => (
        <Text key={i} backgroundColor={r.bgColor || BG}>
          {r.segments.map((seg, j) => (
            <Text key={j} color={seg.color}>
              {seg.text}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
}

export default App;
