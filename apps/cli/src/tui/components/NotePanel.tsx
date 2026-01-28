/**
 * Note Panel Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

interface NotePanelProps {
  workspace?: string;
  project?: string;
  lead?: string;
}

export function NotePanel({
  workspace = 'Iceberg',
  project = 'ICE-Web',
  lead = 'Aansh',
}: NotePanelProps) {
  return (
    <Box flexDirection="column">
      <Text color={theme.colors.muted} bold>
        NOTE
      </Text>
      <Text color={theme.colors.dim}>────</Text>
      <Text color={theme.colors.text}>
        A sleek futuristic HUD
      </Text>
      <Text color={theme.colors.text}>
        themed project dashboard.
      </Text>

      <Box marginTop={1}>
        <Text color={theme.colors.muted}>Workspace: </Text>
        <Text color={theme.colors.text}>{workspace}</Text>
      </Box>
      <Box>
        <Text color={theme.colors.muted}>Project: </Text>
        <Text color={theme.colors.text}>{project}</Text>
      </Box>
      <Box>
        <Text color={theme.colors.muted}>Lead: </Text>
        <Text color={theme.colors.text}>{lead}</Text>
      </Box>
    </Box>
  );
}
