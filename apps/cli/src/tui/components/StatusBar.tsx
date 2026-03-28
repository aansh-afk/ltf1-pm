/**
 * StatusBar - Bottom bar with context-aware keybindings
 * Left: page-specific shortcuts
 * Right: connection status + version
 */

import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import type { Page, ConnectionStatus } from '../types.js';

const CONNECTION_DOT: Record<ConnectionStatus, string> = {
  connected: theme.green,
  connecting: theme.amber,
  disconnected: theme.red,
  error: theme.red,
};

const PAGE_SHORTCUTS: Record<string, Array<{ key: string; label: string }>> = {
  dashboard: [
    { key: 'T', label: 'Tasks' },
    { key: 'S', label: 'Sprint' },
    { key: 'G', label: 'Git' },
    { key: 'W', label: 'Workspace' },
    { key: 'P', label: 'Project' },
  ],
  tasks: [
    { key: 'c', label: 'Create' },
    { key: 'e', label: 'Edit' },
    { key: 'd', label: 'Delete' },
    { key: '/', label: 'Filter' },
  ],
  sprint: [
    { key: 'n', label: 'New Sprint' },
    { key: 'a', label: 'Add Task' },
  ],
  git: [
    { key: 'f', label: 'Fetch' },
    { key: 'p', label: 'Pull' },
    { key: 'c', label: 'Commit' },
  ],
  search: [
    { key: '/', label: 'Search' },
    { key: 'Tab', label: 'Filter' },
  ],
  notifications: [
    { key: 'r', label: 'Read' },
    { key: 'a', label: 'Read All' },
  ],
  help: [],
  agent: [],
  skills: [],
  projects: [],
  settings: [],
};

// All pages get these common shortcuts
const COMMON_SHORTCUTS = [
  { key: 'ESC', label: 'Back' },
  { key: 'Q', label: 'Quit' },
];

interface StatusBarProps {
  page: Page;
  version?: string;
  connectionStatus?: ConnectionStatus;
}

export function StatusBar({
  page,
  version = 'v0.1.0',
  connectionStatus = 'connected',
}: StatusBarProps) {
  const pageShortcuts = PAGE_SHORTCUTS[page] || [];
  const shortcuts = [...pageShortcuts, ...COMMON_SHORTCUTS];
  const dotColor = CONNECTION_DOT[connectionStatus];

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      borderColor={theme.borderSubtle}
    >
      {/* Left: shortcuts */}
      <Box>
        {shortcuts.map((s, i) => (
          <Box key={s.key} marginRight={1}>
            <Text color={theme.text} bold>{s.key}</Text>
            <Text color={theme.textMuted}> {s.label}</Text>
            {i < shortcuts.length - 1 && <Text color={theme.textDim}>  </Text>}
          </Box>
        ))}
      </Box>

      {/* Right: connection + version */}
      <Box>
        <Text color={dotColor}>{'\u25CF'}</Text>
        <Text color={theme.textMuted}> {connectionStatus}  </Text>
        <Text color={theme.textDim}>{version}</Text>
      </Box>
    </Box>
  );
}
