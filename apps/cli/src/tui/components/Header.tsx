/**
 * Header - Top bar with workspace breadcrumb and connection status
 *
 *  LTF1  >  Workspace Name  >  Project Name              * Connected
 */

import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import type { ConnectionStatus } from '../types.js';

const CONNECTION_DOT: Record<ConnectionStatus, { dot: string; color: string; label: string }> = {
  connected:    { dot: '\u25CF', color: theme.green,  label: 'Connected' },
  connecting:   { dot: '\u25CF', color: theme.amber,  label: 'Connecting' },
  disconnected: { dot: '\u25CF', color: theme.red,    label: 'Disconnected' },
  error:        { dot: '\u25CF', color: theme.red,    label: 'Error' },
};

interface HeaderProps {
  workspace?: string;
  project?: string;
  connectionStatus?: ConnectionStatus;
}

export function Header({
  workspace,
  project,
  connectionStatus = 'connected',
}: HeaderProps) {
  const conn = CONNECTION_DOT[connectionStatus];

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="single"
      borderBottom
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor={theme.borderSubtle}
    >
      {/* Left: breadcrumb */}
      <Box>
        <Text color={theme.accent} bold> LTF1 </Text>
        {workspace && (
          <>
            <Text color={theme.textDim}> {'\u203A'}  </Text>
            <Text color={theme.textSecondary}>{workspace}</Text>
          </>
        )}
        {project && (
          <>
            <Text color={theme.textDim}> {'\u203A'}  </Text>
            <Text color={theme.text}>{project}</Text>
          </>
        )}
      </Box>

      {/* Right: connection status */}
      <Box>
        <Text color={conn.color}>{conn.dot}</Text>
        <Text color={theme.textMuted}> {conn.label}</Text>
      </Box>
    </Box>
  );
}
