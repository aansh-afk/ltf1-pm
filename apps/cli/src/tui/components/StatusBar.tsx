/**
 * Status Bar Component
 */

import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { theme } from '../styles/theme.js';

interface StatusBarProps {
  path?: string;
  email?: string;
  version?: string;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
}

const CONNECTION_INDICATORS: Record<string, { dot: string; color: string }> = {
  connected: { dot: '●', color: '#22C55E' },
  connecting: { dot: '●', color: '#F59E0B' },
  disconnected: { dot: '●', color: '#EF4444' },
  error: { dot: '●', color: '#EF4444' },
};

export function StatusBar({
  path = '~/iceberg-l:feature/cli-dashboard',
  email = 'user@example.com',
  version = 'v0.1.0',
  connectionStatus,
}: StatusBarProps) {
  const { stdout } = useStdout();
  const width = stdout?.columns || 100;

  const indicator = connectionStatus
    ? CONNECTION_INDICATORS[connectionStatus]
    : null;

  return (
    <Box marginTop={1} flexDirection="column">
      <Text color={theme.colors.dim}>
        {'─'.repeat(width - 4)}
      </Text>
      <Box justifyContent="space-between">
        <Text color={theme.colors.muted}>{path}</Text>
        <Text color={theme.colors.dim}>{email}</Text>
        <Box>
          {indicator && (
            <Text color={indicator.color}>{indicator.dot} {connectionStatus} </Text>
          )}
          <Text color={theme.colors.muted}>{version}</Text>
        </Box>
      </Box>
    </Box>
  );
}
