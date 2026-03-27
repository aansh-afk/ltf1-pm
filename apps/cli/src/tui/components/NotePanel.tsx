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
  content?: string;
}

export function NotePanel({
  workspace = 'LTF1',
  project = 'ICE-Web',
  lead = 'Aansh',
  content,
}: NotePanelProps) {
  return (
    <Box flexDirection="column">
      <Text color={theme.colors.muted} bold>NOTE</Text>
      <Text color={theme.colors.dim}>────</Text>
      <Text color={theme.colors.text}>{content ?? 'No description'}</Text>
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
