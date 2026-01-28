/**
 * Git Panel Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';
import { BorderBox } from './BorderBox.js';

interface GitPanelProps {
  branch?: string;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
  lastCommit?: string;
}

export function GitPanel({
  branch = 'feature/cli-dashboard',
  additions = 142,
  deletions = 38,
  filesChanged = 12,
  lastCommit = '2 hours ago',
}: GitPanelProps) {
  return (
    <BorderBox title="GIT" width={40}>
      <Box flexDirection="column" paddingX={1}>
        <Box>
          <Text color={theme.colors.muted}>BRANCH   </Text>
          <Text color={theme.colors.text}>{branch}</Text>
        </Box>
        <Box>
          <Text color={theme.colors.muted}>CHANGES  </Text>
          <Text color={theme.colors.success}>+{additions}</Text>
          <Text color={theme.colors.muted}> </Text>
          <Text color={theme.colors.error}>-{deletions}</Text>
        </Box>
        <Box>
          <Text color={theme.colors.muted}>FILES    </Text>
          <Text color={theme.colors.text}>{filesChanged} modified</Text>
        </Box>
        <Box>
          <Text color={theme.colors.muted}>COMMIT   </Text>
          <Text color={theme.colors.dim}>{lastCommit}</Text>
        </Box>
      </Box>
    </BorderBox>
  );
}
