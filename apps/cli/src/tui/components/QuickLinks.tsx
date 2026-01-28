/**
 * Quick Links Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

interface QuickLinksProps {
  section: 'PRI' | 'SEC';
}

const PRIMARY_LINKS = [
  'TASKS',
  'SPRINT',
  'PROJECTS',
  'GIT',
  'AI',
  'SETTINGS',
];

const SECONDARY_LINKS = [
  ['Convex', 'Clerk', 'GitHub'],
  ['Vercel', 'Stripe', 'Discord'],
  ['Notion', 'Figma', 'Slack'],
];

export function QuickLinks({ section }: QuickLinksProps) {
  if (section === 'PRI') {
    return (
      <Box flexDirection="column">
        <Text color={theme.colors.muted} bold>
          PRI
        </Text>
        <Text color={theme.colors.dim}>───</Text>
        <Box flexWrap="wrap">
          {PRIMARY_LINKS.map((link, i) => (
            <Box key={link} marginRight={2}>
              <Text color={theme.colors.text}>{link}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color={theme.colors.muted} bold>
        SEC
      </Text>
      <Text color={theme.colors.dim}>───</Text>
      {SECONDARY_LINKS.map((row, i) => (
        <Box key={i}>
          {row.map((link) => (
            <Box key={link} width={12}>
              <Text color={theme.colors.dim}>{link}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
