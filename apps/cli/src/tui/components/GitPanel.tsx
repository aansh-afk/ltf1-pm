/**
 * Git Panel Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

interface GitPanelProps {
  branch?: string;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
  lastCommit?: string;
  width: number;
}

function pad(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + ' '.repeat(len - str.length);
}

export function GitPanel({
  branch = 'feature/cli-dashboard',
  additions = 142,
  deletions = 38,
  filesChanged = 12,
  lastCommit = '2 hours ago',
  width,
}: GitPanelProps) {
  const w = Math.min(width, 32);
  const inner = w - 2;

  const branchRow = pad(`BRANCH  ${branch}`, inner);
  const changesRow = pad(`CHANGES +${additions} -${deletions}`, inner);
  const filesRow = pad(`FILES   ${filesChanged} modified`, inner);
  const commitRow = pad(`COMMIT  ${lastCommit}`, inner);

  return (
    <Box flexDirection="column">
      <Text color={theme.colors.border}>{'┌─ GIT ' + '─'.repeat(inner - 6) + '┐'}</Text>
      <Text color={theme.colors.border}>│<Text color={theme.colors.text}>{branchRow}</Text>│</Text>
      <Text color={theme.colors.border}>│<Text color={theme.colors.text}>{changesRow}</Text>│</Text>
      <Text color={theme.colors.border}>│<Text color={theme.colors.text}>{filesRow}</Text>│</Text>
      <Text color={theme.colors.border}>│<Text color={theme.colors.dim}>{commitRow}</Text>│</Text>
      <Text color={theme.colors.border}>{'└' + '─'.repeat(inner) + '┘'}</Text>
    </Box>
  );
}
