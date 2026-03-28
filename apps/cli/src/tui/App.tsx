/**
 * LTF1 TUI Dashboard - Full Screen Application (V2)
 * Ink-native component tree with Header, Sidebar, StatusBar layout.
 * Preserves all auth flow, keyboard handling, workspace/project selection.
 * Legacy Row[]-based pages are rendered inline until rewritten.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';

import type { Page, Row, ConnectionStatus } from './types.js';
import { MIN_WIDTH, MIN_HEIGHT } from './types.js';
import { theme, BG } from './theme.js';
import { rep } from './helpers.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { StatusBar } from './components/StatusBar.js';
import { Panel } from './components/Panel.js';
import { ProgressBar } from './components/ProgressBar.js';
import { useAuth } from './hooks/useAuth.js';
import { useConfig } from './hooks/useConfig.js';
import { useDashboardPage } from './pages/Dashboard.js';
import type { LoginState } from './pages/Dashboard.js';
import TasksPage from './pages/Tasks.js';
import SprintPage from './pages/Sprint.js';
import { useGitPage } from './pages/Git.js';
import { useSearchPage } from './pages/Search.js';
import { useNotificationsPage } from './pages/Notifications.js';
import { useHelpPage } from './pages/Help.js';
import { useTimeTracking } from './hooks/useTimeTracking.js';
import { useNotifications } from './hooks/useNotifications.js';
import { login, refreshToken } from '../lib/auth.js';
import { setContext, clearContext } from '../lib/config.js';

interface AppProps {
  initialView?: Page;
}

/** Render legacy Row[] content inside the new layout */
function LegacyRows({ rows }: { rows: Row[] }) {
  return (
    <Box flexDirection="column" flexGrow={1}>
      {rows.map((r, i) => (
        <Text key={i} backgroundColor={r.bgColor || BG}>
          {r.segments.map((seg, j) => (
            <Text key={j} color={seg.color}>{seg.text}</Text>
          ))}
        </Text>
      ))}
    </Box>
  );
}

/** Stub page for pages not yet rewritten */
function StubPage({ name }: { name: string }) {
  return (
    <Panel title={name.toUpperCase()} borderColor={theme.border} flexGrow={1}>
      <Box paddingY={1}>
        <Text color={theme.textMuted}>This page is being redesigned. Coming soon.</Text>
      </Box>
    </Panel>
  );
}

/** Login screen shown when unauthenticated */
function LoginScreen({
  loginState,
  loginError,
  width,
  height,
}: {
  loginState: LoginState;
  loginError: string;
  width: number;
  height: number;
}) {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" width={width} height={height}>
      <Text color={theme.accent} bold>
        {' '}
        {'L T F 1'}
        {' '}
      </Text>
      <Text color={theme.textDim}>{rep('\u2500', 34)}</Text>
      <Box height={1} />
      {loginState === 'authenticating' ? (
        <Text color={theme.textSecondary}>Opening browser for authentication...</Text>
      ) : loginState === 'error' ? (
        <>
          <Text color={theme.red}>Authentication failed: {loginError}</Text>
          <Box height={1} />
          <Text color={theme.textMuted}>Press <Text color={theme.text} bold>Enter</Text> to retry</Text>
        </>
      ) : loginState === 'success' ? (
        <Text color={theme.green}>Authenticated successfully</Text>
      ) : (
        <>
          <Text color={theme.textSecondary}>Welcome to LTF1 Project Management</Text>
          <Box height={1} />
          <Text color={theme.textMuted}>Press <Text color={theme.text} bold>Enter</Text> to sign in</Text>
        </>
      )}
      <Box height={2} />
      <Text color={theme.textDim}>Q to quit</Text>
    </Box>
  );
}

