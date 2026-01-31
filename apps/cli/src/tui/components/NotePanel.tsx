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
      <Text color={theme.colors.muted} bold>NOTE</Text>
      <Text color={theme.colors.dim}>────</Text>
      <Text color={theme.colors.text}>A sleek futuristic</Text>
      <Text color={theme.colors.text}>HUD themed project</Text>
      <Text color={theme.colors.text}>dashboard.</Text>
      <Text> </Text>
      <Text>
        <Text color={theme.colors.muted}>Workspace: </Text>
        <Text color={theme.colors.text}>{workspace}</Text>
      </Text>
      <Text>
        <Text color={theme.colors.muted}>Project:   </Text>
        <Text color={theme.colors.text}>{project}</Text>
      </Text>
      <Text>
        <Text color={theme.colors.muted}>Lead:      </Text>
        <Text color={theme.colors.text}>{lead}</Text>
      </Text>
    </Box>
  );
}
