/**
 * Sprint Panel Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';
import { BorderBox } from './BorderBox.js';

interface SprintPanelProps {
  name?: string;
  daysLeft?: number;
  progress?: number;
  tasksTotal?: number;
  tasksDone?: number;
  tasksInProgress?: number;
  tasksTodo?: number;
}

export function SprintPanel({
  name = 'Sprint 12',
  daysLeft = 4,
  progress = 0.67,
  tasksTotal = 21,
  tasksDone = 14,
  tasksInProgress = 4,
  tasksTodo = 3,
}: SprintPanelProps) {
  const progressWidth = 30;
  const filledWidth = Math.floor(progress * progressWidth);

  return (
    <BorderBox title="SPRINT" width={50}>
      <Box flexDirection="column" paddingX={1}>
        <Box justifyContent="space-between">
          <Text color={theme.colors.text}>{name}</Text>
          <Text color={theme.colors.muted}>{daysLeft} days left</Text>
        </Box>

        <Box marginTop={1}>
          <Text color={theme.colors.primary}>
            {theme.progress.filled.repeat(filledWidth)}
          </Text>
          <Text color={theme.colors.dim}>
            {theme.progress.empty.repeat(progressWidth - filledWidth)}
          </Text>
          <Text color={theme.colors.muted}> {Math.round(progress * 100)}%</Text>
        </Box>

        <Box marginTop={1}>
          <Text color={theme.colors.success}>{tasksDone}/{tasksTotal} done</Text>
          <Text color={theme.colors.muted}> · </Text>
          <Text color={theme.colors.warning}>{tasksInProgress} in progress</Text>
          <Text color={theme.colors.muted}> · </Text>
          <Text color={theme.colors.muted}>{tasksTodo} todo</Text>
        </Box>
      </Box>
    </BorderBox>
  );
}