/** Resize prompt when terminal is too small */
function ResizePrompt({ width, height }: { width: number; height: number }) {
  const pct = Math.min(100, Math.round(Math.min(width / MIN_WIDTH, height / MIN_HEIGHT) * 100));
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" width={width} height={height}>
      <Text color={theme.text} bold>L T F 1</Text>
      <Box height={1} />
      <Text color={theme.textDim}>{rep('\u2500', 34)}</Text>
      <Box height={1} />
      <Text color={theme.textMuted}>Resize to continue</Text>
      <Box height={1} />
      <Text color={theme.textSecondary}>{`${String(width).padStart(3)} \u00D7 ${String(height).padStart(2)}`}<Text color={theme.textDim}>  current</Text></Text>
      <Text color={theme.textSecondary}>{`${String(MIN_WIDTH).padStart(3)} \u00D7 ${String(MIN_HEIGHT).padStart(2)}`}<Text color={theme.textDim}>  minimum</Text></Text>
      <Box height={1} />
      <ProgressBar value={pct} max={100} width={20} />
    </Box>
  );
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

  // Press feedback state
  const [pressed, setPressed] = useState(false);
  const [pressedAction, setPressedAction] = useState('');
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPress = useCallback((action: string) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    setPressed(true);
    setPressedAction(action);
    pressTimerRef.current = setTimeout(() => {
      setPressed(false);
      setPressedAction('');
      pressTimerRef.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    return () => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); };
  }, []);

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
        setTimeout(() => auth.refresh(), 500);
      })
      .catch((err: Error) => {
        setLoginState('error');
        setLoginError(err.message || 'Authentication failed');
      });
  }, [loginState, auth]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!auth.needsRefresh || loginState === 'authenticating') return;

    if (auth.sessionId) {
      setLoginState('authenticating');
      refreshToken()
        .then((ok) => {
          if (ok) {
            setLoginState('idle');
            auth.refresh();
          } else {
            startLogin();
          }
        })
        .catch(() => startLogin());
    } else {
      startLogin();
    }
  }, [auth.needsRefresh, auth.sessionId, loginState, startLogin, auth]);

  const tooSmall = width < MIN_WIDTH || height < MIN_HEIGHT;
  const W = Math.max(width, MIN_WIDTH);
  const H = Math.max(height, MIN_HEIGHT);
  const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });

  // Call all page hooks unconditionally (React rules of hooks)
  const dashboardResult = useDashboardPage({
    width: W, height: H, timeStr, selectedIndex, selectorIndex,
    loginState, loginError, pressed, pressedAction,
  });
  // Tasks and Sprint are now native Ink components (no longer Row[]-based hooks)
  const gitRows = useGitPage({ width: W, height: H, timeStr, isActive: view === 'git' });
  const searchRows = useSearchPage({ width: W, height: H, isActive: view === 'search' });
  const notificationsRows = useNotificationsPage({ width: W, height: H, isActive: view === 'notifications' });
  const helpRows = useHelpPage({ width: W, height: H, isActive: view === 'help' });
  const { activeTimer: _activeTimer, elapsed: _elapsed } = useTimeTracking();
  const { unreadCount } = useNotifications();

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

  // Navigation handler for sidebar
  const handleNavigate = useCallback((page: Page) => {
    setView(page);
  }, []);

  // Determine connection status
  const connectionStatus: ConnectionStatus = auth.isAuthenticated ? 'connected' : 'disconnected';

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
      // Workspace selector mode
      if (dashboardMode === 'workspace_selector') {
        if (key.upArrow) setSelectorIndex(i => Math.max(0, i - 1));
        if (key.downArrow) setSelectorIndex(i => Math.min(Math.max(0, selectorItemCount - 1), i + 1));
        if (key.return && selectorItemCount > 0) { triggerPress('Select'); handleWorkspaceSelect(); }
        return;
      }

      // Project selector mode
      if (dashboardMode === 'project_selector') {
        if (key.upArrow) setSelectorIndex(i => Math.max(0, i - 1));
        if (key.downArrow) setSelectorIndex(i => Math.min(Math.max(0, selectorItemCount - 1), i + 1));
        if (key.return && selectorItemCount > 0) { triggerPress('Select'); handleProjectSelect(); }
        if (input === 'b') { triggerPress('Back'); handleBackToWorkspaceSelector(); }
        return;
      }

      // Normal dashboard mode
      if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
      if (key.downArrow) setSelectedIndex(i => Math.min(3, i + 1));
      if (key.return) {
        const views: Page[] = ['tasks', 'sprint', 'git', 'dashboard'];
        const labels = ['Tasks', 'Sprint', 'Git', 'Quit'];
        triggerPress(labels[selectedIndex]);
        if (selectedIndex < 3) setView(views[selectedIndex]);
        else exit();
      }
      if (input === 't' || input === '1') { triggerPress('Tasks'); setView('tasks'); }
      if (input === 's' || input === '2') { triggerPress('Sprint'); setView('sprint'); }
      if (input === 'g' || input === '3') { triggerPress('Git'); setView('git'); }
      if (input === '/' || input === '5') { triggerPress('Search'); setView('search'); }
      if (input === 'n' || input === '6') { triggerPress('Notifications'); setView('notifications'); }
      if (input === '?') { triggerPress('Help'); setView('help'); }
      if (input === '7') { triggerPress('Help'); setView('help'); }
      if (input === 'w') { triggerPress('Workspace'); handleBackToWorkspaceSelector(); }
      if (input === 'p') { triggerPress('Project'); handleSwitchToProjectSelector(); }
    } else {
      if (key.escape || input === 'b') setView('dashboard');
      if (input === 't') setView('tasks');
      if (input === 's') setView('sprint');
      if (input === 'g') setView('git');
      if (input === 'd') setView('dashboard');
      if (input === '?') setView('help');
      if (input === 'n') setView('notifications');
    }
  });

  // Resize prompt
  if (tooSmall) {
    return <ResizePrompt width={Math.max(width, 1)} height={Math.max(height, 1)} />;
  }

  // Unauthenticated: show login screen (no sidebar/header)
  if (!auth.isAuthenticated) {
    return <LoginScreen loginState={loginState} loginError={loginError} width={W} height={H} />;
  }

  // Render page content
  function renderPage() {
    switch (view) {
      // Rewritten Ink-native pages
      case 'dashboard':     return dashboardResult.element;
      case 'tasks':         return <TasksPage width={W} height={H} timeStr={timeStr} isActive={view === 'tasks'} />;
      case 'sprint':        return <SprintPage width={W} height={H} timeStr={timeStr} isActive={view === 'sprint'} />;
      case 'git':           return <LegacyRows rows={gitRows} />;
      case 'search':        return <LegacyRows rows={searchRows} />;
      case 'notifications': return <LegacyRows rows={notificationsRows} />;
      case 'help':          return <LegacyRows rows={helpRows} />;

      // New stub pages (teammates will fill these in)
      case 'agent':    return <StubPage name="Agent" />;
      case 'skills':   return <StubPage name="Skills" />;
      case 'projects': return <StubPage name="Projects" />;
      case 'settings': return <StubPage name="Settings" />;

      default:         return <StubPage name={view} />;
    }
  }

  return (
    <Box flexDirection="column" width={W} height={H}>
      <Header
        workspace={config.workspaceName}
        project={config.projectName}
        connectionStatus={connectionStatus}
      />
      <Box flexDirection="row" flexGrow={1}>
        <Sidebar
          activePage={view}
          onNavigate={handleNavigate}
          pendingTriage={unreadCount}
        />
        <Box flexDirection="column" flexGrow={1} paddingX={1}>
          {renderPage()}
        </Box>
      </Box>
      <StatusBar
        page={view}
        version="v0.1.0-beta.3"
        connectionStatus={connectionStatus}
      />
    </Box>
  );
}

export default App;
