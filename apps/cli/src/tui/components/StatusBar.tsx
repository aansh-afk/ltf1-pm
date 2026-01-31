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
}

export function StatusBar({
  path = '~/iceberg-l:feature/cli-dashboard',
  email = 'aanshnaidu9@gmail.com',
  version = 'v0.1.0',
}: StatusBarProps) {
  const { stdout } = useStdout();
  const width = stdout?.columns || 100;

  // Calculate spacing
  const leftContent = path;
  const rightContent = version;
  const middleContent = email;
  const totalContentLength =
    leftContent.length + middleContent.length + rightContent.length;
  const availableSpace = width - totalContentLength - 10;

  return (
    <Box marginTop={1} flexDirection="column">
      <Text color={theme.colors.dim}>
        {'─'.repeat(width - 4)}
      </Text>
      <Box justifyContent="space-between">
        <Text color={theme.colors.muted}>{leftContent}</Text>
        <Text color={theme.colors.dim}>{middleContent}</Text>
        <Text color={theme.colors.muted}>{rightContent}</Text>
      </Box>
    </Box>
  );
}
