/**
 * LTF1 ASCII Logo Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

const LOGO_LINES = [
  '██       ████████  ████████    ██  ',
  '██          ██     ██        ████  ',
  '██          ██     ██████      ██  ',
  '██          ██     ██          ██  ',
  '████████    ██     ██        ██████',
];

export function Logo() {
  return (
    <Box flexDirection="column">
      {LOGO_LINES.map((line, i) => (
        <Text key={i} color={theme.colors.primary}>
          {line}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text color={theme.colors.muted}>LTF1</Text>
      </Box>
      <Text color={theme.colors.dim}>────</Text>
      <Text color={theme.colors.muted}>v0.1.0</Text>
    </Box>
  );
}
