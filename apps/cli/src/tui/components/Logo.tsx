/**
 * LTF1 ASCII Logo Component - Original block style
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

export function Logo() {
  return (
    <Box flexDirection="column">
      <Text color={theme.colors.text}>██       ████████  ████████    ██</Text>
      <Text color={theme.colors.text}>██          ██     ██        ████</Text>
      <Text color={theme.colors.text}>██          ██     ██████      ██</Text>
      <Text color={theme.colors.text}>██          ██     ██          ██</Text>
      <Text color={theme.colors.text}>████████    ██     ██        ████</Text>
      <Text color={theme.colors.dim}>──────────────────────────────────</Text>
      <Text color={theme.colors.muted}>v0.1.0</Text>
    </Box>
  );
}
